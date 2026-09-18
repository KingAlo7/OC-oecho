#!/usr/bin/env node
/**
 * Builds data/reactions.json — the reaction library.
 *
 * Scope: every named reaction, plus every unnamed but clearly
 * distinguishable reaction type, that occurs in the ÖChO quizzes in
 * data/questions.json (LW/BW 2013–2026).
 *
 * Each entry is the MOST GENERAL form of the reaction: R₁, R₂, … for
 * carbon rests, Ar for aryl, X for halogen, Nu for nucleophile, E for
 * electrophile. What those placeholders may stand for is spelled out in
 * `substituents`, which the reference renders under the scheme.
 *
 * ORIENTATION — the same for every entry, so the eye can compare:
 *   · main chain horizontal, zig-zag, left → right, first step up
 *   · the generic rest (R₁ / Ar) at the LEFT end
 *   · the reacting centre at the RIGHT end
 *   · C=O drawn straight UP
 *   · the product reuses the reactant's coordinates wherever the skeleton
 *     is unchanged, so only the transformation itself moves
 *
 * Run:  node tools/build-reaction-library.js
 */

const fs = require('fs');
const path = require('path');
const { Mol, rxn, B, DX, DY } = require('./lib-molbuilder.js');

const OUT = path.join(__dirname, '..', 'data', 'reactions.json');
const library = [];

/* Register one entry. `rx` is {reactants:[Mol], products:[Mol]}. */
function R(spec) {
  const e = {
    id: spec.id,
    category: spec.category,
    name: spec.name,
    difficulty: spec.difficulty,
  };
  if (spec.reaktionstyp)   e.reaktionstyp = spec.reaktionstyp;
  if (spec.transformation) e.transformation = spec.transformation;
  e.reaction_rxn = rxn(spec.rx.reactants, spec.rx.products);
  if (spec.above) e.reagent_label = spec.above;
  if (spec.below) e.reagent_label_below = spec.below;
  if (spec.conditions)     e.conditions = spec.conditions;
  if (spec.stereochemistry) e.stereochemistry = spec.stereochemistry;
  if (spec.substituents)   e.substituents = spec.substituents;
  if (spec.key_points)     e.key_points = spec.key_points;
  if (spec.seen_in)        e.seen_in = spec.seen_in;
  library.push(e);
}

/* ── Shared fragment builders ─────────────────────────────────────── */

/* R₁–CH₂–Y : a primary centre. Returns { m, r, c, y }. */
function prim(m, x0, y0, leftLabel, ySym, yLabel) {
  const r = m.gen(x0, y0, leftLabel);
  const c = m.add(x0 + DX, y0 + DY, 'C');
  const y = yLabel ? m.gen(x0 + 2 * DX, y0, yLabel) : m.add(x0 + 2 * DX, y0, ySym);
  m.bond(r, c, 1); m.bond(c, y, 1);
  return { r, c, y };
}

/* A tertiary centre: C bearing R₁, R₂, R₃ and a leaving group to the right. */
function tert(m, x0, y0, ySym, yLabel) {
  const c  = m.add(x0, y0, 'C');
  const r1 = m.gen(x0 - DX, y0 + DY, 'R₁');
  const r2 = m.gen(x0 - DX, y0 - DY, 'R₂');
  const r3 = m.gen(x0, y0 + B, 'R₃');
  const y  = yLabel ? m.gen(x0 + DX, y0 - DY, yLabel) : m.add(x0 + DX, y0 - DY, ySym);
  m.bond(c, r1, 1); m.bond(c, r2, 1); m.bond(c, r3, 1); m.bond(c, y, 1);
  return { c, r1, r2, r3, y };
}

/* A carbonyl compound R₁–C(=O)–Z drawn with the C=O pointing up.
   `zLabel`/`zSym` is what hangs off the right: H (aldehyde), R₂ (ketone),
   OH (acid), Cl (acid chloride), OR₂ (ester)… Returns { c, o, r, z }. */
