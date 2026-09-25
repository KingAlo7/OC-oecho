"""
redraw_schemes.py — give every structure in a quiz synthesis scheme fixed
2D coordinates (node.mol), so that

  * the drawing follows the exam sheet's orientation (one anchor compound
    per scheme is oriented explicitly, see LAYOUT below), and
  * atoms that do not change from one compound to the next keep EXACTLY
    the same position: every node is laid out with the atoms it shares
    with an already placed neighbour (maximum common substructure) pinned
    to that neighbour's coordinates. Kekulé double bonds are chosen to
    agree with the neighbour as well, so a benzene ring does not "flip".

Usage:
    python tools/redraw_schemes.py                # all quizzes
    python tools/redraw_schemes.py <quiz-id> ...  # only these
    python tools/redraw_schemes.py --png DIR <quiz-id>   # also write previews

Layout spec: tools/scheme-layout.json
    {
      "<quiz-id>": {
        "<section index>": {
          "anchor": "<node id>",               # oriented first (default: largest node)
          "nodes": {
            "<node id>": {
              "orient": {                       # rotate/mirror a fresh depiction
                "smarts": "...",                #   pattern matched in the node
                "from": 0, "to": 1,             #   pattern atoms defining a vector
                "angle": 0,                     #   direction of that vector in deg (0 = right, 90 = up)
                "side": [2, "up"]               #   optional: pattern atom that must lie above/below it
              },
              "align": "<node id>",             # use this neighbour as reference
              "free": true,                     # never pin atoms (own depiction + orient)
              "rigid": true,                    # own depiction, rigidly superposed on the neighbour
              "coords": {"smarts": "...", "xy": [[x,y],...]}   # hand template for a core
              "abbrev": [{"smarts": "*-OC(=O)[CH3]", "first": 1, "label": "OAc"}],
              "ring_only": false,              # chain may map onto a ring (pre-folded precursor)
              "fusion_h": false,               # no explicit H at ring-fusion stereocentres
              "release": "SMARTS",             # these atoms are laid out anew, not pinned
              "pin_all": true,                 # keep every common atom pinned (no re-fanning)
              "wedge": ["SMARTS"],             # wedge the bond between the first two atoms
              "coords": {..., "full": true},   # match the coords SMARTS on the uncollapsed molecule
              "bond_stereo": [{"smarts": "...", "atoms": [i, j], "stereo": 1 | 6}],
                                               # write these flags as given (allene axes)
              "explicit_h": "SMARTS",          # draw the H on the first atom of each match
              "perspective": true              # hand-placed 3D-perspective core: no wedges
                                               # (or a SMARTS: only its atoms lose their wedges)
            }
          },
          "abbrev": [...], "ring_only": ...     # defaults for all nodes of the scheme
            }
          }
        }
      }
    }
Nodes without an explicit spec are aligned to the placed neighbour with
the largest common substructure. Structures on arrows (edge.reagent_mol) are written from
    "edges": {"<from id>><to id>": {"smiles": "...", "orient": {...}, "abbrev": [...],
                                    "below": true}}      # drawn under the arrow text
in the same section spec; other arrows are left alone.
"""
import json, math, sys, os
from collections import deque

from rdkit import Chem, RDLogger
from rdkit.Chem import rdDepictor, rdFMCS, AllChem
from rdkit.Geometry import Point2D

RDLogger.DisableLog('rdApp.*')
rdDepictor.SetPreferCoordGen(True)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QFILE = os.path.join(ROOT, 'data', 'questions.json')
LFILE = os.path.join(ROOT, 'tools', 'scheme-layout.json')
BOND = 1.5          # RDKit's standard bond length; everything is normalised to it


# ── helpers ──────────────────────────────────────────────────────────

def mol_from(smiles):
    """Explicit [H] in the SMILES are kept (drawn), e.g. at ring fusions."""
    ps = Chem.SmilesParserParams()
    ps.removeHs = False
    m = Chem.MolFromSmiles(smiles, ps)
    if m is None:
        raise ValueError('bad SMILES: ' + smiles)
    return m


def fusion_h(m):
    """Draw the H on stereocentres at ring fusions (all heavy neighbours in
    rings, atom in two rings), the way steroid-type skeletons are drawn."""
    ri = m.GetRingInfo()
    Chem.AssignStereochemistry(m, cleanIt=True, force=True)
    idx = [a.GetIdx() for a in m.GetAtoms()
           if a.GetChiralTag() != Chem.ChiralType.CHI_UNSPECIFIED and a.GetTotalNumHs() == 1
           and ri.NumAtomRings(a.GetIdx()) >= 2
           and all(nb.IsInRing() for nb in a.GetNeighbors() if nb.GetAtomicNum() > 1)]
    if not idx:
        return m
    return Chem.AddHs(m, onlyOnAtoms=idx)


def xy(m):
    c = m.GetConformer()
    return [(c.GetAtomPosition(i).x, c.GetAtomPosition(i).y) for i in range(m.GetNumAtoms())]


