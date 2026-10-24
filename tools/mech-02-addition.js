/* Mechanisms — Addition an C=C / C≡C (frames as in lib-rx-02-addition.js).
   Alkene frame: R₁ (0,0) – C1 (DX,DY) = C2 (2DX,0) – R₂ (3DX,DY). */
const { scene, polar, DX, DY } = require('./lib-mech.js');

const M = {};
const ion = (S, label, q) => S.frag(() => ({ i: S.L(0, 0, label, q) }));
const lab = (S, label, q) => ion(S, label, q);
/* H₃O⁺ drawn out: H–O⁺(H)H with the reacting H at (x,y), O to the right */
function h3o(S, x, y, deg) {
  const h = S.at(x, y, 'H'), o = S.to(h, deg == null ? 0 : deg, 'O', { charge: 1 });
  S.to(o, (deg == null ? 0 : deg) + 60, 'H', { len: 0.85 }); S.to(o, (deg == null ? 0 : deg) - 60, 'H', { len: 0.85 });
  return { h, o };
}
function water(S, x, y, deg) {               // O with two H pointing away from `deg` (the attack direction)
  const o = S.at(x, y, 'O');
  const d = deg == null ? 0 : deg;
  S.to(o, d + 180 - 55, 'H', { len: 0.85 }); S.to(o, d + 180 + 55, 'H', { len: 0.85 });
  return o;
}
/* the alkene frame; o: { r2: label|null, c1q, c2q, db } */
function frame(S, o) {
  o = o || {};
  const r1 = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY, 'C', o.c1q), c2 = S.at(2 * DX, 0, 'C', o.c2q);
  S.b(r1, c1).b(c1, c2, o.db === false ? 1 : (o.db || 2));
  // r2down: an sp³ C2 in a ring above the bond turns its R₂ down
  const r2 = o.r2 === null ? null : S.L(3 * DX, o.r2down ? -DY : DY, o.r2 || 'R₂');
  if (r2 !== null) S.b(c2, r2);
  return { r1, c1, c2, r2 };
}
/* pentagon on the bond a→b (b = next vertex counter-clockwise when
   `side` is +1): returns the three further vertex positions */
function pent(pa, pb, side) {
  const d = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]) * 180 / Math.PI;
  const s = side < 0 ? -1 : 1;
  const v3 = polar(pb, d + s * 72), v4 = polar(v3, d + s * 144), v5 = polar(v4, d + s * 216);
  return [v3, v4, v5];
}
const P = (S, i) => S.xy(i);

/* ── Radikalische Cyclisierung ────────────────────────────────────── */
/* Drawn coiled throughout, in the orientation of the product ring
   (five-ring, node at the bottom): v1…v4 + the radical C v0, the vinyl
   group on v2. */
