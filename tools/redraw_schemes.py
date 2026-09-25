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
              "coords": {"smarts": "...", "xy": [[x,y],...]}   # hand template for a core
              "abbrev": [{"smarts": "...", "label": "OAc", "anchor": 0}]
            }
          }
        }
      }
    }
Nodes without an explicit spec are aligned to the placed neighbour with
the largest common substructure. Structures on arrows (edge.reagent_mol) are written from
    "edges": {"<from id>><to id>": {"smiles": "...", "orient": {...}, "abbrev": [...]}}
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
    m = Chem.MolFromSmiles(smiles)
    if m is None:
        raise ValueError('bad SMILES: ' + smiles)
    return m


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


def mcs_map(ref, m, timeout=6):
    """Atom map ref_idx -> m_idx of the largest common substructure.
    Elements and bond orders may differ (a C=O that becomes C–OH keeps its
    place); rings only match rings, so a chain never folds onto a ring."""
    p = rdFMCS.MCSParameters()
    p.AtomTyper = rdFMCS.AtomCompare.CompareAny
    p.BondTyper = rdFMCS.BondCompare.CompareAny
    p.BondCompareParameters.RingMatchesRingOnly = True
    p.BondCompareParameters.CompleteRingsOnly = False
    p.AtomCompareParameters.RingMatchesRingOnly = False
    p.Timeout = timeout
    res = rdFMCS.FindMCS([ref, m], p)
    if not res.smartsString or res.numAtoms < 2:
        return {}
    q = Chem.MolFromSmarts(res.smartsString)
    best = {}
    ra = ref.GetSubstructMatches(q, useChirality=False, uniquify=False, maxMatches=50)
    ma = m.GetSubstructMatch(q)
    if not ma:
        return {}
    # prefer the ref match whose element identities agree most with m
    score_best = -1
    for r in ra:
        s = sum(ref.GetAtomWithIdx(i).GetAtomicNum() == m.GetAtomWithIdx(j).GetAtomicNum() for i, j in zip(r, ma))
        if s > score_best:
            score_best, best = s, dict(zip(r, ma))
    return best


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
    best, best_s = None, -1
    sup = Chem.ResonanceMolSupplier(mk, Chem.KEKULE_ALL)
    n = 0
    for cand in sup:
        n += 1
        if n > 64 or cand is None:
            break
        s = 0
        for b in cand.GetBonds():
            i, j = b.GetBeginAtomIdx(), b.GetEndAtomIdx()
            if i in inv and j in inv:
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
        ob = out.GetBondBetweenAtoms(b.GetBeginAtomIdx(), b.GetEndAtomIdx())
        ob.SetBondType(b.GetBondType())
    return out


def apply_abbrev(m, abbrevs):
    """Mark substituents as superatoms (label shown instead of the atoms)."""
    for ab in abbrevs or []:
        patt = Chem.MolFromSmarts(ab['smarts'])
        for hit in m.GetSubstructMatches(patt):
            sg = Chem.CreateMolSubstanceGroup(m, 'SUP')
            for a in hit[ab.get('first', 0):]:
                sg.AddAtomWithIdx(a)
            sg.SetProp('LABEL', ab['label'])
            att = hit[ab.get('first', 0)]
            # attachment: the bond leaving the group
            for nb in m.GetAtomWithIdx(att).GetNeighbors():
                if nb.GetIdx() not in hit[ab.get('first', 0):]:
                    sg.AddAttachPoint(att, nb.GetIdx(), '1')
                    break


def mol_block(m):
    mb = Chem.MolToMolBlock(m, kekulize=False)
    return mb


# ── main per-scheme routine ──────────────────────────────────────────

def layout_scheme(qid, si, scheme, spec, png_dir=None):
    nodes = {n['id']: n for n in scheme['nodes'] if n.get('smiles')}
    if not nodes:
        return
    nspec = spec.get('nodes', {})
    mols = {}
    for nid, n in nodes.items():
        try:
            mols[nid] = mol_from(n['smiles'])
        except ValueError as e:
            print(f'   ! {qid}/{si}/{nid}: {e}')
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
            hit = m.GetSubstructMatch(patt)
            cm = {hit[i]: tuple(p) for i, p in enumerate(s['coords']['xy'])} if hit else None
            depict(m, cm)
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
        amap = mcs_map(mols[rid], m)
        if len(amap) < 3:
            return None, amap
        rpts = xy(ref)
        loose = released(mols[rid], m, amap)
        cm = {j: rpts[i] for i, j in amap.items() if j not in loose}
        m = pinned_depiction(m, cm)
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
        apply_abbrev(m, nspec.get(nid, {}).get('abbrev'))
        nodes[nid]['mol'] = mol_block(m)

    # structures drawn on an arrow (above its text)
    for key, es in spec.get('edges', {}).items():
        src, _, dst = key.partition('>')
        hit = [e for e in scheme.get('edges', []) if e.get('to') == dst and src in e.get('from', [])]
        if not hit:
            print(f'   ! {qid}/{si}: no edge {key}')
            continue
        m = mol_from(es['smiles'])
        depict(m)
        normalise(m)
        if 'orient' in es:
            apply_orient(m, es['orient'])
        m = kekulize_like(m)
        apply_abbrev(m, es.get('abbrev'))
        hit[0]['reagent_mol'] = mol_block(m)

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
    o.prepareMolsBeforeDrawing = False
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
    with open(QFILE, 'w', encoding='utf-8', newline='\n') as fh:
        json.dump(qs, fh, ensure_ascii=False, indent=2)
        fh.write('\n')


if __name__ == '__main__':
    main(sys.argv[1:])
