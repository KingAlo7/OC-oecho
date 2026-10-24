/* Mechanisms — Aromatische Substitution (frames as in lib-rx-03-aromaten.js):
   benzene on the origin, node at top and bottom, the reacting position is
   vertex 0 (upper right, 30°) and substituents leave it radially. */
const { scene, polar, DX, DY } = require('./lib-mech.js');

const M = {};
const lab = (S, label, q) => S.frag(() => ({ i: S.L(0, 0, label, q) }));
const rad = (S, v, i, d) => polar([v.cx, v.cy], 30 + 60 * i, 1 + (d == null ? 1 : d));

/* Benzene with vertices at 30°+60°k. `db` lists the double bonds (as
   vertex index pairs), `q` charges { vertex: charge }. */
function ring(S, cx, cy, o) {
  o = o || {};
  const v = [];
  for (let k = 0; k < 6; k++) { const p = polar([cx, cy], 30 + 60 * k, 1); v.push(S.at(p[0], p[1], 'C', (o.q || {})[k])); }
  const db = o.db || [[0, 1], [2, 3], [4, 5]];
  for (let k = 0; k < 6; k++) {
    const j = (k + 1) % 6;
    S.b(v[k], v[j], db.some(d => (d[0] === k && d[1] === j) || (d[0] === j && d[1] === k)) ? 2 : 1);
  }
  v.cx = cx; v.cy = cy;
  return v;
}
/* the arenium ion after attack at v0: E at 60°, H at 0°, + at v1 */
function sigma(S, cx, cy, eLabel, o) {
  o = o || {};
  const v = ring(S, cx, cy, { db: [[2, 3], [4, 5]], q: { 1: 1 } });
  const h = S.to(v[0], -10, 'H', { len: 0.85 });
  const e = eLabel ? (typeof eLabel === 'function' ? eLabel(v[0]) : S.to(v[0], 70, null, { label: eLabel })) : null;
  return { v, h, e };
}
function subst(S, v, label, i) {               // a labelled substituent radially on vertex i (0)
  const p = rad(S, v, i || 0, 1);
  const x = S.any(p[0], p[1], label);
  S.b(v[i || 0], x);
  return x;
}
/* the deprotonation that closes every S_E: base → H, C–H → ring */
function rearom(S, eBuild, base, caption, extra) {
  const a = S.frag(() => {
    const k = sigma(S, 0, 0, eBuild);
    const ph = S.xy(k.h);
    k.b = base.charge != null ? S.L(ph[0] + 1.15, ph[1] - 0.55, base.label, base.charge) : S.L(ph[0] + 1.15, ph[1] - 0.55, base.label);
    return k;
  });
  const p = S.frag(() => {
    const v = ring(S, 0, 0);
    if (extra) extra(v); else { const e = typeof eBuild === 'function' ? eBuild(v[0], true) : subst(S, v, eBuild); }
    return {};
  });
  return S.step({
    caption,
    row: [a, '→', p, '+', lab(S, base.acid, base.acidQ)], y: 0,
    curly: [S.cv(S.atom(a.b), S.atom(a.h), -1), S.cv(S.pair(a.v[0], a.h), S.pair(a.v[0], a.v[1]), 1)]
  });
}

/* ── S_E allgemein ────────────────────────────────────────────────── */
M['se-aromat-allgemein'] = {
  title: 'Addition zum σ-Komplex, dann Rearomatisierung',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const v = ring(S, 0, 0); const p = rad(S, v, 0, 1.4); return { v, e: S.L(p[0], p[1], 'E', 1) }; });
      const p = S.frag(() => sigma(S, 0, 0, 'E'));
      return S.step({
        caption: '1. Ein π-Elektronenpaar des Aromaten greift das Elektrophil an (langsam, geschwindigkeitsbestimmend). Es entsteht der σ-Komplex (Arenium-Ion): ein sp³-C, die positive Ladung über drei Ring-C verteilt (ortho und para zum Angriffsort). Die Aromatizität ist vorübergehend verloren.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.pair(a.v[0], a.v[1]), S.atom(a.e), 1)]
      });
    })(),
    (() => {
      const S = scene();
      return rearom(S, 'E', { label: 'B', charge: -1, acid: 'H–B' },
        '2. Eine Base nimmt das Proton am sp³-C ab; das C–H-Elektronenpaar schließt das aromatische Sextett wieder. Gesamtbilanz: Substitution von H durch E — keine Addition, weil die Rearomatisierung so viel Energie liefert.');
    })()
  ]
};

