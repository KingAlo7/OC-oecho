/**
 * SchemeGraphEditor — drag-and-drop SVG editor for synthesis schemes.
 *
 * Data model (preserves admin's existing scheme format):
 *   scheme = {
 *     nodes: [{ id, label, name, smiles, mol, given, explanation,
 *               note, related_reaction_id, x?, y? }],
 *     edges: [{ from: [nodeId...], to: nodeId, reagent_above, reagent_below }]
 *   }
 *
 * UI:
 *   - SVG canvas with pan (drag empty area) and zoom (Ctrl + wheel)
 *   - Drag a node by its body to reposition
 *   - Drag from a node's "→" handle (right edge) onto another node to
 *     create an edge; release outside any node to cancel
 *   - Click a node or edge to select it → fires onSelect callback
 *   - Selected node/edge highlighted in red; press Delete to remove
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
 *   - co-reactants sit above the arrow and join it, co-products below;
 *     side reactions fork off the shaft or leave down / up / back
 *   - arrows that don't fit the grid are routed around structures and
 *     away from existing arrows
 *   - reagent text is placed last and avoids structures, other text and
 *     other arrows, always on its own arrow
 * With "layout": "manual" (a node was dragged in the editor) the older
 * free routing is used: split arrows share a stub, several sources meet
 * in a junction.
 *
 * Callbacks:
 *   onChange(), onSelectNode(node|null), onSelectEdge(edge|null, idx),
 *   onRequestStructEdit(node), onNodeClick(node)
 *
 * Public methods:
 *   refresh(), refreshNode(id), autoLayout(), addNode(opts), focusNode(id),
 *   setRevealed(id,b), resetReveals(), countHidden(), reflow(force),
 *   fitToContent(), destroy()
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
  const MIN_FIT        = 0.72;  // don't pick a grid that needs shrinking below this    // px between compound columns with no arrow between them

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
      const atoms = chunk.split(/(?<=[;,])\s+|\s+\/\s+|\s+(?=dann\s)|\s+(?=\d\.\s)|\s+(?=\d\)\s)/)
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

  /* Full metrics for one edge's above/below labels. */
  function edgeLabelMetrics(edge) {
    const above = wrapLabel(edge && edge.reagent_above, LABEL_FONT_ABOVE);
    const below = wrapLabel(edge && edge.reagent_below, LABEL_FONT_BELOW);
    const wa = Math.max(0, ...above.map(l => measureText(plainChemText(l), LABEL_FONT_ABOVE)));
    const wb = Math.max(0, ...below.map(l => measureText(plainChemText(l), LABEL_FONT_BELOW)));
    const w  = Math.max(wa, wb);
    return {
      above, below, edge,
      width: w,
      blockH: (above.length + below.length) * LABEL_LINE_H,
      shaft: Math.max(ARROW_MIN, Math.min(ARROW_MAX, Math.ceil(w) + LABEL_PAD_X * 2))
    };
  }

  function sameLabels(a, b) {
    return (a.reagent_above || '').trim() === (b.reagent_above || '').trim() &&
           (a.reagent_below || '').trim() === (b.reagent_below || '').trim();
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

  /* ── Reaction layout planner ─────────────────────────────────────
     Edges are grouped into reactions (edges with the same several
     sources and the same reagents are ONE reaction "A + W → B + X").
     Every reaction gets a main reactant, a main product, co-reactants
     and co-products, and is laid out the way exam sheets draw it:
       - the main chain runs straight on; at the width limit it turns
         down and continues in the opposite direction
       - a co-reactant sits above the arrow and joins it; a co-product
         sits below and leaves it; three or more reactants stack in a
         column and meet in a bracket
       - a side reaction forks off the shaft (shared stub, bus, own
         arrowhead), or leaves downwards / upwards / backwards —
         whichever is free and cheapest
     Positions are grid cells (h, r) in half-column units: compounds of
     the chain on even h, co-reactants/co-products in the odd arrow gaps.
     Returns { pos: Map(id → {h, r, jdir}), items: [...] }. */
  function planLayout(nodes, edges, cols) {
    const ids = new Set(nodes.map(n => n.id));
    const order = new Map(nodes.map((n, i) => [n.id, i]));
    const trim = s => String(s == null ? '' : s).trim();

    const rxs = [];
    const multi = new Map();
    edges.forEach((e, i) => {
      if (!ids.has(e.to)) return;
      const from = [...new Set((e.from || []).filter(id => ids.has(id) && id !== e.to))];
      if (!from.length) return;
      let rx = null;
      const lab = trim(e.reagent_above) + '#' + trim(e.reagent_below);
      if (from.length > 1 || lab !== '#') {
        const key = [...from].sort().join('|') + '#' + lab;
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

    /* ── grid state ── */
    const cell = new Map();
    const pos = new Map();
    const laid = new Set();
    const items = [];
    const K = (h, r) => h + ',' + r;
    const odd = h => (h & 1) === 1;
    let minH = Infinity, maxH = -Infinity, maxR = -Infinity;
    const span = 2 * (Math.max(2, cols) - 1);
    const inSpan = h => !pos.size || Math.max(maxH, h) - Math.min(minH, h) <= span;
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

    /* Assign co-nodes to slots; returns { co, extra } or null if a
       required cell is taken by another assignment. */
    const slotCo = (rx, slots, inPref, outPref) => {
      const { ins, outs } = coOf(rx);
      const used = new Set(), co = [], extra = [];
      let wide = 0;
      const take = (id, dir, prefs) => {
        if (pos.has(id)) { extra.push({ id, dir }); return; }
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

    /* Straight horizontal reaction. `fromProd` anchors on an already
       placed product (used when laying a feed chain backwards). */
    function tryH(rx, dx, fromProd) {
      let mh, mr, th, tr;
      if (fromProd) { const p = pos.get(rx.prod); th = p.h; tr = p.r; mh = th - 2 * dx; mr = tr; if (!canPut(mh, mr)) return null; }
      else { const m = pos.get(rx.main); mh = m.h; mr = m.r; th = mh + 2 * dx; tr = mr; if (!canPut(th, tr)) return null; }
      const g = mh + dx;
      if (!passOk(g, mr)) return null;
      const { ins } = coOf(rx);
      if (ins.filter(id => !pos.has(id)).length >= 2) return tryStack(rx, dx, fromProd);
      const s = slotCo(rx, { up: [g, mr - 1], dn: [g, mr + 1] }, ['up', 'dn'], ['dn', 'up']);
      return { type: 'h', rx, dx, gap: g, row: mr, mh, mr, th, tr, fromProd, ...s,
               cost: s.extra.filter(x => !pos.has(x.id)).length * 3 + s.wide };
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
    function tryV(rx, dy, k, fromProd) {
      const { ins, outs } = coOf(rx);
      const needJ = ins.concat(outs).some(id => !pos.has(id));
      if (needJ && k < 2) return null;
      let mh, mr, tr;
      if (fromProd) { const p = pos.get(rx.prod); mh = p.h; tr = p.r; mr = tr - dy * k; if (!canPut(mh, mr)) return null; }
      else { const m = pos.get(rx.main); mh = m.h; mr = m.r; tr = mr + dy * k; if (!canPut(mh, tr)) return null; }
      for (let i = 1; i < k; i++) if (!passOk(mh, mr + dy * i)) return null;
      const jRow = tr - dy;
      const mk = (h, r) => [h, r, [[h + (h < mh ? 1 : -1), r]]];
      let s = slotCo(rx, { l: mk(mh - 2, jRow), r: mk(mh + 2, jRow) }, ['l', 'r'], ['r', 'l']);
      const want = ins.concat(outs).filter(id => !pos.has(id)).length;
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
      return { type: 'v', rx, dy, k, jRow, mh, mr, th: mh, tr, fromProd, ...s,
               cost: s.extra.filter(x => !pos.has(x.id)).length * 3 + s.wide };
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

    function commit(it) {
      const rx = it.rx;
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
    function afterCommit(it, flow) {
      for (const c of it.co) if (c.dir === 'in') layUpstream(c.id, flow);
      for (const c of it.co) if (c.dir === 'out' || c.slot === 'stack') pending.push([c.id, flow]);
    }

    function placeBranch(rx, flow) {
      if (laid.has(rx.idx) || pos.has(rx.prod)) return;
      const m = pos.get(rx.main);
      const cands = [];
      // Stay close to compounds this branch leads into, and never on the
      // far side of the source's own row from them.
      const pull = it => {
        let c = 0;
        for (const nx of consBy.get(rx.prod)) {
          const P = pos.get(nx.prod);
          if (!P || nx.prod === rx.main) continue;
          c += Math.abs(it.tr - P.r) * 0.6 + Math.abs(it.th - P.h) * 0.15;
          if ((it.tr - m.r) * (P.r - m.r) < 0) c += 2;
          // Compounds in the way of the later arrow (along the row, then up/down).
          const h0 = Math.min(it.th, P.h), h1 = Math.max(it.th, P.h);
          for (let h = h0 + 1; h < h1; h++) if (cell.get(K(h, it.tr)) === 'N') c += 1.5;
          const r0 = Math.min(it.tr, P.r), r1 = Math.max(it.tr, P.r);
          for (let r = r0 + 1; r < r1; r++) if (cell.get(K(P.h, r)) === 'N') c += 1.5;
        }
        return c;
      };
      const add = (c, f, it) => { if (it) cands.push([c + it.cost + pull(it), f, it]); };
      const fwd = inSpan(m.h + 2 * flow), back = inSpan(m.h - 2 * flow);
      if (fwd) add(0, flow, tryH(rx, flow));
      for (let k = 1; k <= 6; k++) {
        if (fwd) {
          add(1 + (k - 1) * 0.9, flow, tryF(rx, flow, 1, k));
          add(1.15 + (k - 1) * 0.9, flow, tryF(rx, flow, -1, k));
        }
        add(1.3 + (k - 1), flow, tryV(rx, 1, k));
        add(1.5 + (k - 1), flow, tryV(rx, -1, k));
      }
      if (back) {
        add(1.7, -flow, tryH(rx, -flow));
        for (let k = 1; k <= 3; k++) {
          add(2.2 + (k - 1) * 0.9, -flow, tryF(rx, -flow, 1, k));
          add(2.3 + (k - 1) * 0.9, -flow, tryF(rx, -flow, -1, k));
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
        const rx = pickMain(cur);
        if (!rx) break;
        let it = inSpan(pos.get(cur).h + 2 * flow) ? tryH(rx, flow) : null;
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
        for (const rx of open(id)) if (rx !== turn) placeBranch(rx, flow);
        layUpstream(id, flow);
      }
      while (pending.length) {
        const [id, f] = pending.shift();
        for (const rx of open(id)) placeBranch(rx, f);
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
    }
    const h0 = Math.min(...[...pos.values()].map(p => p.h));
    const hShift = h0 - (odd(h0) ? 1 : 0);
    for (const p of pos.values()) p.h -= hShift;
    for (const it of items) { it.mh -= hShift; it.th -= hShift; if (it.gap != null) it.gap -= hShift; }
    return { pos, items, rows: used.length, laidEdges: new Set(items.flatMap(it => it.rx.edges)) };
  }

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
      this._renderGen = 0;
      this.revealedIds = new Set(opts.revealedNodeIds || []);
      this._build();
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
            <button class="sg-btn" data-act="layout">Auto-Layout</button>
            <button class="sg-btn" data-act="fit">↔ Anpassen</button>
            <button class="sg-btn" data-act="zoomin" title="Zoom +">＋</button>
            <button class="sg-btn" data-act="zoomout" title="Zoom -">−</button>
            <span class="sg-zoom-label">100 %</span>
            <span class="sg-hint">Knoten ziehen · von ⇢-Griff zu Knoten ziehen = Pfeil · Klick = auswählen · G = vorgegeben · Entf = löschen · Strg + Mausrad = Zoom</span>
          </div>` + canvas;
      }
      this.svg = this.container.querySelector('.sg-canvas');
      this.viewport = this.svg.querySelector('.sg-viewport');
      this.zoomLabel = this.container.querySelector('.sg-zoom-label');
      this.toolbar = this.container.querySelector('.sg-toolbar');
    }

    /* ─── Layout ──────────────────────────────────────────────── */

    _isAutoLayout() {
      return this.scheme.layout !== 'manual';
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
      const plan = planLayout(nodes, E, cols);
      const { pos, items } = plan;

      const forkKeys = new Set(items.filter(it => it.type === 'fork').map(it => it.rx.main + '|' + it.gap));
      const hasJ = it => it.type === 'fork' || it.type === 'stack' || it.co.length > 0 || it.extra.length > 0 ||
                         forkKeys.has(it.rx.main + '|' + it.gap);
      let maxHx = 0;
      for (const p of pos.values()) maxHx = Math.max(maxHx, p.h);
      const gapW = new Map();
      for (const it of items) {
        if (it.type !== 'h' && it.type !== 'fork' && it.type !== 'stack') continue;
        const m = edgeLabelMetrics(E[it.rx.edges[0]]);
        const w = m.shaft + (hasJ(it) ? JUNCTION_OFF + 6 : 0);
        gapW.set(it.gap, Math.max(gapW.get(it.gap) || 0, w));
      }
      const colX = [];
      let x = 0;
      for (let h = 0; h <= maxHx + 1; h++) {
        colX[h] = x;
        if (h % 2 === 0) x += NODE_W;
        else {
          if (!gapW.has(h)) gapW.set(h, GAP_EMPTY);
          x += gapW.get(h);
        }
      }
      const jOff = g => Math.min(JUNCTION_OFF, (g % 2 ? gapW.get(g) : NODE_W) / 2);
      const jx = (g, dir) => {
        const w = g % 2 ? gapW.get(g) : NODE_W;
        return dir < 0 ? colX[g] + w - jOff(g) : colX[g] + jOff(g);
      };

      const nRows = plan.rows;
      const rowGap = new Array(Math.max(0, nRows)).fill(STACK_GAP + 8);
      for (const it of items) {
        if (it.type !== 'v') continue;
        const m = edgeLabelMetrics(E[it.rx.edges[0]]);
        if (!m.blockH) continue;
        const gi = it.dy > 0 ? it.tr - 1 : it.tr;
        if (gi >= 0 && gi < rowGap.length) rowGap[gi] = Math.max(rowGap[gi], m.blockH + 26);
      }
      const rowY = [];
      let y = 0;
      for (let r = 0; r < nRows; r++) { rowY[r] = y; y += NODE_H + rowGap[r]; }

      const xOf = p => p.h % 2 ? jx(p.h, p.jdir) - NODE_W / 2 : colX[p.h];
      if (opts.dry) {
        const xs = [...pos.values()].map(xOf);
        return Math.max(...xs) + NODE_W - Math.min(...xs);
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
      }
      plan.sig = this._planSig();
      this._plan = plan;
      this.scheme.layout = 'auto';
      this._layoutCols = cols;
    }

    /* The widest grid that still reads at a comfortable zoom. */
    _bestCols() {
      const avail = ((this.svg && this.svg.clientWidth) || this.container.clientWidth || 0) - 30;
      if (avail <= 0) return 4;
      for (let c = 6; c > 2; c--) {
        if (this.autoLayout({ columns: c, dry: true }) * MIN_FIT <= avail) return c;
      }
      return 2;
    }

    /* Anything that changes grouping or indices invalidates the plan. */
    _planSig() {
      return JSON.stringify([
        this.scheme.nodes.map(n => n.id),
        this.scheme.edges.map(e => [e.from, e.to, (e.reagent_above || '').trim(), (e.reagent_below || '').trim()])
      ]);
    }

    /* ─── Render ──────────────────────────────────────────────── */

    refresh() {
      while (this.viewport.firstChild) this.viewport.removeChild(this.viewport.firstChild);
      this._applyView();
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
        for (const n of this.scheme.nodes) {
          if (this.readOnly && !this._isVisible(n)) { this._mb.delete(n.id); continue; }
          const host = this.container.querySelector(`[data-struct-host="${cssEsc(n.id)}"]`);
          if (!host) continue;
          host.innerHTML = '';
          if (!(n.mol || n.smiles)) {
            host.innerHTML = '<div class="sg-ph">(leer)</div>';
            continue;
          }
          try {
            const o = this.readOnly
              ? { width: V_FO_W, height: V_FO_H, autoCrop: true, autoCropMargin: 2 }
              : { width: NODE_W - 24, height: NODE_H - 60 };
            if (n.alias) o.alias = n.alias;
            const el = n.mol ? window.MolRenderer.drawMol(n.mol, host, o)
                             : window.MolRenderer.drawSmiles(n.smiles, host, o);
            if (this.readOnly && el && el.getAttribute) {
              const w = Math.min(V_FO_W, parseFloat(el.getAttribute('width')) || PH_SIZE);
              const h = Math.min(V_FO_H, parseFloat(el.getAttribute('height')) || PH_SIZE);
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
        class: 'sg-node-bg', x: 0, y: 0, width: NODE_W, height: NODE_H, rx: NODE_RX, ry: NODE_RX
      }));

      const fo = svg('foreignObject', { x: V_FO_X, y: V_FO_Y, width: V_FO_W, height: V_FO_H });
      const div = document.createElement('div');
      div.className = 'sg-struct-host';
      div.setAttribute('data-struct-host', n.id);
      div.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;';
      const letter = n.label != null ? String(n.label) : String(n.id || '');
      if (this._isHidden(n)) {
        const t = this._tileSize(n);
        div.innerHTML = `<div class="sg-q" style="width:${t.w}px;height:${t.h}px;font-size:${t.fs}px">${chemHtml(letter.trim() || '?')}</div>`;
      } else if (!(n.mol || n.smiles)) {
        div.innerHTML = '<div class="sg-ph">(leer)</div>';
      }
      fo.appendChild(div);
      g.appendChild(fo);

      // The letter goes under the structure once it is shown; while the
      // compound is hidden the tile itself carries the letter.
      if (!this._isHidden(n) && letter.trim()) {
        const label = svg('text', { class: 'sg-node-label', x: NODE_W / 2, 'text-anchor': 'middle' });
        setChemText(label, letter);
        g.appendChild(label);
      }

      if (n.name && !this._isHidden(n)) {
        const name = svg('text', { class: 'sg-node-name', x: NODE_W / 2, 'text-anchor': 'middle' });
        name.textContent = n.name.length > 30 ? n.name.slice(0, 28) + '…' : n.name;
        g.appendChild(name);
      }
      // A caption is part of the Angabe (e.g. a sum formula printed under
      // an unknown compound), so it shows even while the node is hidden.
      if (n.caption) {
        const cap = svg('text', { class: 'sg-node-caption', x: NODE_W / 2, 'text-anchor': 'middle' });
        setChemText(cap, n.caption);
        g.appendChild(cap);
      }

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
      const w = Math.max(PH_SIZE, Math.min(V_FO_W, Math.ceil(measureText(txt, `bold ${fs}px 'Segoe UI', sans-serif`)) + 18));
      return { w, h: PH_SIZE, fs };
    }
    _footprint(n) {
      if (this._isHidden(n)) { const t = this._tileSize(n); return { w: t.w, h: t.h }; }
      return this._mb.get(n.id) || { w: PH_SIZE, h: PH_SIZE };
    }
    _textBlockH(n) {
      const hidden = this._isHidden(n);
      const hasLabel = !hidden && String(n.label != null ? n.label : n.id || '').trim();
      return (hasLabel ? V_LABEL_H : 2) + (n.name && !hidden ? V_NAME_H : 0) + (n.caption ? V_NAME_H + 2 : 0);
    }

    _placeNodeText(n, g) {
      g = g || this.container.querySelector(`[data-node="${cssEsc(n.id)}"]`);
      if (!g) return;
      const m = this._footprint(n);
      const bottom = V_CY + m.h / 2;
      const label = g.querySelector('.sg-node-label');
      const name = g.querySelector('.sg-node-name');
      let yy = bottom + (label ? 13 : 0);
      if (label) label.setAttribute('y', yy);
      if (name) { yy += V_NAME_H; name.setAttribute('y', yy); }
      const cap = g.querySelector('.sg-node-caption');
      if (cap) cap.setAttribute('y', yy + V_NAME_H + 1);
      const ib = g.querySelector('.sg-info-badge');
      if (ib) {
        const bx = Math.min(NODE_W - 9, NODE_W / 2 + m.w / 2 + 4);
        const by = Math.max(9, V_CY - m.h / 2 - 2);
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
        class: 'sg-node-bg', x: 0, y: 0, width: NODE_W, height: NODE_H, rx: NODE_RX, ry: NODE_RX
      }));
      const fo = svg('foreignObject', { x: 12, y: 8, width: NODE_W - 24, height: NODE_H - 60 });
      const div = document.createElement('div');
      div.className = 'sg-struct-host';
      div.setAttribute('data-struct-host', n.id);
      div.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;border-radius:4px;';
      if (!(n.mol || n.smiles)) div.innerHTML = '<div class="sg-ph">(leer)</div>';
      fo.appendChild(div);
      g.appendChild(fo);

      const labelText = svg('text', { class: 'sg-node-label', x: 12, y: NODE_H - 38 });
      labelText.textContent = n.label || n.id || '?';
      g.appendChild(labelText);
      if (n.caption) {
        const capText = svg('text', { class: 'sg-node-name', x: NODE_W - 12, y: NODE_H - 38, 'text-anchor': 'end' });
        setChemText(capText, n.caption);
        g.appendChild(capText);
      }
      if (n.name) {
        const nameText = svg('text', { class: 'sg-node-name', x: 12, y: NODE_H - 20 });
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
        cx: NODE_W, cy: NODE_H / 2, r: HANDLE_R,
        'data-handle': 'out', 'data-node': n.id
      }));
      const deg = this._degreeOf(n.id);
      if (deg.in || deg.out) {
        const badge = svg('text', { class: 'sg-node-deg', x: NODE_W - 6, y: 14, 'text-anchor': 'end' });
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
        return { id: n.id, l: n.x, r: n.x + NODE_W, t: n.y, b: n.y + NODE_H,
                 cx: n.x + NODE_W / 2, cy: n.y + NODE_H / 2 };
      }
      const m = this._footprint(n);
      const cx = n.x + NODE_W / 2;
      const cy = n.y + V_CY;
      return {
        id: n.id,
        l: cx - m.w / 2 - V_GAP,
        r: cx + m.w / 2 + V_GAP,
        t: cy - m.h / 2 - V_GAP,
        b: cy + m.h / 2 + this._textBlockH(n) + 2,
        cx, cy
      };
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
      const horiz = Math.abs(dx) * NODE_H >= Math.abs(dy) * NODE_W;
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

      const usePlan = this._plan && this._isAutoLayout() && this._plan.sig === this._planSig();
      const planned = usePlan ? this._drawPlan(layer) : new Set();
      const valid = (e, i) => !planned.has(i) && (e.from || []).length === 1 && this._nodeById(e.from[0]) && this._nodeById(e.to);

      // 1. Split arrows: one source, several targets on the same side.
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
    }

    /* Draw the reactions exactly as planned. Returns the edge indices
       it drew; everything else falls back to free routing. */
    _drawPlan(layer) {
      const E = this.scheme.edges;
      const drawn = new Set();
      for (const it of this._plan.items) {
        const mainN = this._nodeById(it.rx.main), prodN = this._nodeById(it.rx.prod);
        if (!mainN || !prodN) continue;
        const e = E[it.rx.edges[0]];
        const A = this._box(mainN), B = this._box(prodN);
        const g = this._edgeGroup(it.rx.edges[0], it.rx.srcs.join(','));
        const skip = [it.rx.main, it.rx.prod];
        const seats = [];
        let J = null;
        const joins = [];

        if (it.type === 'h' || it.type === 'fork' || it.type === 'stack') {
          const side = it.dx > 0 ? 'R' : 'L';
          const p = this._exit(A, side), q = this._entry(B, side);
          if (it.hasJ) J = { x: it.jx, y: p.y };
          if (it.type === 'fork') {
            const pts = [p, J, { x: J.x, y: q.y }, q];
            this._addPath(g, this._pathD(pts), it.rx.edges[0], true);
            seats.push(...this._segsOf(pts.slice(2)), ...this._segsOf(pts.slice(1, 3)));
            joins.push(J);
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
          for (const c of it.co) {
            const cn = this._nodeById(c.id);
            if (!cn) continue;
            const C = this._box(cn);
            let pts;
            if (c.slot === 'stack') {
              const s = this._exit(C, side);
              pts = [s, { x: J.x, y: s.y }, J];
            } else {
              const above = C.cy < J.y;
              pts = [{ x: J.x, y: above ? C.b : C.t }, J];
              if (Math.abs(C.cx - J.x) > 1) pts.unshift({ x: C.cx, y: pts[0].y });
            }
            if (c.dir === 'out') pts.reverse();
            this._addPath(g, this._pathD(pts), it.rx.edges[0], c.dir === 'out');
          }
          if (J && it.type !== 'fork' && (it.co.length || it.extra.length)) joins.push(J);
        } else if (it.type === 'v') {
          const side = it.dy > 0 ? 'D' : 'U';
          const p = this._exit(A, side), q = this._entry(B, side);
          const pts = Math.abs(p.x - q.x) < 1 ? [p, q]
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
          if (last) seats.push({ x1: last.x, y1: last.y, x2: q.x, y2: q.y, dir: 'v', len: Math.abs(q.y - last.y) });
          seats.push(...this._segsOf(pts));
        } else {
          // 'wrap' / 'free': placed wherever there was room.
          const side = it.type === 'wrap' ? 'D' : this._side(A, B);
          const p = this._exit(A, side), q = this._entry(B, side);
          const pts = this._route(p, side, q, side, skip);
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
          if (!xn || !J) continue;
          const X = this._box(xn);
          const P = { cx: J.x, cy: J.y, point: true };
          const xs = [x.id, it.rx.main, it.rx.prod];
          const pts = (x.dir === 'out' ? this._bestRoute(P, X, xs, null) : this._bestRoute(X, P, xs, null)).pts;
          this._addPath(g, this._pathD(pts), it.rx.edges[0], x.dir === 'out');
          joins.push(J);
        }
        for (const j of joins) g.appendChild(svg('circle', { class: 'sg-junction', cx: r1(j.x), cy: r1(j.y), r: 1.6 }));
        this._placeLabel(seats, e, g);
        layer.appendChild(g);
        it.rx.edges.forEach(i => drawn.add(i));
      }
      return drawn;
    }

    _edgeGroup(idx, fromId) {
      return svg('g', {
        class: 'sg-edge' + (this._isSelected('edge', idx) ? ' selected' : ''),
        'data-edge-idx': idx, 'data-edge-from': fromId
      });
    }

    _addPath(g, d, idx, head, extraCls) {
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

    _pathD(pts) {
      return pts.map((p, k) => (k ? 'L ' : 'M ') + r1(p.x) + ' ' + r1(p.y)).join(' ');
    }

    /* The straight pieces of a polyline, longest first, as label seats. */
    _segsOf(pts) {
      const out = [];
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1], b = pts[k];
        const dir = Math.abs(a.y - b.y) < 0.5 ? 'h' : 'v';
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

    /* A vertical run blocked by a compound stacked in the same column
       leaves sideways, drops in the gap next to the stack and enters the
       target from above/below. */
    _detours(s, t, side, pts, skip) {
      if (isH(side) || !this._hits(pts, skip)) return pts;
      const down = side === 'D';
      const q = this._entry(t, side);
      const stack = (this._obstacles || []).filter(o => !skip.includes(o.id) &&
        o.x < s.r && o.x + o.w > s.l);
      const right = Math.max(s.r, ...stack.map(o => o.x + o.w)) + 14;
      const left  = Math.min(s.l, ...stack.map(o => o.x)) - 14;
      const yEnd = down ? q.y - 16 : q.y + 16;
      const opts = [
        [{ x: s.r, y: s.cy }, { x: right, y: s.cy }, { x: right, y: yEnd }, { x: q.x, y: yEnd }, q],
        [{ x: s.l, y: s.cy }, { x: left, y: s.cy }, { x: left, y: yEnd }, { x: q.x, y: yEnd }, q]
      ];
      // Prefer the side facing the target.
      if (t.cx < s.cx) opts.reverse();
      for (const o of opts) if (!this._hits(o, skip)) return o;
      return pts;
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
      const okX1 = (x) => qs == null || !isH(qs) || (q.x - x) * sgn(qs) >= 8;
      const okY1 = (y) => qs == null || isH(qs) || (q.y - y) * sgn(qs) >= 8;
      const tries = [];
      if (Math.abs(p.y - q.y) < 1 && hS && hE) tries.push([p, q]);
      if (Math.abs(p.x - q.x) < 1 && vS && vE) tries.push([p, q]);
      if (hS && hE) for (const x of X) if (okX0(x) && okX1(x)) tries.push([p, { x, y: p.y }, { x, y: q.y }, q]);
      if (vS && vE) for (const y of Y) if (okY0(y) && okY1(y)) tries.push([p, { x: p.x, y }, { x: q.x, y }, q]);
      if (hS && vE && okX0(q.x) && okY1(p.y)) tries.push([p, { x: q.x, y: p.y }, q]);
      if (vS && hE && okY0(q.y) && okX1(p.x)) tries.push([p, { x: p.x, y: q.y }, q]);
      const x1 = ps && isH(ps) ? p.x + sgn(ps) * 14 : p.x;
      const y1 = ps && !isH(ps) ? p.y + sgn(ps) * 14 : p.y;
      const x2 = qs && isH(qs) ? q.x - sgn(qs) * 14 : q.x;
      const y2 = qs && !isH(qs) ? q.y - sgn(qs) * 14 : q.y;
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
      const labelled = m && (m.above.length || m.below.length);
      // Running on top of an existing line reads as one arrow: avoid.
      const onTop = (a, b) => (this._lines || []).some(l => {
        if (Math.abs(a.y - b.y) < 0.5) {
          return Math.abs(l.y1 - l.y2) < 0.5 && Math.abs(l.y1 - a.y) < 3 &&
            Math.min(Math.max(l.x1, l.x2), Math.max(a.x, b.x)) - Math.max(Math.min(l.x1, l.x2), Math.min(a.x, b.x)) > 2;
        }
        return Math.abs(l.x1 - l.x2) < 0.5 && Math.abs(l.x1 - a.x) < 3 &&
          Math.min(Math.max(l.y1, l.y2), Math.max(a.y, b.y)) - Math.max(Math.min(l.y1, l.y2), Math.min(a.y, b.y)) > 2;
      });
      let best = null;
      for (const [ps, qs, bias] of opts) {
        const p = ps ? this._exit(s, ps) : { x: s.cx, y: s.cy };
        const q = qs ? this._entry(t, qs) : { x: t.cx, y: t.cy };
        for (const pts of this._route(p, ps, q, qs, skip, m ? m.blockH : 0, true)) {
          let score = bias + this._hits(pts, skip) * 1000 + (pts.length - 2) * 25;
          if (labelled) score += Math.min(800, this._pickSeat(this._segsOf(pts), m.edge, true) * 0.3);
          let len = 0, longest = 0;
          for (let k = 1; k < pts.length; k++) {
            const d = Math.abs(pts[k].x - pts[k - 1].x) + Math.abs(pts[k].y - pts[k - 1].y);
            len += d;
            if (Math.abs(pts[k].y - pts[k - 1].y) < 0.5) longest = Math.max(longest, d);
            if (onTop(pts[k - 1], pts[k])) score += 200;
          }
          score += len * 0.05;
          if (labelled && longest < m.width + 12) score += 40;
          if (!best || score < best.score) best = { pts, score };
        }
      }
      return best;
    }

    /* One source, one target. */
    _drawSingle(layer, idx, fromId) {
      const e = this.scheme.edges[idx];
      const s = this._box(this._nodeById(fromId));
      const t = this._box(this._nodeById(e.to));
      if (this._plan && this._isAutoLayout()) {
        const b = this._bestRoute(s, t, [fromId, e.to], edgeLabelMetrics(e));
        const g = this._edgeGroup(idx, fromId);
        this._addPath(g, this._pathD(b.pts), idx, true);
        this._placeLabel(this._segsOf(b.pts), e, g);
        layer.appendChild(g);
        return;
      }
      const side = this._side(s, t);
      const p = this._exit(s, side);
      const q = this._entry(t, side);
      let pts;
      if (isH(side)) {
        if (Math.abs(p.y - q.y) < 1) pts = [p, { x: q.x, y: p.y }];
        else {
          const mx = (p.x + q.x) / 2;
          pts = [p, { x: mx, y: p.y }, { x: mx, y: q.y }, q];
        }
      } else {
        if (Math.abs(p.x - q.x) < 1) pts = [p, { x: p.x, y: q.y }];
        else {
          const my = (p.y + q.y) / 2;
          pts = [p, { x: p.x, y: my }, { x: q.x, y: my }, q];
        }
      }
      const skip = [fromId, e.to];
      if (this._hits(pts, skip)) pts = this._route(p, side, q, side, skip);
      pts = this._detours(s, t, side, pts, skip);
      const g = this._edgeGroup(idx, fromId);
      this._addPath(g, this._pathD(pts), idx, true);
      this._placeLabel(this._segsOf(pts), e, g);
      layer.appendChild(g);
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
      const m0 = edgeLabelMetrics(E[idxs[0]]);
      const targets = idxs.map(i => this._box(this._nodeById(E[i].to)));

      const room = Math.min(...targets.map(t => {
        const q = this._entry(t, side);
        return isH(side) ? Math.abs(q.x - p.x) : Math.abs(q.y - p.y);
      }));
      let stub = JUNCTION_STUB;
      if (shared && (m0.above.length || m0.below.length)) {
        stub = Math.max(stub, Math.min(room - 14, isH(side) ? m0.shaft : m0.blockH + 16));
      }
      stub = Math.max(8, Math.min(stub, room - 12));
      const J = { x: p.x + dx * stub, y: p.y + dy * stub };

      const trunk = this._edgeGroup(idxs[0], fromId);
      this._addPath(trunk, this._pathD([p, J]), idxs[0], false);
      layer.appendChild(trunk);

      const branchPts = idxs.map((i, k) => {
        const q = this._entry(targets[k], side);
        const skip = [fromId, E[i].to];
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
      const m = edgeLabelMetrics(e);

      const room = Math.min(...srcs.map(s => {
        const p = this._exit(s, side);
        return isH(side) ? Math.abs(q.x - p.x) : Math.abs(q.y - p.y);
      }));
      let trunkLen = isH(side) ? m.shaft : Math.max(30, m.blockH + 16);
      trunkLen = Math.max(18, Math.min(trunkLen, room - JUNCTION_STUB));
      const J = { x: q.x - dx * trunkLen, y: q.y - dy * trunkLen };

      const g = this._edgeGroup(idx, fromIds.join(','));
      const branchSegs = [];
      srcs.forEach((s, k) => {
        const p = this._exit(s, side);
        let pts;
        if (isH(side)) pts = Math.abs(p.y - J.y) < 1 ? [p, J] : [p, { x: J.x, y: p.y }, J];
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

    /* Vertical extents of the above/below blocks of a label. */
    _labelExtents(m) {
      const up = m.above.map(lineExtent), dn = m.below.map(lineExtent);
      const sum = (arr, lead) => arr.reduce((a, x) => a + x.up + x.down, 0) + lead * Math.max(0, arr.length - 1);
      return { hAbove: sum(up, LINE_LEAD), hBelow: sum(dn, LINE_LEAD + 2), hAll: sum(up.concat(dn), LINE_LEAD) };
    }

    _labelBox(seg, mode, m, ext) {
      const mx = (seg.x1 + seg.x2) / 2, my = (seg.y1 + seg.y2) / 2, w = m.width;
      if (mode === 'h') {
        const top = m.above.length ? my - LABEL_GAP - ext.hAbove : my;
        const bot = m.below.length ? my + LABEL_GAP + ext.hBelow : my;
        return { x: mx - w / 2, y: top, w, h: bot - top };
      }
      const x = mode === 'vr' ? mx + VLABEL_DX : mx - VLABEL_DX - w;
      return { x, y: my - ext.hAll / 2, w, h: ext.hAll };
    }

    /* Labels are placed after every line is drawn, so a label can
       avoid other arrows as well as structures and earlier labels. */
    _placeLabel(segs, edge, g) {
      const m = edgeLabelMetrics(edge);
      if (!m.above.length && !m.below.length || !segs.length) return null;
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
      const m = edgeLabelMetrics(edge);
      if (!m.above.length && !m.below.length) return null;
      const ext = this._labelExtents(m);
      const cands = [];
      segs.forEach((sg, k) => {
        if (sg.dir === 'h') cands.push({ sg, mode: 'h', pref: k * 2 });
        else { cands.push({ sg, mode: 'vr', pref: k * 2 }); cands.push({ sg, mode: 'vl', pref: k * 2 + 1 }); }
      });
      // If the middle of a run is blocked, the text may slide along it.
      segs.forEach((sg, k) => {
        const h = sg.dir === 'h';
        const need = (h ? m.width : ext.hAll) + 12;
        const a0 = h ? Math.min(sg.x1, sg.x2) : Math.min(sg.y1, sg.y2);
        const len = Math.abs(sg.x2 - sg.x1) + Math.abs(sg.y2 - sg.y1);
        if (len - need < 16) return;
        for (const f of [0.25, 0.75, 0, 1]) {
          const b0 = a0 + (len - need) * f;
          const sub = h ? { x1: b0, x2: b0 + need, y1: sg.y1, y2: sg.y2, dir: 'h' }
                        : { x1: sg.x1, x2: sg.x2, y1: b0, y2: b0 + need, dir: 'v' };
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
          const x1 = Math.min(l.x1, l.x2), x2 = Math.max(l.x1, l.x2);
          const y1 = Math.min(l.y1, l.y2), y2 = Math.max(l.y1, l.y2);
          if (x2 > bb.x + 1 && x1 < bb.x + bb.w - 1 && y2 > bb.y + 1 && y1 < bb.y + bb.h - 1) score += 600;
        }
        const len = Math.abs(c.sg.x2 - c.sg.x1) + Math.abs(c.sg.y2 - c.sg.y1);
        // A horizontal seat shorter than the text overhangs the shaft end.
        if (c.mode === 'h' && len < m.width + 6) score += (m.width + 6 - len) * 4;
        if (c.mode !== 'h' && len < ext.hAll + 6) score += (ext.hAll + 6 - len) * 4;
        score += c.pref * 0.01;
        c.bb = bb; c.score = score;
        if (!best || score < best.score) best = c;
        if (score < 1) break;
      }
      if (dry) return best.score;
      if (this._placed) this._placed.push(best.bb);
      return this._labelEl(best.sg, edge, best.mode);
    }

    /* Reagent text, BW-style. On a horizontal shaft the reagents stack
       upward and the conditions downward, each kept a FIXED distance
       from the shaft measured to the text's visual edge — a subscript
       on the line nearest the shaft lifts that line instead of touching
       the arrow. Beside a vertical shaft the block is vertically
       centred, to the right ('vr') or left ('vl'). */
    _labelEl(seg, edge, mode) {
      const m = edgeLabelMetrics(edge);
      if (!m.above.length && !m.below.length) return null;
      mode = mode || (seg.dir === 'h' ? 'h' : 'vr');
      const mx = (seg.x1 + seg.x2) / 2;
      const my = (seg.y1 + seg.y2) / 2;
      const wrap = svg('g', { class: 'sg-edge-labels' });
      const put = (text, cls, x, y, anchor) => {
        const t = svg('text', { class: 'sg-edge-label ' + cls, x: r1(x), y: r1(y), 'text-anchor': anchor });
        wrap.appendChild(setChemText(t, text));
      };

      if (mode === 'h') {
        let cursor = my - LABEL_GAP;
        for (let i = m.above.length - 1; i >= 0; i--) {
          const ex = lineExtent(m.above[i]);
          const base = cursor - ex.down;
          put(m.above[i], 'above', mx, base, 'middle');
          cursor = base - ex.up - LINE_LEAD;
        }
        cursor = my + LABEL_GAP;
        for (const txt of m.below) {
          const ex = lineExtent(txt);
          const base = cursor + ex.up;
          put(txt, 'below', mx, base, 'middle');
          cursor = base + ex.down + LINE_LEAD + 2;
        }
      } else {
        const all = [
          ...m.above.map(t => ({ t, cls: 'above' })),
          ...m.below.map(t => ({ t, cls: 'below' }))
        ];
        const ext = all.map(it => lineExtent(it.t));
        const blockH = ext.reduce((a, x) => a + x.up + x.down, 0) + LINE_LEAD * (all.length - 1);
        const x = mode === 'vl' ? mx - VLABEL_DX : mx + VLABEL_DX;
        const anchor = mode === 'vl' ? 'end' : 'start';
        let cursor = my - blockH / 2;
        all.forEach((it, k) => {
          const base = cursor + ext[k].up;
          put(it.t, it.cls, x, base, anchor);
          cursor = base + ext[k].down + LINE_LEAD;
        });
      }
      return wrap;
    }

    /* ─── Helpers ─────────────────────────────────────────────── */

    _nodeById(id) { return this.scheme.nodes.find(n => n.id === id); }
    _isSelected(kind, key) {
      return this.selected && this.selected.kind === kind &&
        (kind === 'node' ? this.selected.id === key : this.selected.idx === key);
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
      const usedIds = new Set(this.scheme.nodes.map(n => n.id));
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
      this.refresh();
      this.select('node', id);
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
      }
      this.refresh();
      this.onChange();
    }

    deleteEdge(idx) {
      this.scheme.edges.splice(idx, 1);
      if (this.selected && this.selected.kind === 'edge' && this.selected.idx === idx) {
        this.selected = null;
        this.onSelectEdge(null);
      } else if (this.selected && this.selected.kind === 'edge' && this.selected.idx > idx) {
        this.selected.idx--;
      }
      this.refresh();
      this.onChange();
    }

    createEdge(fromId, toId) {
      if (!fromId || !toId || fromId === toId) return false;
      const exact = this.scheme.edges.findIndex(e => e.to === toId && (e.from || []).length === 1 && e.from[0] === fromId);
      if (exact >= 0) return false;
      this.scheme.edges.push({ from: [fromId], to: toId, reagent_above: '', reagent_below: '' });
      this.refresh();
      this.select('edge', this.scheme.edges.length - 1);
      this.onChange();
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
      this.refresh();
      this.onChange();
    }

    select(kind, key) {
      if (!kind) {
        this.selected = null;
        this.refresh();
        this.onSelectNode(null);
        this.onSelectEdge(null);
        return;
      }
      this.selected = kind === 'node' ? { kind, id: key } : { kind, idx: key };
      this.refresh();
      if (kind === 'node') this.onSelectNode(this._nodeById(key));
      else                 this.onSelectEdge(this.scheme.edges[key], key);
    }

    focusNode(id) {
      const n = this._nodeById(id);
      if (!n) return;
      const r = this.svg.getBoundingClientRect();
      this.viewX = r.width / 2 - (n.x + NODE_W / 2) * this.scale;
      this.viewY = r.height / 2 - (n.y + NODE_H / 2) * this.scale;
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
        maxX = Math.max(maxX, (n.x || 0) + NODE_W);
        maxY = Math.max(maxY, (n.y || 0) + NODE_H);
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
          else                                this.deleteEdge(this.selected.idx);
          e.preventDefault();
        }
      };
      window.addEventListener('keydown', this._keyHandler);
    }

    _onPointerDown(e) {
      const handleEl = e.target.closest('.sg-handle-out');
      const nodeEl = e.target.closest('.sg-node');
      const edgeEl = e.target.closest('.sg-edge');
      if (!this.readOnly) this.svg.focus();

      this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this._pointers.size >= 2) {
        this.drag = null;
        this.edgeDraft = null;
        this.tap = null;
        this.pan = null;
        this.pinch = this._initPinchState();
        try { this.svg.setPointerCapture(e.pointerId); } catch (_) {}
        return;
      }

      if (handleEl && !this.readOnly) {
        e.preventDefault();
        const fromId = handleEl.dataset.node;
        const start = this._eventToWorld(e);
        this.edgeDraft = { fromId, line: svg('line', {
          class: 'sg-edge-draft', x1: start.x, y1: start.y, x2: start.x, y2: start.y
        }) };
        this.viewport.appendChild(this.edgeDraft.line);
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
        this.drag = {
          id, pointerId: e.pointerId,
          offsetX: w.x - n.x, offsetY: w.y - n.y,
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
        const w = this._eventToWorld(e);
        const n = this._nodeById(this.drag.id);
        if (!n) return;
        n.x = Math.round(w.x - this.drag.offsetX);
        n.y = Math.round(w.y - this.drag.offsetY);
        this.drag.moved = true;
        this.scheme.layout = 'manual';
        const g = this.container.querySelector(`[data-node="${cssEsc(this.drag.id)}"]`);
        if (g) g.setAttribute('transform', `translate(${n.x} ${n.y})`);
        this._drawEdges();
        return;
      }
      if (this.edgeDraft) {
        const w = this._eventToWorld(e);
        this.edgeDraft.line.setAttribute('x2', w.x);
        this.edgeDraft.line.setAttribute('y2', w.y);
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
        const wasMoved = this.drag.moved;
        const id = this.drag.id;
        this.drag = null;
        if (wasMoved) { this.onChange(); this._lastNodeTap = null; }
        else {
          /* select() rebuilds the node's SVG, so the browser's own
             dblclick never sees two clicks on the same element —
             detect the double click here instead. */
          const now = Date.now(), last = this._lastNodeTap;
          this._lastNodeTap = { id, t: now };
          if (last && last.id === id && now - last.t < 450) {
            this._lastNodeTap = null;
            const n = this._nodeById(id);
            if (n) this.onRequestStructEdit(n);
          } else {
            this.select('node', id);
          }
        }
        try { this.svg.releasePointerCapture(e.pointerId); } catch (_) {}
        return;
      }
      if (this.edgeDraft) {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const nodeEl = target ? target.closest('.sg-node') : null;
        if (nodeEl) {
          const toId = nodeEl.dataset.node;
          if (toId !== this.edgeDraft.fromId) this.createEdge(this.edgeDraft.fromId, toId);
          else this.refresh();
        } else if (this.edgeDraft.line.parentNode) {
          this.edgeDraft.line.parentNode.removeChild(this.edgeDraft.line);
        }
        this.edgeDraft = null;
        try { this.svg.releasePointerCapture(e.pointerId); } catch (_) {}
        return;
      }
      if (this.pan && e.pointerId === this.pan.pointerId) {
        const wasMoved = this.pan.moved;
        this.pan = null;
        if (!wasMoved) this.select(null);
        try { this.svg.releasePointerCapture(e.pointerId); } catch (_) {}
      }
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
      if (this.drag || this.edgeDraft || this.pinch) return;
      const edgeEl = e.target.closest('.sg-edge');
      if (edgeEl) {
        e.stopPropagation();
        this.select('edge', parseInt(edgeEl.dataset.edgeIdx, 10));
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

  /* "D^-" / "H_2" for an HTML tile. */
  function chemHtml(str) { return CT.html(str); }

  function cssEsc(s) {
    return String(s || '').replace(/(["\\\.\#\:\[\]\(\)\,\>\+\~\*\=\^\$\|\!\?])/g, '\\$1');
  }

  SchemeGraphEditor.planLayout = planLayout;
  window.SchemeGraphEditor = SchemeGraphEditor;
})();
