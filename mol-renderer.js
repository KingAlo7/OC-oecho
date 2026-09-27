/**
 * MolRenderer — thin wrapper around OpenChemLib (OCL) for rendering chemical
 * structures from MOL files or SMILES strings to SVG.
 *
 * Why this exists: SMILES is coordinate-free and rendering it requires the
 * library to invent 2D coordinates — which fails for bridged polycyclics with
 * stereo (e.g. Cantharidin intermediates). MOL/SDF carries explicit (x,y) per
 * atom and stereo flags per bond, so the original layout authored by the
 * chemist is preserved. OCL respects those coords exactly.
 *
 * Loads OCL on demand from CDN (single ~500 KB file, no build step).
 * The global `OCL` is set by openchemlib-full.js — call `MolRenderer.ready()`
 * once before drawing.
 *
 * Usage:
 *   await MolRenderer.ready();
 *   MolRenderer.drawMol(molfileText, document.getElementById('foo'), { width: 200, height: 160 });
 *   MolRenderer.drawSmiles('c1ccccc1', container);
 *   MolRenderer.drawAuto(structInput, container);   // accepts mol or smiles, picks the right path
 *
 * Inputs:
 *   - mol: a MOL V2000/V3000 string (multi-line, starts with header or block "M  END")
 *   - smiles: a single SMILES string (no '>>')
 *
 * Output: the target element receives an inner SVG; previous content is cleared.
 */