/* ── Nitrierung ───────────────────────────────────────────────────── */
/* –NO₂ on v0: N radial, O at 90° and −30° */
function nitro(S, v0, o) {
  const p = S.xy(v0);
  const d = Math.atan2(p[1], p[0]) * 180 / Math.PI;
  const n = S.to(v0, o && o.deg != null ? o.deg : d, 'N', { charge: 1 });
  const nd = o && o.deg != null ? o.deg : d;
  S.to(n, nd + 60, 'O', { order: 2 }); S.to(n, nd - 60, 'O', { charge: -1 });
  return n;
}
M['nitrierung'] = {
  title: 'Nitronium-Ion NO₂⁺ als Elektrophil',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const ho = S.at(0, 0, 'O'), h = S.to(ho, 180, 'H', { len: 0.85 }), n = S.to(ho, 0, 'N', { charge: 1 });
        S.to(n, 60, 'O', { order: 2 }); S.to(n, -60, 'O', { charge: -1 });
        const hs = S.at(-0.6, 1.25, 'H'); const os = S.to(hs, 180, null, { label: 'HO₃SO' });
        return { ho, hs, os };
      });
      const p = S.frag(() => {
        const ho = S.at(0, 0, 'O', 1), h = S.to(ho, 150, 'H', { len: 0.85 }), h2 = S.to(ho, 210, 'H', { len: 0.85 }), n = S.to(ho, 0, 'N', { charge: 1 });
        S.to(n, 60, 'O', { order: 2 }); S.to(n, -60, 'O', { charge: -1 });
        return { ho, n };
      });
      return S.step({
        caption: '1. Die stärkere Säure H₂SO₄ protoniert die OH-Gruppe der Salpetersäure.',
        row: [a, '→', p, '+', lab(S, 'HSO₄', -1)], y: 0,
        curly: [S.cv(S.atom(a.ho), S.atom(a.hs), -1), S.cv(S.pair(a.hs, a.os), S.atom(a.os), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const ho = S.at(0, 0, 'O', 1); S.to(ho, 150, 'H', { len: 0.85 }); S.to(ho, 210, 'H', { len: 0.85 });
        const n = S.to(ho, 0, 'N', { charge: 1 });
        S.to(n, 60, 'O', { order: 2 }); const om = S.to(n, -60, 'O', { charge: -1 });
        return { ho, n, om };
      });
      const p = S.frag(() => {
        const n = S.at(0, 0, 'N', 1); S.to(n, 180, 'O', { order: 2 }); S.to(n, 0, 'O', { order: 2 }); return {};
      });
      return S.step({
        caption: '2. Wasser spaltet sich ab: Das linear gebaute Nitronium-Ion O=N⁺=O ist das eigentliche, sehr starke Elektrophil.',
        row: [a, '→', lab(S, 'H₂O'), '+', p], y: 0,
        curly: [S.cv(S.atom(a.om), S.pair(a.n, a.om), -1), S.cv(S.pair(a.ho, a.n), S.atom(a.ho), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0);
        const pn = rad(S, v, 0, 1.45), n = S.at(pn[0], pn[1], 'N', 1);
        const o1 = S.at(...polar(pn, 120, 1), 'O'), o2 = S.at(...polar(pn, -60, 1), 'O');
        S.b(n, o1, 2).b(n, o2, 2);
        return { v, n, o2 };
      });
      const p = S.frag(() => sigma(S, 0, 0, v0 => nitro(S, v0, { deg: 70 })));
      return S.step({
        caption: '3. Der Aromat greift das N-Atom an; eine N=O-Bindung klappt auf das O. σ-Komplex.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.pair(a.v[0], a.v[1]), S.atom(a.n), 1), S.cv(S.pair(a.n, a.o2), S.atom(a.o2), -1)]
      });
    })(),
    (() => {
      const S = scene();
      return rearom(S, (v0, prod) => nitro(S, v0, prod ? null : { deg: 70 }), { label: 'HSO₄', charge: -1, acid: 'H₂SO₄' },
        '4. Hydrogensulfat nimmt das Proton ab, der Ring rearomatisiert: Nitrobenzol. Unter 50 °C bleibt es bei einer Nitrogruppe — sie desaktiviert den Ring für die zweite.');
    })()
  ]
};

/* ── Sulfonierung ─────────────────────────────────────────────────── */
function so3(S, v0, deg, q) {                       // –SO₃(H/⁻) on v0
  const s = S.to(v0, deg, 'S');
  S.to(s, deg + 60, 'O', { order: 2 }); S.to(s, deg - 60, 'O', { order: 2 });
  const o = S.to(s, deg, 'O', { charge: q });
  return { s, o };
}
M['sulfonierung'] = {
  title: 'SO₃ als Elektrophil — reversibel',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0); const ps = rad(S, v, 0, 1.5), s = S.at(ps[0], ps[1], 'S');
        const o1 = S.at(...polar(ps, 90, 1), 'O'), o2 = S.at(...polar(ps, 330, 1), 'O'), o3 = S.at(...polar(ps, 210, 1), 'O');
        S.b(s, o1, 2).b(s, o2, 2).b(s, o3, 2);
        return { v, s, o1 };
      });
      const p = S.frag(() => sigma(S, 0, 0, v0 => so3(S, v0, 70, -1).s));
      return S.step({
        caption: '1. SO₃ (in rauchender Schwefelsäure gelöst, „Oleum“) ist durch drei S=O-Bindungen stark elektrophil am S. Der Aromat greift an, eine S=O-Bindung klappt auf.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.pair(a.v[0], a.v[1]), S.atom(a.s), 1), S.cv(S.pair(a.s, a.o1), S.atom(a.o1), 1)]
      });
    })(),
    (() => {
      const S = scene();
      return rearom(S, (v0, prod) => so3(S, v0, prod ? 30 : 70, -1).s, { label: 'HSO₄', charge: -1, acid: 'H₂SO₄' },
        '2. Rearomatisierung. In der konzentrierten Säure wird das Sulfonat zur Sulfonsäure Ar–SO₃H protoniert. Die Sulfonierung ist umkehrbar: Mit verdünnter Säure und Wärme wird die SO₃H-Gruppe wieder abgespalten — daher nützlich als Schutz-/Dirigiergruppe.');
    })()
  ]
};