function hexenyl(S, opts) {
  opts = opts || {};
  const v = [];
  for (let k = 0; k < 5; k++) v.push(polar([0, 0], 270 + 72 * k, 0.8507));
  // while the ring is still open, its two ends stand a little apart
  if (!opts.closed) { v[1] = polar(v[1], 342, 0.3); v[2] = polar(v[2], 54, 0.15); }
  const a = v.map(p => S.at(p[0], p[1]));
  // chain a1–a0–a4–a3–a2 (ring bond a1–a2 missing until it closes)
  S.b(a[1], a[0]).b(a[0], a[4]).b(a[4], a[3]).b(a[3], a[2]);
  if (opts.closed) S.b(a[1], a[2]);
  const pc = polar(P(S, a[2]), 54, 1);
  const ext = S.at(pc[0], pc[1]);
  S.b(a[2], ext, opts.closed ? 1 : 2);
  let br = null;
  if (opts.br) { br = S.to(a[1], -18, 'Br'); }
  if (opts.rad === 'a1') S.radical(a[1]);
  if (opts.rad === 'ext') S.radical(ext);
  return { a, ext, br };
}
M['radikalische-cyclisierung'] = {
  title: 'Radikalkette mit 5-exo-Ringschluss',
  steps: [
    (() => {
      const S = scene();
      const sn = S.frag(() => { const s = S.L(0, 0, 'Bu₃Sn'); S.radical(s); return { s }; });
      const a = S.frag(() => hexenyl(S, { br: true }));
      const p = S.frag(() => hexenyl(S, { rad: 'a1' }));
      const snbr = lab(S, 'Bu₃Sn–Br');
      return S.step({
        caption: '1. Start: AIBN zerfällt beim Erhitzen in Radikale, die aus Bu₃Sn–H das Zinnradikal Bu₃Sn• erzeugen. Bu₃Sn• reißt das Halogenatom ab (starke Sn–Br-Bindung) — es entsteht ein primäres C-Radikal. Die Kette ist hier schon so gezeichnet, wie sie sich gleich schließt.',
        row: [sn, '+', a, '→', p, '+', snbr], y: 0,
        curly: [S.one(S.atom(sn.s), S.pair(sn.s, a.br), 1), S.one(S.pair(a.a[1], a.br), S.pair(sn.s, a.br), 1), S.one(S.pair(a.a[1], a.br), S.atom(a.a[1]), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => hexenyl(S, { rad: 'a1' }));
      const p = S.frag(() => hexenyl(S, { closed: true, rad: 'ext' }));
      return S.step({
        caption: '2. 5-exo-trig-Cyclisierung: Das Radikal addiert an das innere C der Doppelbindung. Der Fünfring schließt sich viel schneller als der Sechsring (6-endo) — wegen der günstigeren Überlappung im Übergangszustand. Das neue Radikal sitzt außerhalb des Rings.',
        row: [a, '→', p], y: 0,
        curly: [S.one(S.atom(a.a[1]), S.pair(a.a[1], a.a[2]), 1), S.one(S.pair(a.a[2], a.ext), S.pair(a.a[1], a.a[2]), -1), S.one(S.pair(a.a[2], a.ext), S.atom(a.ext), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = hexenyl(S, { closed: true, rad: 'ext' });
        const pe = S.xy(k.ext);
        k.h = S.at(pe[0] + 1.15, pe[1], 'H'); k.sn = S.to(k.h, 0, null, { label: 'SnBu₃' });
        return k;
      });
      const p = S.frag(() => hexenyl(S, { closed: true }));
      const sn = S.frag(() => { const s = S.L(0, 0, 'Bu₃Sn'); S.radical(s); return {}; });
      return S.step({
        caption: '3. Das Alkylradikal holt sich ein H-Atom von Bu₃Sn–H: Methylcyclopentan entsteht, und Bu₃Sn• startet die nächste Runde. Bu₃SnH langsam zutropfen — sonst fängt es das offene Radikal ab, bevor es cyclisiert.',
        row: [a, '→', p, '+', sn], y: 0,
        curly: [S.one(S.pair(a.h, a.sn), S.pair(a.ext, a.h), 1), S.one(S.atom(a.ext), S.pair(a.ext, a.h), -1), S.one(S.pair(a.h, a.sn), S.atom(a.sn), 1)]
      });
    })()
  ]
};

/* ── Bromaddition ─────────────────────────────────────────────────── */
M['bromierung-alken'] = {
  title: 'Über das cyclische Bromonium-Ion — anti-Addition',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = frame(S);
        k.b1 = S.at(1.3, 1.35, 'Br'); k.b2 = S.at(1.3, 2.35, 'Br'); S.b(k.b1, k.b2);
        return k;
      });
      const p = S.frag(() => {
        const k = frame(S, { db: 1 }); const ap = S.m.apex(k.c1, k.c2, +1);
        const br = S.at(ap[0], ap[1], 'Br', 1); S.b(k.c1, br).b(k.c2, br); return k;
      });
      return S.step({
        caption: '1. Die π-Elektronen greifen das (polarisierte) Br₂ an; ein freies Elektronenpaar des Br schließt zugleich den Dreiring: cyclisches Bromonium-Ion. Bromid geht ab.',
        row: [a, '→', p, '+', ion(S, 'Br', -1)], y: 0.4,
        curly: [S.cv(S.pair(a.c1, a.c2), S.atom(a.b1), -1), S.cv(S.pair(a.b1, a.b2), S.atom(a.b2), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = frame(S, { db: 1 }); const ap = S.m.apex(k.c1, k.c2, +1);
        k.br = S.at(ap[0], ap[1], 'Br', 1); S.b(k.c1, k.br).b(k.c2, k.br);
        k.nu = S.at(2 * DX, -1.45, 'Br', -1);
        return k;
      });
      const p = S.frag(() => {
        const k = frame(S, { db: 1 });
        S.b(k.c1, S.at(DX, DY + 1, 'Br'), 1, 1); S.b(k.c2, S.at(2 * DX, -1, 'Br'), 1, 6); return k;
      });
      return S.step({
        caption: '2. Bromid kann das Bromonium-Ion nur von der Rückseite angreifen und öffnet den Ring (S_N2-artig). Die beiden Br landen auf entgegengesetzten Seiten: anti-Addition. In Wasser greift H₂O statt Br⁻ an → Bromhydrin.',
        row: [a, '→', p], y: 0.25,
        curly: [S.cv(S.atom(a.nu), S.atom(a.c2), 1), S.cv(S.pair(a.c2, a.br), S.atom(a.br), 1)]
      });
    })()
  ]
};

/* ── Hydratisierung von Alkenen ───────────────────────────────────── */
/* Terminal alkene R₁–CH=CH₂ (C2 without R₂); the OH comes onto C1 from above. */
M['hydratisierung-alken'] = {
  title: 'Säurekatalysiert über das Carbenium-Ion (Markownikow)',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = frame(S, { r2: null }); Object.assign(k, h3o(S, 2 * DX + 0.4, -1.25, -30)); return k; });
      const p = S.frag(() => frame(S, { r2: null, db: 1, c1q: 1 }));
      return S.step({
        caption: '1. Die π-Elektronen holen sich ein Proton von H₃O⁺. Es geht an das endständige C — so entsteht das stabilere, sekundäre Carbenium-Ion.',
        row: [a, '→', p, '+', lab(S, 'H₂O')], y: 0.1,
        curly: [S.cv(S.pair(a.c1, a.c2), S.atom(a.h), -1), S.cv(S.pair(a.h, a.o), S.atom(a.o), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = frame(S, { r2: null, db: 1, c1q: 1 }); k.w = water(S, DX, DY + 1.45, 270); return k; });
      const p = S.frag(() => {
        const k = frame(S, { r2: null, db: 1 }); const o = S.at(DX, DY + 1, 'O', 1);
        S.b(k.c1, o); S.to(o, 30, 'H', { len: 0.85 }); S.to(o, 150, 'H', { len: 0.85 }); return k;
      });
      return S.step({
        caption: '2. Wasser greift als Nucleophil das Carbenium-Ion an — von beiden Seiten gleich: ein neues Stereozentrum wird racemisch.',
        row: [a, '→', p], y: 0.4,
        curly: [S.cv(S.atom(a.w), S.atom(a.c1), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = frame(S, { r2: null, db: 1 }); k.o = S.at(DX, DY + 1, 'O', 1);
        S.b(k.c1, k.o); k.h = S.to(k.o, 30, 'H', { len: 0.85 }); S.to(k.o, 150, 'H', { len: 0.85 });
        k.w = water(S, DX + 1.75, DY + 1.45, 180); return k;
      });
      const p = S.frag(() => { const k = frame(S, { r2: null, db: 1 }); S.b(k.c1, S.at(DX, DY + 1, 'O')); return k; });
      return S.step({
        caption: '3. Ein Wassermolekül nimmt das Proton ab: Der Alkohol entsteht und H₃O⁺ ist zurückgebildet (Katalyse). Ohne Umlagerungsgefahr geht es über die Oxymercurierung: Hg(OAc)₂ bildet ein Mercurinium-Ion, H₂O öffnet es am höher substituierten C, NaBH₄ ersetzt Hg durch H.',
        row: [a, '→', p, '+', lab(S, 'H₃O', 1)], y: 0.5,
        curly: [S.cv(S.atom(a.w), S.atom(a.h), 1), S.cv(S.pair(a.o, a.h), S.atom(a.o), 1)]
      });
    })()
  ]
};

/* ── Hydratisierung von Alkinen ───────────────────────────────────── */
/* Linear R₁–C1≡C2–H as in the scheme; C1 becomes the C=O. */
function alkyne(S, opts) {
  opts = opts || {};
  const r = S.L(0, 0, 'R₁'), c1 = S.at(1, 0), c2 = S.at(2, 0);
  S.b(r, c1).b(c1, c2, 3); const h = S.to(c2, 0, 'H', { len: 0.85 });
  return { r, c1, c2, h };
}
/* R₁–C1(Y)=C2(H)(Z) with C1 at (1,0): Y up, C2 to the lower right */
function vinyl(S, y, yq, z, o) {
  o = o || {};
  const r = S.L(0, 0, 'R₁'), c1 = S.at(1, 0, 'C', o.c1q), c2 = S.at(1 + DX, -DY, 'C', o.c2q);
  S.b(r, c1).b(c1, c2, o.single ? 1 : 2);
  const k = { r, c1, c2 };
  if (y) { k.y = S.any(1, 1, y, yq); S.b(c1, k.y, o.yd ? 2 : 1); }
  if (o.bare) return k;                    // CH₂ / CH₃ with implicit H
  k.h = S.to(c2, -30, 'H', { len: 0.85 });
  if (z) k.z = S.to(c2, 270, z === 'H' ? 'H' : null, z === 'H' ? { len: 0.85 } : { label: z, charge: o.zq });
  return k;
}
M['hydratisierung-alkin'] = {
  title: 'Hg²⁺-katalysiert über das Enol',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = alkyne(S); k.hg = S.L(1.5, -1.3, 'Hg', 2); return k; });
      const p = S.frag(() => vinyl(S, null, 0, 'Hg', { c1q: 1, zq: 1 }));
      return S.step({
        caption: '1. Hg²⁺ ist eine weiche Lewis-Säure und koordiniert die π-Elektronen der Dreifachbindung. Die positive Ladung sammelt sich am inneren, höher substituierten C (Markownikow).',
        row: [a, '→', p], y: -0.3,
        curly: [S.cv(S.pair(a.c1, a.c2), S.atom(a.hg), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = vinyl(S, null, 0, 'Hg', { c1q: 1, zq: 1 }); k.w = water(S, 1, 1.4, 270); return k; });
      const p = S.frag(() => {
        const k = vinyl(S, 'O', 1, 'Hg', { zq: 1 }); S.to(k.y, 30, 'H', { len: 0.85 }); S.to(k.y, 150, 'H', { len: 0.85 }); return k;
      });
      return S.step({
        caption: '2. Wasser greift das kationische C an.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.atom(a.w), S.atom(a.c1), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = vinyl(S, 'O', 1, 'Hg', { zq: 1 }); k.oh = S.to(k.y, 30, 'H', { len: 0.85 }); S.to(k.y, 150, 'H', { len: 0.85 });
        k.w = water(S, 1 + 1.7, 1.45, 180); return k;
      });
      const m = S.frag(() => { const k = vinyl(S, 'O', 0, 'Hg', { zq: 1 }); S.to(k.y, 150, 'H', { len: 0.85 }); return k; });
      const p = S.frag(() => { const k = vinyl(S, 'O', 0, null, { bare: true }); S.to(k.y, 150, 'H', { len: 0.85 }); return k; });
      return S.step({
        caption: '3. Wasser nimmt das Proton vom O ab. Danach ersetzt ein Proton das Quecksilber am C (Protodemercurierung) — Hg²⁺ ist wieder frei. Es entsteht ein Enol.',
        row: [a, '→', m, { arrow: '→', above: 'H₃O⁺', below: '−Hg²⁺' }, p], y: 0,
        curly: [S.cv(S.atom(a.w), S.atom(a.oh), 1), S.cv(S.pair(a.y, a.oh), S.atom(a.y), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = vinyl(S, 'O', 0, null, { bare: true }); S.to(k.y, 150, 'H', { len: 0.85 });
        Object.assign(k, h3o(S, 1 + DX + 0.75, -DY + 0.75, 0)); return k;
      });
      const p = S.frag(() => {
        const k = vinyl(S, 'O', 1, null, { single: true, yd: true, bare: true }); S.to(k.y, 150, 'H', { len: 0.85 });
        return k;
      });
      return S.step({
        caption: '4. Keto-Enol-Tautomerie (säurekatalysiert): Das Enol wird am C protoniert; das freie Elektronenpaar des O schiebt dabei nach.',
        row: [a, '→', p, '+', lab(S, 'H₂O')], y: 0,
        curly: [S.cv(S.atom(a.y), S.pair(a.c1, a.y), 1), S.cv(S.pair(a.c1, a.c2), S.atom(a.h), -1), S.cv(S.pair(a.h, a.o), S.atom(a.o), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = vinyl(S, 'O', 1, null, { single: true, yd: true, bare: true }); k.oh = S.to(k.y, 150, 'H', { len: 0.85 });
        k.w = water(S, 1 - 1.55, 1.75, 0); return k;
      });
      const p = S.frag(() => vinyl(S, 'O', 0, null, { single: true, yd: true, bare: true }));
      return S.step({
        caption: '5. Abgabe des Protons am O: Das Keton ist das stabilere Tautomer. Terminale Alkine liefern so Methylketone.',
        row: [a, '→', p, '+', lab(S, 'H₃O', 1)], y: 0,
        curly: [S.cv(S.atom(a.w), S.atom(a.oh), -1), S.cv(S.pair(a.y, a.oh), S.atom(a.y), -1)]
      });
    })()
  ]
};

/* ── Na/NH₃ (Birch-artige Alkin-Reduktion) ─────────────────────────── */
/* trans-bent intermediates: R₁ to the lower left of C1, R₂ to the upper right of C2 */
function bent(S, o) {
  o = o || {};
  const c1 = S.at(1, 0, 'C', o.q1), c2 = S.at(2, 0, 'C', o.q2);
  S.b(c1, c2, o.db ? 2 : 1);
  const r1 = S.L(1 - DX, -DY, 'R₁'), r2 = S.L(2 + DX, DY, 'R₂');
  S.b(c1, r1).b(c2, r2);
  const k = { c1, c2 };
  if (o.h1) k.h1 = S.to(c1, 120, 'H', { len: 0.85 });
  if (o.h2) k.h2 = S.to(c2, -60, 'H', { len: 0.85 });
  if (o.rad1) S.radical(c1);
  if (o.rad2) S.radical(c2);
  return k;
}
function nh3(S, hx, hy, deg) {               // H–NH₂ with the H at (hx,hy)
  const h = S.at(hx, hy, 'H'), n = S.to(h, deg, null, { label: deg > 90 && deg < 270 ? 'H₂N' : 'NH₂' });
  return { h, n };
}
M['lindlar-hydrierung'] = {
  title: 'Na/NH₃: zwei Elektronen und zwei Protonen → (E)-Alken',
  steps: [
    (() => {
      const S = scene();
      const na = S.frag(() => { const n = S.L(0, 0, 'Na'); S.radical(n); return { n }; });
      const a = S.frag(() => {
        const r1 = S.L(0, 0, 'R₁'), c1 = S.at(1, 0), c2 = S.at(2, 0), r2 = S.L(3, 0, 'R₂');
        S.b(r1, c1).b(c1, c2, 3).b(c2, r2); return { c1, c2 };
      });
      const p = S.frag(() => bent(S, { db: true, q1: -1, rad2: true }));
      return S.step({
        caption: '1. Natrium gibt ein Elektron in ein π*-Orbital des Alkins ab: Radikal-Anion. Die beiden Reste weichen sich gegenseitig aus — trans-Anordnung. (Lindlar-Hydrierung dagegen läuft an der Metalloberfläche ohne solche Zwischenstufen: beide H kommen von derselben Seite → (Z)-Alken.)',
        row: [na, '+', a, '→', p, '+', lab(S, 'Na', 1)], y: 0,
        curly: [S.one(S.atom(na.n), S.atom(a.c1), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = bent(S, { db: true, q1: -1, rad2: true }); Object.assign(k, nh3(S, 0.55, 1.35, 120)); return k; });
      const p = S.frag(() => bent(S, { db: true, h1: true, rad2: true }));
      return S.step({
        caption: '2. Das Carbanion-Ende ist so basisch, dass es NH₃ (bzw. den zugesetzten Alkohol) deprotoniert: Vinylradikal, weiterhin trans.',
        row: [a, '→', p, '+', lab(S, 'NH₂', -1)], y: 0,
        curly: [S.cv(S.atom(a.c1), S.atom(a.h), 1), S.cv(S.pair(a.h, a.n), S.atom(a.n), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const na = S.frag(() => { const n = S.L(0, 0, 'Na'); S.radical(n); return { n }; });
      const a = S.frag(() => bent(S, { db: true, h1: true, rad2: true }));
      const p = S.frag(() => bent(S, { db: true, h1: true, q2: -1 }));
      return S.step({
        caption: '3. Ein zweites Na-Atom überträgt ein Elektron auf das Radikal: Vinyl-Anion. Es behält die trans-Geometrie.',
        row: [na, '+', a, '→', p, '+', lab(S, 'Na', 1)], y: 0,
        curly: [S.one(S.atom(na.n), S.atom(a.c2), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = bent(S, { db: true, h1: true, q2: -1 }); Object.assign(k, nh3(S, 2.5, -1.4, -60)); return k; });
      const p = S.frag(() => bent(S, { db: true, h1: true, h2: true }));
      return S.step({
        caption: '4. Zweite Protonierung: Das (E)-Alken entsteht. Weiter reduziert wird es nicht — ein isoliertes Alken nimmt kein Elektron auf.',
        row: [a, '→', p, '+', lab(S, 'NH₂', -1)], y: 0,
        curly: [S.cv(S.atom(a.c2), S.atom(a.h), -1), S.cv(S.pair(a.h, a.n), S.atom(a.n), -1)]
      });
    })()
  ]
};

/* ── Prileschajew-Epoxidierung ────────────────────────────────────── */
M['epoxidierung-mcpba'] = {
  title: 'Konzertiert über den „Schmetterlings“-Übergangszustand',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = frame(S);
        k.ot = S.at(1.3, 1.75, 'O'); k.oa = S.at(0.6, 2.45, 'O'); k.c = S.at(1.0, 3.35);
        k.oc = S.at(2.0, 3.4, 'O'); k.h = S.at(2.1, 2.4, 'H');
        S.b(k.ot, k.oa).b(k.oa, k.c).b(k.c, k.oc, 2).b(k.ot, k.h);
        S.to(k.c, 150, null, { label: 'Ar' });
        return k;
      });
      const p = S.frag(() => {
        const k = frame(S, { db: 1 }); const ap = S.m.apex(k.c1, k.c2, +1);
        const o = S.at(ap[0], ap[1], 'O'); S.b(k.c1, o).b(k.c2, o); return k;
      });
      const acid = S.frag(() => {
        const c = S.at(0, 1.05), oa = S.at(-0.4, 0.15, 'O'), oc = S.at(1.0, 1.1, 'O');
        S.b(c, oc, 2).b(c, oa); S.to(oa, 0, 'H', { len: 0.85 }); S.to(c, 150, null, { label: 'Ar' }); return {};
      });
      return S.step({
        caption: 'Alles in einem Schritt: Das Alken greift das endständige O der Persäure an, die schwache O–O-Bindung bricht, und das Proton wandert auf den Carbonyl-Sauerstoff. Beide C–O-Bindungen entstehen auf derselben Seite — die Geometrie des Alkens bleibt erhalten (cis → cis-Epoxid). Ar = m-Chlorphenyl.',
        row: [a, '→', p, '+', acid], y: 0.4,
        curly: (() => { const w = { away: S.centre([a.ot, a.oa, a.c, a.oc, a.h]) };
          return [
            S.cv(S.pair(a.c1, a.c2), S.atom(a.ot), -1),
            S.cv(S.pair(a.ot, a.oa), S.pair(a.oa, a.c), 0, w),
            S.cv(S.pair(a.c, a.oc), S.pair(a.oc, a.h), 0, w),
            S.cv(S.pair(a.ot, a.h), S.pair(a.ot, a.c2), 0, w)
          ]; })()
      });
    })()
  ]
};

/* ── syn-Dihydroxylierung (OsO₄) ──────────────────────────────────── */
/* five-ring C1–C2–O_b–Os–O_a above the C=C bond */
function osmate(S, k, lift, outer) {
  const [pb, pOs, pa] = pent(P(S, k.c1), P(S, k.c2), 1).map(p => [p[0], p[1] + lift]);
  const ob = S.at(pb[0], pb[1], 'O'), os = S.at(pOs[0], pOs[1], outer === 'I' ? 'I' : 'Os'), oa = S.at(pa[0], pa[1], 'O');
  S.b(os, ob, lift ? 2 : 1).b(os, oa, lift ? 2 : 1);
  S.to(os, 60, 'O', { order: 2 }); S.to(os, 150, 'O', { order: 2 });
  if (!lift) S.b(k.c1, oa).b(k.c2, ob);
  return { oa, ob, os };
}
M['syn-dihydroxylierung'] = {
  title: '[3+2]-Cycloaddition zum cyclischen Osmatester',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = frame(S); return Object.assign(k, osmate(S, k, 0.75)); });
      const p = S.frag(() => { const k = frame(S, { db: 1, r2down: true }); return Object.assign(k, osmate(S, k, 0)); });
      return S.step({
        caption: '1. OsO₄ addiert in einem Schritt mit zwei O-Atomen an dieselbe Seite der Doppelbindung: cyclischer Osmat(VI)-ester. Os wird dabei von +8 auf +6 reduziert.',
        row: [a, '→', p], y: 0.7,
        curly: [
          S.cv(S.pair(a.c1, a.c2), S.pair(a.c1, a.oa), 1),
          S.cv(S.pair(a.os, a.oa), S.atom(a.os), 1),
          S.cv(S.pair(a.os, a.ob), S.pair(a.ob, a.c2), -1)
        ]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = frame(S, { db: 1, r2down: true }); return Object.assign(k, osmate(S, k, 0)); });
      const p = S.frag(() => {
        const k = frame(S, { db: 1 });
        S.b(k.c1, S.at(DX, DY + 1, 'O'), 1, 1); S.b(k.c2, S.at(2 * DX, -1, 'O'), 1, 1); return k;
      });
      return S.step({
        caption: '2. Hydrolyse des Osmatesters setzt das cis-Diol frei (beide OH auf derselben Seite — hier beide Keile). NMO oxidiert das Os(VI) zurück zu OsO₄, daher genügen katalytische Mengen. Kaltes, verdünntes KMnO₄/OH⁻ reagiert analog über einen cyclischen Manganatester.',
        row: [a, { arrow: '→', above: 'H₂O' }, p, '+', lab(S, 'OsO₂(OH)₂')], y: 0.5
      });
    })()
  ]
};

