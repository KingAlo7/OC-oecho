/**
 * lib-fischer — V2000 molfiles of open-chain metabolites in Fischer
 * projection, with phosphate drawn the biochemical way as a circled P.
 *
 * The carbon chain runs straight down (C1 on top); every inner carbon
 * carries one substituent to the left and one to the right on horizontal
 * bonds. There are no wedges: the Fischer convention itself (horizontal
 * = towards the viewer) carries the configuration.
 *
 * A phosphate group –PO3H2 is written out atom by atom (so the molfile
 * stays a correct structure) and wrapped in a superatom labelled "Ⓟ";
 * mol-renderer.js collapses it and draws a P in a circle. Terminal CH2OH,
 * CH2OⓅ, CH3 and =CH2 groups are superatoms too, as a textbook writes them.
 *
 * Chain spec, top to bottom — one entry per carbon:
 *   { top: 'CHO' | 'COOH' | 'COOP' }      C1 as an explicit carbonyl:
 *                                          =O up-right, H / OH / OⓅ up-left
 *   { group: 'CH2OH' | 'CH2OP' | 'CH3' }  terminal carbon as a label
 *   { group: 'CH2', double: true }         terminal =CH2 (double bond up)
 *   { L: 'H'|'OH'|'OP', R: ... }           inner carbon, Fischer cross
 *   { keto: true }                         inner C=O, O to the right
 *   { L: ..., R: ..., double: true }       inner carbon double-bonded to the next one
 */

const LABEL = { CH2OH: 'CH2OH', CH2OP: 'CH2OⓅ', CH3: 'CH3', CH2: 'CH2' };

function build(chain) {
  const atoms = [], bonds = [], groups = [];
  const add = (el, x, y) => { atoms.push({ el, x, y }); return atoms.length; };
  const bond = (a, b, order = 1) => bonds.push([a, b, order]);

  // –P(=O)(OH)2 on oxygen `o` at (x, y); the group's own oxygens get
  // distinct spots so every atom keeps unique coordinates.
  const phosphate = (o, x, y) => {
    const p = add('P', x, y);
    const o1 = add('O', x + 0.31, y + 0.37), o2 = add('O', x + 0.37, y - 0.31), o3 = add('O', x - 0.33, y - 0.35);
    bond(o, p); bond(p, o1, 2); bond(p, o2); bond(p, o3);
    groups.push({ label: 'Ⓟ', atoms: [p, o1, o2, o3], anchor: p });
  };
  // a substituent on carbon c, pointing in direction (dx, dy)
  const sub = (c, kind, x, y, dx, dy) => {
    if (!kind) return;
    if (kind === 'H') { bond(c, add('H', x + dx, y + dy)); return; }
    const o = add('O', x + dx, y + dy);
    bond(c, o);
    if (kind === 'OP') phosphate(o, x + 2 * dx, y + 2 * dy);
  };

  let prev = 0, prevDouble = false;
  chain.forEach((s, i) => {
    const y = -i, x = 0;
    if (s.group) {
      // the whole terminal group is one label, written out in full
      const c = add('C', x, y);
      const members = [c];
      if (s.group === 'CH2OH' || s.group === 'CH2OP') {
        // place the oxygen off to the side; it is hidden in the label
        const o = add('O', x + 0.41, y - 0.43);
        bond(c, o);
        members.push(o);
        if (s.group === 'CH2OP') {
          const before = groups.length;
          phosphate(o, x + 0.83, y - 0.79);
          members.push(...groups.splice(before, 1)[0].atoms);
        }
      }
      groups.push({ label: LABEL[s.group], atoms: members, anchor: c });
      if (prev) bond(prev, c, s.double || prevDouble ? 2 : 1);
      prev = c; prevDouble = false;
      return;
    }
    const c = add('C', x, y);
    if (prev) bond(prev, c, prevDouble ? 2 : 1);
    if (s.top) {
      bond(c, add('O', x + 0.866, y + 0.5), 2);
      sub(c, s.top === 'CHO' ? 'H' : s.top === 'COOH' ? 'OH' : 'OP', x, y, -0.866, 0.5);
    } else if (s.keto) {
      bond(c, add('O', x + 1, y), 2);
    } else {
      sub(c, s.L, x, y, -1, 0);
      sub(c, s.R, x, y, 1, 0);
    }
    prev = c; prevDouble = !!s.double;
  });

  return write(atoms, bonds, groups);
}

function write(atoms, bonds, groups) {
  const f = (v, w, d) => v.toFixed(d).padStart(w);
  const n3 = v => String(v).padStart(3);
  const L = ['', '  OC-oecho Fischer', ''];
  L.push(n3(atoms.length) + n3(bonds.length) + '  0  0  0  0  0  0  0  0999 V2000');
  atoms.forEach(a => L.push(f(a.x, 10, 4) + f(a.y, 10, 4) + f(0, 10, 4) + ' ' + a.el.padEnd(3) + ' 0  0  0  0  0  0  0  0  0  0  0  0'));
  bonds.forEach(([a, b, o]) => L.push(n3(a) + n3(b) + n3(o) + '  0'));
  groups.forEach((g, i) => {
    const n = i + 1;
    L.push('M  STY  1 ' + n3(n) + ' SUP');
    for (let k = 0; k < g.atoms.length; k += 15) {
      const part = g.atoms.slice(k, k + 15);
      L.push('M  SAL ' + n3(n) + n3(part.length) + part.map(a => ' ' + n3(a)).join(''));
    }
    L.push('M  SMT ' + n3(n) + ' ' + g.label);
    L.push('M  SAP ' + n3(n) + '  1' + ' ' + n3(g.anchor) + ' ' + n3(0) + ' 1 ');
  });
  L.push('M  END');
  return L.join('\n') + '\n';
}

module.exports = { build };
