/**
 * ReactionRenderer — thin wrapper around the OC-oecho patched smiles-drawer build.
 *
 * Requires the patched smiles-drawer bundle loaded from
 * ./vendor/smiles-drawer.min.js (exposes window.SmilesDrawer). The patch makes
 * the arrow auto-grow to fit single-line reagent text — i.e. the library will
 * NEVER wrap reagent labels to multiple rows above the arrow.
 *
 * Usage:
 *   ReactionRenderer.draw('CCO.Cl>>ClCC.O', 'my-svg-id', 'dark');
 *   ReactionRenderer.draw('CCO.Cl>>ClCC.O', svgEl, 'light', '[H⁺]');
 *
 *   // Compact mode (for LaTeX/PDF export — tighter spacing, smaller font):
 *   ReactionRenderer.draw(smiles, svgEl, 'light', label, '', { compact: true });
 */

const ReactionRenderer = (() => {

  /* Default smiles-drawer options for the web UI. */
  const REACTION_OPTS_DEFAULT = {
    scale:      1,
    spacing:    14,
    fontSize:   12,
    fontFamily: 'Arial, Helvetica, sans-serif',
    plus:  { size: 8,  thickness: 1.5 },
    arrow: { length: 70, headSize: 7, thickness: 1.5, margin: 4 }
  };

  /* Compact options for the LaTeX PNG export.
     Arrow.length here is the *minimum* — the patched ReactionDrawer auto-grows
     it to fit the actual reagent label width, so this stays as a sensible
     lower bound for short labels like "H2O". */
  const REACTION_OPTS_COMPACT = {
    scale:      0.85,
    spacing:    8,
    fontSize:   8,
    fontFamily: 'Arial, Helvetica, sans-serif',
    plus:  { size: 6,  thickness: 1.2 },
    arrow: { length: 50, headSize: 5, thickness: 1.2, margin: 2 }
  };

  /* Molecule rendering options.
     For compact (export) mode we PIN bondLength to a fixed value so every
     reaction draws atoms at the same physical scale — this is what #1
     ("consistent scale, not size") requires. The LaTeX side then uses
     \includegraphics[scale=...] with no width/height clamping, so a small
     molecule produces a small image and a large molecule a large image. */
  const MOLECULE_OPTS_DEFAULT = {
    width:  200,
    height: 200,
    scale:  1,
    compactDrawing: false,
    explicitHydrogens: false
  };

  const MOLECULE_OPTS_COMPACT = {
    width:  140,
    height: 140,
    scale:  0.85,
    bondLength: 15,           // fixed across all export images
    bondThickness: 0.7,
    compactDrawing: true,
    explicitHydrogens: false,
    fontSizeLarge: 5.5,
    fontSizeSmall: 3.5
  };

  /* Public API ─────────────────────────────────────────────────────── */

  /**
   * Draw a reaction SMILES into an SVG element.
   *
   * @param {string} reactionSmiles  e.g. 'CC(C)(C)Br>H2O>CC(C)(C)OH'
   * @param {string|SVGElement} target  SVG element or its id
   * @param {'light'|'dark'} theme  default 'dark'
   * @param {string} textAbove  label above the arrow (default: reagents from SMILES)
   * @param {string} textBelow  label below the arrow
   * @param {object} [opts]  optional rendering tweaks: { compact: boolean }
   * @returns {SVGElement|null}
   */
  function draw(reactionSmiles, target, theme = 'dark', textAbove = '{reagents}', textBelow = '', opts) {
    const SD = window.SmilesDrawer;
    opts = opts || {};
    const compact = !!opts.compact;

    if (!SD) {
      console.error('ReactionRenderer: window.SmilesDrawer not found — is smiles-drawer loaded?');
      return null;
    }
    if (!SD.ReactionDrawer || !SD.ReactionParser) {
      console.error('ReactionRenderer: smiles-drawer 2.x ReactionDrawer/ReactionParser not present');
      return null;
    }

    let svgEl = (typeof target === 'string' || target instanceof String)
      ? document.getElementById(String(target))
      : target;
    if (!svgEl) {
      console.error('ReactionRenderer: target element not found:', target);
      return null;
    }

    let reaction;
    try {
      reaction = SD.ReactionParser.parse(reactionSmiles);
    } catch (err) {
      console.error('ReactionRenderer: failed to parse reaction SMILES:', reactionSmiles, err);
      _renderError(svgEl, 'Invalid reaction SMILES');
      return null;
    }

    const reactionOpts  = compact ? REACTION_OPTS_COMPACT  : REACTION_OPTS_DEFAULT;
    const moleculeOpts  = compact ? MOLECULE_OPTS_COMPACT  : MOLECULE_OPTS_DEFAULT;
    /* Flatten any embedded newlines in the label — the patched
       writeText never wraps, but \n in source would still produce
       multiple tspans. */
    const flatten = (s) => (s || '').replace(/\s*\n\s*/g, ', ').replace(/\s+/g, ' ').trim();
    const labelAbove = flatten(textAbove);
    const labelBelow = compact ? '' : flatten(textBelow);

    try {
      const rd = new SD.ReactionDrawer(reactionOpts, Object.assign({}, moleculeOpts));
      rd.draw(reaction, svgEl, theme, null, labelAbove, labelBelow);

      /* smiles-drawer v2 leaves a viewBox that often clips arrow labels at
         the top and text annotations on the sides. Recompute a tighter
         bbox that includes the text overflow, and disable per-child
         clipping by setting overflow="visible" on nested SVGs. */
      _fitReactionViewBox(svgEl, reactionOpts.fontSize, compact ? 2 : 4);

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
  function drawInto(reactionSmiles, container, theme = 'dark', textAbove = '{reagents}', textBelow = '', opts) {
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
    return draw(reactionSmiles, svg, theme, textAbove, textBelow, opts);
  }

  /* Helpers ─────────────────────────────────────────────────────────── */

  /**
   * Recompute the SVG viewBox to encompass the actual rendered content,
   * including <text> elements that overflow the declared dimensions of
   * smiles-drawer's nested <svg> sub-elements. See git history for the
   * original rationale (arrow labels were getting clipped at top).
   */
  function _fitReactionViewBox(svgEl, fontSize, padding) {
    fontSize = fontSize || 12;
    padding  = padding  != null ? padding : 4;

    const nested = svgEl.querySelectorAll('svg');
    for (let i = 0; i < nested.length; i++) {
      nested[i].setAttribute('overflow', 'visible');
    }
    svgEl.setAttribute('overflow', 'visible');

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

    if (!isFinite(minX) || !isFinite(minY)) return;

    minX -= padding; minY -= padding;
    maxX += padding; maxY += padding;
    const W = maxX - minX, H = maxY - minY;

    svgEl.setAttribute('viewBox', minX + ' ' + minY + ' ' + W + ' ' + H);
    svgEl.setAttribute('width',  W);
    svgEl.setAttribute('height', H);
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
