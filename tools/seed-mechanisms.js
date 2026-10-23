#!/usr/bin/env node
/**
 * Seeds data/mechanisms.json with the first mechanisms.
 *
 * Mechanisms are normally drawn in the admin (Reaktion → Mechanismus →
 * Ketcher with the ↷ tool). This script only writes the starting set,
 * built with the same molfile builder as the reaction library, and it
 * only ADDS reactions that have no mechanism yet — run with --force to
 * overwrite them (this throws away edits made in the admin).
 *
 * Format of one step (all coordinates molfile units, y up):
 *   { caption, mol, arrows: [{ from, to, mode }], pluses: [[x, y]],
 *     texts: [{ at: [x, y] (top left), text }],
 *     curly: [{ from, to, type: 'pair'|'single', side: ±1, arc }] }
 * with from/to of a curly arrow = { atom: [x, y] } or { bond: [[x, y], [x, y]] }
 * (a "bond" may also be two atoms that are not bonded yet: the bond
 * being formed).
 *
 * Run:  node tools/seed-mechanisms.js [--force | --only=id,id]
 */
const fs = require('fs');
const path = require('path');
const { Mol, DX, DY } = require('./lib-molbuilder.js');

const OUT = path.join(__dirname, '..', 'data', 'mechanisms.json');
const force = process.argv.includes('--force');

/* One canvas per step. Atoms are placed absolutely; radicals are written
   as "M  RAD" lines, which the shared builder does not know about. */
function scene() {
  const m = new Mol();
  const rad = [];
  const S = {
    m,
    at(x, y, sym, charge) { const i = m.add(x, y, sym || 'C'); if (charge) m.charge(i, charge); return i; },
    gen(x, y, label) { return m.gen(x, y, label); },
    bond(a, b, o, st) { m.bond(a, b, o || 1, st); return S; },
    radical(i) { rad.push(i); return S; },
    p(i) { const a = m.atoms[i]; return [r(a.x), r(a.y)]; },
    atom(i) { return { atom: S.p(i) }; },
    pair(i, j) { return { bond: [S.p(i), S.p(j)] }; },
    mol() {
      let t = m.toMolfile();
      if (rad.length) {
        t = t.replace('M  END', 'M  RAD' + String(rad.length).padStart(3) +
          rad.map(i => String(i + 1).padStart(4) + '   2').join('') + '\nM  END');
      }
      return t;
    }
  };
  return S;
}
const r = v => Math.round(v * 10000) / 10000;
const polar = (p, deg, l) => [p[0] + (l || 1) * Math.cos(deg * Math.PI / 180), p[1] + (l || 1) * Math.sin(deg * Math.PI / 180)];
const curly = (from, to, side, extra) => Object.assign({ from, to, type: 'pair', side, arc: 'auto' }, extra || {});
const arrow = (x0, x1, y) => ({ from: [x0, y], to: [x1, y], mode: 'open-angle' });


/* Two rules for every mechanism below:
     · didactic layout: a skeleton keeps its orientation from step to
       step — the atoms that do not react stay where they were, so the
       eye follows only what changes. A species formed in one step sits
       where it will react in the next.
     · general species: the base is B⁻ (its acid H–B), the nucleophile
       Nu⁻, the halogen X — the reaction does not depend on which one. */

const MECH = {};

/* A labelled placeholder (B, Nu, X) with an optional charge. */
function lab(S, x, y, label, charge) {
  const i = S.gen(x, y, label);
  if (charge) S.m.charge(i, charge);
  return i;
}

/* ── Aldoladdition (basenkatalysiert) ─────────────────────────────── */
/* Same frame as the reaction scheme (lib-rx-05): R₁–CH₂–CHO with the
   α-C up, the C=O pointing DOWN and the aldehyde H to the right; the
   electrophile R₂–CHO comes in from ABOVE, and in the product the new
   CH(O⁻)R₂ stands above the α-C with O to the upper left, R₂ to the
   upper right — exactly where the scheme draws it. */