def set_xy(m, pts):
    c = m.GetConformer()
    for i, (x, y) in enumerate(pts):
        c.SetAtomPosition(i, (x, y, 0.0))


def normalise(m):
    """Scale so the mean bond length is BOND and centre on the origin."""
    pts = xy(m)
    ls = [math.dist(pts[b.GetBeginAtomIdx()], pts[b.GetEndAtomIdx()]) for b in m.GetBonds()]
    k = BOND / (sum(ls) / len(ls)) if ls else 1.0
    cx = sum(p[0] for p in pts) / len(pts)
    cy = sum(p[1] for p in pts) / len(pts)
    set_xy(m, [((x - cx) * k, (y - cy) * k) for x, y in pts])


def transform(m, rot_deg=0.0, mirror=False):
    a = math.radians(rot_deg)
    ca, sa = math.cos(a), math.sin(a)
    out = []
    for x, y in xy(m):
        if mirror:
            y = -y
        out.append((x * ca - y * sa, x * sa + y * ca))
    set_xy(m, out)


def depict(m, coord_map=None):
    if coord_map:
        rdDepictor.Compute2DCoords(m, coordMap={i: Point2D(*p) for i, p in coord_map.items()})
    else:
        rdDepictor.Compute2DCoords(m)


def apply_orient(m, o):
    patt = Chem.MolFromSmarts(o['smarts'])
    hit = m.GetSubstructMatch(patt)
    if not hit:
        print('   ! orient pattern not found:', o['smarts'])
        return
    pts = xy(m)
    a, b = pts[hit[o.get('from', 0)]], pts[hit[o.get('to', 1)]]
    cur = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
    transform(m, o.get('angle', 0) - cur)
    if 'side' in o:
        idx, want = o['side']
        pts = xy(m)
        a, b, s = pts[hit[o.get('from', 0)]], pts[hit[o.get('to', 1)]], pts[hit[idx]]
        cross = (b[0] - a[0]) * (s[1] - a[1]) - (b[1] - a[1]) * (s[0] - a[0])
        if (cross > 0) != (want == 'up'):
            # mirror across the reference vector
            ang = math.radians(o.get('angle', 0))
            transform(m, -math.degrees(ang))
            transform(m, 0, mirror=True)
            transform(m, math.degrees(ang))
    normalise_translate(m)


def normalise_translate(m):
    pts = xy(m)
    cx = sum(p[0] for p in pts) / len(pts)
    cy = sum(p[1] for p in pts) / len(pts)
    set_xy(m, [(x - cx, y - cy) for x, y in pts])


def released(ref, m, amap):
    """Atoms of m that should NOT be pinned although they are in the MCS:
    terminal substituents (and short chains) on an atom whose number of
    heavy neighbours changed — they have to fan out anew around it."""
    out = set()
    for i, j in amap.items():
        if ref.GetAtomWithIdx(i).GetDegree() == m.GetAtomWithIdx(j).GetDegree():
            continue
        a = m.GetAtomWithIdx(j)
        if a.IsInRing() and not a.GetIsAromatic() and a.GetDegree() < 4 and ref.GetAtomWithIdx(i).GetDegree() < 4:
            pass
        for nb in a.GetNeighbors():
            k = nb.GetIdx()
            if nb.IsInRing():
                continue
            # the whole acyclic branch hanging off j through nb, if small
            branch, stack = {k}, [k]
            while stack:
                x = stack.pop()
                for y in m.GetAtomWithIdx(x).GetNeighbors():
                    yi = y.GetIdx()
                    if yi != j and yi not in branch:
                        branch.add(yi); stack.append(yi)
            if len(branch) <= 4 and not any(m.GetAtomWithIdx(b).IsInRing() for b in branch):
                out |= branch
    return out


def superpose(m, cm):
    """Rigidly move m (rotation, translation, reflection if needed) so the
    atoms in cm land on their target points. Returns the RMS deviation."""
    ks = list(cm)
    pts = xy(m)
    P = [pts[k] for k in ks]
    Q = [cm[k] for k in ks]
    pcx = sum(p[0] for p in P) / len(P); pcy = sum(p[1] for p in P) / len(P)
    qcx = sum(q[0] for q in Q) / len(Q); qcy = sum(q[1] for q in Q) / len(Q)
    best = None
    for refl in (False, True):
        P2 = [((x - pcx), -(y - pcy) if refl else (y - pcy)) for x, y in P]
        Q2 = [(x - qcx, y - qcy) for x, y in Q]
        sxx = sum(a[0] * b[0] + a[1] * b[1] for a, b in zip(P2, Q2))
        sxy = sum(a[0] * b[1] - a[1] * b[0] for a, b in zip(P2, Q2))
        th = math.atan2(sxy, sxx)
        c, s_ = math.cos(th), math.sin(th)
        rms = math.sqrt(sum((c * a[0] - s_ * a[1] - b[0]) ** 2 + (s_ * a[0] + c * a[1] - b[1]) ** 2
                            for a, b in zip(P2, Q2)) / len(P2))
        if best is None or rms < best[0]:
            best = (rms, refl, c, s_)
    rms, refl, c, s_ = best
    out = []
    for x, y in pts:
        x, y = x - pcx, y - pcy
        if refl:
            y = -y
        out.append((c * x - s_ * y + qcx, s_ * x + c * y + qcy))
    set_xy(m, out)
    return rms


