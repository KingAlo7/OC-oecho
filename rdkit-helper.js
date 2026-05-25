/**
 * RDKitHelper — lazy RDKit-JS loader and coordinate-baking utility for the
 * admin. Loads the ~4 MB WASM bundle on first use (not at page startup), so
 * the admin opens fast even though RDKit is large.
 *
 * Used only by admin.html. The quiz viewer stays on OpenChemLib (OCL) and
 * never loads RDKit — the trick is that admin runs RDKit's CoordGen to
 * produce a MOL with high-quality 2D coordinates, and OCL at quiz time
 * renders those coordinates verbatim.
 *
 * Usage:
 *   const RDKit = await RDKitHelper.ready();        // returns RDKit module
 *   const mol = await RDKitHelper.bakeLayout(smi);  // SMILES → MOL with coords
 *   const mol = await RDKitHelper.bakeLayout(mol);  // MOL → MOL with refreshed coords
 *
 * `bakeLayout` accepts either SMILES or a MOL block. Returns a MOL V2000
 * string with CoordGen-quality 2D coordinates. Throws on invalid input.
 */

const RDKitHelper = (() => {
  let _readyP = null;

  const CDN_JS   = 'https://unpkg.com/@rdkit/rdkit/dist/RDKit_minimal.js';
  const CDN_WASM = 'https://unpkg.com/@rdkit/rdkit/dist/RDKit_minimal.wasm';

  function ready() {
    if (_readyP) return _readyP;
    _readyP = (async () => {
      // Load the JS shim if not yet present
      if (!window.initRDKitModule) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = CDN_JS;
          s.async = true;
          s.onload  = res;
          s.onerror = () => rej(new Error('RDKit-JS CDN unreachable'));
          document.head.appendChild(s);
        });
      }
      // Initialize the WASM module — point it at the same CDN
      const RDKit = await window.initRDKitModule({ locateFile: () => CDN_WASM });
      return RDKit;
    })();
    return _readyP;
  }

  /**
   * Run CoordGen on the input structure and return a MOL block with the
   * computed 2D coordinates. Caller is responsible for storing the result.
   *
   * @param {string} input  SMILES or MOL text
   * @returns {Promise<string>}  MOL V2000 with fresh 2D coords
   */
  async function bakeLayout(input) {
    if (!input || typeof input !== 'string') throw new Error('bakeLayout: empty input');
    const RDKit = await ready();
    const mol = RDKit.get_mol(input);
    if (!mol || !mol.is_valid || !mol.is_valid()) {
      try { mol && mol.delete(); } catch {}
      throw new Error('bakeLayout: konnte Eingabe nicht parsen');
    }
    try {
      // CoordGen (true) produces ChemDraw-style fused/bridged layouts.
      // Passing false would use RDKit's own (older, less polished) generator.
      mol.set_new_coords(true);
      return mol.get_molblock();
    } finally {
      try { mol.delete(); } catch {}
    }
  }

  /**
   * Convenience: render a structure with RDKit (for comparison previews).
   * Use sparingly — every call needs the wasm module.
   */
  async function svgFor(input, width = 220, height = 170) {
    if (!input) return '';
    const RDKit = await ready();
    const mol = RDKit.get_mol(input);
    if (!mol || !mol.is_valid || !mol.is_valid()) {
      try { mol && mol.delete(); } catch {}
      throw new Error('svgFor: Ungültige Struktur');
    }
    try {
      // Only re-layout if the input had no coords (SMILES) — preserve
      // already-baked coordinates passed in as MOL.
      if (typeof mol.has_coords !== 'function' || !mol.has_coords()) {
        mol.set_new_coords(true);
      }
      return mol.get_svg(width, height);
    } finally {
      try { mol.delete(); } catch {}
    }
  }

  /** True if RDKit has already finished loading (no async cost to call). */
  function isReady() { return !!(window.initRDKitModule && _readyP && _readyP._resolved); }

  return { ready, bakeLayout, svgFor, isReady };
})();
