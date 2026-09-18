/**
 * Minimal MOL V2000 / RXN V2000 builder for the reaction library.
 *
 * Why hand-built coordinates: a reaction library is only useful if the
 * same functional group sits in the same place in every entry — the eye
 * should be able to jump between "SN2" and "E2" and see instantly what
 * differs. Letting a layout engine invent coordinates from SMILES gives
 * a different orientation per entry, so every structure here is placed
 * explicitly on a 30° grid.
 *
 * Drawing convention, applied throughout (see ORIENTATION in
 * build-reaction-library.js):
 *   · main chain runs left → right as a zig-zag, first step upwards
 *   · the generic rest (R₁ / Ar) sits at the LEFT end
 *   · the reacting group sits at the RIGHT end
 *   · C=O points straight UP
 *   · the product reuses the reactant's coordinates, so only the change moves
 */

const B  = 1.0;                       // bond length in molfile units
const DX = Math.cos(Math.PI / 6) * B; // 0.8660 — horizontal step of a zig-zag
const DY = Math.sin(Math.PI / 6) * B; // 0.5000 — vertical step of a zig-zag

const f4  = n => (Math.abs(n) < 1e-9 ? 0 : n).toFixed(4).padStart(10, ' ');
const i3  = n => String(n).padStart(3, ' ');
const i4  = n => String(n).padStart(4, ' ');

class Mol {
  constructor(title) {
    this.title   = title || '';
    this.atoms   = [];   // { x, y, sym, alias, rgp }
    this.bonds   = [];   // { a, b, order, stereo }
  }

  /* Add an atom, return its index. `opts.alias` prints a generic label
     ("X", "Nu", "R₁"); `opts.rgp` writes a real molfile R-group. */
  add(x, y, sym, opts) {
    opts = opts || {};
    this.atoms.push({ x, y, sym: sym || 'C', alias: opts.alias || null,
                      rgp: opts.rgp || null, charge: opts.charge || 0 });
    return this.atoms.length - 1;
  }

  /* order: 1 single, 2 double, 3 triple.
     stereo: 1 wedge (up), 6 hash (down) — from atom a. */
  bond(a, b, order, stereo) {
    this.bonds.push({ a, b, order: order || 1, stereo: stereo || 0 });
    return this;
  }

  /* Formal charge on an existing atom, written as an "M  CHG" line. */
  charge(i, q) { this.atoms[i].charge = q; return this; }

  /* A generic substituent drawn as a plain atom carrying a text label. */
  gen(x, y, label) { return this.add(x, y, 'C', { alias: label }); }

  /* A zig-zag carbon chain of `n` atoms starting at (x0,y0).
     `up` sets whether the first step rises. Returns the atom indices. */
  chain(n, x0, y0, up, sym) {
    const idx = [];
    let x = x0, y = y0, rising = up !== false;
    for (let k = 0; k < n; k++) {
      idx.push(this.add(x, y, sym || 'C'));
      x += DX;
      y += rising ? DY : -DY;
      rising = !rising;
    }
    for (let k = 1; k < idx.length; k++) this.bond(idx[k - 1], idx[k], 1);
    return idx;
  }

  /* The next zig-zag position after atom `i`, continuing the chain. */
  step(i, up, dx) { const a = this.atoms[i]; return [a.x + (dx == null ? DX : dx), a.y + (up ? DY : -DY)]; }

  /* A benzene ring as a Kekulé hexagon with vertices at 30°,90°,…,330°:
     a NODE at the top and at the bottom, vertical bonds on the left and
     right flanks. This is the orientation the ÖChO sheets use, and it is
     the one that makes ortho/meta/para easy to read off.

     Returns the six indices counter-clockwise starting at 30° (upper
     right). With that indexing, ring[0] and ring[3] are para, ring[1]
     and ring[5] are the two ortho positions to ring[0], and ring[2]/
     ring[4] are meta to it. */
  benzene(cx, cy, r) {
    r = r || B;
    const idx = [];
    for (let k = 0; k < 6; k++) {
      const a = (k * 60 + 30) * Math.PI / 180;
      idx.push(this.add(cx + r * Math.cos(a), cy + r * Math.sin(a), 'C'));
    }
    for (let k = 0; k < 6; k++) this.bond(idx[k], idx[(k + 1) % 6], k % 2 === 0 ? 2 : 1);
    idx.cx = cx; idx.cy = cy; idx.r = r;
    return idx;
  }