/* ── Alkalischmelze ───────────────────────────────────────────────── */
M['alkalischmelze'] = {
  title: 'Ipso-Substitution des Sulfonats durch OH⁻',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0); const k = so3(S, v[0], 30, -1);
        k.oh = S.L(...polar(S.xy(v[0]), -40, 1.5), 'OH', -1);
        return Object.assign(k, { v });
      });
      const p = S.frag(() => {
        const v = ring(S, 0, 0, { db: [[2, 3], [4, 5]], q: { 1: -1 } });
        so3(S, v[0], 60, -1); S.to(v[0], 0, null, { label: 'OH' });
        return { v };
      });
      return S.step({
        caption: '1. Bei 300 °C greift OH⁻ das C-Atom an, das die Sulfonatgruppe trägt (ipso-Angriff). Es entsteht ein Carbanion im Ring — nur unter diesen drastischen Bedingungen, weil kein Akzeptor die Ladung stabilisiert.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.atom(a.oh), S.atom(a.v[0]), -1), S.cv(S.pair(a.v[0], a.v[1]), S.atom(a.v[1]), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0, { db: [[2, 3], [4, 5]], q: { 1: -1 } });
        const k = so3(S, v[0], 60, -1); S.to(v[0], 0, null, { label: 'OH' });
        return Object.assign(k, { v });
      });
      const p = S.frag(() => { const v = ring(S, 0, 0); subst(S, v, 'OH'); return {}; });
      return S.step({
        caption: '2. Das Elektronenpaar kehrt in den Ring zurück und verdrängt Sulfit SO₃²⁻. In der Schmelze liegt sofort das Phenolat vor; erst das Ansäuern (H₃O⁺) liefert das Phenol.',
        row: [a, '→', p, '+', lab(S, 'SO₃', -2)], y: 0,
        curly: [S.cv(S.atom(a.v[1]), S.pair(a.v[0], a.v[1]), 1), S.cv(S.pair(a.v[0], a.s), S.atom(a.s), -1)]
      });
    })()
  ]
};

/* ── Halogenierung ────────────────────────────────────────────────── */
M['halogenierung-aromat'] = {
  title: 'Lewis-Säure polarisiert Br₂',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const b1 = S.at(0, 0, 'Br'), b2 = S.to(b1, 0, 'Br'); const fe = S.L(2.5, 0, 'FeBr₃'); return { b1, b2, fe }; });
      const p = S.frag(() => { const b1 = S.at(0, 0, 'Br'), b2 = S.to(b1, 0, 'Br', { charge: 1 }); S.to(b2, 0, null, { label: 'FeBr₃', charge: -1 }); return {}; });
      return S.step({
        caption: '1. Ein freies Elektronenpaar des Br₂ geht an die Lewis-Säure FeBr₃. Das äußere Br wird dadurch stark elektrophil („Br⁺“).',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.atom(a.b2), S.atom(a.fe), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0); const pb = rad(S, v, 0, 1.4);
        const b1 = S.at(pb[0], pb[1], 'Br'), b2 = S.to(b1, 30, 'Br', { charge: 1 }); S.to(b2, 30, null, { label: 'FeBr₃', charge: -1 });
        return { v, b1, b2 };
      });
      const p = S.frag(() => sigma(S, 0, 0, v0 => S.to(v0, 70, 'Br')));
      return S.step({
        caption: '2. Der Aromat greift das äußere Br an; die Br–Br-Bindung bricht, FeBr₄⁻ entsteht. σ-Komplex.',
        row: [a, '→', p, '+', lab(S, 'FeBr₄', -1)], y: 0,
        curly: [S.cv(S.pair(a.v[0], a.v[1]), S.atom(a.b1), 1), S.cv(S.pair(a.b1, a.b2), S.atom(a.b2), -1)]
      });
    })(),
    (() => {
      const S = scene();
      return rearom(S, (v0, prod) => S.to(v0, prod ? 30 : 70, 'Br'), { label: 'FeBr₄', charge: -1, acid: 'HBr + FeBr₃' },
        '3. FeBr₄⁻ gibt ein Bromid als Base ab, das das Proton übernimmt: HBr entsteht, FeBr₃ ist zurückgebildet (Katalysator).');
    })()
  ]
};