def pinned_depiction(m, cm):
    """Lay out m with the atoms in cm held at the given points. CoordGen
    first; if it bends the pinned part, RDKit's own depictor. Pinned atoms
    are finally snapped exactly onto their targets."""
    best = None
    for coordgen in (True, False):
        mm = Chem.Mol(m)
        rdDepictor.SetPreferCoordGen(coordgen)
        try:
            depict(mm, cm)
        finally:
            rdDepictor.SetPreferCoordGen(True)
        rms = superpose(mm, cm)
        if best is None or rms < best[0]:
            best = (rms, mm)
        if rms < 0.05:
            break
    rms, mm = best
    if rms > 0.3:
        print(f'   ~ pinned layout deviates (rms {rms:.2f})')
    pts = xy(mm)
    for k, p in cm.items():
        pts[k] = p
    set_xy(mm, pts)
    return mm


def _mcs(ref, m, timeout, ring_only, any_atom):
    p = rdFMCS.MCSParameters()
    p.AtomTyper = rdFMCS.AtomCompare.CompareAny if any_atom else rdFMCS.AtomCompare.CompareElements
    p.BondTyper = rdFMCS.BondCompare.CompareAny
    p.BondCompareParameters.RingMatchesRingOnly = ring_only
    p.BondCompareParameters.CompleteRingsOnly = ring_only   # a ring is pinned whole or not at all
    p.AtomCompareParameters.RingMatchesRingOnly = False
    p.Timeout = timeout
    res = rdFMCS.FindMCS([ref, m], p)
    if not res.smartsString or res.numAtoms < 2:
        return {}
    q = Chem.MolFromSmarts(res.smartsString)
    best = {}
    ra = ref.GetSubstructMatches(q, useChirality=False, uniquify=False, maxMatches=5000)
    ma_all = m.GetSubstructMatches(q, useChirality=False, uniquify=False, maxMatches=500)
    if not ma_all:
        return {}
    if len(ra) * len(ma_all) > 100000:
        ma_all = ma_all[:1]
    qb = [(b.GetBeginAtomIdx(), b.GetEndAtomIdx()) for b in q.GetBonds()]
    # prefer the pair of matches whose elements, then bond orders, then
    # degrees agree most (so e.g. the acetyl of an ester maps onto the
    # acetyl of a ketone, not its O-ethyl part)
    score_best = None
    for ma in ma_all:
        for r in ra:
            s_el = sum(ref.GetAtomWithIdx(i).GetAtomicNum() == m.GetAtomWithIdx(j).GetAtomicNum() for i, j in zip(r, ma))
            s_bd = sum(ref.GetBondBetweenAtoms(r[x], r[y]).GetBondType() == m.GetBondBetweenAtoms(ma[x], ma[y]).GetBondType()
                       for x, y in qb)
            s_dg = sum(ref.GetAtomWithIdx(i).GetDegree() == m.GetAtomWithIdx(j).GetDegree() for i, j in zip(r, ma))
            sc = (s_el, s_bd, s_dg)
            if score_best is None or sc > score_best:
                score_best, best = sc, dict(zip(r, ma))
    # an explicit H only ever stands in for another H
    return {i: j for i, j in best.items()
            if (ref.GetAtomWithIdx(i).GetAtomicNum() == 1) == (m.GetAtomWithIdx(j).GetAtomicNum() == 1)}


def keep_rings(ref, m, amap):
    """A ring of m keeps its mapping only if all of its atoms map onto one
    ring of the same size in ref; otherwise it would be bent out of shape,
    so its atoms are laid out anew. (Chain atoms of m may still map onto
    ring atoms of ref: a precursor is then drawn pre-folded.)"""
    if not amap:
        return amap
    inv = {j: i for i, j in amap.items()}
    ref_rings = [frozenset(r) for r in ref.GetRingInfo().AtomRings()]
    drop = set()
    for ring in m.GetRingInfo().AtomRings():
        mapped = [inv[a] for a in ring if a in inv]
        if not mapped:
            continue
        if len(mapped) < len(ring) or frozenset(mapped) not in ref_rings:
            drop |= set(ring)
    return {i: j for i, j in amap.items() if j not in drop}


def mcs_map(ref, m, timeout=6, ring_only=True):
    """Atom map ref_idx -> m_idx of the largest common substructure.
    Rings only match rings (unless ring_only is off), so a chain never
    folds onto a ring. Element-matched mappings are preferred; elements
    may differ (a C=O that becomes C-OH keeps its place, Cl that becomes
    OH too) only where that maps clearly more atoms."""
    strict = keep_rings(ref, m, _mcs(ref, m, timeout, ring_only, False))
    loose = keep_rings(ref, m, _mcs(ref, m, timeout, ring_only, True))

    def score(mp):   # an element mismatch costs more than the atom it adds
        bad = sum(ref.GetAtomWithIdx(i).GetAtomicNum() != m.GetAtomWithIdx(j).GetAtomicNum() for i, j in mp.items())
        return len(mp) - 3 * bad
    return strict if score(strict) >= score(loose) else loose


