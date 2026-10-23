/**
 * Builder for mechanism steps (data/mechanisms.json), used by
 * tools/seed-mechanisms.js and the tools/mech-*.js files.
 *
 * A step is drawn as one scene: species are built as FRAGMENTS in their
 * own coordinates (molfile units, y up, bond length 1), then laid out
 * left → right with reaction arrows and "+" between them. Only x is
 * shifted — y stays as authored, so a skeleton drawn at the same y in
 * every step keeps its place on the page.
 *
 *   const S = scene();
 *   const a = S.frag(() => { … S.at / S.L / S.to / S.b … return { c, o }; });
 *   const b = S.frag(() => …);
 *   return S.step({
 *     caption: '…',
 *     row: [a, '→', b, '+', c],          // or { arrow: '⇌', above: 'H₂O' }
 *     curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o))]
 *   });
 *
 * Curly arrows take anchors that are resolved AFTER layout, so they can
 * be written before the fragments are moved. Leaving out `side` picks
 * the side with more free space around the arc.
 */
const { Mol, B, DX, DY } = require('./lib-molbuilder.js');

const r4 = v => Math.round(v * 10000) / 10000;
const rad = d => d * Math.PI / 180;
const polar = (p, deg, l) => [p[0] + (l == null ? 1 : l) * Math.cos(rad(deg)), p[1] + (l == null ? 1 : l) * Math.sin(rad(deg))];

/* Rough half-width of what is printed at an atom, in bond lengths. */
function halfWidth(a) {
  if (a.alias) return 0.12 + 0.19 * [...a.alias.replace(/[₀-₉⁰-⁹⁺⁻]/g, '')].length + 0.08 * (a.alias.match(/[₀-₉]/g) || []).length + (a.charge ? 0.12 : 0);
  if (a.sym === 'C') return a.charge ? 0.3 : 0.05;
  return 0.25 + (a.charge ? 0.15 : 0);
}

const ELEMENTS = new Set(['C', 'H', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I', 'Si', 'Se', 'Li', 'Na', 'K',
  'Mg', 'Zn', 'Cu', 'Hg', 'Os', 'Mn', 'Cr', 'Al', 'Fe', 'Sn', 'Pd', 'Ni']);

