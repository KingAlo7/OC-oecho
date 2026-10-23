/* Mechanisms — Heterocyclen & Biochemie (frames as in lib-rx-09-heterocyclen.js).
   Ring closures are drawn in the orientation of the ring that forms. */
const { scene, polar, DX, DY } = require('./lib-mech.js');

const M = {};
const lab = (S, label, q) => S.frag(() => ({ i: S.L(0, 0, label, q) }));
const H = (S, i, deg) => S.to(i, deg, 'H', { len: 0.85 });
const away = (S, ids) => ({ away: S.centre(ids) });

/* benzene on the origin, vertices 30°+60°k; db = list of double bonds */
function benz(S, db, q) {
  const v = [];
  for (let k = 0; k < 6; k++) { const p = polar([0, 0], 30 + 60 * k, 1); v.push(S.at(p[0], p[1], 'C', (q || {})[k])); }
  for (let k = 0; k < 6; k++) { const j = (k + 1) % 6; S.b(v[k], v[j], (db || [[0, 1], [2, 3], [4, 5]]).some(d => (d[0] === k && d[1] === j) || (d[0] === j && d[1] === k)) ? 2 : 1); }
  return v;
}

/* ── Bischler-Napieralski ─────────────────────────────────────────── */
/* the new six-ring fused on v0–v5 (right flank): v0 – w0 (CH₂) – w1 (CH₂)
   – w2 (N) – w3 (C–R₁) – v5. Correct product: C=N next to the arene. */
