/**
 * ReactionRenderer — thin wrapper around smiles-drawer v2 ReactionDrawer.
 *
 * Requires smiles-drawer >= 2.x loaded on the page (exposes window.SmilesDrawer).
 *
 * Usage:
 *   ReactionRenderer.draw('CCO.Cl>>ClCC.O', 'my-svg-id', 'dark');
 *   ReactionRenderer.draw('CCO.Cl>>ClCC.O', svgEl, 'light', '[H⁺]');
 *
 *   // Compact mode (for LaTeX/PDF export — tighter spacing, smaller font):
 *   ReactionRenderer.draw(smiles, svgEl, 'light', label, '', { compact: true });
 *
 *   // Compact mode with custom overrides (used by the export page sliders
 *   // for live-tunable bondLength, bondThickness, arrow length, etc.):
 *   ReactionRenderer.draw(smiles, svgEl, 'light', label, '', {
 *     compact: true,
 *     reactionOpts: { arrow: { length: 60 } },     // shallow-merged into base
 *     moleculeOpts: { bondLength: 28, bondThickness: 1.3 }
 *   });
 *
 * Reaction SMILES format:
 *   reactants > reagents > products
 *   e.g.  'CC(C)(C)Br>H2O>CC(C)(C)OH'
 *         'C=C.Br2>>BrCCBr'           (empty reagent field)
 */

