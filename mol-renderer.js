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
      const svg = m.toSVG(o.width, o.height, undefined, o);
      return _injectSvg(target, svg);
    } catch (err) {
      console.error('MolRenderer.drawSmiles:', err);
      _renderError(target, 'Ungültiges SMILES: ' + err.message);
      return null;
    }
  }

  /**
   * Auto-pick: if `input` smells like MOL, use drawMol; otherwise drawSmiles.
   * Useful for fields that may hold either format.
   */
  function drawAuto(input, target, opts) {
    if (!input) { _renderError(target, 'Keine Struktur'); return null; }
    return isMol(input) ? drawMol(input, target, opts) : drawSmiles(input, target, opts);
  }

  return { ready, drawMol, drawSmiles, drawAuto, isMol };
})();

// Expose on window so cross-file consumers (scheme-graph-editor.js,
// etc.) can read `window.MolRenderer`. `const` at script top-level
// creates a global lexical binding but does NOT attach to `window`.
window.MolRenderer = MolRenderer;