def prefer_same_elements(ref, m, amap):
    """Drop pinned atoms whose heavy-atom environment changed a lot? Keep simple:
    everything in the MCS stays pinned."""
    return amap


def kekulize_like(m, ref=None, amap=None):
    """Pick the Kekulé form of m whose double bonds agree best with ref."""
    mk = Chem.Mol(m)
    if not any(b.GetIsAromatic() for b in mk.GetBonds()):
        return mk
    if ref is None or not amap:
        Chem.Kekulize(mk, clearAromaticFlags=True)
        return mk
    refk = Chem.Mol(ref)
    try:
        Chem.Kekulize(refk, clearAromaticFlags=True)
    except Exception:
        pass
    inv = {v: k for k, v in amap.items()}
    arom = {b.GetIdx() for b in mk.GetBonds() if b.GetIsAromatic()}
    best, best_s = None, -1
    sup = Chem.ResonanceMolSupplier(mk, Chem.KEKULE_ALL)
    n = 0
    for cand in sup:
        n += 1
        if n > 64 or cand is None:
            break
        s = 0
        # other resonance forms (nitro, carboxylate …) are not wanted
        if any(cand.GetBondWithIdx(k).GetBondType() != mk.GetBondWithIdx(k).GetBondType()
               for k in range(mk.GetNumBonds()) if k not in arom):
            continue
        for b in cand.GetBonds():
            i, j = b.GetBeginAtomIdx(), b.GetEndAtomIdx()
            if b.GetIdx() in arom and i in inv and j in inv:
                rb = refk.GetBondBetweenAtoms(inv[i], inv[j])
                if rb is not None and rb.GetBondType() == b.GetBondType():
                    s += 1
        if s > best_s:
            best, best_s = cand, s
    if best is None:
        Chem.Kekulize(mk, clearAromaticFlags=True)
        return mk
    out = Chem.Mol(mk)
    Chem.Kekulize(out, clearAromaticFlags=True)
    for b in best.GetBonds():
        if b.GetIdx() in arom:
            out.GetBondWithIdx(b.GetIdx()).SetBondType(b.GetBondType())
    return out


def collapse(m, abbrevs):
    """Replace every abbreviated group (Ph, CO2Me, OAc …) by ONE dummy atom
    carrying the label, so the layout treats it like the single label the
    exam sheet draws. Pattern atoms from index `first` on form the group;
    the first of them stays (as the dummy) and keeps its bond. Every atom
    remembers its index in the full molecule in the property 'orig'."""
    rw = Chem.RWMol(m)
    for a in rw.GetAtoms():
        a.SetIntProp('orig', a.GetIdx())
    groups, used = [], set()
    for ab in abbrevs or []:
        patt = Chem.MolFromSmarts(ab['smarts'])
        f = ab.get('first', 0)
        for hit in m.GetSubstructMatches(patt):
            g = hit[f:]
            if used & set(g):
                continue
            # the group must hang off the rest by exactly one bond
            out = [(a, nb.GetIdx()) for a in g for nb in m.GetAtomWithIdx(a).GetNeighbors() if nb.GetIdx() not in g]
            if len(out) != 1:
                continue
            used |= set(g)
            groups.append({'atoms': list(g), 'head': out[0][0], 'outer': out[0][1], 'label': ab['label']})
    if not groups:
        return Chem.Mol(rw.GetMol()), []
    drop = []
    for g in groups:
        h = rw.GetAtomWithIdx(g['head'])
        # the head keeps its element, so it still matches the same group
        # drawn out in full in a neighbouring compound
        h.SetIsAromatic(False)
        h.SetNoImplicit(True)
        h.SetNumExplicitHs(0)
        h.SetFormalCharge(0)
        h.SetProp('atomLabel', g['label'])
        bd = rw.GetBondBetweenAtoms(g['head'], g['outer'])
        bd.SetIsAromatic(False)
        bd.SetBondType(Chem.BondType.SINGLE)
        drop += [a for a in g['atoms'] if a != g['head']]
    for a in sorted(drop, reverse=True):
        rw.RemoveAtom(a)
    mc = rw.GetMol()
    Chem.SanitizeMol(mc)
    return mc, groups