function carbonyl(m, x0, y0, leftLabel, opts) {
  opts = opts || {};
  const r = leftLabel ? m.gen(x0, y0, leftLabel) : null;
  const c = m.add(x0 + DX, y0 + DY, 'C');
  const o = m.add(x0 + DX, y0 + DY + B, 'O');
  if (r !== null) m.bond(r, c, 1);
  m.bond(c, o, 2);
  let z = null;
  if (opts.zLabel) { z = m.gen(x0 + 2 * DX, y0, opts.zLabel); m.bond(c, z, 1); }
  else if (opts.zSym) { z = m.add(x0 + 2 * DX, y0, opts.zSym); m.bond(c, z, 1); }
  return { r, c, o, z };
}

/* A generic alkene R₁–CH=CH–R₂ lying along the zig-zag. */
function alken(m, x0, y0, l1, l2) {
  const r1 = l1 ? m.gen(x0, y0, l1) : null;
  const c1 = m.add(x0 + DX, y0 + DY, 'C');
  const c2 = m.add(x0 + 2 * DX, y0, 'C');
  const r2 = l2 ? m.gen(x0 + 3 * DX, y0 + DY, l2) : null;
  if (r1 !== null) m.bond(r1, c1, 1);
  m.bond(c1, c2, 2);
  if (r2 !== null) m.bond(c2, r2, 1);
  return { r1, c1, c2, r2 };
}

/* A generic alkyne R₁–C≡C–R₂. sp-Kohlenstoff ist linear, also liegen
   R₁, beide C und R₂ auf EINER Geraden (180°) — kein Zickzack. */
function alkin(m, x0, y0, l1, l2) {
  const r1 = m.gen(x0, y0, l1);
  const c1 = m.add(x0 + B, y0, 'C');
  const c2 = m.add(x0 + 2 * B, y0, 'C');
  const r2 = l2 ? m.gen(x0 + 3 * B, y0, l2) : null;
  m.bond(r1, c1, 1); m.bond(c1, c2, 3);
  if (r2 !== null) m.bond(c2, r2, 1);
  return { r1, c1, c2, r2 };
}

/* A benzene ring centred at (cx,cy). Vertex 0 points right, 3 points left. */
function aryl(m, cx, cy) { return m.benzene(cx, cy, B); }

/* Solitary small reagent molecules that appear beside the arrow. */
function single(sym, label) {
  const m = new Mol();
  if (label) m.gen(0, 0, label); else m.add(0, 0, sym);
  return m;
}

/* ── Load the reaction modules ────────────────────────────────────── */

const ctx = { R, Mol, prim, tert, carbonyl, aryl, alken, alkin, single, B, DX, DY };

const modules = fs.readdirSync(__dirname)
  .filter(f => /^lib-rx-\d+.*\.js$/.test(f))
  .sort();

for (const f of modules) require(path.join(__dirname, f))(ctx);

/* ── Geometry checks ──────────────────────────────────────────────────
 * Coordinates are written by hand, so the things that are easy to get
 * wrong get asserted rather than eyeballed:
 *   · every bond is exactly one bond length (a stray 0.866 means an
 *     atom was placed on the zig-zag grid when it should not have been)
 *   · sp-hybridised centres are linear — a C≡C or C≡N and its two
 *     neighbours share one 180° axis
 *   · three-rings are equilateral (the epoxide O has to be found FROM
 *     the C–C bond, not by moving straight up from its midpoint)
 * ─────────────────────────────────────────────────────────────────── */

function parseMol(mol) {
  const L = mol.split('\n');
  const nA = parseInt(L[3].slice(0, 3), 10), nB = parseInt(L[3].slice(3, 6), 10);
  const atoms = L.slice(4, 4 + nA).map(l => ({
    x: +l.slice(0, 10), y: +l.slice(10, 20), sym: l.slice(31, 34).trim()
  }));
  const bonds = L.slice(4 + nA, 4 + nA + nB).map(l => ({
    a: +l.slice(0, 3) - 1, b: +l.slice(3, 6) - 1, order: +l.slice(6, 9)
  }));
  return { atoms, bonds };
}

const dist  = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
const angle = (c, p, q) => {
  const v1 = [p.x - c.x, p.y - c.y], v2 = [q.x - c.x, q.y - c.y];
  const d = Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]);
  return Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / d))) * 180 / Math.PI;
};

