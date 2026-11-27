/**
 * MechArrows — the curved "electron-pushing" arrows of a reaction
 * mechanism, shared by the Ketcher tool (ketcher-mech.js) and the page
 * renderer (MolRenderer.mechanismSvg), so an arrow looks the same while
 * it is drawn and when it is shown.
 *
 * An arrow runs from a SOURCE to a TARGET:
 *   atom  a lone pair (source) or the atom that receives the electrons
 *   bond  the electrons of an existing bond, or the bond they go into
 *   form  a bond that does not exist yet (two atoms not bonded in the
 *         drawing): the head lands ON the line between them, just short
 *         of its middle — so two fishhooks from two radicals meet head to
 *         head where the new bond will be
 *
 * The line is a cubic Bézier that follows a circular arc of sweep angle
 * θ (180° = semicircle), optionally skewed towards one end:
 *   side   +1 / −1   which side of the line between the ends it bulges to
 *   arc    'auto'    θ chosen by layout(); a number = θ in degrees
 *          ('flat' / 'deep' of older data are read as preferences)
 *   type   'pair'    full head: an electron pair moves
 *          'single'  half head ("fishhook"): one electron, radicals
 *   lock   ['side', 'arc']  values the author set by hand; layout()
 *          leaves them alone and only places the rest
 *
 * layout() places all arrows of a step together: for each it tries both
 * sides, several arc angles, a skew, where a lone pair leaves its atom
 * and where the head lands on a bond, and keeps the variant that clears
 * atom labels, bonds, radical dots, reaction arrows, texts and the other
 * arrows best while staying close to the textbook default.
 *
 * Stored data (data/mechanisms.json) names atoms and bonds by their
 * MOLFILE coordinates, so nothing depends on atom numbering:
 *   { from: { atom: [x, y] } | { bond: [[x, y], [x, y]] },
 *     to:   …same…, type, side, arc, lock? }
 * A "bond" whose two atoms are not bonded in the molfile is a form target.
 *
 * Geometry is computed in screen space (y down) after the anchors have
 * been mapped there; `unit` is one bond length in that space.
 */