def expand(mc, full, groups, prefer=None):
    """Full molecule with mc's coordinates and Kekulé bonds; the atoms
    hidden in a group get a local layout and a superatom S-group, which
    the viewer collapses back to the label. `prefer`: SMARTS list whose
    first two atoms (stereocentre, neighbour) name the bond to wedge."""
    fm = Chem.Mol(full)
    Chem.Kekulize(fm, clearAromaticFlags=True)
    hidden = set(a for g in groups for a in g['atoms'])
    for b in mc.GetBonds():
        i, j = b.GetBeginAtom().GetIntProp('orig'), b.GetEndAtom().GetIntProp('orig')
        if i in hidden or j in hidden:
            continue
        fb = fm.GetBondBetweenAtoms(i, j)
        if fb is not None:
            fb.SetBondType(b.GetBondType())
    cpts = xy(mc)
    fixed = {a.GetIntProp('orig'): cpts[a.GetIdx()] for a in mc.GetAtoms()}
    fm.RemoveAllConformers()
    conf = Chem.Conformer(fm.GetNumAtoms())
    conf.Set3D(False)
    fm.AddConformer(conf, assignId=True)
    if len(fixed) == fm.GetNumAtoms():
        set_xy(fm, [fixed[i] for i in range(fm.GetNumAtoms())])
    else:
        rdDepictor.SetPreferCoordGen(False)
        try:
            depict(fm, fixed)
        finally:
            rdDepictor.SetPreferCoordGen(True)
        superpose(fm, fixed)
        pts = xy(fm)
        for o, p in fixed.items():
            pts[o] = p
        set_xy(fm, pts)
    # Wedges are chosen on the collapsed molecule, where "Ph" is a single
    # terminal label and therefore the natural bond to wedge (as drawn on
    # the sheet); the direction is then worked out on the full molecule.
    wc = Chem.Mol(mc)
    Chem.WedgeMolBonds(wc, wc.GetConformer())
    want = [(b.GetBeginAtom().GetIntProp('orig'), b.GetEndAtom().GetIntProp('orig'))
            for b in wc.GetBonds() if b.GetBondDir() in (Chem.BondDir.BEGINWEDGE, Chem.BondDir.BEGINDASH)]
    forced = {}
    for sm in prefer or []:
        for hit in full.GetSubstructMatches(Chem.MolFromSmarts(sm)):
            c, n = hit[0], hit[1]
            if full.GetAtomWithIdx(c).GetChiralTag() != Chem.ChiralType.CHI_UNSPECIFIED:
                forced.setdefault(c, []).append(n)
    if forced:   # (a centre may get two, e.g. a bold H and a hashed OH)
        want = [(i, j) for i, j in want if i not in forced] + [(c, n) for c, ns in forced.items() for n in ns]
    canon = lambda x: Chem.CanonSmiles(Chem.MolToSmiles(x))   # kekulé-insensitive
    ref_smi = canon(full)
    for i, j in want:
        fb = fm.GetBondBetweenAtoms(i, j)
        if fb is None or fb.GetBeginAtomIdx() == i:
            continue
        # a molfile wedge starts at the bond's first atom: re-add the bond
        # as i→j, then restore i's parity (its bond order changed)
        rw = Chem.RWMol(fm)
        bt = fb.GetBondType()
        rw.RemoveBond(j, i)
        rw.AddBond(i, j, bt)
        fm = rw.GetMol()
        fm.UpdatePropertyCache(False)
        # both ends may be stereocentres: restore whichever parities changed
        for flips in ((), (i,), (j,), (i, j)):
            trial = Chem.Mol(fm)
            for k in flips:
                a = trial.GetAtomWithIdx(k)
                if a.GetChiralTag() == Chem.ChiralType.CHI_TETRAHEDRAL_CCW:
                    a.SetChiralTag(Chem.ChiralType.CHI_TETRAHEDRAL_CW)
                elif a.GetChiralTag() == Chem.ChiralType.CHI_TETRAHEDRAL_CW:
                    a.SetChiralTag(Chem.ChiralType.CHI_TETRAHEDRAL_CCW)
            if canon(trial) == ref_smi:
                fm = trial
                break
    for b in fm.GetBonds():
        b.SetBondDir(Chem.BondDir.NONE)
    for i, j in want:
        fb = fm.GetBondBetweenAtoms(i, j)
        if fb is not None and fb.GetBeginAtomIdx() == i:
            Chem.WedgeBond(fb, i, fm.GetConformer())
    for g in groups:
        sg = Chem.CreateMolSubstanceGroup(fm, 'SUP')
        for a in g['atoms']:
            sg.AddAtomWithIdx(a)
        sg.SetProp('LABEL', g['label'])
        # no SAP line: RDKit's own reader rejects the one it writes, and the
        # viewer finds the attachment from the group's outside bond anyway
    return fm