/* ── Friedel-Crafts-Alkylierung ───────────────────────────────────── */
M['friedel-crafts-alkylierung'] = {
  title: 'Carbenium-Ion (bzw. polarisierter Komplex) als Elektrophil',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const r = S.L(0, 0, 'R₁'), x = S.L(DX, DY, 'X'); S.b(r, x); const al = S.L(DX + 1.45, DY, 'AlCl₃'); return { r, x, al }; });
      const p = S.frag(() => ({ r: S.L(0, 0, 'R₁', 1) }));
      return S.step({
        caption: '1. AlCl₃ zieht das Halogenid ab: Es entsteht ein Carbenium-Ion (bei primärem R–X eher ein stark polarisierter R–X–AlCl₃-Komplex). Achtung: Carbenium-Ionen lagern sich gerne zum stabileren Kation um.',
        row: [a, '→', p, '+', lab(S, 'AlCl₃X', -1)], y: DY / 2,
        curly: [S.cv(S.atom(a.x), S.atom(a.al), 1), S.cv(S.pair(a.r, a.x), S.atom(a.x), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const v = ring(S, 0, 0); const p = rad(S, v, 0, 1.4); return { v, e: S.L(p[0], p[1], 'R₁', 1) }; });
      const p = S.frag(() => sigma(S, 0, 0, 'R₁'));
      return S.step({
        caption: '2. Der Aromat greift das Carbenium-Ion an: σ-Komplex.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.pair(a.v[0], a.v[1]), S.atom(a.e), 1)]
      });
    })(),
    (() => {
      const S = scene();
      return rearom(S, 'R₁', { label: 'AlCl₃X', charge: -1, acid: 'HX + AlCl₃' },
        '3. Rearomatisierung; AlCl₃ wird zurückgebildet (katalytisch). Weil die Alkylgruppe den Ring aktiviert, reagiert das Produkt schneller als das Edukt — Mehrfachalkylierung ist das typische Problem.');
    })()
  ]
};

/* ── Friedel-Crafts-Acylierung ────────────────────────────────────── */
function acyl(S, v0, deg) {                         // –C(=O)R₁ on v0, as in the scheme
  const c = S.to(v0, deg, 'C');
  S.to(c, deg + 60, 'O', { order: 2 }); S.to(c, deg - 60, null, { label: 'R₁' });
  return c;
}
M['friedel-crafts-acylierung'] = {
  title: 'Acylium-Ion als Elektrophil',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), c = S.at(DX, DY), o = S.at(DX, DY + 1, 'O'), cl = S.at(2 * DX, 0, 'Cl');
        S.b(r, c).b(c, o, 2).b(c, cl); const al = S.L(2 * DX + 1.45, 0, 'AlCl₃'); return { c, cl, al, o };
      });
      const p = S.frag(() => { const r = S.L(0, 0, 'R₁'), c = S.at(1, 0, 'C'), o = S.at(2, 0, 'O', 1); S.b(r, c).b(c, o, 3); return {}; });
      return S.step({
        caption: '1. AlCl₃ zieht das Chlorid ab: Es entsteht das Acylium-Ion R–C≡O⁺. Es ist mesomeriestabilisiert (die Ladung sitzt auch am O) — deshalb lagert es sich, anders als ein Carbenium-Ion, NICHT um.',
        row: [a, '→', p, '+', lab(S, 'AlCl₄', -1)], y: DY / 2,
        curly: [S.cv(S.atom(a.cl), S.atom(a.al), -1), S.cv(S.pair(a.c, a.cl), S.atom(a.cl), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0); const pc = rad(S, v, 0, 1.4);
        const c = S.at(pc[0], pc[1], 'C', 1), o = S.at(...polar(pc, 90, 1), 'O'), r = S.L(...polar(pc, -30, 1), 'R₁');
        S.b(c, o, 2).b(c, r);
        return { v, c, o };
      });
      const p = S.frag(() => sigma(S, 0, 0, v0 => acyl(S, v0, 70)));
      return S.step({
        caption: '2. Der Aromat greift das Acylium-C an: σ-Komplex.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.pair(a.v[0], a.v[1]), S.atom(a.c), 1)]
      });
    })(),
    (() => {
      const S = scene();
      return rearom(S, (v0, prod) => acyl(S, v0, prod ? 30 : 70), { label: 'AlCl₄', charge: -1, acid: 'HCl + AlCl₃' },
        '3. Rearomatisierung zum Arylketon. Das Keton bindet AlCl₃ als Lewis-Base fest — deshalb braucht man AlCl₃ stöchiometrisch, und erst die wässrige Aufarbeitung setzt es frei. Die Acylgruppe desaktiviert den Ring: keine Mehrfachacylierung.');
    })()
  ]
};