const ReactionRenderer = (() => {

  /* ── Default smiles-drawer options for the web UI ─────────────── */
  const REACTION_OPTS_DEFAULT = {
    scale:      1,
    spacing:    14,
    fontSize:   12,
    fontFamily: 'Arial, Helvetica, sans-serif',
    plus:  { size: 8,  thickness: 1.5 },
    arrow: { length: 70, headSize: 7, thickness: 1.5, margin: 4 }
  };

  /* ── Compact options used for the LaTeX PNG export.
        Goal: thinner arrow, smaller label font, shorter horizontal
        spread so the rendered structure fits a 2-cm-tall row in a
        50% column. ──────────────────────────────────────────────── */
  const REACTION_OPTS_COMPACT = {
    scale:      0.85,
    spacing:    8,
    fontSize:   9,
    fontFamily: 'Arial, Helvetica, sans-serif',
    plus:  { size: 6,  thickness: 1.2 },
    arrow: { length: 42, headSize: 5, thickness: 1.2, margin: 2 }
  };

  const MOLECULE_OPTS_DEFAULT = {
    width:  200,
    height: 200,
    scale:  1,
    /* Heteroatom label sizing. smiles-drawer's stock fontSizeLarge is
       6 (SVG units); 9 lands at a chemistry-textbook size against the
       default bondLength. fontSizeSmall (sub/super) ~0.7×. */
    fontSizeLarge: 9,
    fontSizeSmall: 6,
    compactDrawing: false,
    explicitHydrogens: false
  };

  /* Compact molecule options for PDF export.
   *
   * bondLength is the key knob for the atom-label-to-bond-length ratio
   * (chemistry-textbook appearance). smiles-drawer's default atom-label
   * font is ~13px; setting bondLength=24 gives a 24:13 ≈ 1.85 ratio,
   * which sits in the standard ACS/IUPAC chemistry-drawing range
   * (typically 1.5-2.0). Smaller bondLength would make letters look
   * oversized; larger would make them look cramped between long bonds.
   *
   * bondThickness=1.0 keeps bond lines crisp at the final PDF size
   * without overpowering the atom labels. */
  const MOLECULE_OPTS_COMPACT = {
    width:  140,
    height: 140,
    scale:  0.85,
    bondLength:     24,
    bondThickness:  1.0,
    /* See MOLECULE_OPTS_DEFAULT — same heteroatom size to keep web
       and export visually consistent; the export slider overrides
       per-render. */
    fontSizeLarge:  9,
    fontSizeSmall:  6,
    compactDrawing: true,
    explicitHydrogens: false
  };

  /* ── LaTeX-style label rendering ──────────────────────────────────
     Reagent labels can contain LaTeX-style sub/superscripts, e.g.
     "[Ag(NH_3)_2]^{1+}" or "H_2SO_4". We pre-render the label string
     into Unicode subscript/superscript glyphs BEFORE passing it to
     smiles-drawer. This keeps the label on a single line of normal-
     sized text — no tspan tricks, no bbox expansion that would push
     the label above the arrow. Survives PNG rasterisation cleanly
     because there's no SVG-level positioning to lose.

     Syntax: `_{xxx}` / `^{xxx}` for multi-char, `_x` / `^x` for single.
     Unsupported chars (letter subscripts beyond the Unicode set) fall
     back to literal text — rare enough not to bother with tspans. */

  const _SUB_MAP = {
    '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
    '+':'₊','-':'₋','=':'₌','(':'₍',')':'₎',
    'a':'ₐ','e':'ₑ','h':'ₕ','i':'ᵢ','j':'ⱼ','k':'ₖ','l':'ₗ','m':'ₘ','n':'ₙ',
    'o':'ₒ','p':'ₚ','r':'ᵣ','s':'ₛ','t':'ₜ','u':'ᵤ','v':'ᵥ','x':'ₓ'
  };
  const _SUP_MAP = {
    '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
    '+':'⁺','-':'⁻','=':'⁼','(':'⁽',')':'⁾','n':'ⁿ','i':'ⁱ'
  };

  function _toSubSup(text, map) {
    let out = '';
    for (const c of text) out += (map[c] || c);
    return out;
  }

  function _latexToUnicode(s) {
    if (!s) return s;
    return s.replace(
      /_\{([^}]*)\}|\^\{([^}]*)\}|_([A-Za-z0-9+\-=()])|\^([A-Za-z0-9+\-=()])/g,
      (_, subBrace, supBrace, subOne, supOne) => {
        if (subBrace !== undefined) return _toSubSup(subBrace, _SUB_MAP);
        if (subOne   !== undefined) return _toSubSup(subOne,   _SUB_MAP);
        if (supBrace !== undefined) return _toSubSup(supBrace, _SUP_MAP);
        if (supOne   !== undefined) return _toSubSup(supOne,   _SUP_MAP);
        return '';
      }
    );
  }

  /* Visible character length of a (rendered) label — used to size the
     reaction arrow so the label fits in one line. Operates on the
     Unicode-converted string so subscripts count as one glyph each. */
  function _visibleLength(s) {
    if (!s) return 0;
    return [..._latexToUnicode(s)].length;
  }

  /* Swap small-molecule atom labels rendered with the heteroatom on the
     wrong side. smiles-drawer always places H counts after the central
     atom (e.g. `O` → "OH₂", `Br` → "BrH"), which clashes with the
     conventional "H₂O", "HBr" written form for these reactants/reagents.
     We patch the text nodes after drawing. Only the small molecules
     where H-first is conventional are touched. */
  const _LABEL_SWAPS = {
    'OH₂':  'H₂O',
    'OH2':  'H₂O',
    'OH₃⁺': 'H₃O⁺',
    'OH3+': 'H₃O⁺',
    'BrH':  'HBr',
    'ClH':  'HCl',
    'FH':   'HF',
    'IH':   'HI'
  };

  function _swapAtomLabels(svgEl) {
    const texts = svgEl.querySelectorAll('text');
    for (let i = 0; i < texts.length; i++) {
      const t = texts[i];
      const v = t.textContent;
      if (!_LABEL_SWAPS[v]) continue;
      /* Clear any tspan segmentation smiles-drawer used (those tspans
         carry no positioning attributes for these small molecules) and
         set the swapped string as the text content. */
      while (t.firstChild) t.removeChild(t.firstChild);
      t.textContent = _LABEL_SWAPS[v];
    }
  }

  /* Auto-size the reaction arrow so the longest label fits on one line.
     Estimate visible width via stripped length × char width (~0.55 ×
     fontSize for Helvetica/Arial). Two lines only when the upper clamp
     can't fit the text — at that point smiles-drawer's own line break
     takes over. MIN keeps short labels from looking cramped. */
  function _autoArrowLength(textAbove, textBelow, fontSize, compact) {
    const longest = Math.max(_visibleLength(textAbove), _visibleLength(textBelow));
    const charW = fontSize * 0.55;
    const padding = 16;
    const MIN = compact ? 42 : 60;
    const MAX = compact ? 180 : 220;
    return Math.max(MIN, Math.min(MAX, longest * charW + padding));
  }

  /* Shallow-merge override into base, one level deep. Nested objects like
     `arrow: { length, headSize, ... }` are merged property-by-property so
     overriding just `arrow.length` doesn't clobber `arrow.headSize` etc. */
  function _mergeOpts(base, override) {
    if (!override) return Object.assign({}, base);
    const out = Object.assign({}, base);
    for (const key of Object.keys(override)) {
      const ov = override[key];
      if (ov && typeof ov === 'object' && !Array.isArray(ov) &&
          base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
        out[key] = Object.assign({}, base[key], ov);
      } else {
        out[key] = ov;
      }
    }
    return out;
  }

  /* ── Public API ─────────────────────────────────────────────────── */

  /**
   * Draw a reaction SMILES into an SVG element.
   *
   * @param {string} reactionSmiles  e.g. 'CC(C)(C)Br>H2O>CC(C)(C)OH'
   * @param {string|SVGElement} target  SVG element or its id
   * @param {'light'|'dark'} theme  default 'dark'
   * @param {string} textAbove  label above the arrow (default: reagents from SMILES)
   * @param {string} textBelow  label below the arrow
   * @param {object} [opts]  optional rendering tweaks:
   *   - compact:        boolean — use compact (export) base profile
   *   - reactionOpts:   partial reaction options to override the base profile
   *                     (e.g. { arrow: { length: 60 }, fontSize: 11 })
   *   - moleculeOpts:   partial molecule options to override the base profile
   *                     (e.g. { bondLength: 28, bondThickness: 1.3 })
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

    /* Pick option profile + apply caller overrides. textBelow is passed
       through in both default and compact modes — callers signal intent
       by sending an empty string when no second-line label is wanted. */
    const baseReactionOpts  = compact ? REACTION_OPTS_COMPACT  : REACTION_OPTS_DEFAULT;
    const baseMoleculeOpts  = compact ? MOLECULE_OPTS_COMPACT  : MOLECULE_OPTS_DEFAULT;
    const reactionOpts      = _mergeOpts(baseReactionOpts, opts.reactionOpts);
    const moleculeOpts      = _mergeOpts(baseMoleculeOpts, opts.moleculeOpts);
    /* Pre-render LaTeX markup to Unicode subscript/superscript glyphs so
       smiles-drawer sees a normal single-line label and lays it out
       correctly above/below the arrow. */
    const labelAbove        = _latexToUnicode(textAbove);
    const labelBelow        = _latexToUnicode(textBelow);

    /* Auto-size the arrow to fit the label unless the caller explicitly
       set arrow.length in their override. Centralizes the dynamic-arrow
       behaviour so admin / web index / export all benefit. */
    const callerOverrodeArrow =
      opts.reactionOpts && opts.reactionOpts.arrow &&
      typeof opts.reactionOpts.arrow.length === 'number';
    if (!callerOverrodeArrow) {
      reactionOpts.arrow = Object.assign({}, reactionOpts.arrow, {
        length: _autoArrowLength(labelAbove, labelBelow, reactionOpts.fontSize, compact)
      });
    }

    /* Draw into the SVG element */
    try {
      const rd = new SD.ReactionDrawer(reactionOpts, Object.assign({}, moleculeOpts));
      rd.draw(reaction, svgEl, theme, null, labelAbove, labelBelow);

      /* Swap small-molecule atom labels (OH₂ → H₂O, BrH → HBr, …) to
         the conventional written form. Runs before viewBox fit so
         overflow is computed against the final labels. */
      _swapAtomLabels(svgEl);

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