(function (root) {
  'use strict';

  // the oxygen red of OpenChemLib, brighter than the site's accent red
  const COLOR = '#ff0d0d';

  const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const mul = (p, k) => [p[0] * k, p[1] * k];
  const len = p => Math.hypot(p[0], p[1]);
  const unit = p => { const l = len(p) || 1; return [p[0] / l, p[1] / l]; };
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1];
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const mid = (p, q) => lerp(p, q, 0.5);
  const RAD = Math.PI / 180;

  /* ── atom labels ──────────────────────────────────────────────── */

  const VALENCE = { N: 3, O: 2, S: 2, P: 3, Se: 2, B: 3 };
  const LABEL_H = 0.3;          // half height of a printed label, in bond lengths
  const GLYPH = {};             // glyph widths of OCL's label font, in bond lengths
  [['IJfijlt', 0.15], ['r()-', 0.19], ['ckssvxyz', 0.29], ['FLTZ', 0.34], ['abdeghnopqu0123456789', 0.32],
    ['ABEKPSVXY', 0.39], ['CDHNRUw', 0.42], ['GOQ', 0.45], ['Mm', 0.48], ['W', 0.55]]
    .forEach(([s, w]) => [...s].forEach(ch => { GLYPH[ch] = w; }));

  /**
   * Half extents { w, h } of what is printed at an atom, in bond lengths,
   * or null for a bare carbon vertex.
   *   a: { sym, charge, alias }, used: sum of bond orders at the atom
   */
  function labelBox(a, used) {
    if (a.alias) {
      // OCL centres the text on the atom; widths of its 14px sans-serif
      // glyphs in bond lengths (subscripts are smaller)
      let t = 0;
      [...String(a.alias)].forEach(ch => { t += /[₀-₉⁰-⁹⁺⁻]/.test(ch) ? 0.17 : GLYPH[ch] || (/[A-Z]/.test(ch) ? 0.4 : 0.3); });
      return { w: t / 2 + 0.04 + (a.charge ? 0.1 : 0), h: LABEL_H };
    }
    if (a.sym === 'C') return a.charge ? { w: 0.3, h: LABEL_H } : null;
    let w = 0.25 + (a.charge ? 0.15 : 0);
    if (VALENCE[a.sym] && used != null) {
      // a heteroatom drawn with implicit H ("OH", "NH₂") is wider
      const nh = VALENCE[a.sym] + (a.sym === 'N' && a.charge > 0 ? 1 : 0) - (a.charge < 0 ? 1 : 0) - used;
      if (nh > 0) w = 0.25 + 0.3 * Math.min(nh, 1) + (nh > 1 ? 0.1 : 0) + (a.charge ? 0.15 : 0);
    }
    return { w: w, h: LABEL_H };
  }

  /* Distance from an atom's centre to the edge of its label along v. */
  function edge(box, v) {
    if (!box) return 0;
    const ex = Math.abs(v[0]) > 1e-6 ? box.w / Math.abs(v[0]) : Infinity;
    const ey = Math.abs(v[1]) > 1e-6 ? box.h / Math.abs(v[1]) : Infinity;
    return Math.min(ex, ey);
  }

  /* ── molfile → scene ──────────────────────────────────────────── */

  /** V2000 molfile → { atoms: [{ x, y, sym, charge, alias, rad }], bonds: [{ a, b, order }] } (y up). */
  function parseMolfile(text) {
    const L = String(text || '').split(/\r?\n/);
    const out = { atoms: [], bonds: [] };
    if (L.length < 4) return out;
    const nA = parseInt(L[3].slice(0, 3), 10) || 0, nB = parseInt(L[3].slice(3, 6), 10) || 0;
    for (let i = 0; i < nA; i++) {
      const l = L[4 + i] || '';
      out.atoms.push({ x: +l.slice(0, 10), y: +l.slice(10, 20), sym: l.slice(31, 34).trim(), charge: 0, alias: null, rad: false });
    }
    for (let i = 0; i < nB; i++) {
      const l = L[4 + nA + i] || '';
      const a = +l.slice(0, 3) - 1, b = +l.slice(3, 6) - 1;
      if (out.atoms[a] && out.atoms[b]) out.bonds.push({ a: a, b: b, order: +l.slice(6, 9) || 1 });
    }
    for (let k = 4 + nA + nB; k < L.length; k++) {
      const l = L[k];
      if (/^M {2}CHG/.test(l) || /^M {2}RAD/.test(l)) {
        const f = l.trim().split(/\s+/).slice(3).map(Number);
        for (let j = 0; j + 1 < f.length; j += 2) {
          const at = out.atoms[f[j] - 1];
          if (!at) continue;
          if (/CHG/.test(l)) at.charge = f[j + 1]; else at.rad = true;
        }
      } else if (/^A {2}/.test(l)) {
        const at = out.atoms[+l.slice(3).trim() - 1];
        if (at) at.alias = L[k + 1];
        k++;
      }
    }
    return out;
  }

  /**
   * Everything an arrow has to keep clear of, in screen space.
   *   mol   parsed molfile (parseMolfile) or { atoms, bonds } alike
   *   map   molfile [x, y] → screen [x, y]
   *   u     bond length on screen
   *   step  optional: its reaction arrows and texts join the obstacles
   */
  function sceneFromMol(mol, map, u, step) {
    const used = mol.atoms.map(() => 0);
    const nbs = mol.atoms.map(() => []);
    mol.bonds.forEach(b => { used[b.a] += b.order; used[b.b] += b.order; nbs[b.a].push(b.b); nbs[b.b].push(b.a); });
    const atoms = mol.atoms.map((a, i) => {
      const bx = labelBox(a, used[i]);
      return { p: map([a.x, a.y]), box: bx && { w: bx.w * u, h: bx.h * u } };
    });
    const bonds = mol.bonds.map(b => ({ a: b.a, b: b.b, order: b.order }));
    const dots = [];
    mol.atoms.forEach((a, i) => {
      if (!a.rad) return;
      // the dot sits away from the atom's bonds (as MolRenderer draws it)
      const p = atoms[i].p;
      let v = [0, 0];
      nbs[i].forEach(j => { const d = unit(sub(atoms[j].p, p)); v = sub(v, d); });
      v = len(v) > 0.2 ? unit(v) : [0, -1];
      const dp = add(p, mul(v, (atoms[i].box ? edge(atoms[i].box, v) + 0.1 * u : 0.36 * u)));
      dots.push(dp);
      // MolRenderer draws a carbon's dot itself, exactly here: a fishhook
      // from that radical starts at the dot (OCL places the others)
      if (a.sym === 'C' && !a.alias) atoms[i].dot = dp;
    });
    const segs = [], boxes = [];
    if (step) {
      (step.arrows || []).forEach(r => segs.push([map(r.from), map(r.to)]));
      (step.texts || []).forEach(t => {
        const c = map(t.at), lines = String(t.text || '').split(/\n/);
        const w = Math.max.apply(null, lines.map(s => s.length)) * 6.5;
        boxes.push({ c: [c[0] + w / 2, c[1] + lines.length * 7.5], w: w / 2, h: lines.length * 7.5 });
      });
      (step.pluses || []).forEach(p => { const c = map(p); boxes.push({ c: c, w: 6, h: 8 }); });
    }
    return { u: u, atoms: atoms, bonds: bonds, dots: dots, segs: segs, boxes: boxes };
  }

  /* ── one arrow ────────────────────────────────────────────────── */

  /* Centre of an anchor before it is nudged off its atom or bond; on a
     bond, of the part that is not hidden by labels. */
  const centre = (a, slide) => {
    if (a.kind === 'atom') return a.p;
    const t = a.kind === 'bond' && slide != null ? slide : 0.5;
    const L = len(sub(a.b, a.a));
    if (a.kind !== 'bond' || !(a.boxA || a.boxB) || L < 1e-6) return lerp(a.a, a.b, t);
    const e = mul(sub(a.b, a.a), 1 / L);
    const ea = Math.min(edge(a.boxA, e), 0.45 * L), eb = Math.min(edge(a.boxB, e), 0.45 * L);
    return add(a.a, mul(e, ea + (L - ea - eb) * t));
  };

  /* The arc angle textbooks use for a chord of length c: a semicircle
     while the ends are close, flatter as they get further apart. */
  function preferredTheta(c, u, arc) {
    let h;
    if (arc === 'flat') h = Math.min(c * 0.25, 0.35 * u);
    else if (arc === 'deep') h = c / 2;
    else h = Math.min(c / 2, 0.42 * u + 0.12 * c);
    h = Math.max(h, 0.12 * u);
    return 4 * Math.atan(2 * h / Math.max(c, 1e-6)) / RAD;
  }

  const bez = (P, t) => {
    const s = 1 - t;
    return [s * s * s * P[0][0] + 3 * s * s * t * P[1][0] + 3 * s * t * t * P[2][0] + t * t * t * P[3][0],
      s * s * s * P[0][1] + 3 * s * s * t * P[1][1] + 3 * s * t * t * P[2][1] + t * t * t * P[3][1]];
  };
  const bezD = (P, t) => {
    const s = 1 - t;
    return [3 * s * s * (P[1][0] - P[0][0]) + 6 * s * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0]),
      3 * s * s * (P[1][1] - P[0][1]) + 6 * s * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1])];
  };
  /* the part of a cubic from 0 to t (de Casteljau) */
  const bezHead = (P, t) => {
    const a = lerp(P[0], P[1], t), b = lerp(P[1], P[2], t), c = lerp(P[2], P[3], t);
    const d = lerp(a, b, t), e = lerp(b, c, t);
    return [P[0], a, d, lerp(d, e, t)];
  };

  /**
   * @param src, tgt  { kind: 'atom', p, box? } | { kind: 'bond', a, b, order? } | { kind: 'form', a, b }
   *                  box = half extents of the atom's label on screen
   * @param o  { unit, side, type, theta (deg) | arc, skew, phi (deg), slide }
   * @returns { path, head, start, end, apex, samples, headPts } — SVG path data
   */
  function geometry(src, tgt, o) {
    const u = o.unit || 24;
    const side = o.side < 0 ? -1 : 1;
    const c0 = centre(src), c1 = centre(tgt, o.slide);
    const d = unit(sub(c1, c0));
    // left of the direction of travel on a y-down screen, flipped by side
    const n = mul([d[1], -d[0]], side);
    const near = len(sub(c1, c0)) < 1.2 * u;
    // the outer lines of a double (or triple) bond are further out
    const dbl = a => (a.order >= 3 ? 0.16 * u : a.order >= 2 ? 0.1 * u : 0);
    /* Off a bond, square to it: towards the other end of the arrow when
       that lies clearly to one side, else to the side the arrow bulges. */
    /* Between two labels with little bond showing, step out past the
       labels' height so the arrow is not squeezed through the slot. */
    const slot = bd => {
      if (!bd.boxA || !bd.boxB) return 0;
      const L = len(sub(bd.b, bd.a)), e = mul(sub(bd.b, bd.a), 1 / (L || 1));
      return L - edge(bd.boxA, e) - edge(bd.boxB, e) < 0.5 * u ? Math.max(bd.boxA.h, bd.boxB.h) + 0.06 * u : 0;
    };
    const off = (bd, c, other) => {
      const e = unit(sub(bd.b, bd.a));
      let nb = [e[1], -e[0]];
      const k = dot(unit(sub(other, c)), nb);
      if (Math.abs(k) > 0.5 ? k < 0 : dot(nb, n) < 0) nb = mul(nb, -1);
      return nb;
    };

    /* A lone pair sits beside its atom, on the side the arrow leaves by
       (rotated by phi towards the target), clear of the atom's label;
       bond electrons leave from beside the middle of the bond. */
    let p0;
    if (src.kind === 'atom' && src.dot && o.type === 'single') {
      p0 = add(src.dot, mul(unit(sub(src.dot, c0)), 0.1 * u));
    } else if (src.kind === 'atom') {
      const a = (75 - (o.phi || 0)) * RAD;
      const v = unit(add(mul(d, Math.cos(a)), mul(n, Math.sin(a))));
      p0 = add(c0, mul(v, Math.max(0.3 * u, edge(src.box, v) + 0.1 * u)));
    } else {
      p0 = add(c0, mul(off(src, c0, c1), Math.max((near && tgt.kind === 'atom' ? 0.3 : 0.1) * u + dbl(src), slot(src))));
    }

    /* The head lands beside a bond, on the line of a bond being formed
       (just short of its middle, on the source's half), and stops short
       of a receiving atom's label — reached from the side when close. */
    let p1;
    if (tgt.kind === 'bond') {
      p1 = add(c1, mul(off(tgt, c1, c0), Math.max(0.16 * u + dbl(tgt), slot(tgt))));
    } else if (tgt.kind === 'form') {
      const e = unit(sub(tgt.b, tgt.a));
      const s = dot(sub(c0, c1), e) >= 0 ? 1 : -1;
      const ea = edge(tgt.boxA, e), eb = edge(tgt.boxB, e);
      // the middle of what is visible between the two labels
      const m = add(c1, mul(e, (ea - eb) / 2));
      p1 = add(m, mul(e, s * 0.12 * u));
    } else {
      const v = near ? unit(add(mul(n, 0.36), mul(d, 0.12))) : unit(add(mul(d, -0.34), mul(n, 0.14)));
      p1 = add(c1, mul(v, Math.max(near ? 0.38 * u : 0.36 * u, edge(tgt.box, v) + 0.13 * u)));
    }

    const chordV = sub(p1, p0);
    const c = Math.max(len(chordV), 0.05 * u);
    const cd = unit(chordV);
    // recompute the normal on the real chord, same side
    const nn = mul([cd[1], -cd[0]], side);

    let theta = typeof o.theta === 'number' ? o.theta : typeof o.arc === 'number' ? o.arc : preferredTheta(c, u, o.arc);
    theta = Math.max(30, Math.min(240, theta)) * RAD;
    const k = Math.max(-0.45, Math.min(0.45, o.skew || 0));
    const a0 = theta / 2 * (1 + k), a1 = theta / 2 * (1 - k);
    const R = c / (2 * Math.sin(theta / 2));
    const arm = 4 / 3 * Math.tan(theta / 4) * R;
    const t0 = add(mul(cd, Math.cos(a0)), mul(nn, Math.sin(a0)));
    const t1 = sub(mul(cd, Math.cos(a1)), mul(nn, Math.sin(a1)));
    const P = [p0, add(p0, mul(t0, arm * (1 + k * 0.5))), sub(p1, mul(t1, arm * (1 - k * 0.5))), p1];

    /* The head is straight and the line is curved, so they can only meet
       cleanly at ONE point: where the head's base sits on the curve. The
       curve therefore ends a head-length early (point B), and the head
       runs on from B along the tangent there. */
    // a tight arc gets a smaller head, or the head is as long as the arc
    const L = Math.max(0.2 * u, Math.min(0.32 * u, 0.55 * R)), W = 0.42 * L;
    const N = 40, cum = [0];
    let prev = p0;
    for (let i = 1; i <= N; i++) { const q = bez(P, i / N); cum.push(cum[i - 1] + len(sub(q, prev))); prev = q; }
    const total = cum[N];
    const want = Math.max(total * 0.35, total - L);
    let tB = 1;
    for (let i = 1; i <= N; i++) {
      if (cum[i] >= want) { tB = (i - 1 + (want - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1)) / N; break; }
    }
    const Q = bezHead(P, tB);
    const B = Q[3];
    const t = unit(bezD(P, tB));
    const tip = add(B, mul(t, L));
    const notch = add(B, mul(t, L * 0.25));

    const f = v => v.toFixed(2);
    // the short straight piece B → notch carries the line into the head
    const path = 'M' + f(p0[0]) + ',' + f(p0[1]) +
      ' C' + f(Q[1][0]) + ',' + f(Q[1][1]) + ' ' + f(Q[2][0]) + ',' + f(Q[2][1]) + ' ' + f(B[0]) + ',' + f(B[1]) +
      ' L' + f(notch[0]) + ',' + f(notch[1]);

    // the barb of a fishhook sits on the outside of the curve
    // (away from the centre of the circle the curve follows)
    const Cc = add(mid(p0, p1), mul(nn, -R * Math.cos(theta / 2)));
    let q = [-t[1], t[0]];
    if (dot(q, sub(B, Cc)) < 0) q = mul(q, -1);
    const pts = o.type === 'single'
      ? [tip, add(B, mul(q, W)), notch]
      : [tip, add(B, mul(q, W)), notch, sub(B, mul(q, W))];
    const head = 'M' + pts.map(p => f(p[0]) + ',' + f(p[1])).join(' L') + ' Z';

    const samples = [];
    for (let i = 0; i <= 20; i++) samples.push(bez(Q, i / 20));
    let apex = samples[0], hb = -Infinity;
    samples.forEach(s => { const h = dot(sub(s, p0), nn); if (h > hb) { hb = h; apex = s; } });

    return { path, head, start: p0, end: tip, dir: t, apex, samples, headPts: pts.concat([B]), theta: theta / RAD, length: total };
  }

  /* The arrow as SVG markup. `extra` is added to both elements. */
  function svg(src, tgt, o, extra) {
    const g = o.__g || geometry(src, tgt, o);
    const u = o.unit || 24;
    const sw = (o.strokeWidth || 0.07 * u).toFixed(2);
    extra = extra || '';
    return '<path d="' + g.path + '" fill="none" stroke="' + (o.color || COLOR) + '" stroke-width="' + sw +
      '" stroke-linecap="round"' + extra + '/>' +
      '<path d="' + g.head + '" fill="' + (o.color || COLOR) + '" stroke="' + (o.color || COLOR) +
      '" stroke-width="' + (sw * 0.6).toFixed(2) + '" stroke-linejoin="round"' + extra + '/>';
  }

  /* ── layout ───────────────────────────────────────────────────── */

  function segDist(p, a, b) {
    const ab = sub(b, a), l2 = dot(ab, ab);
    const t = l2 ? Math.max(0, Math.min(1, dot(sub(p, a), ab) / l2)) : 0;
    return len(sub(p, lerp(a, b, t)));
  }
  function crosses(p, q, a, b) {
    const cr = (o, x, y) => (x[0] - o[0]) * (y[1] - o[1]) - (x[1] - o[1]) * (y[0] - o[0]);
    const d1 = cr(a, b, p), d2 = cr(a, b, q), d3 = cr(p, q, a), d4 = cr(p, q, b);
    return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0)) && d1 !== 0 && d2 !== 0;
  }
  /* signed distance from p to a box (negative inside) */
  function boxDist(p, c, w, h) {
    const dx = Math.abs(p[0] - c[0]) - w, dy = Math.abs(p[1] - c[1]) - h;
    return dx > 0 || dy > 0 ? Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) : Math.max(dx, dy);
  }
  const polyCross = (A, B) => {
    let n = 0;
    for (let i = 1; i < A.length; i++) for (let j = 1; j < B.length; j++) if (crosses(A[i - 1], A[i], B[j - 1], B[j])) n++;
    return n;
  };

  /**
   * Resolve anchors against the scene: which atom an end sits on (for its
   * label), the order of a bond, and whether a "bond" exists at all.
   *   a: { kind: 'atom', p } | { kind: 'bond', a, b }  (screen space)
   */
  function resolve(a, scene) {
    const u = scene.u;
    const find = p => {
      let best = -1, bd = 0.3 * u;
      scene.atoms.forEach((at, i) => { const dd = len(sub(at.p, p)); if (dd < bd) { bd = dd; best = i; } });
      return best;
    };
    if (a.kind === 'atom') {
      const i = find(a.p);
      return { kind: 'atom', p: a.p, box: i >= 0 ? scene.atoms[i].box : null, dot: i >= 0 ? scene.atoms[i].dot : null, ids: [i] };
    }
    const i = find(a.a), j = find(a.b);
    const bd = scene.bonds.find(b => (b.a === i && b.b === j) || (b.a === j && b.b === i));
    if (bd || i < 0 || j < 0) return { kind: 'bond', a: a.a, b: a.b, order: bd ? bd.order : 1, ids: [i, j],
      boxA: i >= 0 ? scene.atoms[i].box : null, boxB: j >= 0 ? scene.atoms[j].box : null };
    return { kind: 'form', a: a.a, b: a.b, boxA: scene.atoms[i].box, boxB: scene.atoms[j].box, ids: [i, j] };
  }

  /**
   * Place all curly arrows of one step.
   *   arrows  [{ from, to, type, side, arc, lock }] with from/to as screen
   *           anchors ({ kind: 'atom', p } | { kind: 'bond', a, b })
   *   scene   sceneFromMol(…)
   * @returns [{ src, tgt, o, g }] — draw each with svg(src, tgt, o)
   */
  function layout(arrows, scene, opts) {
    opts = opts || {};
    const u = scene.u;
    const A = arrows.map(ar => ({ ar: ar, src: resolve(ar.from, scene), tgt: resolve(ar.to, scene) }));

    // bond lines, trimmed where they run into a label
    const bondSegs = scene.bonds.map(b => {
      const P = scene.atoms[b.a], Q = scene.atoms[b.b];
      const e = unit(sub(Q.p, P.p));
      return { a: add(P.p, mul(e, edge(P.box, e))), b: sub(Q.p, mul(e, edge(Q.box, e))), order: b.order, ids: [b.a, b.b] };
    });
    const labels = scene.atoms.map((at, i) => ({ at: at, i: i })).filter(x => x.at.box);
    const verts = scene.atoms.filter(at => !at.box).map(at => at.p);

    // fishhooks that meet in one new bond are drawn as a mirror pair
    A.forEach((x, i) => {
      if (x.tgt.kind !== 'form') return;
      A.forEach((y, j) => {
        if (j > i && y.tgt.kind === 'form' && x.tgt.ids.slice().sort().join() === y.tgt.ids.slice().sort().join()) { x.mate = j; y.mate = i; }
      });
    });

    /* Arrows that hand electrons round a closed loop (a pericyclic
       transition state: each one's target shares an atom with the next
       one's source) curl outwards, away from the loop's centre. */
    const share = (p, q) => p.some(i => i >= 0 && q.indexOf(i) >= 0);
    const cyclic = A.length >= 3 && A.every(x => A.some(y => y !== x && share(x.tgt.ids, y.src.ids)) &&
      A.some(y => y !== x && share(y.tgt.ids, x.src.ids)));
    let ring = null;
    if (cyclic) {
      const cs = A.map(x => mid(centre(x.src), centre(x.tgt)));
      ring = [cs.reduce((t, p) => t + p[0], 0) / cs.length, cs.reduce((t, p) => t + p[1], 0) / cs.length];
    }

    function cost(x, idx, g, placed) {
      let s = 0;
      const S = g.samples, H = g.headPts, all = S.concat(H);
      const anchorIds = x.src.ids.concat(x.tgt.ids);
      // labels: the arrow (and its head) never runs through printed text
      labels.forEach(l => {
        all.forEach((p, k) => {
          const dd = boxDist(p, l.at.p, l.at.box.w, l.at.box.h);
          if (dd < 0.05 * u) s += (k >= S.length ? 2.5 : 1.5) * (1 + (0.05 * u - dd) / (0.1 * u));
        });
      });
      // bare carbon vertices
      verts.forEach(v => all.forEach(p => { if (len(sub(p, v)) < 0.12 * u) s += 1; }));
      // bonds: crossing one is bad, hugging one (or the 2nd line of a double bond) too
      bondSegs.forEach(b => {
        /* a bond at the atom both ends share (C–H electrons swung round
           the ring carbon into the ring) is crossed by any arrow there */
        const pivot = b.ids.some(id => id >= 0 && x.src.ids.indexOf(id) >= 0 && x.tgt.ids.indexOf(id) >= 0);
        for (let k = 1; k < S.length; k++) if (crosses(S[k - 1], S[k], b.a, b.b)) s += pivot ? 1 : 4;
        const own = b.ids.every(id => anchorIds.indexOf(id) >= 0);
        const thr = (b.order >= 3 ? 0.24 : b.order >= 2 ? 0.2 : 0.1) * u;
        let worst = 0;
        (own ? S.slice(3, -3) : all).forEach(p => { const dd = segDist(p, b.a, b.b); if (dd < thr) worst = Math.max(worst, (thr - dd) / thr); });
        H.forEach(p => { if (segDist(p, b.a, b.b) < 0.06 * u) s += 1.5; });
        s += 2 * worst;
      });
      scene.dots.forEach(dp => {
        if (dp === x.src.dot && x.ar.type === 'single') return;    // its own start
        all.forEach(p => { if (len(sub(p, dp)) < 0.16 * u) s += 1.5; });
      });
      scene.segs.forEach(sg => {
        for (let k = 1; k < S.length; k++) if (crosses(S[k - 1], S[k], sg[0], sg[1])) s += 4;
        all.forEach(p => { if (segDist(p, sg[0], sg[1]) < 0.15 * u) s += 1; });
      });
      scene.boxes.forEach(b => all.forEach(p => { if (boxDist(p, b.c, b.w, b.h) < 2) s += 1.5; }));
      // the other arrows: no crossings, heads kept apart from everything
      placed.forEach(j => {
        if (j === idx || !A[j].g) return;
        const G = A[j].g;
        s += 3.5 * polyCross(S, G.samples);
        const near = (P, Q, r) => P.some(p => Q.some(q => len(sub(p, q)) < r));
        // (two fishhooks into one new bond meet head to head on purpose)
        if (j !== x.mate && near(H, G.samples.concat(G.headPts), 0.16 * u)) s += 3;
        if (near(S, G.headPts, 0.12 * u)) s += 2;
        if (near(S.slice(4, -4), G.samples.slice(4, -4), 0.08 * u)) s += 1.5;
      });
      // a mirror pair bulges to the same side of the new bond
      if (x.mate != null && A[x.mate].g && placed.indexOf(x.mate) >= 0) {
        const e = sub(x.tgt.b, x.tgt.a), nrm = [-e[1], e[0]];
        const sa = dot(sub(g.apex, x.tgt.a), nrm), sb = dot(sub(A[x.mate].g.apex, x.tgt.a), nrm);
        if (sa * sb < 0) s += 2;
        s += 0.4 * Math.abs(g.theta - A[x.mate].g.theta) / 60;
      }
      return s;
    }

    function soft(x, v, g) {
      const c = len(sub(g.samples[g.samples.length - 1], g.start));
      const pref = preferredTheta(Math.max(c, 0.05 * u), u, x.ar.arc);
      let s = 0.5 * Math.abs(g.theta - pref) / 60;
      if ((x.ar.side < 0 ? -1 : 1) !== v.side) s += 0.35;
      if (ring) {
        const m = mid(g.start, g.end);
        if (dot(sub(g.apex, m), sub(ring, m)) > 0) s += 1.5;
      }
      s += 0.4 * Math.abs(v.skew) / 0.25 + 0.3 * Math.abs(v.phi) / 30 + 0.3 * Math.abs(v.slide - 0.5) / 0.15;
      s += 0.08 * g.length / u;
      // into a bond being formed the head runs along it, towards its middle
      if (x.tgt.kind === 'form') {
        const e = unit(sub(x.tgt.b, x.tgt.a)), m = mid(x.tgt.a, x.tgt.b);
        const want = dot(sub(m, g.end), e) >= 0 ? e : mul(e, -1);
        s += 1.2 * (1 - dot(g.dir, want));
      }
      // a fishhook from a radical needs room to be seen as an arc
      if (g.length < 0.5 * u) s += 1.5 * (0.5 * u - g.length) / u;
      return s;
    }

    function variants(x, base) {
      const lock = x.ar.lock || [];
      const sides = lock.indexOf('side') >= 0 ? [x.ar.side < 0 ? -1 : 1] : [1, -1];
      const fixedArc = typeof x.ar.arc === 'number' || lock.indexOf('arc') >= 0;
      const out = [];
      if (!base) {
        sides.forEach(side => {
          const thetas = fixedArc ? [null] : [null, 90, 120, 150, 180, 210, 240];
          thetas.forEach(th => out.push({ side: side, theta: th, skew: 0, phi: 0, slide: 0.5 }));
        });
      } else {
        const skews = [0, -0.25, 0.25];
        const phis = x.src.kind === 'atom' && !(x.src.dot && x.ar.type === 'single') ? [0, 30, -30] : [0];
        const slides = x.tgt.kind === 'bond' ? [0.5, 0.35, 0.65] : [0.5];
        skews.forEach(k => phis.forEach(ph => slides.forEach(sl => out.push(Object.assign({}, base, { skew: k, phi: ph, slide: sl })))));
      }
      return out;
    }

    function opt(x, v) {
      const o = { unit: u, side: v.side, type: x.ar.type, skew: v.skew, phi: v.phi, slide: v.slide };
      if (v.theta != null) o.theta = v.theta; else o.arc = x.ar.arc;
      return o;
    }

    function place(idx, placed) {
      const x = A[idx];
      const score = v => {
        const o = opt(x, v), g = geometry(x.src, x.tgt, o);
        return { v: v, o: o, g: g, s: cost(x, idx, g, placed) + soft(x, v, g) };
      };
      const coarse = variants(x).map(score).sort((p, q) => p.s - q.s);
      let best = coarse[0];
      coarse.slice(0, 3).forEach(c => {
        variants(x, c.v).forEach(v => { const r = score(v); if (r.s < best.s - 1e-9) best = r; });
      });
      x.o = best.o; x.g = best.g; x.s = best.s;
    }

    const order = A.map((_, i) => i);
    const placed = [];
    order.forEach(i => { place(i, placed); placed.push(i); });
    for (let pass = 0; pass < (opts.passes == null ? 2 : opts.passes); pass++) order.forEach(i => place(i, placed));

    return A.map(x => ({ src: x.src, tgt: x.tgt, o: Object.assign({ __g: x.g }, x.o), g: x.g, cost: x.s }));
  }

  root.MechArrows = { geometry, svg, layout, resolve, parseMolfile, sceneFromMol, labelBox, edge, preferredTheta, COLOR };
})(typeof window !== 'undefined' ? window : globalThis);
