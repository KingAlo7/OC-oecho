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
 * `x` and `y` are optional admin-only layout hints. The quiz renderer
 * ignores them (it lays out via edge traversal).
 *
 * UI:
 *   - SVG canvas with pan (drag empty area) and zoom (wheel)
 *   - Drag a node by its body to reposition
 *   - Drag from a node's "→" handle (right edge) onto another node to
 *     create an edge; release outside any node to cancel
 *   - Click a node or edge to select it → fires onSelect callback
 *   - Selected node/edge highlighted in red; press Delete to remove
 *   - Toolbar buttons exposed via container chrome (added by caller)
 *
 * Modes:
 *   `opts.readOnly: true` switches to a viewer used by the quiz page.
 *   In viewer mode there is no editing UI (no handles, no drag, no
 *   edge creation, no toolbar buttons that mutate). Nodes are clickable
 *   and emit `onNodeClick(node)` so the caller can implement reveal /
 *   info-popup behaviour. The same layout + rendering pipeline is used
 *   so the quiz view is visually identical to the admin editor.
 *
 *   `opts.revealedNodeIds: Set<string>` (viewer only) pre-marks hidden
 *   nodes as already-revealed (e.g. after refresh).
 *
 * Callbacks:
 *   onChange()                — emitted after every mutation; caller
 *                               should call mu() to mark dirty + save.
 *   onSelectNode(node|null)   — node selected / cleared (editor mode)
 *   onSelectEdge(edge|null, idx)
 *   onRequestStructEdit(node) — caller opens Ketcher etc.
 *   onNodeClick(node)         — viewer mode: tap on a node
 *
 * Public methods:
 *   refresh()         — rerender everything (e.g. after external mutation)
 *   refreshNode(id)   — rerender single node (after structure change)
 *   autoLayout()      — assign x/y via BFS-layered DAG layout
 *   addNode(opts)     — create node, returns its id
 *   focusNode(id)     — pan to a node and select it
 *   setRevealed(id,b) — viewer: mark a node as revealed/hidden
 *   resetReveals()    — viewer: re-hide every non-given node
 *   countHidden()     — viewer: returns {revealed, total} for progress
 *   destroy()         — remove listeners (call before tearing down DOM)
 */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const NODE_W = 168;
  const NODE_H = 142;
  const NODE_RX = 10;
  const GAP_X = 90;
  const GAP_Y = 60;
  const HANDLE_R = 7;
  const ARROW_HEAD = 9;

  function nextLetterId(usedSet) {
    for (let c = 65; c <= 90; c++) {  // A..Z
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

  class SchemeGraphEditor {
    constructor(container, scheme, opts) {
      this.container = container;
      this.scheme = scheme || { nodes: [], edges: [] };
      this.scheme.nodes = this.scheme.nodes || [];
      this.scheme.edges = this.scheme.edges || [];
      this.opts = opts || {};
      this.readOnly = !!opts.readOnly;
      this.onChange = opts.onChange || (() => {});
      this.onSelectNode = opts.onSelectNode || (() => {});
      this.onSelectEdge = opts.onSelectEdge || (() => {});
      this.onRequestStructEdit = opts.onRequestStructEdit || (() => {});
      this.onNodeClick = opts.onNodeClick || (() => {});

      this.viewX = 40;
      this.viewY = 40;
      this.scale = 1;
      this.selected = null;        // {kind:'node', id} | {kind:'edge', idx}
      this.drag = null;            // node drag state
      this.pan = null;             // background pan state
      this.edgeDraft = null;       // active edge-creation state
      this.tap = null;             // viewer-mode tap-or-pan state
      this.pinch = null;           // 2-finger pinch state (mobile)
      this._pointers = new Map();  // pointerId → {x, y} for multi-touch
      // Viewer-only reveal state. Given nodes (n.given === true) are
      // always visible; we only track non-given nodes here.
      this.revealedIds = new Set(opts.revealedNodeIds || []);
      // Label bounding-box registry — reset each refresh, used for
      // edge-label collision avoidance.
      this._labelBoxes = [];

      this._build();
      this._ensurePositions();
      this.refresh();
      this._bindEvents();
    }

    /* ─── DOM scaffolding ──────────────────────────────────────── */

    _build() {
      this.container.classList.add('sg-host');
      if (this.readOnly) this.container.classList.add('sg-readonly');
      // Viewer mode shows a minimal toolbar (zoom + fit only). Edit
      // mode shows the full toolbar with add/layout/zoom/hint.
      const toolbar = this.readOnly
        ? `<div class="sg-toolbar sg-toolbar-viewer">
             <button class="sg-btn" data-act="fit" title="In Ansicht einpassen">↔ Anpassen</button>
             <button class="sg-btn" data-act="zoomin" title="Zoom +">＋</button>
             <button class="sg-btn" data-act="zoomout" title="Zoom −">−</button>
             <span class="sg-zoom-label" id="sg-zoom-label">100 %</span>
             <span class="sg-hint">Tippe auf einen ✱-Knoten zum Aufdecken · Hintergrund ziehen = verschieben · Mausrad = Zoom</span>
           </div>`
        : `<div class="sg-toolbar">
             <button class="sg-btn" data-act="add">＋ Knoten</button>
             <button class="sg-btn" data-act="layout">Auto-Layout</button>
             <button class="sg-btn" data-act="fit">↔ Anpassen</button>
             <button class="sg-btn" data-act="zoomin" title="Zoom +">＋</button>
             <button class="sg-btn" data-act="zoomout" title="Zoom -">−</button>
             <span class="sg-zoom-label" id="sg-zoom-label">100 %</span>
             <span class="sg-hint">Knoten ziehen · von ⇢-Griff zu Knoten ziehen = Pfeil · Klick = auswählen · Entf = löschen</span>
           </div>`;
      this.container.innerHTML = toolbar + `
        <svg class="sg-canvas" xmlns="${NS}" tabindex="0">
          <defs>
            <marker id="sg-arrow" viewBox="0 0 ${ARROW_HEAD} ${ARROW_HEAD}" refX="${ARROW_HEAD - 1}" refY="${ARROW_HEAD/2}" markerWidth="${ARROW_HEAD}" markerHeight="${ARROW_HEAD}" orient="auto-start-reverse">
              <path d="M0,0 L${ARROW_HEAD},${ARROW_HEAD/2} L0,${ARROW_HEAD} z" fill="#3a3a35"/>
            </marker>
            <marker id="sg-arrow-sel" viewBox="0 0 ${ARROW_HEAD} ${ARROW_HEAD}" refX="${ARROW_HEAD - 1}" refY="${ARROW_HEAD/2}" markerWidth="${ARROW_HEAD}" markerHeight="${ARROW_HEAD}" orient="auto-start-reverse">
              <path d="M0,0 L${ARROW_HEAD},${ARROW_HEAD/2} L0,${ARROW_HEAD} z" fill="#e2001a"/>
            </marker>
          </defs>
          <g class="sg-viewport"></g>
        </svg>`;
      this.svg = this.container.querySelector('.sg-canvas');
      this.viewport = this.svg.querySelector('.sg-viewport');
      this.zoomLabel = this.container.querySelector('#sg-zoom-label');
      this.toolbar = this.container.querySelector('.sg-toolbar');
    }

    /* ─── Layout ──────────────────────────────────────────────── */

    _ensurePositions() {
      const missingAny = this.scheme.nodes.some(n => typeof n.x !== 'number' || typeof n.y !== 'number');
      if (missingAny) this.autoLayout();
    }

    autoLayout() {
      const nodes = this.scheme.nodes;
      const edges = this.scheme.edges;
      if (!nodes.length) return;

      // BFS layered layout. Each layer pushed one step right of its
      // earliest predecessor's layer. Unreachable nodes get their own
      // tail layer so they don't pile up at x=0.
      const ids = new Set(nodes.map(n => n.id));
      const incoming = {};
      const outgoing = {};
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
          // tid's layer = max(predecessors) + 1 once all preds visited
          const allPredsResolved = incoming[tid].every(pid => layer[pid] != null);
          if (allPredsResolved) {
            layer[tid] = Math.max(...incoming[tid].map(pid => layer[pid])) + 1;
            queue.push(tid);
          }
        }
      }
      // Anything left (cycles or orphans without inc-edge resolution) — give next free layer
      let maxL = Math.max(0, ...Object.values(layer));
      [...remaining].sort().forEach(id => { layer[id] = ++maxL; });

      // Group + position
      const byLayer = {};
      nodes.forEach(n => {
        const l = layer[n.id] || 0;
        (byLayer[l] = byLayer[l] || []).push(n);
      });
      Object.entries(byLayer).forEach(([l, group]) => {
        const x = parseInt(l) * (NODE_W + GAP_X);
        // Sort within layer by appearance in nodes[] for stability
        group.sort((a, b) => nodes.indexOf(a) - nodes.indexOf(b));
        group.forEach((n, i) => {
          n.x = x;
          n.y = i * (NODE_H + GAP_Y);
        });
      });
    }

    /* ─── Render ──────────────────────────────────────────────── */

    refresh() {
      // Clear viewport
      while (this.viewport.firstChild) this.viewport.removeChild(this.viewport.firstChild);
      this._applyView();
      // Reset label collision registry for this render pass
      this._labelBoxes = [];

      // Edges layer first (drawn behind nodes). Reserve the node
      // bounding boxes in the registry so labels never overlap nodes.
      const edgesG = svg('g', { class: 'sg-edges' });
      this.viewport.appendChild(edgesG);
      for (const n of this.scheme.nodes) {
        this._labelBoxes.push({ x: n.x || 0, y: n.y || 0, w: NODE_W, h: NODE_H, kind: 'node' });
      }

      this.scheme.edges.forEach((e, idx) => {
        const fromIds = e.from || [];
        const toNode = this._nodeById(e.to);
        if (!toNode) return;
        // For multi-input edges, draw one line per source converging on the target
        fromIds.forEach(fid => {
          const fn = this._nodeById(fid);
          if (!fn) return;
          edgesG.appendChild(this._edgeEl(fn, toNode, e, idx, fid));
        });
        if (fromIds.length === 0) {
          // Orphan edge with no source — render dashed stub from above for visibility
          const stub = svg('line', {
            class: 'sg-edge-line sg-edge-orphan',
            x1: toNode.x + NODE_W / 2, y1: toNode.y - 40,
            x2: toNode.x + NODE_W / 2, y2: toNode.y,
            'data-idx': idx, 'stroke-dasharray': '4 3'
          });
          edgesG.appendChild(stub);
        }
      });

      // Nodes layer
      const nodesG = svg('g', { class: 'sg-nodes' });
      this.viewport.appendChild(nodesG);
      this.scheme.nodes.forEach(n => {
        nodesG.appendChild(this._nodeEl(n));
      });
      this._renderStructures();
      this._fitIfEmpty();
    }

    _fitIfEmpty() {
      // If the canvas hasn't been sized yet, sensible default
      if (this.svg.clientWidth < 50) {
        // wait one tick then refresh once for proper size
        requestAnimationFrame(() => this._applyView());
      }
    }

    _renderStructures() {
      // Inject molecule SVGs via MolRenderer if available.
      // Foreign object holds an HTML div that MolRenderer fills.
      if (typeof window.MolRenderer === 'undefined') return;
      window.MolRenderer.ready().then(() => {
        for (const n of this.scheme.nodes) {
          // In viewer mode: skip rendering structure for nodes that
          // haven't been revealed yet (the "?" placeholder stays).
          if (this.readOnly && !this._isVisible(n)) continue;
          const host = this.container.querySelector(`[data-struct-host="${cssEsc(n.id)}"]`);
          if (!host) continue;
          host.innerHTML = '';
          if (!(n.mol || n.smiles)) {
            host.innerHTML = '<div class="sg-ph">(leer)</div>';
            continue;
          }
          try {
            if (n.mol)         window.MolRenderer.drawMol(n.mol, host, { width: NODE_W - 24, height: NODE_H - 60 });
            else if (n.smiles) window.MolRenderer.drawSmiles(n.smiles, host, { width: NODE_W - 24, height: NODE_H - 60 });
          } catch (e) {
            host.innerHTML = '<div class="sg-err">⚠ Render</div>';
          }
        }
      });
    }

    /* Viewer helpers. A node is visible when it's `given` or has been
       revealed by the user. Edit mode always treats nodes as visible. */
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
      const fresh = this._nodeEl(n);
      g.replaceWith(fresh);
      this._renderStructures();
    }

    _nodeEl(n) {
      // Visual state: given (default) / hidden (viewer + not revealed) /
      // revealed (viewer + revealed). Edit mode never marks nodes as
      // "hidden" — admin always sees structures.
      let stateCls;
      if (this.readOnly) {
        if (n.given)                       stateCls = 'given';
        else if (this.revealedIds.has(n.id)) stateCls = 'revealed';
        else                                 stateCls = 'hidden';
      } else {
        stateCls = n.given ? 'given' : 'hidden';
      }

      const g = svg('g', {
        class: 'sg-node ' + stateCls + (this._isSelected('node', n.id) ? ' selected' : ''),
        transform: `translate(${n.x || 0} ${n.y || 0})`,
        'data-node': n.id
      });

      g.appendChild(svg('rect', {
        class: 'sg-node-bg',
        x: 0, y: 0, width: NODE_W, height: NODE_H, rx: NODE_RX, ry: NODE_RX
      }));

      // Structure host via foreignObject. In viewer mode a hidden node
      // shows a "?" placeholder instead of the structure.
      const fo = svg('foreignObject', {
        x: 12, y: 8, width: NODE_W - 24, height: NODE_H - 60
      });
      const div = document.createElement('div');
      div.className = 'sg-struct-host';
      div.setAttribute('data-struct-host', n.id);
      div.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;border-radius:4px;';
      if (this._isHidden(n)) {
        div.innerHTML = '<div class="sg-q">?</div>';
      } else if (!(n.mol || n.smiles)) {
        div.innerHTML = '<div class="sg-ph">(leer)</div>';
      } else {
        div.innerHTML = '';  // MolRenderer will fill this in _renderStructures
      }
      fo.appendChild(div);
      g.appendChild(fo);

      const labelText = svg('text', { class: 'sg-node-label', x: 12, y: NODE_H - 38 });
      labelText.textContent = n.label || n.id || '?';
      g.appendChild(labelText);

      // In viewer mode: show name on revealed/given nodes (informative)
      // and hide it on hidden ones (would spoil the puzzle).
      if (n.name && !this._isHidden(n)) {
        const nameText = svg('text', { class: 'sg-node-name', x: 12, y: NODE_H - 20 });
        nameText.textContent = n.name.length > 26 ? n.name.slice(0, 24) + '…' : n.name;
        g.appendChild(nameText);
      }

      // Edit mode only: drag-to-create-edge handle + degree badge
      if (!this.readOnly) {
        const handle = svg('circle', {
          class: 'sg-handle sg-handle-out',
          cx: NODE_W, cy: NODE_H / 2, r: HANDLE_R,
          'data-handle': 'out', 'data-node': n.id
        });
        g.appendChild(handle);

        const deg = this._degreeOf(n.id);
        if (deg.in || deg.out) {
          const badge = svg('text', {
            class: 'sg-node-deg',
            x: NODE_W - 6, y: 14,
            'text-anchor': 'end'
          });
          badge.textContent = `↘${deg.in} ↗${deg.out}`;
          g.appendChild(badge);
        }
      } else {
        // Viewer: small 'i' badge on revealed nodes — affordance to
        // signal "tap me for explanation"
        if (this.revealedIds.has(n.id)) {
          const ib = svg('g', { class: 'sg-info-badge' });
          ib.appendChild(svg('circle', { cx: NODE_W - 12, cy: 12, r: 9 }));
          const t = svg('text', { x: NODE_W - 12, y: 15, 'text-anchor': 'middle' });
          t.textContent = 'i';
          ib.appendChild(t);
          g.appendChild(ib);
        }
      }

      return g;
    }

    /* Compute the orthogonal-routing geometry for an edge:
       - exit/entry points sit on the NEAREST edge of each bounding box
         (not always on the right side)
       - if the source and target are roughly aligned (same row or column)
         we draw a straight line
       - otherwise we draw a Manhattan L-bend (3 segments: out from
         source, perpendicular cross, into target) — no curves
       - returns the SVG path string and a "label segment" describing
         the longest horizontal stretch where labels should land */
    _edgeGeometry(fromN, toN) {
      const s = {
        left: fromN.x, right: fromN.x + NODE_W,
        top:  fromN.y, bottom: fromN.y + NODE_H,
        cx:   fromN.x + NODE_W / 2, cy: fromN.y + NODE_H / 2
      };
      const t = {
        left: toN.x, right: toN.x + NODE_W,
        top:  toN.y, bottom: toN.y + NODE_H,
        cx:   toN.x + NODE_W / 2, cy: toN.y + NODE_H / 2
      };
      const dx = t.cx - s.cx;
      const dy = t.cy - s.cy;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);

      // Predominant axis: pick the side of the bounding box that is
      // closest to the OTHER bounding box. Tie-break toward horizontal
      // because synthesis schemes flow left→right.
      const horizontalDominant = adx * NODE_H >= ady * NODE_W;

      let sExit, tEntry, dpath, labelSeg;

      if (horizontalDominant) {
        // Exit on left/right side of source, enter on opposite side of target
        sExit  = dx >= 0 ? { x: s.right, y: s.cy } : { x: s.left,  y: s.cy };
        tEntry = dx >= 0 ? { x: t.left,  y: t.cy } : { x: t.right, y: t.cy };
        if (Math.abs(sExit.y - tEntry.y) < 4) {
          // Truly horizontal — straight line
          dpath = `M ${sExit.x} ${sExit.y} L ${tEntry.x} ${tEntry.y}`;
          labelSeg = { x1: sExit.x, y1: sExit.y, x2: tEntry.x, y2: tEntry.y, dir: 'h' };
        } else {
          // 90° bend: horizontal out, vertical cross, horizontal in
          const midX = (sExit.x + tEntry.x) / 2;
          dpath = `M ${sExit.x} ${sExit.y} L ${midX} ${sExit.y} L ${midX} ${tEntry.y} L ${tEntry.x} ${tEntry.y}`;
          // Use the longer of the two horizontal segments for the label
          const lenA = Math.abs(midX - sExit.x);
          const lenB = Math.abs(tEntry.x - midX);
          if (lenA >= lenB) {
            labelSeg = { x1: sExit.x, y1: sExit.y, x2: midX, y2: sExit.y, dir: 'h' };
          } else {
            labelSeg = { x1: midX, y1: tEntry.y, x2: tEntry.x, y2: tEntry.y, dir: 'h' };
          }
        }
      } else {
        // Vertical dominant: exit top/bottom of source, enter opposite of target
        sExit  = dy >= 0 ? { x: s.cx, y: s.bottom } : { x: s.cx, y: s.top    };
        tEntry = dy >= 0 ? { x: t.cx, y: t.top    } : { x: t.cx, y: t.bottom };
        if (Math.abs(sExit.x - tEntry.x) < 4) {
          // Truly vertical — straight line
          dpath = `M ${sExit.x} ${sExit.y} L ${tEntry.x} ${tEntry.y}`;
          labelSeg = { x1: sExit.x, y1: sExit.y, x2: tEntry.x, y2: tEntry.y, dir: 'v' };
        } else {
          // 90° bend: vertical out, horizontal cross, vertical in
          const midY = (sExit.y + tEntry.y) / 2;
          dpath = `M ${sExit.x} ${sExit.y} L ${sExit.x} ${midY} L ${tEntry.x} ${midY} L ${tEntry.x} ${tEntry.y}`;
          // The horizontal cross-segment is best for label placement
          labelSeg = { x1: sExit.x, y1: midY, x2: tEntry.x, y2: midY, dir: 'h' };
        }
      }
      return { sExit, tEntry, dpath, labelSeg };
    }

    _edgeEl(fromN, toN, edge, idx, fromId) {
      const geo = this._edgeGeometry(fromN, toN);

      const g = svg('g', {
        class: 'sg-edge' + (this._isSelected('edge', idx) ? ' selected' : ''),
        'data-edge-idx': idx, 'data-edge-from': fromId
      });

      g.appendChild(svg('path', {
        class: 'sg-edge-line',
        d: geo.dpath,
        fill: 'none',
        'marker-end': this._isSelected('edge', idx) ? 'url(#sg-arrow-sel)' : 'url(#sg-arrow)'
      }));

      // Wider invisible hit-area for easier clicking on the polyline
      g.appendChild(svg('path', {
        class: 'sg-edge-hit',
        d: geo.dpath,
        fill: 'none',
        stroke: 'transparent',
        'stroke-width': 14
      }));

      // Place above/below labels along the chosen segment, with
      // collision avoidance against all previously placed labels and
      // against node bounding boxes (registry seeded in refresh()).
      const seg = geo.labelSeg;
      const segLen = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
      // Place labels relative to the midpoint of the chosen segment
      const mx = (seg.x1 + seg.x2) / 2;
      const my = (seg.y1 + seg.y2) / 2;

      if (edge.reagent_above) {
        const pos = this._placeEdgeLabel(edge.reagent_above, mx, my, seg.dir, 'above', segLen);
        const t = svg('text', { class: 'sg-edge-label above', x: pos.x, y: pos.y, 'text-anchor': 'middle' });
        t.textContent = edge.reagent_above;
        g.appendChild(t);
      }
      if (edge.reagent_below) {
        const pos = this._placeEdgeLabel(edge.reagent_below, mx, my, seg.dir, 'below', segLen);
        const t = svg('text', { class: 'sg-edge-label below', x: pos.x, y: pos.y, 'text-anchor': 'middle' });
        t.textContent = edge.reagent_below;
        g.appendChild(t);
      }

      return g;
    }

    /* Approximate label bounding box and shift away from collisions.
       Above-labels sit ~10px over the line, below-labels ~16px under.
       For horizontal segments we shift further along the y-axis on
       overlap; for vertical segments we shift along the x-axis. */
    _placeEdgeLabel(text, mx, my, dir, side, segLen) {
      // Crude width approximation. SVG <text> measure-by-getBBox would
      // be exact but requires a render pass — this is good enough to
      // avoid most overlaps and keeps render deterministic.
      const charW = 6.4;
      const lineH = 14;
      const w = Math.min(160, Math.max(28, text.length * charW + 4));
      const h = lineH + 2;

      // Initial offset perpendicular to segment
      const offAbove = 9;
      const offBelow = 15;
      let x = mx, y = my;
      if (dir === 'h') {
        y = my + (side === 'above' ? -offAbove : offBelow);
      } else {
        // Vertical segment: place labels to the LEFT (above) and RIGHT (below)
        x = mx + (side === 'above' ? -(w / 2 + 8) : (w / 2 + 8));
        y = my + 4;
      }

      const bbox = () => ({ x: x - w / 2, y: y - lineH + 2, w, h });
      const shiftStep = (side === 'above' ? -lineH : lineH);
      const altShiftStep = (side === 'above' ? -w * 0.55 : w * 0.55);

      // Up to 8 shift attempts: alternate perpendicular and along-segment
      for (let attempt = 0; attempt < 8; attempt++) {
        if (!this._collidesWithRegistry(bbox())) break;
        if (attempt < 4) {
          if (dir === 'h') y += shiftStep;
          else             x += (side === 'above' ? -lineH : lineH);
        } else {
          // Switch to shifting along the segment direction
          if (dir === 'h') x += altShiftStep;
          else             y += altShiftStep;
        }
      }

      this._labelBoxes.push(Object.assign(bbox(), { kind: 'label' }));
      return { x, y };
    }

    _collidesWithRegistry(b) {
      // AABB intersection check with a tiny tolerance
      const pad = 2;
      for (const r of this._labelBoxes) {
        if (b.x + b.w + pad < r.x) continue;
        if (r.x + r.w + pad < b.x) continue;
        if (b.y + b.h + pad < r.y) continue;
        if (r.y + r.h + pad < b.y) continue;
        return true;
      }
      return false;
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
      if (this.zoomLabel) this.zoomLabel.textContent = Math.round(this.scale * 100) + ' %';
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
      // Drop edges referencing this node
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
      // If an edge with the same to and overlapping from exists, append fromId rather than duplicate
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
      // If structure changed, rerender only that node
      if ('mol' in patch || 'smiles' in patch || 'name' in patch || 'given' in patch || 'label' in patch) {
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

    fitToContent() {
      const nodes = this.scheme.nodes;
      if (!nodes.length) { this.viewX = 40; this.viewY = 40; this.scale = 1; this._applyView(); return; }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(n => {
        minX = Math.min(minX, n.x || 0);
        minY = Math.min(minY, n.y || 0);
        maxX = Math.max(maxX, (n.x || 0) + NODE_W);
        maxY = Math.max(maxY, (n.y || 0) + NODE_H);
      });
      const r = this.svg.getBoundingClientRect();
      const pad = 30;
      const wantW = maxX - minX + 2 * pad;
      const wantH = maxY - minY + 2 * pad;
      this.scale = Math.min(r.width / wantW, r.height / wantH, 1.4);
      this.viewX = -minX * this.scale + pad;
      this.viewY = -minY * this.scale + pad;
      this._applyView();
    }

    /* ─── Event binding ───────────────────────────────────────── */

    _bindEvents() {
      // Toolbar
      this.toolbar.addEventListener('click', ev => {
        const b = ev.target.closest('[data-act]');
        if (!b) return;
        const act = b.dataset.act;
        if (act === 'add'    && !this.readOnly) this.addNode({ x: -this.viewX / this.scale + 60, y: -this.viewY / this.scale + 60 });
        if (act === 'layout' && !this.readOnly) { this.autoLayout(); this.refresh(); this.fitToContent(); this.onChange(); }
        if (act === 'fit')      this.fitToContent();
        if (act === 'zoomin')   { this.scale = Math.min(2.5, this.scale * 1.2); this._applyView(); }
        if (act === 'zoomout')  { this.scale = Math.max(0.25, this.scale / 1.2); this._applyView(); }
      });

      // Pointer events
      this.svg.addEventListener('pointerdown', e => this._onPointerDown(e));
      this.svg.addEventListener('pointermove', e => this._onPointerMove(e));
      this.svg.addEventListener('pointerup',   e => this._onPointerUp(e));
      this.svg.addEventListener('pointercancel', e => this._onPointerUp(e));
      // Wheel zoom (around mouse position)
      this.svg.addEventListener('wheel', e => this._onWheel(e), { passive: false });
      // Click on edge to select
      this.svg.addEventListener('click', e => this._onClick(e));
      // Double-click on node to open structure editor
      this.svg.addEventListener('dblclick', e => {
        const nodeEl = e.target.closest('.sg-node');
        if (!nodeEl) return;
        const n = this._nodeById(nodeEl.dataset.node);
        if (n) this.onRequestStructEdit(n);
      });
      // Keyboard delete
      this._keyHandler = e => {
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
      this.svg.focus();

      // Track every active pointer for multi-touch gestures
      this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      // 2-finger pinch: cancel any single-pointer gesture and switch to pinch mode
      if (this._pointers.size >= 2) {
        this.drag = null;
        this.edgeDraft = null;
        this.tap = null;
        this.pan = null;
        this.pinch = this._initPinchState();
        // Don't preventDefault on the 2nd pointer — let SVG capture both
        try { this.svg.setPointerCapture(e.pointerId); } catch (_) {}
        return;
      }

      // Edit-only: handle-drag starts an edge
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
        e.preventDefault();
        const id = nodeEl.dataset.node;
        const n = this._nodeById(id);
        if (this.readOnly) {
          // Viewer: track as a potential tap. If the pointer moves
          // beyond a small threshold we let the gesture become a pan
          // instead, so swipes on touch devices keep working.
          this.tap = {
            id, pointerId: e.pointerId,
            startX: e.clientX, startY: e.clientY,
            startVX: this.viewX, startVY: this.viewY,
            moved: false
          };
          this.svg.setPointerCapture(e.pointerId);
          return;
        }
        const w = this._eventToWorld(e);
        this.drag = {
          id, pointerId: e.pointerId,
          offsetX: w.x - n.x, offsetY: w.y - n.y,
          moved: false
        };
        this.svg.setPointerCapture(e.pointerId);
        return;
      }

      if (edgeEl) {
        // selection handled in click
        return;
      }

      // Background drag = pan
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
      // Keep pointer registry up to date (used by pinch state)
      if (this._pointers.has(e.pointerId)) {
        this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      // Pinch: 2-finger pan + zoom
      if (this.pinch && this._pointers.size >= 2) {
        this._applyPinch();
        return;
      }
      // Viewer tap → upgrade to pan once finger/cursor moves
      if (this.tap && e.pointerId === this.tap.pointerId) {
        const dx = e.clientX - this.tap.startX;
        const dy = e.clientY - this.tap.startY;
        if (Math.abs(dx) + Math.abs(dy) > 6) {
          this.tap.moved = true;
          // morph into a pan from this point on
          this.viewX = this.tap.startVX + dx;
          this.viewY = this.tap.startVY + dy;
          this._applyView();
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
        // Move only this node + redraw its edges (cheaper than refresh)
        const g = this.container.querySelector(`[data-node="${cssEsc(this.drag.id)}"]`);
        if (g) g.setAttribute('transform', `translate(${n.x} ${n.y})`);
        this._redrawEdgesTouching(this.drag.id);
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
      // Remove from active pointer registry
      this._pointers.delete(e.pointerId);
      // End pinch when we drop below 2 fingers
      if (this.pinch && this._pointers.size < 2) {
        this.pinch = null;
        try { this.svg.releasePointerCapture(e.pointerId); } catch (_) {}
        return;
      }
      // Viewer tap finalize: if it didn't morph into a pan, fire onNodeClick
      if (this.tap && e.pointerId === this.tap.pointerId) {
        const wasMoved = this.tap.moved;
        const id = this.tap.id;
        this.tap = null;
        try { this.svg.releasePointerCapture(e.pointerId); } catch (_) {}
        if (!wasMoved) {
          const n = this._nodeById(id);
          if (n) this.onNodeClick(n);
        }
        return;
      }
      if (this.drag && e.pointerId === this.drag.pointerId) {
        const wasMoved = this.drag.moved;
        const id = this.drag.id;
        this.drag = null;
        if (wasMoved) {
          this.onChange();
        } else {
          this.select('node', id);
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
        } else {
          // Cancel — clean up draft line
          if (this.edgeDraft.line.parentNode) this.edgeDraft.line.parentNode.removeChild(this.edgeDraft.line);
        }
        this.edgeDraft = null;
        try { this.svg.releasePointerCapture(e.pointerId); } catch (_) {}
        return;
      }
      if (this.pan && e.pointerId === this.pan.pointerId) {
        const wasMoved = this.pan.moved;
        this.pan = null;
        if (!wasMoved) {
          // background tap = deselect
          this.select(null);
        }
        try { this.svg.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    }

    _onWheel(e) {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      const newScale = Math.max(0.25, Math.min(2.5, this.scale * factor));
      const r = this.svg.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      // Zoom around cursor: viewport coords stay anchored at (cx, cy)
      this.viewX = cx - (cx - this.viewX) * (newScale / this.scale);
      this.viewY = cy - (cy - this.viewY) * (newScale / this.scale);
      this.scale = newScale;
      this._applyView();
    }

    _onClick(e) {
      if (this.drag || this.edgeDraft || this.pinch) return; // suppress click after gesture
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
      // World point under the initial midpoint should stay under the
      // current midpoint while we change scale.
      const wx0 = (this.pinch.startMidX - r.left - this.pinch.startViewX) / this.pinch.startScale;
      const wy0 = (this.pinch.startMidY - r.top  - this.pinch.startViewY) / this.pinch.startScale;
      this.scale = newScale;
      this.viewX = (curMidX - r.left) - wx0 * newScale;
      this.viewY = (curMidY - r.top)  - wy0 * newScale;
      this._applyView();
    }

    _redrawEdgesTouching(nodeId) {
      // Replace the edges layer entirely (cheap relative to a full refresh).
      const oldG = this.container.querySelector('.sg-edges');
      const fresh = svg('g', { class: 'sg-edges' });
      this.scheme.edges.forEach((e, idx) => {
        const fromIds = e.from || [];
        const toN = this._nodeById(e.to);
        if (!toN) return;
        fromIds.forEach(fid => {
          const fn = this._nodeById(fid);
          if (!fn) return;
          fresh.appendChild(this._edgeEl(fn, toN, e, idx, fid));
        });
      });
      if (oldG && oldG.parentNode) oldG.parentNode.replaceChild(fresh, oldG);
    }

    destroy() {
      window.removeEventListener('keydown', this._keyHandler);
      this.container.innerHTML = '';
    }
  }

  function cssEsc(s) {
    return String(s || '').replace(/(["\\\\\.\#\:\[\]\(\)\,\>\+\~\*\=\^\$\|\!\?])/g, '\\$1');
  }

  window.SchemeGraphEditor = SchemeGraphEditor;
})();