function checkGeometry(entry) {
  const problems = [];
  const blocks = entry.reaction_rxn.split('$MOL').slice(1)
    .map(b => b.replace(/^\r?\n/, ''));
  blocks.forEach((block, ci) => {
    const { atoms, bonds } = parseMol(block);
    const where = entry.id + ' [Komponente ' + (ci + 1) + ']';

    // Every atom must be bonded to something: a leftover label with no
    // bond renders as a stray "R₁" floating beside the structure.
    const bonded = new Set();
    for (const bo of bonds) { bonded.add(bo.a); bonded.add(bo.b); }
    if (atoms.length > 1) {
      atoms.forEach((at, i) => {
        if (!bonded.has(i)) problems.push(where + ': Atom ' + (i + 1) + ' (' + at.sym + ') hat keine Bindung');
      });
    }

    // No two atoms may sit on the same spot.
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        if (dist(atoms[i], atoms[j]) < 0.05) {
          problems.push(where + ': Atome ' + (i + 1) + ' und ' + (j + 1) + ' liegen übereinander');
        }
      }
    }

    for (const bo of bonds) {
      const d = dist(atoms[bo.a], atoms[bo.b]);
      if (Math.abs(d - B) > 0.02) {
        problems.push(where + ': Bindungslänge ' + d.toFixed(3) + ' statt ' + B.toFixed(3));
      }
    }

    for (const bo of bonds) {
      if (bo.order !== 3) continue;
      for (const [centre, far] of [[bo.a, bo.b], [bo.b, bo.a]]) {
        for (const nb of bonds) {
          if (nb === bo) continue;
          if (nb.a !== centre && nb.b !== centre) continue;
          const other = nb.a === centre ? nb.b : nb.a;
          const ang = angle(atoms[centre], atoms[far], atoms[other]);
          if (Math.abs(ang - 180) > 1) {
            problems.push(where + ': Dreifachbindung nicht linear (' + ang.toFixed(1) + '°)');
          }
        }
      }
    }

    // Three-membered rings must be equilateral.
    for (let i = 0; i < bonds.length; i++) {
      for (let j = i + 1; j < bonds.length; j++) {
        const s = new Set([bonds[i].a, bonds[i].b, bonds[j].a, bonds[j].b]);
        if (s.size !== 3) continue;
        const [p, q, r] = [...s];
        const closes = bonds.some(b2 => {
          const t = new Set([b2.a, b2.b]);
          return s.has(b2.a) && s.has(b2.b) &&
                 b2 !== bonds[i] && b2 !== bonds[j] && t.size === 2;
        });
        if (!closes) continue;
        for (const ang of [angle(atoms[p], atoms[q], atoms[r]),
                           angle(atoms[q], atoms[p], atoms[r]),
                           angle(atoms[r], atoms[p], atoms[q])]) {
          if (Math.abs(ang - 60) > 1) {
            problems.push(where + ': Dreiring-Winkel ' + ang.toFixed(1) + '° statt 60°');
          }
        }
      }
    }
  });
  return problems;
}

/* ── Sanity checks ────────────────────────────────────────────────── */

const ids = new Set();
for (const e of library) {
  if (ids.has(e.id)) throw new Error('Doppelte ID: ' + e.id);
  ids.add(e.id);
  if (!e.name || !e.category) throw new Error('Unvollständig: ' + e.id);
  if (!/^\$RXN/.test(e.reaction_rxn)) throw new Error('Kein RXN: ' + e.id);
}

const geomProblems = library.flatMap(checkGeometry);
if (geomProblems.length) {
  console.error('Geometrie-Probleme:');
  for (const p of geomProblems) console.error('  ' + p);
  process.exit(1);
}

fs.writeFileSync(OUT, JSON.stringify(library, null, 2) + '\n', 'utf8');

const byCat = {};
for (const e of library) byCat[e.category] = (byCat[e.category] || 0) + 1;
console.log(modules.length + ' Module → ' + library.length + ' Reaktionen in ' +
            Object.keys(byCat).length + ' Kategorien');
for (const c of Object.keys(byCat)) console.log('  ' + String(byCat[c]).padStart(3) + '  ' + c);
console.log('geschrieben: ' + path.relative(process.cwd(), OUT));
