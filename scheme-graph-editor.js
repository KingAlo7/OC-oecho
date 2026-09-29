/**
 * SchemeGraphEditor — drag-and-drop SVG editor for synthesis schemes.
 *
 * Data model (preserves admin's existing scheme format):
 *   scheme = {
 *     nodes: [{ id, label, name, smiles, mol, given, explanation,
 *               note, related_reaction_id, x?, y? }],
 *     edges: [{ from: [nodeId...], to: nodeId, reagent_above, reagent_below,
 *               reagent_mol, reagent_mol_below, reagent_mol_size, join, equilibrium,
 *               plus, curve, curve_in, curve_out, curve_in_mol, curve_out_mol, rxn }]
 *   }
 *   Arrows from the same compounds that carry the same things (or share
 *   `rxn`) are ONE reaction; see rxGroupKey.
 *
 * UI (editor):
 *   - SVG canvas with pan (drag empty area) and zoom (Ctrl + wheel)
 *   - A click on an arrow selects its whole reaction; its text is typed
 *     in place; Delete removes the reaction
 *   - Drag from a node's "→" handle onto another node: a new arrow; onto
 *     an arrow: one more educt of that reaction. The handle on a selected
 *     arrow, dragged onto a node: one more product
 *   - A node on no arrow, dragged onto an arrow: its structure (or name)
 *     goes over / under the arrow or onto an end of the cofactor curve
 *     (drop zones light up); a structure on an arrow can be dragged off
 *     again (a node) or elsewhere; double click opens Ketcher
 *   - In an auto layout a dragged node returns to its place; "✥ Frei"
 *     (layout 'manual') keeps nodes where they are dropped, and an educt
 *     (product) of a "+" reaction takes the other educts (products) along
 *
 * Modes:
 *   `opts.readOnly: true` switches to the quiz viewer. The viewer draws
 *   structures WITHOUT a frame, on plain ground, the way the exam sheets
 *   do; arrows attach to the drawn molecule rather than to an invisible
 *   box. Zoom controls sit in a slim rail on the right. Nodes are
 *   clickable and emit `onNodeClick(node)`.
 *
 *   `opts.revealedNodeIds: Set<string>` (viewer only) pre-marks hidden
 *   nodes as already-revealed.
 *
 * Layout and arrows (auto layout, see planLayout):
 *   - edges are grouped into reactions; the main chain runs straight on
 *     and turns down at the width limit
 *   - several educts of one reaction are equal (merge: parallel lines into
 *     a bus, one shaft with the text); several products are split equally
 *     (text on the shaft, short branches); a co-reactant above the arrow
 *     is the fallback; even forks close up to neighbouring rows/columns
 *     with branches of equal length; side reactions fork off the shaft or
 *     leave down / up / back
 *   - a branch that comes back into the chain gets its own lane
 *   - arrows that don't fit the grid are routed around structures and
 *     around other arrows (a crossing costs more than a detour), after
 *     all the others; an arrowhead always has a straight run
 *   - an equilibrium (edge.equilibrium) is one straight line, slanted
 *     when the compounds are not in one row or column
 *   - edge.plus draws the reaction as an equation, "A + B → C + D"
 *     (stacked vertically on narrow screens)
 *   - edge.curve adds a cofactor curve (curve_in → curve_out, each end
 *     text and/or a structure) that touches the shaft; in the quiz a half
 *     without anything on it is left off; a structure on the arrow
 *     (reagent_mol) follows the compounds' bond length and the arrow
 *     grows to carry it
 *   - several plans are routed off-screen; the one with the fewest
 *     crossings, bends and long detours is kept
 *   - reagent text is placed last and avoids structures, other text and
 *     other arrows, always on its own arrow
 *
 * Free layout ("layout": "manual", "✥ Frei" in the editor): compounds stay
 * where they are, and every feature above still draws:
 *   - a reaction with several educts or products is ONE drawing
 *     (_drawReaction): educts behind it run into a bus, one standing
 *     beside the shaft joins it where it stands, one shaft carries the
 *     text, curve and structure on the arrow, a split bus sends a branch
 *     to each product. It heads the way most educts are behind the
 *     products (then: a straight shaft, then from the educts' centre to
 *     the products'); where no way fits, the pieces meet in a hub and are
 *     routed around structures and other arrows; an equilibrium keeps a
 *     straight shaft with both half-arrows on it, a Y its slanted joins
 *   - a "+" reaction is an equation: "+" between neighbouring educts and
 *     between neighbouring products, one arrow from group to group
 *   - single arrows: separate arrows from one compound share a stub,
 *     separate arrows into one compound meet in a junction
 *
 * Callbacks:
 *   onChange(), onSelectNode(node|null), onSelectEdge(edge|null, idx),
 *   onRequestStructEdit(node), onRequestEdgeStructEdit(edge, idx, slot),
 *   onNodeClick(node), onHint(message)
 *
 * Public methods:
 *   refresh(), refreshNode(id), autoLayout(), addNode(opts), focusNode(id),
 *   reactionOf(idx), updateReaction(idx, patch), addReactionEduct /
 *   removeReactionEduct / addReactionProduct / removeReactionProduct(idx, id),
 *   deleteReaction(idx), attachNode(id, idx, zone), detachStructure(idx,
 *   slot, at), moveStructure(idx, slot, to), setRevealed(id,b),
 *   resetReveals(), countHidden(), reflow(force), fitToContent(), destroy()
 */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const NODE_W = 168;
  const NODE_H = 142;
  const NODE_RX = 10;
  const HANDLE_R = 7;
  const ARROW_HEAD = 9;

  /* ── Textbook-style arrow + label metrics ───────────────────────
     Modelled on the ÖChO Bundeswettbewerb exam sheets: the reagent
     sits centred directly over the arrow shaft and the conditions sit
     centred directly under it. Long reagent lists wrap onto stacked
     lines rather than running past the arrowhead, so the shaft is
     always at least as long as the widest label line. */
  const LABEL_FONT_ABOVE = "500 11px 'Segoe UI', system-ui, -apple-system, sans-serif";
  const LABEL_FONT_BELOW = "500 10px 'Segoe UI', system-ui, -apple-system, sans-serif";
  const LABEL_LINE_H   = 15;    // conservative height of one stacked label line
  const LABEL_MAX_W    = 124;   // px — wrap a label line wider than this
  const LABEL_PAD_X    = 14;    // px of shaft that must stay clear of text
  const LABEL_GAP      = 5;     // px between shaft and the text's visual edge
  const ARROW_MIN      = 74;    // px — shortest arrow we ever draw
  const ARROW_MAX      = 210;   // px — longest; beyond this we wrap harder
  const STACK_GAP      = 26;    // px between nodes stacked in one column

  /* Sub/superscripts are drawn with dy shifts, so their exact overhang
     is known and the label can be kept a FIXED distance off the shaft
     even when the line nearest the shaft carries a subscript. */
  const SUB_DROP       = 3.2;   // px a subscript's baseline sits below the line's
  const SUP_RISE       = 4.4;   // px a superscript's baseline sits above it
  const CAP_H          = 8;     // cap height of the 10–11 px label font
  const LINE_LEAD      = 3.5;   // px between stacked label lines
  const JUNCTION_STUB  = 16;    // px of shared shaft before a split arrow fans out
  const VLABEL_DX      = 8;     // px between a vertical shaft and its label block
  const JUNCTION_OFF   = 30;    // px from a gap's start to the point where things join
  const GAP_EMPTY      = 40;
  const Y_RUN          = 120;   // px of diagonal a "Y" arrow spends before/after its junction
  const CELL_MAX_W     = 250;   // viewer: largest structure is shrunk to fit this …
  const CELL_MAX_H     = 170;   // … and every other one by the same factor
  const NATURAL_BOX    = 2400;  // oversized, so OCL draws at its own bond length
  /* A structure on an arrow (reagent_mol) is drawn at EMOL_REL of the
     compounds' own scale — the same bond length as on the sheet, a bit
     smaller — and the arrow grows to carry it. Only a structure that
     would still exceed EMOL_MAX_W × EMOL_MAX_H is shrunk further.
     `reagent_mol_size` on the arrow overrides EMOL_REL. */
  const EMOL_W         = 86;    // stand-in size while OpenChemLib is not there
  const EMOL_H         = 58;
  const EMOL_GAP       = 4;     // px between that structure and the text below it
  const EMOL_REL       = 0.8;
  const EMOL_MAX_W     = 180;
  const EMOL_MAX_H     = 110;
  const EQ_GAP         = 2.5;   // px each half-arrow of an equilibrium sits off the route
  const MIN_FIT        = 0.72;  // don't pick a grid that needs shrinking below this
  /* Cofactor curve (curve: true, curve_in / curve_out): an arc under the
     shaft that touches it in the middle, from the cofactor going in to
     the one coming out, arrowhead at its end. */
  const CURVE_D        = 16;    // px the arc's ends reach away from the shaft
  const CURVE_MIN_W    = 56;    // px shortest chord
  const CURVE_LABEL_H  = 14;    // px of the label line at either end
  const PLUS_W         = 34;    // px gap that carries the "+" of an equation
  /* Structures an arrow can carry, by slot: on the arrow ('mol', over or
     under it) and on the two ends of its cofactor curve. */
  const SLOT_FIELD     = { mol: 'reagent_mol', in: 'curve_in_mol', out: 'curve_out_mol' };
  /* Where a compound dragged onto an arrow can go (see _dropZones). */
  const ZONE_CAP       = { above: 'über den Pfeil', below: 'unter den Pfeil', in: 'in den Bogen', out: 'aus dem Bogen' };
  /* A split (one reaction, several products): the shaft before the bus
     takes whatever length the gap has, the branches after it stay within
     BRANCH_MIN … BRANCH_MAX. */
  const BRANCH_MIN     = 26;
  const BRANCH_MAX     = 56;
  const BRANCH_W       = 40;    // what the layout reserves for the branches
  const TAIL_MIN       = 26;    // px of straight line an arrowhead needs after the last bend
  const SNAP           = 12;    // px within which a dragged compound snaps into a partner's row / column (free layout)

  /* Viewer geometry. OCL is asked for a cropped SVG, and its reported
     size becomes the node's visible footprint. */
  const V_FO_X  = 4;
  const V_FO_Y  = 4;
  const V_FO_W  = NODE_W - 8;
  const V_FO_H  = NODE_H - 34;
  const V_CY    = V_FO_Y + V_FO_H / 2;   // horizontal arrows run on this line
  const V_GAP   = 7;                     // air between molecule and arrow tip
  const PH_SIZE = 54;                    // "?" placeholder footprint
  const V_LABEL_H = 15;                  // label line under a structure
  const V_NAME_H  = 13;                  // name line under the label
  const TEXT_NODE_FONT = "600 15px 'Segoe UI', system-ui, sans-serif";   // .sg-text-node
  const textNodeWidth = n => Math.ceil(measureText(plainChemText(n.text), TEXT_NODE_FONT)) + 6;

  /* Canvas-based text measurement: synchronous and side-effect free. */
  let _measureCtx = null;
  function measureText(text, font) {
    if (!_measureCtx) {
      try { _measureCtx = document.createElement('canvas').getContext('2d'); }
      catch (_) { _measureCtx = null; }
    }
    if (!_measureCtx) return String(text).length * 6.2;
    _measureCtx.font = font;
    return _measureCtx.measureText(String(text)).width;
  }

  /* Split a reagent string into stacked lines. Explicit newlines (real
     or the two-character "\n" some data carries) win; otherwise break on
     the separators chemists already write and pack up to LABEL_MAX_W. */
  function wrapLabel(text, font) {
    const raw = String(text == null ? '' : text);
    if (!raw.trim()) return [];
    const explicit = raw.split(/\\n|\n/).map(s => s.trim()).filter(Boolean);
    const out = [];
    for (const chunk of explicit) {
      if (measureText(plainChemText(chunk), font) <= LABEL_MAX_W) { out.push(chunk); continue; }
      const atoms = chunk.split(/(?<=[;,])\s+|(?<=\s\/)\s+|\s+(?=dann\s)|\s+(?=\d\.\s)|\s+(?=\d\)\s)/)
                         .map(s => s.trim()).filter(Boolean);
      let line = '';
      for (const a of atoms) {
        const cand = line ? line + ' ' + a : a;
        if (line && measureText(plainChemText(cand), font) > LABEL_MAX_W) { out.push(line); line = a; }
        else line = cand;
      }
      if (line) out.push(line);
    }
    return out;
  }

  /* Sub/superscript parsing lives in chem-text.js (window.ChemText). */
  const CT = window.ChemText;

  /* "CH_3CH_2MgBr" / "[Ag(NH_3)_2]^{+}" → text with real sub/superscripts.
     Uses dy (honoured everywhere) instead of baseline-shift. */
  function setChemText(textEl, str) {
    let shift = 0;
    for (const k of CT.tokenize(str)) {
      if (k.t === 'text') {
        const t = svg('tspan', shift ? { dy: -shift } : {});
        shift = 0;
        t.textContent = k.v;
        textEl.appendChild(t);
      } else {
        const d = k.t === 'sub' ? SUB_DROP : -SUP_RISE;
        const t = svg('tspan', { dy: d - shift, 'font-size': '76%' });
        shift = d;
        t.textContent = k.v;
        textEl.appendChild(t);
      }
    }
    return textEl;
  }

  function chemFlags(str) { return CT.flags(str); }

  /* The markup is invisible on screen, so measure what the reader sees. */
  function plainChemText(str) { return CT.plain(str); }

  /* Vertical extent of one label line relative to its baseline. */
  function lineExtent(txt) {
    const f = chemFlags(txt);
    return { up: CAP_H + (f.sup ? SUP_RISE : 0), down: f.sub ? SUB_DROP + 0.8 : 0 };
  }

  /* Full metrics for one edge's labels: text above and below, the
     structure on the arrow (sized from `f`, the scale the compounds of
     the scheme are drawn at) and the cofactor curve. `editing`: the
     editor, where an empty end of the curve keeps room for its field. */
  function edgeLabelMetrics(edge, f, editing) {
    const above = wrapLabel(edge && edge.reagent_above, LABEL_FONT_ABOVE);
    const below = wrapLabel(edge && edge.reagent_below, LABEL_FONT_BELOW);
    const wa = Math.max(0, ...above.map(l => measureText(plainChemText(l), LABEL_FONT_ABOVE)));
    const wb = Math.max(0, ...below.map(l => measureText(plainChemText(l), LABEL_FONT_BELOW)));
    const mol = !!(edge && edge.reagent_mol);
    // reagent_mol_below: the structure hangs under the arrow (after the below text)
    const molBelow = mol && !!edge.reagent_mol_below;
    const ms = mol ? emolSize(edge, f) : null;
    const curve = curveMetrics(edge, f, editing);
    const tw = Math.max(wa, wb, ms ? ms.w : 0);
    const w = Math.max(tw, curve ? curve.span : 0);
    const text = (above.length + below.length) * LABEL_LINE_H + (ms ? ms.h + EMOL_GAP : 0);
    return {
      above, below, edge, mol, molBelow, curve,
      molW: ms ? ms.w : 0, molH: ms ? ms.h : 0,
      any: mol || !!curve || above.length > 0 || below.length > 0,
      width: w, tw,
      // across a horizontal shaft (text + curve) and along a vertical one
      blockH: text + (curve ? curve.H : 0),
      vLen: Math.max(text, curve ? curve.along : 0),
      shaft: Math.max(ARROW_MIN, Math.min(ARROW_MAX, Math.ceil(w) + LABEL_PAD_X * 2))
    };
  }

  /* The cofactor curve of an arrow. Each end carries text and/or a
     structure (curve_in / curve_in_mol going in, curve_out /
     curve_out_mol coming out). W: the chord, wide enough for both ends;
     `span` / `H`: what it needs along / under a horizontal shaft,
     `along` / `side` the same beside a vertical one. In the quiz an end
     with nothing on it is left off — `half` 'in' draws only the arc into
     the shaft, 'out' only the one out of it — and a curve with nothing
     on either end is not drawn at all. */
  function curveMetrics(edge, f, editing) {
    if (!edge || !edge.curve) return null;
    const rel = +edge.reagent_mol_size > 0 ? +edge.reagent_mol_size : EMOL_REL;
    const end = (txt, mol, ph) => {
      const t = String(txt || '').trim();
      const ms = mol ? emolSizeOf(mol, f, rel) : null;
      // in the editor every end keeps room for its input field
      const shown = t || (editing ? ph : '');
      const tw = shown ? measureText(plainChemText(shown), LABEL_FONT_BELOW) + (t ? 0 : 12) : 0;
      const th = shown ? CURVE_LABEL_H : 0;
      return { t, mol: mol || '', ms, tw, th, any: !!(t || ms),
               w: Math.max(tw, ms ? ms.w : 0), h: (ms ? ms.h + (th ? 2 : 0) : 0) + th };
    };
    const a = end(edge.curve_in, edge.curve_in_mol, 'ein'), b = end(edge.curve_out, edge.curve_out_mol, 'aus');
    let half = '';
    if (!editing) {
      if (!a.any && !b.any) return null;
      if (!b.any) half = 'in';
      else if (!a.any) half = 'out';
    }
    const W = Math.max(CURVE_MIN_W, Math.ceil((a.w + b.w) / 2) + 16);
    const L = half ? W / 2 : W;
    const cw = half === 'in' ? a.w : half === 'out' ? b.w : Math.max(a.w, b.w);
    const ch = half === 'in' ? a.h : half === 'out' ? b.h : Math.max(a.h, b.h);
    return {
      a, b, half, W, L, D: CURVE_D,
      tin: a.t, tout: b.t, wIn: a.w, wOut: b.w,
      span: L + cw,
      H: CURVE_D + (ch ? ch + 2 : 0),
      along: L + Math.max(ch, CURVE_LABEL_H),
      side: CURVE_D + 4 + cw
    };
  }

  /* A node without a structure: its `text` (a compound named in words on
     the sheet, e.g. "Hirsuten") or the editor's placeholder. */
  function emptyNodeHtml(n) {
    return n.text ? `<div class="sg-text-node">${chemHtml(String(n.text))}</div>` : '<div class="sg-ph">(leer)</div>';
  }

  function sameLabels(a, b) {
    return reagentKey(a) === reagentKey(b);
  }
  const trimS = s => String(s == null ? '' : s).trim();
  /* Short fingerprint of a MOL text (structures take part in keys). */
  function hashStr(s) {
    if (!s) return '';
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(36);
  }
  const curveKey = e => e && e.curve
    ? [trimS(e.curve_in), trimS(e.curve_out), hashStr(e.curve_in_mol), hashStr(e.curve_out_mol)].join('→') : '';
  /* Everything an arrow carries, as one string. */
  function reagentKey(e) {
    return trimS(e.reagent_above) + '#' + trimS(e.reagent_below) +
      (e.curve ? '#' + curveKey(e) : '') +
      (e.reagent_mol ? '#' + (e.reagent_mol_below ? 'mb' : 'm') + hashStr(e.reagent_mol) : '') +
      (e.rxn ? '#r' + e.rxn : '');
  }
  /* Arrows from the same compounds that carry the same things are ONE
     reaction ("A + W → B + X" is stored as A,W→B and A,W→X). `rxn` ties
     arrows together that carry nothing at all; a bare arrow from one
     compound is a reaction of its own (null). `ids`: the scheme's nodes. */
  function rxGroupKey(e, ids) {
    const from = [...new Set((e.from || []).filter(id => ids.has(id) && id !== e.to))];
    if (!from.length || !ids.has(e.to)) return null;
    const lab = reagentKey(e);
    if (from.length > 1 || lab !== '#' || e.plus) return [...from].sort().join('|') + '#' + lab;
    return null;
  }

  /* Arrow shape. Default ('') is the orthogonal textbook routing; 'y'
     draws the lines between compounds and the junction as straight
     diagonals (converging: A and B meet, then one shaft; diverging: one
     shaft splits into slanted branches). Stored per arrow as `join`. */
  const isY = e => !!e && e.join === 'y';

  /* Arrow structures: OpenChemLib's drawing at its own bond length,
     cached per MOL text; emolSize() scales it like the compounds. */
  const _emolCache = new Map();
  function emolNatural(mol) {
    if (!mol || !window.OCL || !window.MolRenderer) return null;
    let c = _emolCache.get(mol);
    if (!c) {
      const tmp = document.createElement('div');
      let el = null;
      try { el = window.MolRenderer.drawMol(mol, tmp, { width: NATURAL_BOX, height: NATURAL_BOX, autoCrop: true, autoCropMargin: 2 }); } catch (_) {}
      if (!el || !el.getAttribute) return null;
      const w = parseFloat(el.getAttribute('width')) || EMOL_W, h = parseFloat(el.getAttribute('height')) || EMOL_H;
      c = { el, w, h };
      if (_emolCache.size > 200) _emolCache.clear();
      _emolCache.set(mol, c);
    }
    return c;
  }
  function emolSizeOf(mol, f, rel) {
    const c = emolNatural(mol);
    if (!c) return { w: EMOL_W, h: EMOL_H };
    const k = Math.min((f || 1) * rel, EMOL_MAX_W / c.w, EMOL_MAX_H / c.h);
    return { w: c.w * k, h: c.h * k };
  }
  function emolSize(edge, f) {
    return emolSizeOf(edge.reagent_mol, f, +edge.reagent_mol_size > 0 ? +edge.reagent_mol_size : EMOL_REL);
  }
  function edgeMolSvg(mol, size) {
    const c = emolNatural(mol);
    if (!c) return null;
    const el = c.el.cloneNode(true);
    el.removeAttribute('style');
    return { el, w: size.w, h: size.h };
  }

  function nextLetterId(usedSet) {
    for (let c = 65; c <= 90; c++) {
      const ch = String.fromCharCode(c);
      if (!usedSet.has(ch)) return ch;
    }
    for (let i = 1; i < 9999; i++) {
      const k = 'N' + i;
      if (!usedSet.has(k)) return k;
    }
    return 'N' + Date.now();
  }

  function svg(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    for (const k in (attrs || {})) {
      if (attrs[k] != null) el.setAttribute(k, attrs[k]);
    }
    return el;
  }

  const DIR = { R: [1, 0], L: [-1, 0], D: [0, 1], U: [0, -1] };
  const isH = side => side === 'R' || side === 'L';

  /* The scheme's reactions (see rxGroupKey) with their arrows, each with a
     main educt (longest way before it) and a main product (longest way
     after it). Shared by the planner and the free layout. */
  function reactionsOf(nodes, edges) {
    const ids = new Set(nodes.map(n => n.id));
    const order = new Map(nodes.map((n, i) => [n.id, i]));

    const rxs = [];
    const multi = new Map();
    edges.forEach((e, i) => {
      if (!ids.has(e.to)) return;
      const from = [...new Set((e.from || []).filter(id => ids.has(id) && id !== e.to))];
      if (!from.length) return;
      let rx = null;
      const key = rxGroupKey(e, ids);
      if (key != null) {
        rx = multi.get(key);
        if (!rx) { rx = { srcs: from, prods: [], edges: [] }; multi.set(key, rx); }
      } else rx = { srcs: from, prods: [], edges: [] };
      if (!rx.edges.length) { rx.idx = rxs.length; rxs.push(rx); }
      if (!rx.prods.includes(e.to)) rx.prods.push(e.to);
      rx.edges.push(i);
    });

    const prodBy = new Map(), consBy = new Map();
    ids.forEach(id => { prodBy.set(id, []); consBy.set(id, []); });
    for (const rx of rxs) {
      rx.prods.forEach(p => prodBy.get(p).push(rx));
      rx.srcs.forEach(s => consBy.get(s).push(rx));
    }
    const memo = fn => {
      const m = new Map(), busy = new Set();
      const f = id => {
        if (m.has(id)) return m.get(id);
        if (busy.has(id)) return 0;
        busy.add(id);
        const v = fn(id, f);
        busy.delete(id);
        m.set(id, v);
        return v;
      };
      return f;
    };
    const down = memo((id, f) => {
      let d = 0;
      for (const rx of consBy.get(id)) for (const p of rx.prods) d = Math.max(d, 1 + f(p));
      return d;
    });
    const up = memo((id, f) => {
      let d = 0;
      for (const rx of prodBy.get(id)) for (const s of rx.srcs) d = Math.max(d, 1 + f(s));
      return d;
    });
    const best = (list, key) => list.reduce((a, b) => {
      const ka = key(a), kb = key(b);
      for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] > ka[i] ? b : a;
      return a;
    });
    for (const rx of rxs) {
      rx.main = best(rx.srcs, s => [up(s), consBy.get(s).length, -order.get(s)]);
      rx.prod = best(rx.prods, p => [down(p), -order.get(p)]);
    }
    return { order, rxs, prodBy, consBy, down, up, best };
  }

  /* ── Reaction layout planner ─────────────────────────────────────
     Edges are grouped into reactions (edges with the same several
     sources and the same reagents are ONE reaction "A + W → B + X").
     Every reaction gets a main reactant, a main product, co-reactants
     and co-products, and is laid out the way exam sheets draw it:
       - the main chain runs straight on; at the width limit it turns
         down and continues in the opposite direction
       - a co-reactant sits above the arrow and joins it; three or more
         reactants stack in a column and meet in a bracket
       - several products are split equally (see trySplit); without
         splits (popts.split === false) a co-product sits below the
         arrow and leaves it
       - a side reaction forks off the shaft (shared stub, bus, own
         arrowhead), or leaves downwards / upwards / backwards —
         whichever is free and cheapest
     Positions are grid cells (h, r) in half-column units: compounds of
     the chain on even h, co-reactants/co-products in the odd arrow gaps.
     Returns { pos: Map(id → {h, r, jdir}), items: [...], cost }; `cost`
     rates how much of the plan is not tidy grid (see planCandidates). */
  function planLayout(nodes, edges, cols, popts) {
    const splits = !(popts && popts.split === false);
    const defers = !(popts && popts.defer === false);
    const lanes = !(popts && popts.lanes === false);
    const pluses = !(popts && popts.plus === false);
    const merges = !(popts && popts.merge === false);
    const early = !!(popts && popts.early);
    const downs = !!(popts && popts.down);
    const diamonds = !!(popts && popts.diamond);
    const gathers = !!(popts && popts.gather);
    const { order, rxs, prodBy, consBy, down, up, best } = reactionsOf(nodes, edges);

    /* ── grid state ── */
    const cell = new Map();
    const pos = new Map();
    const laid = new Set();
    const items = [];
    const K = (h, r) => h + ',' + r;
    const odd = h => (h & 1) === 1;
    let minH = Infinity, maxH = -Infinity, maxR = -Infinity;
    const span = 2 * (Math.max(2, cols) - 1);
    // within the width, or within the columns already used (a co-node may
    // have made the scheme a little wider)
    const inSpan = h => !pos.size || (h >= minH && h <= maxH) || Math.max(maxH, h) - Math.min(minH, h) <= span;
    const canPut = (h, r) => {
      if (cell.has(K(h, r))) return false;
      if (odd(h)) return cell.get(K(h - 1, r)) !== 'N' && cell.get(K(h + 1, r)) !== 'N';
      return true;
    };
    const passOk = (h, r, owner) => {
      const v = cell.get(K(h, r));
      return v == null || v === 'R' || (owner != null && v === 'A:' + owner);
    };
    const put = (id, h, r, jdir) => {
      pos.set(id, { h, r, jdir: jdir || 1 });
      cell.set(K(h, r), 'N');
      if (odd(h)) for (const d of [-1, 1]) if (!cell.has(K(h + d, r))) cell.set(K(h + d, r), 'R');
      minH = Math.min(minH, h); maxH = Math.max(maxH, h); maxR = Math.max(maxR, r);
    };
    const mark = (h, r, v) => {
      const cur = cell.get(K(h, r));
      if (cur == null || cur === 'R') cell.set(K(h, r), v);
    };

    /* Co-nodes still to be placed, split by direction. */
    const coOf = (rx) => ({
      ins: rx.srcs.filter(s => s !== rx.main),
      outs: rx.prods.filter(p => p !== rx.prod)
    });

    /* A co-reactant that is itself made from something already drawn
       comes back from a branch (A → B → C, A → B´ → C´, C + C´ → D):
       it gets its own lane after its own precursor and merges in, instead
       of sitting above the arrow with a long bent arrow up to it. */
    const reconverges = id => {
      const seen = new Set([id]), st = [id];
      while (st.length) {
        for (const rx of prodBy.get(st.pop())) {
          for (const s of rx.srcs) {
            if (pos.has(s)) return true;
            if (!seen.has(s)) { seen.add(s); st.push(s); }
          }
        }
      }
      return false;
    };

    /* Assign co-nodes to slots; returns { co, extra } or null if a
       required cell is taken by another assignment. */
    const slotCo = (rx, slots, inPref, outPref) => {
      const { ins, outs } = coOf(rx);
      const used = new Set(), co = [], extra = [];
      let wide = 0;
      const take = (id, dir, prefs) => {
        if (pos.has(id)) { extra.push({ id, dir }); return; }
        if (dir === 'in' && lanes && reconverges(id)) { extra.push({ id, dir, own: true }); return; }
        // Within the width if possible; a slightly wider scheme still
        // beats a co-reactant parked far away.
        for (const strict of [true, false]) {
          for (const s of prefs) {
            const c = slots[s];
            if (used.has(s) || !c || !canPut(c[0], c[1]) || (strict && !inSpan(c[0]))) continue;
            if (c[2] && !c[2].every(p => passOk(p[0], p[1]))) continue;
            used.add(s);
            if (!strict) wide++;
            co.push({ id, dir, slot: s, h: c[0], r: c[1], via: c[2] || [] });
            return;
          }
        }
        extra.push({ id, dir });
      };
      ins.forEach(id => take(id, 'in', inPref));
      outs.forEach(id => take(id, 'out', outPref));
      return { co, extra, wide };
    };
    // Co-nodes that found no slot (a branch that merges in on its own lane is not a miss).
    const missed = s => s.extra.filter(x => !pos.has(x.id) && !x.own).length * 3 + s.wide;

    /* Products of ONE reaction (same reagents, e.g. two diastereomers)
       that are still to be placed, in data order; with an odd count the
       product the chain continues from goes in the middle. */
    const splitProds = rx => {
      const todo = rx.prods.filter(p => !pos.has(p));
      if (todo.length % 2 === 0 || !todo.includes(rx.prod)) return todo;
      const rest = todo.filter(p => p !== rx.prod), mid = (todo.length - 1) / 2;
      return [...rest.slice(0, mid), rx.prod, ...rest.slice(mid)];
    };
    const isSplit = rx => { const l = splitProds(rx); return l.length >= 2 && l.includes(rx.prod); };
    // Offsets (rows or columns) of n products, symmetric about the source:
    // odd n has one product straight on, even n leaves the middle free.
    const symOffs = n => {
      const half = Math.floor(n / 2);
      return Array.from({ length: n }, (_, i) => n % 2 ? i - half : (i < half ? i - half : i - half + 1));
    };

    /* ── equations (edge.plus): "A + B → C + D" in one row ──────────── */
    const flagged = rx => rx.edges.some(i => edges[i].plus);
    const isPlus = rx => pluses && flagged(rx);
    const free = (h, r) => { const v = cell.get(K(h, r)); return v == null || v === 'R'; };
    // Something already arrives at (or leaves) this compound along its row.
    const along = (h, r) => [-1, 1].some(d => { const v = cell.get(K(h + d, r)); return v != null && v !== 'R' && v !== 'T'; });
    const eqnMembers = rx => ({
      reacts: rx.srcs.filter(id => id === rx.main || !pos.has(id)),
      prods: rx.prods.filter(p => !pos.has(p)),
      // members already drawn elsewhere join the arrow like any co-node
      extra: rx.srcs.filter(id => id !== rx.main && pos.has(id)).map(id => ({ id, dir: 'in' }))
        .concat(rx.prods.filter(p => pos.has(p)).map(id => ({ id, dir: 'out' })))
    });

    /* The reactants side by side with "+" between them, the arrow, the
       products the same way — reactants and products in data order. Not
       after a compound that is reached along its row ("X → M + W" would
       read as if M and W came out of X). */
    function tryEqn(rx, dx) {
      const m = pos.get(rx.main), mh = m.h, mr = m.r;
      const { reacts, prods, extra } = eqnMembers(rx);
      if (!prods.includes(rx.prod) || reacts.length + prods.length < 3) return null;
      if (reacts.length > 1 && along(mh, mr)) return null;
      for (const order of [reacts, [rx.main, ...reacts.filter(id => id !== rx.main)]]) {
        const iM = order.indexOf(rx.main);
        const hs = order.map((_, j) => mh + 2 * dx * (j - iM));
        const g = hs[hs.length - 1] + dx;
        const ph = prods.map((_, k) => g + dx + 2 * dx * k);
        if (!hs.filter(h => h !== mh).concat(ph).every(h => canPut(h, mr) && inSpan(h))) continue;
        const plusH = [];
        for (let j = 1; j < hs.length; j++) plusH.push((hs[j - 1] + hs[j]) / 2);
        for (let k = 1; k < ph.length; k++) plusH.push((ph[k - 1] + ph[k]) / 2);
        if (!plusH.every(h => free(h, mr)) || !passOk(g, mr)) continue;
        const co = order.map((id, j) => ({ id, dir: 'in', slot: 'eqn', h: hs[j], r: mr, via: [] }))
          .concat(prods.map((id, k) => ({ id, dir: 'out', slot: 'eqn', h: ph[k], r: mr, via: [] })))
          .filter(c => c.id !== rx.main && c.id !== rx.prod);
        return { type: 'eqn', rx, dx, gap: g, row: mr, mh, mr, th: ph[prods.indexOf(rx.prod)], tr: mr,
                 plusH, lo: Math.min(...hs, ...ph), hi: Math.max(...hs, ...ph),
                 order, prods, co, extra, cost: 0 };
      }
      return null;
    }

    /* Narrow screens: "M + W" in one row, the arrow straight down from
       between them (the "+" column) to "C + D" in a lower row. Two
       reactants and two products only. */
    function tryEqnV(rx, dy, k) {
      const m = pos.get(rx.main), mh = m.h, mr = m.r, tr = mr + dy * k;
      const { reacts, prods, extra } = eqnMembers(rx);
      if (reacts.length !== 2 || prods.length !== 2 || !prods.includes(rx.prod) || along(mh, mr)) return null;
      const other = reacts.find(id => id !== rx.main);
      for (const sd of reacts[0] === rx.main ? [1, -1] : [-1, 1]) {
        const ch = mh + 2 * sd, c = mh + sd;
        if (!canPut(ch, mr) || !inSpan(ch) || !free(c, mr) || !free(c, tr)) continue;
        const hs = [Math.min(mh, ch), Math.max(mh, ch)];
        if (!hs.every(h => canPut(h, tr))) continue;
        let ok = true;
        for (let i = 1; i < k && ok; i++) ok = free(c, mr + dy * i);
        if (!ok) continue;
        const at = prods.map((id, j) => ({ id, h: hs[j] }));
        return { type: 'veqn', rx, dy, k, ac: c, mh, mr, th: at.find(a => a.id === rx.prod).h, tr,
                 order: sd > 0 ? [rx.main, other] : [other, rx.main], prods,
                 co: [{ id: other, dir: 'in', slot: 'eqn', h: ch, r: mr, via: [] }]
                   .concat(at.filter(a => a.id !== rx.prod).map(a => ({ id: a.id, dir: 'out', slot: 'eqn', h: a.h, r: tr, via: [] }))),
                 extra, cost: 0 };
      }
      return null;
    }

    /* Narrow screens, "A + B → C": the two reactants stacked in one
       column with the "+" between them, the arrow on down to the product. */
    function tryEqnS(rx, k) {
      const m = pos.get(rx.main), mh = m.h, mr = m.r;
      const { reacts, prods, extra } = eqnMembers(rx);
      if (reacts.length !== 2 || prods.length !== 1 || prods[0] !== rx.prod) return null;
      const other = reacts.find(id => id !== rx.main);
      const wr = mr + 1, tr = wr + k;
      if (!canPut(mh, wr) || !canPut(mh, tr)) return null;
      for (let i = 1; i < k; i++) if (!free(mh, wr + i)) return null;
      return { type: 'seqn', rx, dy: 1, k, mh, mr, th: mh, tr, wr,
               order: [rx.main, other], prods,
               co: [{ id: other, dir: 'in', slot: 'eqn', h: mh, r: wr, via: [] }], extra, cost: 0 };
    }

    /* An arrow flagged as an equation is laid as one where it fits;
       otherwise the usual way, at a price. */
    function tryH(rx, dx, fromProd) {
      if (fromProd || !isPlus(rx)) return tryHPlain(rx, dx, fromProd);
      const e = tryEqn(rx, dx);
      if (e) return e;
      const it = tryHPlain(rx, dx, fromProd);
      if (it) it.pen = (it.pen || 0) + 2;
      return it;
    }
    function tryV(rx, dy, k, fromProd) {
      if (fromProd || !isPlus(rx)) return tryVPlain(rx, dy, k, fromProd);
      const e = tryEqnV(rx, dy, k) || (dy > 0 ? tryEqnS(rx, k) : null);
      if (e) return e;
      const it = tryVPlain(rx, dy, k, fromProd);
      if (it) it.pen = (it.pen || 0) + 2;
      return it;
    }

    /* Straight horizontal reaction. `fromProd` anchors on an already
       placed product (used when laying a feed chain backwards). */
    function tryHPlain(rx, dx, fromProd) {
      let mh, mr, th, tr;
      if (fromProd) { const p = pos.get(rx.prod); th = p.h; tr = p.r; mh = th - 2 * dx; mr = tr; if (!canPut(mh, mr)) return null; }
      else { const m = pos.get(rx.main); mh = m.h; mr = m.r; th = mh + 2 * dx; tr = mr; if (!canPut(th, tr)) return null; }
      const g = mh + dx;
      if (!passOk(g, mr)) return null;
      const { ins } = coOf(rx);
      // several educts: equal, stacked symmetric about the arrow
      if (merges && ins.some(id => !pos.has(id) || movable(id))) {
        const mg = tryMerge(rx, dx, fromProd);
        if (mg) return mg;
      }
      if (ins.filter(id => !pos.has(id)).length >= 2) return tryStack(rx, dx, fromProd);
      if (!fromProd && splits && isSplit(rx)) return trySplit(rx, dx);
      const s = slotCo(rx, { up: [g, mr - 1], dn: [g, mr + 1] }, ['up', 'dn'], ['dn', 'up']);
      return { type: 'h', rx, dx, gap: g, row: mr, mh, mr, th, tr, fromProd, ...s, cost: missed(s) };
    }

    /* Equal educts: every educt of the reaction in one column, symmetric
       about the row of the arrow — the mirror of the split — their lines
       parallel into a bus near them; one shaft carries the reagents. With
       several products the far end splits the same way. An odd count has
       one educt straight on (the main one, so a chain runs straight);
       an even count leaves the middle row free (see compactPlan). */
    function tryMerge(rx, dx, fromProd) {
      const { ins } = coOf(rx);
      // compounds already drawn, and branches coming back on a lane of
      // their own, join the arrow wherever they are
      const moves = ins.filter(movable);
      const todo = ins.filter(id => (!pos.has(id) && !(lanes && reconverges(id))) || moves.includes(id));
      if (!todo.length) return null;
      const educts = rx.srcs.filter(id => id === rx.main || todo.includes(id));
      const n = educts.length, eo = symOffs(n);
      const others = educts.filter(id => id !== rx.main);
      const orders = n % 2
        ? [[...others.slice(0, (n - 1) / 2), rx.main, ...others.slice((n - 1) / 2)], educts]
        : [educts, [...educts].reverse()];
      const plist = fromProd || !splits ? [rx.prod] : splitProds(rx).filter(p => p === rx.prod || !pos.has(p));
      if (!plist.includes(rx.prod)) plist.unshift(rx.prod);
      const k = plist.length, po = symOffs(k);
      let best = null;
      for (const order of orders) {
        const iM = order.indexOf(rx.main);
        let mh, R, th;
        if (fromProd) { const p = pos.get(rx.prod); th = p.h; R = p.r - po[plist.indexOf(rx.prod)]; mh = th - 2 * dx; }
        else { const m = pos.get(rx.main); mh = m.h; R = m.r - eo[iM]; th = mh + 2 * dx; }
        const g = mh + dx;
        // (laid backwards from the product, the caller prices a wider scheme)
        if (!fromProd && (!inSpan(th) || !inSpan(mh))) continue;
        const cells = order.map((id, i) => [id, mh, R + eo[i]]).concat(plist.map((id, j) => [id, th, R + po[j]]));
        const at = (id, h, r) => pos.get(id).h === h && pos.get(id).r === r;
        if (!cells.every(([id, h, r]) => pos.has(id) && !moves.includes(id) ? at(id, h, r) : canPut(h, r) || (pos.has(id) && at(id, h, r)))) continue;
        const rs = cells.map(c => c[2]).concat([R]);
        const lo = Math.min(...rs), hi = Math.max(...rs);
        let ok = true;
        for (let r = lo; r <= hi && ok; r++) ok = passOk(g, r, rx.main);
        if (!ok) continue;
        // the free middle cell lets the two halves close up later
        const tight = (n % 2 || canPut(mh, R)) && (k % 2 || canPut(th, R));
        const it = {
          type: 'merge', rx, dx, gap: g, row: R, R, mh, mr: R + eo[iM], th, tr: R + po[plist.indexOf(rx.prod)],
          lo, hi, order, prods: plist, eo, po, fromProd,
          co: order.filter(id => id !== rx.main).map(id => ({ id, dir: 'in', slot: 'merge', h: mh, r: R + eo[order.indexOf(id)], via: [] }))
            .concat(plist.filter(id => id !== rx.prod).map(id => ({ id, dir: 'out', slot: 'split', h: th, r: R + po[plist.indexOf(id)], via: [] }))),
          extra: ins.filter(id => !order.includes(id)).map(id => ({ id, dir: 'in', own: lanes && reconverges(id) && !pos.has(id) }))
            .concat(rx.prods.filter(id => !plist.includes(id)).map(id => ({ id, dir: 'out' }))),
          moves: moves.filter(id => order.includes(id)),
          cost: 0, pen: tight ? 0 : 0.4
        };
        if (!best || it.pen < best.pen) best = it;
        if (!it.pen) break;
      }
      return best;
    }

    /* (variant) A compound placed only as the end of a plain branch and
       wanted by nothing but one merge moves into that merge when it is
       laid (see tryMerge); its own arrow is then routed freely. */
    function movable(id) {
      if (!gathers || !pos.has(id) || consBy.get(id).length !== 1) return false;
      const bi = items.find(i => i.rx.prod === id);
      return !!bi && (bi.type === 'h' || bi.type === 'v' || bi.type === 'fork') && !bi.co.length && !bi.extra.length &&
        !items.some(i => i !== bi && (i.rx.main === id || i.co.some(c => c.id === id)));
    }
    function unplace(id) {
      const p = pos.get(id), bi = items.find(i => i.rx.prod === id);
      pos.delete(id);
      cell.delete(K(p.h, p.r));
      items.splice(items.indexOf(bi), 1);
      laid.delete(bi.rx.idx);
      // the marks of its arrow, unless another arrow of the same source shares them
      if (items.some(o => o.rx.main === bi.rx.main)) return;
      const own = bi.type === 'h' ? [[bi.gap, bi.row]]
        : bi.type === 'fork' ? Array.from({ length: bi.k + 1 }, (_, i) => [bi.gap, bi.row + bi.sy * i])
        : Array.from({ length: Math.max(0, bi.k - 1) }, (_, i) => [bi.mh, bi.mr + bi.dy * (i + 1)]);
      for (const [h, r] of own) if (/^[AX]:/.test(cell.get(K(h, r)) || '')) cell.delete(K(h, r));
    }

    /* Equal split: one shaft carries the reagents, a bus at its far end
       fans out, every product gets its own short branch and arrowhead.
       The products sit symmetric about the source row, so none of them
       reads as THE product; if that is blocked, they stack below (or
       above) and all of them turn off the shaft. Co-reactants join near
       the start of the shaft, on the side the bus does not use. */
    function trySplit(rx, dx) {
      const m = pos.get(rx.main), mh = m.h, mr = m.r;
      const th = mh + 2 * dx, g = mh + dx;
      if (!passOk(g, mr)) return null;
      const list = splitProds(rx), n = list.length;
      let best = null;
      // symmetric; one straight on and the rest below (above); all below (above)
      const arrangements = [[symOffs(n), 0], [list.map((_, i) => i), 0.3], [list.map((_, i) => i - n + 1), 0.5],
                            [list.map((_, i) => i + 1), 0.6], [list.map((_, i) => i - n), 0.8]];
      for (const [offs, pen] of arrangements) {
        if (!offs.every(o => canPut(th, mr + o))) continue;
        const lo = Math.min(0, ...offs), hi = Math.max(0, ...offs);
        let ok = true;
        for (let r = lo; r <= hi && ok; r++) ok = passOk(g, mr + r);
        if (!ok) continue;
        const slots = {};
        if (lo === 0 && !offs.includes(-1)) slots.up = [g, mr - 1];
        if (hi === 0 && !offs.includes(1)) slots.dn = [g, mr + 1];
        const s = slotCo({ ...rx, prods: [rx.prod] }, slots, ['up', 'dn'], []);
        const at = list.map((id, i) => ({ id, r: mr + offs[i] }));
        const it = {
          type: 'split', rx, dx, gap: g, row: mr, mh, mr, th, tr: at.find(x => x.id === rx.prod).r,
          lo: mr + lo, hi: mr + hi, pen,
          co: s.co.concat(at.filter(x => x.id !== rx.prod).map(x => ({ id: x.id, dir: 'out', slot: 'split', h: th, r: x.r, via: [] }))),
          extra: s.extra, cost: missed(s)
        };
        if (!best || it.cost + it.pen < best.cost + best.pen) best = it;
      }
      return best;
    }

    /* The same split going down (dy = 1) or up: the shaft runs down with
       its text beside it, the bus crosses just before the product row,
       the products sit side by side — symmetric about the source column
       where the width allows, otherwise all to one side. */
    function trySplitV(rx, dy, k) {
      const m = pos.get(rx.main), mh = m.h, mr = m.r, tr = mr + dy * k;
      for (let i = 1; i < k; i++) if (!passOk(mh, mr + dy * i)) return null;
      const list = splitProds(rx), n = list.length;
      let best = null;
      // symmetric; one straight on and the rest to one side (at the edge
      // of the width); all to one side
      const arrangements = [[symOffs(n), 0], [list.map((_, i) => i - n + 1), 0.3], [list.map((_, i) => i), 0.3],
                            [list.map((_, i) => i - n), 0.6], [list.map((_, i) => i + 1), 0.6]];
      for (const [offs, pen] of arrangements) {
        const cols = offs.map(o => mh + 2 * o);
        if (!cols.every(h => canPut(h, tr) && inSpan(h))) continue;
        // Co-reactants beside the shaft need a row of their own before the bus.
        const slots = {};
        if (k >= 2) {
          const jr = tr - dy;
          slots.l = [mh - 2, jr, [[mh - 1, jr]]];
          slots.r = [mh + 2, jr, [[mh + 1, jr]]];
        }
        const s = slotCo({ ...rx, prods: [rx.prod] }, slots, ['l', 'r'], []);
        const at = list.map((id, i) => ({ id, h: cols[i] }));
        const it = {
          type: 'vsplit', rx, dy, k, jRow: tr - dy, mh, mr, th: at.find(x => x.id === rx.prod).h, tr, pen,
          co: s.co.concat(at.filter(x => x.id !== rx.prod).map(x => ({ id: x.id, dir: 'out', slot: 'split', h: x.h, r: tr, via: [] }))),
          extra: s.extra, cost: missed(s)
        };
        if (!best || it.cost + it.pen < best.cost + best.pen) best = it;
      }
      return best;
    }

    /* The merge going down (dy = 1) or up: the educts side by side in one
       row, symmetric about the column the arrow runs along — the mirror of
       the vertical split — their lines parallel into a bus just past
       them; one shaft with the text beside it; several products fan out
       again side by side. */
    function tryMergeV(rx, dy, k, fromProd) {
      const { ins } = coOf(rx);
      const todo = ins.filter(id => !pos.has(id) && !(lanes && reconverges(id)));
      if (!todo.length) return null;
      const educts = rx.srcs.filter(id => id === rx.main || todo.includes(id));
      const n = educts.length, eo = symOffs(n);
      const others = educts.filter(id => id !== rx.main);
      const orders = n % 2
        ? [[...others.slice(0, (n - 1) / 2), rx.main, ...others.slice((n - 1) / 2)], educts]
        : [educts, [...educts].reverse()];
      const plist = fromProd || !splits ? [rx.prod] : splitProds(rx).filter(p => p === rx.prod || !pos.has(p));
      if (!plist.includes(rx.prod)) plist.unshift(rx.prod);
      const kk = plist.length, po = symOffs(kk);
      let best = null;
      for (const order of orders) {
        const iM = order.indexOf(rx.main);
        let pc, mr, tr;
        if (fromProd) { const p = pos.get(rx.prod); tr = p.r; pc = p.h - 2 * po[plist.indexOf(rx.prod)]; mr = tr - dy * k; }
        else { const m = pos.get(rx.main); mr = m.r; pc = m.h - 2 * eo[iM]; tr = mr + dy * k; }
        const cells = order.map((id, i) => [id, pc + 2 * eo[i], mr]).concat(plist.map((id, j) => [id, pc + 2 * po[j], tr]));
        if (!cells.every(([id, h, r]) => inSpan(h) && (pos.has(id) ? pos.get(id).h === h && pos.get(id).r === r : canPut(h, r)))) continue;
        // the shaft runs along the middle column between the two rows
        let ok = n % 2 === 1 || canPut(pc, mr) || passOk(pc, mr, rx.main);
        for (let i = 1; i < k && ok; i++) ok = passOk(pc, mr + dy * i, rx.main);
        if (!ok) continue;
        const tight = (n % 2 || canPut(pc, mr)) && (kk % 2 || canPut(pc, tr));
        const it = {
          type: 'vmerge', rx, dy, k, pc, mh: pc + 2 * eo[iM], mr, th: pc + 2 * po[plist.indexOf(rx.prod)], tr,
          order, prods: plist, eo, po, fromProd,
          co: order.filter(id => id !== rx.main).map(id => ({ id, dir: 'in', slot: 'merge', h: pc + 2 * eo[order.indexOf(id)], r: mr, via: [] }))
            .concat(plist.filter(id => id !== rx.prod).map(id => ({ id, dir: 'out', slot: 'split', h: pc + 2 * po[plist.indexOf(id)], r: tr, via: [] }))),
          extra: ins.filter(id => !order.includes(id)).map(id => ({ id, dir: 'in', own: lanes && reconverges(id) && !pos.has(id) }))
            .concat(rx.prods.filter(id => !plist.includes(id)).map(id => ({ id, dir: 'out' }))),
          cost: 0, pen: (tight ? 0 : 0.4) + (k - 1) * 0.2
        };
        if (!best || it.pen < best.pen) best = it;
        if (!it.pen) break;
      }
      return best;
    }

    /* Three or more reactants: stacked in one column, bracket into J. */
    function tryStack(rx, dx, fromProd) {
      const { ins } = coOf(rx);
      const stack = ins.filter(id => !pos.has(id));
      for (const sy of [1, -1]) {
        let mh, mr, th;
        if (fromProd) { const p = pos.get(rx.prod); th = p.h; mr = p.r; mh = th - 2 * dx; if (!canPut(mh, mr)) continue; }
        else { const m = pos.get(rx.main); mh = m.h; mr = m.r; th = mh + 2 * dx; if (!canPut(th, mr)) continue; }
        const g = mh + dx;
        let ok = passOk(g, mr);
        for (let i = 1; ok && i <= stack.length; i++) ok = canPut(mh, mr + sy * i) && passOk(g, mr + sy * i);
        if (!ok) continue;
        const co = stack.map((id, i) => ({ id, dir: 'in', slot: 'stack', h: mh, r: mr + sy * (i + 1), via: [] }));
        const rest = { ...rx, srcs: [rx.main, ...ins.filter(id => pos.has(id))] };
        const s = slotCo(rest, { up: [g, mr - sy] }, [], ['up']);
        return { type: 'stack', rx, dx, sy, gap: g, row: mr, mh, mr, th, tr: mr, fromProd,
                 co: co.concat(s.co), extra: s.extra, cost: 0.5 };
      }
      return null;
    }

    /* Vertical reaction over k rows; co-nodes sit left/right of the
       shaft in the row just before the target. */
    function tryVPlain(rx, dy, k, fromProd) {
      const { ins, outs } = coOf(rx);
      // several educts: equal, side by side (with the products, if several)
      if (merges && ins.some(id => !pos.has(id))) {
        const mg = tryMergeV(rx, dy, k, fromProd);
        if (mg) return mg;
      }
      if (!fromProd && splits && isSplit(rx)) return trySplitV(rx, dy, k);
      const slotted = ins.filter(id => !lanes || !reconverges(id)).concat(outs).filter(id => !pos.has(id));
      const needJ = slotted.length > 0;
      if (needJ && k < 2) return null;
      let mh, mr, tr;
      if (fromProd) { const p = pos.get(rx.prod); mh = p.h; tr = p.r; mr = tr - dy * k; if (!canPut(mh, mr)) return null; }
      else { const m = pos.get(rx.main); mh = m.h; mr = m.r; tr = mr + dy * k; if (!canPut(mh, tr)) return null; }
      for (let i = 1; i < k; i++) if (!passOk(mh, mr + dy * i)) return null;
      const jRow = tr - dy;
      const mk = (h, r) => [h, r, [[h + (h < mh ? 1 : -1), r]]];
      let s = slotCo(rx, { l: mk(mh - 2, jRow), r: mk(mh + 2, jRow) }, ['l', 'r'], ['r', 'l']);
      const want = slotted.length;
      const score = x => (want - x.co.length) * 3 + x.wide;
      if (score(s) > 0 && k >= 1 + want) {
        // One co-node per row, all on the side that stays within the width.
        for (const side of [-1, 1]) {
          const slots = {};
          const names = [];
          for (let i = 0; i < want; i++) { names.push('t' + i); slots['t' + i] = mk(mh + 2 * side, mr + dy * (k - want + i)); }
          const t = slotCo(rx, slots, names, names);
          if (score(t) < score(s)) s = t;
        }
      }
      return { type: 'v', rx, dy, k, jRow, mh, mr, th: mh, tr, fromProd, ...s, cost: missed(s) };
    }

    /* Fork: shared stub from the main reactant, bus sideways to the
       target row, own final run and arrowhead. */
    function tryF(rx, dx, sy, k) {
      const { ins, outs } = coOf(rx);
      if (ins.length || outs.length) return null;
      const m = pos.get(rx.main);
      const g = m.h + dx, th = m.h + 2 * dx, tr = m.r + sy * k;
      if (!canPut(th, tr)) return null;
      for (let i = 0; i <= k; i++) if (!passOk(g, m.r + sy * i, rx.main)) return null;
      return { type: 'fork', rx, dx, sy, k, gap: g, row: m.r, mh: m.h, mr: m.r, th, tr, co: [], extra: [], cost: 0 };
    }

    /* ── diamonds (variant): two lanes that meet again ─────────────────
       A → B + B´, B → C, B´ → C´, C + C´ → D, or two arrows of their own
       out of A: the source on top, the lanes side by side going down, the
       two educts equal into the product under them. Each lane is a plain
       chain of at most three arrows. */
    function findDiamond(s) {
      const free = x => !pos.has(x);
      const walk = (x, first) => {
        const lane = [first], ids = [x];
        for (let cur = x; ;) {
          const next = consBy.get(cur);
          if (next.length !== 1 || laid.has(next[0].idx)) return null;
          const nx = next[0];
          if (nx.srcs.length > 1) return { lane, ids, end: cur, into: nx };
          if (lane.length >= 3 || nx.prods.length !== 1 || prodBy.get(nx.prod).length !== 1 || !free(nx.prod)) return null;
          lane.push(nx);
          ids.push(cur = nx.prod);
        }
      };
      const outs = rxs.filter(rx => rx.main === s && rx.srcs.length === 1 && !laid.has(rx.idx) && rx.prods.every(free));
      const pairs = [];
      for (const rx of outs) if (rx.prods.length === 2) pairs.push([[rx, rx.prods[0]], [rx, rx.prods[1]]]);
      const one = outs.filter(rx => rx.prods.length === 1);
      for (let i = 0; i < one.length; i++) for (let j = i + 1; j < one.length; j++) pairs.push([[one[i], one[i].prod], [one[j], one[j].prod]]);
      for (const [[r1, x1], [r2, x2]] of pairs) {
        if (prodBy.get(x1).length !== 1 || prodBy.get(x2).length !== 1) continue;
        const a = walk(x1, r1), b = walk(x2, r2);
        if (!a || !b || a.into !== b.into || a.end === b.end) continue;
        const M = a.into;
        if (M.srcs.length !== 2 || M.prods.length !== 1 || !free(M.prod)) continue;
        // a split puts both lanes' first compounds in one row: a lane of
        // one arrow cannot then be longer to meet a longer one
        const split = r1 === r2;
        if (split && a.lane.length !== b.lane.length && Math.min(a.lane.length, b.lane.length) === 1) continue;
        return { s, split, lanes: [a, b], M };
      }
      return null;
    }
    // The split that starts both lanes, its products in the lanes' columns.
    function vsplitAt(d, cols) {
      const rx = d.lanes[0].lane[0], S = pos.get(rx.main), tr = S.r + 1;
      const at = d.lanes.map((L, i) => ({ id: L.ids[0], h: cols[i] }));
      if (!at.every(a => canPut(a.h, tr))) return null;
      return { type: 'vsplit', rx, dy: 1, k: 1, jRow: S.r, mh: S.h, mr: S.r, th: at.find(a => a.id === rx.prod).h, tr, pen: 0,
               co: at.filter(a => a.id !== rx.prod).map(a => ({ id: a.id, dir: 'out', slot: 'split', h: a.h, r: tr, via: [] })),
               extra: [], cost: 0 };
    }
    // The two educts, side by side at the end of the lanes, into the
    // product under the source's column.
    function vmergeAt(d, cols, pen) {
      const M = d.M, S = pos.get(d.s), rE = S.r + Math.max(...d.lanes.map(L => L.lane.length)), pc = S.h;
      const ends = d.lanes.map((L, i) => ({ id: L.end, h: cols[i] }));
      if (!ends.every(e => pos.get(e.id) && pos.get(e.id).h === e.h && pos.get(e.id).r === rE)) return null;
      if (!canPut(pc, rE + 1) || cell.get(K(pc, rE)) === 'N' && !ends.some(e => e.h === pc)) return null;
      const order = ends.sort((a, b) => a.h - b.h);
      return { type: 'vmerge', rx: M, dy: 1, k: 1, pc, mh: order.find(e => e.id === M.main).h, mr: rE, th: pc, tr: rE + 1,
               order: order.map(e => e.id), prods: [M.prod], eo: order.map(e => (e.h - pc) / 2), po: [0], fromProd: false, pen,
               co: order.filter(e => e.id !== M.main).map(e => ({ id: e.id, dir: 'in', slot: 'merge', h: e.h, r: rE, via: [] })),
               extra: [], cost: 0 };
    }
    /* Lay a diamond from its placed source: lanes left and right of it
       (symmetric), else one straight down and one beside it. Every piece
       is committed as it goes; if one does not fit, all of it is undone.
       Returns the items laid, or null. */
    function layDiamond(d) {
      const S = pos.get(d.s), depth = Math.max(...d.lanes.map(L => L.lane.length));
      const snap = { cell: new Map(cell), pos: new Map(pos), laid: new Set(laid), near: new Map(near), n: items.length, minH, maxH, maxR };
      const undo = () => {
        cell.clear(); snap.cell.forEach((v, k) => cell.set(k, v));
        pos.clear(); snap.pos.forEach((v, k) => pos.set(k, v));
        laid.clear(); snap.laid.forEach(v => laid.add(v));
        near.clear(); snap.near.forEach((v, k) => near.set(k, v));
        items.length = snap.n;
        ({ minH, maxH, maxR } = snap);
      };
      // a source still to be fed from elsewhere keeps one side free for it
      const fed = prodBy.get(d.s).some(rx => !laid.has(rx.idx) && rx.srcs.some(x => !pos.has(x)));
      const sym = [[-1, 1, 0], [1, -1, 0]], one = [[0, 1, 0.3], [1, 0, 0.3], [-1, 0, 0.3], [0, -1, 0.3]];
      for (const [oa, ob, pen] of fed ? one.concat(sym) : sym.concat(one)) {
        const cols = [S.h + 2 * oa, S.h + 2 * ob];
        if (!cols.every(inSpan)) continue;
        const done = [];
        const step = it => { if (it) { commit(it); done.push(it); } return !!it; };
        // the first arrows out of the source
        let ok = true;
        if (d.split) ok = step(vsplitAt(d, cols));
        else {
          for (let i = 0; i < 2 && ok; i++) {
            const L = d.lanes[i], o = i ? ob : oa, k = L.lane.length === 1 ? depth : 1;
            ok = step(o === 0 ? tryVPlain(L.lane[0], 1, k) : tryF(L.lane[0], o, 1, k));
          }
        }
        // on down each lane; the shorter one takes longer over its last arrow
        for (let i = 0; i < 2 && ok; i++) {
          const L = d.lanes[i];
          for (let j = 1; j < L.lane.length && ok; j++) ok = step(tryVPlain(L.lane[j], 1, j === L.lane.length - 1 ? 1 + depth - L.lane.length : 1));
        }
        if (ok) ok = step(vmergeAt(d, cols, pen));
        if (ok) return done;
        undo();
      }
      return null;
    }

    function commit(it) {
      const rx = it.rx;
      for (const id of it.moves || []) unplace(id);
      laid.add(rx.idx);
      if (it.fromProd) put(rx.main, it.mh, it.mr, it.dx);
      else put(rx.prod, it.th, it.tr, it.dx || 1);
      if (it.type === 'h') {
        mark(it.gap, it.row, (it.co.length || it.extra.length ? 'X:' : 'A:') + rx.main);
      } else if (it.type === 'stack') {
        for (let i = 0; i <= it.co.filter(c => c.slot === 'stack').length; i++) mark(it.gap, it.row + it.sy * i, 'X:' + rx.main);
      } else if (it.type === 'fork') {
        for (let i = 0; i <= it.k; i++) mark(it.gap, it.row + it.sy * i, 'A:' + rx.main);
      } else if (it.type === 'v') {
        for (let i = 1; i < it.k; i++) mark(it.mh, it.mr + it.dy * i, 'A:' + rx.main);
      } else if (it.type === 'split') {
        // shaft and bus belong to this reaction alone
        for (let r = it.lo; r <= it.hi; r++) mark(it.gap, r, 'X:' + rx.main);
        // the free middle between an even number of products stays free,
        // so the two halves can close up (compactPlan)
        if (it.lo < it.row && it.hi > it.row) mark(it.th, it.row, 'X:' + rx.main);
      } else if (it.type === 'merge') {
        for (let r = it.lo; r <= it.hi; r++) mark(it.gap, r, 'X:' + rx.main);
        if (it.order.length % 2 === 0) mark(it.mh, it.R, 'X:' + rx.main);
        if (it.prods.length % 2 === 0) mark(it.th, it.R, 'X:' + rx.main);
      } else if (it.type === 'vsplit') {
        for (let i = 1; i < it.k; i++) mark(it.mh, it.mr + it.dy * i, 'X:' + rx.main);
        // the middle between an even number of products stays free (_compactForks)
        const pcs = [it.th, ...it.co.filter(c => c.slot === 'split').map(c => c.h)];
        if (Math.min(...pcs) < it.mh && Math.max(...pcs) > it.mh) mark(it.mh, it.tr, 'X:' + rx.main);
      } else if (it.type === 'vmerge') {
        for (let i = 1; i < it.k; i++) mark(it.pc, it.mr + it.dy * i, 'X:' + rx.main);
        if (it.order.length % 2 === 0) mark(it.pc, it.mr, 'X:' + rx.main);
        if (it.prods.length % 2 === 0) mark(it.pc, it.tr, 'X:' + rx.main);
      } else if (it.type === 'eqn') {
        mark(it.gap, it.row, (it.extra.length ? 'X:' : 'A:') + rx.main);
        for (const h of it.plusH) mark(h, it.row, 'X:' + rx.main);
        // nothing continues along the row out of a group of two or more
        // ("… → C + D → E" would read as if C and D reacted together)
        if (it.order.length > 1) mark(it.dx > 0 ? it.lo - 1 : it.hi + 1, it.row, 'X:eqn');
        if (it.prods.length > 1) mark(it.dx > 0 ? it.hi + 1 : it.lo - 1, it.row, 'X:eqn');
      } else if (it.type === 'seqn') {
        for (let i = 1; i < it.k; i++) mark(it.mh, it.wr + i, 'X:' + rx.main);
      } else if (it.type === 'veqn') {
        for (let i = 0; i <= it.k; i++) mark(it.ac, it.mr + it.dy * i, 'X:' + rx.main);
        for (const r of [it.mr, it.tr]) {
          mark(it.ac - 2, r, 'X:eqn');
          mark(it.ac + 2, r, 'X:eqn');
        }
      }
      if (it.type === 'late') {
        // the product becomes a co-reactant of the reaction it merges into
        const nit = it.nit;
        nit.extra = nit.extra.filter(x => x.id !== rx.prod);
        nit.co.push({ id: rx.prod, dir: 'in', slot: it.slot, h: it.th, r: it.tr, via: it.via });
        it.via.forEach(p => mark(p[0], p[1], 'X:' + nit.rx.main));
      }
      for (const x of it.extra) if (!pos.has(x.id) && !near.has(x.id)) near.set(x.id, { h: it.th, r: it.tr });
      for (const c of it.co) {
        put(c.id, c.h, c.r, it.dx || 1);
        c.via.forEach(p => mark(p[0], p[1], 'X:' + rx.main));
      }
      items.push(it);
    }

    // A compound made by several reactions is placed by the one on the
    // longest path; shorter routes into it are drawn as merging arrows.
    const owns = rx => prodBy.get(rx.prod).every(o => o === rx || pos.has(o.main) || laid.has(o.idx) || up(o.main) <= up(rx.main));
    const open = id => rxs.filter(rx => rx.main === id && !laid.has(rx.idx) && !pos.has(rx.prod) && owns(rx));
    const pickMainFor = id => {
      const l = rxs.filter(rx => rx.main === id && !laid.has(rx.idx));
      return l.length ? best(l, rx => [down(rx.prod), -rx.idx]) : null;
    };
    const pickMain = id => {
      const l = open(id);
      return l.length ? best(l, rx => [down(rx.prod), -rx.idx]) : null;
    };

    /* Feed chains of co-reactants are laid backwards from the co-node. */
    function layUpstream(id, flow) {
      for (const rx of prodBy.get(id)) {
        if (laid.has(rx.idx) || rx.prod !== id || pos.has(rx.main)) continue;
        // A compound made from something already drawn is a branch of
        // that compound, not a feed of this one.
        if (prodBy.get(rx.main).some(p => p.srcs.some(x => pos.has(x)))) continue;
        const cands = [];
        const add = (c, it) => { if (it) cands.push([c + it.cost, it]); };
        const p = pos.get(id);
        const over = h => (inSpan(h) ? 0 : 4);
        add(over(p.h - 2 * flow), tryH(rx, flow, true));
        for (let k = 1; k <= 3; k++) { add(1 + k, tryV(rx, 1, k, true)); add(1.2 + k, tryV(rx, -1, k, true)); }
        add(2.5 + over(p.h + 2 * flow), tryH(rx, -flow, true));
        if (!cands.length) continue;
        cands.sort((a, b) => a[0] - b[0]);
        const it = cands[0][1];
        commit(it);
        afterCommit(it, it.dx || flow);
        layUpstream(rx.main, it.dx || flow);
        pending.push([rx.main, it.dx || flow]);
      }
    }
    const pending = [];
    const near = new Map();   // co-node without a slot → where its reaction ended up
    // Branches that lead back into a reaction not laid yet: placed once
    // that reaction is, so they can aim for the point where they merge.
    const deferred = [];
    const waits = rx => consBy.get(rx.prod).some(nx => nx !== rx && nx.main !== rx.prod && !laid.has(nx.idx));
    const branch = (rx, flow) => { if (defers && waits(rx)) deferred.push([rx, flow]); else placeBranch(rx, flow); };
    function afterCommit(it, flow) {
      for (const c of it.co) if (c.dir === 'in') layUpstream(c.id, flow);
      for (const c of it.co) if (c.dir === 'out' || c.slot === 'stack') pending.push([c.id, flow]);
    }

    /* Where a compound joining reaction `rx` meets its arrow, once it is
       laid: the junction in the arrow gap, or beside a vertical shaft. */
    const joinAt = rx => {
      const it = items.find(i => i.rx === rx);
      if (!it) return null;
      if (it.gap != null) return { h: it.gap, r: it.R != null ? it.R : it.row };
      if (it.type === 'v' || it.type === 'vsplit') return { h: it.mh, r: it.jRow };
      if (it.type === 'vmerge') return { h: it.pc, r: (it.mr + it.tr) / 2 };
      return null;
    };

    function placeBranch(rx, flow) {
      if (laid.has(rx.idx) || pos.has(rx.prod)) return;
      const m = pos.get(rx.main);
      const cands = [];
      // Stay close to compounds this branch leads into, and never on the
      // far side of the source's own row from them.
      const pull = it => {
        let c = 0;
        // (variant) What the branch leads into is not drawn yet, and the
        // scheme goes on downwards: so does the branch.
        if (downs && it.tr < m.r && consBy.get(rx.prod).some(nx => nx.prod !== rx.main && !pos.has(nx.prod))) c += 2;
        for (const nx of consBy.get(rx.prod)) {
          if (!pos.get(nx.prod) || nx.prod === rx.main) continue;
          // a reaction already laid is joined where its arrow runs, not at its product
          const P = joinAt(nx) || pos.get(nx.prod);
          c += Math.abs(it.tr - P.r) * 0.6 + Math.abs(it.th - P.h) * 0.15;
          if ((it.tr - m.r) * (P.r - m.r) < 0) c += 2;
          // Compounds in the way of the later arrow (along the row, then up/down).
          const h0 = Math.min(it.th, P.h), h1 = Math.max(it.th, P.h);
          for (let h = h0 + 1; h < h1; h++) if (cell.get(K(h, it.tr)) === 'N') c += 1.5;
          const r0 = Math.min(it.tr, P.r), r1 = Math.max(it.tr, P.r);
          for (let r = r0 + 1; r < r1; r++) if (cell.get(K(P.h, r)) === 'N') c += 1.5;
        }
        // … and in line with other compounds already drawn that make the
        // same product, so their arrow into it can run straight.
        for (const ox of prodBy.get(rx.prod)) {
          const P = ox !== rx && pos.get(ox.main);
          if (!P) continue;
          c += Math.abs(it.tr - P.r) * 1.2;
          const h0 = Math.min(it.th, P.h), h1 = Math.max(it.th, P.h);
          for (let h = h0 + 1; h < h1; h++) if (cell.get(K(h, it.tr)) === 'N') c += 1.5;
        }
        return c;
      };
      const add = (c, f, it) => { if (it) cands.push([c + it.cost + (it.pen || 0) + pull(it), f, it]); };
      const fwd = inSpan(m.h + 2 * flow), back = inSpan(m.h - 2 * flow);
      // An equilibrium is always one straight line: no forks for it.
      const bends = !rx.edges.some(i => edges[i].equilibrium);
      if (fwd) add(0, flow, tryH(rx, flow));
      for (let k = 1; k <= 6; k++) {
        if (fwd && bends) {
          add(1 + (k - 1) * 0.9, flow, tryF(rx, flow, 1, k));
          add(1.15 + (k - 1) * 0.9, flow, tryF(rx, flow, -1, k));
        }
        add(1.3 + (k - 1), flow, tryV(rx, 1, k));
        add(1.5 + (k - 1), flow, tryV(rx, -1, k));
      }
      if (back) {
        add(1.7, -flow, tryH(rx, -flow));
        for (let k = 1; k <= 3 && bends; k++) {
          add(2.2 + (k - 1) * 0.9, -flow, tryF(rx, -flow, 1, k));
          add(2.3 + (k - 1) * 0.9, -flow, tryF(rx, -flow, -1, k));
        }
      }
      // A branch that merges back into a reaction already laid may take
      // that reaction's free co-reactant slot: its own arrow is then routed
      // freely, the merge is a short straight line.
      for (const nx of consBy.get(rx.prod)) {
        const nit = laid.has(nx.idx) && nx.main !== rx.prod && items.find(i => i.rx === nx);
        if (!nit || !nit.extra.some(x => x.id === rx.prod)) continue;
        const slots = [];
        if (nit.type === 'h' || (nit.type === 'split' && nit.lo === nit.row)) slots.push([nit.gap, nit.row - 1, 'up', []]);
        if (nit.type === 'h' || (nit.type === 'split' && nit.hi === nit.row)) slots.push([nit.gap, nit.row + 1, 'dn', []]);
        if ((nit.type === 'v' || nit.type === 'vsplit') && nit.k >= 2) {
          for (const d of [-1, 1]) slots.push([nit.mh + 2 * d, nit.jRow, d < 0 ? 'l' : 'r', [[nit.mh + d, nit.jRow]]]);
        }
        for (const [h, r, slot, via] of slots) {
          if (!canPut(h, r) || !inSpan(h) || !via.every(v => passOk(v[0], v[1]))) continue;
          // what the free arrow from the source costs: distance, compounds in the way
          let c = 2 + (Math.abs(h - m.h) / 2 + Math.abs(r - m.r)) * 0.3;
          for (let x = Math.min(h, m.h) + 1; x < Math.max(h, m.h); x++) if (cell.get(K(x, r)) === 'N') c += 1.5;
          for (let y = Math.min(r, m.r) + 1; y < Math.max(r, m.r); y++) if (cell.get(K(m.h, y)) === 'N') c += 1.5;
          const { ins, outs } = coOf(rx);
          cands.push([c, flow, { type: 'late', rx, dx: nit.dx || 1, mh: m.h, mr: m.r, th: h, tr: r, co: [], cost: 0, nit, slot, via,
                                 extra: ins.concat(outs).map(id => ({ id, dir: rx.srcs.includes(id) ? 'in' : 'out' })) }]);
        }
      }
      if (!cands.length) {
        // Nowhere tidy: nearest free cell, routed freely.
        for (let d = 1; d < 40; d++) {
          for (const [dh, dr] of [[0, d], [2 * flow, d], [-2 * flow, d], [0, -d], [2 * d * flow, 0]]) {
            const h = m.h + dh, r = m.r + dr;
            if (odd(h) || !canPut(h, r) || !inSpan(h)) continue;
            const it = { type: 'free', rx, mh: m.h, mr: m.r, th: h, tr: r, co: [],
                         extra: coOf(rx).ins.concat(coOf(rx).outs).map(id => ({ id, dir: rx.srcs.includes(id) ? 'in' : 'out' })) };
            commit(it);
            layChain(rx.prod, flow);
            return;
          }
        }
        return;
      }
      cands.sort((a, b) => a[0] - b[0]);
      const [, f, it] = cands[0];
      commit(it);
      afterCommit(it, f);
      layChain(rx.prod, f);
    }

    function layChain(start, flow) {
      const seg = [start];
      let cur = start, turn = null;
      for (;;) {
        // (variant) two lanes out of here that meet again: laid as one block
        const dmd = diamonds && findDiamond(cur), done = dmd && layDiamond(dmd);
        if (done) {
          for (const it of done) afterCommit(it, flow);
          for (const L of dmd.lanes) for (const id of L.ids) if (!seg.includes(id)) seg.push(id);
          seg.push(cur = dmd.M.prod);
          continue;
        }
        const rx = pickMain(cur);
        if (!rx) break;
        // (variant) Turn one step early when the reaction after this one has
        // several educts or products: at the row's end it would have to go
        // down with its partners beside the arrow; after the turn it fits
        // along the next row, drawn equal.
        if (early && !inSpan(pos.get(cur).h + 4 * flow)) {
          const nx = pickMainFor(rx.prod);
          const many = nx && !isPlus(nx) && nx !== rx &&
            (coOf(nx).ins.some(id => !pos.has(id)) || nx.prods.filter(p => !pos.has(p)).length > 1);
          if (many) { turn = rx; break; }
        }
        let it = inSpan(pos.get(cur).h + 2 * flow) ? tryH(rx, flow) : null;
        if (it && isPlus(rx) && it.type !== 'eqn') {
          // an equation that does not fit along the row goes down a level
          for (let k = 1; k <= 3; k++) {
            const t = tryV(rx, 1, k);
            if (t && (t.type === 'veqn' || t.type === 'seqn')) { it = t; break; }
          }
        }
        if (it && it.cost > 0) {
          // No room above/below the arrow here: step down a level instead,
          // with the co-reactants beside the vertical arrow.
          for (let k = 2; k <= 4; k++) {
            const t = tryV(rx, 1, k);
            if (t && !t.cost) { it = t; break; }
          }
        }
        if (!it) { turn = rx; break; }
        commit(it);
        afterCommit(it, flow);
        cur = rx.prod;
        seg.push(cur);
      }
      // Keep the column under the turning compound free for the turn.
      const lane = [];
      if (turn) {
        const m = pos.get(cur);
        for (let i = 1; i <= 24; i++) {
          const k = K(m.h, m.r + i);
          if (!cell.has(k)) { cell.set(k, 'T'); lane.push(k); }
        }
      }
      for (const id of seg) {
        for (const rx of open(id)) if (rx !== turn) branch(rx, flow);
        layUpstream(id, flow);
      }
      while (pending.length) {
        const [id, f] = pending.shift();
        for (const rx of open(id)) branch(rx, f);
      }
      lane.forEach(k => { if (cell.get(k) === 'T') cell.delete(k); });
      if (turn && !laid.has(turn.idx) && !pos.has(turn.prod)) {
        const m = pos.get(cur);
        let it = null;
        // Leave a spare row when the next reaction needs a slot above.
        const nextRx = pickMainFor(turn.prod);
        const spare = nextRx && coOf(nextRx).ins.concat(coOf(nextRx).outs).filter(id => !pos.has(id)).length >= 2 ? 1 : 0;
        for (let k = Math.max(1, maxR - m.r + 1 + spare); k <= maxR - m.r + 8; k++) {
          const t = tryV(turn, 1, k);
          if (t && (!it || t.cost < it.cost)) it = t;
          if (it && !it.cost) break;
        }
        if (it) {
          commit(it);
          afterCommit(it, flow);
          layChain(turn.prod, -flow);
        } else {
          // Blocked: wrap like text onto a new row.
          const e0 = minH - (odd(minH) ? 1 : 0);
          const e1 = maxH + (odd(maxH) ? 1 : 0);
          const it2 = { type: 'wrap', rx: turn, mh: m.h, mr: m.r, th: flow > 0 ? e0 : e1, tr: maxR + 1,
                        co: [], extra: coOf(turn).ins.concat(coOf(turn).outs).map(id => ({ id, dir: turn.srcs.includes(id) ? 'in' : 'out' })) };
          laid.add(turn.idx);
          put(turn.prod, it2.th, it2.tr, flow);
          items.push(it2);
          for (const x of it2.extra) if (!pos.has(x.id) && !near.has(x.id)) near.set(x.id, { h: it2.th, r: it2.tr });
          layChain(turn.prod, flow);
        }
      }
    }

    /* Chains start at the compound with the longest way ahead; a root
       that only ever joins another reaction is placed with it. */
    const starts = nodes.map(n => n.id)
      .filter(id => !prodBy.get(id).length && rxs.some(rx => rx.main === id))
      .sort((a, b) => down(b) - down(a) || order.get(a) - order.get(b));
    const fresh = () => (pos.size ? maxR + 2 : 0);
    for (const id of starts) {
      if (pos.has(id)) continue;
      for (const rx of consBy.get(id)) if (pos.has(rx.prod)) layUpstream(rx.prod, pos.get(rx.prod).jdir || 1);
      if (pos.has(id)) continue;
      put(id, pos.size ? minH : 0, fresh());
      layChain(id, 1);
    }
    while (deferred.length) {
      const [rx, f] = deferred.shift();
      if (!laid.has(rx.idx) && !pos.has(rx.prod) && pos.has(rx.main)) placeBranch(rx, f);
    }
    // Whatever is left (cycles, isolated compounds, co-nodes without a
    // free slot). Loose compounds line up in one row.
    let loose = null;
    for (;;) {
      const left = nodes.find(n => !pos.has(n.id));
      if (!left) break;
      const e0 = Number.isFinite(minH) ? minH - (odd(minH) ? 1 : 0) : 0;
      const alone = !open(left.id).length;
      const at = near.get(left.id);
      let spot = null;
      if (at) {
        // Nearest free cell next to its reaction: same row first.
        for (let d = 1; d < 12 && !spot; d++) {
          for (const [dh, dr] of [[-2 * d, 0], [2 * d, 0], [0, d], [-2, d], [2, d], [0, -d]]) {
            const h = at.h + dh, r = at.r + dr;
            if (!odd(h) && canPut(h, r) && inSpan(h)) { spot = { h, r }; break; }
          }
        }
      }
      if (spot) put(left.id, spot.h, spot.r);
      else if (alone && loose && inSpan(loose.h + 2) && canPut(loose.h + 2, loose.r)) put(left.id, loose.h + 2, loose.r);
      else put(left.id, e0, fresh());
      loose = alone ? pos.get(left.id) : null;
      layChain(left.id, 1);
    }

    // Drop rows that hold no compound; arrows through them just shorten.
    const used = [...new Set([...pos.values()].map(p => p.r))].sort((a, b) => a - b);
    const rowMap = new Map(used.map((r, i) => [r, i]));
    const remap = r => {
      if (rowMap.has(r)) return rowMap.get(r);
      let i = 0;
      while (i < used.length && used[i] < r) i++;
      return i - 0.5;
    };
    for (const p of pos.values()) p.r = rowMap.get(p.r);
    for (const it of items) {
      it.row = remap(it.row); it.mr = remap(it.mr); it.tr = remap(it.tr);
      if (it.jRow != null) it.jRow = remap(it.jRow);
      if (it.wr != null) it.wr = remap(it.wr);
      if (it.lo != null) it.lo = remap(it.lo);
      if (it.hi != null) it.hi = remap(it.hi);
      if (it.R != null) it.R = remap(it.R);
    }
    const h0 = Math.min(...[...pos.values()].map(p => p.h));
    const hShift = h0 - (odd(h0) ? 1 : 0);
    for (const p of pos.values()) p.h -= hShift;
    for (const it of items) {
      it.mh -= hShift; it.th -= hShift;
      if (it.gap != null) it.gap -= hShift;
      if (it.ac != null) it.ac -= hShift;
      if (it.pc != null) it.pc -= hShift;
      if (it.plusH) it.plusH = it.plusH.map(h => h - hShift);
    }
    const laidEdges = new Set(items.flatMap(it => it.rx.edges));
    /* How much of this plan is NOT tidy grid: arrows routed freely or
       wrapped, compounds joining from elsewhere, long vertical runs, and
       (without splits) every reaction whose products are not drawn equal. */
    let cost = (edges.length - laidEdges.size) * 3 + used.length * 0.4;
    // cells an arrow outside the grid has to travel
    const far = (a, b) => { const P = pos.get(a), Q = pos.get(b); return P && Q ? Math.abs(P.h - Q.h) / 2 + Math.abs(P.r - Q.r) : 0; };
    for (const it of items) {
      cost += { wrap: 6, free: 4, late: 2, fork: 0.6 }[it.type] || 0;
      if (it.type === 'free' || it.type === 'late' || it.type === 'wrap') cost += far(it.rx.main, it.rx.prod) * 0.5;
      for (const x of it.extra) cost += (x.own ? 0.8 : 3) + Math.max(0, far(x.id, it.rx.prod) - 1) * 0.5;
      if (it.type === 'v' || it.type === 'vsplit' || it.type === 'vmerge') cost += (it.k - 1) * 0.4;
      cost += it.pen || 0;
      // Educts or products of one reaction not drawn equal — a co-reactant
      // or co-product above / below / beside the arrow instead of a merge or
      // a split — cost more than a few bends, less than a crossing.
      if (!(flagged(it.rx) && /eqn$/.test(it.type)) &&
          it.co.some(c => (c.dir === 'in' && c.slot !== 'merge' && c.slot !== 'eqn') ||
                          (c.dir === 'out' && c.slot !== 'split' && c.slot !== 'eqn'))) cost += 6;
      if (flagged(it.rx) && !/eqn$/.test(it.type)) cost += 5;
      if (it.type === 'seqn') cost += (it.k - 1) * 0.4;
    }
    return { pos, items, rows: used.length, laidEdges, cost };
  }

  /* Every distinct plan worth routing, cheapest grid first: with and
     without equal splits, with and without waiting for merge points,
     with and without the "+" equations, and the plain planner
     (co-reactants always above the arrow). */
  const PLAN_VARIANTS = [
    { split: true,  defer: true },  { split: true,  defer: false },
    { split: false, defer: true },  { split: false, defer: false },
    { split: true,  defer: false, lanes: false }, { split: false, defer: false, lanes: false },
    // a branch that comes back waits and then merges equal with the other educts
    { split: true,  defer: true,  lanes: false },
    // two lanes that meet again drawn as a diamond
    { split: true,  defer: true,  diamond: true }, { split: true,  defer: false, diamond: true },
    // a compound that only feeds a merge moves into it
    { split: true,  defer: false, early: true, gather: true },
    // equations drawn the usual way (where an equation routes badly)
    { split: true,  defer: true, plus: false }, { split: false, defer: false, lanes: false, plus: false },
    // co-reactants above the arrow (where a merge routes badly)
    { split: true,  defer: true, merge: false },
    // turning a step early, so a merge or split after the turn fits the row
    { split: true,  defer: true, early: true }, { split: true,  defer: false, early: true },
    // side branches down towards the rest of the scheme (loops close short)
    { split: true,  defer: true, down: true }, { split: true,  defer: false, down: true }
  ];
  function planCandidates(nodes, edges, cols) {
    const out = [], seen = new Set();
    for (const v of PLAN_VARIANTS) {
      const p = planLayout(nodes, edges, cols, v);
      const key = JSON.stringify([[...p.pos].map(([id, q]) => [id, q.h, q.r]), p.items.map(it => it.type)]);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(p);
    }
    return out.sort((a, b) => a.cost - b.cost);
  }
  const bestPlan = (nodes, edges, cols) => planCandidates(nodes, edges, cols)[0];

  class SchemeGraphEditor {
    constructor(container, scheme, opts) {
      opts = opts || {};
      this.container = container;
      this.scheme = scheme || { nodes: [], edges: [] };
      this.scheme.nodes = this.scheme.nodes || [];
      this.scheme.edges = this.scheme.edges || [];
      this.opts = opts;
      this.readOnly = !!opts.readOnly;
      this.onChange = opts.onChange || (() => {});
      this.onSelectNode = opts.onSelectNode || (() => {});
      this.onSelectEdge = opts.onSelectEdge || (() => {});
      this.onRequestStructEdit = opts.onRequestStructEdit || (() => {});
      this.onRequestEdgeStructEdit = opts.onRequestEdgeStructEdit || null;
      this.onNodeClick = opts.onNodeClick || (() => {});

      this.viewX = 40;
      this.viewY = 40;
      this.scale = 1;
      this.selected = null;
      this.drag = null;
      this.pan = null;
      this.edgeDraft = null;
      this.tap = null;
      this.pinch = null;
      this._pointers = new Map();
      this._mb = new Map();        // viewer: nodeId → {w,h} of the drawn structure
      this._nat = new Map();       // viewer: structure → natural {w,h} at OCL's own bond length
      this._cell = null;           // viewer: per-scheme cell size + common structure scale
      this._renderGen = 0;
      this.revealedIds = new Set(opts.revealedNodeIds || []);
      this._build();
      this._measureCell();
      this._ensurePositions();
      this.refresh();
      this._bindEvents();
      this._bindResize();
    }

    /* ─── DOM scaffolding ──────────────────────────────────────── */

    _build() {
      this.container.classList.add('sg-host');
      if (this.readOnly) this.container.classList.add('sg-readonly');
      const defs = `
          <defs>
            <marker id="sg-arrow" viewBox="0 0 ${ARROW_HEAD} ${ARROW_HEAD}" refX="${ARROW_HEAD - 1}" refY="${ARROW_HEAD/2}" markerWidth="${ARROW_HEAD}" markerHeight="${ARROW_HEAD}" orient="auto-start-reverse">
              <path d="M0,0 L${ARROW_HEAD},${ARROW_HEAD/2} L0,${ARROW_HEAD} z" fill="#3a3a35"/>
            </marker>
            <marker id="sg-arrow-sel" viewBox="0 0 ${ARROW_HEAD} ${ARROW_HEAD}" refX="${ARROW_HEAD - 1}" refY="${ARROW_HEAD/2}" markerWidth="${ARROW_HEAD}" markerHeight="${ARROW_HEAD}" orient="auto-start-reverse">
              <path d="M0,0 L${ARROW_HEAD},${ARROW_HEAD/2} L0,${ARROW_HEAD} z" fill="#e2001a"/>
            </marker>
            <marker id="sg-arrow-sm" viewBox="0 0 ${ARROW_HEAD} ${ARROW_HEAD}" refX="${ARROW_HEAD - 1}" refY="${ARROW_HEAD/2}" markerWidth="${ARROW_HEAD * 0.72}" markerHeight="${ARROW_HEAD * 0.72}" orient="auto">
              <path d="M0,0 L${ARROW_HEAD},${ARROW_HEAD/2} L0,${ARROW_HEAD} z" fill="#3a3a35"/>
            </marker>
            <marker id="sg-arrow-sm-sel" viewBox="0 0 ${ARROW_HEAD} ${ARROW_HEAD}" refX="${ARROW_HEAD - 1}" refY="${ARROW_HEAD/2}" markerWidth="${ARROW_HEAD * 0.72}" markerHeight="${ARROW_HEAD * 0.72}" orient="auto">
              <path d="M0,0 L${ARROW_HEAD},${ARROW_HEAD/2} L0,${ARROW_HEAD} z" fill="#e2001a"/>
            </marker>
            <marker id="sg-harpoon" viewBox="0 0 ${ARROW_HEAD} ${ARROW_HEAD}" refX="${ARROW_HEAD - 1}" refY="${ARROW_HEAD/2}" markerWidth="${ARROW_HEAD}" markerHeight="${ARROW_HEAD}" orient="auto">
              <path d="M0,0 L${ARROW_HEAD},${ARROW_HEAD/2} L0,${ARROW_HEAD/2} z" fill="#3a3a35"/>
            </marker>
            <marker id="sg-harpoon-sel" viewBox="0 0 ${ARROW_HEAD} ${ARROW_HEAD}" refX="${ARROW_HEAD - 1}" refY="${ARROW_HEAD/2}" markerWidth="${ARROW_HEAD}" markerHeight="${ARROW_HEAD}" orient="auto">
              <path d="M0,0 L${ARROW_HEAD},${ARROW_HEAD/2} L0,${ARROW_HEAD/2} z" fill="#e2001a"/>
            </marker>
          </defs>`;
      const canvas = `<svg class="sg-canvas" xmlns="${NS}" tabindex="0">${defs}<g class="sg-viewport"></g></svg>`;

      if (this.readOnly) {
        // Viewer: canvas on plain ground, zoom rail on the right.
        this.container.innerHTML = `
          <div class="sg-body">
            ${canvas}
            <div class="sg-rail sg-toolbar" role="toolbar" aria-label="Ansicht">
              <button class="sg-rail-btn" data-act="zoomin" title="Vergrößern" aria-label="Vergrößern">＋</button>
              <span class="sg-zoom-label" title="Zoom (Strg + Mausrad)">100%</span>
              <button class="sg-rail-btn" data-act="zoomout" title="Verkleinern" aria-label="Verkleinern">−</button>
              <button class="sg-rail-btn" data-act="fit" title="Auf Breite einpassen" aria-label="Einpassen">⤢</button>
            </div>
          </div>`;
      } else {
        this.container.innerHTML = `
          <div class="sg-toolbar">
            <button class="sg-btn" data-act="add">＋ Knoten</button>
            <button class="sg-btn sg-layout-btn" data-act="layout" title="Knoten automatisch anordnen">Auto-Layout</button>
            <button class="sg-btn sg-layout-btn" data-act="free" title="Knoten frei verschieben (die Pfeile folgen, ohne Auto-Layout)">✥ Frei</button>
            <button class="sg-btn" data-act="fit">↔ Anpassen</button>
            <button class="sg-btn" data-act="zoomin" title="Zoom +">＋</button>
            <button class="sg-btn" data-act="zoomout" title="Zoom -">−</button>
            <span class="sg-zoom-label">100 %</span>
            <span class="sg-hint">⇢-Griff auf Knoten ziehen = Pfeil, auf einen Pfeil = weiteres Edukt · ◦ am gewählten Pfeil auf Knoten = weiteres Produkt · freien Knoten auf einen Pfeil ziehen = Reagenz / Cofaktor · Klick auf Pfeil = Text eintippen · Doppelklick = Ketcher · G = vorgegeben · Entf = löschen · Strg + Mausrad = Zoom</span>
          </div>` + canvas;
      }
      this.svg = this.container.querySelector('.sg-canvas');
      this.viewport = this.svg.querySelector('.sg-viewport');
      if (!this.readOnly) this._buildInlineEdit();
      this.zoomLabel = this.container.querySelector('.sg-zoom-label');
      this.toolbar = this.container.querySelector('.sg-toolbar');
    }

    /* ─── Cell size ───────────────────────────────────────────── */

    /* In the viewer every structure of a scheme is drawn with the SAME
       bond length, as on the exam sheet: each molecule is measured at
       OCL's natural size, one common factor shrinks them only as far as
       the largest one needs (CELL_MAX_W × CELL_MAX_H), and the cells of
       this scheme grow to hold that largest structure. The editor keeps
       its fixed boxes. */
    get NW()  { return this._cell ? this._cell.nw : NODE_W; }
    get NH()  { return this._cell ? this._cell.nh : NODE_H; }
    get FOW() { return this.NW - (NODE_W - V_FO_W); }
    get FOH() { return this.NH - (NODE_H - V_FO_H); }
    get VCY() { return V_FO_Y + this.FOH / 2; }

    _natural(n) {
      const key = (n.mol || n.smiles || '') + '|' + JSON.stringify(n.alias || null);
      if (this._nat.has(key)) return this._nat.get(key);
      let r = null;
      try {
        const o = { width: NATURAL_BOX, height: NATURAL_BOX, autoCrop: true, autoCropMargin: 2 };
        if (n.alias) o.alias = n.alias;
        const d = document.createElement('div');
        const el = n.mol ? window.MolRenderer.drawMol(n.mol, d, o) : window.MolRenderer.drawSmiles(n.smiles, d, o);
        if (el && el.getAttribute) r = { w: parseFloat(el.getAttribute('width')) || 0, h: parseFloat(el.getAttribute('height')) || 0 };
      } catch (_) { r = null; }
      this._nat.set(key, r);
      return r;
    }

    /* Returns true when the cell size changed (the layout must follow). */
    _measureCell() {
      if (!this.readOnly || !window.OCL || typeof window.MolRenderer === 'undefined') return false;
      let mw = 0, mh = 0;
      for (const n of this.scheme.nodes) {
        if (!(n.mol || n.smiles)) continue;
        const r = this._natural(n);
        if (r) { mw = Math.max(mw, r.w); mh = Math.max(mh, r.h); }
      }
      if (!mw || !mh) return false;
      // a text-only node (a compound given by name) keeps its name on one
      // line: the cells grow to fit it instead of the name running into
      // the arrow
      let tw = 0;
      for (const n of this.scheme.nodes) {
        if (!(n.mol || n.smiles) && n.text) tw = Math.max(tw, textNodeWidth(n) + 8);
      }
      const f = Math.min(1, CELL_MAX_W / mw, CELL_MAX_H / mh);
      const nw = Math.max(V_FO_W, Math.ceil(mw * f), tw) + (NODE_W - V_FO_W);
      const nh = Math.max(V_FO_H, Math.ceil(mh * f)) + (NODE_H - V_FO_H);
      const c = this._cell;
      const changed = !c || c.nw !== nw || c.nh !== nh || Math.abs(c.f - f) > 1e-3;
      this._cell = { nw, nh, f };
      return changed;
    }

    /* ─── Layout ──────────────────────────────────────────────── */

    _isAutoLayout() {
      return this.scheme.layout !== 'manual';
    }

    /* Label metrics of an arrow at this scheme's scale (a structure on the
       arrow follows the compounds' bond length). */
    _metrics(edge) {
      return edgeLabelMetrics(edge, this.readOnly && this._cell ? this._cell.f : 1, !this.readOnly);
    }

    _ensurePositions() {
      const missingAny = this.scheme.nodes.some(n => typeof n.x !== 'number' || typeof n.y !== 'number');
      if (missingAny || this._isAutoLayout()) this.autoLayout();
    }

    /* ── Reaction layout ──────────────────────────────────────────────
       planLayout() decides the grid; this turns it into pixels. Arrow
       gaps are as wide as their reagent text needs (plus the junction
       stub where something joins or forks); row gaps grow where a
       vertical arrow carries text. */
    autoLayout(opts) {
      opts = opts || {};
      const nodes = this.scheme.nodes;
      const E = this.scheme.edges;
      if (!nodes.length) return;
      const cols = Math.max(2, opts.columns || this.layoutColumns || this._bestCols());
      const plans = planCandidates(nodes, E, cols);
      if (opts.dry) return this._placePlan(plans[0], true);
      // Several distinct plans: route each one off-screen and keep the one
      // whose arrows cross and bend least.
      let best = plans[0];
      if (plans.length > 1) {
        let bestScore = Infinity;
        for (const p of plans) {
          this._placePlan(p);
          const sc = this._routeScore(p) + p.cost;
          if (sc < bestScore - 1e-6) { bestScore = sc; best = p; }
        }
      }
      this._placePlan(best);
      best.sig = this._planSig();
      this._plan = best;
      this.scheme.layout = 'auto';
      this._layoutCols = cols;
    }

    /* Plan → pixels: arrow gaps as wide as their text needs, row gaps
       where vertical arrows carry text. With `dry` only the width. */
    _placePlan(plan, dry) {
      const nodes = this.scheme.nodes;
      const E = this.scheme.edges;
      const { pos, items } = plan;

      const forkKeys = new Set(items.filter(it => it.type === 'fork').map(it => it.rx.main + '|' + it.gap));
      const joinsIn = it => it.co.some(c => c.dir === 'in') || it.extra.some(x => x.dir === 'in');
      const hasJ = it => it.type === 'fork' || it.type === 'stack' || it.type === 'merge' || it.co.length > 0 || it.extra.length > 0 ||
                         forkKeys.has(it.rx.main + '|' + it.gap);
      let maxHx = 0;
      for (const p of pos.values()) maxHx = Math.max(maxHx, p.h);
      const horiz = it => it.type === 'h' || it.type === 'fork' || it.type === 'stack' || it.type === 'split' || it.type === 'eqn' || it.type === 'merge';
      const gapW = new Map();
      const atLeast = (h, w) => gapW.set(h, Math.max(gapW.get(h) || 0, w));
      // (the editor's boxes carry a handle on their right edge)
      const plusW = this.readOnly ? PLUS_W : PLUS_W + 16;
      for (const it of items) {
        if (it.type === 'eqn') {
          // the arrow as wide as its text; a narrow gap for each "+"
          atLeast(it.gap, this._metrics(E[it.rx.edges[0]]).shaft + (it.extra.some(x => x.dir === 'in') ? JUNCTION_OFF + 6 : 0));
          for (const h of it.plusH) atLeast(h, plusW);
          continue;
        }
        if (it.type === 'veqn') { atLeast(it.ac, plusW); continue; }
        if (!horiz(it)) continue;
        const e0 = E[it.rx.edges[0]];
        const m = this._metrics(e0);
        // A Y spends a diagonal run before (join) or after (fork) the junction.
        // Joins slide their co-reactant back instead (see below), so only a
        // fork widens its gap.
        const yRun = isY(e0) && it.type === 'fork' ? Y_RUN : 0;
        // A split's text sits on the shaft between the joins and the bus.
        const w = it.type === 'split'
          ? (joinsIn(it) ? JUNCTION_OFF + 6 : 0) + m.shaft + BRANCH_W
          : it.type === 'merge'
          // bus near the educts, the shaft, (a second bus near the products)
          ? JUNCTION_OFF + 6 + m.shaft + (it.prods.length > 1 ? BRANCH_W : 0) + (isY(e0) ? Y_RUN / 2 : 0)
          : m.shaft + (hasJ(it) ? JUNCTION_OFF + 6 : 0) + yRun;
        gapW.set(it.gap, Math.max(gapW.get(it.gap) || 0, w));
      }
      const colX = [];
      let x = 0;
      for (let h = 0; h <= maxHx + 1; h++) {
        colX[h] = x;
        if (h % 2 === 0) x += this.NW;
        else {
          if (!gapW.has(h)) gapW.set(h, GAP_EMPTY);
          x += gapW.get(h);
        }
      }
      const jOff = g => Math.min(JUNCTION_OFF, (g % 2 ? gapW.get(g) : this.NW) / 2);
      const jx = (g, dir) => {
        const w = g % 2 ? gapW.get(g) : this.NW;
        return dir < 0 ? colX[g] + w - jOff(g) : colX[g] + jOff(g);
      };

      const nRows = plan.rows;
      const rowGap = new Array(Math.max(0, nRows)).fill(STACK_GAP + 8);
      for (const it of items) {
        if (it.type === 'vmerge') {
          // the bus just past the educts; on one row step also the shaft
          // with its text and (several products) the second bus
          const m = this._metrics(E[it.rx.edges[0]]);
          const giB = it.dy > 0 ? Math.floor(it.mr) : Math.ceil(it.mr) - 1;
          const needB = it.k === 1
            ? JUNCTION_STUB + 14 + (m.vLen ? m.vLen + 16 : 24) + (it.prods.length > 1 ? BRANCH_W : 0)
            : JUNCTION_STUB + 24;
          if (giB >= 0 && giB < rowGap.length) rowGap[giB] = Math.max(rowGap[giB], needB);
          if (it.k > 1 && it.prods.length > 1) {
            const gi = it.dy > 0 ? Math.ceil(it.tr) - 1 : Math.floor(it.tr);
            if (gi >= 0 && gi < rowGap.length) rowGap[gi] = Math.max(rowGap[gi], BRANCH_W + 16);
          }
          continue;
        }
        if (it.type !== 'v' && it.type !== 'vsplit' && it.type !== 'veqn' && it.type !== 'seqn') continue;
        const m = this._metrics(E[it.rx.edges[0]]);
        // a vertical split also needs room for its bus and branches
        const need = it.type === 'vsplit'
          ? (it.k === 1 ? (m.vLen ? m.vLen + 16 : 24) : 16) + BRANCH_W
          : (m.vLen ? m.vLen + 26 : 0);
        if (!need) continue;
        const gi = it.dy > 0 ? it.tr - 1 : it.tr;
        if (gi >= 0 && gi < rowGap.length) rowGap[gi] = Math.max(rowGap[gi], need);
      }
      for (const it of items) {
        if (!horiz(it)) continue;
        const m = this._metrics(E[it.rx.edges[0]]);
        if (!m.mol) continue;
        // The structure sits above the text and reaches into the row gap above
        // (or below the lower text, reaching into the gap below).
        const gi = m.molBelow ? Math.floor(it.row) : Math.ceil(it.row) - 1;
        const need = (m.molBelow ? m.below.length * LABEL_LINE_H + (m.curve ? m.curve.H : 0) : m.above.length * LABEL_LINE_H) +
                     m.molH + EMOL_GAP + LABEL_GAP - this.NH / 2 + 20;
        if (gi >= 0 && gi < rowGap.length) rowGap[gi] = Math.max(rowGap[gi], STACK_GAP + 8 + need);
      }
      const rowY = [];
      let y = 0;
      for (let r = 0; r < nRows; r++) { rowY[r] = y; y += this.NH + rowGap[r]; }

      const xOf = p => p.h % 2 ? jx(p.h, p.jdir) - this.NW / 2 : colX[p.h];
      if (dry) {
        const xs = [...pos.values()].map(xOf);
        return Math.max(...xs) + this.NW - Math.min(...xs);
      }
      this._rowOf = new Map();
      for (const n of nodes) {
        const p = pos.get(n.id);
        if (!p) continue;
        n.x = xOf(p);
        n.y = rowY[p.r];
        this._rowOf.set(n.id, p.r);
      }
      for (const it of items) {
        it.hasJ = hasJ(it);
        if (it.gap != null) it.jx = jx(it.gap, it.dx || 1);
        // a vertical equation's arrow and "+" run down the middle of its column
        if (it.type === 'veqn') it.ax = colX[it.ac] + gapW.get(it.ac) / 2;
      }
      // Y joins: slide each co-reactant back along its row so its line
      // reaches the junction on a slant. Column widths stay as they are;
      // the slide stops short of any other compound and of the main
      // reactant's centre.
      const byId = new Map(nodes.map(n => [n.id, n]));
      for (const it of items) {
        if (it.type !== 'h' || !isY(E[it.rx.edges[0]])) continue;
        const dir = it.dx || 1, main = byId.get(it.rx.main);
        for (const c of it.co) {
          const cn = byId.get(c.id);
          if (!cn || c.slot === 'stack' || !main) continue;
          let sft = Math.min(Y_RUN, Math.abs(cn.x - main.x) - 12);
          for (const o of nodes) {
            if (o === cn || Math.abs(o.y - cn.y) >= this.NH) continue;
            const behind = dir > 0 ? cn.x - (o.x + this.NW) : o.x - (cn.x + this.NW);
            if (behind >= 0) sft = Math.min(sft, behind - 16);
          }
          if (sft > 8) cn.x -= dir * sft;
        }
      }
      this._compactForks(plan, rowY);
      this._compactColumns(plan, colX);
      // where each compound sits before _alignBranches evens out branches
      for (const n of nodes) n._bx = n.x;
    }

    /* An even number of products (or educts) of one reaction leaves the
       row between them free at first. Here the two halves close up to
       neighbouring rows, the source (or product) centred between them —
       whole row bands move, the products and what continues along their
       rows — as long as nothing else uses that middle row and every
       arrow that gets shorter keeps room for its text. */
    _compactForks(plan, rowY) {
      const { pos, items } = plan;
      const E = this.scheme.edges;
      const byId = new Map(this.scheme.nodes.map(n => [n.id, n]));
      const horizT = new Set(['h', 'fork', 'stack', 'split', 'merge', 'eqn']);
      const vertT = new Set(['v', 'vsplit', 'veqn', 'seqn', 'vmerge']);
      const moved = new Set();
      const sides = [];
      for (const it of items) {
        if (it.type === 'split' && it.lo < it.row && it.hi > it.row) {
          sides.push({ hub: it, R: it.row, dir: it.dx, from: it.gap, members: [it.rx.prod, ...it.co.filter(c => c.slot === 'split').map(c => c.id)] });
        }
        if (it.type === 'merge') {
          if (it.order.length % 2 === 0) sides.push({ hub: it, R: it.R, dir: -it.dx, from: it.gap, members: it.order });
          if (it.prods.length % 2 === 0) sides.push({ hub: it, R: it.R, dir: it.dx, from: it.gap, members: it.prods });
        }
      }
      for (const sd of sides) {
        const R = sd.R, on = h => (h - sd.from) * sd.dir > 0;
        const mr = sd.members.map(id => pos.get(id)).filter(Boolean).map(p => p.r);
        const uR = mr.filter(r => r < R), lR = mr.filter(r => r > R);
        if (!uR.length || !lR.length || Math.max(...uR) !== R - 1 || Math.min(...lR) !== R + 1) continue;
        const u0 = Math.min(...uR), l1 = Math.max(...lR);
        const U = new Set(), L = new Set();
        for (const [id, p] of pos) {
          if (!on(p.h)) continue;
          if (p.r >= u0 && p.r <= R - 1) U.add(id);
          else if (p.r >= R + 1 && p.r <= l1) L.add(id);
        }
        if ([...U, ...L].some(id => moved.has(id))) continue;
        const hs = [...U, ...L].map(id => pos.get(id).h);
        const h0 = Math.min(...hs), h1 = Math.max(...hs);
        // the middle row must be empty over the whole span …
        let ok = ![...pos.values()].some(p => p.r === R && on(p.h) && p.h >= h0 && p.h <= h1);
        const band = id => U.has(id) ? 'U' : L.has(id) ? 'L' : '';
        let dUmax = Infinity, dLmax = Infinity, dSum = Infinity, gapNeed = STACK_GAP + 8;
        for (const it of items) {
          if (!ok) break;
          if (it === sd.hub) continue;
          const m = this._metrics(E[it.rx.edges[0]]);
          if (horizT.has(it.type)) {
            const a = Math.min(it.mh, it.th), b = Math.max(it.mh, it.th);
            const overlaps = b >= h0 && a <= h1 && on(a) && on(b);
            // … no arrow may run along it …
            if (overlaps && it.row > R - 1 && it.row < R + 1) { ok = false; break; }
            // … and no arrow along a band may leave the band sideways
            const ends = [it.rx.main, it.rx.prod].map(band);
            if (ends[0] !== ends[1] && (ends[0] || ends[1]) && Math.abs(pos.get(it.rx.main).r - pos.get(it.rx.prod).r) < 0.5) { ok = false; break; }
            // text and structures between the two bands
            if (band(it.rx.prod) === 'U' && m.molBelow) gapNeed = Math.max(gapNeed, STACK_GAP + 8 + m.below.length * LABEL_LINE_H + m.molH + EMOL_GAP + LABEL_GAP - this.NH / 2 + 20);
            if (band(it.rx.prod) === 'L' && m.mol && !m.molBelow) gapNeed = Math.max(gapNeed, STACK_GAP + 8 + m.above.length * LABEL_LINE_H + m.molH + EMOL_GAP + LABEL_GAP - this.NH / 2 + 20);
          } else if (vertT.has(it.type)) {
            const bm = band(it.rx.main), bp = band(it.rx.prod);
            if (!bm && !bp) continue;
            const A = byId.get(it.rx.main), B = byId.get(it.rx.prod);
            if (!A || !B) continue;
            const top = A.y < B.y ? A : B, low = top === A ? B : A;
            const need = Math.max(30, m.vLen ? m.vLen + 16 : 0);
            const room = (low.y - top.y - this.NH) - need;
            const bt = band(top.id), bl = band(low.id);
            if (bt === 'U' && bl === 'L') gapNeed = Math.max(gapNeed, need + 10);
            else if (bt === 'U' && !bl && low.y > top.y) dUmax = Math.min(dUmax, room);
            else if (bl === 'L' && !bt) dLmax = Math.min(dLmax, room);
            else if (bt === 'L' && !bl) dLmax = Math.min(dLmax, room + 1e9);
          }
        }
        if (!ok) continue;
        let P = this.NH + gapNeed;
        if (this.readOnly) {
          // The quiz's cells are as tall as the largest structure of the
          // scheme; two small ones may come closer — as far as their drawn
          // size (revealed, with their letter) and the text of the arrows
          // between them allow.
          const was = this._scoring;
          this._scoring = true;
          let offU = 0, offL = Infinity, txtU = 0, txtL = 0;
          for (const id of U) { const n = byId.get(id); if (n) offU = Math.max(offU, this._box(n).b - n.y); }
          for (const id of L) { const n = byId.get(id); if (n) offL = Math.min(offL, this._box(n).t - n.y); }
          this._scoring = was;
          for (const it of items) {
            if (!horizT.has(it.type) || it === sd.hub) continue;
            const b = band(it.rx.prod);
            if (!b) continue;
            const ext = this._labelExtents(this._metrics(E[it.rx.edges[0]]));
            if (b === 'U') txtU = Math.max(txtU, LABEL_GAP + ext.hBelow);
            else txtL = Math.max(txtL, LABEL_GAP + ext.hAbove);
          }
          if (Number.isFinite(offL)) P = Math.min(P, Math.max(offU - offL + gapNeed, txtU + txtL + 16));
        }
        let dU = Math.max(0, rowY[R] - P / 2 - rowY[R - 1]);
        let dL = Math.max(0, rowY[R + 1] - (rowY[R] + P / 2));
        dU = Math.min(dU, Math.max(0, dUmax));
        dL = Math.min(dL, Math.max(0, dLmax));
        if (dU + dL < 16) continue;
        for (const id of U) { const n = byId.get(id); if (n) { n.y += dU; moved.add(id); } }
        for (const id of L) { const n = byId.get(id); if (n) { n.y -= dL; moved.add(id); } }
      }
    }

    /* The same for a split or merge standing up: products (or educts)
       side by side two columns apart close up to neighbouring columns,
       centred on the arrow — whole column bands move, the products and
       what continues down (up) their columns — as long as the middle
       column is free there and nothing runs along it. */
    _compactColumns(plan, colX) {
      const { pos, items } = plan;
      const E = this.scheme.edges;
      const byId = new Map(this.scheme.nodes.map(n => [n.id, n]));
      const horizT = new Set(['h', 'fork', 'stack', 'split', 'merge', 'eqn']);
      const vertT = new Set(['v', 'vsplit', 'veqn', 'seqn', 'vmerge']);
      const sides = [];
      for (const it of items) {
        if (it.type === 'vsplit') {
          sides.push({ hub: it, C: it.mh, row: it.tr, dir: it.dy, members: [it.rx.prod, ...it.co.filter(c => c.slot === 'split').map(c => c.id)] });
        }
        if (it.type === 'vmerge') {
          if (it.order.length % 2 === 0) sides.push({ hub: it, C: it.pc, row: it.mr, dir: -it.dy, members: it.order });
          if (it.prods.length % 2 === 0) sides.push({ hub: it, C: it.pc, row: it.tr, dir: it.dy, members: it.prods });
        }
      }
      const moved = new Set();
      for (const sd of sides) {
        const C = sd.C, on = r => (r - sd.row) * sd.dir >= 0;
        const mh = sd.members.map(id => pos.get(id)).filter(Boolean).map(p => p.h);
        const lH = mh.filter(h => h < C), rH = mh.filter(h => h > C);
        if (!lH.length || !rH.length || Math.max(...lH) !== C - 2 || Math.min(...rH) !== C + 2) continue;
        const l0 = Math.min(...lH), r1 = Math.max(...rH);
        const Lb = new Set(), Rb = new Set();
        for (const [id, p] of pos) {
          if (!on(p.r)) continue;
          if (p.h >= l0 && p.h <= C - 2) Lb.add(id);
          else if (p.h >= C + 2 && p.h <= r1) Rb.add(id);
        }
        if ([...Lb, ...Rb].some(id => moved.has(id))) continue;
        const rs = [...Lb, ...Rb].map(id => pos.get(id).r);
        const q0 = Math.min(...rs), q1 = Math.max(...rs);
        const band = id => Lb.has(id) ? 'L' : Rb.has(id) ? 'R' : '';
        // the middle column must be empty along the bands …
        let ok = ![...pos.values()].some(p => p.h > C - 2 && p.h < C + 2 && p.r >= q0 && p.r <= q1 && on(p.r));
        let g = GAP_EMPTY;
        for (const it of items) {
          if (!ok) break;
          if (it === sd.hub) continue;
          const bm = band(it.rx.main), bp = band(it.rx.prod);
          if (vertT.has(it.type) || it.type === 'fork') {
            const P = pos.get(it.rx.main), Q = pos.get(it.rx.prod);
            // … nothing may run down it, and no band may lose a straight
            // line up or down its own column
            if (P && Q && P.h === Q.h && P.h > C - 2 && P.h < C + 2 && Math.max(P.r, Q.r) >= q0 && Math.min(P.r, Q.r) <= q1) { ok = false; break; }
            if ((bm || bp) && bm !== bp && P && Q && P.h === Q.h) { ok = false; break; }
          } else if (horizT.has(it.type) && bm && bp && bm !== bp) {
            // an arrow between the two bands gets shorter by the whole shift
            g = Math.max(g, this._metrics(E[it.rx.edges[0]]).shaft);
          }
        }
        if (!ok) continue;
        const cx = colX[C] + (C % 2 ? 0 : this.NW / 2);
        let P = this.NW + g;
        if (this.readOnly) {
          // drawn size (revealed): narrow structures may come closer
          const was = this._scoring;
          this._scoring = true;
          let offL = 0, offR = Infinity;
          for (const id of Lb) { const n = byId.get(id); if (n) offL = Math.max(offL, this._box(n).r - n.x); }
          for (const id of Rb) { const n = byId.get(id); if (n) offR = Math.min(offR, this._box(n).l - n.x); }
          this._scoring = was;
          if (Number.isFinite(offR)) P = Math.min(P, offL - offR + g);
        }
        const xL = colX[C - 2], xR = colX[C + 2];
        const dL = Math.max(0, cx - P / 2 - this.NW / 2 - xL);
        const dR = Math.max(0, xR - (cx + P / 2 - this.NW / 2));
        if (dL + dR < 16) continue;
        for (const id of Lb) { const n = byId.get(id); if (n) { n.x += dL; moved.add(id); } }
        for (const id of Rb) { const n = byId.get(id); if (n) { n.x -= dR; moved.add(id); } }
      }
    }

    /* Branches of one reaction as long as each other: the products of a
       split line up on the side of their bus, the educts of a merge on
       the side of theirs (the structures differ in width). Done on every
       drawing, from the planned places (`_bx`), since a structure's size
       changes when it is revealed. A compound with a vertical arrow of
       its own stays where it is. */
    _alignBranches(plan) {
      const byId = new Map(this.scheme.nodes.map(n => [n.id, n]));
      const vertical = new Set();
      for (const it of plan.items) {
        if (it.type === 'v' || it.type === 'vsplit' || it.type === 'seqn' || it.type === 'veqn' || it.type === 'vmerge') {
          for (const id of [it.rx.main, it.rx.prod, ...(it.co || []).map(c => c.id)]) vertical.add(id);
        }
        if (it.type === 'fork') vertical.add(it.rx.prod);
      }
      const align = (ids, dir, near) => {
        const ns = ids.map(id => byId.get(id)).filter(n => n && typeof n._bx === 'number');
        if (ns.length < 2) return;
        ns.forEach(n => { n.x = n._bx; });
        const bs = ns.map(n => this._box(n));
        // near: the edge facing the bus (left for dir > 0 on the product side)
        const edge = b => near ? (dir > 0 ? b.l : b.r) : (dir > 0 ? b.r : b.l);
        const target = near ? (dir > 0 ? Math.min(...bs.map(edge)) : Math.max(...bs.map(edge)))
                            : (dir > 0 ? Math.max(...bs.map(edge)) : Math.min(...bs.map(edge)));
        ns.forEach((n, i) => {
          if (!vertical.has(n.id)) n.x = n._bx + target - edge(bs[i]);
          if (!this._scoring) {
            const g = this.container.querySelector(`[data-node="${cssEsc(n.id)}"]`);
            if (g) g.setAttribute('transform', `translate(${n.x} ${n.y})`);
          }
        });
      };
      for (const it of plan.items) {
        if (it.type === 'split') align([it.rx.prod, ...it.co.filter(c => c.slot === 'split').map(c => c.id)], it.dx, true);
        if (it.type === 'merge') {
          align(it.order, it.dx, false);
          if (it.prods.length > 1) align(it.prods, it.dx, true);
        }
      }
    }

    /* Draw a plan into a detached layer and rate it: crossings weigh
       most, then bends, then labels that found no free seat. */
    _routeScore(plan) {
      const keep = this._plan;
      this._plan = plan;
      plan.sig = this._planSig();
      this._scoring = true;
      this._seatBad = 0;
      this._freeLen = 0;
      const layer = svg('g');
      try { this._routeAll(layer); }
      catch (_) { this._scoring = false; this._freeLen = null; this._plan = keep; return Infinity; }
      this._scoring = false;
      const freeLen = this._freeLen;
      this._freeLen = null;
      this._plan = keep;
      const segs = [];
      let bends = 0;
      for (const path of layer.querySelectorAll('.sg-edge-line')) {
        const pts = this._ptsOf(path.getAttribute('d'));
        bends += Math.max(0, pts.length - 2);
        for (let k = 1; k < pts.length; k++) segs.push([pts[k - 1], pts[k], path.parentNode]);
      }
      const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
      // two runs of different arrows on one line read as one arrow
      const onTop = (a, b, c, d) => {
        const h = Math.abs(a.y - b.y) < 0.5 && Math.abs(c.y - d.y) < 0.5 && Math.abs(a.y - c.y) < 2.5;
        const v = Math.abs(a.x - b.x) < 0.5 && Math.abs(c.x - d.x) < 0.5 && Math.abs(a.x - c.x) < 2.5;
        if (!h && !v) return false;
        const k = h ? 'x' : 'y';
        return Math.min(Math.max(a[k], b[k]), Math.max(c[k], d[k])) - Math.max(Math.min(a[k], b[k]), Math.min(c[k], d[k])) > 4;
      };
      // parallel runs of different arrows only a few px apart
      const hug = (a, b, c, d) => {
        const h = Math.abs(a.y - b.y) < 0.5 && Math.abs(c.y - d.y) < 0.5;
        const v = Math.abs(a.x - b.x) < 0.5 && Math.abs(c.x - d.x) < 0.5;
        if (!h && !v) return false;
        const gap = h ? Math.abs(a.y - c.y) : Math.abs(a.x - c.x);
        if (gap <= 2.5 || gap > 14) return false;
        const k = h ? 'x' : 'y';
        return Math.min(Math.max(a[k], b[k]), Math.max(c[k], d[k])) - Math.max(Math.min(a[k], b[k]), Math.min(c[k], d[k])) > 20;
      };
      let cross = 0, close = 0;
      for (let i = 0; i < segs.length; i++) {
        for (let j = i + 1; j < segs.length; j++) {
          const [a, b, ga] = segs[i], [c, d, gb] = segs[j];
          if (ga === gb) continue;
          if ((o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0) || onTop(a, b, c, d)) cross++;
          else if (hug(a, b, c, d)) close++;
        }
      }
      // a long way round (1000 px) weighs like a crossing
      return cross * 10 + close * 4 + bends * 0.5 + this._seatBad * 3 + freeLen * 0.01;
    }

    /* The widest grid that still reads at a comfortable zoom. When none
       does: 2 columns, unless a wider grid comes out narrower (its side
       branches need no extra columns) and is no less tidy. */
    _bestCols() {
      const avail = ((this.svg && this.svg.clientWidth) || this.container.clientWidth || 0) - 30;
      if (avail <= 0) return 4;
      const S = this.scheme, fit = {};
      for (let c = 6; c >= 2; c--) {
        const p = planCandidates(S.nodes, S.edges, c)[0];
        fit[c] = { w: this._placePlan(p, true), cost: p.cost };
        if (c > 2 && fit[c].w * MIN_FIT <= avail) return c;
      }
      let best = 2;
      for (let c = 3; c <= 6; c++) if (fit[c].w < fit[best].w - 1 && fit[c].cost <= fit[2].cost) best = c;
      return best;
    }

    /* Anything that changes grouping or indices invalidates the plan. */
    _planSig() {
      return JSON.stringify([
        this.scheme.nodes.map(n => n.id),
        this.scheme.edges.map(e => [e.from, e.to, reagentKey(e), e.join || '', !!e.equilibrium, !!e.plus])
      ]);
    }

    /* ─── Render ──────────────────────────────────────────────── */

    refresh() {
      while (this.viewport.firstChild) this.viewport.removeChild(this.viewport.firstChild);
      this._applyView();
      if (this.toolbar && !this.readOnly) {
        for (const b of this.toolbar.querySelectorAll('.sg-layout-btn')) {
          b.classList.toggle('on', (b.dataset.act === 'layout') === this._isAutoLayout());
        }
      }
      const nodesG = svg('g', { class: 'sg-nodes' });
      this.viewport.appendChild(nodesG);
      this.scheme.nodes.forEach(n => nodesG.appendChild(this._nodeEl(n)));
      this._drawEdges();
      this._renderStructures();
      if (this.svg.clientWidth < 50) requestAnimationFrame(() => this._applyView());
    }

    _renderStructures() {
      if (typeof window.MolRenderer === 'undefined') return;
      const gen = ++this._renderGen;
      window.MolRenderer.ready().then(() => {
        if (gen !== this._renderGen) return;
        // OCL was not there when the layout ran: size the cells now, once.
        if (this._measureCell() && this._isAutoLayout()) {
          this.autoLayout();
          this.refresh();
          if (this._fitted) this.fitToContent();
          return;
        }
        for (const n of this.scheme.nodes) {
          if (this.readOnly && !this._isVisible(n)) { this._mb.delete(n.id); continue; }
          const host = this.container.querySelector(`[data-struct-host="${cssEsc(n.id)}"]`);
          if (!host) continue;
          host.innerHTML = '';
          if (!(n.mol || n.smiles)) {
            host.innerHTML = emptyNodeHtml(n);
            continue;
          }
          try {
            const o = this.readOnly
              ? (this._cell ? { width: NATURAL_BOX, height: NATURAL_BOX, autoCrop: true, autoCropMargin: 2 }
                            : { width: this.FOW, height: this.FOH, autoCrop: true, autoCropMargin: 2 })
              : { width: this.NW - 24, height: this.NH - 60 };
            if (n.alias) o.alias = n.alias;
            const el = n.mol ? window.MolRenderer.drawMol(n.mol, host, o)
                             : window.MolRenderer.drawSmiles(n.smiles, host, o);
            if (this.readOnly && el && el.getAttribute) {
              const k = this._cell ? this._cell.f : 1;
              const w = Math.min(this.FOW, (parseFloat(el.getAttribute('width')) || PH_SIZE) * k);
              const h = Math.min(this.FOH, (parseFloat(el.getAttribute('height')) || PH_SIZE) * k);
              el.style.width = w + 'px';
              el.style.height = h + 'px';
              this._mb.set(n.id, { w, h });
            }
          } catch (e) {
            host.innerHTML = '<div class="sg-err">⚠ Render</div>';
          }
          if (this.readOnly) this._placeNodeText(n);
        }
        if (this.readOnly) {
          this._drawEdges();
          if (this._fitted) this._syncViewerHeight();
        } else if (this._emolPending) {
          this._emolPending = false;
          this._drawEdges();
        }
      });
    }

    _isVisible(n) {
      if (!this.readOnly) return true;
      return n.given || this.revealedIds.has(n.id);
    }
    _isHidden(n) {
      return this.readOnly && !n.given && !this.revealedIds.has(n.id);
    }
    setRevealed(id, val) {
      if (val) this.revealedIds.add(id);
      else this.revealedIds.delete(id);
      this.refreshNode(id);
    }
    resetReveals() {
      this.revealedIds.clear();
      this.refresh();
    }
    countHidden() {
      let total = 0, revealed = 0;
      for (const n of this.scheme.nodes) {
        if (n.given) continue;
        total++;
        if (this.revealedIds.has(n.id)) revealed++;
      }
      return { total, revealed };
    }

    refreshNode(id) {
      const n = this._nodeById(id);
      if (!n) return;
      const g = this.container.querySelector(`[data-node="${cssEsc(id)}"]`);
      if (!g) return this.refresh();
      if (this.readOnly && this._isHidden(n)) this._mb.delete(id);
      g.replaceWith(this._nodeEl(n));
      this._drawEdges();
      this._renderStructures();
    }

    _nodeEl(n) {
      return this.readOnly ? this._viewerNodeEl(n) : this._editorNodeEl(n);
    }

    /* Viewer node: no frame. A transparent hit area keeps the whole cell
       tappable; the structure (or a small "?" tile) sits in the middle
       and the label is set directly under it. */
    _viewerNodeEl(n) {
      let stateCls;
      if (n.given)                         stateCls = 'given';
      else if (this.revealedIds.has(n.id)) stateCls = 'revealed';
      else                                 stateCls = 'hidden';

      const g = svg('g', {
        class: 'sg-node ' + stateCls,
        transform: `translate(${n.x || 0} ${n.y || 0})`,
        'data-node': n.id
      });
      g.appendChild(svg('rect', {
        class: 'sg-node-bg', x: 0, y: 0, width: this.NW, height: this.NH, rx: NODE_RX, ry: NODE_RX
      }));

      const fo = svg('foreignObject', { x: V_FO_X, y: V_FO_Y, width: this.FOW, height: this.FOH });
      const div = document.createElement('div');
      div.className = 'sg-struct-host';
      div.setAttribute('data-struct-host', n.id);
      div.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;';
      const letter = n.label != null ? String(n.label) : String(n.id || '');
      if (this._isHidden(n)) {
        const t = this._tileSize(n);
        div.innerHTML = `<div class="sg-q" style="width:${t.w}px;height:${t.h}px;font-size:${t.fs}px">${chemHtml(letter.trim() || '?')}</div>`;
      } else if (!(n.mol || n.smiles)) {
        div.innerHTML = emptyNodeHtml(n);
      }
      fo.appendChild(div);
      g.appendChild(fo);

      // The letter goes under the structure once it is shown; while the
      // compound is hidden the tile itself carries the letter.
      if (!this._isHidden(n) && letter.trim()) {
        const label = svg('text', { class: 'sg-node-label', x: this.NW / 2, 'text-anchor': 'middle' });
        setChemText(label, letter);
        g.appendChild(label);
      }

      if (n.name && !this._isHidden(n)) {
        const name = svg('text', { class: 'sg-node-name', x: this.NW / 2, 'text-anchor': 'middle' });
        name.textContent = n.name.length > 30 ? n.name.slice(0, 28) + '…' : n.name;
        g.appendChild(name);
      }
      // A caption is part of the Angabe (e.g. a sum formula printed under
      // an unknown compound), so it shows even while the node is hidden.
      // Line breaks in a caption ("Tropin\nC_8H_15NO") give stacked lines.
      captionLines(n).forEach(line => {
        const cap = svg('text', { class: 'sg-node-caption', x: this.NW / 2, 'text-anchor': 'middle' });
        setChemText(cap, line);
        g.appendChild(cap);
      });

      if (this.revealedIds.has(n.id) && !n.given) {
        const ib = svg('g', { class: 'sg-info-badge' });
        ib.appendChild(svg('circle', { cx: 0, cy: 0, r: 8 }));
        const t = svg('text', { x: 0, y: 3.5, 'text-anchor': 'middle' });
        t.textContent = 'i';
        ib.appendChild(t);
        g.appendChild(ib);
      }
      this._placeNodeText(n, g);
      return g;
    }

    _tileSize(n) {
      const txt = plainChemText(n.label != null ? n.label : n.id).trim() || '?';
      const fs = txt.length <= 2 ? 26 : txt.length <= 4 ? 19 : 13;
      const w = Math.max(PH_SIZE, Math.min(this.FOW, Math.ceil(measureText(txt, `bold ${fs}px 'Segoe UI', sans-serif`)) + 18));
      return { w, h: PH_SIZE, fs };
    }
    _footprint(n) {
      // A layout is rated with every structure shown (see _routeScore).
      if (this._isHidden(n) && !this._scoring) { const t = this._tileSize(n); return { w: t.w, h: t.h }; }
      const mb = !this._scoring && this._mb.get(n.id);
      if (mb) return mb;
      // arrows stop at the ends of a name, not inside it
      if (n.text && !(n.mol || n.smiles)) return { w: textNodeWidth(n), h: 22 };
      // not drawn yet: the size it will be drawn at
      const nat = this._cell && (n.mol || n.smiles) && this._natural(n);
      if (nat && nat.w) return { w: Math.min(this.FOW, nat.w * this._cell.f), h: Math.min(this.FOH, nat.h * this._cell.f) };
      return { w: PH_SIZE, h: PH_SIZE };
    }
    _textBlockH(n) {
      const hidden = this._isHidden(n) && !this._scoring;
      const hasLabel = !hidden && String(n.label != null ? n.label : n.id || '').trim();
      const capLines = captionLines(n).length;
      return (hasLabel ? V_LABEL_H : 2) + (n.name && !hidden ? V_NAME_H : 0) + (capLines ? capLines * V_NAME_H + 2 : 0);
    }

    _placeNodeText(n, g) {
      g = g || this.container.querySelector(`[data-node="${cssEsc(n.id)}"]`);
      if (!g) return;
      const m = this._footprint(n);
      const bottom = this.VCY + m.h / 2;
      const label = g.querySelector('.sg-node-label');
      const name = g.querySelector('.sg-node-name');
      let yy = bottom + (label ? 13 : 0);
      if (label) label.setAttribute('y', yy);
      if (name) { yy += V_NAME_H; name.setAttribute('y', yy); }
      g.querySelectorAll('.sg-node-caption').forEach((cap, k) => cap.setAttribute('y', yy + (k + 1) * V_NAME_H + 1));
      const ib = g.querySelector('.sg-info-badge');
      if (ib) {
        const bx = Math.min(this.NW - 9, this.NW / 2 + m.w / 2 + 4);
        const by = Math.max(9, this.VCY - m.h / 2 - 2);
        ib.setAttribute('transform', `translate(${bx} ${by})`);
      }
    }

    _editorNodeEl(n) {
      const stateCls = n.given ? 'given' : 'hidden';
      const g = svg('g', {
        class: 'sg-node ' + stateCls + (this._isSelected('node', n.id) ? ' selected' : ''),
        transform: `translate(${n.x || 0} ${n.y || 0})`,
        'data-node': n.id
      });
      g.appendChild(svg('rect', {
        class: 'sg-node-bg', x: 0, y: 0, width: this.NW, height: this.NH, rx: NODE_RX, ry: NODE_RX
      }));
      const fo = svg('foreignObject', { x: 12, y: 8, width: this.NW - 24, height: this.NH - 60 });
      const div = document.createElement('div');
      div.className = 'sg-struct-host';
      div.setAttribute('data-struct-host', n.id);
      div.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;border-radius:4px;';
      if (!(n.mol || n.smiles)) div.innerHTML = emptyNodeHtml(n);
      fo.appendChild(div);
      g.appendChild(fo);

      const labelText = svg('text', { class: 'sg-node-label', x: 12, y: this.NH - 38 });
      labelText.textContent = n.label || n.id || '?';
      g.appendChild(labelText);
      if (n.caption) {
        const capText = svg('text', { class: 'sg-node-name', x: this.NW - 12, y: this.NH - 38, 'text-anchor': 'end' });
        setChemText(capText, captionLines(n).join(' · '));
        g.appendChild(capText);
      }
      if (n.name) {
        const nameText = svg('text', { class: 'sg-node-name', x: 12, y: this.NH - 20 });
        nameText.textContent = n.name.length > 26 ? n.name.slice(0, 24) + '…' : n.name;
        g.appendChild(nameText);
      }
      if (n.given) {
        const gv = svg('text', { class: 'sg-node-given', x: 12, y: 15 });
        gv.textContent = '✓ vorgegeben';
        g.appendChild(gv);
      }
      g.appendChild(svg('circle', {
        class: 'sg-handle sg-handle-out',
        cx: this.NW, cy: this.NH / 2, r: HANDLE_R,
        'data-handle': 'out', 'data-node': n.id
      }));
      const deg = this._degreeOf(n.id);
      if (deg.in || deg.out) {
        const badge = svg('text', { class: 'sg-node-deg', x: this.NW - 6, y: 14, 'text-anchor': 'end' });
        badge.textContent = `↘${deg.in} ↗${deg.out}`;
        g.appendChild(badge);
      }
      return g;
    }

    /* ─── Arrow routing ───────────────────────────────────────── */

    /* World-space footprint a route must stay clear of. `cy` is the line
       horizontal arrows run on; `b` includes the label under the
       structure, so a downward arrow starts below the letter. */
    _box(n) {
      if (!this.readOnly) {
        return { id: n.id, l: n.x, r: n.x + this.NW, t: n.y, b: n.y + this.NH,
                 cx: n.x + this.NW / 2, cy: n.y + this.NH / 2 };
      }
      const m = this._footprint(n);
      const cx = n.x + this.NW / 2;
      const cy = n.y + this.VCY;
      return {
        id: n.id,
        l: cx - m.w / 2 - V_GAP,
        r: cx + m.w / 2 + V_GAP,
        t: cy - m.h / 2 - V_GAP,
        b: cy + m.h / 2 + this._textBlockH(n) + 2,
        cx, cy
      };
    }

    /* Where the straight line from a box's centre to `pt` leaves the box
       (the viewer's box reaches further down than up: the letter). */
    _toward(b, pt) {
      const dx = pt.x - b.cx, dy = pt.y - b.cy;
      const kx = dx > 0 ? (b.r - b.cx) / dx : dx < 0 ? (b.l - b.cx) / dx : Infinity;
      const ky = dy > 0 ? (b.b - b.cy) / dy : dy < 0 ? (b.t - b.cy) / dy : Infinity;
      const k = Math.min(kx, ky, 1);
      return { x: b.cx + dx * k, y: b.cy + dy * k };
    }

    /* One straight line between two compounds (an equilibrium never bends). */
    _straight(A, B) {
      return [this._toward(A, { x: B.cx, y: B.cy }), this._toward(B, { x: A.cx, y: A.cy })];
    }

    /* Length of a split's branches out of `avail` px between the last join
       and the nearest product: about a third, within BRANCH_MIN … MAX, and
       never at the cost of the `need` px the text on the shaft needs. */
    _branchLen(avail, need) {
      let br = Math.max(BRANCH_MIN, Math.min(BRANCH_MAX, avail * 0.3));
      if (avail - br < need) br = Math.max(BRANCH_MIN, avail - need);
      return Math.min(br, Math.max(8, avail - 8));
    }

    /* Which side of `s` an arrow towards `t` leaves by (= travel direction). */
    _side(s, t) {
      const dx = t.cx - s.cx, dy = t.cy - s.cy;
      // In an auto layout the row is known: an arrow to another row
      // always leaves vertically, so it never doubles back over the
      // arrows of its own row.
      const rows = this._isAutoLayout() && this._rowOf;
      if (rows && rows.has(s.id) && rows.has(t.id)) {
        const same = rows.get(s.id) === rows.get(t.id);
        if (!same || Math.abs(dx) < 4) return dy >= 0 ? 'D' : 'U';
        return dx >= 0 ? 'R' : 'L';
      }
      if (Math.abs(dy) < 4) return dx >= 0 ? 'R' : 'L';
      if (Math.abs(dx) < 4) return dy >= 0 ? 'D' : 'U';
      const horiz = Math.abs(dx) * this.NH >= Math.abs(dy) * this.NW;
      return horiz ? (dx >= 0 ? 'R' : 'L') : (dy >= 0 ? 'D' : 'U');
    }
    _exit(b, side) {
      return side === 'R' ? { x: b.r, y: b.cy } : side === 'L' ? { x: b.l, y: b.cy }
           : side === 'D' ? { x: b.cx, y: b.b } : { x: b.cx, y: b.t };
    }
    _entry(b, side) {
      return side === 'R' ? { x: b.l, y: b.cy } : side === 'L' ? { x: b.r, y: b.cy }
           : side === 'D' ? { x: b.cx, y: b.t } : { x: b.cx, y: b.b };
    }

    _drawEdges() {
      const old = this.viewport.querySelector('.sg-edges');
      const layer = svg('g', { class: 'sg-edges' });
      this._routeAll(layer);
      if (old) old.replaceWith(layer);
      else this.viewport.insertBefore(layer, this.viewport.firstChild);
    }
    // Kept for callers of the old name.
    _redrawEdgesTouching() { this._drawEdges(); }

    _routeAll(layer) {
      const E = this.scheme.edges;
      const done = new Set();
      const usePlan = this._plan && this._isAutoLayout() && this._plan.sig === this._planSig();
      if (usePlan && this.readOnly) this._alignBranches(this._plan);
      // Label placement avoids every structure footprint and every label
      // already set. Candidates are always positions on the arrow's OWN
      // segments, so a label never drifts away from its arrow.
      this._obstacles = this.scheme.nodes.map(n => {
        const b = this._box(n);
        return { id: n.id, x: b.l, y: b.t, w: b.r - b.l, h: b.b - b.t };
      });
      this._placed = [];
      this._lines = [];
      this._labelJobs = [];
      this._seatOf = new Map();   // edge → { sg, mode }: where its text sits
      const selRx = this.selected && this.selected.kind === 'edge' ? this.reactionOf(this.selected.idx) : null;
      this._selEdges = selRx ? new Set(selRx.edges) : null;
      this._heads = [];           // lines drawn with an arrowhead: { idx, pts }

      // One set of rules: the auto layout's plan, or in a free layout the
      // same shapes read off the places (see _freePlan).
      const plan = usePlan ? this._plan : this._freePlan();
      // The "+" of an equation is in the way of other arrows like a structure.
      this._pluses = this._plusSpots(plan).concat(this._freePlusSpots(plan.fallback || []));
      for (const p of this._pluses) this._obstacles.push({ id: '+', x: p.x - 8, y: p.y - 9, w: 16, h: 18 });
      const planned = this._drawPlan(layer, plan);
      const valid = (e, i) => !planned.has(i) && (e.from || []).length === 1 && this._nodeById(e.from[0]) && this._nodeById(e.to);

      // 1. Separate arrows from one source to several targets on the same
      //    side share a stub.
      const outBy = new Map();
      E.forEach((e, i) => {
        if (!valid(e, i)) return;
        if (!outBy.has(e.from[0])) outBy.set(e.from[0], []);
        outBy.get(e.from[0]).push(i);
      });
      for (const [sid, list] of outBy) {
        if (list.length < 2) continue;
        const s = this._box(this._nodeById(sid));
        const bySide = {};
        for (const i of list) {
          const side = this._side(s, this._box(this._nodeById(E[i].to)));
          (bySide[side] = bySide[side] || []).push(i);
        }
        for (const side in bySide) {
          const idxs = bySide[side];
          if (idxs.length < 2) continue;
          this._drawFanOut(layer, sid, side, idxs);
          idxs.forEach(i => done.add(i));
        }
      }

      // 2. Separate arrows that end at the same compound from the same
      //    side: they share the last stretch instead of overlapping on it.
      const inBy = new Map();
      E.forEach((e, i) => {
        if (done.has(i) || !valid(e, i)) return;
        const s = this._box(this._nodeById(e.from[0]));
        const t = this._box(this._nodeById(e.to));
        const key = e.to + '|' + this._side(s, t);
        if (!inBy.has(key)) inBy.set(key, []);
        inBy.get(key).push(i);
      });
      for (const [key, idxs] of inBy) {
        if (idxs.length < 2) continue;
        this._drawMergeIn(layer, key.split('|')[1], idxs);
        idxs.forEach(i => done.add(i));
      }

      // 3. Everything else.
      E.forEach((e, i) => {
        if (done.has(i) || planned.has(i)) return;
        const t = this._nodeById(e.to);
        if (!t) return;
        const f = (e.from || []).filter(id => this._nodeById(id));
        if (!f.length) {
          const b = this._box(t);
          const g = this._edgeGroup(i, '');
          this._addPath(g, `M ${b.cx} ${b.t - 40} L ${b.cx} ${b.t}`, i, true, 'sg-edge-orphan');
          layer.appendChild(g);
          return;
        }
        if (f.length === 1) this._drawSingle(layer, i, f[0]);
        else this._drawFanIn(layer, i, f);
      });
      this._flushLabels();
      // The selected reaction's handle for one more product: on its main
      // arrow, far enough back from the arrowhead to stay clear of it.
      if (!this.readOnly && !this._scoring && this._selEdges) {
        const h = this._heads.find(x => this._selEdges.has(x.idx));
        if (h) {
          let at = h.pts[0], rest = 40;
          for (let k = h.pts.length - 1; k > 0; k--) {
            const a = h.pts[k], b = h.pts[k - 1], l = Math.hypot(a.x - b.x, a.y - b.y);
            if (l >= rest) { at = { x: a.x + (b.x - a.x) * rest / l, y: a.y + (b.y - a.y) * rest / l }; break; }
            rest -= l;
          }
          const c = svg('circle', {
            class: 'sg-handle sg-handle-out sg-handle-rx', r: HANDLE_R, 'data-rx': this.selected.idx,
            cx: r1(at.x), cy: r1(at.y)
          });
          const tt = svg('title', {});
          tt.textContent = 'Zu einem Knoten ziehen = weiteres Produkt dieser Reaktion';
          c.appendChild(tt);
          layer.appendChild(c);
        }
      }
      if (!this._scoring) this._syncInlineEdit();
    }

    /* ─── Free layout: the same arrows, read off the places ─────────
       With "✥ Frei" only the places are the author's; the arrows follow
       the same rules as in the auto layout. Each reaction's shape is
       read off where its compounds stand (in cells, as the auto layout
       lays them): in a row, 'h' (a co-reactant over the gap joins it, a
       product off to the side forks off its stub); in a column, 'v' (a
       compound beside the shaft joins it); educts in one column and
       products in another, 'merge' / 'split' (in rows: 'vmerge' /
       'vsplit'); an equation in a row, 'eqn', in two rows, 'veqn',
       stacked, 'seqn'. Anything else is routed freely, as in the auto
       layout; a reaction with several educts or products that fits no
       shape is still drawn whole (_drawReaction / _drawEquation). An
       auto layout switched to free, nothing moved, draws the same. */
    _freePlan() {
      const S = this.scheme, E = S.edges, NW = this.NW, NH = this.NH;
      const { rxs, prodBy, consBy, up } = reactionsOf(S.nodes, E);
      // A compound made by several reactions sits at the end of the longest
      // way; shorter ones from the rest of the scheme come in as arrows of
      // their own, routed freely — a feed (made only for this, e.g. a
      // reagent prepared beforehand) is laid beside it.
      const owner = id => prodBy.get(id).reduce((a, b) => up(b.main) > up(a.main) ? b : a);
      const feed = (id, seen = new Set()) => !seen.has(id) && seen.add(id) && consBy.get(id).length === 1 &&
        prodBy.get(id).every(p => p.prods.length === 1 && p.srcs.every(s => feed(s, seen)));
      const cellOf = id => { const n = this._nodeById(id); return n && { id, l: n.x, r: n.x + NW, t: n.y, b: n.y + NH, cx: n.x + NW / 2, cy: n.y + NH / 2 }; };
      const inRow = (a, b) => Math.abs(a.cy - b.cy) < NH * 0.3, inCol = (a, b) => Math.abs(a.cx - b.cx) < NW * 0.3;
      const allRow = cs => cs.every(c => inRow(c, cs[0])), allCol = cs => cs.every(c => inCol(c, cs[0]));
      const by = k => (a, b) => a[k] - b[k];
      // x where things join in the gap after `from` (a cell edge), as _placePlan's jx
      const jxAt = (from, to, dx) => from + dx * Math.min(JUNCTION_OFF, Math.abs(to - from) / 2);
      const edgeOf = (cs, dx, near) => (dx > 0) === near ? Math.min(...cs.map(c => c.l)) : Math.max(...cs.map(c => c.r));
      const items = [], fallback = [];
      for (const rx of rxs) {
        const M = cellOf(rx.main), P = cellOf(rx.prod);
        if (!M || !P || rx.srcs.some(id => !cellOf(id)) || rx.prods.some(id => !cellOf(id))) continue;
        const Es = rx.srcs.map(cellOf), Ps = rx.prods.map(cellOf);
        const ins = Es.filter(c => c.id !== rx.main), outs = Ps.filter(c => c.id !== rx.prod);
        const plus = rx.edges.some(i => E[i].plus) && Es.length + Ps.length > 2;
        const base = { rx, co: [], extra: [] };
        let it = null;
        if (plus) {
          const dx = Math.sign(P.cx - M.cx) || 1, al = c => c.cx * dx;
          if (allRow(Es.concat(Ps)) && Math.max(...Es.map(al)) < Math.min(...Ps.map(al))) {
            const order = [...Es].sort((a, b) => al(a) - al(b)), prods = [...Ps].sort((a, b) => al(a) - al(b));
            const last = order[order.length - 1], first = prods[0];
            it = { ...base, type: 'eqn', dx, order: order.map(c => c.id), prods: prods.map(c => c.id),
                   jx: jxAt(dx > 0 ? last.r : last.l, dx > 0 ? first.l : first.r, dx) };
          } else if (Es.length === 2 && Ps.length === 2 && allRow(Es) && allRow(Ps) && !inRow(Es[0], Ps[0])) {
            const es = [...Es].sort(by('cx')), ps = [...Ps].sort(by('cx'));
            if (inCol(es[0], ps[0]) && inCol(es[1], ps[1]) && !inCol(es[0], es[1])) {
              it = { ...base, type: 'veqn', dy: Math.sign(ps[0].cy - es[0].cy), ax: (es[0].r + es[1].l) / 2,
                     order: es.map(c => c.id), prods: ps.map(c => c.id) };
            }
          } else if (Es.length === 2 && Ps.length === 1 && allCol(Es.concat(Ps)) && Math.max(...Es.map(c => c.b)) < P.t) {
            const order = [...Es].sort(by('cy'));
            it = { ...base, type: 'seqn', dy: 1, order: order.map(c => c.id), prods: [rx.prod] };
          }
          // the author's "+" stays: an equation that fits no equation shape
          // is drawn around its groups (_drawEquation)
          if (!it) { fallback.push(Object.assign(rx, { first: rx.edges[0], plus })); continue; }
        }
        if (!it && (ins.length || outs.length)) {
          const hsep = (a, b) => Math.abs(a.cx - b.cx) > NW * 0.6, vsep = (a, b) => Math.abs(a.cy - b.cy) > NH * 0.6;
          if (allCol(Es) && allCol(Ps) && hsep(Es[0], Ps[0])) {
            // educts in one column, products in another: equal merge / split
            const dx = Math.sign(Ps[0].cx - Es[0].cx);
            const from = edgeOf(Es, dx, false), to = edgeOf(Ps, dx, true);
            if (ins.length) {
              it = { ...base, type: 'merge', dx, order: [...Es].sort(by('cy')).map(c => c.id), prods: [...Ps].sort(by('cy')).map(c => c.id), jx: jxAt(from, to, dx) };
            } else {
              it = { ...base, type: 'split', dx, jx: jxAt(from, to, dx), co: outs.map(c => ({ id: c.id, dir: 'out', slot: 'split' })) };
            }
          } else if (allRow(Es) && allRow(Ps) && vsep(Es[0], Ps[0])) {
            const dy = Math.sign(Ps[0].cy - Es[0].cy);
            it = ins.length
              ? { ...base, type: 'vmerge', dy, order: [...Es].sort(by('cx')).map(c => c.id), prods: [...Ps].sort(by('cx')).map(c => c.id) }
              : { ...base, type: 'vsplit', dy, co: outs.map(c => ({ id: c.id, dir: 'out', slot: 'split' })) };
          }
        }
        if (!it) {
          // the arrow itself: along a row, down a column, or forking off to the side
          const dx = Math.sign(P.cx - M.cx) || 1, dy = Math.sign(P.cy - M.cy) || 1;
          const beside = dx > 0 ? P.l >= M.r + 8 : P.r <= M.l - 8, over = dy > 0 ? P.t >= M.b + 8 : P.b <= M.t - 8;
          // (off its row, a single arrow bends right after the source, as a
          // fork does, so its text keeps the long last run)
          const offRow = Math.abs(P.cy - M.cy) > 1 && !ins.length && !outs.length;
          if (beside && Math.abs(P.cy - M.cy) < NH && !offRow) it = { ...base, type: 'h', dx, jx: jxAt(dx > 0 ? M.r : M.l, dx > 0 ? P.l : P.r, dx) };
          else if (over && Math.abs(P.cx - M.cx) < NW) it = { ...base, type: 'v', dy };
          else if (beside && !ins.length && !outs.length) it = { ...base, type: 'fork', dx, sy: dy, jx: jxAt(dx > 0 ? M.r : M.l, dx > 0 ? P.l : P.r, dx) };
          else it = { ...base, type: 'free' };
          // the other educts / products: over the gap or beside the shaft,
          // where the auto layout puts them; else they join freely
          for (const c of ins.concat(outs)) {
            const dir = rx.srcs.includes(c.id) ? 'in' : 'out';
            const inGap = it.type === 'h' && (c.cx - M.cx) * dx > NW * 0.3 && (P.cx - c.cx) * dx > NW * 0.3 && (c.b <= Math.min(M.cy, P.cy) || c.t >= Math.max(M.cy, P.cy));
            const byShaft = it.type === 'v' && !inCol(c, M) && (c.cy - M.b) * dy > 0 && (P.t - c.cy) * dy > 0;
            if (inGap) it.co.push({ id: c.id, dir, slot: c.cy < M.cy ? 'up' : 'dn' });
            else if (byShaft) it.co.push({ id: c.id, dir, slot: c.cx < M.cx ? 'l' : 'r' });
            else it.extra.push({ id: c.id, dir });
          }
          // a reaction with several educts or products that fits no shape: drawn whole
          if (it.type === 'free' && (ins.length || outs.length)) { fallback.push(Object.assign(rx, { first: rx.edges[0], plus })); continue; }
        }
        items.push(it);
      }
      // Several reactions into one compound: each keeps its shape as long as
      // it comes in from a side of its own — the longest way first, a feed
      // always; the others are routed freely.
      const sideIn = it => it.type === 'free' ? null
        : ['v', 'vsplit', 'vmerge', 'veqn', 'seqn'].includes(it.type) ? (it.dy > 0 ? 'T' : 'B') : (it.dx > 0 ? 'L' : 'R');
      const single = it => it.rx.srcs.length === 1 && it.rx.prods.length === 1 && !it.co.length;
      const drop = new Set();
      for (const id of new Set(items.map(it => it.rx.prod))) {
        if (prodBy.get(id).length < 2) continue;
        const into = items.filter(it => it.rx.prods.includes(id));
        into.sort((a, b) => single(a) - single(b) || (owner(id) === b.rx) - (owner(id) === a.rx) || up(b.rx.main) - up(a.rx.main));
        const taken = new Set();
        for (const it of into) {
          const s = sideIn(it);
          if (single(it) && !feed(it.rx.main) && (!s || taken.has(s))) drop.add(it);
          else taken.add(s);
        }
      }
      items.splice(0, items.length, ...items.filter(it => !drop.has(it)));
      // A main arrow shares its stub with the forks off it; the forks meet it there.
      for (const it of items) {
        const fork = it.type === 'h' && items.find(f => f.type === 'fork' && f.rx.main === it.rx.main && f.dx === it.dx);
        if (fork) fork.jx = it.jx;
        it.hasJ = it.type === 'fork' || it.type === 'merge' || it.co.length > 0 || it.extra.length > 0 || !!fork;
      }
      return { items, fallback, free: true };
    }

    /* Draw the reactions exactly as planned (the auto layout's plan, or
       the free layout's, see _freePlan). Returns the edge indices it drew;
       everything else falls back to free routing. */
    _drawPlan(layer, plan) {
      const E = this.scheme.edges;
      const drawn = new Set();
      // What is routed freely goes last, so it can steer around all the
      // rest: the shapes first, then shapes with compounds joining them
      // freely, then free arrows — each in data order, so a free layout
      // draws them just as the auto layout does.
      const rank = it => it.type === 'free' || it.type === 'late' ? 2 : it.extra.length ? 1 : 0;
      const items = plan.items.slice().sort((a, b) => rank(a) - rank(b) || a.rx.edges[0] - b.rx.edges[0]);
      for (const it of items) {
        const mainN = this._nodeById(it.rx.main), prodN = this._nodeById(it.rx.prod);
        if (!mainN || !prodN) continue;
        const e = E[it.rx.edges[0]];
        const A = this._box(mainN), B = this._box(prodN);
        const g = this._edgeGroup(it.rx.edges[0], it.rx.srcs.join(','));
        const skip = [it.rx.main, it.rx.prod];
        const seats = [];
        let J = null;
        const joins = [];

        const eq = !!e.equilibrium;
        let Jout = null;   // where products that live elsewhere branch off (split)
        let shaft = null;  // the straight main arrow, where compounds beside it may join
        if (it.type === 'split') {
          // Equal split: shaft with the text, bus, one short branch per product.
          const side = it.dx > 0 ? 'R' : 'L';
          const p = this._exit(A, side);
          const outs = [it.rx.prod, ...it.co.filter(c => c.slot === 'split').map(c => c.id)]
            .map(id => this._nodeById(id)).filter(Boolean).map(n => this._entry(this._box(n), side));
          const joinIn = it.co.some(c => c.dir === 'in') || it.extra.some(x => x.dir === 'in');
          J = { x: it.jx, y: p.y };
          const from = joinIn ? J : p;
          const near = it.dx > 0 ? Math.min(...outs.map(q => q.x)) : Math.max(...outs.map(q => q.x));
          const J2 = { x: near - it.dx * this._branchLen(Math.abs(near - from.x), this._metrics(e).shaft), y: p.y };
          this._addPath(g, this._pathD([p, J2]), it.rx.edges[0], false);
          for (const q of outs) {
            const pts = Math.abs(q.y - J2.y) < 1 ? [J2, q] : [J2, { x: J2.x, y: q.y }, q];
            this._addPath(g, this._pathD(pts), it.rx.edges[0], true);
          }
          seats.push(...this._segsOf([from, J2]));
          if (joinIn) seats.push(...this._segsOf([p, J2]));
          joins.push(J2);
          Jout = J2;
          for (const c of it.co) {
            if (c.dir !== 'in') continue;
            const cn = this._nodeById(c.id);
            if (!cn) continue;
            const C = this._box(cn);
            let pts;
            if (isY(e)) pts = [this._toward(C, J), J];
            else {
              pts = [{ x: J.x, y: C.cy < J.y ? C.b : C.t }, J];
              if (Math.abs(C.cx - J.x) > 1) pts.unshift({ x: C.cx, y: pts[0].y });
            }
            this._addPath(g, this._pathD(pts), it.rx.edges[0], false);
          }
          if (joinIn) joins.push(J);
        } else if (it.type === 'merge') {
          // Equal educts: parallel lines into a bus near them, one shaft
          // with the text; several products fan out again at its far end.
          const side = it.dx > 0 ? 'R' : 'L';
          const ins = it.order.map(id => this._nodeById(id)).filter(Boolean).map(n => this._box(n));
          const outs = it.prods.map(id => this._nodeById(id)).filter(Boolean).map(n => this._entry(this._box(n), side));
          const ys = outs.map(q => q.y);
          J = { x: it.jx, y: outs.length === 1 ? ys[0] : (Math.min(...ys) + Math.max(...ys)) / 2 };
          for (const b of ins) {
            const p = this._exit(b, side);
            const pts = Math.abs(p.y - J.y) < 1 ? [p, J]
              : isY(e) ? [this._toward(b, J), J]
              : [p, { x: J.x, y: p.y }, J];
            this._addPath(g, this._pathD(pts), it.rx.edges[0], false);
          }
          joins.push(J);
          if (outs.length === 1) {
            const q = outs[0];
            this._addPath(g, this._pathD([J, q]), it.rx.edges[0], true);
            seats.push(...this._segsOf([J, q]));
            shaft = { p: J, q };
          } else {
            const near = it.dx > 0 ? Math.min(...outs.map(q => q.x)) : Math.max(...outs.map(q => q.x));
            const J2 = { x: near - it.dx * this._branchLen(Math.abs(near - J.x), this._metrics(e).shaft), y: J.y };
            this._addPath(g, this._pathD([J, J2]), it.rx.edges[0], false);
            for (const q of outs) {
              const pts = Math.abs(q.y - J2.y) < 1 ? [J2, q] : [J2, { x: J2.x, y: q.y }, q];
              this._addPath(g, this._pathD(pts), it.rx.edges[0], true);
            }
            seats.push(...this._segsOf([J, J2]));
            joins.push(J2);
            Jout = J2;
          }
        } else if (it.type === 'vmerge') {
          // Equal educts side by side: parallel lines down into a bus just
          // past them, one shaft with the text beside it; several products
          // fan out again side by side.
          const side = it.dy > 0 ? 'D' : 'U';
          const ins = it.order.map(id => this._nodeById(id)).filter(Boolean).map(n => this._exit(this._box(n), side));
          const outs = it.prods.map(id => this._nodeById(id)).filter(Boolean).map(n => this._entry(this._box(n), side));
          const xs = outs.map(q => q.x);
          const x0 = outs.length === 1 ? xs[0] : (Math.min(...xs) + Math.max(...xs)) / 2;
          const past = it.dy > 0 ? Math.max(...ins.map(p => p.y)) : Math.min(...ins.map(p => p.y));
          const nearQ = it.dy > 0 ? Math.min(...outs.map(q => q.y)) : Math.max(...outs.map(q => q.y));
          J = { x: x0, y: past + it.dy * Math.min(JUNCTION_STUB + 6, Math.abs(nearQ - past) / 3) };
          for (const p of ins) {
            const pts = Math.abs(p.x - J.x) < 1 ? [p, J]
              : isY(e) ? [p, { x: p.x, y: J.y - it.dy * 8 }, J]
              : [p, { x: p.x, y: J.y }, J];
            this._addPath(g, this._pathD(pts), it.rx.edges[0], false);
          }
          joins.push(J);
          if (outs.length === 1) {
            const q = outs[0];
            const pts = Math.abs(q.x - J.x) < 1 ? [J, q] : [J, { x: J.x, y: (J.y + q.y) / 2 }, { x: q.x, y: (J.y + q.y) / 2 }, q];
            this._addPath(g, this._pathD(pts), it.rx.edges[0], true);
            seats.push(...this._segsOf(pts));
            if (pts.length === 2) shaft = { p: J, q };
          } else {
            const m = this._metrics(e);
            const J2 = { x: J.x, y: nearQ - it.dy * this._branchLen(Math.abs(nearQ - J.y), m.vLen ? m.vLen + 16 : 0) };
            this._addPath(g, this._pathD([J, J2]), it.rx.edges[0], false);
            for (const q of outs) {
              const pts = Math.abs(q.x - J2.x) < 1 ? [J2, q] : [J2, { x: q.x, y: J2.y }, q];
              this._addPath(g, this._pathD(pts), it.rx.edges[0], true);
            }
            seats.push(...this._segsOf([J, J2]));
            joins.push(J2);
            Jout = J2;
          }
        } else if (it.type === 'vsplit') {
          const side = it.dy > 0 ? 'D' : 'U';
          const p = this._exit(A, side);
          const outs = [it.rx.prod, ...it.co.filter(c => c.slot === 'split').map(c => c.id)]
            .map(id => this._nodeById(id)).filter(Boolean).map(n => this._entry(this._box(n), side));
          const m = this._metrics(e);
          const near = it.dy > 0 ? Math.min(...outs.map(q => q.y)) : Math.max(...outs.map(q => q.y));
          const J2 = { x: p.x, y: near - it.dy * this._branchLen(Math.abs(near - p.y), m.vLen ? m.vLen + 16 : 0) };
          // the bus stays clear of every box it passes (a co-reactant beside the shaft)
          const bl = Math.min(p.x, ...outs.map(q => q.x)), br = Math.max(p.x, ...outs.map(q => q.x));
          for (const o of this._obstacles) {
            if (o.id === it.rx.main || o.x > br || o.x + o.w < bl) continue;
            const edge = it.dy > 0 ? o.y + o.h : o.y;
            if ((near - edge) * it.dy <= 0 || (edge - J2.y) * it.dy <= -6) continue;
            if (Math.abs(near - edge) > BRANCH_MIN / 2 + 6) J2.y = edge + it.dy * Math.min(6, (Math.abs(near - edge) - BRANCH_MIN / 2) / 2);
          }
          this._addPath(g, this._pathD([p, J2]), it.rx.edges[0], false);
          for (const q of outs) {
            const pts = Math.abs(q.x - J2.x) < 1 ? [J2, q] : [J2, { x: q.x, y: J2.y }, q];
            this._addPath(g, this._pathD(pts), it.rx.edges[0], true);
          }
          let last = null;
          for (const c of it.co) {
            if (c.dir !== 'in') continue;
            const cn = this._nodeById(c.id);
            if (!cn) continue;
            const C = this._box(cn);
            const Jc = { x: p.x, y: C.cy };
            this._addPath(g, this._pathD([C.cx < p.x ? { x: C.r, y: C.cy } : { x: C.l, y: C.cy }, Jc]), it.rx.edges[0], false);
            joins.push(Jc);
            if (!last || (Jc.y - last.y) * it.dy > 0) last = Jc;
          }
          seats.push(...this._segsOf([last || p, J2]));
          if (last) seats.push(...this._segsOf([p, J2]));
          joins.push(J2);
          Jout = J2;
          if (it.extra.some(x => x.dir === 'in')) J = { x: p.x, y: p.y + (J2.y - p.y) * 0.4 };
        } else if (it.type === 'eqn') {
          // "A + B → C + D": the arrow from the last reactant to the first product
          const side = it.dx > 0 ? 'R' : 'L';
          const R = it.order.map(id => this._nodeById(id)).filter(Boolean).map(n => this._box(n));
          const Pd = it.prods.map(id => this._nodeById(id)).filter(Boolean).map(n => this._box(n));
          const p = this._exit(R[R.length - 1], side), q = this._entry(Pd[0], side);
          const pts = Math.abs(p.y - q.y) < 1 ? [p, q] : this._straight(R[R.length - 1], Pd[0]);
          this._addPath(g, this._pathD(pts), it.rx.edges[0], true);
          seats.push(...this._segsOf(pts));
          if (it.extra.length) J = { x: it.jx, y: p.y };
          if (pts.length === 2 && Math.abs(p.y - q.y) < 1) shaft = { p, q };
          for (const sp of this._pluses.filter(sp => sp.it === it)) this._plusAt(g, sp.x, sp.y);
        } else if (it.type === 'veqn') {
          // "M + W" over "C + D", the arrow straight down the "+" column
          const R = it.order.map(id => this._nodeById(id)).filter(Boolean).map(n => this._box(n));
          const Pd = it.prods.map(id => this._nodeById(id)).filter(Boolean).map(n => this._box(n));
          const x = it.ax, dn = it.dy > 0;
          const p = { x, y: dn ? Math.max(...R.map(b => b.b)) + 2 : Math.min(...R.map(b => b.t)) - 2 };
          const q = { x, y: dn ? Math.min(...Pd.map(b => b.t)) - 2 : Math.max(...Pd.map(b => b.b)) + 2 };
          this._addPath(g, this._pathD([p, q]), it.rx.edges[0], true);
          seats.push(...this._segsOf([p, q]));
          if (it.extra.length) J = { x, y: p.y + (q.y - p.y) * 0.4 };
          shaft = { p, q };
          for (const sp of this._pluses.filter(sp => sp.it === it)) this._plusAt(g, sp.x, sp.y);
        } else if (it.type === 'seqn') {
          // "M / + / W", then the arrow straight down to the product
          const W = this._nodeById(it.order[1]);
          const Wb = W ? this._box(W) : A;
          const p = this._exit(Wb, 'D'), q = this._entry(B, 'D');
          const pts = Math.abs(p.x - q.x) < 1 ? [p, q] : this._straight(Wb, B);
          this._addPath(g, this._pathD(pts), it.rx.edges[0], true);
          seats.push(...this._segsOf(pts));
          if (it.extra.length) J = { x: p.x, y: p.y + (q.y - p.y) * 0.4 };
          if (pts.length === 2 && Math.abs(p.x - q.x) < 1) shaft = { p, q };
          for (const sp of this._pluses.filter(sp => sp.it === it)) this._plusAt(g, sp.x, sp.y);
        } else if (it.type === 'h' || it.type === 'fork' || it.type === 'stack') {
          const side = it.dx > 0 ? 'R' : 'L';
          const p = this._exit(A, side), q = this._entry(B, side);
          const yy = isY(e) && (it.type === 'fork' || it.co.some(c => c.slot !== 'stack') || it.extra.length);
          if (it.hasJ) J = { x: it.jx, y: p.y };
          if (it.type === 'fork' && yy) {
            // Diverging Y: shared stub, slanted branch, straight last run.
            const K = { x: J.x + it.dx * Y_RUN, y: q.y };
            const pts = [p, J, K, q];
            this._addPath(g, this._pathD(pts), it.rx.edges[0], true);
            seats.push(...this._segsOf([K, q]), ...this._segsOf([p, J]));
            joins.push(J);
          } else if (it.type === 'fork') {
            const pts = [p, J, { x: J.x, y: q.y }, q];
            this._addPath(g, this._pathD(pts), it.rx.edges[0], true);
            seats.push(...this._segsOf(pts.slice(2)), ...this._segsOf(pts.slice(1, 3)));
            joins.push(J);
          } else if (eq && Math.abs(p.y - q.y) >= 1) {
            // An equilibrium never bends.
            const pts = this._straight(A, B);
            this._addPath(g, this._pathD(pts), it.rx.edges[0], true);
            seats.push(...this._segsOf(pts));
          } else if (J && eq) {
            // Both half-arrows run the whole way; co-reactants meet them at J.
            this._addPath(g, this._pathD([p, q]), it.rx.edges[0], true);
            seats.push(...this._segsOf([J, q]), ...this._segsOf([p, q]));
          } else if (J) {
            this._addPath(g, this._pathD([p, J]), it.rx.edges[0], false);
            const tail = Math.abs(J.y - q.y) < 1 ? [J, q] : [J, { x: (J.x + q.x) / 2, y: J.y }, { x: (J.x + q.x) / 2, y: q.y }, q];
            this._addPath(g, this._pathD(tail), it.rx.edges[0], true);
            seats.push(...this._segsOf(tail), ...this._segsOf([p, J]));
          } else {
            const pts = Math.abs(p.y - q.y) < 1 ? [p, q]
              : [p, { x: (p.x + q.x) / 2, y: p.y }, { x: (p.x + q.x) / 2, y: q.y }, q];
            this._addPath(g, this._pathD(pts), it.rx.edges[0], true);
            seats.push(...this._segsOf(pts));
          }
          if (it.type !== 'fork' && Math.abs(p.y - q.y) < 1) shaft = { p, q };
          for (const c of it.co) {
            const cn = this._nodeById(c.id);
            if (!cn) continue;
            const C = this._box(cn);
            let pts;
            if (c.slot === 'stack') {
              const s = this._exit(C, side);
              pts = [s, { x: J.x, y: s.y }, J];
            } else if (yy) {
              pts = [this._toward(C, J), J];
            } else {
              const above = C.cy < J.y;
              // meet the upper / lower half-arrow of an equilibrium, not the gap between them
              const Jy = eq ? J.y + (above ? -EQ_GAP : EQ_GAP) : J.y;
              pts = [{ x: J.x, y: above ? C.b : C.t }, { x: J.x, y: Jy }];
              if (Math.abs(C.cx - J.x) > 1) pts.unshift({ x: C.cx, y: pts[0].y });
            }
            if (c.dir === 'out') pts.reverse();
            this._addPath(g, this._pathD(pts), it.rx.edges[0], c.dir === 'out');
          }
          if (J && it.type !== 'fork' && (it.co.length || it.extra.length) && !eq) joins.push(J);
        } else if (it.type === 'v') {
          const side = it.dy > 0 ? 'D' : 'U';
          const p = this._exit(A, side), q = this._entry(B, side);
          const pts = Math.abs(p.x - q.x) < 1 ? [p, q]
            : eq ? this._straight(A, B)
            : [p, { x: p.x, y: (p.y + q.y) / 2 }, { x: q.x, y: (p.y + q.y) / 2 }, q];
          this._addPath(g, this._pathD(pts), it.rx.edges[0], true);
          let last = null;
          for (const c of it.co) {
            const cn = this._nodeById(c.id);
            if (!cn) continue;
            const C = this._box(cn);
            const Jc = { x: p.x, y: C.cy };
            const edge = C.cx < p.x ? { x: C.r, y: C.cy } : { x: C.l, y: C.cy };
            const cp = c.dir === 'out' ? [Jc, edge] : [edge, Jc];
            this._addPath(g, this._pathD(cp), it.rx.edges[0], c.dir === 'out');
            joins.push(Jc);
            if (!last || (Jc.y - last.y) * it.dy > 0) last = Jc;
          }
          if (it.extra.length) J = { x: p.x, y: p.y + (q.y - p.y) * 0.4 };
          if (Math.abs(p.x - q.x) < 1) shaft = { p, q };
          if (last) seats.push({ x1: last.x, y1: last.y, x2: q.x, y2: q.y, dir: 'v', len: Math.abs(q.y - last.y) });
          seats.push(...this._segsOf(pts));
        } else if (it.type === 'late' && !eq) {
          // a branch parked in the slot of the reaction it merges into
          const pts = this._bestRoute(A, B, skip, this._metrics(e)).pts;
          this._addPath(g, this._pathD(pts), it.rx.edges[0], true);
          seats.push(...this._segsOf(pts));
          if (it.extra.length) { const s0 = seats[0]; J = { x: (s0.x1 + s0.x2) / 2, y: (s0.y1 + s0.y2) / 2 }; }
        } else {
          // 'wrap' / 'free': placed wherever there was room.
          const side = it.type === 'wrap' ? 'D' : this._side(A, B);
          const p = this._exit(A, side), q = this._entry(B, side);
          const pts = eq ? this._straight(A, B)
            : it.type === 'free' ? this._bestRoute(A, B, skip, this._metrics(e)).pts
            : this._route(p, side, q, side, skip);
          this._addPath(g, this._pathD(pts), it.rx.edges[0], true);
          seats.push(...this._segsOf(pts));
          if (it.extra.length) {
            const segs = this._segsOf(pts);
            const s0 = segs[0];
            J = { x: (s0.x1 + s0.x2) / 2, y: (s0.y1 + s0.y2) / 2 };
          }
        }

        // Co-reactants/co-products that live elsewhere join freely.
        for (const x of it.extra) {
          const xn = this._nodeById(x.id);
          const Jx = x.dir === 'out' && Jout ? Jout : J;
          if (!xn || !Jx) continue;
          const X = this._box(xn);
          const P = { cx: Jx.x, cy: Jx.y, point: true };
          const xs = [x.id, it.rx.main, it.rx.prod];
          let pts = null, Jat = Jx;
          if (isY(e)) {
            const d = [this._toward(X, Jx), Jx];
            if (!this._hits(d, xs)) pts = x.dir === 'out' ? d.reverse() : d;
          }
          if (!pts && x.dir === 'in' && shaft && !eq) {
            // A compound standing beside the shaft joins it straight, where it stands.
            const { p, q } = shaft, vert = Math.abs(p.x - q.x) < 1;
            const a = vert ? p.y : p.x, b = vert ? q.y : q.x, sg = Math.sign(b - a);
            const at = vert ? X.cy : X.cx;
            if ((at - a) * sg > 12 && (b - at) * sg > TAIL_MIN + 8) {
              const Js = vert ? { x: p.x, y: X.cy } : { x: X.cx, y: p.y };
              const d = vert ? [X.cx < p.x ? { x: X.r, y: X.cy } : { x: X.l, y: X.cy }, Js]
                             : [{ x: X.cx, y: X.cy < p.y ? X.b : X.t }, Js];
              if (!this._hits(d, xs)) { pts = d; Jat = Js; }
            }
          }
          if (!pts) pts = (x.dir === 'out' ? this._bestRoute(P, X, xs, null) : this._bestRoute(X, P, xs, null)).pts;
          this._addPath(g, this._pathD(pts), it.rx.edges[0], x.dir === 'out');
          joins.push(Jat);
        }
        for (const j of joins) g.appendChild(svg('circle', { class: 'sg-junction', cx: r1(j.x), cy: r1(j.y), r: 1.6 }));
        this._placeLabel(seats, e, g);
        layer.appendChild(g);
        it.rx.edges.forEach(i => drawn.add(i));
      }
      // free layout: reactions with several educts or products that fit no shape
      for (const rx of plan.fallback || []) {
        if (rx.plus) this._drawEquation(layer, rx);
        else this._drawReaction(layer, rx);
        rx.edges.forEach(i => drawn.add(i));
      }
      return drawn;
    }

    /* Where the "+" signs of the planned equations go: midway between two
       neighbouring structures, or down the middle of a vertical
       equation's column. */
    _plusSpots(plan) {
      const out = [];
      const boxes = ids => ids.map(id => this._nodeById(id)).filter(Boolean).map(n => this._box(n));
      for (const it of plan.items) {
        if (it.type === 'eqn') {
          for (const grp of [boxes(it.order), boxes(it.prods)]) {
            for (let j = 1; j < grp.length; j++) {
              const [a, b] = grp[j - 1].cx <= grp[j].cx ? [grp[j - 1], grp[j]] : [grp[j], grp[j - 1]];
              out.push({ it, x: (a.r + b.l) / 2 + (this.readOnly ? 0 : HANDLE_R / 2), y: (a.cy + b.cy) / 2 });
            }
          }
        } else if (it.type === 'veqn') {
          for (const grp of [boxes(it.order), boxes(it.prods)]) {
            if (grp.length > 1) out.push({ it, x: it.ax, y: (grp[0].cy + grp[1].cy) / 2 });
          }
        } else if (it.type === 'seqn') {
          const [a, b] = boxes(it.order);
          if (a && b) out.push({ it, x: a.cx, y: (a.b + b.t) / 2 });
        }
      }
      return out;
    }
    _plusAt(g, x, y) {
      const t = svg('text', { class: 'sg-plus', x: r1(x), y: r1(y + 5.5), 'text-anchor': 'middle' });
      t.textContent = '+';
      g.appendChild(t);
      if (this._placed) this._placed.push({ x: x - 6, y: y - 7, w: 12, h: 14 });
    }

    _edgeGroup(idx, fromId) {
      return svg('g', {
        class: 'sg-edge' + (this._isSelected('edge', idx) ? ' selected' : ''),
        'data-edge-idx': idx, 'data-edge-from': fromId
      });
    }

    _addPath(g, d, idx, head, extraCls) {
      const e = this.scheme.edges[idx];
      if (head) d = this._pathD(this._longTail(this._ptsOf(d)));
      if (head && this._heads) {
        const pts = this._ptsOf(d);
        if (pts.length > 1) this._heads.push({ idx, pts });
      }
      if (head && e && e.equilibrium) return this._addEquilibrium(g, d, idx, extraCls);
      const attrs = { class: 'sg-edge-line' + (extraCls ? ' ' + extraCls : ''), d, fill: 'none' };
      if (this._lines) {
        const v = String(d).match(/-?\d+(?:\.\d+)?/g) || [];
        for (let k = 2; k + 1 < v.length; k += 2) {
          this._lines.push({ x1: +v[k - 2], y1: +v[k - 1], x2: +v[k], y2: +v[k + 1] });
        }
      }
      if (head) attrs['marker-end'] = this._isSelected('edge', idx) ? 'url(#sg-arrow-sel)' : 'url(#sg-arrow)';
      g.appendChild(svg('path', attrs));
      if (!this.readOnly) {
        g.appendChild(svg('path', { class: 'sg-edge-hit', d, fill: 'none', stroke: 'transparent', 'stroke-width': 14 }));
      }
    }

    /* Equilibrium (edge.equilibrium): two parallel half-arrows, the upper
       one forward, the lower one back — each shifted off the route. */
    _addEquilibrium(g, d, idx, extraCls) {
      const pts = this._ptsOf(d);
      const nrm = (a, b) => {
        const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
        return { x: dy / l, y: -dx / l };
      };
      const shift = s => pts.map((p, i) => {
        const n1 = i > 0 ? nrm(pts[i - 1], p) : null, n2 = i < pts.length - 1 ? nrm(p, pts[i + 1]) : null;
        let n = n1 || n2;
        if (n1 && n2 && Math.abs(n1.x - n2.x) + Math.abs(n1.y - n2.y) > 1e-6) n = { x: n1.x + n2.x, y: n1.y + n2.y };
        return { x: p.x + n.x * s, y: p.y + n.y * s };
      });
      const mk = this._isSelected('edge', idx) ? 'url(#sg-harpoon-sel)' : 'url(#sg-harpoon)';
      for (const P of [shift(EQ_GAP), shift(-EQ_GAP).reverse()]) {
        g.appendChild(svg('path', { class: 'sg-edge-line' + (extraCls ? ' ' + extraCls : ''), d: this._pathD(P), fill: 'none', 'marker-end': mk }));
      }
      if (this._lines) {
        for (let k = 1; k < pts.length; k++) this._lines.push({ x1: pts[k - 1].x, y1: pts[k - 1].y, x2: pts[k].x, y2: pts[k].y });
      }
      if (!this.readOnly) {
        g.appendChild(svg('path', { class: 'sg-edge-hit', d, fill: 'none', stroke: 'transparent', 'stroke-width': 14 }));
      }
    }

    _pathD(pts) {
      return pts.map((p, k) => (k ? 'L ' : 'M ') + r1(p.x) + ' ' + r1(p.y)).join(' ');
    }
    _ptsOf(d) {
      const v = (String(d).match(/-?\d+(?:\.\d+)?/g) || []).map(Number), pts = [];
      for (let k = 0; k + 1 < v.length; k += 2) pts.push({ x: v[k], y: v[k + 1] });
      return pts;
    }

    /* An arrowhead needs a straight run of TAIL_MIN after the last bend,
       or it sits on the corner. A route that bends too late has its last
       cross-piece moved back, taking the length from the run before it. */
    _longTail(pts) {
      const n = pts.length;
      if (n < 4) return pts;
      const q = pts[n - 1], a = pts[n - 2], b = pts[n - 3], c = pts[n - 4];
      const L = Math.abs(q.x - a.x) + Math.abs(q.y - a.y);
      if (L >= TAIL_MIN || L < 0.5) return pts;
      const ux = Math.sign(q.x - a.x), uy = Math.sign(q.y - a.y);
      if (ux && uy) return pts;                        // not orthogonal
      const need = TAIL_MIN - L;
      // c → b must run parallel to the tail; shortening it must leave some of it
      const along = (b.x - c.x) * ux + (b.y - c.y) * uy;
      if (Math.abs((b.x - c.x) * uy) + Math.abs((b.y - c.y) * ux) > 0.5) return pts;
      if (along > 0 && along - need < 10) return pts;
      const out = pts.slice();
      out[n - 3] = { x: b.x - ux * need, y: b.y - uy * need };
      out[n - 2] = { x: a.x - ux * need, y: a.y - uy * need };
      if (this._hits && this._obstacles && this._hits(out.slice(n - 4), []) > this._hits(pts.slice(n - 4), [])) return pts;
      return out;
    }

    /* The straight pieces of a polyline, longest first, as label seats. */
    _segsOf(pts) {
      const out = [];
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1], b = pts[k];
        const dir = Math.abs(a.y - b.y) < 0.5 ? 'h' : Math.abs(a.x - b.x) < 0.5 ? 'v' : 'd';
        const len = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        if (len < 1) continue;
        out.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, dir, len });
      }
      return out.sort((s, t) => t.len - s.len);
    }

    /* Does a polyline run through any structure other than its ends? */
    _hits(pts, skip) {
      let n = 0;
      for (const o of this._obstacles || []) {
        // The arrow's own ends sit on their boundary; only going INTO
        // them counts.
        const m = skip.includes(o.id) ? 5 : 2;
        for (let k = 1; k < pts.length; k++) {
          const a = pts[k - 1], b = pts[k];
          const x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x);
          const y1 = Math.min(a.y, b.y), y2 = Math.max(a.y, b.y);
          if (x2 > o.x + m && x1 < o.x + o.w - m && y2 > o.y + m && y1 < o.y + o.h - m) { n++; break; }
        }
      }
      return n;
    }

    /* How many arrows already drawn a polyline crosses. */
    _crossings(pts) {
      let n = 0;
      for (let k = 1; k < pts.length; k++) {
        for (const l of this._lines || []) if (segCross(pts[k - 1], pts[k], l)) n++;
      }
      return n;
    }

    /* Orthogonal route from p to q that avoids other structures.
       ps / qs are the travel directions at the ends ('R','L','U','D') or
       null when that end may be approached either way (a junction).
       Candidates put the bends into the gaps next to structures; the
       first one that crosses nothing wins, otherwise the least bad. */
    _route(p, ps, q, qs, skip, clear, all) {
      const obs = (this._obstacles || []).filter(o => !skip.includes(o.id));
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      const xs = new Set([mx]), ys = new Set([my]);
      // The last bend may come no closer to the arrowhead than TAIL_MIN.
      if (qs == null || isH(qs)) { xs.add(q.x - TAIL_MIN); xs.add(q.x + TAIL_MIN); }
      if (qs == null || !isH(qs)) { ys.add(q.y - TAIL_MIN); ys.add(q.y + TAIL_MIN); }
      // … and the first bend right past the source
      xs.add(p.x - 14); xs.add(p.x + 14); ys.add(p.y - 14); ys.add(p.y + 14);
      for (const o of obs) {
        xs.add(o.x - 12); xs.add(o.x + o.w + 12); ys.add(o.y - 12); ys.add(o.y + o.h + 12);
        // Further out, so a label fits between the run and the structure.
        if (clear) { ys.add(o.y - 12 - clear); ys.add(o.y + o.h + 12 + clear); }
      }
      const X = [...xs].sort((a, b) => Math.abs(a - mx) - Math.abs(b - mx));
      const Y = [...ys].sort((a, b) => Math.abs(a - my) - Math.abs(b - my));
      const sgn = (s) => (s === 'R' || s === 'D') ? 1 : -1;
      const hS = ps == null || isH(ps), vS = ps == null || !isH(ps);
      const hE = qs == null || isH(qs), vE = qs == null || !isH(qs);
      const okX0 = (x) => ps == null || !isH(ps) || (x - p.x) * sgn(ps) >= 8;
      const okY0 = (y) => ps == null || isH(ps) || (y - p.y) * sgn(ps) >= 8;
      const okX1 = (x) => qs == null || !isH(qs) || (q.x - x) * sgn(qs) >= TAIL_MIN;
      const okY1 = (y) => qs == null || isH(qs) || (q.y - y) * sgn(qs) >= TAIL_MIN;
      const tries = [];
      if (Math.abs(p.y - q.y) < 1 && hS && hE) tries.push([p, q]);
      if (Math.abs(p.x - q.x) < 1 && vS && vE) tries.push([p, q]);
      if (hS && hE) for (const x of X) if (okX0(x) && okX1(x)) tries.push([p, { x, y: p.y }, { x, y: q.y }, q]);
      if (vS && vE) for (const y of Y) if (okY0(y) && okY1(y)) tries.push([p, { x: p.x, y }, { x: q.x, y }, q]);
      if (hS && vE && okX0(q.x) && okY1(p.y)) tries.push([p, { x: q.x, y: p.y }, q]);
      if (vS && hE && okY0(q.y) && okX1(p.x)) tries.push([p, { x: p.x, y: q.y }, q]);
      const x1 = ps && isH(ps) ? p.x + sgn(ps) * 14 : p.x;
      const y1 = ps && !isH(ps) ? p.y + sgn(ps) * 14 : p.y;
      const x2 = qs && isH(qs) ? q.x - sgn(qs) * TAIL_MIN : q.x;
      const y2 = qs && !isH(qs) ? q.y - sgn(qs) * TAIL_MIN : q.y;
      if (hS && hE) for (const y of Y) tries.push([p, { x: x1, y: p.y }, { x: x1, y }, { x: x2, y }, { x: x2, y: q.y }, q]);
      if (vS && vE) for (const x of X) tries.push([p, { x: p.x, y: y1 }, { x, y: y1 }, { x, y: y2 }, { x: q.x, y: y2 }, q]);
      if (hS && vE) for (const y of Y) if (okY1(y)) tries.push([p, { x: x1, y: p.y }, { x: x1, y }, { x: q.x, y }, q]);
      if (vS && hE) for (const x of X) if (okX1(x)) tries.push([p, { x: p.x, y: y1 }, { x, y: y1 }, { x, y: q.y }, q]);
      let best = null, bestHits = Infinity;
      if (all) {
        const ok = [];
        for (const t of tries) if (!this._hits(t, skip) && ok.push(t) >= 16) break;
        if (ok.length) return ok;
      }
      for (const t of tries) {
        const h = this._hits(t, skip);
        if (h === 0) return all ? [t] : t;
        if (h < bestHits) { best = t; bestHits = h; }
      }
      return all ? [best || [p, q]] : (best || [p, q]);
    }

    /* Free route between two compounds that the plan did not place side
       by side: tries leaving along the arrow direction or sideways and
       entering from the facing side, keeps the one that crosses nothing,
       bends least and leaves room for the text. */
    _bestRoute(s, t, skip, m) {
      const hs = t.cx >= s.cx ? 'R' : 'L', vs = t.cy >= s.cy ? 'D' : 'U';
      const sameRow = Math.abs(t.cy - s.cy) < 4, sameCol = Math.abs(t.cx - s.cx) < 4;
      // Either end may be a bare point (a junction): no side to choose.
      const sides = ['R', 'L', 'D', 'U'];
      const natural = d => d === (sameCol ? vs : hs) || (!sameRow && d === vs) || (sameRow && (d === 'D' || d === 'U'));
      const opts = [];
      for (const ps of s.point ? [null] : sides) {
        for (const qs of t.point ? [null] : sides) {
          if (ps && qs && sameRow && ps === qs && ps !== hs) continue;
          const bias = (ps && !natural(ps) ? 30 : 0) + (qs && !natural(qs) ? 30 : 0);
          opts.push([ps, qs, bias]);
        }
      }
      const labelled = m && m.any;
      // Running on top of an existing line reads as one arrow: avoid.
      const onTop = (a, b) => (this._lines || []).some(l => {
        if (Math.abs(a.y - b.y) < 0.5) {
          return Math.abs(l.y1 - l.y2) < 0.5 && Math.abs(l.y1 - a.y) < 3 &&
            Math.min(Math.max(l.x1, l.x2), Math.max(a.x, b.x)) - Math.max(Math.min(l.x1, l.x2), Math.min(a.x, b.x)) > 2;
        }
        return Math.abs(l.x1 - l.x2) < 0.5 && Math.abs(l.x1 - a.x) < 3 &&
          Math.min(Math.max(l.y1, l.y2), Math.max(a.y, b.y)) - Math.max(Math.min(l.y1, l.y2), Math.min(a.y, b.y)) > 2;
      });
      // … and so, though less, does one hugging it a few px off
      const hugs = (a, b) => (this._lines || []).some(l => {
        const hz = Math.abs(a.y - b.y) < 0.5 && Math.abs(l.y1 - l.y2) < 0.5;
        const vt = Math.abs(a.x - b.x) < 0.5 && Math.abs(l.x1 - l.x2) < 0.5;
        if (!hz && !vt) return false;
        const d = hz ? Math.abs(l.y1 - a.y) : Math.abs(l.x1 - a.x);
        if (d < 3 || d > 14) return false;
        const k = hz ? 'x' : 'y';
        return Math.min(Math.max(l[k + 1], l[k + 2]), Math.max(a[k], b[k])) - Math.max(Math.min(l[k + 1], l[k + 2]), Math.min(a[k], b[k])) > 16;
      });
      // Crossing another arrow costs more than a detour of a few bends.
      const crosses = (a, b) => this._crossings([a, b]);
      let best = null;
      for (const [ps, qs, bias] of opts) {
        const p = ps ? this._exit(s, ps) : { x: s.cx, y: s.cy };
        const q = qs ? this._entry(t, qs) : { x: t.cx, y: t.cy };
        for (const pts of this._route(p, ps, q, qs, skip, m ? m.blockH : 0, true)) {
          let score = bias + this._hits(pts, skip) * 1000 + (pts.length - 2) * 25;
          for (let k = 1; k < pts.length; k++) if (hugs(pts[k - 1], pts[k])) score += 90;
          if (labelled) score += Math.min(800, this._pickSeat(this._segsOf(pts), m.edge, true) * 0.3);
          let len = 0, longest = 0;
          for (let k = 1; k < pts.length; k++) {
            const d = Math.abs(pts[k].x - pts[k - 1].x) + Math.abs(pts[k].y - pts[k - 1].y);
            len += d;
            if (Math.abs(pts[k].y - pts[k - 1].y) < 0.5) longest = Math.max(longest, d);
            if (onTop(pts[k - 1], pts[k])) score += 200;
            score += crosses(pts[k - 1], pts[k]) * 250;
          }
          score += len * 0.05;
          if (labelled && longest < m.width + 12) score += 40;
          if (!best || score < best.score) best = { pts, score, len };
        }
      }
      // how far arrows travel off the grid (see _routeScore)
      if (best && this._freeLen != null) this._freeLen += best.len;
      return best;
    }

    /* One source, one target. */
    _drawSingle(layer, idx, fromId) {
      const e = this.scheme.edges[idx];
      const s = this._box(this._nodeById(fromId));
      const t = this._box(this._nodeById(e.to));
      // an equilibrium is never bent, not even off the grid: one straight line
      const pts = e.equilibrium ? this._straight(s, t) : this._bestRoute(s, t, [fromId, e.to], this._metrics(e)).pts;
      const g = this._edgeGroup(idx, fromId);
      this._addPath(g, this._pathD(pts), idx, true);
      this._placeLabel(this._segsOf(pts), e, g);
      layer.appendChild(g);
    }

    /* ─── Free layout: whole reactions that fit no shape ─────────
       A reaction with several educts or products whose compounds stand
       where no shape of the auto layout fits (see _freePlan) is still
       drawn ONCE: one shaft with one text. */

    /* Where the "+" signs of the free equations go: between neighbouring
       educts and between neighbouring products — side by side, or one
       over the other, whichever way the group spreads. */
    _freePlusSpots(rxs) {
      const out = [];
      for (const rx of rxs) {
        if (!rx.plus) continue;
        for (const ids of [rx.srcs, rx.prods]) {
          const grp = ids.map(id => this._box(this._nodeById(id)));
          if (grp.length < 2) continue;
          const xs = grp.map(b => b.cx), ys = grp.map(b => b.cy);
          const row = (Math.max(...xs) - Math.min(...xs)) * this.NH >= (Math.max(...ys) - Math.min(...ys)) * this.NW;
          grp.sort((a, b) => row ? a.cx - b.cx : a.cy - b.cy);
          for (let j = 1; j < grp.length; j++) {
            const a = grp[j - 1], b = grp[j];
            out.push(row ? { rx, x: (a.r + b.l) / 2 + (this.readOnly ? 0 : HANDLE_R / 2), y: (a.cy + b.cy) / 2 }
                         : { rx, x: (a.cx + b.cx) / 2, y: (a.b + b.t) / 2 });
          }
        }
      }
      return out;
    }

    /* One box around a group of compounds; its centre is the mean of
       theirs, so a row keeps its line. */
    _groupBox(ids) {
      const bs = ids.map(id => this._box(this._nodeById(id)));
      const mean = k => bs.reduce((a, b) => a + b[k], 0) / bs.length;
      return {
        id: ids.join('+'), cx: mean('cx'), cy: mean('cy'),
        l: Math.min(...bs.map(b => b.l)), r: Math.max(...bs.map(b => b.r)),
        t: Math.min(...bs.map(b => b.t)), b: Math.max(...bs.map(b => b.b))
      };
    }

    /* A free equation (edge.plus): "+" between the educts and between the
       products, one arrow from the one group to the other. */
    _drawEquation(layer, rx) {
      const e = this.scheme.edges[rx.first];
      const S = this._groupBox(rx.srcs), T = this._groupBox(rx.prods);
      const skip = rx.srcs.concat(rx.prods);
      const pts = e.equilibrium ? this._straight(S, T) : this._bestRoute(S, T, skip, this._metrics(e)).pts;
      const g = this._edgeGroup(rx.first, rx.srcs.join(','));
      this._addPath(g, this._pathD(pts), rx.first, true);
      for (const sp of this._pluses.filter(sp => sp.rx === rx)) this._plusAt(g, sp.x, sp.y);
      this._placeLabel(this._segsOf(pts), e, g);
      layer.appendChild(g);
    }

    /* How a free reaction runs: the side it heads to, the educts behind
       the products that way, the shaft's line `c`, and where its bus (Ja)
       and its split (J2a) sit along it. `main`: the one educt the shaft
       leaves straight from. Of the four sides, the one with the most
       educts behind the products wins, then one with a straight shaft,
       then the way from the educts' centre to the products'. Null when no
       educt is behind the products any way. */
    _rxFrame(S, T, m) {
      const mean = (bs, k) => bs.reduce((a, b) => a + b[k], 0) / bs.length;
      const pref = this._side({ cx: mean(S, 'cx'), cy: mean(S, 'cy') }, { cx: mean(T, 'cx'), cy: mean(T, 'cy') });
      const multi = T.length > 1;
      let best = null;
      for (const side of ['R', 'L', 'D', 'U']) {
        const H = isH(side), s = DIR[side][0] + DIR[side][1];
        const front = b => H ? (s > 0 ? b.r : b.l) : (s > 0 ? b.b : b.t);
        const back = b => H ? (s > 0 ? b.l : b.r) : (s > 0 ? b.t : b.b);
        const acr = b => H ? b.cy : b.cx;
        const A1 = s > 0 ? Math.min(...T.map(back)) : Math.max(...T.map(back));
        const behind = S.filter(b => (A1 - front(b)) * s >= 24 + (multi ? BRANCH_MIN : 0));
        if (!behind.length) continue;
        const A0 = s > 0 ? Math.max(...behind.map(front)) : Math.min(...behind.map(front));
        const need = H ? m.shaft : Math.max(30, m.vLen + 16);
        const ks = T.map(acr);
        const c = !multi ? ks[0] : behind.length === 1 ? acr(behind[0]) : (Math.min(...ks) + Math.max(...ks)) / 2;
        const J2a = multi ? A1 - s * this._branchLen((A1 - A0) * s, need) : A1;
        const main = behind.length === 1 && Math.abs(acr(behind[0]) - c) < 1 ? behind[0] : null;
        const span = (J2a - A0) * s;
        const Ja = main ? A0 : J2a - s * Math.max(Math.min(18, span / 2), Math.min(need, span - JUNCTION_STUB));
        const score = (S.length - behind.length) * 100 + (main || behind.length > 1 ? 0 : 30) + (side === pref ? 0 : 10);
        if (!best || score < best.score) best = { side, H, s, c, Ja, J2a, main, behind, score };
      }
      return best;
    }

    /* A free point between two groups of compounds, off every structure. */
    _hub(S, T) {
      const mean = (bs, k) => bs.reduce((a, b) => a + b[k], 0) / bs.length;
      const x = (mean(S, 'cx') + mean(T, 'cx')) / 2, y = (mean(S, 'cy') + mean(T, 'cy')) / 2;
      const free = p => !(this._obstacles || []).some(o => p.x > o.x - 10 && p.x < o.x + o.w + 10 && p.y > o.y - 10 && p.y < o.y + o.h + 10);
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]];
      for (let r = 0; r <= 240; r += 20) {
        for (const [ux, uy] of r ? dirs : [[0, 0]]) if (free({ x: x + ux * r, y: y + uy * r })) return { x: x + ux * r, y: y + uy * r };
      }
      return { x, y };
    }

    /* A free reaction with several educts and/or products, drawn once
       the way the auto layout's merge / split is: educts behind it run
       parallel into a bus, one standing beside the shaft joins it
       straight where it stands, one shaft carries the text (curve,
       structure on the arrow), several products split off a bus at its
       end with a short branch each. Where no educt is behind the products,
       the pieces are routed freely to a hub between the two groups. */
    _drawReaction(layer, rx) {
      const e = this.scheme.edges[rx.first], idx = rx.first;
      const S = rx.srcs.map(id => this._box(this._nodeById(id)));
      const T = rx.prods.map(id => this._box(this._nodeById(id)));
      const skip = rx.srcs.concat(rx.prods);
      const m = this._metrics(e), Y = isY(e), eq = !!e.equilibrium, multi = T.length > 1;
      const g = this._edgeGroup(idx, rx.srcs.join(','));
      const joins = [];
      let seats;
      const f = this._rxFrame(S, T, m);
      if (f) {
        const { side, H, s, c, Ja, J2a, main, behind } = f;
        const P = (a, k) => H ? { x: a, y: k } : { x: k, y: a };
        const acr = b => H ? b.cy : b.cx, al = p => H ? p.x : p.y;
        const J = P(Ja, c), J2 = P(J2a, c);
        // the shaft; an equilibrium never bends
        let shaft = [J, multi ? J2 : this._entry(T[0], side)];
        const straight = eq || !this._hits(shaft, skip);
        if (!straight) shaft = this._route(J, side, shaft[1], multi ? null : side, skip);
        // drawn first, so what is routed freely below keeps off it; an
        // equilibrium that splits: the shaft carries the half-arrows
        if (multi && eq) {
          this._addEquilibrium(g, this._pathD(shaft), idx);
          if (this._heads) this._heads.push({ idx, pts: shaft });
        } else this._addPath(g, this._pathD(shaft), idx, !multi);
        // educts neither behind nor beside the shaft come in a bit along it
        const Jo = main && straight ? P(Ja + s * Math.min(JUNCTION_OFF, Math.abs(J2a - Ja) / 3), c) : J;
        const onShaft = [];
        if (!main) joins.push(J);
        for (const b of S) {
          if (b === main) continue;
          const p = this._exit(b, side);
          let pts = null;
          if (behind.includes(b)) {
            pts = Math.abs(acr(b) - c) < 1 ? [p, J] : Y ? [this._toward(b, J), J] : [p, P(Ja, acr(b)), J];
            if (this._hits(pts, skip) || this._crossings(pts)) pts = this._bestRoute(b, { cx: J.x, cy: J.y, point: true }, skip, null).pts;
          } else {
            const at = H ? b.cx : b.cy;
            const clear = H ? b.b < c - 2 || b.t > c + 2 : b.r < c - 2 || b.l > c + 2;
            if (straight && !Y && clear && (at - Ja) * s > 12 && (J2a - at) * s > (multi ? 8 : TAIL_MIN + 8)) {
              const Js = P(at, c), near = acr(b) < c;
              const d = [H ? { x: at, y: near ? b.b : b.t } : { x: near ? b.r : b.l, y: at }, Js];
              if (!this._hits(d, skip)) { pts = d; onShaft.push(Js); joins.push(Js); }
            }
            if (!pts) {
              const d = [this._toward(b, Jo), Jo];
              pts = Y && !this._hits(d, skip) ? d : this._bestRoute(b, { cx: Jo.x, cy: Jo.y, point: true }, skip, null).pts;
              if (Jo !== J && !joins.includes(Jo)) { joins.push(Jo); onShaft.push(Jo); }
            }
          }
          this._addPath(g, this._pathD(pts), idx, false);
        }
        if (multi) {
          joins.push(J2);
          for (const b of T) {
            const q = this._entry(b, side), run = Math.min(TAIL_MIN, Math.abs(al(q) - J2a) * 0.6);
            let pts = Math.abs(acr(b) - c) < 1 ? [J2, q] : Y ? [J2, P(al(q) - s * run, acr(b)), q] : [J2, P(J2a, acr(b)), q];
            if (this._hits(pts, skip)) pts = this._route(J2, side, q, side, skip);
            if (this._crossings(pts)) pts = this._bestRoute({ cx: J2.x, cy: J2.y, point: true }, b, skip, null).pts;
            this._addPath(g, this._pathD(pts), idx, !eq);
          }
        }
        // the text sits on the shaft, on its longest piece between joins
        seats = this._segsOf(straight ? [shaft[0], ...onShaft.sort((u, v) => (al(u) - al(v)) * s), shaft[1]] : shaft);
      } else {
        const hub = this._hub(S, T), hp = { cx: hub.x, cy: hub.y, point: true };
        const ins = [], outs = [];
        for (const b of S) {
          const pts = eq ? [this._toward(b, hub), hub] : this._bestRoute(b, hp, skip, S.length === 1 ? m : null).pts;
          this._addPath(g, this._pathD(pts), idx, false);
          ins.push(pts);
        }
        for (const b of T) {
          const pts = eq ? [hub, this._toward(b, hub)] : this._bestRoute(hp, b, skip, multi ? null : m).pts;
          this._addPath(g, this._pathD(pts), idx, true);
          outs.push(pts);
        }
        joins.push(hub);
        seats = !multi ? this._segsOf(outs[0]) : S.length === 1 ? this._segsOf(ins[0])
          : [].concat(...ins.concat(outs).map(p => this._segsOf(p))).sort((u, v) => v.len - u.len);
      }
      for (const j of joins) g.appendChild(svg('circle', { class: 'sg-junction', cx: r1(j.x), cy: r1(j.y), r: 1.6 }));
      this._placeLabel(seats, e, g);
      layer.appendChild(g);
    }

    /* Compounds that move along with `id` in a free layout: the other
       educts of an equation it is an educt of, the other products of one
       it is a product of (and theirs in turn: a group stays together). */
    _lockedWith(id) {
      const E = this.scheme.edges;
      const rxs = reactionsOf(this.scheme.nodes, E).rxs
        .filter(rx => rx.edges.some(i => E[i].plus) && rx.srcs.length + rx.prods.length > 2);
      const seen = new Set([id]), st = [id];
      while (st.length) {
        const k = st.pop();
        for (const rx of rxs) for (const grp of [rx.srcs, rx.prods]) {
          if (grp.includes(k)) for (const o of grp) if (!seen.has(o)) { seen.add(o); st.push(o); }
        }
      }
      seen.delete(id);
      return [...seen];
    }

    /* One source, several targets on the same side: shared stub, then a
       branch per target. Distinct reagents go on each branch; identical
       reagents are written once on a lengthened shared shaft. */
    _drawFanOut(layer, fromId, side, idxs) {
      const E = this.scheme.edges;
      const s = this._box(this._nodeById(fromId));
      const [dx, dy] = DIR[side];
      const p = this._exit(s, side);
      const shared = idxs.every(i => sameLabels(E[i], E[idxs[0]]));
      const m0 = this._metrics(E[idxs[0]]);
      const targets = idxs.map(i => this._box(this._nodeById(E[i].to)));

      const room = Math.min(...targets.map(t => {
        const q = this._entry(t, side);
        return isH(side) ? Math.abs(q.x - p.x) : Math.abs(q.y - p.y);
      }));
      let stub = JUNCTION_STUB;
      if (shared && m0.any) {
        stub = Math.max(stub, Math.min(room - 14, isH(side) ? m0.shaft : m0.vLen + 16));
      }
      stub = Math.max(8, Math.min(stub, room - 12));
      const J = { x: p.x + dx * stub, y: p.y + dy * stub };

      const trunk = this._edgeGroup(idxs[0], fromId);
      this._addPath(trunk, this._pathD([p, J]), idxs[0], false);
      layer.appendChild(trunk);

      const branchPts = idxs.map((i, k) => {
        const q = this._entry(targets[k], side);
        const skip = [fromId, E[i].to];
        if (isY(E[i])) {
          // Slanted branch, then a straight last run for the label.
          const span = isH(side) ? Math.abs(q.x - J.x) : Math.abs(q.y - J.y);
          const run = Math.max(24, Math.min(span * 0.55, isH(side) ? this._metrics(E[i]).shaft : 60));
          const K = isH(side) ? { x: q.x - dx * run, y: q.y } : { x: q.x, y: q.y - dy * run };
          const yb = [J, K, q];
          if (!this._hits(yb, skip)) return yb;
        }
        const base = isH(side)
          ? (Math.abs(q.y - J.y) < 1 ? [J, q] : [J, { x: J.x, y: q.y }, q])
          : (Math.abs(q.x - J.x) < 1 ? [J, q] : [J, { x: q.x, y: J.y }, q]);
        return this._hits(base, skip) ? this._route(J, side, q, side, skip) : base;
      });
      idxs.forEach((i, k) => {
        const g = this._edgeGroup(i, fromId);
        this._addPath(g, this._pathD(branchPts[k]), i, true);
        if (!shared) {
          // The last run of a branch belongs to that branch alone.
          const segs = this._segsOf(branchPts[k]);
          const last = segs.find(sg => sg.x2 === branchPts[k][branchPts[k].length - 1].x && sg.y2 === branchPts[k][branchPts[k].length - 1].y);
          this._placeLabel(last ? [last, ...segs.filter(sg => sg !== last && sg.dir !== last.dir)] : segs, E[i], g);
        }
        layer.appendChild(g);
      });
      if (shared) {
        this._placeLabel([{ x1: p.x, y1: p.y, x2: J.x, y2: J.y, dir: isH(side) ? 'h' : 'v' }], E[idxs[0]], trunk);
      }
    }

    /* Several separate arrows into one compound from the same side: each
       keeps its own first run (and its own label), all meet in a short
       shared stub that carries one arrowhead. */
    _drawMergeIn(layer, side, idxs) {
      const E = this.scheme.edges;
      const t = this._box(this._nodeById(E[idxs[0]].to));
      const [dx, dy] = DIR[side];
      const q = this._entry(t, side);
      const srcs = idxs.map(i => this._box(this._nodeById(E[i].from[0])));
      const room = Math.min(...srcs.map(s => {
        const p = this._exit(s, side);
        return isH(side) ? Math.abs(q.x - p.x) : Math.abs(q.y - p.y);
      }));
      const stub = Math.max(8, Math.min(JUNCTION_STUB, room / 3));
      const J = { x: q.x - dx * stub, y: q.y - dy * stub };
      idxs.forEach((i, k) => {
        const p = this._exit(srcs[k], side);
        let pts;
        if (isH(side)) pts = Math.abs(p.y - J.y) < 1 ? [p, J] : [p, { x: J.x, y: p.y }, J];
        else           pts = Math.abs(p.x - J.x) < 1 ? [p, J] : [p, { x: p.x, y: J.y }, J];
        const mskip = [E[i].from[0], E[i].to];
        if (this._hits(pts, mskip)) pts = this._route(p, side, J, side, mskip);
        const g = this._edgeGroup(i, E[i].from[0]);
        this._addPath(g, this._pathD(pts), i, false);
        this._placeLabel(this._segsOf(pts), E[i], g);
        layer.appendChild(g);
      });
      const tg = this._edgeGroup(idxs[0], '');
      this._addPath(tg, this._pathD([J, q]), idxs[0], true);
      tg.appendChild(svg('circle', { class: 'sg-junction', cx: r1(J.x), cy: r1(J.y), r: 1.6 }));
      layer.appendChild(tg);
    }

    /* Several sources, one target: branches meet at a junction, a single
       trunk carries the arrowhead and the (single) label. */
    _drawFanIn(layer, idx, fromIds) {
      const e = this.scheme.edges[idx];
      const t = this._box(this._nodeById(e.to));
      const srcs = fromIds.map(id => this._box(this._nodeById(id)));
      const avg = {
        cx: srcs.reduce((a, b) => a + b.cx, 0) / srcs.length,
        cy: srcs.reduce((a, b) => a + b.cy, 0) / srcs.length
      };
      let side = this._side(avg, t);
      const rows = this._isAutoLayout() && this._rowOf;
      if (rows && rows.has(t.id) && srcs.every(b => rows.has(b.id) && rows.get(b.id) !== rows.get(t.id))) {
        side = avg.cy <= t.cy ? 'D' : 'U';
      }
      const [dx, dy] = DIR[side];
      const q = this._entry(t, side);
      const m = this._metrics(e);

      const room = Math.min(...srcs.map(s => {
        const p = this._exit(s, side);
        return isH(side) ? Math.abs(q.x - p.x) : Math.abs(q.y - p.y);
      }));
      let trunkLen = isH(side) ? m.shaft : Math.max(30, m.vLen + 16);
      trunkLen = Math.max(18, Math.min(trunkLen, room - JUNCTION_STUB));
      const J = { x: q.x - dx * trunkLen, y: q.y - dy * trunkLen };

      const g = this._edgeGroup(idx, fromIds.join(','));
      const branchSegs = [];
      srcs.forEach((s, k) => {
        const p = this._exit(s, side);
        let pts;
        if (isY(e))    pts = [this._toward(s, J), J];
        else if (isH(side)) pts = Math.abs(p.y - J.y) < 1 ? [p, J] : [p, { x: J.x, y: p.y }, J];
        else           pts = Math.abs(p.x - J.x) < 1 ? [p, J] : [p, { x: p.x, y: J.y }, J];
        const fskip = [fromIds[k], e.to];
        if (this._hits(pts, fskip)) {
          // A source on another side of the target: let it leave by its own best side.
          const own = this._side(s, t);
          pts = this._route(this._exit(s, own), own, J, null, fskip);
        }
        this._addPath(g, this._pathD(pts), idx, false);
        branchSegs.push(...this._segsOf(pts));
      });
      this._addPath(g, this._pathD([J, q]), idx, true);
      if (srcs.length > 1) g.appendChild(svg('circle', { class: 'sg-junction', cx: r1(J.x), cy: r1(J.y), r: 1.6 }));
      const trunk = { x1: J.x, y1: J.y, x2: q.x, y2: q.y, dir: isH(side) ? 'h' : 'v' };
      this._placeLabel([trunk, ...branchSegs.filter(sg => sg.dir === trunk.dir)], e, g);
      layer.appendChild(g);
    }

    /* Vertical extents of the above/below blocks of a label. `cvH` is the
       part of hBelow the cofactor curve takes; `hAlong` what the label
       needs along a vertical shaft. */
    _labelExtents(m) {
      const up = m.above.map(lineExtent), dn = m.below.map(lineExtent);
      const sum = (arr, lead) => arr.reduce((a, x) => a + x.up + x.down, 0) + lead * Math.max(0, arr.length - 1);
      const mh = m.mol ? m.molH + EMOL_GAP : 0;
      const cvH = m.curve ? m.curve.H + (m.below.length || m.molBelow ? 3 : 0) : 0;
      const hAll = sum(up.concat(dn), LINE_LEAD) + mh;
      return {
        hAbove: sum(up, LINE_LEAD) + (m.molBelow ? 0 : mh),
        hBelow: cvH + sum(dn, LINE_LEAD + 2) + (m.molBelow ? mh : 0),
        cvH, hAll,
        hAlong: Math.max(hAll, m.curve ? m.curve.along : 0)
      };
    }

    /* Travel direction u along a seat and the side n its curve goes to:
       under a horizontal shaft, opposite the text beside a vertical one,
       on the lower side of a slanted one. */
    _curveFrame(seg, mode) {
      const dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1;
      if (mode === 'h') return { u: { x: dx < 0 ? -1 : 1, y: 0 }, n: { x: 0, y: 1 } };
      if (mode === 'vr' || mode === 'vl') return { u: { x: 0, y: dy < 0 ? -1 : 1 }, n: { x: mode === 'vr' ? -1 : 1, y: 0 } };
      const l = Math.hypot(dx, dy) || 1;
      let nx = dy / l, ny = -dx / l;
      if (ny > 0 || (ny === 0 && nx < 0)) { nx = -nx; ny = -ny; }
      return { u: { x: dx / l, y: dy / l }, n: { x: -nx, y: -ny } };
    }

    /* The arc: ends CURVE_D off the shaft, W apart; control points just
       past the shaft so the arc touches it in the middle. A half arc (in
       the quiz, when only one end carries something) is the first or the
       second half of it, shifted to sit centred on the seat. */
    _curveGeom(mx, my, fr, cv) {
      const off = cv.half === 'in' ? cv.W / 4 : cv.half === 'out' ? -cv.W / 4 : 0;
      const P = (a, b) => ({ x: mx + fr.u.x * (a + off) + fr.n.x * b, y: my + fr.u.y * (a + off) + fr.n.y * b });
      const c = (4 - cv.D) / 3;
      const S = P(-cv.W / 2, cv.D), C1 = P(-cv.W * 0.3, c), C2 = P(cv.W * 0.3, c), E = P(cv.W / 2, cv.D);
      if (!cv.half) return { S, C1, C2, E };
      // de Casteljau at t = 1/2
      const mid = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
      const a = mid(S, C1), b = mid(C1, C2), d = mid(C2, E), ab = mid(a, b), bd = mid(b, d), M = mid(ab, bd);
      return cv.half === 'in' ? { S, C1: a, C2: ab, E: M } : { S: M, C1: bd, C2: d, E };
    }

    /* What sits on the ends of the arc, a structure and/or text: under an
       end of a horizontal arc (structure first), beside an end of a
       vertical one. Every drawn end gets a `box`, an empty one too (the
       editor's field, a place to drop a structure); `ct` is where its
       content starts, `ax` / `anchor` where its text is anchored. */
    _curveEnds(g, fr, cv) {
      const out = [];
      const horiz = Math.abs(fr.n.y) >= Math.abs(fr.n.x);
      const spot = (e, P, which) => {
        const ex = e.t ? lineExtent(e.t) : { up: CAP_H, down: 0 };
        const vis = (e.ms ? e.ms.h : 0) + (e.t || !e.ms ? (e.ms ? 2 : 0) + ex.up + ex.down : 0);
        const w = Math.max(e.w, 26), h = Math.max(vis, e.h, CURVE_LABEL_H);
        const box = horiz
          ? { x: P.x - w / 2, y: fr.n.y >= 0 ? P.y + 3 : P.y - 3 - h, w, h }
          : { x: fr.n.x > 0 ? P.x + 4 : P.x - 4 - w, y: P.y - h / 2, w, h };
        const anchor = horiz ? 'middle' : fr.n.x > 0 ? 'start' : 'end';
        out.push({
          which, e, P, box, ex, anchor,
          ax: anchor === 'middle' ? P.x : anchor === 'start' ? box.x : box.x + box.w,
          ct: horiz ? box.y : P.y - vis / 2
        });
      };
      if (cv.half !== 'out') spot(cv.a, g.S, 'in');
      if (cv.half !== 'in') spot(cv.b, g.E, 'out');
      return out;
    }

    /* The box a curve and the things on its ends take. */
    _curveBox(mx, my, seg, mode, cv) {
      const fr = this._curveFrame(seg, mode), g = this._curveGeom(mx, my, fr, cv);
      const xs = [g.S.x, g.E.x, g.C1.x, g.C2.x], ys = [g.S.y, g.E.y, g.C1.y, g.C2.y];
      let box = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
      for (const sp of this._curveEnds(g, fr, cv)) {
        if (sp.e.any || !this.readOnly) box = unionBox(box, sp.box);
      }
      return box;
    }

    _labelBox(seg, mode, m, ext) {
      const mx = (seg.x1 + seg.x2) / 2, my = (seg.y1 + seg.y2) / 2, w = m.width;
      if (mode === 'd') {
        const bl = this._diagBlocks(seg, m, ext);
        let box = null;
        for (const b of bl) {
          const r = { x: b.cx - w / 2, y: b.cy - b.h / 2, w, h: b.h };
          box = box ? unionBox(box, r) : r;
        }
        if (m.curve) {
          const r = this._curveBox(mx, my, seg, mode, m.curve);
          box = box ? unionBox(box, r) : r;
        }
        return box || { x: mx, y: my, w: 1, h: 1 };
      }
      if (mode === 'h') {
        const top = m.above.length || (m.mol && !m.molBelow) ? my - LABEL_GAP - ext.hAbove : my;
        const bot = m.below.length || m.molBelow || m.curve ? my + LABEL_GAP + ext.hBelow : my;
        return { x: mx - w / 2, y: top, w, h: bot - top };
      }
      const tw = m.tw;
      let box = { x: mode === 'vr' ? mx + VLABEL_DX : mx - VLABEL_DX - tw, y: my - ext.hAll / 2, w: tw, h: ext.hAll };
      if (!m.above.length && !m.below.length && !m.mol) box = { x: mx, y: my, w: 1, h: 1 };
      if (m.curve) box = unionBox(box, this._curveBox(mx, my, seg, mode, m.curve));
      return box;
    }

    /* Text on a slanted line (an equilibrium between compounds that are
       not in one row or column): the reagents sit on the upper side of
       the line, the conditions on the lower, each block pushed off the
       line just far enough that its nearest corner keeps LABEL_GAP (the
       lower one also clears the cofactor curve). */
    _diagBlocks(seg, m, ext) {
      const dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1, l = Math.hypot(dx, dy) || 1;
      let nx = dy / l, ny = -dx / l;
      if (ny > 0 || (ny === 0 && nx < 0)) { nx = -nx; ny = -ny; }
      const mx = (seg.x1 + seg.x2) / 2, my = (seg.y1 + seg.y2) / 2, w = m.tw;
      const out = [];
      const put = (h, sg, kind, extra) => {
        const d = LABEL_GAP + extra + Math.abs(nx) * w / 2 + Math.abs(ny) * h / 2;
        out.push({ kind, h, cx: mx + sg * nx * d, cy: my + sg * ny * d });
      };
      if (ext.hAbove > 0) put(ext.hAbove, 1, 'above', 0);
      const hb = ext.hBelow - ext.cvH;
      if (hb > 0) put(hb, -1, 'below', m.curve ? m.curve.H + 4 : 0);
      return out;
    }

    /* Labels are placed after every line is drawn, so a label can
       avoid other arrows as well as structures and earlier labels. */
    _placeLabel(segs, edge, g) {
      const m = this._metrics(edge);
      // An empty arrow still gets a seat, so it can be typed on in place.
      if (segs.length && this._seatOf && !this._seatOf.has(edge)) {
        const hs = segs.find(sg => sg.dir === 'h') || segs[0];
        this._seatOf.set(edge, { sg: hs, mode: hs.dir === 'h' ? 'h' : hs.dir === 'd' ? 'd' : 'vr' });
      }
      if (!m.any || !segs.length) return null;
      if (this._labelJobs && g) { this._labelJobs.push({ segs, edge, g }); return null; }
      return this._pickSeat(segs, edge);
    }

    _flushLabels() {
      const jobs = this._labelJobs || [];
      this._labelJobs = null;
      for (const j of jobs) {
        const el = this._pickSeat(j.segs, j.edge);
        if (el) j.g.appendChild(el);
      }
    }

    /* Pick the first seat on the arrow that collides with nothing; if
       every seat collides, take the one with the least overlap. */
    _pickSeat(segs, edge, dry) {
      const m = this._metrics(edge);
      if (!m.any) return null;
      const ext = this._labelExtents(m);
      const cands = [];
      // Slanted pieces (a Y's diagonals) carry no text — unless the arrow
      // is one slanted line (an equilibrium off the grid).
      const straight = segs.filter(sg => sg.dir !== 'd');
      segs = straight.length ? straight : segs;
      if (!segs.length) return dry ? 0 : null;
      segs.forEach((sg, k) => {
        if (sg.dir === 'h') cands.push({ sg, mode: 'h', pref: k * 2 });
        else if (sg.dir === 'd') cands.push({ sg, mode: 'd', pref: k * 2 });
        else { cands.push({ sg, mode: 'vr', pref: k * 2 }); cands.push({ sg, mode: 'vl', pref: k * 2 + 1 }); }
      });
      // If the middle of a run is blocked, the text may slide along it.
      segs.forEach((sg, k) => {
        if (sg.dir === 'd') return;
        const h = sg.dir === 'h';
        const need = (h ? m.width : ext.hAlong) + 12;
        const a0 = h ? Math.min(sg.x1, sg.x2) : Math.min(sg.y1, sg.y2);
        const len = Math.abs(sg.x2 - sg.x1) + Math.abs(sg.y2 - sg.y1);
        if (len - need < 16) return;
        // (a slice keeps the direction of travel: the curve's arrowhead follows it)
        const back = h ? sg.x2 < sg.x1 : sg.y2 < sg.y1;
        for (const f of [0.25, 0.75, 0, 1]) {
          const b0 = a0 + (len - need) * f, b1 = b0 + need;
          const sub = h ? { x1: back ? b1 : b0, x2: back ? b0 : b1, y1: sg.y1, y2: sg.y2, dir: 'h' }
                        : { x1: sg.x1, x2: sg.x2, y1: back ? b1 : b0, y2: back ? b0 : b1, dir: 'v' };
          if (h) cands.push({ sg: sub, mode: 'h', pref: k * 2 + 4 });
          else { cands.push({ sg: sub, mode: 'vr', pref: k * 2 + 4 }); cands.push({ sg: sub, mode: 'vl', pref: k * 2 + 5 }); }
        }
      });
      const overlap = (a, b) => {
        const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        return (w > 1 && h > 1) ? w * h : 0;
      };
      let best = null;
      for (const c of cands) {
        const bb = this._labelBox(c.sg, c.mode, m, ext);
        let score = 0;
        const pad = { x: bb.x - 3, y: bb.y - 3, w: bb.w + 6, h: bb.h + 6 };
        for (const o of this._obstacles || []) score += overlap(pad, o);
        for (const o of this._placed || []) score += overlap(bb, o) * 2;
        for (const l of this._lines || []) {
          // The shaft the text is written on runs between its two halves.
          if (c.mode === 'h' && Math.abs(l.y1 - l.y2) < 0.5 && Math.abs(l.y1 - c.sg.y1) < 1) continue;
          if (c.mode !== 'h' && c.mode !== 'd' && m.curve && Math.abs(l.x1 - l.x2) < 0.5 && Math.abs(l.x1 - c.sg.x1) < 1) continue;
          if (c.mode === 'd' && ((Math.abs(l.x1 - c.sg.x1) < 1 && Math.abs(l.y1 - c.sg.y1) < 1) ||
                                 (Math.abs(l.x2 - c.sg.x1) < 1 && Math.abs(l.y2 - c.sg.y1) < 1))) continue;
          const x1 = Math.min(l.x1, l.x2), x2 = Math.max(l.x1, l.x2);
          const y1 = Math.min(l.y1, l.y2), y2 = Math.max(l.y1, l.y2);
          if (x2 > bb.x + 1 && x1 < bb.x + bb.w - 1 && y2 > bb.y + 1 && y1 < bb.y + bb.h - 1 &&
              (x1 === x2 || y1 === y2 || segHitsRect(l, bb))) score += 600;
        }
        const len = Math.abs(c.sg.x2 - c.sg.x1) + Math.abs(c.sg.y2 - c.sg.y1);
        // A horizontal seat shorter than the text overhangs the shaft end.
        if (c.mode === 'h' && len < m.width + 6) score += (m.width + 6 - len) * 4;
        if ((c.mode === 'vr' || c.mode === 'vl') && len < ext.hAlong + 6) score += (ext.hAlong + 6 - len) * 4;
        score += c.pref * 0.01;
        c.bb = bb; c.score = score;
        if (!best || score < best.score) best = c;
        if (score < 1) break;
      }
      if (dry) return best.score;
      if (this._scoring && best.score >= 1) this._seatBad++;
      if (this._placed) this._placed.push(best.bb);
      if (this._seatOf) this._seatOf.set(edge, { sg: best.sg, mode: best.mode });
      // The edge being typed on shows the inputs instead of its text
      // (its structure stays).
      return this._labelEl(best.sg, edge, best.mode, this._editEdge === edge);
    }

    /* Reagent text, BW-style. On a horizontal shaft the reagents stack
       upward and the conditions downward, each kept a FIXED distance
       from the shaft measured to the text's visual edge — a subscript
       on the line nearest the shaft lifts that line instead of touching
       the arrow. Beside a vertical shaft the block is vertically
       centred, to the right ('vr') or left ('vl'). A structure on the
       arrow sits on top of the reagent text (under the conditions with
       reagent_mol_below); the cofactor curve goes under the shaft, or
       opposite the text beside a vertical one. */
    _labelEl(seg, edge, mode, textOff) {
      const m = this._metrics(edge);
      if (!m.any) return null;
      mode = mode || (seg.dir === 'h' ? 'h' : seg.dir === 'd' ? 'd' : 'vr');
      const mx = (seg.x1 + seg.x2) / 2;
      const my = (seg.y1 + seg.y2) / 2;
      const wrap = svg('g', { class: 'sg-edge-labels' });
      const put = (text, cls, x, y, anchor) => {
        if (textOff) return;
        const t = svg('text', { class: 'sg-edge-label ' + cls, x: r1(x), y: r1(y), 'text-anchor': anchor });
        wrap.appendChild(setChemText(t, text));
      };
      /* A structure at (left, top), `size` px. In the editor it carries
         its slot ('mol' on the arrow, 'in' / 'out' on the curve's ends),
         so it can be picked up and dragged off or elsewhere. */
      const putStruct = (mol, left, top, size, slot) => {
        const r = edgeMolSvg(mol, size);
        if (!r) {
          if (!this.readOnly) wrap.appendChild(svg('rect', { class: 'sg-edge-mol-ph', x: r1(left), y: r1(top), width: r1(size.w), height: r1(size.h), rx: 4 }));
          this._emolPending = true;
          return;
        }
        r.el.setAttribute('x', r1(left));
        r.el.setAttribute('y', r1(top));
        r.el.setAttribute('width', r1(r.w));
        r.el.setAttribute('height', r1(r.h));
        r.el.setAttribute('class', 'sg-edge-mol');
        if (!this.readOnly) {
          // the drawing is thin lines; this makes all of it grabbable
          wrap.appendChild(svg('rect', { class: 'sg-slot-hit', 'data-slot': slot, x: r1(left), y: r1(top), width: r1(r.w), height: r1(r.h), fill: 'transparent' }));
          r.el.setAttribute('data-slot', slot);
        }
        wrap.appendChild(r.el);
      };
      /* The structure on the arrow, m.molW × m.molH, bottom edge at
         `bottom`, horizontally anchored like the text. */
      const putMol = (x, bottom, anchor) => {
        if (!m.mol) return;
        const left = anchor === 'middle' ? x - m.molW / 2 : anchor === 'end' ? x - m.molW : x;
        putStruct(edge.reagent_mol, left, bottom - m.molH, { w: m.molW, h: m.molH }, 'mol');
      };
      /* The cofactor curve around (cx, cy), with what sits on its ends.
         An arc that only brings something in merges into the shaft
         without an arrowhead. */
      const putCurve = (cx, cy) => {
        const cv = m.curve;
        if (!cv) return;
        const fr = this._curveFrame(seg, mode);
        const g = this._curveGeom(cx, cy, fr, cv);
        const sel = this._isSelected('edge', this.scheme.edges.indexOf(edge));
        wrap.appendChild(svg('path', {
          class: 'sg-curve', fill: 'none',
          'marker-end': cv.half === 'in' ? null : sel ? 'url(#sg-arrow-sm-sel)' : 'url(#sg-arrow-sm)',
          d: `M ${r1(g.S.x)} ${r1(g.S.y)} C ${r1(g.C1.x)} ${r1(g.C1.y)} ${r1(g.C2.x)} ${r1(g.C2.y)} ${r1(g.E.x)} ${r1(g.E.y)}`
        }));
        for (const sp of this._curveEnds(g, fr, cv)) {
          const e = sp.e;
          let y = sp.ct;
          if (e.ms) {
            const left = sp.anchor === 'middle' ? sp.ax - e.ms.w / 2 : sp.anchor === 'start' ? sp.ax : sp.ax - e.ms.w;
            putStruct(e.mol, left, y, e.ms, sp.which);
            y += e.ms.h + 2;
          }
          if (e.t) put(e.t, 'below', sp.ax, y + sp.ex.up, sp.anchor);
        }
      };

      if (mode === 'd') {
        for (const b of this._diagBlocks(seg, m, this._labelExtents(m))) {
          if (b.kind === 'above') {
            let cursor = b.cy + b.h / 2;
            for (let i = m.above.length - 1; i >= 0; i--) {
              const ex = lineExtent(m.above[i]);
              const base = cursor - ex.down;
              put(m.above[i], 'above', b.cx, base, 'middle');
              cursor = base - ex.up - LINE_LEAD;
            }
            if (!m.molBelow) putMol(b.cx, m.above.length ? cursor + LINE_LEAD - EMOL_GAP : cursor, 'middle');
          } else {
            let cursor = b.cy - b.h / 2;
            for (const txt of m.below) {
              const ex = lineExtent(txt);
              const base = cursor + ex.up;
              put(txt, 'below', b.cx, base, 'middle');
              cursor = base + ex.down + LINE_LEAD + 2;
            }
            if (m.molBelow) putMol(b.cx, cursor + EMOL_GAP + m.molH, 'middle');
          }
        }
        putCurve(mx, my);
      } else if (mode === 'h') {
        let cursor = my - LABEL_GAP;
        for (let i = m.above.length - 1; i >= 0; i--) {
          const ex = lineExtent(m.above[i]);
          const base = cursor - ex.down;
          put(m.above[i], 'above', mx, base, 'middle');
          cursor = base - ex.up - LINE_LEAD;
        }
        if (!m.molBelow) putMol(mx, m.above.length ? cursor + LINE_LEAD - EMOL_GAP : cursor, 'middle');
        putCurve(mx, my);
        cursor = my + LABEL_GAP + this._labelExtents(m).cvH;
        for (const txt of m.below) {
          const ex = lineExtent(txt);
          const base = cursor + ex.up;
          put(txt, 'below', mx, base, 'middle');
          cursor = base + ex.down + LINE_LEAD + 2;
        }
        if (m.molBelow) putMol(mx, cursor + EMOL_GAP + m.molH, 'middle');
      } else {
        const all = [
          ...m.above.map(t => ({ t, cls: 'above' })),
          ...m.below.map(t => ({ t, cls: 'below' }))
        ];
        const ext = all.map(it => lineExtent(it.t));
        const blockH = ext.reduce((a, x) => a + x.up + x.down, 0) + LINE_LEAD * Math.max(0, all.length - 1);
        const x = mode === 'vl' ? mx - VLABEL_DX : mx + VLABEL_DX;
        const anchor = mode === 'vl' ? 'end' : 'start';
        const molH = m.mol ? m.molH + EMOL_GAP : 0;
        let cursor = my - (blockH + molH) / 2;
        if (m.mol && !m.molBelow) { putMol(x, cursor + m.molH, anchor); cursor += molH; }
        all.forEach((it, k) => {
          const base = cursor + ext[k].up;
          put(it.t, it.cls, x, base, anchor);
          cursor = base + ext[k].down + LINE_LEAD;
        });
        if (m.molBelow) putMol(x, cursor + EMOL_GAP + m.molH, anchor);
        putCurve(mx, my);
      }
      return wrap;
    }

    /* ─── Helpers ─────────────────────────────────────────────── */

    _nodeById(id) { return this.scheme.nodes.find(n => n.id === id); }
    _isSelected(kind, key) {
      if (!this.selected || this.selected.kind !== kind) return false;
      if (kind === 'node') return this.selected.id === key;
      // an arrow selects its whole reaction
      return this._selEdges ? this._selEdges.has(key) : this.selected.idx === key;
    }
    _degreeOf(id) {
      let i = 0, o = 0;
      for (const e of this.scheme.edges) {
        if (e.to === id) i++;
        if ((e.from || []).includes(id)) o++;
      }
      return { in: i, out: o };
    }
    _applyView() {
      if (this._inline) requestAnimationFrame(() => this._syncInlineEdit());
      this.viewport.setAttribute('transform',
        `translate(${this.viewX} ${this.viewY}) scale(${this.scale})`);
      if (this.zoomLabel) {
        this.zoomLabel.textContent = Math.round(this.scale * 100) + (this.readOnly ? '%' : ' %');
      }
    }
    _eventToWorld(ev) {
      const r = this.svg.getBoundingClientRect();
      return {
        x: (ev.clientX - r.left - this.viewX) / this.scale,
        y: (ev.clientY - r.top - this.viewY) / this.scale
      };
    }

    /* ─── Mutations ───────────────────────────────────────────── */

    addNode(opts) {
      opts = opts || {};
      // a letter that is neither an id nor a label yet
      const usedIds = new Set(this.scheme.nodes.flatMap(n => [n.id, String(n.label || '').trim()]));
      const id = opts.id || nextLetterId(usedIds);
      const n = {
        id, label: id, given: false,
        x: opts.x != null ? opts.x : 40,
        y: opts.y != null ? opts.y : 40
      };
      // Start from the previous node's structure: consecutive steps
      // usually share most of the skeleton, so editing beats redrawing.
      const prev = this.scheme.nodes[this.scheme.nodes.length - 1];
      if (opts.inheritStructure !== false && prev) {
        if (prev.mol)    n.mol = prev.mol;
        if (prev.smiles) n.smiles = prev.smiles;
      }
      this.scheme.nodes.push(n);
      if (this._isAutoLayout()) this.autoLayout();
      this.select('node', id);
      this._reveal(id);
      this.onChange();
      return id;
    }

    deleteNode(id) {
      const idx = this.scheme.nodes.findIndex(n => n.id === id);
      if (idx < 0) return;
      this.scheme.nodes.splice(idx, 1);
      this.scheme.edges = this.scheme.edges.filter(e => {
        if (e.to === id) return false;
        e.from = (e.from || []).filter(f => f !== id);
        return (e.from || []).length > 0 || e.to;
      });
      if (this.selected && this.selected.kind === 'node' && this.selected.id === id) {
        this.selected = null;
        this.onSelectNode(null);
      } else if (this.selected && this.selected.kind === 'edge') {
        this.selected = null;
        this._editEdge = null;
        this.onSelectEdge(null);
      }
      this._relayout();
      this.onChange();
    }

    deleteEdge(idx) {
      this.scheme.edges.splice(idx, 1);
      if (this.selected && this.selected.kind === 'edge' && this.selected.idx === idx) {
        this.selected = null;
        this._editEdge = null;
        this.onSelectEdge(null);
      } else if (this.selected && this.selected.kind === 'edge' && this.selected.idx > idx) {
        this.selected.idx--;
      }
      this._relayout();
      this.onChange();
    }

    createEdge(fromId, toId) {
      if (!fromId || !toId || fromId === toId) return false;
      const exact = this.scheme.edges.findIndex(e => e.to === toId && (e.from || []).length === 1 && e.from[0] === fromId);
      if (exact >= 0) return false;
      this.scheme.edges.push({ from: [fromId], to: toId, reagent_above: '', reagent_below: '' });
      if (this._isAutoLayout()) this.autoLayout();
      this.select('edge', this.scheme.edges.length - 1);
      this.onChange();
      this.editEdgeText(this.scheme.edges.length - 1);
      return true;
    }

    updateNode(id, patch) {
      const n = this._nodeById(id);
      if (!n) return;
      Object.assign(n, patch);
      if ('mol' in patch || 'smiles' in patch || 'name' in patch || 'caption' in patch || 'given' in patch || 'label' in patch) {
        this.refreshNode(id);
      }
      this.onChange();
    }

    updateEdge(idx, patch) {
      const e = this.scheme.edges[idx];
      if (!e) return;
      Object.assign(e, patch);
      // Reagent text changes the plan signature; re-plan so the arrow
      // keeps its planned route instead of dropping to free routing.
      if (this._isAutoLayout()) this.autoLayout();
      this.refresh();
      this.onChange();
    }

    /* ─── Reactions ───────────────────────────────────────────────
       What the reader sees as ONE reaction may be several arrows in the
       data: "A + W → B + X" is stored as A,W→B and A,W→X (see
       rxGroupKey). The editor selects, edits and deletes reactions. */
    reactionOf(idx) {
      const E = this.scheme.edges, e = E[idx];
      if (!e) return null;
      const ids = new Set(this.scheme.nodes.map(n => n.id));
      const key = rxGroupKey(e, ids);
      const edges = key == null ? [idx] : E.reduce((a, x, i) => { if (rxGroupKey(x, ids) === key) a.push(i); return a; }, []);
      return {
        edges, first: edges[0],
        srcs: [...new Set(e.from || [])],
        prods: [...new Set(edges.map(i => E[i].to))]
      };
    }

    /* The arrows of a reaction get a shared id before anything on them
       changes, so they stay one reaction even when they end up carrying
       nothing. */
    _pinReaction(rx) {
      const E = this.scheme.edges;
      if (!rx || rx.edges.length < 2 || E[rx.first].rxn) return;
      const used = new Set(E.map(e => e.rxn).filter(Boolean));
      let k = 1;
      while (used.has('r' + k)) k++;
      for (const i of rx.edges) E[i].rxn = 'r' + k;
    }

    /* Re-plan (in an auto layout) and redraw after the scheme changed. */
    _relayout() {
      if (this._isAutoLayout()) this.autoLayout();
      this.refresh();
    }

    /* After a reaction changed: keep it selected, re-plan, redraw, and
       let the side panel follow. */
    _afterReaction(idx) {
      const rx = idx != null ? this.reactionOf(idx) : null;
      this.selected = rx ? { kind: 'edge', idx: rx.first } : null;
      this._editEdge = rx ? this.scheme.edges[rx.first] : null;
      this._relayout();
      this.onChange();
      if (rx) this.onSelectEdge(this.scheme.edges[rx.first], rx.first);
      else this.onSelectEdge(null);
    }

    /* The same change on every arrow of the reaction of arrow `idx`. */
    updateReaction(idx, patch) {
      const rx = this.reactionOf(idx);
      if (!rx) return;
      this._pinReaction(rx);
      for (const i of rx.edges) {
        const e = this.scheme.edges[i];
        for (const k in patch) e[k] = Array.isArray(patch[k]) ? patch[k].slice() : patch[k];
      }
      this._afterReaction(rx.first);
    }

    addReactionEduct(idx, id) {
      const rx = this.reactionOf(idx);
      if (!rx || !this._nodeById(id) || rx.srcs.includes(id) || rx.prods.includes(id)) return false;
      this._pinReaction(rx);
      for (const i of rx.edges) this.scheme.edges[i].from = [...(this.scheme.edges[i].from || []), id];
      this._afterReaction(rx.first);
      return true;
    }

    removeReactionEduct(idx, id) {
      const rx = this.reactionOf(idx);
      if (!rx || !rx.srcs.includes(id) || rx.srcs.length < 2) return false;
      this._pinReaction(rx);
      for (const i of rx.edges) this.scheme.edges[i].from = (this.scheme.edges[i].from || []).filter(x => x !== id);
      this._afterReaction(rx.first);
      return true;
    }

    /* Another product: one more arrow carrying the same as the others. */
    addReactionProduct(idx, id) {
      const rx = this.reactionOf(idx);
      if (!rx || !this._nodeById(id) || rx.srcs.includes(id) || rx.prods.includes(id)) return false;
      const E = this.scheme.edges;
      const copy = JSON.parse(JSON.stringify(E[rx.first]));
      copy.to = id;
      E.push(copy);
      this._pinReaction({ edges: rx.edges.concat(E.length - 1), first: rx.first });
      this._afterReaction(rx.first);
      return true;
    }

    removeReactionProduct(idx, id) {
      const rx = this.reactionOf(idx);
      if (!rx || rx.edges.length < 2) return false;
      const k = rx.edges.find(i => this.scheme.edges[i].to === id);
      if (k == null) return false;
      this.scheme.edges.splice(k, 1);
      const rest = rx.edges.filter(i => i !== k).map(i => i > k ? i - 1 : i);
      // a single arrow is a reaction by itself
      if (rest.length === 1) delete this.scheme.edges[rest[0]].rxn;
      this._afterReaction(rest[0]);
      return true;
    }

    deleteReaction(idx) {
      const rx = this.reactionOf(idx);
      if (!rx) return;
      const drop = new Set(rx.edges);
      this.scheme.edges = this.scheme.edges.filter((e, i) => !drop.has(i));
      this._afterReaction(null);
    }

    /* ─── Structures on arrows ─────────────────────────────────────
       A compound that is not on any arrow yet can be dragged onto one:
       over or under it (reagent, reagent_mol) or onto an end of its
       cofactor curve. A structure on an arrow can be dragged off again
       and is a compound of its own then. */

    /* A new compound (vorgegeben, no letter) for a structure that comes
       off an arrow; `at`: where it was dropped (a free layout keeps it). */
    _newNodeFromMol(mol, at) {
      const id = nextLetterId(new Set(this.scheme.nodes.flatMap(n => [n.id, String(n.label || '').trim()])));
      this.scheme.nodes.push({
        id, label: '', given: true, mol,
        x: at ? Math.round(at.x - this.NW / 2) : 40,
        y: at ? Math.round(at.y - this.NH / 2) : 40
      });
      return id;
    }

    detachStructure(idx, slot, at) {
      const E = this.scheme.edges, f = SLOT_FIELD[slot];
      const rx = this.reactionOf(idx);
      if (!rx || !f || !E[idx][f]) return null;
      const mol = E[idx][f];
      this._pinReaction(rx);
      for (const i of rx.edges) E[i][f] = '';
      const id = this._newNodeFromMol(mol, at);
      this._relayout();
      this.onChange();
      this.select('node', id);
      this._reveal(id);
      return id;
    }

    /* Move a structure to another place on an arrow. Onto the other side
       of its own arrow it just changes sides; a structure it displaces
       swaps in on the same arrow, or becomes a compound of its own. */
    moveStructure(idx, slot, to) {
      const E = this.scheme.edges, f = SLOT_FIELD[slot];
      const src = this.reactionOf(idx), dst = this.reactionOf(to.idx);
      if (!src || !dst || !f || !E[idx][f]) return false;
      const tf = to.zone === 'in' ? 'curve_in_mol' : to.zone === 'out' ? 'curve_out_mol' : 'reagent_mol';
      const same = src.first === dst.first;
      if (same && f === tf) {
        if (f === 'reagent_mol') this.updateReaction(idx, { reagent_mol_below: to.zone === 'below' });
        return true;
      }
      const mol = E[idx][f];
      this._pinReaction(src);
      if (!same) this._pinReaction(dst);
      const displaced = E[dst.first][tf] || '';
      for (const i of src.edges) E[i][f] = same && displaced ? displaced : '';
      for (const i of dst.edges) {
        E[i][tf] = mol;
        if (tf === 'reagent_mol') E[i].reagent_mol_below = to.zone === 'below';
      }
      if (displaced && !same) this._newNodeFromMol(displaced, null);
      this._afterReaction(dst.first);
      return true;
    }

    /* Drop compound `id` (on no arrow yet) onto reaction `idx`: its
       structure goes over / under the arrow or onto an end of the curve;
       a compound given as a name only adds that name to the text there. */
    attachNode(id, idx, zone) {
      const n = this._nodeById(id), rx = this.reactionOf(idx);
      if (!n || !rx) return false;
      const deg = this._degreeOf(id);
      if (deg.in || deg.out) return false;
      let mol = n.mol || '';
      if (!mol && n.smiles && window.OCL) {
        try { mol = window.OCL.Molecule.fromSmiles(n.smiles).toMolfile(); } catch (_) { mol = ''; }
      }
      const text = !mol ? String(n.text || '').trim() : '';
      if (!mol && !text) return false;
      const E = this.scheme.edges, e0 = E[rx.first];
      this._pinReaction(rx);
      const patch = {};
      let displaced = '';
      if (mol) {
        const f = zone === 'in' ? 'curve_in_mol' : zone === 'out' ? 'curve_out_mol' : 'reagent_mol';
        displaced = e0[f] || '';
        patch[f] = mol;
        if (f === 'reagent_mol') patch.reagent_mol_below = zone === 'below';
      } else {
        const f = { above: 'reagent_above', below: 'reagent_below', in: 'curve_in', out: 'curve_out' }[zone];
        const cur = String(e0[f] || '').trim();
        patch[f] = cur ? cur + ', ' + text : text;
      }
      for (const i of rx.edges) Object.assign(E[i], patch);
      const at = { x: n.x + this.NW / 2, y: n.y + this.NH / 2 };
      this.scheme.nodes.splice(this.scheme.nodes.indexOf(n), 1);
      if (displaced) this._newNodeFromMol(displaced, at);
      this._afterReaction(rx.first);
      return true;
    }

    /* Drop targets on every arrow: over and under its text (horizontal
       arrow) or the upper and lower half beside it (vertical arrow), and
       the two ends of its cofactor curve. The curve's ends come first:
       they are the smaller, more precise targets. */
    _dropZones() {
      const ends = [], sides = [];
      for (const [edge, seat] of this._seatOf || []) {
        const idx = this.scheme.edges.indexOf(edge);
        if (idx < 0) continue;
        const m = this._metrics(edge), ext = this._labelExtents(m);
        const sg = seat.sg, mx = (sg.x1 + sg.x2) / 2, my = (sg.y1 + sg.y2) / 2;
        if (seat.mode === 'h' || seat.mode === 'd') {
          const w = Math.max(84, Math.min(m.width + 16, 220));
          const hA = Math.max(34, ext.hAbove + 10), hB = Math.max(30, ext.hBelow - ext.cvH + 10);
          sides.push({ idx, zone: 'above', box: { x: mx - w / 2, y: my - 4 - hA, w, h: hA } });
          sides.push({ idx, zone: 'below', box: { x: mx - w / 2, y: my + 4 + ext.cvH, w, h: hB } });
        } else {
          const w = Math.max(84, m.tw + 16), h = Math.max(30, ext.hAll / 2 + 10);
          const x = seat.mode === 'vr' ? mx + 4 : mx - 4 - w;
          sides.push({ idx, zone: 'above', box: { x, y: my - h, w, h } });
          sides.push({ idx, zone: 'below', box: { x, y: my, w, h } });
        }
        if (m.curve) {
          const fr = this._curveFrame(sg, seat.mode), g = this._curveGeom(mx, my, fr, m.curve);
          for (const sp of this._curveEnds(g, fr, m.curve)) {
            const b = sp.box, w = Math.max(b.w + 8, 46), h = Math.max(b.h + 8, 28);
            ends.push({ idx, zone: sp.which, box: { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w, h } });
          }
        }
      }
      return ends.concat(sides);
    }

    _zoneAt(p, zones) {
      for (const z of zones || this._zones || []) {
        const b = z.box;
        if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return z;
      }
      return null;
    }

    /* The drop targets while something is carried; `hot` is the one under
       the pointer. Without this._zones the layer goes away. */
    _drawZones(hot) {
      let layer = this.viewport.querySelector('.sg-drop-layer');
      if (!this._zones) { if (layer) layer.remove(); this._zoneEls = null; return; }
      if (!layer || !this._zoneEls) {
        if (layer) layer.remove();
        layer = svg('g', { class: 'sg-drop-layer' });
        this._zoneEls = this._zones.map(z => {
          const r = svg('rect', { class: 'sg-drop-zone', x: r1(z.box.x), y: r1(z.box.y), width: r1(z.box.w), height: r1(z.box.h), rx: 6 });
          layer.appendChild(r);
          return r;
        });
        this._zoneCap = svg('text', { class: 'sg-drop-cap', 'text-anchor': 'middle' });
        layer.appendChild(this._zoneCap);
        this.viewport.appendChild(layer);
      }
      this._zones.forEach((z, i) => this._zoneEls[i].classList.toggle('hot', z === hot));
      this._zoneCap.textContent = hot ? ZONE_CAP[hot.zone] : '';
      if (hot) {
        this._zoneCap.setAttribute('x', r1(hot.box.x + hot.box.w / 2));
        this._zoneCap.setAttribute('y', r1(hot.zone === 'above' ? hot.box.y - 4 : hot.box.y + hot.box.h + 11));
      }
    }

    /* A see-through copy of a structure that follows the pointer. */
    _ghostOf(el) {
      const g = el.cloneNode(true);
      g.removeAttribute('data-slot');
      g.setAttribute('class', 'sg-ghost');
      this.viewport.appendChild(g);
      return { el: g, w: parseFloat(el.getAttribute('width')) || 60, h: parseFloat(el.getAttribute('height')) || 40 };
    }
    _moveGhost(gh, p) {
      gh.el.setAttribute('x', r1(p.x - gh.w / 2));
      gh.el.setAttribute('y', r1(p.y - gh.h / 2));
    }

    /* While a connection is dragged: the compound or arrow it would go to. */
    _draftTarget(ev, d) {
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      if (!el || !d || !this.container.contains(el)) return null;
      const nodeEl = el.closest('.sg-node');
      if (nodeEl) return nodeEl.dataset.node === d.fromId ? null : { kind: 'node', el: nodeEl, id: nodeEl.dataset.node };
      const edgeEl = d.fromId ? el.closest('.sg-edge') : null;
      if (edgeEl) return { kind: 'edge', el: edgeEl, idx: parseInt(edgeEl.dataset.edgeIdx, 10) };
      return null;
    }
    _markTarget(t) {
      const el = t ? t.el : null;
      if (this._target && this._target !== el) this._target.classList.remove('sg-target');
      this._target = el;
      if (el) el.classList.add('sg-target');
    }

    _hint(msg) {
      if (typeof this.opts.onHint === 'function') this.opts.onHint(msg);
    }

    select(kind, key) {
      if (!kind) {
        this.selected = null;
        this._editEdge = null;
        this.refresh();
        this.onSelectNode(null);
        this.onSelectEdge(null);
        return;
      }
      if (kind === 'edge') {
        const rx = this.reactionOf(key);
        if (rx) key = rx.first;
      }
      this.selected = kind === 'node' ? { kind, id: key } : { kind, idx: key };
      this._editEdge = kind === 'edge' ? this.scheme.edges[key] : null;
      this.refresh();
      if (kind === 'node') this.onSelectNode(this._nodeById(key));
      else                 this.onSelectEdge(this.scheme.edges[key], key);
    }

    /* ─── In-place reagent editing (WYSIWYG) ─────────────────────
       A selected arrow gets two text fields exactly where its reagent
       (above) and condition (below) text is drawn. Typing updates the
       scheme live; the SVG text of that arrow is suppressed meanwhile. */
    _buildInlineEdit() {
      if (getComputedStyle(this.container).position === 'static') this.container.style.position = 'relative';
      const box = document.createElement('div');
      box.className = 'sg-inline-edit';
      box.hidden = true;
      box.innerHTML =
        '<input class="sg-ie-above" placeholder="Reagenz" spellcheck="false" autocomplete="off">' +
        '<input class="sg-ie-below" placeholder="Bedingungen" spellcheck="false" autocomplete="off">' +
        '<input class="sg-ie-cin" placeholder="ein" title="Cofaktor / Co-Substrat, das in den Bogen hineingeht" spellcheck="false" autocomplete="off">' +
        '<input class="sg-ie-cout" placeholder="aus" title="Cofaktor / Nebenprodukt, das aus dem Bogen herauskommt" spellcheck="false" autocomplete="off">';
      this.container.appendChild(box);
      const [ia, ib, ic, io] = box.querySelectorAll('input');
      this._inline = { box, ia, ib, ic, io };
      let t = null;
      const onInput = () => {
        const e = this._editEdge;
        if (!e) return;
        // every arrow of the reaction carries the same text
        const i = this.scheme.edges.indexOf(e);
        const rx = i >= 0 ? this.reactionOf(i) : null;
        this._pinReaction(rx);
        for (const x of rx ? rx.edges.map(k => this.scheme.edges[k]) : [e]) {
          x.reagent_above = ia.value;
          x.reagent_below = ib.value;
          if (x.curve) { x.curve_in = ic.value; x.curve_out = io.value; }
        }
        this._sizeInline();
        clearTimeout(t);
        // Re-planning and re-rendering is too heavy per keystroke.
        t = setTimeout(() => {
          if (this._isAutoLayout()) this.autoLayout();
          this.refresh();
          this.onChange();
        }, 160);
      };
      // Enter / Tab walk the fields in reading order: reagent, conditions,
      // then the curve's two ends.
      const order = () => [ia, ib].concat(this._editEdge && this._editEdge.curve ? [ic, io] : []);
      const keys = ev => {
        const seq = order(), k = seq.indexOf(ev.target);
        if ((ev.key === 'Enter' || (ev.key === 'Tab' && !ev.shiftKey)) && k >= 0 && k < seq.length - 1) { ev.preventDefault(); seq[k + 1].focus(); }
        else if (ev.key === 'Enter' || ev.key === 'Escape') { ev.preventDefault(); ev.target.blur(); this.svg.focus(); }
      };
      for (const el of [ia, ib, ic, io]) {
        el.addEventListener('input', onInput);
        el.addEventListener('keydown', keys);
      }
      // Keep the canvas from starting a pan/deselect under the fields.
      box.addEventListener('pointerdown', ev => ev.stopPropagation());
    }

    _sizeInline() {
      const { ia, ib, ic, io } = this._inline;
      const fs = Math.max(10, Math.min(18, 11.5 * this.scale));
      for (const el of [ia, ib, ic, io]) {
        const len = CT.plain(el.value || el.placeholder).length;
        el.style.fontSize = (el === ia ? fs : fs * 0.92) + 'px';
        el.style.width = Math.max(4, len + 2) + 'ch';
      }
    }

    _syncInlineEdit() {
      const ie = this._inline;
      if (!ie) return;
      const e = this._editEdge;
      const seat = e && this._seatOf && this._seatOf.get(e);
      if (!e || !seat || !this.scheme.edges.includes(e)) { ie.box.hidden = true; return; }
      ie.box.hidden = false;
      const m = this._metrics(e);
      if (document.activeElement !== ie.ia) ie.ia.value = e.reagent_above || '';
      if (document.activeElement !== ie.ib) ie.ib.value = e.reagent_below || '';
      if (document.activeElement !== ie.ic) ie.ic.value = e.curve_in || '';
      if (document.activeElement !== ie.io) ie.io.value = e.curve_out || '';
      ie.ic.style.display = ie.io.style.display = e.curve ? '' : 'none';
      this._sizeInline();
      const sg = seat.sg;
      const mx = (sg.x1 + sg.x2) / 2, my = (sg.y1 + sg.y2) / 2;
      // SVG elements have no offsetLeft/Top; measure against the host.
      const hr = this.container.getBoundingClientRect(), cr = this.svg.getBoundingClientRect();
      const ox = cr.left - hr.left - this.container.clientLeft, oy = cr.top - hr.top - this.container.clientTop;
      const scr = (x, y) => ({ x: ox + this.viewX + x * this.scale, y: oy + this.viewY + y * this.scale });
      const { x: sx, y: sy } = scr(mx, my);
      const ha = ie.ia.offsetHeight || 22, gap = 3;
      const place = (el, left, top) => { el.style.left = left + 'px'; el.style.top = top + 'px'; };
      // The curve's fields first: each goes where its end's text is drawn
      // (under a structure on that end). The fields don't shrink with the
      // zoom, so the conditions field keeps below them, not just below
      // the drawn curve.
      let curveBottom = -Infinity;
      if (e.curve && m.curve) {
        const fr = this._curveFrame(sg, seat.mode);
        const g = this._curveGeom(mx, my, fr, m.curve);
        const row = [];
        for (const sp of this._curveEnds(g, fr, m.curve)) {
          const el = sp.which === 'in' ? ie.ic : ie.io;
          const w = el.offsetWidth, h = el.offsetHeight || 20;
          const top = sp.ct + (sp.e.ms ? sp.e.ms.h + 2 : 0);
          if (sp.anchor === 'middle') {
            const q = scr(sp.ax, top);
            row.push({ el, left: q.x - w / 2, w, top: q.y - 1 });
            curveBottom = Math.max(curveBottom, q.y - 1 + h);
          } else {
            const q = scr(sp.ax, top + (sp.ex.up + sp.ex.down) / 2);
            place(el, sp.anchor === 'start' ? q.x : q.x - w, q.y - h / 2);
          }
        }
        // zoomed out, the two fields would overlap: move them apart
        if (row.length === 2) {
          row.sort((p, q) => p.left - q.left);
          const over = row[0].left + row[0].w + 4 - row[1].left;
          if (over > 0) { row[0].left -= over / 2; row[1].left += over / 2; }
        }
        for (const f of row) place(f.el, f.left, f.top);
      }
      if (seat.mode === 'h' || seat.mode === 'd') {
        const cvH = this._labelExtents(m).cvH * this.scale;
        place(ie.ia, sx - ie.ia.offsetWidth / 2, sy - gap - ha);
        place(ie.ib, sx - ie.ib.offsetWidth / 2, Math.max(sy + gap + cvH, curveBottom + 3));
      } else {
        const dx = VLABEL_DX * this.scale;
        const w = Math.max(ie.ia.offsetWidth, ie.ib.offsetWidth);
        const left = seat.mode === 'vl' ? sx - dx - w : sx + dx;
        place(ie.ia, left, sy - ha - 1);
        place(ie.ib, left, sy + 1);
      }
    }

    /* Put the caret into the selected arrow's reagent field. */
    editEdgeText(idx) {
      if (this.readOnly) return;
      if (!this._isSelected('edge', idx)) this.select('edge', idx);
      if (this._inline && !this._inline.box.hidden) this._inline.ia.focus();
    }

    /* Pan (no zoom) until node `id` is in view. */
    _reveal(id) {
      const n = this._nodeById(id);
      if (!n || !this.svg) return;
      const r = this.svg.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const b = this._box(n);
      const x1 = this.viewX + b.l * this.scale, x2 = this.viewX + b.r * this.scale;
      const y1 = this.viewY + b.t * this.scale, y2 = this.viewY + b.b * this.scale;
      const dx = x1 < 12 ? 12 - x1 : x2 > r.width - 12 ? r.width - 12 - x2 : 0;
      const dy = y1 < 12 ? 12 - y1 : y2 > r.height - 12 ? r.height - 12 - y2 : 0;
      if (dx || dy) { this.viewX += dx; this.viewY += dy; this._applyView(); }
    }

    focusNode(id) {
      const n = this._nodeById(id);
      if (!n) return;
      const r = this.svg.getBoundingClientRect();
      this.viewX = r.width / 2 - (n.x + this.NW / 2) * this.scale;
      this.viewY = r.height / 2 - (n.y + this.NH / 2) * this.scale;
      this._applyView();
      this.select('node', id);
    }

    /* Content bounds in world space: nodes plus every label and arrow,
       so a reagent written beside the last column is never clipped. */
    _contentBBox() {
      let bb = null;
      try { bb = this.viewport.getBBox(); } catch (_) { bb = null; }
      if (bb && bb.width > 0 && bb.height > 0) {
        return { x: bb.x, y: bb.y, w: bb.width, h: bb.height };
      }
      const nodes = this.scheme.nodes;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(n => {
        minX = Math.min(minX, n.x || 0);
        minY = Math.min(minY, n.y || 0);
        maxX = Math.max(maxX, (n.x || 0) + this.NW);
        maxY = Math.max(maxY, (n.y || 0) + this.NH);
      });
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    /* Viewer: fit the WIDTH and let the canvas grow to the height that
       scale needs; the reader scrolls the page. Editor: fit both axes. */
    fitToContent() {
      const nodes = this.scheme.nodes;
      if (!nodes.length) { this.viewX = 40; this.viewY = 40; this.scale = 1; this._applyView(); return; }
      const bb = this._contentBBox();
      const pad = this.readOnly ? 12 : 34;
      const wantW = bb.w + 2 * pad;
      const wantH = bb.h + 2 * pad;
      const r = this.svg.getBoundingClientRect();

      if (this.readOnly && r.width > 40) {
        this.scale = Math.min(r.width / wantW, 1.15);
        // Centre a narrow scheme instead of hugging the left margin.
        const spare = Math.max(0, r.width - wantW * this.scale);
        this.viewX = -bb.x * this.scale + pad * this.scale + spare / 2;
      } else {
        this.scale = Math.min(r.width / wantW, r.height / wantH, 1.4);
        this.viewX = -bb.x * this.scale + pad * this.scale;
      }
      this.viewY = -bb.y * this.scale + pad * this.scale;
      this._fitted = true;
      this._applyView();
      if (this.readOnly) this._syncViewerHeight();
    }

    /* Viewer canvas is exactly as tall as the scheme at the current zoom. */
    _syncViewerHeight() {
      if (!this.readOnly) return;
      const bb = this._contentBBox();
      const bottom = (bb.y + bb.h) * this.scale + this.viewY + 12 * this.scale;
      this.svg.style.height = Math.max(160, Math.round(bottom)) + 'px';
    }

    reflow(force) {
      if (!this._isAutoLayout()) return false;
      if (!this.scheme.nodes.length) return false;
      const want = this.layoutColumns || this._bestCols();
      if (!force && want === this._layoutCols) return false;
      this.autoLayout({ columns: want });
      this.refresh();
      this.fitToContent();
      return true;
    }

    _bindResize() {
      let t = null;
      this._lastW = this.container.clientWidth;
      const run = () => {
        clearTimeout(t);
        t = setTimeout(() => {
          if (!this.svg || !this.svg.isConnected) return;
          const w = this.container.clientWidth;
          if (Math.abs(w - this._lastW) < 24) return;
          this._lastW = w;
          if (!this.reflow() && this.readOnly) this.fitToContent();
        }, 160);
      };
      this._onWinResize = run;
      window.addEventListener('resize', run);
      if (typeof ResizeObserver === 'function') {
        this._resizeObs = new ResizeObserver(run);
        try { this._resizeObs.observe(this.container); } catch (_) {}
      }
    }

    /* ─── Event binding ───────────────────────────────────────── */

    _zoomBy(f) {
      const r = this.svg.getBoundingClientRect();
      const cx = this.readOnly ? 0 : r.width / 2;
      const cy = this.readOnly ? 0 : r.height / 2;
      const ns = Math.max(0.25, Math.min(2.5, this.scale * f));
      this.viewX = cx - (cx - this.viewX) * (ns / this.scale);
      this.viewY = cy - (cy - this.viewY) * (ns / this.scale);
      this.scale = ns;
      this._applyView();
      this._syncViewerHeight();
    }

    _bindEvents() {
      this.toolbar.addEventListener('click', ev => {
        const b = ev.target.closest('[data-act]');
        if (!b) return;
        const act = b.dataset.act;
        if (act === 'add'    && !this.readOnly) this.addNode({ x: -this.viewX / this.scale + 60, y: -this.viewY / this.scale + 60 });
        if (act === 'layout' && !this.readOnly) { this.autoLayout(); this.refresh(); this.fitToContent(); this.onChange(); }
        if (act === 'free' && !this.readOnly && this._isAutoLayout()) {
          this.scheme.layout = 'manual';
          this.refresh();
          this.onChange();
          this._hint('Freies Verschieben: Knoten bleiben, wo man sie ablegt. „Auto-Layout“ ordnet wieder automatisch an.');
        }
        if (act === 'fit')      this.fitToContent();
        if (act === 'zoomin')   this._zoomBy(1.2);
        if (act === 'zoomout')  this._zoomBy(1 / 1.2);
      });

      this.svg.addEventListener('pointerdown', e => this._onPointerDown(e));
      this.svg.addEventListener('pointermove', e => this._onPointerMove(e));
      this.svg.addEventListener('pointerup',   e => this._onPointerUp(e));
      this.svg.addEventListener('pointercancel', e => this._onPointerUp(e));
      this.svg.addEventListener('wheel', e => this._onWheel(e), { passive: false });
      this.svg.addEventListener('click', e => this._onClick(e));
      this._keyHandler = e => {
        if (this.readOnly) return;
        if ((e.key === 'Delete' || e.key === 'Backspace') && this.selected && document.activeElement === this.svg) {
          if (this.selected.kind === 'node') this.deleteNode(this.selected.id);
          else                                this.deleteReaction(this.selected.idx);
          e.preventDefault();
        }
      };
      window.addEventListener('keydown', this._keyHandler);
    }

    _onPointerDown(e) {
      const handleEl = e.target.closest('.sg-handle-out');
      const nodeEl = e.target.closest('.sg-node');
      const edgeEl = e.target.closest('.sg-edge');
      const slotEl = !this.readOnly && edgeEl ? e.target.closest('[data-slot]') : null;
      if (!this.readOnly) this.svg.focus();

      this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this._pointers.size >= 2) {
        this.drag = null;
        this.edgeDraft = null;
        this.slotDrag = null;
        this.tap = null;
        this.pan = null;
        this.pinch = this._initPinchState();
        try { this.svg.setPointerCapture(e.pointerId); } catch (_) {}
        return;
      }

      if (handleEl && !this.readOnly) {
        // A compound's handle: a new arrow to a compound, or one more educt
        // when dropped on an arrow. The handle on a selected arrow: one
        // more product.
        e.preventDefault();
        const start = this._eventToWorld(e);
        this.edgeDraft = {
          fromId: handleEl.dataset.node || null,
          fromRx: handleEl.dataset.rx != null ? parseInt(handleEl.dataset.rx, 10) : null,
          line: svg('line', { class: 'sg-edge-draft', x1: start.x, y1: start.y, x2: start.x, y2: start.y })
        };
        this.viewport.appendChild(this.edgeDraft.line);
        this.svg.setPointerCapture(e.pointerId);
        return;
      }

      if (slotEl) {
        // A structure on an arrow: a click selects the reaction, a double
        // click opens it in Ketcher, dragging takes it off the arrow.
        e.preventDefault();
        const slot = slotEl.dataset.slot;
        this.slotDrag = {
          idx: parseInt(edgeEl.dataset.edgeIdx, 10), slot,
          el: edgeEl.querySelector(`svg.sg-edge-mol[data-slot="${slot}"]`) || slotEl,
          pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false
        };
        this.svg.setPointerCapture(e.pointerId);
        return;
      }

      if (nodeEl) {
        const id = nodeEl.dataset.node;
        const n = this._nodeById(id);
        if (this.readOnly) {
          // Tap reveals; a mouse drag pans a zoomed-in scheme. Touch keeps
          // its native scrolling, so no capture and no preventDefault.
          this.tap = {
            id, pointerId: e.pointerId, touch: e.pointerType === 'touch',
            startX: e.clientX, startY: e.clientY,
            startVX: this.viewX, startVY: this.viewY,
            moved: false
          };
          if (!this.tap.touch) { try { this.svg.setPointerCapture(e.pointerId); } catch (_) {} }
          return;
        }
        e.preventDefault();
        const w = this._eventToWorld(e);
        const deg = this._degreeOf(id);
        this.drag = {
          id, pointerId: e.pointerId,
          offsetX: w.x - n.x, offsetY: w.y - n.y,
          sx: e.clientX, sy: e.clientY, x0: n.x, y0: n.y,
          free: !deg.in && !deg.out,
          moved: false
        };
        this.svg.setPointerCapture(e.pointerId);
        return;
      }

      if (edgeEl) return;
      if (this.readOnly) return;
      e.preventDefault();
      this.pan = {
        pointerId: e.pointerId,
        startX: e.clientX, startY: e.clientY,
        startVX: this.viewX, startVY: this.viewY,
        moved: false
      };
      this.svg.setPointerCapture(e.pointerId);
    }

    _onPointerMove(e) {
      if (this._pointers.has(e.pointerId)) {
        this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      if (this.pinch && this._pointers.size >= 2) {
        this._applyPinch();
        return;
      }
      if (this.tap && e.pointerId === this.tap.pointerId) {
        const dx = e.clientX - this.tap.startX;
        const dy = e.clientY - this.tap.startY;
        if (Math.abs(dx) + Math.abs(dy) > 6) {
          this.tap.moved = true;
          if (!this.tap.touch) {
            this.viewX = this.tap.startVX + dx;
            this.viewY = this.tap.startVY + dy;
            this._applyView();
          }
        }
        return;
      }
      if (this.drag && e.pointerId === this.drag.pointerId) {
        const d = this.drag;
        const n = this._nodeById(d.id);
        if (!n) return;
        if (!d.moved) {
          if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) < 4) return;
          d.moved = true;
          d.auto = this._isAutoLayout();
          // a compound on no arrow yet can be dropped onto one
          if (d.free) this._zones = this._dropZones();
          // in a free layout the educts (products) of an equation move as one
          d.with = d.auto ? [] : this._lockedWith(d.id).map(id => this._nodeById(id)).filter(Boolean)
            .map(o => ({ n: o, x0: o.x, y0: o.y }));
          // … and snaps into the row / column of a compound it shares an arrow with
          const own = new Set(d.with.map(o => o.n.id).concat(d.id));
          const ends = x => [x.to, ...(x.from || [])];
          d.nb = d.auto ? [] : this.scheme.nodes.filter(o => !own.has(o.id) &&
            this.scheme.edges.some(x => ends(x).includes(o.id) && ends(x).includes(d.id)));
        }
        const w = this._eventToWorld(e);
        n.x = Math.round(w.x - d.offsetX);
        n.y = Math.round(w.y - d.offsetY);
        for (const k of ['x', 'y']) {
          let to = null;
          for (const o of d.nb || []) if (Math.abs(n[k] - o[k]) < SNAP && (to == null || Math.abs(n[k] - o[k]) < Math.abs(n[k] - to))) to = o[k];
          if (to != null) n[k] = to;
        }
        const g = this.container.querySelector(`[data-node="${cssEsc(d.id)}"]`);
        if (g) {
          g.setAttribute('transform', `translate(${n.x} ${n.y})`);
          // see-through while carried over the drop zones
          if (d.free) g.classList.add('sg-carried');
        }
        for (const o of d.with) {
          o.n.x = o.x0 + n.x - d.x0;
          o.n.y = o.y0 + n.y - d.y0;
          const og = this.container.querySelector(`[data-node="${cssEsc(o.n.id)}"]`);
          if (og) og.setAttribute('transform', `translate(${o.n.x} ${o.n.y})`);
        }
        if (this._zones) this._drawZones(this._zoneAt(w));
        // In a free layout the arrows follow the compound. The auto layout
        // keeps its plan: a compound is only carried across it.
        if (!d.auto && !d.free) this._drawEdges();
        return;
      }
      if (this.slotDrag && e.pointerId === this.slotDrag.pointerId) {
        const d = this.slotDrag;
        if (!d.moved) {
          if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) < 5) return;
          d.moved = true;
          this._zones = this._dropZones();
          d.ghost = this._ghostOf(d.el);
          d.el.style.opacity = '0.25';
        }
        const w = this._eventToWorld(e);
        this._moveGhost(d.ghost, w);
        this._drawZones(this._zoneAt(w));
        return;
      }
      if (this.edgeDraft) {
        const w = this._eventToWorld(e);
        this.edgeDraft.line.setAttribute('x2', w.x);
        this.edgeDraft.line.setAttribute('y2', w.y);
        this._markTarget(this._draftTarget(e, this.edgeDraft));
        return;
      }
      if (this.pan && e.pointerId === this.pan.pointerId) {
        const dx = e.clientX - this.pan.startX;
        const dy = e.clientY - this.pan.startY;
        if (Math.abs(dx) + Math.abs(dy) > 4) this.pan.moved = true;
        this.viewX = this.pan.startVX + dx;
        this.viewY = this.pan.startVY + dy;
        this._applyView();
      }
    }

    _onPointerUp(e) {
      this._pointers.delete(e.pointerId);
      if (this.pinch && this._pointers.size < 2) {
        this.pinch = null;
        try { this.svg.releasePointerCapture(e.pointerId); } catch (_) {}
        return;
      }
      if (this.tap && e.pointerId === this.tap.pointerId) {
        const wasMoved = this.tap.moved;
        const id = this.tap.id;
        this.tap = null;
        try { this.svg.releasePointerCapture(e.pointerId); } catch (_) {}
        if (!wasMoved && e.type === 'pointerup') {
          const n = this._nodeById(id);
          if (n) this.onNodeClick(n);
        }
        return;
      }
      if (this.drag && e.pointerId === this.drag.pointerId) {
        const d = this.drag;
        this.drag = null;
        try { this.svg.releasePointerCapture(e.pointerId); } catch (_) {}
        const zones = this._zones;
        this._zones = null;
        this._drawZones(null);
        if (d.moved) {
          this._lastNodeTap = null;
          const hit = e.type === 'pointerup' && zones ? this._zoneAt(this._eventToWorld(e), zones) : null;
          if (hit && this.attachNode(d.id, hit.idx, hit.zone)) return;
          if (d.auto) {
            // the auto layout decides where compounds sit
            const n = this._nodeById(d.id);
            if (n) { n.x = d.x0; n.y = d.y0; }
            this.refresh();
            this._hint(d.free
              ? 'Einen freien Knoten auf einen Pfeil ziehen (über / unter den Pfeil, an den Bogen) – oder über seinen ⇢-Griff verbinden.'
              : 'Die Anordnung macht das Auto-Layout. Zum freien Verschieben „✥ Frei“ in der Leiste wählen.');
          } else {
            this.scheme.layout = 'manual';
            this.refresh();
            this.onChange();
          }
          return;
        }
        /* select() rebuilds the node's SVG, so the browser's own dblclick
           never sees two clicks on the same element — detect the double
           click here instead. */
        const now = Date.now(), last = this._lastNodeTap;
        this._lastNodeTap = { id: d.id, t: now };
        if (last && last.id === d.id && now - last.t < 450) {
          this._lastNodeTap = null;
          const n = this._nodeById(d.id);
          if (n) this.onRequestStructEdit(n);
        } else {
          this.select('node', d.id);
        }
        return;
      }
      if (this.slotDrag && e.pointerId === this.slotDrag.pointerId) {
        const d = this.slotDrag;
        this.slotDrag = null;
        try { this.svg.releasePointerCapture(e.pointerId); } catch (_) {}
        const zones = this._zones;
        this._zones = null;
        this._drawZones(null);
        if (d.moved) {
          if (d.ghost) d.ghost.el.remove();
          d.el.style.opacity = '';
          this._eatClick();
          if (e.type !== 'pointerup') return;
          const w = this._eventToWorld(e);
          const hit = zones ? this._zoneAt(w, zones) : null;
          if (hit) this.moveStructure(d.idx, d.slot, hit);
          else this.detachStructure(d.idx, d.slot, w);
          return;
        }
        // not moved: the click selects the reaction; a second one opens Ketcher
        const now = Date.now(), last = this._lastSlotTap;
        this._lastSlotTap = { idx: d.idx, slot: d.slot, t: now };
        if (last && last.slot === d.slot && now - last.t < 450 &&
            this.reactionOf(last.idx) && this.reactionOf(last.idx).first === (this.reactionOf(d.idx) || {}).first) {
          this._lastSlotTap = null;
          this._eatClick();
          const edge = this.scheme.edges[d.idx];
          if (edge && this.onRequestEdgeStructEdit) this.onRequestEdgeStructEdit(edge, d.idx, d.slot);
        }
        return;
      }
      if (this.edgeDraft) {
        const d = this.edgeDraft;
        this.edgeDraft = null;
        try { this.svg.releasePointerCapture(e.pointerId); } catch (_) {}
        const t = e.type === 'pointerup' ? this._draftTarget(e, d) : null;
        this._markTarget(null);
        if (d.line.parentNode) d.line.parentNode.removeChild(d.line);
        if (!t) return;
        if (d.fromRx != null) {
          if (t.kind === 'node' && !this.addReactionProduct(d.fromRx, t.id)) this._hint('Diese Verbindung gehört schon zur Reaktion.');
        } else if (t.kind === 'node') {
          if (!this.createEdge(d.fromId, t.id)) this._hint('Diesen Pfeil gibt es schon.');
        } else if (!this.addReactionEduct(t.idx, d.fromId)) {
          this._hint('Diese Verbindung gehört schon zur Reaktion.');
        }
        return;
      }
      if (this.pan && e.pointerId === this.pan.pointerId) {
        const wasMoved = this.pan.moved;
        this.pan = null;
        if (!wasMoved) this.select(null);
        try { this.svg.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    }

    /* The click that ends a drag must not also select what is under it. */
    _eatClick() {
      this._clickEaten = true;
      setTimeout(() => { this._clickEaten = false; }, 0);
    }

    /* A bare wheel scrolls the page; Ctrl/Cmd + wheel zooms. */
    _onWheel(e) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      const newScale = Math.max(0.25, Math.min(2.5, this.scale * factor));
      const r = this.svg.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      this.viewX = cx - (cx - this.viewX) * (newScale / this.scale);
      this.viewY = cy - (cy - this.viewY) * (newScale / this.scale);
      this.scale = newScale;
      this._applyView();
      this._syncViewerHeight();
    }

    _onClick(e) {
      if (this.readOnly) return;
      if (this._clickEaten) { this._clickEaten = false; return; }
      if (this.drag || this.edgeDraft || this.pinch || this.slotDrag) return;
      const edgeEl = e.target.closest('.sg-edge');
      if (edgeEl) {
        e.stopPropagation();
        this.editEdgeText(parseInt(edgeEl.dataset.edgeIdx, 10));
      }
    }

    /* ─── Pinch (2-finger) zoom + pan for touch devices ─────── */

    _initPinchState() {
      const pts = [...this._pointers.values()];
      if (pts.length < 2) return null;
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      return {
        startDist: Math.max(1, Math.hypot(dx, dy)),
        startMidX: (pts[0].x + pts[1].x) / 2,
        startMidY: (pts[0].y + pts[1].y) / 2,
        startScale: this.scale,
        startViewX: this.viewX,
        startViewY: this.viewY
      };
    }

    _applyPinch() {
      if (!this.pinch) return;
      const pts = [...this._pointers.values()];
      if (pts.length < 2) return;
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      const curDist = Math.max(1, Math.hypot(dx, dy));
      const curMidX = (pts[0].x + pts[1].x) / 2;
      const curMidY = (pts[0].y + pts[1].y) / 2;
      const factor = curDist / this.pinch.startDist;
      const newScale = Math.max(0.25, Math.min(2.5, this.pinch.startScale * factor));
      const r = this.svg.getBoundingClientRect();
      const wx0 = (this.pinch.startMidX - r.left - this.pinch.startViewX) / this.pinch.startScale;
      const wy0 = (this.pinch.startMidY - r.top  - this.pinch.startViewY) / this.pinch.startScale;
      this.scale = newScale;
      this.viewX = (curMidX - r.left) - wx0 * newScale;
      this.viewY = (curMidY - r.top)  - wy0 * newScale;
      this._applyView();
      this._syncViewerHeight();
    }

    destroy() {
      window.removeEventListener('keydown', this._keyHandler);
      if (this._resizeObs) { try { this._resizeObs.disconnect(); } catch (_) {} this._resizeObs = null; }
      if (this._onWinResize) { window.removeEventListener('resize', this._onWinResize); this._onWinResize = null; }
      this._renderGen++;
      this.container.innerHTML = '';
    }
  }

  function r1(v) { return Math.round(v * 10) / 10; }
  function unionBox(a, b) {
    const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
    return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
  }

  /* Does segment a–b cross line l (not just touch it)? */
  function segCross(a, b, l) {
    const o3 = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
    const c = { x: l.x1, y: l.y1 }, d = { x: l.x2, y: l.y2 };
    return o3(a, b, c) * o3(a, b, d) < 0 && o3(c, d, a) * o3(c, d, b) < 0;
  }

  /* Does a (diagonal) line segment cross a rectangle? Sampled — labels
     are coarse boxes, so a handful of points along the line is plenty. */
  function segHitsRect(l, b) {
    for (let i = 0; i <= 12; i++) {
      const x = l.x1 + (l.x2 - l.x1) * i / 12, y = l.y1 + (l.y2 - l.y1) * i / 12;
      if (x > b.x + 1 && x < b.x + b.w - 1 && y > b.y + 1 && y < b.y + b.h - 1) return true;
    }
    return false;
  }

  /* "D^-" / "H_2" for an HTML tile. */
  function chemHtml(str) { return CT.html(str); }

  /* A node caption split into its lines (a real line break, or the
     two characters backslash-n some data carries). */
  function captionLines(n) {
    return n && n.caption ? String(n.caption).split(/\r?\n|\\n/).map(t => t.trim()).filter(Boolean) : [];
  }

  function cssEsc(s) {
    return String(s || '').replace(/(["\\\.\#\:\[\]\(\)\,\>\+\~\*\=\^\$\|\!\?])/g, '\\$1');
  }

  SchemeGraphEditor.planLayout = planLayout;
  SchemeGraphEditor.bestPlan = bestPlan;
  SchemeGraphEditor.planCandidates = planCandidates;
  window.SchemeGraphEditor = SchemeGraphEditor;
})();