const ALD = {
  // R₁–Cα(…)–C1(=O / –O⁻)–H ; `enolate` makes Cα=C1 and O⁻
  core(S, x, y, enolate) {
    const r1 = lab(S, x, y, 'R₁'), ca = S.at(x + DX, y + DY), c1 = S.at(x + 2 * DX, y);
    const o = S.at(x + 2 * DX, y - 1, 'O', enolate ? -1 : 0), h = S.at(x + 3 * DX, y + DY, 'H');
    S.bond(r1, ca).bond(ca, c1, enolate ? 2 : 1).bond(c1, o, enolate ? 1 : 2).bond(c1, h);
    return { r1, ca, c1, o, h };
  },
  // the aldol skeleton: core + CH(O⁻ / OH)R₂ above the α-C
  adduct(S, x, y, oCharge) {
    const k = ALD.core(S, x, y, false);
    const cb = S.at(x + DX, y + DY + 1), ob = S.at(x, y + DY + 1.5, 'O', oCharge), r2 = lab(S, x + 2 * DX, y + DY + 1.5, 'R₂');
    S.bond(k.ca, cb).bond(cb, ob).bond(cb, r2);
    return Object.assign(k, { cb, ob, r2 });
  },
  hb(S, x, y, hFirst) {                         // H–B (or B–H), the protonated base
    const h = S.at(hFirst ? x : x + 1, y, 'H'), b = lab(S, hFirst ? x + 1 : x, y, 'B');
    S.bond(h, b);
    return { h, b };
  }
};

MECH['aldol-addition'] = {
  title: 'Basenkatalysierte Aldoladdition',
  steps: [
    (() => {
      const S = scene();
      const k = ALD.core(S, 0, 0, false);
      const ha = S.at(DX, DY + 1, 'H');
      S.bond(k.ca, ha);
      const b = lab(S, DX, DY + 2.3, 'B', -1);
      const X0 = 4.6;
      ALD.core(S, X0, 0, true);
      ALD.hb(S, X0 + 3 * DX + 1.5, 0.25, true);
      return {
        caption: '1. Deprotonierung: Die Base B⁻ (z. B. OH⁻, RO⁻) entreißt dem α-C-Atom ein Proton. Es entsteht das Enolat-Ion — die negative Ladung ist über C und O delokalisiert.',
        mol: S.mol(),
        arrows: [arrow(3.0, 4.05, 0.25)],
        pluses: [[X0 + 3 * DX + 0.9, 0.25]],
        curly: [
          curly(S.atom(b), S.atom(ha), 1),
          curly(S.pair(k.ca, ha), S.pair(k.ca, k.c1), 1),
          curly(S.pair(k.c1, k.o), S.atom(k.o), 1)
        ]
      };
    })(),
    (() => {
      const S = scene();
      const k = ALD.core(S, 0, 0, true);
      // R₂–CHO above the α-C, oriented as its CH(O⁻)R₂ will be
      const cb = S.at(DX, DY + 1.9), ob = S.at(0, DY + 2.4, 'O'), r2 = lab(S, 2 * DX, DY + 2.4, 'R₂');
      S.bond(cb, ob, 2).bond(cb, r2);
      ALD.adduct(S, 4.65, 0, -1);
      return {
        caption: '2. C–C-Knüpfung: Das nucleophile α-C-Atom des Enolats greift das Carbonyl-C-Atom des zweiten Aldehyds an (A_N). Es entsteht ein Alkoxid.',
        mol: S.mol(),
        arrows: [arrow(3.05, 4.1, 0.25)],
        curly: [
          curly(S.atom(k.o), S.pair(k.c1, k.o), -1),
          curly(S.pair(k.ca, k.c1), S.atom(cb), -1),
          curly(S.pair(cb, ob), S.atom(ob), 1)
        ]
      };
    })(),
    (() => {
      const S = scene();
      const d = ALD.adduct(S, 0, 0, -1);
      // B–H to the left of the alkoxide O, H facing it
      const hb = ALD.hb(S, -2.35, DY + 1.5, false);
      const X0 = 4.75;
      ALD.adduct(S, X0, 0, 0);
      lab(S, X0 + 3 * DX + 1.4, 0.25, 'B', -1);
      return {
        caption: '3. Protonierung: Das Alkoxid holt sich das Proton von H–B zurück. B⁻ wird zurückgebildet — die Base wirkt katalytisch. Produkt: der β-Hydroxyaldehyd (das „Aldol“).',
        mol: S.mol(),
        arrows: [arrow(3.15, 4.2, 0.25)],
        pluses: [[X0 + 3 * DX + 0.8, 0.25]],
        curly: [
          curly(S.atom(d.ob), S.atom(hb.h), -1),
          curly(S.pair(hb.h, hb.b), S.atom(hb.b), -1)
        ]
      };
    })()
  ]
};