  /* Where a substituent on ring atom `i` belongs: `dist` further along
     the ray from the ring centre through that atom. A substituent drawn
     any other way sits at a kinked, non-radial angle to the ring. */
  radial(cx, cy, i, dist) {
    const a = this.atoms[i];
    const dx = a.x - cx, dy = a.y - cy;
    const d = Math.hypot(dx, dy) || 1;
    return [a.x + dx / d * (dist == null ? B : dist),
            a.y + dy / d * (dist == null ? B : dist)];
  }

  /* Third vertex of the equilateral triangle sitting on bond i–j —
     an epoxide O, a cyclopropane CH₂. `side` > 0 puts it left of the
     i→j direction, < 0 right of it. The apex has to be found FROM THE
     BOND, not by moving straight up from its midpoint: the 60° angles
     are relative to the bond, not to the page. */
  apex(i, j, side) {
    const a = this.atoms[i], b = this.atoms[j];
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const h = Math.sqrt(3) / 2 * len * (side < 0 ? -1 : 1);
    return [mx - dy / len * h, my + dx / len * h];
  }

  /* A run of `n` atoms on ONE straight line from (x0,y0) heading `deg`.
     sp-hybridised carbon is linear, so a C≡C and both its neighbours
     must share a single 180° axis. */
  line(n, x0, y0, deg, sym) {
    const a = (deg || 0) * Math.PI / 180;
    const ux = Math.cos(a) * B, uy = Math.sin(a) * B;
    const idx = [];
    for (let k = 0; k < n; k++) idx.push(this.add(x0 + ux * k, y0 + uy * k, sym || 'C'));
    return idx;
  }

  /* A saturated ring of `n` atoms with side length B.

     `a0` is the angle of vertex 0 and defaults so that the ring always
     has a NODE AT THE BOTTOM — the orientation the ÖChO sheets use and
     the one that keeps fused systems readable. For a six-ring that also
     puts a node at the top and vertical bonds on both flanks, matching
     `benzene()`; there, vertex 0 is the upper-right one (30°).

     Returns the indices counter-clockwise from vertex 0, with .cx/.cy/.r
     attached so `radial()` can hang substituents off it. */
  ring(n, cx, cy, opts) {
    opts = opts || {};
    const r = opts.r || (B / (2 * Math.sin(Math.PI / n)));
    const a0 = opts.a0 != null ? opts.a0 : (n === 6 ? 30 : 270);
    const idx = [];
    for (let k = 0; k < n; k++) {
      const a = (a0 + k * 360 / n) * Math.PI / 180;
      idx.push(this.add(cx + r * Math.cos(a), cy + r * Math.sin(a), opts.sym || 'C'));
    }
    for (let k = 0; k < n; k++) this.bond(idx[k], idx[(k + 1) % n], 1);
    idx.cx = cx; idx.cy = cy; idx.r = r;
    return idx;
  }