/* hexagon centred at (√3, 0): its vertices at 150° and 210° are v0 and v5 */
const HX = [90, 30, 330, 270].map(d => polar([Math.sqrt(3), 0], d, 1));   // w0, w1, w2, w3
function bn(S, o) {
  o = o || {};
  const v = benz(S, o.db || [[0, 1], [2, 3], [4, 5]], o.vq);
  const P = HX.map(p => p.slice());
  if (o.open) P[3] = polar(P[3], 300, 0.3);
  const w0 = S.at(...P[0]), w1 = S.at(...P[1]), n = S.at(P[2][0], P[2][1], 'N', o.nq), c = S.at(P[3][0], P[3][1], 'C', o.cq);
  S.b(v[0], w0).b(w0, w1).b(w1, n).b(n, c, o.nc || 1);
  if (!o.open) S.b(c, v[5]);
  const k = { v, w0, w1, n, c };
  S.b(c, S.L(...polar(P[3], 300, 1), 'R₁'));   // R₁ and the O share the outside of C
  if (o.nh) k.hn = H(S, n, 30);
  if (o.co) { k.o = S.at(...polar(P[3], 240, 1), 'O', o.oq); S.b(c, k.o, o.co); }
  if (o.op) { k.o = S.at(...polar(P[3], 240, 1), 'O'); S.b(c, k.o); k.p = S.to(k.o, 210, null, { label: 'POCl₂' }); }
  if (o.h5) k.h5 = S.to(v[5], 270, 'H', { len: 0.85 });
  return k;
}
M['bischler-napieralski'] = {
  title: 'Nitrilium-Ion und intramolekulare S_E(Ar)',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = bn(S, { open: true, nh: true, co: 2 });
        k.pp = S.at(...polar(S.xy(k.o), 240, 1.35), 'P'); S.to(k.pp, 270, 'O', { order: 2 }); S.to(k.pp, 180, 'Cl'); k.cl = S.to(k.pp, 330, 'Cl'); S.to(k.pp, 90, 'Cl');
        return k;
      });
      const p = S.frag(() => bn(S, { open: true, nc: 2, op: true }));
      return S.step({
        caption: '1. POCl₃ aktiviert das Amid: Der Carbonyl-Sauerstoff greift das P an, Chlorid geht. Nach Abgabe des N–H-Protons (−HCl) liegt ein Imidoylphosphat vor. Die Kette ist schon so gezeichnet, wie sie den Ring schließt.',
        row: [a, { arrow: '→', below: '−HCl' }, p], y: 0,
        curly: [S.cv(S.atom(a.o), S.atom(a.pp), 1), S.cv(S.pair(a.pp, a.cl), S.atom(a.cl), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => bn(S, { open: true, nc: 2, op: true }));
      const p = S.frag(() => bn(S, { open: true, nc: 3, nq: 1 }));
      return S.step({
        caption: '2. Das freie Elektronenpaar des N stößt die Phosphat-Abgangsgruppe aus: Nitrilium-Ion R₁–C≡N⁺–R — ein sehr starkes Elektrophil.',
        row: [a, '→', p, '+', lab(S, 'Cl₂PO₂', -1)], y: 0,
        curly: [S.cv(S.atom(a.n), S.pair(a.n, a.c), -1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => bn(S, { open: true, nc: 3, nq: 1 }));
      const p = S.frag(() => bn(S, { nc: 2, db: [[0, 1], [2, 3]], vq: { 4: 1 }, h5: true }));
      return S.step({
        caption: '3. Intramolekulare elektrophile aromatische Substitution: Die ortho-Position des Arylrings greift das Nitrilium-C an und schließt den Sechsring (σ-Komplex). Elektronenreiche Arylreste (OMe) reagieren am besten.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.pair(a.v[4], a.v[5]), S.atom(a.c), -1), S.cv(S.pair(a.c, a.n), S.atom(a.n), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = bn(S, { nc: 2, db: [[0, 1], [2, 3]], vq: { 4: 1 }, h5: true }); k.b = S.L(...polar(S.xy(k.h5), 250, 1.1), 'B'); return k; });
      const p = S.frag(() => bn(S, { nc: 2 }));
      return S.step({
        caption: '4. Rearomatisierung: 1-substituiertes 3,4-Dihydroisochinolin (C=N direkt am Aromaten). Mit NaBH₄ reduziert entsteht das Tetrahydroisochinolin-Gerüst vieler Alkaloide (z. B. Papaverin).',
        row: [a, '→', p, '+', lab(S, 'H–B', 1)], y: 0,
        curly: [S.cv(S.atom(a.b), S.atom(a.h5), -1), S.cv(S.pair(a.v[5], a.h5), S.pair(a.v[4], a.v[5]), -1)]
      });
    })()
  ]
};

/* ── Fischer-Indolsynthese ────────────────────────────────────────── */
/* The aryl N1 stays on v0 (as in the scheme's hydrazone). For the [3,3]
   step the six atoms v5, v0, N1, N2, Cc, Cα form a hexagon to the right
   of the ring; the indole is the five-ring on v0–v5. */
const HEX = [150, 90, 30, 330, 270, 210].map(d => polar([Math.sqrt(3), 0], d, 1)); // v0, N1, N2, Cc, Cα, v5
const PEN = (() => {   // pentagon on v5 → v0, outwards: N1, C2, C3
  const v0 = polar([0, 0], 30, 1);
  const a = polar(v0, 18, 1), b = polar(a, -54, 1), c = polar(b, -126, 1);
  return [a, b, c];
})();
function fi(S, o) {
  o = o || {};
  const v = benz(S, o.db || [[5, 0], [1, 2], [3, 4]], o.vq);
  const k = { v };
  if (o.indole) {
    const n1 = S.at(...PEN[0], 'N', o.n1q), c2 = S.at(...PEN[1]), c3 = S.at(...PEN[2]);
    S.b(v[0], n1).b(n1, c2).b(c2, c3, o.c23 || 1).b(c3, v[5]);
    S.b(c2, S.L(...polar(PEN[1], o.nh2 ? -25 : 0, 1), 'R₁')).b(c3, S.L(...polar(PEN[2], -54, 1), 'R₂'));
    Object.assign(k, { n1, cc: c2, ca: c3 });
    if (o.n1h) k.h1 = H(S, n1, o.nh2 ? 110 : 54);
    if (o.nh2) { k.n2 = S.at(...polar(PEN[1], 45, 1), 'N', o.n2q); S.b(c2, k.n2); }
    if (o.h3) k.h3 = H(S, c3, 234);
    return k;
  }
  const P = HEX.map(p => p.slice());
  if (o.open) P[4] = polar(P[4], 270, 0.3);
  const n1 = S.at(P[1][0], P[1][1], 'N', o.n1q), n2 = S.at(P[2][0], P[2][1], 'N', o.n2q), cc = S.at(...P[3]), ca = S.at(...P[4]);
  S.b(v[0], n1, o.v0n1 || 1).b(n2, cc, o.n2cc || 1).b(cc, ca, o.ccca || 1);
  if (!o.broken) S.b(n1, n2);
  if (!o.open) S.b(ca, v[5]);
  S.b(cc, S.L(...polar(P[3], 330, 1), 'R₁')).b(ca, S.L(...polar(P[4], 270, 1), 'R₂'));
  Object.assign(k, { n1, n2, cc, ca });
  if (o.n1h) k.h1 = H(S, n1, 90);
  if (o.n1h2) H(S, n1, 150);
  if (o.n2h) k.h2 = H(S, n2, 30);
  if (o.hA) k.hA = H(S, ca, 210);
  if (o.h5) k.h5 = S.to(v[5], 270, 'H', { len: 0.85 });
  return k;
}
M['fischer-indol'] = {
  title: 'Enhydrazin, [3,3]-Umlagerung, Ringschluss, NH₃-Abspaltung',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => fi(S, { open: true, n1h: true, n2cc: 2, hA: true }));
      const p = S.frag(() => fi(S, { open: true, n1h: true, n2h: true, ccca: 2 }));
      return S.step({
        caption: '1. Das Arylhydrazon (aus Arylhydrazin + Keton) tautomerisiert säurekatalysiert zum Enhydrazin — wie ein Imin zum Enamin. Dafür braucht das Keton ein α-H. Ab hier in der Lage des entstehenden Rings gezeichnet.',
        row: [a, { arrow: '⇌', above: 'H⁺' }, p], y: 0
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => fi(S, { open: true, n1h: true, n2h: true, ccca: 2 }));
      const p = S.frag(() => fi(S, { broken: true, db: [[1, 2], [3, 4]], v0n1: 2, n1h: true, n2h: true, n2cc: 2, h5: true }));
      return S.step({
        caption: '2. [3,3]-Sigmatrope Umlagerung (nach Protonierung von N2): Die schwache N–N-Bindung bricht, zwischen dem ortho-C des Rings und dem Enamin-C entsteht die neue C–C-Bindung. Der Aromat ist vorübergehend aufgehoben.',
        row: [a, { arrow: '→', above: 'H⁺, Δ' }, p], y: 0,
        curly: (() => { const w = away(S, [a.v[0], a.n1, a.n2, a.cc, a.ca, a.v[5]]); return [
          S.cv(S.pair(a.cc, a.ca), S.pair(a.ca, a.v[5]), 0, w),
          S.cv(S.pair(a.v[5], a.v[0]), S.pair(a.v[0], a.n1), 0, w),
          S.cv(S.pair(a.n1, a.n2), S.pair(a.n2, a.cc), 0, w)]; })()
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => fi(S, { broken: true, db: [[1, 2], [3, 4]], v0n1: 2, n1h: true, n2h: true, n2cc: 2, h5: true }));
      const p = S.frag(() => fi(S, { broken: true, n1h: true, n1h2: true, n2h: true, n2cc: 2, n2q: 1 }));
      return S.step({
        caption: '3. Rearomatisierung durch Tautomerie (das H am sp³-C wandert zum N): Anilin und Iminium-Ion im selben Molekül.',
        row: [a, { arrow: '→', above: 'Tautomerie, H⁺' }, p], y: 0
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => fi(S, { broken: true, n1h: true, n1h2: true, n2h: true, n2cc: 2, n2q: 1 }));
      const p = S.frag(() => fi(S, { indole: true, n1h: true, n1q: 1, nh2: true, h3: true }));
      return S.step({
        caption: '4. Das Anilin-N greift das Iminium-C an: Der Fünfring schließt sich (cyclisches Aminal).',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.atom(a.n1), S.atom(a.cc), -1), S.cv(S.pair(a.cc, a.n2), S.atom(a.n2), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => fi(S, { indole: true, n1h: true, nh2: true, n2q: 1, h3: true }));
      const p = S.frag(() => fi(S, { indole: true, n1h: true, c23: 2 }));
      return S.step({
        caption: '5. Nach Protonierung geht NH₃ ab (als NH₄⁺), und Abgabe des H am C3 macht den Fünfring aromatisch: Indol. Gesamtbilanz: Arylhydrazon → Indol + NH₃. (Das N steht hier oben, weil die neue C–C-Bindung zur unteren ortho-Position geknüpft wurde — dasselbe Molekül wie im Schema.)',
        row: [a, '→', p, '+', lab(S, 'NH₄', 1)], y: 0,
        curly: [S.cv(S.pair(a.ca, a.h3), S.pair(a.cc, a.ca), 1), S.cv(S.pair(a.cc, a.n2), S.atom(a.n2), -1)]
      });
    })()
  ]
};

/* ── Transaminierung (PLP) ────────────────────────────────────────── */
/* amino-acid frame of the scheme: R₁ (0,0) – Cα (DX,DY) – COO⁻ (C at (2DX,0)),
   N up from Cα. The pyridoxal ring (simplified: only the ring N, which is
   the electron sink) stands on top: C4′ at (2DX, DY+1+DY), the ring above. */
function plp(S, o) {
  o = o || {};
  const r = S.L(0, 0, 'R₁'), ca = S.at(DX, DY), c = S.at(2 * DX, 0); S.b(r, ca).b(ca, c);
  S.b(c, S.at(2 * DX, -1, 'O'), 2); S.b(c, S.at(3 * DX, DY, 'O', -1));
  const n = S.at(DX, DY + 1, 'N'); S.b(ca, n, o.caN ? 2 : 1);
  const c4p = S.at(2 * DX, DY + 1 + DY); S.b(n, c4p, o.nC ? 2 : 1);
  const k = { ca, n, c4p };
  if (o.hA) k.hA = H(S, ca, 150);
  if (o.h4p) k.h4p = H(S, c4p, 330);
  H(S, c4p, o.h4p ? 30 : 330);
  // ring: C4 below the ring centre, N1 on top
  const ctr = [2 * DX, DY + 1 + DY + 2];
  const R = [270, 330, 30, 90, 150, 210].map(d => polar(ctr, d, 1));  // C4, C5, C6, N1, C2, C3
  const a = R.map((p, i) => S.at(p[0], p[1], i === 3 ? 'N' : 'C', i === 3 ? o.nq : 0));
  // aromatic pyridinium: C4=C3, C5=C6, N1=C2 ; quinonoid: C4=C4′ handled below, C3=C2, C5=C6
  const ring = o.quin ? [[0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 4, 1], [4, 5, 2], [5, 0, 1]]
                      : [[0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 4, 2], [4, 5, 1], [5, 0, 2]];
  ring.forEach(([i, j, ord]) => S.b(a[i], a[j], ord));
  S.b(c4p, a[0], o.quin ? 2 : 1);
  if (o.nh !== false) k.hN = H(S, a[3], 90);
  return Object.assign(k, { r: a });
}
M['transaminierung-plp'] = {
  title: 'Aldimin → chinoides Intermediat → Ketimin',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), ca = S.at(DX, DY), c = S.at(2 * DX, 0); S.b(r, ca).b(ca, c);
        S.b(c, S.at(2 * DX, -1, 'O'), 2); S.b(c, S.at(3 * DX, DY, 'O', -1)); S.b(ca, S.at(DX, DY + 1, 'N', 1)); return {};
      });
      const p = S.frag(() => plp(S, { nC: true, hA: true, nq: 1 }));
      return S.step({
        caption: '1. Das Coenzym Pyridoxalphosphat (PLP) ist im Enzym als Imin an ein Lysin gebunden. Die Aminosäure verdrängt das Lysin (Transiminierung): externes Aldimin. Der Pyridin-Ring ist hier vereinfacht (ohne OH, CH₃, CH₂OPO₃²⁻); wichtig ist nur das protonierte Ring-N — die Elektronenfalle.',
        row: [a, { arrow: '→', above: 'PLP–Lys', below: '−Lys' }, p], y: DY + 0.5
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = plp(S, { nC: true, hA: true, nq: 1 }); k.b = S.L(...polar(S.xy(k.hA), 180, 1.5), 'Lys–NH₂'); return k; });
      const p = S.frag(() => plp(S, { caN: true, quin: true, nh: true }));
      return S.step({
        caption: '2. Das α-H der Aminosäure wird abgespalten (Lysin als Base). Das Elektronenpaar fließt über die C=N-Bindung bis in den Pyridinring, dessen N⁺ es aufnimmt: chinoides Intermediat. Ohne PLP wäre dieses C–H nicht acide.',
        row: [a, '→', p, '+', lab(S, 'Lys–NH₃', 1)], y: DY + 0.5,
        curly: [
          S.cv(S.atom(a.b), S.atom(a.hA), -1),
          S.cv(S.pair(a.ca, a.hA), S.pair(a.ca, a.n), -1),
          S.cv(S.pair(a.n, a.c4p), S.pair(a.c4p, a.r[0]), 1),
          S.cv(S.pair(a.r[0], a.r[5]), S.pair(a.r[5], a.r[4]), 1),
          S.cv(S.pair(a.r[4], a.r[3]), S.atom(a.r[3]), 1)
        ]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = plp(S, { caN: true, quin: true }); k.h = S.at(...polar(S.xy(k.c4p), 330, 1.2), 'H'); k.hb = S.to(k.h, 330, null, { label: 'NH₂Lys', charge: 1 }); return k; });
      const p = S.frag(() => plp(S, { caN: true, h4p: true, nq: 1 }));
      return S.step({
        caption: '3. Das Lysin gibt das Proton zurück — aber an C4′ statt an Cα: Ketimin. Die C=N-Bindung ist damit vom Aminosäure-C zum Coenzym-C gewandert.',
        row: [a, '→', p, '+', lab(S, 'Lys–NH₂')], y: DY + 0.5,
        curly: [
          S.cv(S.atom(a.r[3]), S.pair(a.r[3], a.r[4]), 1),
          S.cv(S.pair(a.r[5], a.r[4]), S.pair(a.r[0], a.r[5]), -1),
          S.cv(S.pair(a.c4p, a.r[0]), S.atom(a.h), -1),
          S.cv(S.pair(a.h, a.hb), S.atom(a.hb), -1)
        ]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => plp(S, { caN: true, h4p: true, nq: 1 }));
      const p = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), ca = S.at(DX, DY), c = S.at(2 * DX, 0); S.b(r, ca).b(ca, c);
        S.b(c, S.at(2 * DX, -1, 'O'), 2); S.b(c, S.at(3 * DX, DY, 'O', -1)); S.b(ca, S.at(DX, DY + 1, 'O'), 2); return {};
      });
      return S.step({
        caption: '4. Hydrolyse des Ketimins (Umkehrung der Iminbildung) setzt die α-Ketosäure frei; das Coenzym bleibt als Pyridoxaminphosphat (PMP) zurück. In der zweiten Halbreaktion läuft alles rückwärts mit α-Ketoglutarat: PMP gibt die NH₂-Gruppe ab, es entsteht Glutamat und PLP.',
        row: [a, { arrow: '→', above: 'H₂O' }, p, '+', lab(S, 'PMP')], y: DY + 0.5
      });
    })()
  ]
};