/* ── S_N2 ─────────────────────────────────────────────────────────── */
MECH['sn2'] = {
  title: 'S_N2 — Rückseitenangriff',
  steps: [
    (() => {
      const S = scene();
      const nu = lab(S, 0, 0, 'Nu', -1);
      const c = S.at(1.8, 0), x = lab(S, 2.8, 0, 'X');
      S.bond(c, x);
      [[105, 0], [205, 1], [250, 6]].forEach(([deg, st]) => {
        const p = polar([1.8, 0], deg); S.bond(c, S.at(p[0], p[1], 'H'), 1, st);
      });
      // product: Nu stays left, X leaves to the right, the H atoms flip over
      const X0 = 5.9;
      const pn = lab(S, X0, 0, 'Nu'), pc = S.at(X0 + 1, 0);
      S.bond(pn, pc);
      [[75, 0], [-25, 1], [-70, 6]].forEach(([deg, st]) => {
        const p = polar([X0 + 1, 0], deg); S.bond(pc, S.at(p[0], p[1], 'H'), 1, st);
      });
      lab(S, X0 + 3.3, 0, 'X', -1);
      return {
        caption: 'Einstufig und konzertiert: Das Nucleophil greift von der Rückseite an, gleichzeitig verlässt das Halogenid das C-Atom. Die drei H-Atome klappen um wie ein Regenschirm im Wind (Walden-Umkehr).',
        mol: S.mol(),
        arrows: [arrow(3.45, 4.75, 0)],
        pluses: [[X0 + 2.55, 0]],
        curly: [
          curly(S.atom(nu), S.atom(c), 1),
          curly(S.pair(c, x), S.atom(x), -1)
        ]
      };
    })()
  ]
};

/* ── Elektrophile Addition von HX (Markownikow) ──────────────────── */
/* Propene keeps its frame; X⁻ sits above C2 from the moment it is
   formed, which is where it attacks in step 2. */
MECH['elektrophile-addition-hx'] = {
  title: 'Elektrophile Addition über das stabilere Carbenium-Ion',
  steps: [
    (() => {
      const S = scene();
      const c1 = S.at(0, 0), c2 = S.at(DX, DY), c3 = S.at(2 * DX, 0);
      S.bond(c1, c2, 2).bond(c2, c3);
      const h = S.at(-0.45, 1.55, 'H'), x = lab(S, 0.55, 1.55, 'X');
      S.bond(h, x);
      const X0 = 4.0;
      const p1 = S.at(X0, 0), p2 = S.at(X0 + DX, DY, 'C', 1), p3 = S.at(X0 + 2 * DX, 0);
      S.bond(p1, p2).bond(p2, p3);
      lab(S, X0 + DX, DY + 1.45, 'X', -1);
      return {
        caption: '1. Die π-Elektronen greifen das Proton an. Es lagert sich so an, dass das STABILERE (sekundäre) Carbenium-Ion entsteht — Markownikow.',
        mol: S.mol(),
        arrows: [arrow(2.35, 3.55, 0.25)],
        curly: [
          curly(S.pair(c1, c2), S.atom(h), 1),
          curly(S.pair(h, x), S.atom(x), 1)
        ]
      };
    })(),
    (() => {
      const S = scene();
      const c1 = S.at(0, 0), c2 = S.at(DX, DY, 'C', 1), c3 = S.at(2 * DX, 0);
      S.bond(c1, c2).bond(c2, c3);
      const x = lab(S, DX, DY + 1.45, 'X', -1);
      const X0 = 3.6;
      const p1 = S.at(X0, 0), p2 = S.at(X0 + DX, DY), p3 = S.at(X0 + 2 * DX, 0), px = lab(S, X0 + DX, DY + 1, 'X');
      S.bond(p1, p2).bond(p2, p3).bond(p2, px);
      return {
        caption: '2. Das Halogenid addiert an das Carbenium-Ion. X sitzt am höher substituierten C-Atom (2-Halogenpropan).',
        mol: S.mol(),
        arrows: [arrow(2.2, 3.2, 0.5)],
        curly: [curly(S.atom(x), S.atom(c2), -1)]
      };
    })()
  ]
};