/* ── S_NAr ─────────────────────────────────────────────────────────── */
/* X on v0 (upper right), NO₂ para on v3 (lower left), radially */
function nitroAt(S, v, i, nitronate) {
  const pn = rad(S, v, i, 1), d = 30 + 60 * i;
  const n = S.at(pn[0], pn[1], 'N', 1);
  const o1 = S.to(n, d - 60, 'O', nitronate ? { charge: -1 } : { order: 2 });
  const o2 = S.to(n, d + 60, 'O', { charge: -1 });
  S.b(v[i], n, nitronate ? 2 : 1);
  return { n, o1, o2 };
}
M['snar'] = {
  title: 'Addition–Eliminierung über den Meisenheimer-Komplex',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0); const x = subst(S, v, 'X'); const no = nitroAt(S, v, 3);
        const nu = S.L(...polar(S.xy(v[0]), -40, 1.55), 'Nu', -1);
        return Object.assign(no, { v, x, nu });
      });
      const p = S.frag(() => {
        const v = ring(S, 0, 0, { db: [[1, 2], [4, 5]] });
        S.to(v[0], 60, null, { label: 'X' }); S.to(v[0], 0, null, { label: 'Nu' });
        nitroAt(S, v, 3, true); return {};
      });
      return S.step({
        caption: '1. Addition (langsam): Nu⁻ greift das C-Atom mit der Abgangsgruppe an. Die negative Ladung des Meisenheimer-Komplexes wird bis auf die Nitrogruppe in para- (oder ortho-)Stellung verschoben — ohne diesen Akzeptor gelingt die Reaktion nicht. Deshalb ist F die beste Abgangsgruppe: Es macht das C am elektrophilsten, und der C–F-Bruch ist nicht geschwindigkeitsbestimmend.',
        row: [a, '→', p], y: 0,
        curly: [
          S.cv(S.atom(a.nu), S.atom(a.v[0]), -1),
          S.cv(S.pair(a.v[0], a.v[1]), S.pair(a.v[1], a.v[2]), 1),
          S.cv(S.pair(a.v[2], a.v[3]), S.pair(a.v[3], a.n), 1),
          S.cv(S.pair(a.n, a.o1), S.atom(a.o1), 1)
        ]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0, { db: [[1, 2], [4, 5]] });
        const x = S.to(v[0], 60, null, { label: 'X' }); S.to(v[0], 0, null, { label: 'Nu' });
        return Object.assign(nitroAt(S, v, 3, true), { v, x });
      });
      const p = S.frag(() => { const v = ring(S, 0, 0); subst(S, v, 'Nu'); nitroAt(S, v, 3); return {}; });
      return S.step({
        caption: '2. Eliminierung (schnell): Das Elektronenpaar läuft zurück in den Ring und stößt X⁻ hinaus. Der Aromat ist wiederhergestellt.',
        row: [a, '→', p, '+', lab(S, 'X', -1)], y: 0,
        curly: [
          S.cv(S.atom(a.o1), S.pair(a.n, a.o1), 1),
          S.cv(S.pair(a.v[3], a.n), S.pair(a.v[2], a.v[3]), -1),
          S.cv(S.pair(a.v[1], a.v[2]), S.pair(a.v[0], a.v[1]), -1),
          S.cv(S.pair(a.v[0], a.x), S.atom(a.x), 1)
        ]
      });
    })()
  ]
};

