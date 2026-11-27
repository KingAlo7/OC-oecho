#!/usr/bin/env node
/**
 * Counts how often the curly arrows in data/mechanisms.json clip into
 * things: atom labels, bond lines, radical dots, reaction arrows / texts,
 * and each other.
 *
 *   node tools/arrow-audit.js            current mech-arrows.js (with layout)
 *   node tools/arrow-audit.js --old      mech-arrows.js as committed in HEAD,
 *                                        arrows as stored (no layout)
 *   node tools/arrow-audit.js --list=20  also print the worst steps
 *   WHY=1 node tools/arrow-audit.js      name the label / bond each hit is on
 *
 * The test is deliberately independent of layout()'s cost function: it
 * only looks at the drawn line + head against hard obstacles.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const old = process.argv.includes('--old');
const listN = +((process.argv.find(a => a.startsWith('--list=')) || '').split('=')[1] || 0);

// the scene model always comes from the current file
require(path.join(ROOT, 'mech-arrows.js'));
const CUR = globalThis.MechArrows;
let DRAW = CUR;
if (old) {
  const src = execSync('git show HEAD:mech-arrows.js', { cwd: ROOT, encoding: 'utf8' });
  const sandbox = {};
  new Function('globalThis', 'window', src)(sandbox, undefined);
  DRAW = sandbox.MechArrows;
}

/* sample an SVG path made of M / L / C / A commands */
function samplePath(d, n) {
  const tok = d.match(/[MLCA]|-?[\d.]+(?:e-?\d+)?/g);
  const out = [];
  let i = 0, cur = [0, 0];
  const num = () => +tok[i++];
  while (i < tok.length) {
    const c = tok[i++];
    if (c === 'M') { cur = [num(), num()]; out.push(cur); }
    else if (c === 'L') { const p = [num(), num()]; for (let k = 1; k <= 3; k++) out.push([cur[0] + (p[0] - cur[0]) * k / 3, cur[1] + (p[1] - cur[1]) * k / 3]); cur = p; }
    else if (c === 'C') {
      const P = [cur, [num(), num()], [num(), num()], [num(), num()]];
      for (let k = 1; k <= n; k++) {
        const t = k / n, s = 1 - t;
        out.push([0, 1].map(j => s * s * s * P[0][j] + 3 * s * s * t * P[1][j] + 3 * s * t * t * P[2][j] + t * t * t * P[3][j]));
      }
      cur = P[3];
    } else if (c === 'A') {
      const rx = num(); num(); num(); const large = num(), sweep = num(); const p = [num(), num()];
      // endpoint → centre parametrisation (circle)
      const mx = (cur[0] - p[0]) / 2, my = (cur[1] - p[1]) / 2;
      const r = Math.max(rx, Math.hypot(mx, my));
      let f = Math.sqrt(Math.max(0, (r * r - mx * mx - my * my) / (mx * mx + my * my)));
      if (large === sweep) f = -f;
      const cx = f * my + (cur[0] + p[0]) / 2, cy = -f * mx + (cur[1] + p[1]) / 2;
      let a0 = Math.atan2(cur[1] - cy, cur[0] - cx), a1 = Math.atan2(p[1] - cy, p[0] - cx);
      let da = a1 - a0;
      if (sweep && da < 0) da += 2 * Math.PI;
      if (!sweep && da > 0) da -= 2 * Math.PI;
      for (let k = 1; k <= n; k++) { const a = a0 + da * k / n; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
      cur = p;
    }
  }
  return out;
}
const headPts = d => (d.match(/-?[\d.]+/g) || []).map(Number).reduce((a, v, k, arr) => (k % 2 ? a : a.concat([[v, arr[k + 1]]])), []);

const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const len = p => Math.hypot(p[0], p[1]);
function segDist(p, a, b) {
  const ab = sub(b, a), l2 = ab[0] * ab[0] + ab[1] * ab[1];
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / l2)) : 0;
  return len(sub(p, [a[0] + ab[0] * t, a[1] + ab[1] * t]));
}
function crosses(p, q, a, b) {
  const cr = (o, x, y) => (x[0] - o[0]) * (y[1] - o[1]) - (x[1] - o[1]) * (y[0] - o[0]);
  const d1 = cr(a, b, p), d2 = cr(a, b, q), d3 = cr(p, q, a), d4 = cr(p, q, b);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}
const inBox = (p, c, w, h) => Math.abs(p[0] - c[0]) < w && Math.abs(p[1] - c[1]) < h;
// labelBox() keeps a margin round the text; the audit wants the ink
// (a capital is about 0.21 bond lengths half high, 0.04 narrower)
const ink = (p, a) => a.box && inBox(p, a.p, a.box.w - 0.04 * U, 0.22 * U);

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'mechanisms.json'), 'utf8'));
const U = 24;
const map = p => [p[0] * U, -p[1] * U];
const anchor = a => a.bond ? { kind: 'bond', a: map(a.bond[0]), b: map(a.bond[1]) } : { kind: 'atom', p: map(a.atom) };