/* ── Ozonolyse ────────────────────────────────────────────────────── */
M['ozonolyse'] = {
  title: 'Criegee-Mechanismus: Primärozonid → Carbonyloxid → Ozonid',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = frame(S);
        const [pb, pm, pa] = pent(P(S, k.c1), P(S, k.c2), 1).map(p => [p[0], p[1] + 0.75]);
        k.ob = S.at(pb[0], pb[1], 'O'); k.om = S.at(pm[0], pm[1], 'O', 1); k.oa = S.at(pa[0], pa[1], 'O', -1);
        S.b(k.om, k.ob, 2).b(k.om, k.oa); return k;
      });
      const p = S.frag(() => {
        const k = frame(S, { db: 1, r2down: true });
        const [pb, pm, pa] = pent(P(S, k.c1), P(S, k.c2), 1);
        k.ob = S.at(pb[0], pb[1], 'O'); k.om = S.at(pm[0], pm[1], 'O'); k.oa = S.at(pa[0], pa[1], 'O');
        S.b(k.c2, k.ob).b(k.ob, k.om).b(k.om, k.oa).b(k.oa, k.c1); return k;
      });
      return S.step({
        caption: '1. Ozon addiert als 1,3-Dipol an die Doppelbindung ([3+2]-Cycloaddition): Primärozonid (Molozonid) mit einer O–O–O-Kette.',
        row: [a, '→', p], y: 0.7,
        curly: [S.cv(S.atom(a.oa), S.atom(a.c1), 1), S.cv(S.pair(a.c1, a.c2), S.pair(a.c2, a.ob), -1), S.cv(S.pair(a.om, a.ob), S.atom(a.om), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = frame(S, { db: 1, r2down: true });
        const [pb, pm, pa] = pent(P(S, k.c1), P(S, k.c2), 1);
        k.ob = S.at(pb[0], pb[1], 'O'); k.om = S.at(pm[0], pm[1], 'O'); k.oa = S.at(pa[0], pa[1], 'O');
        S.b(k.c2, k.ob).b(k.ob, k.om).b(k.om, k.oa).b(k.oa, k.c1); return k;
      });
      const p = S.frag(() => {
        const r1 = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY); S.b(r1, c1); S.b(c1, S.at(DX, DY + 1, 'O'), 2);
        const c2 = S.at(2 * DX + 0.7, 0), r2 = S.L(3 * DX + 0.7, DY, 'R₂'); S.b(c2, r2);
        const ob = S.at(2 * DX + 0.7, -1, 'O', 1), om = S.to(ob, -30, 'O', { charge: -1 }); S.b(c2, ob, 2);
        return {};
      });
      return S.step({
        caption: '2. Das Primärozonid ist instabil (zwei O–O-Bindungen) und zerfällt in einer Retro-[3+2]-Reaktion in eine Carbonylverbindung und ein Carbonyloxid (Criegee-Zwitterion).',
        row: [a, '→', p], y: 0.5,
        curly: [S.cv(S.atom(a.ob), S.pair(a.c2, a.ob), 1), S.cv(S.pair(a.c1, a.c2), S.pair(a.c1, a.oa), 1), S.cv(S.pair(a.oa, a.om), S.atom(a.om), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const ring = (cx, cy, r) => [198, 270, 342, 54, 126].map(d => polar([cx, cy], d, r));
      const a = S.frag(() => {
        const q = ring(1.3, 0.6, 1.1);
        const c1 = S.at(q[0][0] - 0.2, q[0][1]), oa = S.at(q[1][0] - 0.45, q[1][1] - 0.1, 'O');
        const c2 = S.at(q[2][0] + 0.2, q[2][1]), ob = S.at(q[3][0] + 0.2, q[3][1], 'O', 1), om = S.at(q[4][0] + 0.05, q[4][1] + 0.1, 'O', -1);
        S.b(c1, oa, 2).b(c2, ob, 2).b(ob, om);
        S.b(c1, S.L(q[0][0] - 1.15, q[0][1] - 0.3, 'R₁')).b(c2, S.L(q[2][0] + 1.15, q[2][1] - 0.3, 'R₂'));
        return { c1, oa, c2, ob, om };
      });
      const p = S.frag(() => {
        const q = ring(1.3, 0.6, 0.8507);
        const c1 = S.at(...q[0]), oa = S.at(q[1][0], q[1][1], 'O'), c2 = S.at(...q[2]), ob = S.at(q[3][0], q[3][1], 'O'), om = S.at(q[4][0], q[4][1], 'O');
        S.b(c1, oa).b(oa, c2).b(c2, ob).b(ob, om).b(om, c1);
        S.b(c1, S.L(q[0][0] - 0.95, q[0][1] - 0.3, 'R₁')).b(c2, S.L(q[2][0] + 0.95, q[2][1] - 0.3, 'R₂'));
        return {};
      });
      return S.step({
        caption: '3. Beide Bruchstücke finden sich andersherum wieder zusammen (erneut [3+2]): das stabilere Sekundärozonid, ein 1,2,4-Trioxolan.',
        row: [a, '→', p], y: 0.6,
        curly: [S.cv(S.atom(a.om), S.atom(a.c1), 1), S.cv(S.pair(a.c1, a.oa), S.pair(a.oa, a.c2), -1), S.cv(S.pair(a.c2, a.ob), S.atom(a.ob), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const q = [198, 270, 342, 54, 126].map(d => polar([1.3, 0.6], d, 0.8507));
        const c1 = S.at(...q[0]), oa = S.at(q[1][0], q[1][1], 'O'), c2 = S.at(...q[2]), ob = S.at(q[3][0], q[3][1], 'O'), om = S.at(q[4][0], q[4][1], 'O');
        S.b(c1, oa).b(oa, c2).b(c2, ob).b(ob, om).b(om, c1);
        S.b(c1, S.L(q[0][0] - 0.95, q[0][1] - 0.3, 'R₁')).b(c2, S.L(q[2][0] + 0.95, q[2][1] - 0.3, 'R₂'));
        const s = S.at(q[4][0] - 0.2, q[4][1] + 1.3, 'S'); S.to(s, 150, null, { label: 'H₃C' }); S.to(s, 30, null, { label: 'CH₃' });
        return { om, ob, s };
      });
      const p1 = S.frag(() => { const r = S.L(0, 0, 'R₁'), c = S.at(DX, DY); S.b(r, c); S.b(c, S.at(DX, DY + 1, 'O'), 2); return {}; });
      const p2 = S.frag(() => { const r = S.L(0, 0, 'R₂'), c = S.at(DX, DY); S.b(r, c); S.b(c, S.at(DX, DY + 1, 'O'), 2); return {}; });
      const dmso = lab(S, '(CH₃)₂S=O');
      return S.step({
        caption: '4. Reduktive Aufarbeitung: Dimethylsulfid (oder Zn/HOAc) greift die O–O-Bindung an und nimmt ein O-Atom auf (→ DMSO); das Ozonid zerfällt dabei in zwei Aldehyde. Oxidative Aufarbeitung (H₂O₂) liefert stattdessen Carbonsäuren.',
        row: [a, '→', p1, '+', p2, '+', dmso], y: 0.6,
        curly: [S.cv(S.atom(a.s), S.atom(a.om), 1), S.cv(S.pair(a.om, a.ob), S.atom(a.ob), -1)]
      });
    })()
  ]
};

/* ── Malaprade (NaIO₄) ────────────────────────────────────────────── */
M['diolspaltung-periodat'] = {
  title: 'Cyclischer Periodatester, dann Fragmentierung',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r1 = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY), c2 = S.at(2 * DX, 0), r2 = S.L(3 * DX, DY, 'R₂');
        S.b(r1, c1).b(c1, c2).b(c2, r2);
        const o1 = S.at(DX, DY + 1, 'O'), o2 = S.at(2 * DX, -1, 'O'); S.b(c1, o1).b(c2, o2);
        S.to(o1, 150, 'H', { len: 0.85 }); S.to(o2, -30, 'H', { len: 0.85 });
        return {};
      });
      const p = S.frag(() => {
        const k = frame(S, { db: 1, r2down: true }); Object.assign(k, osmate(S, k, 0, 'I'));
        S.charge(k.os, -1); return k;
      });
      return S.step({
        caption: '1. Beide OH-Gruppen kondensieren mit dem Periodat zum cyclischen Iodat(VII)-ester (zwei nucleophile Angriffe der O-Atome am Iod unter Wasserabspaltung). Das gelingt nur, wenn die OH-Gruppen nah beieinander stehen — trans-Diole an starren Ringen reagieren kaum.',
        row: [a, { arrow: '→', above: 'IO₄⁻', below: '−2 H₂O' }, p], y: 0.5
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = frame(S, { db: 1, r2down: true }); Object.assign(k, osmate(S, k, 0, 'I'));
        S.charge(k.os, -1); return k;
      });
      const p1 = S.frag(() => { const r = S.L(0, 0, 'R₁'), c = S.at(DX, DY); S.b(r, c); S.b(c, S.at(DX, DY + 1, 'O'), 2); return {}; });
      const p2 = S.frag(() => { const r = S.L(0, 0, 'R₂'), c = S.at(DX, DY); S.b(r, c); S.b(c, S.at(DX, DY + 1, 'O'), 2); return {}; });
      return S.step({
        caption: '2. Cyclische Fragmentierung: Die C–C-Bindung bricht, beide C–O werden zu C=O, und Iod wird von +7 auf +5 reduziert (IO₃⁻). Aus einem 1,2-Diol werden zwei Carbonylverbindungen — wie bei der Ozonolyse des entsprechenden Alkens.',
        row: [a, '→', p1, '+', p2, '+', lab(S, 'IO₃', -1)], y: 0.5,
        curly: [S.cv(S.pair(a.c1, a.c2), S.pair(a.c2, a.ob), -1), S.cv(S.pair(a.ob, a.os), S.atom(a.os), -1), S.cv(S.pair(a.oa, a.os), S.pair(a.c1, a.oa), 1)]
      });
    })()
  ]
};

