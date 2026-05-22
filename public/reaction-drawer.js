/**
 * ReactionRenderer — thin wrapper around smiles-drawer v2 ReactionDrawer.
 *
 * Requires smiles-drawer >= 2.x loaded on the page (exposes window.SmilesDrawer).
 *
 * Usage:
 *   // target can be an SVG element or its id string
 *   ReactionRenderer.draw('CCO.Cl>>ClCC.O', 'my-svg-id', 'dark');
 *   ReactionRenderer.draw('CCO.Cl>>ClCC.O', svgEl, 'light', '[H+]');
 *
 * Reaction SMILES format:
 *   reactants > reagents > products   (exactly two '>' required)
 *   e.g.  'CC(C)(C)Br>H2O>CC(C)(C)OH'
 *         'C=C.Br2>>BrCCBr'           (empty reagent field)
 */

const ReactionRenderer = (() => {

  /* ── Options passed to the internal smiles-drawer ReactionDrawer ── */
  const REACTION_OPTS = {
    scale:      1,
    spacing:    14,
    fontSize:   12,
    fontFamily: 'Arial, Helvetica, sans-serif',
    plus: {
      size:      8,
      thickness: 1.5
    },
    arrow: {
      length:    70,
      headSize:  7,
      thickness: 1.5,
      margin:    4
    }
  };

  const MOLECULE_OPTS = {
    width:  200,
    height: 200,
    scale:  1,
    compactDrawing:    false,
    explicitHydrogens: false
  };

  /* ── Public API ─────────────────────────────────────────────────── */

  /**
   * Draw a reaction SMILES into an SVG element.
   *
   * @param {string}           reactionSmiles  e.g. 'CC(C)(C)Br>H2O>CC(C)(C)OH'
   * @param {string|SVGElement} target         SVG element or its id
   * @param {'light'|'dark'}   theme           default 'dark'
   * @param {string}           textAbove       label above arrow (default: reagents from SMILES)
   * @param {string}           textBelow       label below arrow
   * @returns {SVGElement|null}
   */
  function draw(reactionSmiles, target, theme = 'dark', textAbove = '{reagents}', textBelow = '') {
    const SD = window.SmilesDrawer;

    if (!SD) {
      console.error('ReactionRenderer: window.SmilesDrawer not found — is smiles-drawer loaded?');
      return null;
    }
    if (!SD.ReactionDrawer || !SD.ReactionParser) {
      console.error('ReactionRenderer: smiles-drawer >= 2.x required (ReactionDrawer/ReactionParser not present)');
      return null;
    }

    /* Resolve target to an SVG element */
    let svgEl = (typeof target === 'string' || target instanceof String)
      ? document.getElementById(String(target))
      : target;

    if (!svgEl) {
      console.error('ReactionRenderer: target element not found:', target);
      return null;
    }

    /* Parse the reaction SMILES */
    let reaction;
    try {
      reaction = SD.ReactionParser.parse(reactionSmiles);
    } catch (err) {
      console.error('ReactionRenderer: failed to parse reaction SMILES:', reactionSmiles, err);
      _renderError(svgEl, 'Invalid reaction SMILES');
      return null;
    }

    /* Draw into the SVG element */
    try {
      const rd = new SD.ReactionDrawer(REACTION_OPTS, Object.assign({}, MOLECULE_OPTS));
      rd.draw(reaction, svgEl, theme, null, textAbove, textBelow);

      /* Auto-size: read viewBox that ReactionDrawer writes and apply as width/height */
      _applyDimensions(svgEl);

      return svgEl;
    } catch (err) {
      console.error('ReactionRenderer: draw error:', err);
      _renderError(svgEl, 'Draw error');
      return null;
    }
  }

  /**
   * Convenience: append a new <svg> into a container element and draw the reaction.
   *
   * @param {string}           reactionSmiles
   * @param {string|HTMLElement} container    id or element to append the SVG into
   * @param {'light'|'dark'}   theme
   * @param {string}           textAbove
   * @param {string}           textBelow
   * @returns {SVGElement|null}
   */
  function drawInto(reactionSmiles, container, theme = 'dark', textAbove = '{reagents}', textBelow = '') {
    const el = (typeof container === 'string' || container instanceof String)
      ? document.getElementById(String(container))
      : container;

    if (!el) {
      console.error('ReactionRenderer.drawInto: container not found:', container);
      return null;
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.style.display = 'block';
    svg.style.margin  = '0 auto';
    el.appendChild(svg);

    return draw(reactionSmiles, svg, theme, textAbove, textBelow);
  }

  /* ── Helpers ────────────────────────────────────────────────────── */

  function _applyDimensions(svgEl) {
    const vb = svgEl.getAttribute('viewBox');
    if (!vb) return;
    const parts = vb.trim().split(/\s+/).map(Number);
    if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
      svgEl.setAttribute('width',  parts[2]);
      svgEl.setAttribute('height', parts[3]);
    }
  }

  function _renderError(svgEl, msg) {
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
    svgEl.setAttribute('width',  300);
    svgEl.setAttribute('height', 40);
    svgEl.setAttribute('viewBox', '0 0 300 40');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '10');
    text.setAttribute('y', '25');
    text.setAttribute('fill', '#f87171');
    text.setAttribute('font-size', '13');
    text.setAttribute('font-family', 'monospace');
    text.textContent = '⚠ ' + msg;
    svgEl.appendChild(text);
  }

  return { draw, drawInto };
})();