const MolRenderer = (() => {
  let _readyP = null;

  /* ── Defaults for SVG render ─────────────────────────────────────── */
  /* All "suppress*" flags are TRUE so we render clean structures without
     OCL's "unknown chirality", "abs", "and1", "or1", CIP R/S etc. text
     annotations injected on top of stereocenters. Users see a textbook-
     style drawing without renderer metadata. */
  const DEFAULTS = {
    width: 220,
    height: 170,
    suppressChiralText: true,
    suppressCIPParity:  true,
    suppressESR:        true,
    noStereoProblem:    true,
    factorTextSize:     1.0
  };

  function ready() {
    if (_readyP) return _readyP;
    if (window.OCL) { _readyP = Promise.resolve(window.OCL); return _readyP; }
    _readyP = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/openchemlib/dist/openchemlib-full.js';
      s.async = true;
      s.onload  = () => window.OCL ? resolve(window.OCL) : reject(new Error('OCL loaded but global missing'));
      s.onerror = () => reject(new Error('Failed to load OpenChemLib from CDN'));
      document.head.appendChild(s);
    });
    return _readyP;
  }

  /* Heuristic: does this string look like a MOL file?
     V2000/V3000 files contain the "M  END" terminator or the "V2000"/"V3000"
     header on line 4. Anything multiline without > is treated as MOL.
     A SMILES never contains newlines or the literal "M  END". */
  function isMol(input) {
    if (!input) return false;
    if (input.indexOf('M  END') !== -1) return true;
    if (/\bV2000\b|\bV3000\b/.test(input)) return true;
    // Heuristic: any string with 3+ newlines is likely a MOL header block
    if ((input.match(/\n/g) || []).length >= 3) return true;
    return false;
  }

  /* An RXN file (what Ketcher's getRxn() returns) starts with the literal
     "$RXN" header and carries one $MOL block per component — each with the
     exact coordinates the chemist drew. This is the reaction library's
     storage format; reaction SMILES is only kept as a search key. */
  function isRxn(input) {
    return !!input && /^\s*\$RXN/.test(String(input));
  }

  /* Split an RXN V2000 into its component MOL blocks. The counts line is
     the last line of the header ("  2  1"): reactants then products.
     We split here rather than using OCL.Reaction.fromRxn because the raw
     MOL text is needed to recover atom aliases (see parseMolAliases). */
  function splitRxn(rxn) {
    const out = { reactants: [], products: [] };
    if (!isRxn(rxn)) return out;
    const parts = String(rxn).split('$MOL');
    const counts = (parts[0].trim().split(/\r?\n/).pop() || '').trim().split(/\s+/).map(Number);
    const nR = Number.isFinite(counts[0]) ? counts[0] : 0;
    parts.slice(1).forEach(function (b, i) {
      const block = b.replace(/^\r?\n/, '').replace(/\s+$/, '');
      if (block) (i < nR ? out.reactants : out.products).push(block);
    });
    return out;
  }

  /* The drawing source for a reaction record, newest format first.
     Older entries that only ever had a reaction SMILES still render. */
  function rxnSource(r) {
    if (!r) return '';
    return r.reaction_rxn || r.reaction_smiles || '';
  }

  function _clear(target) {
    if (!target) return null;
    if (typeof target === 'string') target = document.getElementById(target);
    if (!target) return null;
    while (target.firstChild) target.removeChild(target.firstChild);
    return target;
  }

  function _renderError(target, msg) {
    const el = _clear(target);
    if (!el) return;
    const d = document.createElement('div');
    d.style.cssText = 'color:#c91020;font-size:0.78rem;font-family:monospace;padding:0.3rem 0.6rem;border:1px dashed #c91020;border-radius:4px;background:#fde4e7;';
    d.textContent = '⚠ ' + msg;
    el.appendChild(d);
  }

  function _injectSvg(target, svgText) {
    const el = _clear(target);
    if (!el) return null;
    // OCL returns an SVG string; parse & insert as element so we can style it
    const tmp = document.createElement('div');
    tmp.innerHTML = svgText.trim();
    const svg = tmp.firstChild;
    if (svg && svg.nodeType === 1) {
      svg.style.display = 'block';
      svg.style.maxWidth = '100%';
      svg.style.height = 'auto';
      el.appendChild(svg);
      return svg;
    }
    el.innerHTML = svgText; // fallback: just inject as innerHTML
    return el.firstChild;
  }

  /* opts.alias = { atomIndex: 'X' } shows a generic label ("X", "R")
     in place of the element symbol, as an Angabe draws it. */
  function _applyAlias(m, o) {
    if (!o.alias) return;
    for (const k of Object.keys(o.alias)) {
      try { m.setAtomCustomLabel(Number(k), String(o.alias[k])); } catch (_) {}
    }
  }

  /* Molfile atom aliases — the two-line
   *     A    3
   *     Ar
   * form that Ketcher writes for a pseudo-atom. OCL parses the file
   * happily but drops these lines, so a generic label like "Ar", "X" or
   * "Nu" would render as its underlying carbon. We read them back out
   * and re-apply them as custom labels.
   *
   * R-groups are NOT handled here: "R#" plus an "M  RGP" line is native
   * molfile and OCL already renders those as R1, R2, …
   *
   * Returns { 0: 'Ar', 4: 'X' } keyed by zero-based atom index. */
  function parseMolAliases(mol) {
    const out = {};
    if (!mol) return out;
    const lines = String(mol).split(/\r?\n/);
    for (let i = 0; i < lines.length - 1; i++) {
      const m = /^A\s+(\d+)\s*$/.exec(lines[i]);
      if (!m) continue;
      const label = (lines[i + 1] || '').trim();
      if (label) out[Number(m[1]) - 1] = label;   // molfile indices are 1-based
    }
    return out;
  }

  /* Superatom S-groups — what Ketcher writes for an abbreviation from
   * its Functional-Groups library (OMe, Ts, TBDMS, Boc, OAc …) or for
   * any selection turned into a "Superatom" S-group with a custom name:
   *     M  STY  1   1 SUP
   *     M  SAL   1  2   5   6
   *     M  SAP   1  1   5   4   1
   *     M  SMT   1 OMe
   * Every atom is still written out, and OCL ignores S-groups, so the
   * group would be drawn in full. Returns [{ label, atoms, anchor }]
   * with zero-based atom indices; groups Ketcher marks as expanded
   * ("M  SDS EXP") are left alone. */
  function parseSuperatoms(mol) {
    const groups = new Map(), expanded = new Set();
    const g = n => { if (!groups.has(n)) groups.set(n, { atoms: [], label: '', anchor: -1, sup: false }); return groups.get(n); };
    const nums = t => t.trim().split(/\s+/).map(Number);
    String(mol || '').split(/\r?\n/).forEach(function (line) {
      let m;
      if ((m = /^M  STY(.*)$/.exec(line))) {
        const f = m[1].trim().split(/\s+/);
        for (let i = 1; i + 1 < f.length; i += 2) if (f[i + 1] === 'SUP') g(Number(f[i])).sup = true;
      } else if ((m = /^M  SAL\s+(\d+)\s+\d+(.*)$/.exec(line))) {
        nums(m[2]).forEach(function (a) { if (a) g(Number(m[1])).atoms.push(a - 1); });
      } else if ((m = /^M  SMT\s+(\d+) (.*)$/.exec(line))) {
        g(Number(m[1])).label = m[2].trim();
      } else if ((m = /^M  SAP\s+(\d+)\s+\d+\s+(\d+)/.exec(line))) {
        const grp = g(Number(m[1]));
        if (grp.anchor < 0) grp.anchor = Number(m[2]) - 1;
      } else if ((m = /^M  SDS EXP\s+\d+(.*)$/.exec(line))) {
        nums(m[1]).forEach(function (n) { expanded.add(n); });
      }
    });
    const out = [];
    groups.forEach(function (grp, n) {
      if (grp.sup && grp.label && grp.atoms.length && !expanded.has(n)) out.push(grp);
    });
    return out;
  }

  /* "OMe" bonded to something on its RIGHT reads "MeO" in a textbook:
     the atom that carries the bond is written next to it. Spellings the
     general rule below would not pick: */
  const MIRRORED = { OSO2Me: 'MeSO2O' };

  /* Two-letter element symbols a label may start or end with ("MgBr",
     "SiMe3", "ClMg"); every other label is split after one letter. */
  const LABEL_ELEMENT2 = /^(?:Cl|Br|Si|Mg|Li|Na|Al|Zn|Sn|Cu|Se|Hg|Pd|Ti|Cs)$/;
  /* One-letter symbols a formula label is spelled from (R, X, Y, Z stand
     in for a group). Followed by a small letter they start an
     abbreviation instead ("Ph", "Bn", "Cy") — unless that is the prefix
     of the next group ("OtBu", "OiPr"). */
  const LABEL_ELEMENT1 = /^[BCFHIKNOPSRXYZ]$/;
  const LABEL_PREFIX = /^(?:t|i|n|s|c|sec|tert)[A-Z]/;

  /* Mirror a formula label: "CO2Me" → "MeO2C", "CH2OH" → "HOH2C",
     "NHBoc" → "BocHN", "B(OH)2" → "(HO)2B". The label is read as element
     symbols with their counts up to the first abbreviation or bracket;
     that rest moves to the front as one piece (mirrored inside a bracket)
     and the symbols follow in reverse. A run of lone capitals is one
     abbreviation as soon as one of them is no element ("OTHP", "OPMB"),
     and a label that is an abbreviation from its first letter ("Ph",
     "Boc") comes back unchanged. */
  function _mirrorLabel(label) {
    const s = String(label);
    if (MIRRORED[s]) return MIRRORED[s];
    const units = [];
    let i = 0;
    while (i < s.length) {
      let sym = LABEL_ELEMENT2.test(s.slice(i, i + 2)) ? s.slice(i, i + 2) : '';
      if (!sym && LABEL_ELEMENT1.test(s[i]) && (!/[a-z]/.test(s[i + 1] || '') || LABEL_PREFIX.test(s.slice(i + 1)))) {
        const run = /^(?:[A-Z](?![a-z])[0-9]*)*/.exec(s.slice(i))[0].replace(/[0-9]/g, '');
        if (!units.length || run.split('').every(function (c) { return LABEL_ELEMENT1.test(c); })) sym = s[i];
      }
      if (!sym) break;
      let j = i + sym.length;
      while (j < s.length && /[0-9]/.test(s[j])) j++;
      units.push(s.slice(i, j));
      i = j;
    }
    let rest = s.slice(i);
    if (rest && !/^[A-Za-z(]/.test(rest)) return s;     // "FS-Synthase": not a formula
    const br = /^\((.*)\)([0-9]*)$/.exec(rest);
    if (br) rest = '(' + _mirrorLabel(br[1]) + ')' + br[2];
    return rest + units.reverse().join('');
  }

  /* Split a label around the symbol that stands on the attachment atom:
     the first one ("OMe" → O | Me, "MgBr" → Mg | Br), or the last one
     when the bond leaves to the right ("MeO2C" → MeO2 | C, "Ph" → P | h).
     A count after that last symbol stays behind it ("R2" → R | 2). */
  function _splitLabel(label, right) {
    const s = String(label);
    if (!right) {
      const k = LABEL_ELEMENT2.test(s.slice(0, 2)) ? 2 : 1;
      return { pre: '', anchor: s.slice(0, k), post: s.slice(k) };
    }
    const count = /[0-9₀-₉]*$/.exec(s)[0];
    const body = s.slice(0, s.length - count.length);
    if (!body) return { pre: '', anchor: s, post: '' };
    const k = body.length > 1 && LABEL_ELEMENT2.test(body.slice(-2)) ? 2 : 1;
    return { pre: body.slice(0, -k), anchor: body.slice(-k), post: count };
  }

  /* The two ways a label can sit on its atom: "L" runs to the right from
     the attachment atom ("OMe", "CO2Me"), "R" ends at it ("MeO", "MeO2C").
     `sym` is that atom's element. A formula label starting with it is
     mirrored for "R"; an abbreviation that does not ("Ph", "Boc") keeps
     its spelling and just ends at the bond. A label the file already
     spells mirrored ("MeO2C" on its C) only gets "R" — that is how an
     author pins the side by hand. */
  function _labelCands(label, sym) {
    const L = _splitLabel(label, false), R = _splitLabel(label, true);
    if (L.anchor === sym) {
      // "Cbz" on its C starts with the symbol but has no mirror image
      const M = _splitLabel(_mirrorLabel(label), true);
      if (M.anchor === sym) return { L: L, R: M };
    } else if (R.anchor === sym) return { R: R };
    return { L: L, R: R };
  }

  /* Label parts OCL does not draw itself, per collapsed molecule:
     [{ atom, cands: { L?, R? }, natural }] (see _placeLabels). */
  const _labelParts = new WeakMap();

  /* Collapse superatoms to a single labelled atom: the attachment atom
     keeps its bond and position, the rest of the group is deleted.

     A textbook writes the atom that carries the bond ON the bond end —
     "OMe" starts at it, "MeO" ends at it — but OCL centres every custom
     label on its atom, which puts the bond under the middle of the text.
     So OCL only gets that one symbol, which it centres and clips the
     bonds around correctly; the rest of the label is written beside it
     once the SVG exists, on whichever side is free (see _placeLabels). */
  function _collapseSuperatoms(m, mol) {
    const groups = parseSuperatoms(mol);
    if (!groups.length) return;
    m.ensureHelperArrays(window.OCL.Molecule.cHelperNeighbours);
    const drop = [], parts = [];
    groups.forEach(function (grp) {
      const inGrp = new Set(grp.atoms);
      if (grp.atoms.some(function (a) { return a >= m.getAllAtoms(); })) return;
      let anchor = inGrp.has(grp.anchor) ? grp.anchor : -1, outer = -1;
      for (const a of grp.atoms) {
        for (let k = 0; k < m.getAllConnAtoms(a); k++) {
          const nb = m.getConnAtom(a, k);
          if (!inGrp.has(nb) && (anchor < 0 || anchor === a)) { anchor = a; outer = nb; break; }
        }
        if (outer >= 0) break;
      }
      if (anchor < 0) anchor = grp.atoms[0];
      const cands = _labelCands(grp.label, m.getAtomLabel(anchor));
      // The natural side is away from the bond; a bond within ~6° of
      // vertical leaves both sides open and the label reads left to right.
      let dx = 0;
      if (outer >= 0) {
        const ux = m.getAtomX(outer) - m.getAtomX(anchor), uy = m.getAtomY(outer) - m.getAtomY(anchor);
        dx = ux / (Math.hypot(ux, uy) || 1);
      }
      const natural = cands.L && (dx <= 0.1 || !cands.R) ? 'L' : 'R';
      const part = cands[natural];
      // Atomic number 0 is a pseudo-atom: no implicit H, no element
      // colour — only the label is drawn, in the bond colour.
      m.setAtomicNo(anchor, 0);
      m.setAtomCharge(anchor, 0);
      m.setAtomCustomLabel(anchor, part.anchor);
      const more = function (k) { return k && (k.pre || k.post); };
      if (more(cands.L) || more(cands.R)) parts.push({ atom: anchor, cands: cands, natural: natural });
      grp.atoms.forEach(function (a) { if (a !== anchor) drop.push(a); });
    });
    // deleteAtoms renumbers what is left and returns old → new indices
    const map = drop.length ? m.deleteAtoms(drop) : null;
    if (map) parts.forEach(function (p) { p.atom = map[p.atom]; });
    if (parts.length) _labelParts.set(m, parts);
  }

  /* Counts match OCL's own "H2N": at symbol size 14 the "2" is 9 px
     and its baseline sits 3.33 px lower. */
  const LABEL_SUB_SIZE = 9 / 14;
  const LABEL_SUB_DROP = 3.33 / 14;

  function _escText(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Label text as <tspan>s, digits set as subscripts. */
  function _labelTspans(text, fs) {
    const drop = +(fs * LABEL_SUB_DROP).toFixed(2);
    const small = +(fs * LABEL_SUB_SIZE).toFixed(2);
    let out = '', low = false;
    String(text).split(/(\d+)/).forEach(function (run, i) {
      if (!run) return;
      if (i % 2) { out += '<tspan dy="' + drop + '" font-size="' + small + '">' + _escText(run) + '</tspan>'; low = true; }
      else { out += '<tspan' + (low ? ' dy="-' + drop + '"' : '') + '>' + _escText(run) + '</tspan>'; low = false; }
    });
    return out;
  }

  function _labelWidth(text, fs) {
    let w = 0;
    String(text).split(/(\d+)/).forEach(function (run, i) {
      if (run) w += _measure(run, (i % 2 ? fs * LABEL_SUB_SIZE : fs) + 'px sans-serif');
    });
    return w;
  }

  /* A numeric attribute of an SVG tag, or null. */
  function _num(tag, name) {
    const m = new RegExp('\\s' + name + '="(-?[\\d.]+)"').exec(tag);
    return m ? +m[1] : null;
  }

  /* Do boxes [x0, y0, x1, y1] come closer than `pad`? */
  function _near(a, b, pad) {
    return a[0] - pad < b[2] && b[0] - pad < a[2] && a[1] - pad < b[3] && b[1] - pad < a[3];
  }

  /* How much of segment [ax, ay, bx, by] runs inside box [left, top, right, bottom]. */
  function _clipLen(s, b) {
    const dx = s[2] - s[0], dy = s[3] - s[1];
    const p = [-dx, dx, -dy, dy], q = [s[0] - b[0], b[2] - s[0], s[1] - b[1], b[3] - s[1]];
    let t0 = 0, t1 = 1;
    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) { if (q[i] < 0) return 0; continue; }
      const r = q[i] / p[i];
      if (p[i] < 0) { if (r > t0) t0 = r; } else if (r < t1) t1 = r;
      if (t0 > t1) return 0;
    }
    return (t1 - t0) * Math.hypot(dx, dy);
  }

  /* What a label running to one side pays, per thing in its way: another
     label or atom symbol, or a bond stroke; and a little for leaving the
     side its bond points away from. Its own bond starts right at the
     symbol, so grazing a corner of the text with it costs less — in full
     only once it runs 0.6 of the font size through the text. */
  const SIDE_COST = { text: 1, bond: 0.8, ownFull: 0.6, unnatural: 0.3 };

  /* Write the rest of every collapsed label next to the symbol OCL drew
     for it. OCL's hit circles ("molN:Atom:I") give each atom's centre,
     and the symbol is the matching <text> closest to it.

     Each label then takes the side ("OMe" or "MeO") that runs into the
     least — other labels, atom symbols and bond strokes, all as they
     actually stand in this SVG — preferring the side away from its bond;
     two passes let neighbouring labels settle around each other.

     The part after the symbol joins that <text> as tspans; the part
     before it is a second <text> ending exactly where the symbol begins.
     The viewBox then grows to take in the added text (a cropped drawing
     keeps its scale; a fixed-size one shrinks to fit). Returns the parts
     it could not place as `missed`. */
  function _placeLabels(svg, parts, o) {
    const at = {};
    (svg.match(/<circle\b[^>]*>/g) || []).forEach(function (tag) {
      const id = /\sid="[^"]*:Atom:(\d+)"/.exec(tag), cx = _num(tag, 'cx'), cy = _num(tag, 'cy');
      if (id && cx != null && cy != null) at[id[1]] = { x: cx, y: cy };
    });
    const texts = [];
    const re = /<text\b([^>]*)>([^<]*)<\/text>/g;
    let t;
    while ((t = re.exec(svg))) {
      const x = _num(t[1], 'x'), y = _num(t[1], 'y'), fs = _num(t[1], 'font-size') || 14;
      if (x == null || y == null) continue;
      const w = _measure(t[2], fs + 'px sans-serif');
      texts.push({ from: t.index, to: re.lastIndex, attrs: t[1], body: t[2], x: x, y: y, fs: fs,
                   box: [x, y - 0.75 * fs, x + w, y + 0.25 * fs] });
    }
    // bond strokes: plain <line>s (OCL's hit lines carry class="event") and wedge outlines
    const segs = [];
    (svg.match(/<line\b[^>]*>/g) || []).forEach(function (tag) {
      if (/\sclass="event"/.test(tag)) return;
      const s = [_num(tag, 'x1'), _num(tag, 'y1'), _num(tag, 'x2'), _num(tag, 'y2')];
      if (s.every(function (v) { return v != null; })) segs.push(s);
    });
    (svg.match(/<polygon\b[^>]*>/g) || []).forEach(function (tag) {
      const pts = /\spoints="([^"]*)"/.exec(tag);
      const v = pts ? pts[1].trim().split(/[\s,]+/).map(Number) : [];
      for (let i = 0; i + 1 < v.length; i += 2) {
        const j = (i + 2) % v.length;
        if (v.length >= 4) segs.push([v[i], v[i + 1], v[j], v[j + 1]]);
      }
    });

    const found = [], missed = [];
    parts.forEach(function (p) {
      const c = at[p.atom], sym = p.cands[p.natural].anchor;
      let best = null, bd = Infinity;
      if (c) texts.forEach(function (tx) {
        const d = (tx.x - c.x) * (tx.x - c.x) + (tx.y - c.y) * (tx.y - c.y);
        if (tx.body === sym && d < bd) { best = tx; bd = d; }
      });
      if (!best || found.some(function (f) { return f.tx === best; })) { missed.push(p); return; }
      const fs = best.fs, top = best.y - 0.75 * fs, bottom = best.y + 0.3 * fs, geo = {};
      Object.keys(p.cands).forEach(function (s) {
        const k = p.cands[s], wa = _labelWidth(k.anchor, fs);
        // the symbol OCL drew stays put; another one ("h" of a mirrored "Ph") is centred on the atom
        const ax = k.anchor === best.body ? best.x : c.x - wa / 2;
        const x0 = ax - _labelWidth(k.pre, fs), x1 = ax + wa + _labelWidth(k.post, fs);
        const ext = [];
        if (k.pre) ext.push([x0, top, ax, bottom]);
        if (k.post) ext.push([ax + wa, top, x1, bottom]);
        geo[s] = { k: k, ax: ax, ext: ext, box: [x0, top, x1, bottom] };
      });
      found.push({ p: p, tx: best, c: c, geo: geo, side: p.natural });
    });

    const own = new Set(found.map(function (f) { return f.tx; }));
    const cost = function (f, s) {
      let c = s === f.p.natural ? 0 : SIDE_COST.unnatural;
      const full = SIDE_COST.ownFull * f.tx.fs, reach = 0.9 * f.tx.fs;
      f.geo[s].ext.forEach(function (r) {
        texts.forEach(function (tx) { if (!own.has(tx) && _near(r, tx.box, 1)) c += SIDE_COST.text; });
        found.forEach(function (g) { if (g !== f && _near(r, g.geo[g.side].box, 1)) c += SIDE_COST.text; });
        segs.forEach(function (sg) {
          const len = _clipLen(sg, r);
          if (len <= 1) return;
          const mine = Math.min(Math.hypot(sg[0] - f.c.x, sg[1] - f.c.y), Math.hypot(sg[2] - f.c.x, sg[3] - f.c.y)) < reach;
          c += SIDE_COST.bond * (mine ? Math.min(1, len / full) : 1);
        });
      });
      return c;
    };
    for (let pass = 0; pass < 2; pass++) {
      found.forEach(function (f) {
        let side = f.side, bc = cost(f, side);
        Object.keys(f.geo).forEach(function (s) {
          const c = cost(f, s);
          if (c < bc - 1e-9) { side = s; bc = c; }
        });
        f.side = side;
      });
    }

    const edits = [], boxes = [];
    found.forEach(function (f) {
      const g = f.geo[f.side], k = g.k, fs = f.tx.fs;
      const attrs = k.anchor === f.tx.body ? f.tx.attrs
        : f.tx.attrs.replace(/\sx="[^"]*"/, ' x="' + +g.ax.toFixed(2) + '"');
      let html = '<text' + attrs + '>' + _escText(k.anchor) + _labelTspans(k.post, fs) + '</text>';
      if (k.pre) html = '<text' + attrs + ' text-anchor="end">' + _labelTspans(k.pre, fs) + '</text>' + html;
      edits.push({ tx: f.tx, html: html });
      boxes.push([g.box[0], f.tx.y - fs * 0.8, g.box[2], f.tx.y + fs * 0.35]);
    });
    edits.sort(function (a, b) { return b.tx.from - a.tx.from; }).forEach(function (e) {
      svg = svg.slice(0, e.tx.from) + e.html + svg.slice(e.tx.to);
    });
    return { svg: _growViewBox(svg, boxes, o), missed: missed };
  }

  /* Widen the root viewBox so every box [x0, y0, x1, y1] fits inside. */
  function _growViewBox(svg, boxes, o) {
    if (!boxes.length) return svg;
    return svg.replace(/^\s*<svg\b[^>]*>/, function (tag) {
      const vb = /\bviewBox="\s*(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/.exec(tag);
      if (!vb) return tag;
      const pad = o && o.autoCrop ? (o.autoCropMargin != null ? +o.autoCropMargin : 2) : 2;
      let x0 = +vb[1], y0 = +vb[2], x1 = x0 + +vb[3], y1 = y0 + +vb[4];
      const w0 = x1 - x0, h0 = y1 - y0;
      boxes.forEach(function (b) {
        x0 = Math.min(x0, Math.floor(b[0] - pad)); y0 = Math.min(y0, Math.floor(b[1] - pad));
        x1 = Math.max(x1, Math.ceil(b[2] + pad));  y1 = Math.max(y1, Math.ceil(b[3] + pad));
      });
      if (x1 - x0 === w0 && y1 - y0 === h0) return tag;
      tag = tag.replace(vb[0], 'viewBox="' + x0 + ' ' + y0 + ' ' + (x1 - x0) + ' ' + (y1 - y0) + '"');
      if (!(o && o.autoCrop)) return tag;
      // a cropped drawing is drawn 1:1 — its size follows the viewBox
      return tag
        .replace(/\swidth="([\d.]+)(px)?"/, function (s, v, u) { return ' width="' + Math.ceil(v * (x1 - x0) / w0) + (u || '') + '"'; })
        .replace(/\sheight="([\d.]+)(px)?"/, function (s, v, u) { return ' height="' + Math.ceil(v * (y1 - y0) / h0) + (u || '') + '"'; });
    });
  }

  /* toSVG plus the collapsed-label pass — every drawing of a molecule
     that came from _molFromMolfile goes through here. A label that
     cannot be placed (OCL's SVG not as expected) gets its whole text
     back as OCL's own centred label rather than losing all but its
     first letter. */
  function _svgOf(m, w, h, o) {
    const svg = m.toSVG(w, h, undefined, o);
    const parts = _labelParts.get(m);
    if (!parts) return svg;
    const r = _placeLabels(svg, parts, o);
    if (!r.missed.length) return r.svg;
    r.missed.forEach(function (p) {
      const k = p.cands[p.natural];
      if (p.atom >= 0) m.setAtomCustomLabel(p.atom, k.pre + k.anchor + k.post);
    });
    _labelParts.set(m, parts.filter(function (p) { return r.missed.indexOf(p) < 0; }));
    return _svgOf(m, w, h, o);
  }

  /* Parse a MOL for drawing: aliases first (they are keyed by the
     original atom order), then superatoms collapse. */
  function _molFromMolfile(mol, o) {
    const m = window.OCL.Molecule.fromMolfile(mol);
    _applyAlias(m, _aliasOpts(mol, o));
    _collapseSuperatoms(m, mol);
    return m;
  }

  /* Merge file aliases with any caller-supplied ones (caller wins). */
  function _aliasOpts(mol, o) {
    const fromFile = parseMolAliases(mol);
    if (!Object.keys(fromFile).length) return o;
    return Object.assign({}, o, { alias: Object.assign(fromFile, o.alias || {}) });
  }

  /**
   * Render a MOL file into a target element.
   * @param {string} mol  MOL V2000/V3000 text
   * @param {HTMLElement|string} target  element or id
   * @param {object} [opts]  { width, height, ...OCL options }
   */
  function drawMol(mol, target, opts) {
    if (!window.OCL) { _renderError(target, 'OCL not loaded'); return null; }
    const o = Object.assign({}, DEFAULTS, opts || {});
    try {
      const m = _molFromMolfile(mol, o);
      const svg = _svgOf(m, o.width, o.height, o);
      return _injectSvg(target, svg);
    } catch (err) {
      console.error('MolRenderer.drawMol:', err);
      _renderError(target, 'Ungültiger MOL: ' + err.message);
      return null;
    }
  }

  /**
   * Render a SMILES into a target element. OCL invents 2D coordinates.
   * For complex stereochemistry, prefer drawMol with an authored MOL file.
   */
  function drawSmiles(smiles, target, opts) {
    if (!window.OCL) { _renderError(target, 'OCL not loaded'); return null; }
    const o = Object.assign({}, DEFAULTS, opts || {});
    try {
      const m = window.OCL.Molecule.fromSmiles(smiles);
      _applyAlias(m, o);
      const svg = m.toSVG(o.width, o.height, undefined, o);
      return _injectSvg(target, svg);
    } catch (err) {
      console.error('MolRenderer.drawSmiles:', err);
      _renderError(target, 'Ungültiges SMILES: ' + err.message);
      return null;
    }
  }

  /* ── Reaction rendering ───────────────────────────────────────────
     Draws "A.B>>C" (or "A>reagent>C") as a row of structures joined by
     a textbook reaction arrow, laid out the way the ÖChO Bundeswettbewerb
     sheets do it: the reagent sits centred DIRECTLY above the shaft, the
     conditions centred directly below, and the shaft grows so it is
     never shorter than the text it carries.

     This replaces the old smiles-drawer path. smiles-drawer parsed the
     reaction itself but placed labels by its own rules and needed a
     second rendering engine on every page; OCL already renders every
     structure here, so the arrow is the only thing left to draw. */

  /* Oversized so OCL's fit-to-box scaling never kicks in — see drawCell. */
  const RXN_CANVAS_W = 2400;
  const RXN_CANVAS_H = 1800;

  /* Read the real size off an autoCrop'd SVG header, e.g.
     <svg ... width="75px" height="36px" viewBox="254 226 75 36"> */
  function _svgBox(svgText) {
    const head = String(svgText).slice(0, 400);
    const vb = head.match(/viewBox="\s*(-?[\d.]+)\s+(-?[\d.]+)\s+([\d.]+)\s+([\d.]+)/);
    if (vb) return { w: Math.ceil(+vb[3]), h: Math.ceil(+vb[4]) };
    const w = head.match(/width="([\d.]+)/), h = head.match(/height="([\d.]+)/);
    return { w: w ? Math.ceil(+w[1]) : 120, h: h ? Math.ceil(+h[1]) : 100 };
  }

  const RXN_LABEL_FONT_ABOVE = "500 12px 'Segoe UI', system-ui, -apple-system, sans-serif";
  const RXN_LABEL_FONT_BELOW = "500 11px 'Segoe UI', system-ui, -apple-system, sans-serif";
  const RXN_LINE_H = 14;
  const RXN_MAX_LINE_W = 150;
  const RXN_MIN_SHAFT = 68;

  let _rxnCtx = null;
  function _measure(text, font) {
    if (!_rxnCtx) {
      try { _rxnCtx = document.createElement('canvas').getContext('2d'); } catch (_) { _rxnCtx = null; }
    }
    if (!_rxnCtx) return String(text).length * 6.6;
    _rxnCtx.font = font;
    return _rxnCtx.measureText(String(text)).width;
  }

  /* LaTeX-lite: H_2SO_4 renders with a real subscript, ^+ with a
     superscript — the notation the reaction data already uses. */
  function _sub(text) {
    return window.ChemText.tokenize(text).map(function (k) {
      var v = window.ChemText.esc(k.v);
      return k.t === 'text' ? v
        : '<tspan baseline-shift="' + (k.t === 'sub' ? 'sub' : 'super') + '" font-size="80%">' + v + '</tspan>';
    }).join('');
  }

  /* Width estimate ignores the markup, matching what the eye sees. */
  function _plain(text) {
    return window.ChemText.plain(text);
  }

  function _wrap(text, font) {
    const raw = String(text == null ? '' : text).trim();
    if (!raw) return [];
    const out = [];
    const chunks = raw.split(/\\n|\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    for (const chunk of chunks) {
      if (_measure(_plain(chunk), font) <= RXN_MAX_LINE_W) { out.push(chunk); continue; }
      const atoms = chunk.split(/(?<=[;,])\s+|(?<=\s\/)\s+|\s+(?=dann\s)|\s+(?=\d[.)]\s)/)
                         .map(function (s) { return s.trim(); }).filter(Boolean);
      let line = '';
      for (const a of atoms) {
        const cand = line ? line + ' ' + a : a;
        if (line && _measure(_plain(cand), font) > RXN_MAX_LINE_W) { out.push(line); line = a; }
        else line = cand;
      }
      if (line) out.push(line);
    }
    return out;
  }

  /* Place a rendered child SVG at (x, y), optionally resized to w × h.
     The child keeps its viewBox, so a new width/height scales it. The
     size is also pinned as inline style: page CSS such as
     `.rxn-drawing svg{height:auto}` reaches nested <svg>s too and would
     otherwise override the attributes and shift the child. */
  function _nest(svgText, x, y, w, h) {
    return String(svgText).replace(/^\s*<svg\b([^>]*)>/, function (m, attrs) {
      const aw = attrs.match(/\swidth="([\d.]+)/), ah = attrs.match(/\sheight="([\d.]+)/);
      const W = w != null ? w : (aw ? +aw[1] : null);
      const H = h != null ? h : (ah ? +ah[1] : null);
      attrs = attrs.replace(/\s(width|height|style)="[^"]*"/g, '');
      const size = W != null && H != null
        ? ' width="' + W + '" height="' + H + '" style="width:' + W + 'px;height:' + H + 'px;max-width:none"'
        : '';
      return '<svg x="' + x + '" y="' + y + '"' + size + attrs + '>';
    });
  }

  /* Reagent structures above the arrow are drawn smaller than the
     reactants, the way printed schemes do it. */
  const RXN_AGENT_SCALE = 0.75;

  /* Build the arrow as its own inline SVG so it sits in the flex row
     next to the structures. `mols` are pre-rendered cells ({svg, w, h})
     stacked in a row above the text label. */
  function _arrow(above, below, mols) {
    mols = mols || [];
    const aLines = _wrap(above, RXN_LABEL_FONT_ABOVE);
    const bLines = _wrap(below, RXN_LABEL_FONT_BELOW);

    const PLUS_W = 14, sc = RXN_AGENT_SCALE;
    const molW = mols.reduce(function (a, c) { return a + c.w * sc; }, 0) + Math.max(0, mols.length - 1) * PLUS_W;
    const molH = mols.length ? Math.max.apply(null, mols.map(function (c) { return c.h * sc; })) + 4 : 0;

    const widest = Math.max.apply(null, [molW]
      .concat(aLines.map(function (l) { return _measure(_plain(l), RXN_LABEL_FONT_ABOVE); }))
      .concat(bLines.map(function (l) { return _measure(_plain(l), RXN_LABEL_FONT_BELOW); })));
    const shaft = Math.max(RXN_MIN_SHAFT, Math.ceil(widest) + 22);
    const w = shaft + 8;
    /* Stacked lines with sub/superscripts need extra leading, or a
       subscript collides with the superscript of the line below. */
    const tall = function (ls) {
      return ls.length > 1 && ls.some(function (l) { const f = window.ChemText.flags(l); return f.sub || f.sup; });
    };
    const lhA = tall(aLines) ? RXN_LINE_H + 3 : RXN_LINE_H;
    const lhB = tall(bLines) ? RXN_LINE_H + 3 : RXN_LINE_H;
    // A subscript on the line nearest the shaft needs clearance from it.
    const gapA = aLines.length && window.ChemText.flags(aLines[aLines.length - 1]).sub ? 9 : 6;
    const topH = molH + aLines.length * lhA + gapA + 2;
    const botH = bLines.length * lhB + 8;
    const h = topH + botH + 12;
    const cy = topH + 6;
    const cx = w / 2;

    let txt = '';
    if (mols.length) {
      const textH = aLines.length * lhA;
      const rowBottom = cy - gapA - (aLines.length ? textH + 2 : 0);
      let mx = cx - molW / 2;
      mols.forEach(function (c, i) {
        if (i) {
          txt += '<text x="' + (mx + PLUS_W / 2) + '" y="' + (rowBottom - (molH - 4) / 2 + 4) +
            '" text-anchor="middle" style="font:400 13px \'Segoe UI\',system-ui,sans-serif;fill:#3a3a35">+</text>';
          mx += PLUS_W;
        }
        const cw = c.w * sc, ch = c.h * sc;
        txt += _nest(c.svg, mx, rowBottom - (molH - 4) / 2 - ch / 2, cw, ch);
        mx += cw;
      });
    }
    aLines.forEach(function (l, i) {
      const y = cy - gapA - (aLines.length - 1 - i) * lhA;
      txt += '<text x="' + cx + '" y="' + y + '" text-anchor="middle" style="font:' + RXN_LABEL_FONT_ABOVE + ';fill:#3a3a35">' + _sub(l) + '</text>';
    });
    bLines.forEach(function (l, i) {
      const y = cy + 6 + RXN_LINE_H * 0.82 + i * lhB;
      txt += '<text x="' + cx + '" y="' + y + '" text-anchor="middle" style="font:' + RXN_LABEL_FONT_BELOW + ';fill:#3a3a35">' + _sub(l) + '</text>';
    });

    const x1 = 4, x2 = 4 + shaft;
    return {
      w: w, h: h, cy: cy,
      svg: '<svg class="rxn-arrow" xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h +
        '" viewBox="0 0 ' + w + ' ' + h + '" overflow="visible">' +
        '<line x1="' + x1 + '" y1="' + cy + '" x2="' + (x2 - 7) + '" y2="' + cy + '" stroke="#3a3a35" stroke-width="1.6"/>' +
        '<path d="M' + (x2 - 8) + ',' + (cy - 4.2) + ' L' + x2 + ',' + cy + ' L' + (x2 - 8) + ',' + (cy + 4.2) + ' z" fill="#3a3a35"/>' +
        txt + '</svg>'
    };
  }

  /* Split "A.B>agent>C.D" (or "A.B>>C.D") into { left, agent, right }. */
  function parseReaction(rxn) {
    const parts = String(rxn || '').split('>');
    const clean = function (s) {
      return String(s || '').split('.').map(function (t) { return t.trim(); }).filter(Boolean);
    };
    if (parts.length >= 3) return { left: clean(parts[0]), agent: clean(parts[1]), right: clean(parts.slice(2).join('>')) };
    if (parts.length === 2) return { left: clean(parts[0]), agent: [], right: clean(parts[1]) };
    return { left: clean(rxn), agent: [], right: [] };
  }

  /**
   * Compose a reaction into ONE self-contained SVG string.
   *
   * Every structure OCL renders is nested as an <svg x y width height>
   * inside an outer <svg>, so the result is a single element: it can be
   * dropped into the page, measured, or written straight out as an
   * .svg file (which is what the export view does). smiles-drawer used
   * to own this job; doing it here means one rendering engine for the
   * whole site and one place where arrow labels are positioned.
   *
   * @returns {{svg:string, width:number, height:number}}
   */
  function reactionSvg(rxn, opts) {
    const o = Object.assign({}, DEFAULTS, opts || {});
    const cells = [];

    /* Render one OCL Molecule into a tightly cropped cell.
     *
     * The canvas passed to toSVG is deliberately far larger than any
     * component needs. OCL caps the drawn bond length at 24 px and only
     * shrinks below that when the structure would not otherwise fit, so an
     * oversized canvas means EVERY component lands at exactly 24 px/bond —
     * a reagent and a polycycle come out at the same scale instead of each
     * being stretched to fill its own box. `autoCrop` then trims the empty
     * canvas away and reports the real size in the SVG header, which is
     * what we lay the row out with.
     *
     * Crucially, none of this touches the atom coordinates: whatever
     * geometry came out of Ketcher is what gets drawn, skewed angles and
     * all. Only SMILES input forces OCL to invent a layout. */
    const drawCell = function (m) {
      const svg = _svgOf(m, RXN_CANVAS_W, RXN_CANVAS_H,
        Object.assign({}, o, { autoCrop: true, autoCropMargin: o.autoCropMargin != null ? o.autoCropMargin : 4 }));
      const box = _svgBox(svg);
      return { kind: 'svg', svg: svg, w: box.w, h: box.h };
    };

    const errCell = function (what) {
      const w = o.width, h = o.height;
      return {
        kind: 'svg', w: w, h: h,
        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h +
          '"><text x="6" y="20" font-family="monospace" font-size="12" fill="#c91020">&#9888; ' +
          String(what).replace(/&/g, '&amp;').replace(/</g, '&lt;').slice(0, 60) + '</text></svg>'
      };
    };

    /* Components joined by "+", in the order they were drawn. */
    const addSide = function (list, make) {
      list.forEach(function (item, i) {
        if (i) cells.push({ kind: 'plus', w: 20, h: 20 });
        try { cells.push(drawCell(make(item))); }
        catch (err) { cells.push(errCell(item)); }
      });
    };

    let above, left = [], right = [], makeMol;

    if (isRxn(rxn)) {
      /* RXN file: each $MOL block already carries the drawn coordinates
         and any atom aliases, so components are parsed one at a time. */
      const split = splitRxn(rxn);
      left = split.reactants;
      right = split.products;
      makeMol = function (molText) {
        return _molFromMolfile(molText, o);
      };
      above = o.above || '';
    } else {
      /* Reaction SMILES: OCL has to invent coordinates. Kept so older
         records and ad-hoc previews still render. */
      const parsed = parseReaction(rxn);
      left = parsed.left;
      right = parsed.right;
      makeMol = function (smi) {
        const m = window.OCL.Molecule.fromSmiles(smi);
        _applyAlias(m, o);
        return m;
      };
      above = [o.above, parsed.agent.join(' + ')].filter(Boolean).join(', ');
    }

    addSide(left, makeMol);

    /* Structures drawn above the arrow (opts.aboveMols: MOL or SMILES). */
    const agentCells = [];
    (o.aboveMols || []).filter(Boolean).forEach(function (src) {
      try {
        let m;
        if (isMol(src)) m = _molFromMolfile(src, o);
        else { m = window.OCL.Molecule.fromSmiles(src); _applyAlias(m, o); }
        agentCells.push(drawCell(m));
      } catch (err) { /* an unreadable reagent is skipped, not fatal */ }
    });

    const arrow = _arrow(above, o.below, agentCells);
    cells.push({ kind: 'svg', svg: arrow.svg, w: arrow.w, h: arrow.h, mid: arrow.cy });
    addSide(right, makeMol);

    const gap = 6;
    const totalW = cells.reduce(function (a, c) { return a + c.w; }, 0) + gap * (cells.length - 1);
    /* Structures are centred on the arrow shaft, which sits lower than
       the arrow cell's middle when reagents are stacked above it. */
    const midOf = function (c) { return c.mid != null ? c.mid : c.h / 2; };
    const midY = Math.max.apply(null, cells.map(midOf));
    const totalH = midY + Math.max.apply(null, cells.map(function (c) { return c.h - midOf(c); }));

    let x = 0, body = '';
    for (const c of cells) {
      const y = midY - midOf(c);
      if (c.kind === 'plus') {
        body += '<text x="' + (x + c.w / 2) + '" y="' + (midY + 5) +
          '" text-anchor="middle" style="font:400 16px \'Segoe UI\',system-ui,sans-serif;fill:#3a3a35">+</text>';
      } else {
        // Nest the child SVG; it keeps its own coordinate system.
        body += _nest(c.svg, x, y);
      }
      x += c.w + gap;
    }

    return {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="' + Math.ceil(totalW) + '" height="' + Math.ceil(totalH) +
        '" viewBox="0 0 ' + Math.ceil(totalW) + ' ' + Math.ceil(totalH) + '">' + body + '</svg>',
      width: Math.ceil(totalW),
      height: Math.ceil(totalH)
    };
  }

  /**
   * Render a reaction SMILES into a target element.
   * @param {string} rxn  e.g. "CC=C.Br>>CC(Br)C"
   * @param {HTMLElement|string} target
   * @param {object} [opts] { above, below, width, height }
   *   `above` / `below` are the reagent and condition labels; they
   *   accept LaTeX-lite subscripts ("H_2SO_4").
   * @returns {SVGElement|null} the composed <svg>, for callers that
   *   need to measure or export it.
   */
  function drawReaction(rxn, target, opts) {
    const el = _clear(target);
    if (!el) return null;
    if (!window.OCL) { _renderError(target, 'OCL not loaded'); return null; }
    if (!isRxn(rxn)) {
      const parsed = parseReaction(rxn);
      if (!parsed.left.length && !parsed.right.length) { _renderError(target, 'Leere Reaktion'); return null; }
    }
    let out;
    try { out = reactionSvg(rxn, opts); }
    catch (err) {
      console.error('MolRenderer.drawReaction:', err);
      _renderError(target, 'Reaktion nicht lesbar: ' + err.message);
      return null;
    }
    el.innerHTML = out.svg;
    const svgEl = el.firstElementChild;
    if (svgEl) {
      svgEl.style.display = 'block';
      svgEl.style.maxWidth = '100%';
      svgEl.style.height = 'auto';
    }
    return svgEl;
  }

  /**
   * Auto-pick: if `input` smells like MOL, use drawMol; otherwise drawSmiles.
   * Useful for fields that may hold either format.
   */
  function drawAuto(input, target, opts) {
    if (!input) { _renderError(target, 'Keine Struktur'); return null; }
    if (isRxn(input)) return drawReaction(input, target, opts);
    return isMol(input) ? drawMol(input, target, opts) : drawSmiles(input, target, opts);
  }

  return { ready, drawMol, drawSmiles, drawAuto, drawReaction, reactionSvg, parseReaction,
           parseMolAliases, parseSuperatoms, mirrorLabel: _mirrorLabel, splitRxn, isMol, isRxn, rxnSource };
})();

// Expose on window so cross-file consumers (scheme-graph-editor.js,
// etc.) can read `window.MolRenderer`. `const` at script top-level
// creates a global lexical binding but does NOT attach to `window`.
window.MolRenderer = MolRenderer;