  /* Fuse a fresh n-membered ring onto the existing bond i–j.

     The two shared atoms stay where they are; the new ring's centre is
     found on the perpendicular bisector of that bond, pushed to the side
     AWAY from the atoms already present, so the rings do not overlap.
     Returns the n-2 newly created indices, ordered walking from i away
     from j round to j.

     `opts.bond` gives the order of the new ring's bonds (default 1);
     `opts.close` false leaves the last bond to j to the caller. */
  fuse(i, j, n, opts) {
    opts = opts || {};
    const A = this.atoms[i], C = this.atoms[j];
    const mx = (A.x + C.x) / 2, my = (A.y + C.y) / 2;
    const dx = C.x - A.x, dy = C.y - A.y;
    const len = Math.hypot(dx, dy) || B;
    const rr = len / (2 * Math.sin(Math.PI / n));
    const ap = Math.sqrt(Math.max(0, rr * rr - (len / 2) * (len / 2)));

    // Two candidate centres; keep the one further from everything else.
    const cand = [[mx - dy / len * ap, my + dx / len * ap],
                  [mx + dy / len * ap, my - dx / len * ap]];
    const others = this.atoms.filter((_, k) => k !== i && k !== j);
    const score = c => others.reduce((acc, a) =>
      acc + Math.min(9, Math.hypot(a.x - c[0], a.y - c[1])), 0);
    const ctr = others.length ? (score(cand[0]) >= score(cand[1]) ? cand[0] : cand[1]) : cand[0];

    // Walk round the ring starting at i, in whichever direction does NOT
    // immediately land on j.
    const angOf = a => Math.atan2(a.y - ctr[1], a.x - ctr[0]);
    const a0 = angOf(A), step = 2 * Math.PI / n;
    const toJ = angOf(C);
    const norm = t => Math.atan2(Math.sin(t), Math.cos(t));
    const dir = Math.abs(norm(a0 + step - toJ)) < 1e-6 ? -1 : +1;

    const made = [];
    for (let k = 1; k <= n - 2; k++) {
      const t = a0 + dir * step * k;
      made.push(this.add(ctr[0] + rr * Math.cos(t), ctr[1] + rr * Math.sin(t), opts.sym || 'C'));
    }
    const order = opts.bond || 1;
    this.bond(i, made[0], order);
    for (let k = 1; k < made.length; k++) this.bond(made[k - 1], made[k], order);
    if (opts.close !== false) this.bond(made[made.length - 1], j, order);
    made.cx = ctr[0]; made.cy = ctr[1]; made.r = rr;
    return made;
  }

  /* Carbonyl oxygen straight above atom `i` — the house style. */
  oxo(i) {
    const a = this.atoms[i];
    const o = this.add(a.x, a.y + B, 'O');
    this.bond(i, o, 2);
    return o;
  }

  /* Translate every atom, for placing a fragment. */
  shift(dx, dy) { this.atoms.forEach(a => { a.x += dx; a.y += dy; }); return this; }

  toMolfile() {
    const L = [];
    L.push('');                       // line 1: title (kept blank, OCL ignores it)
    L.push('  OC-oecho');             // line 2: program
    L.push('');                       // line 3: comment
    L.push(i3(this.atoms.length) + i3(this.bonds.length) +
           '  0  0  0  0            999 V2000');
    for (const a of this.atoms) {
      const sym = a.rgp ? 'R#' : a.sym;
      L.push(f4(a.x) + f4(a.y) + f4(0) + ' ' + sym.padEnd(3, ' ') +
             ' 0  0  0  0  0  0  0  0  0  0  0  0');
    }
    for (const b of this.bonds) {
      L.push(i3(b.a + 1) + i3(b.b + 1) + i3(b.order) + i3(b.stereo));
    }
    // Atom aliases: the two-line "A <n> / <label>" form Ketcher writes.
    this.atoms.forEach((a, i) => { if (a.alias) { L.push('A  ' + i3(i + 1)); L.push(a.alias); } });
    const rg = this.atoms.map((a, i) => [i, a.rgp]).filter(p => p[1]);
    if (rg.length) {
      L.push('M  RGP' + i3(rg.length) + rg.map(p => i4(p[0] + 1) + i4(p[1])).join(''));
    }
    const ch = this.atoms.map((a, i) => [i, a.charge]).filter(p => p[1]);
    if (ch.length) {
      L.push('M  CHG' + i3(ch.length) + ch.map(p => i4(p[0] + 1) + i4(p[1])).join(''));
    }
    L.push('M  END');
    return L.join('\n');
  }
}

/* Stitch component molecules into one RXN V2000 file, exactly as the
   admin editor does, so a library entry can be reopened and edited. */
function rxn(reactants, products) {
  const all = reactants.concat(products);
  return '$RXN\n\n  OC-oecho\n\n' +
    i3(reactants.length) + i3(products.length) + '\n' +
    all.map(m => '$MOL\n' + m.toMolfile()).join('\n') + '\n';
}

module.exports = { Mol, rxn, B, DX, DY };
