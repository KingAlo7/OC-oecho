/**
 * ReactionRenderer — thin wrapper around smiles-drawer v2 ReactionDrawer.
 *
 * Requires smiles-drawer >= 2.x loaded on the page (exposes window.SmilesDrawer).
 *
 * Usage:
 *   ReactionRenderer.draw('CCO.Cl>>ClCC.O', 'my-svg-id', 'dark');
 *   ReactionRenderer.draw('CCO.Cl>>ClCC.O', svgEl, 'light', '[H⁺]');
 *
 * Reaction SMILES format:
 *   reactants > reagents > products
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
      length:   70,
      headSize: 7,
      thickness: 1.5,
      margin:   4
    }
  };

  const MOLECULE_OPTS = {
    width:  200,
    height: 200,
    scale:  1,
    compactDrawing: false,
    explicitHydrogens: false
  };

  /* ── Public API ─────────────────────────────────────────────────── */

  /**
   * Draw a reaction SMILES into an SVG element.
   *
   * @param {string} reactionSmiles  e.g. 'CC(C)(C)Br>H2O>CC(C)(C)OH'
   * @param {string|SVGElement} target  SVG element or its id
   * @param {'light'|'dark'} theme  default 'dark'
   * @param {string} textAbove  label above the arrow (default: reagents from SMILES)
   * @param {string} textBelow  label below the arrow
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

      /* smiles-drawer v2 leaves a viewBox that often clips arrow labels at
         the top and text annotations on the sides. Recompute a tighter
         bbox that includes the text overflow, and disable per-child
         clipping by setting overflow="visible" on nested SVGs. */
      _fitReactionViewBox(svgEl, REACTION_OPTS.fontSize, 4);

      return svgEl;
    } catch (err) {
      console.error('ReactionRenderer: draw error:', err);
      _renderError(svgEl, 'Draw error');
      return null;
    }
  }

  /**
   * Convenience: append a new <svg> into a container element and draw the reaction.
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

  /**
   * Recompute the SVG viewBox to encompass the *actual* rendered content,
   * including <text> elements that overflow the declared dimensions of
   * smiles-drawer's nested <svg> sub-elements.
   *
   * Why this exists: ReactionDrawer assembles a horizontal sequence of
   * nested <svg> containers (one per molecule, plus arrow + labels). It
   * sets the outer viewBox to the union of declared child box widths/
   * heights — but arrow labels are positioned at negative y (above the
   * arrow) and may also extend left/right of their declared container
   * width because text width is hard to predict. This results in:
   *   - top of arrow label clipped (negative y outside viewBox)
   *   - sides of long labels clipped by per-child SVG bounds
   *
   * Fix: walk the children, estimate text overflow conservatively, and
   * widen viewBox + remove per-child clipping.
   */
  function _fitReactionViewBox(svgEl, fontSize, padding) {
    fontSize = fontSize || 12;
    padding  = padding  != null ? padding : 4;

    // 1) Disable clipping on every nested <svg> so labels extending past
    //    their declared width/height are visible rather than cut off.
    const nested = svgEl.querySelectorAll('svg');
    for (let i = 0; i < nested.length; i++) {
      nested[i].setAttribute('overflow', 'visible');
    }
    svgEl.setAttribute('overflow', 'visible');

    // 2) Approximate text width: Arial-ish average glyph ≈ 0.6 * fontSize.
    //    Use 0.62 with extra padding to be safe across font fallbacks.
    const TEXT_W = (s) => (s || '').length * fontSize * 0.62;

    let minX =  Infinity, minY =  Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    const children = svgEl.children;
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      const cx = parseFloat(c.getAttribute('x')) || 0;
      const cy = parseFloat(c.getAttribute('y')) || 0;
      let   cw = parseFloat(c.getAttribute('width'));
      let   ch = parseFloat(c.getAttribute('height'));
      if (!isFinite(cw)) cw = 0;
      if (!isFinite(ch)) ch = 0;

      // Compute text overflow inside this child
      let extraL = 0, extraR = 0, extraT = 0, extraB = 0;
      const texts = c.querySelectorAll ? c.querySelectorAll('text') : [];
      for (let j = 0; j < texts.length; j++) {
        const t = texts[j];
        const w = TEXT_W(t.textContent || '');
        let tx = 0, ty = 0;
        const tr = t.getAttribute('transform');
        const m  = tr && tr.match(/translate\(\s*(-?[\d.]+)(?:[,\s]+(-?[\d.]+))?/);
        if (m) {
          tx = parseFloat(m[1]) || 0;
          if (m[2] != null) ty = parseFloat(m[2]) || 0;
        }
        const anchor = t.getAttribute('text-anchor');
        let left, right;
        if (anchor === 'middle')   { left = tx - w/2; right = tx + w/2; }
        else if (anchor === 'end') { left = tx - w;   right = tx; }
        else                       { left = tx;       right = tx + w; }
        // Baseline-aware vertical extent: most of the glyph is above the baseline.
        const top = ty - fontSize * 0.85;
        const bot = ty + fontSize * 0.35;
        if (left  < extraL)        extraL = left;
        if (right - cw > extraR)   extraR = right - cw;
        if (top   < extraT)        extraT = top;
        if (bot - ch > extraB)     extraB = bot - ch;
      }

      const cl = cx + Math.min(0,  extraL);
      const cr = cx + Math.max(cw, cw + extraR);
      const ct = cy + Math.min(0,  extraT);
      const cb = cy + Math.max(ch, ch + extraB);

      if (cl < minX) minX = cl;
      if (ct < minY) minY = ct;
      if (cr > maxX) maxX = cr;
      if (cb > maxY) maxY = cb;
    }

    if (!isFinite(minX) || !isFinite(minY)) return; // no children

    minX -= padding; minY -= padding;
    maxX += padding; maxY += padding;
    const W = maxX - minX, H = maxY - minY;

    svgEl.setAttribute('viewBox', minX + ' ' + minY + ' ' + W + ' ' + H);
    svgEl.setAttribute('width',  W);
    svgEl.setAttribute('height', H);
    // Keep CSS style in sync so in-DOM rendering matches.
    svgEl.style.width  = W + 'px';
    svgEl.style.height = H + 'px';
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