def force_bond_stereo(mb, full, specs):
    """Write wedge flags that RDKit cannot derive itself (e.g. the axial
    chirality of an allene, drawn with a hashed and a bold bond at one
    end): each spec {"smarts", "atoms": [i, j], "stereo": 1 (bold) | 6
    (hashed)} marks the bond hit[i]-hit[j], starting at hit[i]."""
    if not specs:
        return mb
    lines = mb.split('\n')
    ci = next(k for k, l in enumerate(lines) if l.rstrip().endswith('V2000'))
    na, nb = int(lines[ci][0:3]), int(lines[ci][3:6])
    lines[ci] = lines[ci][:12] + '  1' + lines[ci][15:]     # chiral flag (see mol_block)
    for sp in specs:
        hit = full.GetSubstructMatch(Chem.MolFromSmarts(sp['smarts']))
        if not hit:
            print('   ! bond_stereo pattern not found:', sp['smarts'])
            continue
        i, j = hit[sp['atoms'][0]] + 1, hit[sp['atoms'][1]] + 1
        for k in range(ci + 1 + na, ci + 1 + na + nb):
            l = lines[k]
            a1, a2 = int(l[0:3]), int(l[3:6])
            if {a1, a2} == {i, j}:
                lines[k] = f'{i:3d}{j:3d}' + l[6:9] + f'{sp["stereo"]:3d}' + l[12:]
                break
    return '\n'.join(lines)


def bad_double_bonds(m):
    """Stereo double bonds whose drawn geometry contradicts their E/Z."""
    want = {}
    ref = Chem.Mol(m)
    Chem.AssignStereochemistry(ref, cleanIt=True, force=True)
    for b in ref.GetBonds():
        if b.GetStereo() in (Chem.BondStereo.STEREOE, Chem.BondStereo.STEREOZ):
            want[b.GetIdx()] = b.GetStereo()
    if not want:
        return []
    chk = Chem.Mol(m)
    for b in chk.GetBonds():
        if b.GetBondType() == Chem.BondType.DOUBLE:
            b.SetStereo(Chem.BondStereo.STEREONONE)
        b.SetBondDir(Chem.BondDir.NONE)
    Chem.DetectBondStereoChemistry(chk, chk.GetConformer())
    Chem.AssignStereochemistry(chk, cleanIt=True, force=True)
    return [i for i, st in want.items() if chk.GetBondWithIdx(i).GetStereo() != st]


def side_atoms(m, bidx):
    """Atoms on the smaller side of bond bidx, including the bond's atom there."""
    b = m.GetBondWithIdx(bidx)
    u, v = b.GetBeginAtomIdx(), b.GetEndAtomIdx()

    def reach(start, block):
        seen, st = {start}, [start]
        while st:
            x = st.pop()
            for y in m.GetAtomWithIdx(x).GetNeighbors():
                yi = y.GetIdx()
                if yi != block and yi not in seen:
                    seen.add(yi)
                    st.append(yi)
        return seen
    su, sv = reach(u, v), reach(v, u)
    return su if len(su) < len(sv) else sv


def check(qid, si, nid, mb, smiles):
    """The molfile must describe exactly the node's structure, stereo included."""
    back = Chem.MolFromMolBlock(mb)
    want = Chem.CanonSmiles(smiles)
    if back is not None:
        # a double bond left open in the SMILES is drawn plain (see mol_block),
        # so it reads back with the drawn E/Z: that is not a mismatch
        wm = Chem.MolFromSmiles(smiles)
        hit = back.GetSubstructMatch(wm)
        if hit:
            for b in wm.GetBonds():
                if b.GetBondType() == Chem.BondType.DOUBLE and b.GetStereo() == Chem.BondStereo.STEREONONE:
                    bb = back.GetBondBetweenAtoms(hit[b.GetBeginAtomIdx()], hit[b.GetEndAtomIdx()])
                    if bb is not None:
                        bb.SetStereo(Chem.BondStereo.STEREONONE)
    # (re-canonicalised from the string: wedge flags on non-stereo atoms,
    # e.g. an allene end, can leave state that shifts the atom ranking)
    got = Chem.CanonSmiles(Chem.MolToSmiles(back)) if back is not None else None
    if got != want:
        print(f'   !! {qid}/{si}/{nid}: molfile gives {got}, SMILES is {want}')
        PROBLEMS.append((qid, si, nid))


PROBLEMS = []


def mol_block(m):
    # chiral flag: the drawn configuration is meant as drawn — without it
    # OpenChemLib treats a lone stereocentre as racemic and drops its wedge
    m = Chem.Mol(m)
    if any(a.GetChiralTag() != Chem.ChiralType.CHI_UNSPECIFIED for a in m.GetAtoms()):
        m.SetIntProp('_MolFileChiralFlag', 1)
    mb = Chem.MolToMolBlock(m, kekulize=False)
    return plain_double_bonds(mb)


def plain_double_bonds(mb):
    """RDKit flags a double bond whose E/Z the SMILES leaves open as
    'either' (3); OpenChemLib then draws it crossed. The sheet draws it
    plainly in one geometry, so write it as a normal double bond."""
    lines = mb.split('\n')
    ci = next(k for k, l in enumerate(lines) if l.rstrip().endswith('V2000'))
    na, nb = int(lines[ci][0:3]), int(lines[ci][3:6])
    for k in range(ci + 1 + na, ci + 1 + na + nb):
        l = lines[k]
        if l[6:9].strip() == '2' and l[9:12].strip() == '3':
            lines[k] = l[:9] + '  0' + l[12:]
    return '\n'.join(lines)


# ── main per-scheme routine ──────────────────────────────────────────