/* ── Diazotierung ─────────────────────────────────────────────────── */
/* N1 radial on v0, then N2 and O continue at proper angles */
function arN(S, v, q) { const p = rad(S, v, 0, 1); const n = S.at(p[0], p[1], 'N', q); S.b(v[0], n); return n; }
M['diazotierung'] = {
  title: 'N-Nitrosierung durch NO⁺, dann Wasserabspaltung',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const o = S.at(0, 0, 'O', 1); S.to(o, 150, 'H', { len: 0.85 }); S.to(o, 210, 'H', { len: 0.85 });
        const n = S.to(o, 0, 'N'), o2 = S.to(n, 60, 'O', { order: 2 }); return { o, n, o2 };
      });
      const p = S.frag(() => { const n = S.at(0, 0, 'N'), o = S.to(n, 0, 'O', { order: 3, charge: 1 }); return {}; });
      return S.step({
        caption: '1. NaNO₂ + HCl liefern HNO₂, das in der kalten Säure am OH protoniert wird. Wasser spaltet sich ab: das Nitrosyl-Kation N≡O⁺ (NO⁺), das Elektrophil — angegriffen wird es am N.',
        row: [a, '→', lab(S, 'H₂O'), '+', p], y: 0,
        curly: [S.cv(S.atom(a.o2), S.pair(a.n, a.o2), 1), S.cv(S.pair(a.o, a.n), S.atom(a.o), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0); const n1 = arN(S, v);
        const n2 = S.at(...polar(S.xy(n1), -30, 1.45), 'N'), o = S.at(...polar(S.xy(n2), 30, 1), 'O', 1); S.b(n2, o, 3);
        return { v, n1, n2, o };
      });
      const p = S.frag(() => {
        const v = ring(S, 0, 0); const n1 = arN(S, v, 1); S.to(n1, 90, 'H', { len: 0.85 }); S.to(n1, 150, 'H', { len: 0.85 });
        const n2 = S.to(n1, -30, 'N'); S.to(n2, 30, 'O', { order: 2 }); return {};
      });
      return S.step({
        caption: '2. Das freie Elektronenpaar des Amin-N greift das NO⁺ an.',
        row: [a, '→', p], y: 0.5,
        curly: [S.cv(S.atom(a.n1), S.atom(a.n2), 1), S.cv(S.pair(a.n2, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0); const n1 = arN(S, v, 1); const h = S.to(n1, 90, 'H', { len: 0.85 }); S.to(n1, 150, 'H', { len: 0.85 });
        const n2 = S.to(n1, -30, 'N'); S.to(n2, 30, 'O', { order: 2 });
        const w = S.at(S.xy(h)[0] + 1.15, S.xy(h)[1] + 0.2, 'O'); S.to(w, 30, 'H', { len: 0.85 }); S.to(w, -30, 'H', { len: 0.85 });
        return { n1, h, w };
      });
      const p = S.frag(() => {
        const v = ring(S, 0, 0); const n1 = arN(S, v); S.to(n1, 90, 'H', { len: 0.85 });
        const n2 = S.to(n1, -30, 'N'); S.to(n2, 30, 'O', { order: 2 }); return {};
      });
      return S.step({
        caption: '3. Deprotonierung: N-Nitrosamin.',
        row: [a, '→', p, '+', lab(S, 'H₃O', 1)], y: 0.5,
        curly: [S.cv(S.atom(a.w), S.atom(a.h), 1), S.cv(S.pair(a.n1, a.h), S.atom(a.n1), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0); const n1 = arN(S, v); S.to(n1, 90, 'H', { len: 0.85 });
        const n2 = S.to(n1, -30, 'N'); S.to(n2, 30, 'O', { order: 2 }); return {};
      });
      const p = S.frag(() => {
        const v = ring(S, 0, 0); const n1 = arN(S, v);
        const n2 = S.to(n1, -30, 'N', { order: 2 }); const o = S.to(n2, 30, 'O'); S.to(o, -30, 'H', { len: 0.85 }); return {};
      });
      return S.step({
        caption: '4. Zwei Protonenübertragungen (O protonieren, N deprotonieren) — eine Tautomerie wie Keto/Enol — machen daraus das Diazohydroxid Ar–N=N–OH.',
        row: [a, { arrow: '⇌', above: 'H⁺' }, p], y: 0.5
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0); const n1 = arN(S, v);
        const n2 = S.to(n1, -30, 'N', { order: 2 }); const o = S.to(n2, 30, 'O', { charge: 1 });
        S.to(o, -30, 'H', { len: 0.85 }); S.to(o, 90, 'H', { len: 0.85 }); return { n1, n2, o };
      });
      const p = S.frag(() => {
        const v = ring(S, 0, 0); const p1 = rad(S, v, 0, 1), p2 = rad(S, v, 0, 2);
        const n1 = S.at(p1[0], p1[1], 'N', 1), n2 = S.at(p2[0], p2[1], 'N'); S.b(v[0], n1).b(n1, n2, 3); return {};
      });
      return S.step({
        caption: '5. Nach Protonierung des OH geht Wasser ab, und das freie Elektronenpaar am N bildet die Dreifachbindung: Aryldiazonium-Ion Ar–N≡N⁺. Es ist nur bei 0–5 °C beständig; Alkyldiazonium-Ionen zerfallen sofort.',
        row: [a, '→', p, '+', lab(S, 'H₂O')], y: 0.5,
        curly: [S.cv(S.atom(a.n1), S.pair(a.n1, a.n2), -1), S.cv(S.pair(a.n2, a.o), S.atom(a.o), 1)]
      });
    })()
  ]
};