/* ── Epoxidöffnung ────────────────────────────────────────────────── */
function epox(S) {
  const r1 = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY), c2 = S.at(2 * DX, 0), r2 = S.L(3 * DX, DY, 'R₂');
  S.b(r1, c1).b(c1, c2).b(c2, r2);
  const ap = S.m.apex(c1, c2, +1); const o = S.at(ap[0], ap[1], 'O'); S.b(c1, o).b(c2, o);
  return { c1, c2, o };
}
function opened(S, oq, oh) {
  const r1 = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY), c2 = S.at(2 * DX, 0), r2 = S.L(3 * DX, DY, 'R₂');
  S.b(r1, c1).b(c1, c2).b(c2, r2);
  const o = S.at(DX, DY + 1, 'O', oq); S.b(c1, o, 1, 1);
  S.b(c2, S.L(2 * DX, -1, 'Nu'), 1, 6);
  return { o };
}
M['epoxid-oeffnung'] = {
  title: 'S_N2 am gespannten Dreiring',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = epox(S); k.nu = S.L(2 * DX, -1.5, 'Nu', -1); return k; });
      const p = S.frag(() => opened(S, -1));
      return S.step({
        caption: '1. Basisch/neutral: Das Nucleophil greift von der Rückseite das WENIGER substituierte C an (S_N2) — die Ringspannung (~115 kJ/mol) macht das sonst schlechte Alkoholat zur Abgangsgruppe. Inversion an diesem C: Nu und O stehen trans.',
        row: [a, '→', p], y: 0.3,
        curly: [S.cv(S.atom(a.nu), S.atom(a.c2), 1), S.cv(S.pair(a.c2, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = opened(S, -1);
        k.h = S.at(DX + 1.25, DY + 1.3, 'H'); k.x = S.to(k.h, 0, null, { label: 'Nu' });
        return k;
      });
      const p = S.frag(() => opened(S, 0));
      return S.step({
        caption: '2. Das Alkoholat wird protoniert (vom Lösungsmittel oder bei der Aufarbeitung). Unter sauren Bedingungen ist es umgekehrt: Erst wird der Epoxid-O protoniert, dann greift Nu–H das HÖHER substituierte C an, das die positive Ladung besser trägt — ebenfalls anti.',
        row: [a, '→', p, '+', lab(S, 'Nu', -1)], y: 0.3,
        curly: [S.cv(S.atom(a.o), S.atom(a.h), -1), S.cv(S.pair(a.h, a.x), S.atom(a.x), -1)]
      });
    })()
  ]
};