const tot = { arrows: 0, label: 0, bond: 0, pivot: 0, dot: 0, other: 0, arrowX: 0, head: 0, dirty: 0 };
const worst = [];
let ms = 0;
Object.keys(data).forEach(id => {
  const steps = (data[id] && data[id].steps) || (Array.isArray(data[id]) ? data[id] : []);
  steps.forEach((step, si) => {
    if (!step.curly || !step.mol) return;
    const mol = CUR.parseMolfile(step.mol);
    const scene = CUR.sceneFromMol(mol, map, U, step);
    let drawn;
    const t0 = Date.now();
    if (old) {
      drawn = step.curly.map(c => DRAW.geometry(anchor(c.from), anchor(c.to), { unit: U, side: c.side, arc: c.arc, type: c.type }));
    } else {
      drawn = DRAW.layout(step.curly.map(c => Object.assign({}, c, { from: anchor(c.from), to: anchor(c.to) })), scene).map(r => r.g);
    }
    ms += Date.now() - t0;
    const geo = drawn.map(g => ({ S: samplePath(g.path, 16), H: headPts(g.head) }));
    const segs = scene.bonds.map(b => {
      const P = scene.atoms[b.a], Q = scene.atoms[b.b];
      const e = sub(Q.p, P.p), l = len(e) || 1, v = [e[0] / l, e[1] / l];
      return [[P.p[0] + v[0] * CUR.edge(P.box, v), P.p[1] + v[1] * CUR.edge(P.box, v)],
        [Q.p[0] - v[0] * CUR.edge(Q.box, v), Q.p[1] - v[1] * CUR.edge(Q.box, v)], b.a, b.b];
    });
    const c = { label: 0, bond: 0, pivot: 0, dot: 0, other: 0, arrowX: 0, head: 0 };
    // atoms an arrow's two ends sit on (or next to)
    const near = a => { let best = -1, bd = 0.3 * U; scene.atoms.forEach((at, k) => { const d = len(sub(at.p, a)); if (d < bd) { bd = d; best = k; } }); return best; };
    const ids = a => a.bond ? [near(map(a.bond[0])), near(map(a.bond[1]))] : [near(map(a.atom))];
    geo.forEach((g, i) => {
      const si = ids(step.curly[i].from), ti = ids(step.curly[i].to);
      const all = g.S.concat(g.H);
      tot.arrows++;
      const lab = scene.atoms.map((a, k) => k).filter(k => all.some(p => ink(p, scene.atoms[k])));
      if (lab.length) { c.label++; if (process.env.WHY) console.log('label', id, si + 1, i, lab.map(k => mol.atoms[k].alias || mol.atoms[k].sym).join()); }
      /* A bond at the atom both ends share (C–H electrons swung round
         the ring carbon into the ring) can't be avoided: counted apart. */
      const hit = segs.filter(s => g.S.some((p, k) => k && crosses(g.S[k - 1], p, s[0], s[1])) || g.H.some(p => segDist(p, s[0], s[1]) < 0.04 * U));
      const pivot = s => si.some(a => ti.indexOf(a) >= 0 && (s[2] === a || s[3] === a));
      if (hit.some(s => !pivot(s))) { c.bond++; if (process.env.WHY) console.log(id, si + 1, i, hit.map(s => s[2] + "-" + s[3]).join()); } else if (hit.length) c.pivot++;
      // (a fishhook may start at its own radical's dot)
      if (scene.dots.some(d => len(sub(g.S[0], d)) > 0.2 * U && all.some(p => len(sub(p, d)) < 0.1 * U))) c.dot++;
      if (scene.segs.some(s => all.some(p => segDist(p, s[0], s[1]) < 0.1 * U)) ||
        scene.boxes.some(b => all.some(p => inBox(p, b.c, b.w, b.h)))) c.other++;
      geo.forEach((h, j) => {
        if (j <= i) return;
        // two fishhooks into the same new bond meet head to head on purpose
        const ci = step.curly[i], cj = step.curly[j];
        const mates = ci.type === 'single' && cj.type === 'single' && ci.to.bond && cj.to.bond &&
          JSON.stringify(ci.to.bond.slice().sort()) === JSON.stringify(cj.to.bond.slice().sort());
        if (g.S.some((p, k) => k && h.S.some((q, m) => m && crosses(g.S[k - 1], p, h.S[m - 1], q)))) c.arrowX++;
        if (!mates && g.H.some(p => h.S.concat(h.H).some(q => len(sub(p, q)) < 0.1 * U)) ||
          h.H.some(p => g.S.some(q => len(sub(p, q)) < 0.1 * U))) c.head++;
      });
    });
    const n = c.label + c.bond + c.dot + c.other + c.arrowX + c.head;
    Object.keys(c).forEach(k => { tot[k] += c[k]; });
    if (n) { tot.dirty++; worst.push({ n, id, si, c }); }
  });
});

console.log((old ? 'OLD (HEAD, stored sides)' : 'NEW (layout)') + ' — ' + tot.arrows + ' arrows, ' + ms + ' ms');
console.log('  arrows into a label      ' + tot.label);
console.log('  arrows crossing a bond   ' + tot.bond);
console.log('  …round a shared atom     ' + tot.pivot + '  (unavoidable, not counted below)');
console.log('  arrows on a radical dot  ' + tot.dot);
console.log('  arrows on rxn arrow/text ' + tot.other);
console.log('  arrow pairs crossing     ' + tot.arrowX);
console.log('  head too close to arrow  ' + tot.head);
console.log('  steps with any problem   ' + tot.dirty);
if (listN) worst.sort((a, b) => b.n - a.n).slice(0, listN).forEach(w => console.log('   ' + w.n + '  ' + w.id + ' #' + (w.si + 1) + ' ' + JSON.stringify(w.c)));