def layout_scheme(qid, si, scheme, spec, png_dir=None):
    nodes = {n['id']: n for n in scheme['nodes'] if n.get('smiles')}
    if not nodes:
        return
    nspec = spec.get('nodes', {})
    mols, full, groups = {}, {}, {}
    for nid, n in nodes.items():
        try:
            m = mol_from(n['smiles'])
        except ValueError as e:
            print(f'   ! {qid}/{si}/{nid}: {e}')
            continue
        if nspec.get(nid, {}).get('fusion_h', spec.get('fusion_h', True)):
            m = fusion_h(m)
        eh = nspec.get(nid, {}).get('explicit_h', spec.get('explicit_h'))
        if eh:
            hit = sorted({h[0] for h in m.GetSubstructMatches(Chem.MolFromSmarts(eh))})
            if hit:
                m = Chem.AddHs(m, onlyOnAtoms=hit)
        ns = nspec.get(nid, {})
        if ns.get('perspective') and 'coords' in ns:
            # a hand-drawn perspective core shows endo/exo by its geometry;
            # wedges computed as if it were flat would contradict it
            # (a SMARTS instead of true limits this to the atoms it matches,
            # so e.g. wedged ring substituents next to the core keep theirs)
            pat = ns['perspective'] if isinstance(ns['perspective'], str) else ns['coords']['smarts']
            hit = m.GetSubstructMatch(Chem.MolFromSmarts(pat))
            for a in hit:
                m.GetAtomWithIdx(a).SetChiralTag(Chem.ChiralType.CHI_UNSPECIFIED)
        full[nid] = m
        mols[nid], groups[nid] = collapse(m, ns.get('abbrev', spec.get('abbrev')))
    adj = {nid: [] for nid in mols}
    for e in scheme.get('edges', []):
        for f in e.get('from', []):
            if f in mols and e.get('to') in mols:
                adj[f].append(e['to'])
                adj[e['to']].append(f)

    placed = {}
    ref_kek = {}

    def place_fresh(nid):
        m = Chem.Mol(mols[nid])
        s = nspec.get(nid, {})
        if 'coords' in s:
            patt = Chem.MolFromSmarts(s['coords']['smarts'])
            if s['coords'].get('full'):
                # matched on the full molecule (collapsed labels such as Ph
                # and Cy look alike); atoms hidden in a label are skipped
                inv = {a.GetIntProp('orig'): a.GetIdx() for a in m.GetAtoms()}
                hitf = full[nid].GetSubstructMatch(patt)
                pairs = [(inv[h], tuple(p)) for h, p in zip(hitf, s['coords']['xy']) if h in inv]
            else:
                hit = m.GetSubstructMatch(patt)
                pairs = [(hit[i], tuple(p)) for i, p in enumerate(s['coords']['xy'])] if hit else []
            if not pairs:
                print(f'   ! {qid}/{si}/{nid}: coords pattern not found')
                depict(m)
                normalise(m)
            else:
                # hand-placed core (e.g. a perspective drawing): kept exactly
                m = pinned_depiction(m, dict(pairs))
        else:
            depict(m)
            normalise(m)
        if 'orient' in s:
            apply_orient(m, s['orient'])
        elif 'rotate' in s or 'mirror' in s:
            transform(m, s.get('rotate', 0), s.get('mirror', False))
        mk = kekulize_like(m)
        return mk

    def place_aligned(nid, rid):
        ref = placed[rid]
        m = Chem.Mol(mols[nid])
        s_ = nspec.get(nid, {})
        amap = mcs_map(mols[rid], m, ring_only=s_.get('ring_only', spec.get('ring_only', True)))
        if len(amap) < 3:
            return None, amap
        rpts = xy(ref)
        # pin_all: even substituents around a changed centre stay where they
        # were (the sheet then only adds the new group)
        loose = set() if s_.get('pin_all') else released(mols[rid], m, amap)
        if s_.get('release'):
            for hit in m.GetSubstructMatches(Chem.MolFromSmarts(s_['release'])):
                loose |= set(hit)
        cm = {j: rpts[i] for i, j in amap.items() if j not in loose}
        m0 = m
        if len(cm) < 2:
            # (almost) nothing may stay put: own layout, turned as a whole
            # onto the common atoms so the molecule keeps its direction
            depict(m)
            normalise(m)
            superpose(m, {j: rpts[i] for i, j in amap.items()})
            return kekulize_like(m, ref_kek[rid], amap), amap
        m = pinned_depiction(m0, cm)
        # a pinned chain can force the wrong E/Z: free that side and retry
        for _ in range(4):
            bad = bad_double_bonds(m)
            if not bad:
                break
            for bi in bad:
                for a in side_atoms(m0, bi):
                    cm.pop(a, None)
            m = pinned_depiction(m0, cm)
        mk = kekulize_like(m, ref_kek[rid], amap)
        return mk, amap

    anchor = spec.get('anchor')
    if anchor not in mols:
        anchor = max(mols, key=lambda k: mols[k].GetNumAtoms())
    order = [anchor]
    placed[anchor] = place_fresh(anchor)
    ref_kek[anchor] = placed[anchor]

    q = deque([anchor])
    seen = {anchor}
    # breadth-first along the scheme; among placed neighbours use the one
    # sharing the most atoms (or the explicit "align")
    while True:
        while q:
            cur = q.popleft()
            for nb in adj[cur]:
                if nb in seen:
                    continue
                seen.add(nb)
                s = nspec.get(nb, {})
                if s.get('free'):
                    placed[nb] = place_fresh(nb)
                elif s.get('rigid'):
                    # own layout, turned/moved onto the neighbour as a whole
                    r = s['align'] if s.get('align') in placed else next(x for x in adj[nb] if x in placed)
                    mk = place_fresh(nb)
                    amap = mcs_map(mols[r], mols[nb], ring_only=s.get('ring_only', True))
                    if len(amap) >= 3:
                        rp = xy(placed[r])
                        superpose(mk, {j: rp[i] for i, j in amap.items()})
                    placed[nb] = mk
                else:
                    cands = [s['align']] if s.get('align') in placed else [x for x in adj[nb] if x in placed]
                    best = (None, {}, None)
                    for r in cands:
                        mk, amap = place_aligned(nb, r)
                        if mk is not None and len(amap) > len(best[1]):
                            best = (mk, amap, r)
                    placed[nb] = best[0] if best[0] is not None else place_fresh(nb)
                ref_kek[nb] = placed[nb]
                order.append(nb)
                q.append(nb)
        rest = [k for k in mols if k not in seen]
        if not rest:
            break
        nxt = rest[0]
        seen.add(nxt)
        placed[nxt] = place_fresh(nxt)
        ref_kek[nxt] = placed[nxt]
        order.append(nxt)
        q.append(nxt)

    for nid, m in placed.items():
        mb = mol_block(expand(m, full[nid], groups[nid], nspec.get(nid, {}).get('wedge', spec.get('wedge'))))
        mb = force_bond_stereo(mb, full[nid], nspec.get(nid, {}).get('bond_stereo'))
        check(qid, si, nid, mb, Chem.MolToSmiles(full[nid]))
        nodes[nid]['mol'] = mb

    # structures drawn on an arrow (above its text)
    for key, es in spec.get('edges', {}).items():
        src, _, dst = key.partition('>')
        hit = [e for e in scheme.get('edges', []) if e.get('to') == dst and src in e.get('from', [])]
        if not hit:
            print(f'   ! {qid}/{si}: no edge {key}')
            continue
        fm = mol_from(es['smiles'])
        m, grp = collapse(fm, es.get('abbrev'))
        depict(m)
        normalise(m)
        if 'orient' in es:
            apply_orient(m, es['orient'])
        m = kekulize_like(m)
        hit[0]['reagent_mol'] = mol_block(expand(m, fm, grp))
        if es.get('below'):
            hit[0]['reagent_mol_below'] = True
        else:
            hit[0].pop('reagent_mol_below', None)

    if png_dir:
        write_png(qid, si, scheme, placed, order, png_dir)


