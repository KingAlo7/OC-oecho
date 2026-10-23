/**
 * KetcherMech — a "mechanism arrow" tool for the admin's embedded Ketcher.
 *
 * Ketcher (vendor/ketcher, unchanged) draws molecules, reaction arrows,
 * "+" signs and text. What it cannot draw are the red curved arrows of a
 * reaction mechanism. This file adds them from the outside, like
 * ketcher-ui.js adds the FG button:
 *
 *   · a ↷ button under the FG button switches the tool on
 *   · click a START (atom = its lone pair, bond = its electrons), then a
 *     TARGET (atom, or bond). Shift + two atoms as the target = the bond
 *     being formed between them. Reagents drawn above a reaction arrow are
 *     ordinary molecules on the canvas, so arrows start from them too.
 *   · a click on an arrow selects it; the bar at the top then switches
 *     pair / single electron, bulge side and arc, or deletes it
 *     (keys: T, F, A, Entf)
 *
 * The arrows are drawn into Ketcher's own SVG, in its canvas coordinates
 * (model × microModeScale + offset), so they follow zoom and scrolling,
 * and they hang on Ketcher's atom ids, so they follow when atoms move.
 * Geometry comes from mech-arrows.js — the page draws them identically.
 *
 * load(iframe, step) puts a stored step on the canvas, read(iframe)
 * returns one; the format is described in tools/seed-mechanisms.js.
 */
