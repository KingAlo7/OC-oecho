/**
 * MechArrows — the curved "electron-pushing" arrows of a reaction
 * mechanism, shared by the Ketcher tool (ketcher-mech.js) and the page
 * renderer (MolRenderer.mechanismSvg), so an arrow looks the same while
 * it is drawn and when it is shown.
 *
 * An arrow runs from a SOURCE to a TARGET, each either an atom (a lone
 * pair, or the atom that receives the electrons) or a bond (the bond's
 * electrons, or the bond being formed). It is a circular arc:
 *
 *   arc  'auto'  semicircle while the ends are close, flatter as they
 *                get further apart — the textbook look
 *        'flat'  a shallow arc, for long arrows across a molecule
 *        'deep'  always a full semicircle
 *   side  +1 / −1  which side of the line between the ends it bulges to
 *   type  'pair'   full head: an electron pair moves
 *         'single' half head ("fishhook"): one electron, radicals
 *
 * Stored data (data/mechanisms.json) names atoms and bonds by their
 * MOLFILE coordinates, so nothing depends on atom numbering:
 *   { from: { atom: [x, y] } | { bond: [[x, y], [x, y]] },
 *     to:   …same…, type, side, arc }
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
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];

  /* End point of an anchor before it is nudged off its atom or bond. */
  const centre = a => a.kind === 'bond' ? mid(a.a, a.b) : a.p;

  /**
   * @param src, tgt  { kind: 'atom', p: [x, y] } | { kind: 'bond', a: [x, y], b: [x, y] }
   * @param o  { unit, side, arc, type }
   * @returns { path, head, start, end, apex } — SVG path data
   */
  function geometry(src, tgt, o) {
    const u = o.unit || 24;
    const side = o.side < 0 ? -1 : 1;
    const c0 = centre(src), c1 = centre(tgt);
    const d = unit(sub(c1, c0));
    // left of the direction of travel on a y-down screen, flipped by side
    const n = mul([d[1], -d[0]], side);

    /* A lone pair sits beside its atom, on the side the arrow leaves by;
       bond electrons leave from the middle of the bond. The head stops
       short of a receiving atom so it does not cover its label, and
       lands beside a bond, not on it. */
    /* A close target (π bond → its own O) is reached from the side,
       like a lone pair; a distant one head-on, stopping short of it.
       A short arrow also leaves its bond from the side, so it runs
       parallel to the bond and its head turns back onto the atom. */
    const near = len(sub(c1, c0)) < 1.2 * u;
    const p0 = src.kind === 'bond'
      ? add(c0, mul(n, (near && tgt.kind === 'atom' ? 0.3 : 0.1) * u))
      : add(add(c0, mul(n, 0.3 * u)), mul(d, 0.08 * u));
    const p1 = tgt.kind === 'bond'
      ? add(c1, mul(n, 0.16 * u))
      : near
        ? add(add(c1, mul(n, 0.36 * u)), mul(d, 0.12 * u))
        : add(add(c1, mul(d, -0.34 * u)), mul(n, 0.14 * u));

    const chordV = sub(p1, p0);
    const c = Math.max(len(chordV), 0.05 * u);
    const cd = unit(chordV);
    // recompute the normal on the real chord, same side
    const nn = mul([cd[1], -cd[0]], side);

    let h;
    if (o.arc === 'flat') h = Math.min(c * 0.25, 0.35 * u);
    else if (o.arc === 'deep') h = c / 2;
    else h = Math.min(c / 2, 0.42 * u + 0.12 * c);
    h = Math.max(h, 0.12 * u);

    const R = (c * c / 4 + h * h) / (2 * h);
    const M = mid(p0, p1);
    const C = sub(M, mul(nn, R - h));
    const apex = add(M, mul(nn, h));
    // bulge left of travel on screen = clockwise = SVG sweep 1
    const sweep = side > 0 ? 1 : 0;
    const large = h > c / 2 + 1e-6 ? 1 : 0;

    /* The head is straight and the line is curved, so they can only meet
       cleanly at ONE point: where the head's base sits on the arc. The arc
       therefore ends a head-length early (point B), and the head runs on
       from B along the arc's tangent there. Putting the TIP on the arc
       instead leaves the base hanging off the curve — the kink. */
    // a tight arc gets a smaller head, or the head is as long as the arc
    const L = Math.max(0.2 * u, Math.min(0.32 * u, 0.55 * R)), W = 0.42 * L;
    const r1 = sub(p1, C);
    const back = Math.min(L / R, Math.PI / 2) * (sweep ? -1 : 1);
    const cos = Math.cos(back), sin = Math.sin(back);
    const rB = [r1[0] * cos - r1[1] * sin, r1[0] * sin + r1[1] * cos];
    const B = add(C, rB);
    // tangent at B, in the direction of travel
    const t = unit(sweep ? [-rB[1], rB[0]] : [rB[1], -rB[0]]);
    const tip = add(B, mul(t, L));
    const notch = add(B, mul(t, L * 0.25));

    const f = v => v.toFixed(2);
    // the short straight piece B → notch carries the line into the head
    const path = 'M' + f(p0[0]) + ',' + f(p0[1]) +
      ' A' + f(R) + ',' + f(R) + ' 0 ' + large + ' ' + sweep + ' ' + f(B[0]) + ',' + f(B[1]) +
      ' L' + f(notch[0]) + ',' + f(notch[1]);

    let q = [-t[1], t[0]];
    // the barb of a fishhook sits on the outside of the curve
    if (dot(q, rB) < 0) q = mul(q, -1);
    const pts = o.type === 'single'
      ? [tip, add(B, mul(q, W)), notch]
      : [tip, add(B, mul(q, W)), notch, sub(B, mul(q, W))];
    const head = 'M' + pts.map(p => f(p[0]) + ',' + f(p[1])).join(' L') + ' Z';

    return { path, head, start: p0, end: tip, apex };
  }

  /* The arrow as SVG markup. `extra` is added to both elements. */
  function svg(src, tgt, o, extra) {
    const g = geometry(src, tgt, o);
    const u = o.unit || 24;
    const sw = (o.strokeWidth || 0.07 * u).toFixed(2);
    extra = extra || '';
    return '<path d="' + g.path + '" fill="none" stroke="' + (o.color || COLOR) + '" stroke-width="' + sw +
      '" stroke-linecap="round"' + extra + '/>' +
      '<path d="' + g.head + '" fill="' + (o.color || COLOR) + '" stroke="' + (o.color || COLOR) +
      '" stroke-width="' + (sw * 0.6).toFixed(2) + '" stroke-linejoin="round"' + extra + '/>';
  }

  root.MechArrows = { geometry, svg, COLOR };
})(typeof window !== 'undefined' ? window : globalThis);