/* ── Maillard / Amadori ───────────────────────────────────────────── */
/* aldose frame of the scheme: R₁ (0,0) – C2 (DX,DY) (OH up) – C1 (2DX,0);
   the amine N ends up at (3DX,DY) */
function ama(S, o) {
  o = o || {};
  const r = S.L(0, 0, 'R₁'), c2 = S.at(DX, DY), c1 = S.at(2 * DX, 0); S.b(r, c2).b(c2, c1, o.ene ? 2 : 1);
  const k = { c2, c1 };
  k.o = S.at(DX, DY + 1, 'O', o.oq); S.b(c2, k.o, o.keto ? 2 : 1);
  if (!o.keto || o.oq) k.ho = H(S, k.o, 150);
  k.n = S.at(3 * DX, DY, 'N', o.nq); S.b(c1, k.n, o.imine ? 2 : 1); S.b(k.n, S.L(4 * DX, 0, 'R₂'));
  if (o.nh) k.hn = H(S, k.n, 90);
  if (o.c1h) k.hc = H(S, c1, 270);
  return k;
}
M['maillard-amadori'] = {
  title: 'Iminium-Ion, Enaminol, Keto-Amin',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), c2 = S.at(DX, DY), c1 = S.at(2 * DX, 0); S.b(r, c2).b(c2, c1);
        S.b(c2, S.at(DX, DY + 1, 'O')); S.b(c1, S.at(2 * DX, -1, 'O'), 2); S.b(c1, S.L(3 * DX, DY, 'H')); return {};
      });
      const p = S.frag(() => {
        const k = ama(S, { imine: true, nq: 1, nh: true }); k.h2 = S.to(k.c2, 150, 'H', { len: 0.85 }); return k;
      });
      return S.step({
        caption: '1. Die offenkettige Aldose bildet mit einer Aminogruppe (z. B. der Lysin-Seitenkette eines Proteins) — wie bei der Iminbildung — ein Iminium-Ion (Schiff-Base, protoniert).',
        row: [a, { arrow: '→', above: 'R₂–NH₂, H⁺', below: '−H₂O' }, p], y: DY
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = ama(S, { imine: true, nq: 1, nh: true }); k.h2 = S.to(k.c2, 150, 'H', { len: 0.85 });
        k.b = S.L(...polar(S.xy(k.h2), 210, 1.1), 'B'); return k;
      });
      const p = S.frag(() => ama(S, { ene: true, nh: true }));
      return S.step({
        caption: '2. Das H an C2 (neben dem Iminium-C) wird abgespalten: 1,2-Enaminol — ein Enol, das zugleich ein Enamin ist.',
        row: [a, '→', p, '+', lab(S, 'H–B', 1)], y: DY,
        curly: [S.cv(S.atom(a.b), S.atom(a.h2), -1), S.cv(S.pair(a.c2, a.h2), S.pair(a.c2, a.c1), -1), S.cv(S.pair(a.c1, a.n), S.atom(a.n), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = ama(S, { ene: true, nh: true }); k.h = S.at(2 * DX, -1.2, 'H'); k.ha = S.to(k.h, 270, null, { label: 'B', charge: 1 }); return k; });
      const p = S.frag(() => ama(S, { keto: true, oq: 1, nh: true }));
      return S.step({
        caption: '3. Keto-Enol-Tautomerie: C1 wird protoniert, das O-Elektronenpaar bildet die C=O-Bindung an C2.',
        row: [a, '→', p, '+', lab(S, 'B')], y: DY,
        curly: [S.cv(S.atom(a.o), S.pair(a.c2, a.o), 1), S.cv(S.pair(a.c2, a.c1), S.atom(a.h), -1), S.cv(S.pair(a.h, a.ha), S.atom(a.ha), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => ama(S, { keto: true, oq: 1, nh: true }));
      const p = S.frag(() => ama(S, { keto: true, nh: true }));
      return S.step({
        caption: '4. Abgabe des Protons: das Amadori-Produkt, eine 1-Amino-1-desoxy-2-ketose. Es ist der Ausgangspunkt der Maillard-Reaktion (Bräunung, Röstaromen) — und im Blut die Grundlage des HbA1c-Werts.',
        row: [a, { arrow: '→', above: '−H⁺' }, p], y: DY
      });
    })()
  ]
};

/* ── Halbacetal / Mutarotation ────────────────────────────────────── */
/* in the orientation of the scheme's pyranose (six-ring, vertex 0 at 30°):
   v0 the anomeric C1, v1 the ring O (from the C5–OH), v2…v5 C5…C2. */
function pyr(S, o) {
  o = o || {};
  const P = [30, 90, 150, 210, 270, 330].map(d => polar([0, 0], d, 1));
  if (o.open) P[1] = polar(P[1], 90, 0.3);
  const v = P.map((p, i) => S.at(p[0], p[1], i === 1 ? 'O' : 'C', i === 1 ? o.oq : 0));
  [[1, 2], [2, 3], [3, 4], [4, 5], [5, 0]].forEach(([i, j]) => S.b(v[i], v[j]));
  if (!o.open) S.b(v[0], v[1]);
  const k = { v };
  if (o.oh1) k.h1 = H(S, v[1], 150);
  k.o = S.at(...polar(P[0], 30, 1), 'O', o.cq); S.b(v[0], k.o, o.co ? 2 : 1, o.stereo || 0);
  if (o.coh) k.hc = H(S, k.o, o.co ? 90 : 90);
  return k;
}
M['mutarotation-halbacetal'] = {
  title: 'Intramolekulare Halbacetalbildung — von beiden Seiten',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = pyr(S, { open: true, oh1: true, co: true }); k.h = S.at(...polar(S.xy(k.o), -30, 1.15), 'H'); k.ha = S.to(k.h, -30, null, { label: 'A' }); return k; });
      const p = S.frag(() => pyr(S, { open: true, oh1: true, co: true, cq: 1, coh: true }));
      return S.step({
        caption: '1. Die offene Kette (hier schon in Ringform gefaltet) wird am Carbonyl-O protoniert (Säure katalysiert, auch Basen beschleunigen).',
        row: [a, '→', p, '+', lab(S, 'A', -1)], y: 0,
        curly: [S.cv(S.atom(a.o), S.atom(a.h), -1), S.cv(S.pair(a.h, a.ha), S.atom(a.ha), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => pyr(S, { open: true, oh1: true, co: true, cq: 1, coh: true }));
      const p = S.frag(() => pyr(S, { oq: 1, oh1: true, coh: true }));
      return S.step({
        caption: '2. Die OH-Gruppe an C5 greift das Carbonyl-C an: Sechsring (Pyranose). Das planare C=O wird von oben oder von unten angegriffen — so entstehen zwei Anomere.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.atom(a.v[1]), S.atom(a.v[0]), -1), S.cv(S.pair(a.v[0], a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => pyr(S, { coh: true, stereo: 1 }));
      const p = S.frag(() => pyr(S, { coh: true, stereo: 6 }));
      return S.step({
        caption: '3. Nach Abgabe des Protons: das cyclische Halbacetal, als β-Anomer (OH am anomeren C hier nach vorn) oder α-Anomer. In Lösung wandeln sich beide über die offene Form ineinander um — der Drehwert ändert sich, bis das Gleichgewicht erreicht ist (Mutarotation; Glucose: ca. 64 % β, 36 % α, < 1 % offen).',
        row: [a, { arrow: '⇌', above: 'über die offene Form' }, p], y: 0
      });
    })()
  ]
};

module.exports = M;