(function () {
  'use strict';

  const CSS = [
    '#km-button.km-on{background:#ff0d0d;border-radius:4px}',
    '#km-button.km-on svg *{stroke:#fff;fill:#fff}',
    '.km-bar{position:fixed;z-index:999;left:50%;top:52px;transform:translateX(-50%);display:none;align-items:center;gap:6px;' +
      'padding:5px 8px;border-radius:14px;background:#fff;border:1px solid #e3b5b9;box-shadow:0 3px 12px rgba(0,0,0,.18);' +
      'font:12px/1.3 "Segoe UI",system-ui,sans-serif;color:#333;white-space:nowrap}',
    '.km-bar.open{display:flex}',
    '.km-bar b{color:#ff0d0d}',
    '.km-bar button{font:inherit;font-weight:600;padding:3px 8px;border:1px solid #cfd6d8;border-radius:10px;background:#fff;cursor:pointer;color:#333}',
    '.km-bar button:hover{border-color:#ff0d0d}',
    '.km-bar button[aria-pressed="true"]{background:#ff0d0d;border-color:#ff0d0d;color:#fff}',
    '.km-bar .km-sep{width:1px;height:16px;background:#e3e8e9}',
    '.km-hint{color:#666}',
  ].join('\n');

  const ICON = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M5 17 A7.5 7.5 0 0 1 18.5 9.5" stroke="#ff0d0d" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '<path d="M20.3 13.4 L19.6 7.6 L15.2 10.6 Z" fill="#ff0d0d" stroke="#ff0d0d" stroke-width="0.8" stroke-linejoin="round"/></svg>';

  const ARCS = ['auto', 'flat', 'deep'];
  const ARC_NAME = { auto: 'Bogen: auto', flat: 'Bogen: flach', deep: 'Bogen: halbkreis' };

  /* ── LaTeX-lite (H_2O, OH^-) ⇄ Ketcher's rich text (draft.js) ── */
  function toDraft(text) {
    const blocks = String(text || '').split('\n').map(function (line, bi) {
      let plain = '';
      const ranges = [];
      window.ChemText.tokenize(line).forEach(function (t) {
        if (t.t !== 'text') ranges.push({ offset: plain.length, length: t.v.length, style: t.t === 'sub' ? 'SUBSCRIPT' : 'SUPERSCRIPT' });
        plain += t.v;
      });
      return { key: 'k' + bi + Math.random().toString(36).slice(2, 6), text: plain, type: 'unstyled', depth: 0,
               inlineStyleRanges: ranges, entityRanges: [], data: {} };
    });
    return JSON.stringify({ blocks: blocks, entityMap: {} });
  }
  function fromDraft(content) {
    let raw;
    try { raw = typeof content === 'string' ? JSON.parse(content) : content; } catch (_) { return String(content || ''); }
    return (raw.blocks || []).map(function (b) {
      const style = new Array(b.text.length).fill('');
      (b.inlineStyleRanges || []).forEach(function (r) {
        const s = r.style === 'SUBSCRIPT' ? 'sub' : r.style === 'SUPERSCRIPT' ? 'sup' : '';
        for (let i = r.offset; i < r.offset + r.length && i < style.length; i++) if (s) style[i] = s;
      });
      let out = '', i = 0;
      while (i < b.text.length) {
        let j = i;
        while (j < b.text.length && style[j] === style[i]) j++;
        const run = b.text.slice(i, j);
        out += style[i] === 'sub' ? '_{' + run + '}' : style[i] === 'sup' ? '^{' + run + '}' : run.replace(/([_^])/g, '\\$1');
        i = j;
      }
      return out;
    }).join('\n');
  }

  /* ── per-iframe state ─────────────────────────────────────────── */
  function state(win) {
    if (!win.__km) win.__km = { arrows: [], on: false, pending: null, selected: -1, type: 'pair', layer: null, sig: '' };
    return win.__km;
  }

  function setup(win, doc) {
    const k = win.ketcher;
    const S = state(win);

    const style = doc.createElement('style');
    style.id = 'km-style';
    style.textContent = CSS;
    doc.head.appendChild(style);

    const button = doc.createElement('button');
    button.id = 'km-button';
    button.type = 'button';
    button.title = 'Mechanismuspfeil: Start (Atom = Elektronenpaar, Bindung = Bindungselektronen), dann Ziel anklicken';
    button.innerHTML = ICON;

    const bar = doc.createElement('div');
    bar.className = 'km-bar';
    doc.body.appendChild(bar);

    const NS = 'http://www.w3.org/2000/svg';
    const R = function () { return k.editor.render; };
    const toCanvas = function (pp) {
      const o = R().options;
      return [pp.x * o.microModeScale + o.offset.x, pp.y * o.microModeScale + o.offset.y];
    };
    const atomPP = function (id) { const a = k.editor.struct().atoms.get(id); return a ? a.pp : null; };

    function anchorOf(a) {
      if (a.atom != null) { const p = atomPP(a.atom); return p && { kind: 'atom', p: toCanvas(p) }; }
      const p = atomPP(a.pair[0]), q = atomPP(a.pair[1]);
      return p && q && { kind: 'bond', a: toCanvas(p), b: toCanvas(q) };
    }

    /* ── drawing ──────────────────────────────────────────────── */
    function draw(force) {
      const svg = R().paper.canvas;
      if (!S.layer || !S.layer.isConnected || S.layer.ownerSVGElement !== svg) {
        S.layer = doc.createElementNS(NS, 'g');
        S.layer.setAttribute('id', 'km-layer');
        svg.appendChild(S.layer);
        force = true;
      } else if (svg.lastChild !== S.layer) {
        svg.appendChild(S.layer);   // keep on top of Ketcher's own drawing
      }
      const st = k.editor.struct();
      // arrows whose atoms were deleted go too
      S.arrows = S.arrows.filter(function (ar) {
        return [ar.from, ar.to].every(function (a) {
          return a.atom != null ? st.atoms.has(a.atom) : st.atoms.has(a.pair[0]) && st.atoms.has(a.pair[1]);
        });
      });
      if (S.selected >= S.arrows.length) S.selected = -1;
      const u = R().options.microModeScale;
      const ids = [];
      S.arrows.forEach(function (ar) { [ar.from, ar.to].forEach(function (a) { ids.push.apply(ids, a.atom != null ? [a.atom] : a.pair); }); });
      if (S.pending) ids.push.apply(ids, S.pending.atom != null ? [S.pending.atom] : S.pending.pair || []);
      const sig = JSON.stringify([S.arrows, S.selected, S.pending, S.half, u, R().options.offset,
        ids.map(function (id) { const p = atomPP(id); return p ? [p.x, p.y] : 0; })]);
      if (!force && sig === S.sig) return;
      S.sig = sig;

      let html = '';
      S.arrows.forEach(function (ar, i) {
        const s = anchorOf(ar.from), t = anchorOf(ar.to);
        if (!s || !t) return;
        const o = { unit: u, side: ar.side, arc: ar.arc, type: ar.type };
        const g = window.MechArrows.geometry(s, t, o);
        if (i === S.selected) {
          html += '<path d="' + g.path + '" fill="none" stroke="#ffd54f" stroke-width="' + (0.28 * u) + '" stroke-linecap="round" opacity="0.7"/>';
        }
        html += window.MechArrows.svg(s, t, o);
        // wide, invisible hit area
        html += '<path class="km-hit" data-i="' + i + '" d="' + g.path + '" fill="none" stroke="transparent" stroke-width="' + (0.3 * u) +
          '" style="pointer-events:stroke;cursor:pointer"/>';
      });
      const mark = function (a) {
        const an = anchorOf(a);
        if (!an) return '';
        const c = an.kind === 'atom' ? an.p : [(an.a[0] + an.b[0]) / 2, (an.a[1] + an.b[1]) / 2];
        return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + (0.22 * u) + '" fill="rgba(255,13,13,0.12)" stroke="#ff0d0d" stroke-width="1.5" stroke-dasharray="3 2"/>';
      };
      if (S.pending) html += mark(S.pending);
      if (S.half) html += mark({ atom: S.half });
      S.layer.innerHTML = html;
    }

    /* ── the bar at the top ───────────────────────────────────── */
    function renderBar() {
      if (!S.on) { bar.classList.remove('open'); return; }
      let h;
      if (S.selected >= 0) {
        const ar = S.arrows[S.selected];
        h = '<b>Pfeil ' + (S.selected + 1) + '</b>' +
          '<button data-a="type" title="T">' + (ar.type === 'single' ? 'Einzelelektron ⇀' : 'Elektronenpaar →') + '</button>' +
          '<button data-a="side" title="F">Seite ⇅</button>' +
          '<button data-a="arc" title="A">' + ARC_NAME[ar.arc || 'auto'] + '</button>' +
          '<span class="km-sep"></span><button data-a="del" title="Entf">Löschen</button>' +
          '<button data-a="done">Fertig</button>';
      } else {
        const step = S.half ? 'zweites Atom der neuen Bindung' : S.pending ? '<b>Ziel</b> anklicken (Atom / Bindung; Shift + 2 Atome = neue Bindung)'
          : '<b>Start</b> anklicken: Atom = freies Elektronenpaar, Bindung = Bindungselektronen';
        h = '<span class="km-hint">' + step + '</span><span class="km-sep"></span>' +
          '<button data-a="newtype" aria-pressed="' + (S.type === 'pair') + '">Paar</button>' +
          '<button data-a="newsingle" aria-pressed="' + (S.type === 'single') + '">Einzelelektron</button>';
      }
      bar.innerHTML = h;
      bar.classList.add('open');
    }

    function act(a) {
      const ar = S.arrows[S.selected];
      if (a === 'newtype') S.type = 'pair';
      else if (a === 'newsingle') S.type = 'single';
      else if (a === 'done') S.selected = -1;
      else if (ar && a === 'type') ar.type = ar.type === 'single' ? 'pair' : 'single';
      else if (ar && a === 'side') ar.side = -(ar.side || 1);
      else if (ar && a === 'arc') ar.arc = ARCS[(ARCS.indexOf(ar.arc || 'auto') + 1) % ARCS.length];
      else if (ar && a === 'del') { S.arrows.splice(S.selected, 1); S.selected = -1; }
      renderBar(); draw(true);
    }
    bar.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    bar.addEventListener('click', function (e) {
      const b = e.target.closest('button[data-a]');
      if (b) act(b.getAttribute('data-a'));
    });

    function setOn(on) {
      S.on = on;
      S.pending = null; S.half = null; S.selected = -1;
      button.classList.toggle('km-on', on);
      if (on) { try { k.editor.tool('select'); } catch (_) {} }
      renderBar(); draw(true);
    }
    button.addEventListener('click', function () { setOn(!S.on); });

    /* ── clicks on the canvas while the tool is on ────────────── */
    const inCanvas = function (e) { const ca = R().clientArea; return ca && ca.contains(e.target); };
    function onDown(e) {
      if (!S.on || !inCanvas(e)) return;
      e.stopPropagation(); e.preventDefault();
      // a cancelled pointerdown suppresses the mouse events, so act on it
      if (e.type !== 'pointerdown') return;
      const hit = e.target.closest && e.target.closest('.km-hit');
      if (hit && !S.pending) { S.selected = +hit.getAttribute('data-i'); renderBar(); draw(true); return; }
      const item = k.editor.findItem(e, ['atoms', 'bonds']);
      let anc = null;
      if (item && item.map === 'atoms') anc = { atom: item.id };
      else if (item && item.map === 'bonds') {
        const b = k.editor.struct().bonds.get(item.id);
        if (b) anc = { pair: [b.begin, b.end] };
      }
      S.selected = -1;
      if (!anc) { S.pending = null; S.half = null; renderBar(); draw(true); return; }
      if (!S.pending) {
        S.pending = anc;
      } else if (S.half != null) {
        if (anc.atom != null && anc.atom !== S.half) finish({ pair: [S.half, anc.atom] });
      } else if (e.shiftKey && anc.atom != null) {
        S.half = anc.atom;
      } else {
        finish(anc);
      }
      renderBar(); draw(true);
    }
    function finish(target) {
      S.arrows.push({ from: S.pending, to: target, type: S.type, side: 1, arc: 'auto' });
      S.pending = null; S.half = null;
      S.selected = S.arrows.length - 1;
    }
    ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'dblclick'].forEach(function (t) {
      doc.addEventListener(t, onDown, true);
    });
    doc.addEventListener('keydown', function (e) {
      if (!S.on) return;
      const tag = (e.target && e.target.tagName) || '';
      if (/INPUT|TEXTAREA/.test(tag) || (e.target && e.target.isContentEditable)) return;
      let a = null;
      if (e.key === 'Escape') { if (S.pending || S.selected >= 0) { S.pending = null; S.half = null; S.selected = -1; renderBar(); draw(true); } else setOn(false); }
      else if (S.selected >= 0 && (e.key === 'Delete' || e.key === 'Backspace')) a = 'del';
      else if (S.selected >= 0 && /^[tT]$/.test(e.key)) a = 'type';
      else if (S.selected >= 0 && /^[fF]$/.test(e.key)) a = 'side';
      else if (S.selected >= 0 && /^[aA]$/.test(e.key)) a = 'arc';
      else return;
      e.stopPropagation(); e.preventDefault();
      if (a) act(a);
    }, true);

    // atoms move, Ketcher redraws, the view zooms: keep the layer current
    win.setInterval(function () { try { draw(false); } catch (_) {} }, 120);

    /* In the left toolbar right under the text tool, next to the reaction
       arrow and "+" (the right toolbar is full and scrolls). */
    function attach() {
      const anchor = doc.querySelector('[data-testid="text"]');
      if (!anchor || (button.isConnected && button.previousElementSibling === anchor)) return;
      button.className = anchor.className;
      anchor.insertAdjacentElement('afterend', button);
    }
    attach();
    new win.MutationObserver(attach).observe(doc.body, { childList: true, subtree: true });
    S.redraw = function () { draw(true); };
  }

  function install(iframe) {
    const win = iframe && iframe.contentWindow;
    if (!win) return;
    let tries = 0;
    (function attempt() {
      let doc;
      try { doc = win.document; } catch (_) { return; }
      if (!doc || doc.getElementById('km-style')) return;
      if (!win.ketcher || !doc.querySelector('[data-testid="period-table"]')) {
        if (++tries < 150) win.setTimeout(attempt, 100);
        return;
      }
      setup(win, doc);
    })();
  }

  /* ── load / read a step ───────────────────────────────────────── */
  const molAtoms = function (mol) {
    const L = String(mol || '').split(/\r?\n/);
    if (L.length < 4) return [];
    const n = parseInt(L[3].slice(0, 3), 10) || 0;
    return L.slice(4, 4 + n).map(function (l) { return [+l.slice(0, 10), +l.slice(10, 20)]; });
  };
  const meanOf = function (pts) {
    if (!pts.length) return [0, 0];
    return [pts.reduce(function (s, p) { return s + p[0]; }, 0) / pts.length, pts.reduce(function (s, p) { return s + p[1]; }, 0) / pts.length];
  };
  const ketAtoms = function (ket) {
    const out = [];
    (ket.root.nodes || []).forEach(function (n) {
      const m = n.$ref && ket[n.$ref];
      if (m && m.atoms) m.atoms.forEach(function (a) { out.push([a.location[0], a.location[1]]); });
    });
    return out;
  };
  // KET (y up) ⇄ Ketcher model (y down)
  const structAtoms = function (k) {
    const out = [];
    k.editor.struct().atoms.forEach(function (a, id) { out.push({ id: id, x: a.pp.x, y: -a.pp.y }); });
    return out;
  };

  async function load(iframe, step) {
    const win = iframe.contentWindow, k = win.ketcher;
    const S = state(win);
    step = step || {};
    S.arrows = []; S.pending = null; S.selected = -1;
    if (step.mol && /M\s+END/.test(step.mol)) await k.setMolecule(step.mol);
    else await k.setMolecule('');
    const ket = JSON.parse(await k.getKet());
    const ma = molAtoms(step.mol);
    let d = [0, 0];
    if (ma.length) { const a = meanOf(ketAtoms(ket)), b = meanOf(ma); d = [a[0] - b[0], a[1] - b[1]]; }
    const P = function (p) { return { x: p[0] + d[0], y: p[1] + d[1], z: 0 }; };
    (step.arrows || []).forEach(function (a) {
      ket.root.nodes.push({ type: 'arrow', data: { mode: a.mode || 'open-angle', pos: [P(a.from), P(a.to)] } });
    });
    (step.pluses || []).forEach(function (p) { const q = P(p); ket.root.nodes.push({ type: 'plus', location: [q.x, q.y, 0] }); });
    (step.texts || []).forEach(function (t) {
      const q = P(t.at);
      const w = Math.max(0.4, window.ChemText.plain(t.text).length * 0.18), h = 0.4;
      ket.root.nodes.push({ type: 'text', data: { content: toDraft(t.text), position: q,
        pos: [q, { x: q.x, y: q.y - h, z: 0 }, { x: q.x + w, y: q.y - h, z: 0 }, { x: q.x + w, y: q.y, z: 0 }] } });
    });
    if (ket.root.nodes.length > (ket.root.nodes.filter(function (n) { return n.$ref; }).length)) {
      await k.setMolecule(JSON.stringify(ket));
    }
    // curly arrows: stored coordinates → the nearest atom now on the canvas
    const sa = structAtoms(k);
    if (sa.length && ma.length) {
      const a = meanOf(sa.map(function (s) { return [s.x, s.y]; })), b = meanOf(ma);
      const off = [a[0] - b[0], a[1] - b[1]];
      const near = function (c) {
        let best = null, bd = 0.25;
        sa.forEach(function (s) { const dd = Math.hypot(s.x - c[0] - off[0], s.y - c[1] - off[1]); if (dd < bd) { bd = dd; best = s.id; } });
        return best;
      };
      const anc = function (a) {
        if (a.atom) { const i = near(a.atom); return i == null ? null : { atom: i }; }
        if (a.bond) { const i = near(a.bond[0]), j = near(a.bond[1]); return i == null || j == null ? null : { pair: [i, j] }; }
        return null;
      };
      (step.curly || []).forEach(function (c) {
        const f = anc(c.from), t = anc(c.to);
        if (f && t) S.arrows.push({ from: f, to: t, type: c.type || 'pair', side: c.side || 1, arc: c.arc || 'auto' });
      });
    }
    S.sig = '';
    if (S.redraw) S.redraw();
  }

  async function read(iframe) {
    const win = iframe.contentWindow, k = win.ketcher;
    const S = state(win);
    const ket = JSON.parse(await k.getKet());
    const mols = ket.root.nodes.filter(function (n) { return n.$ref; });
    // atom ids only hold on the canvas as it is now: take coordinates first
    const st = k.editor.struct();
    const kat = function (id) { const a = st.atoms.get(id); return [a.pp.x, -a.pp.y]; };
    const curlyKet = S.arrows.map(function (ar) {
      const conv = function (a) { return a.atom != null ? { atom: kat(a.atom) } : { bond: [kat(a.pair[0]), kat(a.pair[1])] }; };
      return { from: conv(ar.from), to: conv(ar.to), type: ar.type, side: ar.side, arc: ar.arc };
    });
    /* Ketcher refuses to write a MOL while reaction arrows are on the
       canvas, and indigo's converter only gives V3000. So: molecules
       alone on the canvas, Ketcher's own V2000 writer (keeps charges,
       radicals, abbreviations), and the whole step back afterwards. */
    let mol = '';
    if (mols.length) {
      const only = Object.assign({}, ket, { root: Object.assign({}, ket.root, { nodes: mols }) });
      await k.setMolecule(JSON.stringify(only));
      mol = await k.getMolfile('v2000');
    }
    // everything is stored in the molfile's frame
    let d = [0, 0];
    const ma = molAtoms(mol);
    if (ma.length) { const a = meanOf(ketAtoms(ket)), b = meanOf(ma); d = [a[0] - b[0], a[1] - b[1]]; }
    const r4 = function (v) { return Math.round(v * 10000) / 10000; };
    const F = function (x, y) { return [r4(x - d[0]), r4(y - d[1])]; };
    const step = { mol: mol, arrows: [], pluses: [], texts: [], curly: [] };
    ket.root.nodes.forEach(function (n) {
      if (n.type === 'arrow') step.arrows.push({ from: F(n.data.pos[0].x, n.data.pos[0].y), to: F(n.data.pos[1].x, n.data.pos[1].y), mode: n.data.mode });
      else if (n.type === 'plus') step.pluses.push(F(n.location[0], n.location[1]));
      else if (n.type === 'text') {
        const p = n.data.position || (n.data.pos && n.data.pos[0]);
        step.texts.push({ at: F(p.x, p.y), text: fromDraft(n.data.content) });
      }
    });
    curlyKet.forEach(function (c) {
      const conv = function (a) { return a.atom ? { atom: F(a.atom[0], a.atom[1]) } : { bond: [F(a.bond[0][0], a.bond[0][1]), F(a.bond[1][0], a.bond[1][1])] }; };
      step.curly.push({ from: conv(c.from), to: conv(c.to), type: c.type, side: c.side, arc: c.arc });
    });
    ['arrows', 'pluses', 'texts', 'curly'].forEach(function (key) { if (!step[key].length) delete step[key]; });
    if (mols.length) {
      // put the full step back (atom ids change, arrows re-anchor by coordinates)
      const on = S.on;
      await load(iframe, step);
      S.on = on;
    }
    return step;
  }

  window.KetcherMech = { install: install, load: load, read: read, toDraft: toDraft, fromDraft: fromDraft };
})();
