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
      const m = window.OCL.Molecule.fromMolfile(mol);
      _applyAlias(m, o);
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
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/_\{([^}]+)\}/g,  function (m, t) { return '<tspan baseline-shift="sub" font-size="80%">' + t + '</tspan>'; })
      .replace(/\^\{([^}]+)\}/g, function (m, t) { return '<tspan baseline-shift="super" font-size="80%">' + t + '</tspan>'; })
      .replace(/_([A-Za-z0-9+\-])/g,  function (m, t) { return '<tspan baseline-shift="sub" font-size="80%">' + t + '</tspan>'; })
      .replace(/\^([A-Za-z0-9+\-])/g, function (m, t) { return '<tspan baseline-shift="super" font-size="80%">' + t + '</tspan>'; });
  }

  /* Width estimate ignores the markup, matching what the eye sees. */
  function _plain(text) {
    return String(text == null ? '' : text).replace(/[_^]\{?([^}]*)\}?/g, '$1');
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

  /* Build the arrow as its own inline SVG so it sits in the flex row
     next to the structures. */
  function _arrow(above, below) {
    const aLines = _wrap(above, RXN_LABEL_FONT_ABOVE);
    const bLines = _wrap(below, RXN_LABEL_FONT_BELOW);
    const widest = Math.max.apply(null, [0]
      .concat(aLines.map(function (l) { return _measure(_plain(l), RXN_LABEL_FONT_ABOVE); }))
      .concat(bLines.map(function (l) { return _measure(_plain(l), RXN_LABEL_FONT_BELOW); })));
    const shaft = Math.max(RXN_MIN_SHAFT, Math.ceil(widest) + 22);
    const w = shaft + 8;
    const topH = aLines.length * RXN_LINE_H + 8;
    const botH = bLines.length * RXN_LINE_H + 8;
    const h = topH + botH + 12;
    const cy = topH + 6;
    const cx = w / 2;

    let txt = '';
    aLines.forEach(function (l, i) {
      const y = cy - 6 - (aLines.length - 1 - i) * RXN_LINE_H;
      txt += '<text x="' + cx + '" y="' + y + '" text-anchor="middle" style="font:' + RXN_LABEL_FONT_ABOVE + ';fill:#3a3a35">' + _sub(l) + '</text>';
    });
    bLines.forEach(function (l, i) {
      const y = cy + 6 + RXN_LINE_H * 0.82 + i * RXN_LINE_H;
      txt += '<text x="' + cx + '" y="' + y + '" text-anchor="middle" style="font:' + RXN_LABEL_FONT_BELOW + ';fill:#6b6a5d">' + _sub(l) + '</text>';
    });

    const x1 = 4, x2 = 4 + shaft;
    return {
      w: w, h: h,
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
    const parsed = parseReaction(rxn);
    const cells = [];

    const molCell = function (smi) {
      let inner;
      try {
        inner = window.OCL.Molecule.fromSmiles(smi).toSVG(o.width, o.height, undefined, o);
      } catch (err) {
        inner = '<svg xmlns="http://www.w3.org/2000/svg" width="' + o.width + '" height="' + o.height +
          '"><text x="6" y="20" font-family="monospace" font-size="12" fill="#c91020">&#9888; ' +
          String(smi).replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</text></svg>';
      }
      return { kind: 'svg', svg: inner, w: o.width, h: o.height };
    };

    const addSide = function (list) {
      list.forEach(function (smi, i) {
        if (i) cells.push({ kind: 'plus', w: 20, h: 20 });
        cells.push(molCell(smi));
      });
    };

    addSide(parsed.left);
    const above = [o.above, parsed.agent.join(' + ')].filter(Boolean).join(', ');
    const arrow = _arrow(above, o.below);
    cells.push({ kind: 'svg', svg: arrow.svg, w: arrow.w, h: arrow.h });
    addSide(parsed.right);

    const gap = 6;
    const totalW = cells.reduce(function (a, c) { return a + c.w; }, 0) + gap * (cells.length - 1);
    const totalH = Math.max.apply(null, cells.map(function (c) { return c.h; }));

    let x = 0, body = '';
    for (const c of cells) {
      const y = (totalH - c.h) / 2;
      if (c.kind === 'plus') {
        body += '<text x="' + (x + c.w / 2) + '" y="' + (totalH / 2 + 5) +
          '" text-anchor="middle" style="font:400 16px \'Segoe UI\',system-ui,sans-serif;fill:#3a3a35">+</text>';
      } else {
        // Nest the child SVG; it keeps its own coordinate system.
        body += c.svg.replace(/^\s*<svg\b/, '<svg x="' + x + '" y="' + y + '"');
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
    const parsed = parseReaction(rxn);
    if (!parsed.left.length && !parsed.right.length) { _renderError(target, 'Leere Reaktion'); return null; }
    const out = reactionSvg(rxn, opts);
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
    return isMol(input) ? drawMol(input, target, opts) : drawSmiles(input, target, opts);
  }

  return { ready, drawMol, drawSmiles, drawAuto, drawReaction, reactionSvg, parseReaction, isMol };
})();

// Expose on window so cross-file consumers (scheme-graph-editor.js,
// etc.) can read `window.MolRenderer`. `const` at script top-level
// creates a global lexical binding but does NOT attach to `window`.
window.MolRenderer = MolRenderer;
