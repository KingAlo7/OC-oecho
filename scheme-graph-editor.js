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
 * Arrow routing:
 *   - one source → one target: straight shaft, or an orthogonal bend
 *   - one source → several targets (split arrow): a short shared stub,
 *     then one branch per target; each branch carries its own reagent
 *     on its own final segment, so labels never stack on one spot.
 *     If every branch has the same reagent it is written once, on the
 *     shared shaft ("LiAlH4 → A + B").
 *   - several sources → one target (edge.from has >1 id): branches meet
 *     in a junction, one trunk with one arrowhead and one label.
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
  const ROW_GAP        = 74;    // px of vertical run for the wrap-around arrow

  /* Sub/superscripts are drawn with dy shifts, so their exact overhang
     is known and the label can be kept a FIXED distance off the shaft
     even when the line nearest the shaft carries a subscript. */
  const SUB_DROP       = 3.2;   // px a subscript's baseline sits below the line's
  const SUP_RISE       = 4.4;   // px a superscript's baseline sits above it
  const CAP_H          = 8;     // cap height of the 10–11 px label font
  const LINE_LEAD      = 3.5;   // px between stacked label lines
  const JUNCTION_STUB  = 16;    // px of shared shaft before a split arrow fans out
  const VLABEL_DX      = 8;     // px between a vertical shaft and its label block

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

  const CHEM_SRC = '([_^])(?:\\{([^}]*)\\}|([A-Za-z0-9+\\-]))';

  /* "CH_3CH_2MgBr" / "[Ag(NH_3)_2]^{+}" → text with real sub/superscripts.
     Uses dy (honoured everywhere) instead of baseline-shift. */
  function setChemText(textEl, str) {
    const s = String(str == null ? '' : str);
    const re = new RegExp(CHEM_SRC, 'g');
    let last = 0, m, shift = 0;
    const plain = (txt) => {
      const t = svg('tspan', shift ? { dy: -shift } : {});
      shift = 0;
      t.textContent = txt;
      textEl.appendChild(t);
    };
    while ((m = re.exec(s)) !== null) {
      if (m.index > last) plain(s.slice(last, m.index));
      const d = m[1] === '_' ? SUB_DROP : -SUP_RISE;
      const t = svg('tspan', { dy: d - shift, 'font-size': '76%' });
      shift = d;
      t.textContent = m[2] != null ? m[2] : m[3];
      textEl.appendChild(t);
      last = re.lastIndex;
    }
    if (last < s.length) plain(s.slice(last));
    return textEl;
  }

  function chemFlags(str) {
    const s = String(str == null ? '' : str);
    return {
      sub: /_(\{|[A-Za-z0-9+\-])/.test(s),
      sup: /\^(\{|[A-Za-z0-9+\-])/.test(s)
    };
  }

  /* The markup is invisible on screen, so measure what the reader sees. */
  function plainChemText(str) {
    return String(str == null ? '' : str).replace(/[_^]\{([^}]*)\}/g, '$1').replace(/[_^]/g, '');
  }

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
      above, below,
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

    _fitColumns(pitch) {
      const avail = (this.svg && this.svg.clientWidth) || this.container.clientWidth || 0;
      if (!avail) return 4;
      const usable = Math.max(NODE_W, avail - 48);
      return Math.max(2, Math.min(5, Math.floor((usable + pitch - NODE_W) / pitch)));
    }

    /* Column pitch: the widest label plus room for split/merge junctions. */
    _pitch() {
      let shaft = ARROW_MIN;
      for (const e of this.scheme.edges) shaft = Math.max(shaft, edgeLabelMetrics(e).shaft);
      const outDeg = {};
      let junction = false;
      for (const e of this.scheme.edges) {
        const f = e.from || [];
        if (f.length > 1) junction = true;
        if (f.length === 1) outDeg[f[0]] = (outDeg[f[0]] || 0) + 1;
      }
      if (Object.values(outDeg).some(d => d > 1)) junction = true;
      return NODE_W + shaft + (junction ? JUNCTION_STUB + 8 : 0);
    }

    /* Row gap: tall enough that a vertical wrap-around arrow can carry
       its label block beside it without the block reaching the rows
       above or below. */
    _rowGap() {
      let h = 0;
      for (const e of this.scheme.edges) h = Math.max(h, edgeLabelMetrics(e).blockH);
      return Math.max(ROW_GAP, h + 34);
    }

    /* ── Serpentine (boustrophedon) layout ───────────────────────────
         A ──→ B ──→ C ──→ D
                           │
         H ←── G ←── F ←── E
         │
         I ──→ J ──→ …
       Nodes sharing a topological layer stack inside one column. */
    autoLayout(opts) {
      opts = opts || {};
      const nodes = this.scheme.nodes;
      const edges = this.scheme.edges;
      if (!nodes.length) return;

      const ids = new Set(nodes.map(n => n.id));
      const incoming = {}, outgoing = {};
      ids.forEach(id => { incoming[id] = []; outgoing[id] = []; });
      for (const e of edges) {
        if (!ids.has(e.to)) continue;
        for (const fid of (e.from || [])) {
          if (!ids.has(fid)) continue;
          incoming[e.to].push(fid);
          outgoing[fid].push(e.to);
        }
      }

      const layer = {};
      const remaining = new Set(ids);
      const queue = nodes.filter(n => incoming[n.id].length === 0).map(n => n.id);
      queue.forEach(id => { layer[id] = 0; });
      while (queue.length) {
        const id = queue.shift();
        if (!remaining.has(id)) continue;
        remaining.delete(id);
        for (const tid of outgoing[id]) {
          if (!remaining.has(tid)) continue;
          if (incoming[tid].every(pid => layer[pid] != null)) {
            layer[tid] = Math.max(...incoming[tid].map(pid => layer[pid])) + 1;
            queue.push(tid);
          }
        }
      }
      let maxL = Math.max(0, ...Object.values(layer));
      [...remaining].sort().forEach(id => { layer[id] = ++maxL; });

      // Pull side reagents down to just before their first consumer.
      for (const n of nodes) {
        if (incoming[n.id].length || !outgoing[n.id].length) continue;
        const earliest = Math.min(...outgoing[n.id].map(t => layer[t]));
        if (earliest - 1 > layer[n.id]) layer[n.id] = earliest - 1;
      }
      const floor = Math.min(...Object.values(layer));
      if (floor) for (const id of Object.keys(layer)) layer[id] -= floor;

      const byLayer = new Map();
      nodes.forEach(n => {
        const l = layer[n.id] || 0;
        if (!byLayer.has(l)) byLayer.set(l, []);
        byLayer.get(l).push(n);
      });
      const columns = [...byLayer.keys()].sort((a, b) => a - b)
        .map(l => byLayer.get(l).sort((a, b) => nodes.indexOf(a) - nodes.indexOf(b)));

      const pitch = this._pitch();
      const rowGap = this._rowGap();
      const cols = Math.max(1, opts.columns || this.layoutColumns || this._fitColumns(pitch));

      // A layer with several compounds normally stacks in one cell. At
      // the start of a new row, though, it is entered from ABOVE by the
      // wrap-around arrow, and a stacked cell would force the arrow to
      // the lower compound straight through the upper one. There the
      // compounds are spread across separate cells instead.
      const rows = [];
      let row = [];
      for (const group of columns) {
        if (row.length === cols) { rows.push(row); row = []; }
        const atRowStart = row.length === 0 && rows.length > 0;
        const cells = (atRowStart && group.length > 1) ? group.map(n => [n]) : [group];
        for (const cell of cells) {
          if (row.length === cols) { rows.push(row); row = []; }
          row.push(cell);
        }
      }
      if (row.length) rows.push(row);

      let y = 0;
      this._rowOf = new Map();
      rows.forEach((row, r) => {
        const tallest = Math.max(...row.map(c => c.length));
        const rowH = tallest * NODE_H + (tallest - 1) * STACK_GAP;
        row.forEach((group, c) => {
          const slot = (r % 2 === 0) ? c : (cols - 1 - c);
          const x = slot * pitch;
          const stackH = group.length * NODE_H + (group.length - 1) * STACK_GAP;
          const y0 = y + (rowH - stackH) / 2;
          group.forEach((n, k) => {
            this._rowOf.set(n.id, r);
            n.x = x;
            n.y = y0 + k * (NODE_H + STACK_GAP);
          });
        });
        y += rowH + rowGap;
      });

      const minX = Math.min(...nodes.map(n => n.x));
      if (minX) nodes.forEach(n => { n.x -= minX; });

      this.scheme.layout = 'auto';
      this._layoutCols = cols;
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
      if (this._isHidden(n)) {
        div.innerHTML = `<div class="sg-q" style="width:${PH_SIZE}px;height:${PH_SIZE}px">?</div>`;
      } else if (!(n.mol || n.smiles)) {
        div.innerHTML = '<div class="sg-ph">(leer)</div>';
      }
      fo.appendChild(div);
      g.appendChild(fo);

      const label = svg('text', { class: 'sg-node-label', x: NODE_W / 2, 'text-anchor': 'middle' });
      label.textContent = n.label != null ? n.label : (n.id || '?');
      g.appendChild(label);

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

    _footprint(n) {
      if (this._isHidden(n)) return { w: PH_SIZE, h: PH_SIZE };
      return this._mb.get(n.id) || { w: PH_SIZE, h: PH_SIZE };
    }
    _textBlockH(n) {
      return V_LABEL_H + (n.name && !this._isHidden(n) ? V_NAME_H : 0) + (n.caption ? V_NAME_H + 2 : 0);
    }

    _placeNodeText(n, g) {
      g = g || this.container.querySelector(`[data-node="${cssEsc(n.id)}"]`);
      if (!g) return;
      const m = this._footprint(n);
      const bottom = V_CY + m.h / 2;
      const label = g.querySelector('.sg-node-label');
      const name = g.querySelector('.sg-node-name');
      if (label) label.setAttribute('y', bottom + 13);
      if (name) name.setAttribute('y', bottom + 13 + V_NAME_H);
      const cap = g.querySelector('.sg-node-caption');
      if (cap) cap.setAttribute('y', bottom + 13 + V_NAME_H * (name ? 2 : 1) + 1);
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
      // In an auto layout the row is known: an arrow to another row of
      // the serpentine always leaves vertically, so it never doubles back
      // over the arrows of its own row.
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

      const valid = (e) => (e.from || []).length === 1 && this._nodeById(e.from[0]) && this._nodeById(e.to);

      // 1. Split arrows: one source, several targets on the same side.
      const outBy = new Map();
      E.forEach((e, i) => {
        if (!valid(e)) return;
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
        if (done.has(i) || !valid(e)) return;
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
        if (done.has(i)) return;
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
    }

    _edgeGroup(idx, fromId) {
      return svg('g', {
        class: 'sg-edge' + (this._isSelected('edge', idx) ? ' selected' : ''),
        'data-edge-idx': idx, 'data-edge-from': fromId
      });
    }

    _addPath(g, d, idx, head, extraCls) {
      const attrs = { class: 'sg-edge-line' + (extraCls ? ' ' + extraCls : ''), d, fill: 'none' };
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
        if (skip.includes(o.id)) continue;
        for (let k = 1; k < pts.length; k++) {
          const a = pts[k - 1], b = pts[k];
          const x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x);
          const y1 = Math.min(a.y, b.y), y2 = Math.max(a.y, b.y);
          if (x2 > o.x + 2 && x1 < o.x + o.w - 2 && y2 > o.y + 2 && y1 < o.y + o.h - 2) { n++; break; }
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
    _route(p, ps, q, qs, skip) {
      const obs = (this._obstacles || []).filter(o => !skip.includes(o.id));
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      const xs = new Set([mx]), ys = new Set([my]);
      for (const o of obs) { xs.add(o.x - 12); xs.add(o.x + o.w + 12); ys.add(o.y - 12); ys.add(o.y + o.h + 12); }
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
      if (hS && vE) for (const y of Y) tries.push([p, { x: x1, y: p.y }, { x: x1, y }, { x: q.x, y }, q]);
      if (vS && hE) for (const x of X) tries.push([p, { x: p.x, y: y1 }, { x, y: y1 }, { x, y: q.y }, q]);
      let best = null, bestHits = Infinity;
      for (const t of tries) {
        const h = this._hits(t, skip);
        if (h === 0) return t;
        if (h < bestHits) { best = t; bestHits = h; }
      }
      return best || [p, q];
    }

    /* One source, one target. */
    _drawSingle(layer, idx, fromId) {
      const e = this.scheme.edges[idx];
      const s = this._box(this._nodeById(fromId));
      const t = this._box(this._nodeById(e.to));
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
      const lab = this._placeLabel(this._segsOf(pts), e);
      if (lab) g.appendChild(lab);
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
          const lab = this._placeLabel(last ? [last, ...segs.filter(sg => sg !== last && sg.dir !== last.dir)] : segs, E[i]);
          if (lab) g.appendChild(lab);
        }
        layer.appendChild(g);
      });
      if (shared) {
        const lab = this._placeLabel([{ x1: p.x, y1: p.y, x2: J.x, y2: J.y, dir: isH(side) ? 'h' : 'v' }], E[idxs[0]]);
        if (lab) trunk.appendChild(lab);
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
        const lab = this._placeLabel(this._segsOf(pts), E[i]);
        if (lab) g.appendChild(lab);
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
      const lab = this._placeLabel([trunk, ...branchSegs.filter(sg => sg.dir === trunk.dir)], e);
      if (lab) g.appendChild(lab);
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

    /* Pick the first seat on the arrow that collides with nothing; if
       every seat collides, take the one with the least overlap. */
    _placeLabel(segs, edge) {
      const m = edgeLabelMetrics(edge);
      if (!m.above.length && !m.below.length) return null;
      const ext = this._labelExtents(m);
      const cands = [];
      segs.forEach((sg, k) => {
        if (sg.dir === 'h') cands.push({ sg, mode: 'h', pref: k * 2 });
        else { cands.push({ sg, mode: 'vr', pref: k * 2 }); cands.push({ sg, mode: 'vl', pref: k * 2 + 1 }); }
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
        for (const o of this._obstacles || []) score += overlap(bb, o);
        for (const o of this._placed || []) score += overlap(bb, o) * 2;
        const len = Math.abs(c.sg.x2 - c.sg.x1) + Math.abs(c.sg.y2 - c.sg.y1);
        // A horizontal seat shorter than the text overhangs the shaft end.
        if (c.mode === 'h' && len < m.width + 6) score += (m.width + 6 - len) * 4;
        if (c.mode !== 'h' && len < ext.hAll + 6) score += (ext.hAll + 6 - len) * 4;
        score += c.pref * 0.01;
        c.bb = bb; c.score = score;
        if (!best || score < best.score) best = c;
        if (score < 1) break;
      }
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
      const want = this._fitColumns(this._pitch());
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
      this.svg.addEventListener('dblclick', e => {
        if (this.readOnly) return;
        const nodeEl = e.target.closest('.sg-node');
        if (!nodeEl) return;
        const n = this._nodeById(nodeEl.dataset.node);
        if (n) this.onRequestStructEdit(n);
      });
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
        if (wasMoved) this.onChange();
        else this.select('node', id);
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

  function cssEsc(s) {
    return String(s || '').replace(/(["\\\.\#\:\[\]\(\)\,\>\+\~\*\=\^\$\|\!\?])/g, '\\$1');
  }

  window.SchemeGraphEditor = SchemeGraphEditor;
})();