/* ── Radikalische HBr-Addition (Anti-Markownikow) ────────────────── */
/* Only HBr does this (see the reaction), so Br stays Br here. */
MECH['radikalische-hbr-addition'] = {
  title: 'Kettenfortpflanzung mit Einzelelektronen',
  steps: [
    (() => {
      const S = scene();
      const br = S.at(-2.1, 0, 'Br'); S.radical(br);
      const c1 = S.at(0, 0), c2 = S.at(DX, DY), c3 = S.at(2 * DX, 0);
      S.bond(c1, c2, 2).bond(c2, c3);
      const X0 = 4.75;
      const p1 = S.at(X0, 0), p2 = S.at(X0 + DX, DY), p3 = S.at(X0 + 2 * DX, 0), pb = S.at(X0 - 1, 0, 'Br');
      S.bond(pb, p1).bond(p1, p2).bond(p2, p3); S.radical(p2);
      const one = { type: 'single' };
      return {
        caption: '1. Das Brom-Radikal addiert an das endständige C-Atom — so entsteht das stabilere, sekundäre C-Radikal. Jeder Halbpfeil steht für EIN Elektron.',
        mol: S.mol(),
        arrows: [arrow(2.25, 3.0, 0.25)],
        curly: [
          curly(S.atom(br), S.pair(br, c1), 1, one),
          curly(S.pair(c1, c2), S.pair(br, c1), 1, one),
          curly(S.pair(c1, c2), S.atom(c2), 1, one)
        ]
      };
    })(),
    (() => {
      const S = scene();
      const pb = S.at(-1, 0, 'Br'), p1 = S.at(0, 0), p2 = S.at(DX, DY), p3 = S.at(2 * DX, 0);
      S.bond(pb, p1).bond(p1, p2).bond(p2, p3); S.radical(p2);
      const h = S.at(DX + 1.0, DY + 1.0, 'H'), hb = S.at(DX + 2.0, DY + 1.0, 'Br');
      S.bond(h, hb);
      const X0 = 5.95;
      const qb = S.at(X0 - 1, 0, 'Br'), q1 = S.at(X0, 0), q2 = S.at(X0 + DX, DY), q3 = S.at(X0 + 2 * DX, 0);
      S.bond(qb, q1).bond(q1, q2).bond(q2, q3);
      // the new Br· where the Br of HBr was
      const nb = S.at(X0 + DX + 2.0, DY + 1.0, 'Br'); S.radical(nb);
      const one = { type: 'single' };
      return {
        caption: '2. Das C-Radikal holt sich ein H-Atom von HBr: 1-Brompropan entsteht, und ein neues Brom-Radikal setzt die Kette fort.',
        mol: S.mol(),
        arrows: [arrow(3.2, 4.35, 0.25)],
        pluses: [[X0 + DX + 1.2, DY + 1.0]],
        curly: [
          curly(S.pair(h, hb), S.pair(p2, h), 1, one),
          curly(S.atom(p2), S.pair(p2, h), 1, one),
          curly(S.pair(h, hb), S.atom(hb), 1, one)
        ]
      };
    })()
  ]
};

/* The rest of the library: one file per chapter, tools/mech-NN-*.js,
   each exporting { id: { title, steps } } built with lib-mech.js. */
fs.readdirSync(__dirname).filter(f => /^mech-\d+.*\.js$/.test(f)).sort()
  .forEach(f => Object.assign(MECH, require(path.join(__dirname, f))));

// --only id,id: (re)write just these, overwriting what is there
const onlyArg = process.argv.find(a => a.startsWith('--only='));
const only = onlyArg ? onlyArg.slice(7).split(',') : null;

let data = {};
try { data = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (_) { /* first run */ }
let n = 0;
for (const [id, mech] of Object.entries(MECH)) {
  if (only ? !only.includes(id) : (data[id] && !force)) continue;
  data[id] = mech; n++;
}
fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n');
console.log(n + ' Mechanismen geschrieben → ' + path.relative(process.cwd(), OUT));