function scene() {
  const m = new Mol();
  const rads = [];
  const frags = [];
  let cur = null;

  const S = {
    m,
    /* atoms and bonds */
    at(x, y, sym, charge) {
      const i = m.add(x, y, sym || 'C');
      if (charge) m.charge(i, charge);
      if (cur) cur.push(i);
      return i;
    },
    L(x, y, label, charge) {                       // labelled placeholder: R₁, B, Nu, X, H₂O …
      const i = m.gen(x, y, label);
      if (charge) m.charge(i, charge);
      if (cur) cur.push(i);
      return i;
    },
    /* an element symbol becomes a real atom, anything else a label */
    any(x, y, s, charge) { return ELEMENTS.has(s) ? S.at(x, y, s, charge) : S.L(x, y, s, charge); },
    b(i, j, order, stereo) { m.bond(i, j, order || 1, stereo || 0); return S; },
    /* a new atom `len` away from atom i at angle `deg`, bonded to it.
       o: { order, charge, label, len, stereo } */
    to(i, deg, sym, o) {
      o = o || {};
      // a long label eats into its bond horizontally, so lengthen it
      let len = o.len;
      if (len == null && o.label) {
        const n = [...o.label.replace(/[₀-₉⁰-⁹⁺⁻]/g, '')].length + 0.5 * (o.label.match(/[₀-₉]/g) || []).length;
        len = 1 + Math.max(0, n - 1.5) * 0.24 * Math.abs(Math.cos(rad(deg)));
      }
      const p = polar(S.xy(i), deg, len);
      const j = o.label ? S.L(p[0], p[1], o.label, o.charge) : S.any(p[0], p[1], sym || 'C', o.charge);
      S.b(i, j, o.order, o.stereo);
      return j;
    },
    radical(i) { rads.push(i); return S; },
    charge(i, q) { m.charge(i, q); return S; },
    xy(i) { const a = m.atoms[i]; return [a.x, a.y]; },
    /* rings via the shared builder — their atoms join the open fragment */
    ring(n, cx, cy, opts) { const k0 = m.atoms.length; const r = m.ring(n, cx, cy, opts); S._adopt(k0); return r; },
    benzene(cx, cy, r) { const k0 = m.atoms.length; const v = m.benzene(cx, cy, r); S._adopt(k0); return v; },
    _adopt(k0) { if (cur) for (let k = k0; k < m.atoms.length; k++) cur.push(k); },

    /* a fragment: everything drawn inside fn moves together */
    frag(fn) {
      const prev = cur;
      cur = [];
      const ret = fn() || {};
      const f = { atoms: cur, ret, extra: [] };
      cur = prev;
      if (cur) cur.push(...f.atoms);
      frags.push(f);
      Object.defineProperty(ret, '__frag', { value: f, enumerable: false });
      return ret;
    },

    /* anchors (resolved after layout) */
    atom(i) { return () => ({ atom: S.p(i) }); },
    pair(i, j) { return () => ({ bond: [S.p(i), S.p(j)] }); },
    p(i) { const a = m.atoms[i]; return [r4(a.x), r4(a.y)]; },
    /* centre of some atoms, resolved after layout (for `away`) */
    centre(ids) { return () => [ids.reduce((t, i) => t + m.atoms[i].x, 0) / ids.length, ids.reduce((t, i) => t + m.atoms[i].y, 0) / ids.length]; },
    /* curly arrow; opts: { type: 'single', arc: 'flat'|'deep' } */
    cv(from, to, side, opts) { return Object.assign({ from, to, side, type: 'pair', arc: 'auto' }, opts || {}); },
    one(from, to, side, opts) { return S.cv(from, to, side, Object.assign({ type: 'single' }, opts || {})); },

    /* Lay out and serialise one step.
       spec: { caption, row, curly, texts, y (arrow height), gap } */
    step(spec) {
      const out = { caption: spec.caption };
      const arrows = [], pluses = [], texts = (spec.texts || []).slice();
      const gap = spec.gap == null ? 0.45 : spec.gap;
      const box = f => {
        let x0 = Infinity, x1 = -Infinity;
        f.atoms.forEach(i => { const a = m.atoms[i], h = halfWidth(a); x0 = Math.min(x0, a.x - h); x1 = Math.max(x1, a.x + h); });
        return [x0, x1];
      };
      const allY = m.atoms.map(a => a.y);
      const yArrow = spec.y != null ? spec.y : (allY.length ? (Math.min(...allY) + Math.max(...allY)) / 2 : 0);
      let x = null;
      (spec.row || []).forEach((it, k) => {
        if (it && it.__frag) {
          const f = it.__frag;
          const [x0, x1] = box(f);
          if (x === null) { x = x1; return; }          // the first species stays where it was drawn
          const dx = x + gap - x0;
          f.atoms.forEach(i => { m.atoms[i].x += dx; });
          (f.extra || []).forEach(e => { e[0] += dx; });
          x = x1 + dx;
          return;
        }
        const sp = typeof it === 'string' ? { arrow: it } : it;
        if (sp.arrow === '+') {
          pluses.push([r4(x + 0.5), r4(sp.y != null ? sp.y : yArrow)]);
          x += 1.0 - gap + 0.12;
          return;
        }
        const label = Math.max(sp.above ? sp.above.length : 0, sp.below ? sp.below.length : 0) * 0.26;
        const L = Math.max(sp.len || 1.1, label + 0.4);
        const ya = sp.y != null ? sp.y : yArrow;
        const x0 = x + 0.25, x1 = x0 + L;
        arrows.push({ from: [r4(x0), r4(ya)], to: [r4(x1), r4(ya)], mode: sp.arrow === '⇌' ? 'equilibrium' : 'open-angle' });
        const tw = s => s.length * 0.26;
        if (sp.above) texts.push({ at: [r4((x0 + x1) / 2 - tw(sp.above) / 2), r4(ya + 0.75)], text: sp.above });
        if (sp.below) texts.push({ at: [r4((x0 + x1) / 2 - tw(sp.below) / 2), r4(ya - 0.2)], text: sp.below });
        x = x1 + 0.25 - gap + 0.1;
      });
      // two atoms on one spot garble the labels — say so while seeding
      for (let i = 0; i < m.atoms.length; i++) for (let j = i + 1; j < m.atoms.length; j++) {
        const A = m.atoms[i], C = m.atoms[j];
        if (Math.hypot(A.x - C.x, A.y - C.y) < 0.3) console.warn('  ⚠ Atome übereinander (' + (A.alias || A.sym) + '/' + (C.alias || C.sym) + '): ' + String(spec.caption).slice(0, 50));
      }
      out.mol = S.mol();
      if (arrows.length) out.arrows = arrows;
      if (pluses.length) out.pluses = pluses;
      if (texts.length) out.texts = texts;
      const curly = (spec.curly || []).map(c => {
        const from = c.from(), to = c.to();
        const side = c.side || (c.away ? awaySide(from, to, typeof c.away === 'function' ? c.away() : c.away) : autoSide(from, to));
        const o = { from, to, type: c.type, side, arc: c.arc || 'auto' };
        return o;
      });
      if (curly.length) out.curly = curly;
      return out;
    },

    mol() {
      let t = m.toMolfile();
      if (rads.length) {
        t = t.replace('M  END', 'M  RAD' + String(rads.length).padStart(3) +
          rads.map(i => String(i + 1).padStart(4) + '   2').join('') + '\nM  END');
      }
      return t;
    }
  };

  /* The side that bulges away from point q (a ring centre: arrows round
     a cyclic transition state curl outwards). */
  function awaySide(from, to, q) {
    const c = a => a.bond ? [(a.bond[0][0] + a.bond[1][0]) / 2, (a.bond[0][1] + a.bond[1][1]) / 2] : a.atom;
    const p0 = c(from), p1 = c(to);
    const d = [p1[0] - p0[0], p1[1] - p0[1]];
    const n = [-d[1], d[0]];
    const m = [(p0[0] + p1[0]) / 2 - q[0], (p0[1] + p1[1]) / 2 - q[1]];
    return n[0] * m[0] + n[1] * m[1] >= 0 ? 1 : -1;
  }

  /* Which side gives the arc more room: the apex (and the points half-way
     to it) as far as possible from atoms and bond midpoints. */
  function autoSide(from, to) {
    const c = a => a.bond ? [(a.bond[0][0] + a.bond[1][0]) / 2, (a.bond[0][1] + a.bond[1][1]) / 2] : a.atom;
    const p0 = c(from), p1 = c(to);
    const d = [p1[0] - p0[0], p1[1] - p0[1]], l = Math.hypot(d[0], d[1]) || 1;
    const h = Math.max(Math.min(l / 2, 0.42 + 0.12 * l), 0.12);
    const pts = m.atoms.map(a => [a.x, a.y]).concat(m.bonds.map(b => {
      const A = m.atoms[b.a], C = m.atoms[b.b]; return [(A.x + C.x) / 2, (A.y + C.y) / 2];
    }));
    const score = side => {
      const n = [-d[1] / l * side, d[0] / l * side];
      let s = 0;
      [0.25, 0.5, 0.75].forEach(t => {
        const bulge = h * Math.sin(Math.PI * t);
        const q = [p0[0] + d[0] * t + n[0] * bulge, p0[1] + d[1] * t + n[1] * bulge];
        const dm = Math.min(...pts.map(p => Math.hypot(p[0] - q[0], p[1] - q[1])));
        s += Math.min(dm, 1.2);
      });
      return s;
    };
    return score(1) >= score(-1) ? 1 : -1;
  }

  return S;
}

module.exports = { scene, polar, B, DX, DY, r4, ELEMENTS };