/* ── Verkochen ────────────────────────────────────────────────────── */
function diazonium(S, v) {
  const p1 = rad(S, v, 0, 1), p2 = rad(S, v, 0, 2);
  const n1 = S.at(p1[0], p1[1], 'N', 1), n2 = S.at(p2[0], p2[1], 'N'); S.b(v[0], n1).b(n1, n2, 3);
  return { n1, n2 };
}
M['diazonium-verkochung'] = {
  title: 'S_N1 über das Aryl-Kation',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const v = ring(S, 0, 0); return Object.assign(diazonium(S, v), { v }); });
      const p = S.frag(() => ({ v: ring(S, 0, 0, { q: { 0: 1 } }) }));
      const n2 = S.frag(() => { const n = S.at(0, 0, 'N'), m = S.to(n, 0, 'N'); S.m.bonds[S.m.bonds.length - 1].order = 3; return {}; });
      return S.step({
        caption: '1. Beim Erwärmen entweicht N₂ — eine der besten Abgangsgruppen überhaupt (stabiles Gas, Entropie). Zurück bleibt ein sehr energiereiches Aryl-Kation: Die leere Stelle ist ein sp²-Orbital in der Ringebene, nicht mesomeriestabilisiert.',
        row: [a, '→', p, '+', n2], y: 0,
        curly: [S.cv(S.pair(a.v[0], a.n1), S.atom(a.n1), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0, { q: { 0: 1 } }); const pw = rad(S, v, 0, 1.4);
        const w = S.at(pw[0], pw[1], 'O'); S.to(w, 90, 'H', { len: 0.85 }); S.to(w, -30, 'H', { len: 0.85 }); return { v, w };
      });
      const p = S.frag(() => {
        const v = ring(S, 0, 0); const o = subst(S, v, 'O'); S.charge(o, 1); S.to(o, 90, 'H', { len: 0.85 }); S.to(o, -30, 'H', { len: 0.85 }); return {};
      });
      return S.step({
        caption: '2. Wasser (in großem Überschuss) fängt das Kation ab.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.atom(a.w), S.atom(a.v[0]), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0); const o = subst(S, v, 'O'); S.charge(o, 1); const h = S.to(o, 90, 'H', { len: 0.85 }); S.to(o, -30, 'H', { len: 0.85 });
        const w = S.at(S.xy(h)[0] + 1.2, S.xy(h)[1], 'O'); S.to(w, 30, 'H', { len: 0.85 }); S.to(w, -30, 'H', { len: 0.85 });
        return { o, h, w };
      });
      const p = S.frag(() => { const v = ring(S, 0, 0); subst(S, v, 'OH'); return {}; });
      return S.step({
        caption: '3. Deprotonierung: Phenol. Mit anderen Nucleophilen klappt das Gleiche (Sandmeyer mit CuX/CuCN läuft dagegen radikalisch).',
        row: [a, '→', p, '+', lab(S, 'H₃O', 1)], y: 0,
        curly: [S.cv(S.atom(a.w), S.atom(a.h), -1), S.cv(S.pair(a.o, a.h), S.atom(a.o), -1)]
      });
    })()
  ]
};

/* ── Azokupplung ──────────────────────────────────────────────────── */
/* Product frame of the scheme: Ar–N1=N2 with N2 at from(N1, −30°), the
   partner ring centred 2 bond lengths further at 30°, its vertex 3
   (lower left) on N2 and the donor D on its vertex 0. */
M['azokupplung'] = {
  title: 'S_E mit dem Diazonium-Ion als (schwachem) Elektrophil',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0); const k = diazonium(S, v);
        const pn1 = S.xy(k.n1), pn2 = polar(pn1, -30, 1);
        const c = polar(pn2, 30, 2.6);
        const w = ring(S, c[0], c[1]);
        const d = subst(S, w, 'D');
        return Object.assign(k, { v, w, d });
      });
      const p = S.frag(() => {
        const v = ring(S, 0, 0); const p1 = rad(S, v, 0, 1);
        const n1 = S.at(p1[0], p1[1], 'N'); S.b(v[0], n1);
        const n2 = S.to(n1, -30, 'N', { order: 2 });
        const c = polar(S.xy(n2), 30, 2);
        const w = ring(S, c[0], c[1], { db: [[1, 2], [4, 5]] });
        S.b(n2, w[3]); S.to(w[3], 270, 'H', { len: 0.85 });
        const d = subst(S, w, 'D'); S.charge(d, 1); S.m.bonds[S.m.bonds.length - 1].order = 2;
        return {};
      });
      return S.step({
        caption: '1. Das Diazonium-Ion ist nur ein schwaches Elektrophil — es braucht einen stark aktivierten Partner: ein Phenolat (D = O⁻, pH 8–10) oder ein Anilin (D = NR₂, pH 4–6). Der Donor schiebt sein Elektronenpaar durch den Ring; angegriffen wird das endständige N, meist in para-Stellung zu D.',
        row: [a, '→', p], y: 0.5,
        curly: [
          S.cv(S.atom(a.d), S.pair(a.w[0], a.d), 1),
          S.cv(S.pair(a.w[0], a.w[1]), S.pair(a.w[1], a.w[2]), 1),
          S.cv(S.pair(a.w[2], a.w[3]), S.atom(a.n2), -1),
          S.cv(S.pair(a.n1, a.n2), S.atom(a.n1), 1)
        ]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0); const p1 = rad(S, v, 0, 1);
        const n1 = S.at(p1[0], p1[1], 'N'); S.b(v[0], n1);
        const n2 = S.to(n1, -30, 'N', { order: 2 });
        const c = polar(S.xy(n2), 30, 2);
        const w = ring(S, c[0], c[1], { db: [[1, 2], [4, 5]] });
        S.b(n2, w[3]); const h = S.to(w[3], 270, 'H', { len: 0.85 });
        const d = subst(S, w, 'D'); S.charge(d, 1); S.m.bonds[S.m.bonds.length - 1].order = 2;
        const b = S.L(S.xy(h)[0] + 1.2, S.xy(h)[1] - 0.2, 'B', -1);
        return { w, h, d, b };
      });
      const p = S.frag(() => {
        const v = ring(S, 0, 0); const p1 = rad(S, v, 0, 1);
        const n1 = S.at(p1[0], p1[1], 'N'); S.b(v[0], n1);
        const n2 = S.to(n1, -30, 'N', { order: 2 });
        const c = polar(S.xy(n2), 30, 2);
        const w = ring(S, c[0], c[1]); S.b(n2, w[3]); subst(S, w, 'D');
        return {};
      });
      return S.step({
        caption: '2. Rearomatisierung durch Deprotonierung: der Azofarbstoff Ar–N=N–Ar′. Das ausgedehnte π-System (Donor–Ring–N=N–Ring) absorbiert sichtbares Licht.',
        row: [a, '→', p, '+', lab(S, 'H–B')], y: 0.5,
        curly: [
          S.cv(S.atom(a.b), S.atom(a.h), -1),
          S.cv(S.pair(a.w[3], a.h), S.pair(a.w[2], a.w[3]), -1),
          S.cv(S.pair(a.w[1], a.w[2]), S.pair(a.w[0], a.w[1]), -1),
          S.cv(S.pair(a.w[0], a.d), S.atom(a.d), 1)
        ]
      });
    })()
  ]
};

