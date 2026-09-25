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
     the atom that carries the bond is written next to it. */
  function _mirrorLabel(label) {
    const m = /^(CO2|(?:[CNOS]|Si)(?:H\d?)?)([A-Z].*)$/.exec(label);
    if (!m) return label;
    return m[1] === 'CO2' ? m[2] + 'O2C' : m[2] + m[1];
  }

  /* Collapse superatoms to a single labelled atom: the attachment atom
     keeps its bond and position, the rest of the group is deleted. */
  function _collapseSuperatoms(m, mol) {
    const groups = parseSuperatoms(mol);
    if (!groups.length) return;
    m.ensureHelperArrays(window.OCL.Molecule.cHelperNeighbours);
    const drop = [];
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
      let label = grp.label;
      if (outer >= 0 && m.getAtomX(outer) > m.getAtomX(anchor) + 0.01) label = _mirrorLabel(label);
      // Atomic number 0 is a pseudo-atom: no implicit H, no element
      // colour — only the label is drawn, in the bond colour.
      m.setAtomicNo(anchor, 0);
      m.setAtomCharge(anchor, 0);
      m.setAtomCustomLabel(anchor, label);
      grp.atoms.forEach(function (a) { if (a !== anchor) drop.push(a); });
    });
    if (drop.length) m.deleteAtoms(drop);
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
      const svg = m.toSVG(o.width, o.height, undefined, o);
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
      const atoms = chunk.split(/(?<=[;,])\s+|\s+\/\s+|\s+(?=dann\s)|\s+(?=\d[.)]\s)/)
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
      txt += '<text x="' + cx + '" y="' + y + '" text-anchor="middle" style="font:' + RXN_LABEL_FONT_BELOW + ';fill:#6b6a5d">' + _sub(l) + '</text>';
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
      const svg = m.toSVG(RXN_CANVAS_W, RXN_CANVAS_H, undefined,
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
           parseMolAliases, parseSuperatoms, splitRxn, isMol, isRxn, rxnSource };
})();

// Expose on window so cross-file consumers (scheme-graph-editor.js,
// etc.) can read `window.MolRenderer`. `const` at script top-level
// creates a global lexical binding but does NOT attach to `window`.
window.MolRenderer = MolRenderer;