def write_png(qid, si, scheme, placed, order, png_dir):
    from rdkit.Chem.Draw import rdMolDraw2D
    lab = {n['id']: (n.get('label') or n['id']) for n in scheme['nodes']}
    ms = [placed[k] for k in order]
    per_row = 4
    rows = (len(ms) + per_row - 1) // per_row
    d = rdMolDraw2D.MolDraw2DCairo(per_row * 330, rows * 280, 330, 280)
    o = d.drawOptions()
    o.fixedBondLength = 22
    o.legendFontSize = 18
    d.DrawMolecules([Chem.Mol(m) for m in ms], legends=[lab[k] for k in order])
    d.FinishDrawing()
    os.makedirs(png_dir, exist_ok=True)
    with open(os.path.join(png_dir, f'{qid}__{si}.png'), 'wb') as fh:
        fh.write(d.GetDrawingText())


def main(argv):
    png = None
    if '--png' in argv:
        i = argv.index('--png')
        png = argv[i + 1]
        argv = argv[:i] + argv[i + 2:]
    ids = set(argv)
    with open(QFILE, encoding='utf-8') as fh:
        qs = json.load(fh)
    spec = {}
    if os.path.exists(LFILE):
        with open(LFILE, encoding='utf-8') as fh:
            spec = json.load(fh)
    for q in qs:
        if ids and q['id'] not in ids:
            continue
        for si, s in enumerate(q.get('sections', [])):
            if s.get('type') != 'synthesis' or not s.get('scheme'):
                continue
            layout_scheme(q['id'], si, s['scheme'], spec.get(q['id'], {}).get(str(si), {}), png)
        print('ok', q['id'])
    if PROBLEMS:
        print(f'{len(PROBLEMS)} structure(s) do not match their SMILES')
    with open(QFILE, 'w', encoding='utf-8', newline='\n') as fh:
        json.dump(qs, fh, ensure_ascii=False, indent=2)
        fh.write('\n')


if __name__ == '__main__':
    main(sys.argv[1:])