/* ── Benzylische Halogenierung ────────────────────────────────────── */
function benzyl(S, v, o) {
  o = o || {};
  const p = rad(S, v, 0, 1); const c = S.at(p[0], p[1]); S.b(v[0], c);
  const k = { c };
  if (o.h) k.h = S.to(c, 90, 'H', { len: 0.85 });
  if (o.br) k.br = S.to(c, -30, 'Br');
  if (o.rad) S.radical(c);
  return k;
}
M['benzylische-halogenierung'] = {
  title: 'Radikalkette über das Benzylradikal',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const b1 = S.at(0, 0, 'Br'), b2 = S.to(b1, 0, 'Br'); return { b1, b2 }; });
      const p1 = S.frag(() => { const b = S.at(0, 0, 'Br'); S.radical(b); return {}; });
      const p2 = S.frag(() => { const b = S.at(0, 0, 'Br'); S.radical(b); return {}; });
      return S.step({
        caption: '1. Start: Licht (hν) oder ein Initiator spaltet Br₂ homolytisch. NBS sorgt dafür, dass immer nur sehr wenig Br₂ vorliegt (NBS + HBr → Br₂ + Succinimid) — so kommt es nicht zur Addition an Doppelbindungen, und ohne Lewis-Säure auch nicht zur S_E am Ring.',
        row: [a, { arrow: '→', above: 'hν' }, p1, '+', p2], y: 0,
        curly: [S.one(S.pair(a.b1, a.b2), S.atom(a.b1), 1), S.one(S.pair(a.b1, a.b2), S.atom(a.b2), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0); const k = benzyl(S, v, { h: true });
        k.br = S.at(S.xy(k.h)[0] + 1.15, S.xy(k.h)[1], 'Br'); S.radical(k.br); return k;
      });
      const p = S.frag(() => { const v = ring(S, 0, 0); return benzyl(S, v, { rad: true }); });
      return S.step({
        caption: '2. Das Brom-Radikal reißt ein benzylisches H-Atom ab. Die benzylische C–H-Bindung ist besonders schwach, weil das entstehende Benzylradikal über den Ring delokalisiert ist.',
        row: [a, '→', p, '+', lab(S, 'H–Br')], y: 0,
        curly: [S.one(S.atom(a.br), S.pair(a.h, a.br), 1), S.one(S.pair(a.c, a.h), S.pair(a.h, a.br), 1), S.one(S.pair(a.c, a.h), S.atom(a.c), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = ring(S, 0, 0); const k = benzyl(S, v, { rad: true });
        const pc = S.xy(k.c);
        k.b1 = S.at(pc[0] + DX * 1.3, pc[1] - 0.65, 'Br'); k.b2 = S.to(k.b1, 0, 'Br'); return k;
      });
      const p = S.frag(() => { const v = ring(S, 0, 0); return benzyl(S, v, { br: true }); });
      const br = S.frag(() => { const b = S.at(0, 0, 'Br'); S.radical(b); return {}; });
      return S.step({
        caption: '3. Das Benzylradikal holt sich ein Br-Atom aus Br₂: Benzylbromid — und ein neues Br• setzt die Kette fort.',
        row: [a, '→', p, '+', br], y: 0,
        curly: [S.one(S.atom(a.c), S.pair(a.c, a.b1), 1), S.one(S.pair(a.b1, a.b2), S.pair(a.c, a.b1), -1), S.one(S.pair(a.b1, a.b2), S.atom(a.b2), -1)]
      });
    })()
  ]
};

module.exports = M;