/* ── Iodlactonisierung ────────────────────────────────────────────── */
/* Drawn coiled, in the orientation of the product lactone (ring with
   its O at the top): v0 O, v1 C=O, v2, v3 CH₂, v4 CH(–CH₂I). */
function lactone(S, o) {
  o = o || {};
  const v = [90, 162, 234, 306, 18].map(d => polar([0, 0], d, 0.8507));
  const O = S.at(v[0][0] + (o.open ? -0.15 : 0), v[0][1] + (o.open ? 0.25 : 0), 'O', o.oq);
  const c = v.slice(1).map(p => S.at(p[0], p[1]));
  S.b(c[0], O).b(c[0], c[1]).b(c[1], c[2]).b(c[2], c[3]);
  if (!o.open) S.b(O, c[3]);
  S.b(c[0], S.at(...polar(v[1], 162, 1), 'O'), 2);
  const pe = polar(v[4], 18, 1), ext = S.at(pe[0], pe[1]);
  S.b(c[3], ext, o.db ? 2 : 1);
  let i = null;
  if (o.i === 'bridge') { const ap = S.m.apex(c[3], ext, -1); i = S.at(ap[0], ap[1], 'I', 1); S.b(c[3], i).b(ext, i); }
  if (o.i === 'end') { i = S.to(ext, -42, 'I'); }
  return { O, c, ext, i };
}
M['iodlactonisierung'] = {
  title: 'Iodonium-Ion, intramolekular vom Carboxylat geöffnet',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = lactone(S, { open: true, db: true, oq: -1 });
        k.i1 = S.at(1.5, -1.45, 'I'); k.i2 = S.at(2.5, -1.45, 'I'); S.b(k.i1, k.i2); return k;
      });
      const p = S.frag(() => lactone(S, { open: true, oq: -1, i: 'bridge' }));
      return S.step({
        caption: '1. NaHCO₃ hat die Säure zum Carboxylat deprotoniert. Die Doppelbindung greift I₂ an: cyclisches Iodonium-Ion (wie das Bromonium-Ion), Iodid geht ab. Die Kette ist schon so gezeichnet, wie sie den Ring schließt.',
        row: [a, '→', p, '+', ion(S, 'I', -1)], y: 0,
        curly: [S.cv(S.pair(a.c[3], a.ext), S.atom(a.i1), -1), S.cv(S.pair(a.i1, a.i2), S.atom(a.i2), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => lactone(S, { open: true, oq: -1, i: 'bridge' }));
      const p = S.frag(() => lactone(S, { i: 'end' }));
      return S.step({
        caption: '2. Das Carboxylat-O öffnet das Iodonium-Ion von der Rückseite — intramolekular, bevorzugt zum Fünfring (5-exo). Das Iod landet anti zum neuen C–O an der CH₂-Gruppe: γ-Lacton mit Iodmethylgruppe. Die Reaktion ist reversibel und liefert das thermodynamisch stabilere Lacton.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.atom(a.O), S.atom(a.c[3]), -1), S.cv(S.pair(a.c[3], a.i), S.atom(a.i), -1)]
      });
    })()
  ]
};

module.exports = M;
