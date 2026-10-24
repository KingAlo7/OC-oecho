/* Mechanisms — Enolate & C–C-Knüpfung (frames as in lib-rx-05-enolat.js).
   Most entries: R₁ (0,0) – Cα (DX,DY) – C (2DX,0) – Z (3DX,DY) with the
   C=O pointing DOWN; the new bond grows UP from Cα. */
const { scene, polar, DX, DY } = require('./lib-mech.js');

const M = {};
const lab = (S, label, q) => S.frag(() => ({ i: S.L(0, 0, label, q) }));
const H = (S, i, deg) => S.to(i, deg, 'H', { len: 0.85 });
const hb = (S, q) => S.frag(() => { const h = S.at(0, 0, 'H'), b = S.L(1, 0, 'B', q); S.b(h, b); return {}; });

/* the α-carbonyl frame. o: { left, z, enolate (C=Cα, O⁻), oq, oh (O–H),
   hUp (α-H up), hDown, up (fn adding a group on Cα, returns atom) } */
function A(S, o) {
  o = o || {};
  const r = S.L(0, 0, o.left || 'R₁'), ca = S.at(DX, DY, 'C', o.caq), c = S.at(2 * DX, 0);
  S.b(r, ca).b(ca, c, o.enolate ? 2 : 1);
  const k = { r, ca, c };
  k.o = S.at(2 * DX, -1, 'O', o.enolate && !o.oh ? -1 : o.oq);
  S.b(c, k.o, o.enolate || o.oh ? 1 : 2);
  if (o.oh) k.oh = H(S, k.o, o.ohDeg || 210);
  if (o.z !== null) { k.z = S.L(3 * DX, DY, o.z || 'H'); S.b(c, k.z); }
  if (o.zEster) { k.oe = S.at(3 * DX, DY, 'O'); S.b(c, k.oe); S.b(k.oe, S.L(4 * DX, 0, o.zEster)); }
  if (o.hUp) k.h = H(S, ca, 90);
  if (o.hDown) k.h = H(S, ca, 270);
  return k;
}

/* ── Aldolkondensation ────────────────────────────────────────────── */
/* aldol frame of the scheme: CH(OH)R₂ above Cα, OH up left, R₂ up right */
function aldol(S, o) {
  o = o || {};
  const k = A(S, { enolate: o.enolate, hDown: o.hDown });
  if (o.db) { S.m.bonds.find(b => b.a === k.ca && b.b === k.c).order = 1; }
  k.cb = S.at(DX, DY + 1); S.b(k.ca, k.cb, o.db ? 2 : 1);
  if (!o.db) { k.ob = S.at(0, DY + 1 + DY, 'O'); S.b(k.cb, k.ob); }
  S.b(k.cb, S.L(2 * DX, DY + 1 + DY, 'R₂'));
  return k;
}
M['aldol-kondensation'] = {
  title: 'Enolat, dann E1cB-Eliminierung',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = aldol(S, { hDown: true }); k.b = S.L(DX - 0.35, -1.25, 'B', -1); return k; });
      const p = S.frag(() => aldol(S, { enolate: true }));
      return S.step({
        caption: '1. Die Base nimmt das noch verbliebene, acide α-H ab (neben der C=O-Gruppe): Enolat.',
        row: [a, '→', p, '+', lab(S, 'H–B')], y: DY,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.ca, a.h), S.pair(a.ca, a.c), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => aldol(S, { enolate: true }));
      const p = S.frag(() => aldol(S, { db: true }));
      return S.step({
        caption: '2. Das Elektronenpaar läuft zurück, bildet die C=C-Bindung und stößt OH⁻ hinaus (E1cB: Eliminierung über die konjugierte Base). Normalerweise ist OH⁻ eine schlechte Abgangsgruppe — hier gelingt es, weil das entstehende α,β-ungesättigte Carbonyl konjugiert und damit stabil ist. Erwärmen treibt die Kondensation.',
        row: [a, '→', p, '+', lab(S, 'OH', -1)], y: DY,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), 1), S.cv(S.pair(a.ca, a.c), S.pair(a.ca, a.cb), 1), S.cv(S.pair(a.cb, a.ob), S.atom(a.ob), 1)]
      });
    })()
  ]
};

/* ── Claisen-Kondensation ─────────────────────────────────────────── */
/* ester frame: R₁ – Cα – C(=O down)–O–Et; the second ester's acyl C
   becomes the ketone C above Cα: O up left, R₂ up right */
function ester(S, o) { return A(S, Object.assign({ z: null, zEster: 'Et' }, o || {})); }
function ketoUp(S, k, o) {
  o = o || {};
  k.ck = S.at(DX, DY + 1); S.b(k.ca, k.ck);
  k.ok = S.at(0, DY + 1 + DY, 'O', o.okq); S.b(k.ck, k.ok, o.okq ? 1 : 2);
  S.b(k.ck, S.L(2 * DX, DY + 1 + DY, 'R₂'));
  if (o.oet) { k.oet = S.at(DX, DY + 2, 'O'); S.b(k.ck, k.oet); S.b(k.oet, S.L(DX + DX, DY + 2 + DY, 'Et')); }
  return k;
}
M['claisen-kondensation'] = {
  title: 'Esterenolat greift ein zweites Ester-C=O an',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = ester(S, { hUp: true }); k.b = S.L(DX, DY + 2.0, 'EtO', -1); return k; });
      const p = S.frag(() => ester(S, { enolate: true }));
      return S.step({
        caption: '1. Ethanolat deprotoniert das α-C des Esters (pK_s ≈ 25 — nur ein kleiner Gleichgewichtsanteil Enolat). Als Base nimmt man das Alkoholat des Esteralkohols, damit eine Umesterung nichts verändert.',
        row: [a, '→', p, '+', lab(S, 'EtOH')], y: 0,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.ca, a.h), S.pair(a.ca, a.c), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = ester(S, { enolate: true });
        k.ck = S.at(DX, DY + 1.55); k.ok = S.at(0, DY + 1.55 + DY, 'O'); S.b(k.ck, k.ok, 2);
        S.b(k.ck, S.L(2 * DX, DY + 1.55 + DY, 'R₂')); const oe = S.at(DX, DY + 2.55, 'O'); S.b(k.ck, oe); S.b(oe, S.L(2 * DX, DY + 2.55 + DY, 'Et'));
        return k;
      });
      const p = S.frag(() => ketoUp(S, ester(S), { okq: -1, oet: true }));
      return S.step({
        caption: '2. Das Enolat-C greift das Carbonyl-C eines zweiten Estermoleküls an: tetraedrische Zwischenstufe.',
        row: [a, '→', p], y: DY,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), 1), S.cv(S.pair(a.ca, a.c), S.atom(a.ck), 1), S.cv(S.pair(a.ck, a.ok), S.atom(a.ok), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => ketoUp(S, ester(S), { okq: -1, oet: true }));
      const p = S.frag(() => ketoUp(S, ester(S)));
      return S.step({
        caption: '3. Das Alkoxid klappt zurück und stößt Ethanolat aus (nucleophile Acylsubstitution — anders als bei der Aldolreaktion gibt es eine Abgangsgruppe). Es entsteht der β-Ketoester.',
        row: [a, '→', p, '+', lab(S, 'EtO', -1)], y: DY,
        curly: [S.cv(S.atom(a.ok), S.pair(a.ck, a.ok), 1), S.cv(S.pair(a.ck, a.oet), S.atom(a.oet), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = ketoUp(S, ester(S, { hDown: true })); k.b = S.L(DX - 0.35, -1.25, 'EtO', -1); return k; });
      const p = S.frag(() => ketoUp(S, ester(S, { caq: -1 })));
      return S.step({
        caption: '4. Triebkraft: Das CH zwischen den beiden C=O ist sehr acide (pK_s ≈ 11) und wird vom Ethanolat praktisch vollständig deprotoniert. Dieser Schritt zieht alle vorgelagerten Gleichgewichte auf die Produktseite — deshalb braucht man 1 Äquivalent Base, und deshalb versagt die Reaktion, wenn das α-C nur ein H trägt. Erst die saure Aufarbeitung (H₃O⁺) liefert den neutralen β-Ketoester.',
        row: [a, '→', p, '+', lab(S, 'EtOH')], y: DY,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.ca, a.h), S.atom(a.ca), -1)]
      });
    })()
  ]
};

/* ── Dieckmann ────────────────────────────────────────────────────── */
/* In the product ring's orientation (five-ring, apex up): v0 the acyl C
   (C=O up), v4 the α-C carrying the second ester. Open until step 2. */
function dk(S, o) {
  o = o || {};
  const v = [90, 162, 234, 306, 18].map(d => polar([0, 0], d, 0.8507));
  if (o.open) { v[0] = polar(v[0], 120, 0.3); }
  const a = v.map((p, i) => S.at(p[0], p[1], 'C', i === 4 ? o.v4q : 0));
  S.b(a[0], a[1]).b(a[1], a[2]).b(a[2], a[3]).b(a[3], a[4]);
  if (!o.open) S.b(a[0], a[4]);
  const k = { a };
  k.o0 = S.at(...polar(S.xy(a[0]), 90, 1), 'O', o.o0q); S.b(a[0], k.o0, o.o0q ? 1 : 2);
  if (o.or0) { k.or0 = S.at(...polar(S.xy(a[0]), 165, 1), 'O'); S.b(a[0], k.or0); S.b(k.or0, S.L(...polar(S.xy(k.or0), 210, 1), 'R₁')); }
  // the second ester on v4, radially (18°): its C=O at 78°, OR₁ at −42°
  const pe = polar(v[4], 18, 1);
  k.ce = S.at(pe[0], pe[1]); S.b(a[4], k.ce, o.enolate ? 2 : 1);
  k.oe = S.at(...polar(pe, 78, 1), 'O', o.enolate ? -1 : 0); S.b(k.ce, k.oe, o.enolate ? 1 : 2);
  S.b(k.ce, S.L(...polar(pe, -42, 1), 'OR₁'));
  if (o.h4) k.h = H(S, a[4], -60);
  return k;
}
M['dieckmann-kondensation'] = {
  title: 'Intramolekulare Claisen-Kondensation zum Fünfring',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = dk(S, { open: true, or0: true, h4: true }); k.b = S.L(...polar(S.xy(k.h), -60, 1.2), 'R₁O', -1); return k; });
      const p = S.frag(() => dk(S, { open: true, or0: true, enolate: true }));
      return S.step({
        caption: '1. Das Alkoholat deprotoniert die α-Position des einen Esters: Enolat. Die Kette ist schon so gezeichnet, wie sie sich gleich zum Ring schließt (1,6-Diester → Fünfring, 1,7-Diester → Sechsring).',
        row: [a, '→', p, '+', lab(S, 'R₁OH')], y: 0,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), -1), S.cv(S.pair(a.a[4], a.h), S.pair(a.a[4], a.ce), -1), S.cv(S.pair(a.ce, a.oe), S.atom(a.oe), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => dk(S, { open: true, or0: true, enolate: true }));
      const p = S.frag(() => dk(S, { or0: true, o0q: -1 }));
      return S.step({
        caption: '2. Das Enolat-C greift das Carbonyl-C des anderen Esters an — intramolekular, deshalb bevorzugt gegenüber der Reaktion zweier Moleküle: tetraedrische Zwischenstufe im Ring.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.atom(a.oe), S.pair(a.ce, a.oe), -1), S.cv(S.pair(a.a[4], a.ce), S.atom(a.a[0]), 1), S.cv(S.pair(a.a[0], a.o0), S.atom(a.o0), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => dk(S, { or0: true, o0q: -1 }));
      const p = S.frag(() => dk(S));
      return S.step({
        caption: '3. Das Alkoxid stößt R₁O⁻ aus: cyclischer β-Ketoester. Wie bei der Claisen-Kondensation wird er anschließend vom Alkoholat am C zwischen den beiden C=O deprotoniert (Triebkraft) und erst bei der sauren Aufarbeitung zurückprotoniert.',
        row: [a, '→', p, '+', lab(S, 'R₁O', -1)], y: 0,
        curly: [S.cv(S.atom(a.o0), S.pair(a.a[0], a.o0), -1), S.cv(S.pair(a.a[0], a.or0), S.atom(a.or0), 1)]
      });
    })()
  ]
};

/* ── Michael-Addition ─────────────────────────────────────────────── */
/* acceptor frame: R₁ (0,0) – Cβ (DX,DY) = Cα (2DX,0) – C (3DX,DY) (=O up) – R₂ (4DX,0); Nu lands up on Cβ */
function acc(S, o) {
  o = o || {};
  const r1 = S.L(0, 0, 'R₁'), cb = S.at(DX, DY), ca = S.at(2 * DX, 0, 'C', o.caq), c = S.at(3 * DX, DY);
  const ox = S.at(3 * DX, DY + 1, 'O', o.enolate ? -1 : 0), r2 = S.L(4 * DX, 0, 'R₂');
  S.b(r1, cb).b(cb, ca, o.nu ? 1 : 2).b(ca, c, o.enolate ? 2 : 1).b(c, ox, o.enolate ? 1 : 2).b(c, r2);
  const k = { cb, ca, c, o: ox };
  if (o.nu) S.b(cb, S.L(DX, DY + 1, 'Nu'));
  return k;
}
M['michael-addition'] = {
  title: '1,4-Addition an das konjugierte Enon',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = acc(S); k.nu = S.L(DX, DY + 1.5, 'Nu', -1); return k; });
      const p = S.frag(() => acc(S, { nu: true, enolate: true }));
      return S.step({
        caption: '1. Das Nucleophil greift das β-C an, nicht das Carbonyl-C: Die Konjugation macht auch das β-C elektrophil (Mesomerie: ⁺C–C=C–O⁻). Weiche, stabilisierte Nucleophile (Malonat, Enamin, Cuprat, Thiolat) bevorzugen diese 1,4-Addition; harte (RLi, RMgX) greifen eher 1,2 am C=O an. Es entsteht ein Enolat.',
        row: [a, '→', p], y: DY,
        curly: [S.cv(S.atom(a.nu), S.atom(a.cb), -1), S.cv(S.pair(a.cb, a.ca), S.pair(a.ca, a.c), -1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = acc(S, { nu: true, enolate: true });
        k.h = S.at(2 * DX, -1.25, 'H'); k.ho = S.to(k.h, 0, 'O'); S.to(k.ho, 0, null, { label: 'Et', len: 0.9 }); return k;
      });
      const p = S.frag(() => acc(S, { nu: true }));
      return S.step({
        caption: '2. Das Enolat wird am α-C protoniert (vom Lösungsmittel EtOH): Keto-Form. Mit einem Enolat als Nucleophil entsteht so eine 1,5-Dicarbonylverbindung.',
        row: [a, '→', p, '+', lab(S, 'EtO', -1)], y: DY,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), 1), S.cv(S.pair(a.ca, a.c), S.atom(a.h), -1), S.cv(S.pair(a.h, a.ho), S.atom(a.ho), -1)]
      });
    })()
  ]
};

/* ── Robinson-Anellierung ─────────────────────────────────────────── */
/* steps 1–3 in the scheme's ketone frame, MVK coming in from above; the
   ring closure (4–5) in the orientation of the product cyclohexenone */
function ketone(S, o) { return A(S, Object.assign({ z: 'R₂' }, o || {})); }
/* MVK chain hanging up from Cα: CH₂ (DX,DY+1) – CH₂ – C(=O)–CH₃, zig-zag */
function mvk(S, k, o) {
  o = o || {};
  const c1 = o.free ? S.at(DX, DY + 1.55) : S.at(DX, DY + 1);
  if (!o.free) S.b(k.ca, c1);
  const c2 = S.to(c1, 30, 'C'), c3 = S.to(c2, 90, 'C');
  if (o.free || o.enolate) S.m.bonds.find(b => b.a === c1 && b.b === c2).order = o.free ? 2 : 1;
  if (o.enolate) S.m.bonds.find(b => b.a === c2 && b.b === c3).order = 2;
  const ox = S.to(c3, 30, 'O', { order: o.enolate ? 1 : 2, charge: o.enolate ? -1 : 0 });
  const me = S.to(c3, 150, 'C', { charge: o.meq });
  return Object.assign(k, { c1, c2, c3, om: ox, me });
}
/* ring stage: positions P[k] = 30°+60°k on the unit circle */
const P = k => polar([0, 0], 30 + 60 * k, 1);
function ringStage(S, o) {
  o = o || {};
  const v = [0, 1, 2, 3, 4, 5].map(k => {
    let p = P(k);
    if (k === 1 && o.open) p = polar(p, 60, 0.35);
    return S.at(p[0], p[1], 'C', k === 1 ? o.v1q : 0);
  });
  S.b(v[3], v[4]).b(v[4], v[5]).b(v[5], v[0]).b(v[2], v[3]);
  S.b(v[0], v[1], o.enolate ? 2 : 1);
  if (!o.open) S.b(v[1], v[2], o.enone ? 2 : 1);
  const k = { v };
  k.o0 = S.at(...polar(P(0), 30, 1), 'O', o.enolate ? -1 : 0); S.b(v[0], k.o0, o.enolate ? 1 : 2);
  S.b(v[3], S.L(...polar(P(3), 210, 1), 'R₁'));
  S.b(v[2], S.L(...polar(P(2), 150, 1), 'R₂'));
  if (!o.enone) { k.o2 = S.at(...polar(P(2), 80, 1), 'O', o.o2q); S.b(v[2], k.o2, o.open ? 2 : 1); if (o.oh) H(S, k.o2, 140); }
  if (o.h1) k.h1 = H(S, v[1], 60);
  return k;
}
M['robinson-anellierung'] = {
  title: 'Michael-Addition, dann intramolekulare Aldolkondensation',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = ketone(S, { hUp: true }); k.b = S.L(DX, DY + 2.0, 'B', -1); return k; });
      const p = S.frag(() => ketone(S, { enolate: true }));
      return S.step({
        caption: '1. Die Base bildet das Enolat des Ketons.',
        row: [a, '→', p, '+', lab(S, 'H–B')], y: DY,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.ca, a.h), S.pair(a.ca, a.c), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => mvk(S, ketone(S, { enolate: true }), { free: true }));
      const p = S.frag(() => mvk(S, ketone(S), { enolate: true }));
      return S.step({
        caption: '2. Michael-Addition: Das Enolat greift das endständige CH₂ des Methylvinylketons (MVK) an — 1,4-Addition, es entsteht ein neues Enolat.',
        row: [a, '→', p], y: DY + 0.5,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), 1), S.cv(S.pair(a.ca, a.c), S.atom(a.c1), 1), S.cv(S.pair(a.c1, a.c2), S.pair(a.c2, a.c3), -1), S.cv(S.pair(a.c3, a.om), S.atom(a.om), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => mvk(S, ketone(S), { enolate: true }));
      const p = S.frag(() => ringStage(S, { open: true, enolate: true }));
      return S.step({
        caption: '3. Protonierung liefert die 1,5-Diketon-Zwischenstufe; das Gleichgewicht der Enolate stellt sich um, bis die CH₃-Gruppe deprotoniert ist — das Enolat, das einen spannungsfreien Sechsring schließen kann. (Ab hier in der Lage des Produktrings gezeichnet.)',
        row: [a, { arrow: '⇌', above: 'H–B / B⁻' }, p], y: DY
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => ringStage(S, { open: true, enolate: true }));
      const p = S.frag(() => ringStage(S, { o2q: -1, h1: true }));
      return S.step({
        caption: '4. Intramolekulare Aldoladdition: Das Enolat greift die Keto-Gruppe an, der Sechsring schließt sich.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.atom(a.o0), S.pair(a.v[0], a.o0), 1), S.cv(S.pair(a.v[0], a.v[1]), S.atom(a.v[2]), 1), S.cv(S.pair(a.v[2], a.o2), S.atom(a.o2), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = ringStage(S, { oh: true, h1: true }); k.b = S.L(...polar(S.xy(k.h1), 60, 1.15), 'B', -1); return k; });
      const p = S.frag(() => ringStage(S, { enone: true }));
      return S.step({
        caption: '5. Nach Protonierung zum β-Hydroxyketon folgt die Aldolkondensation (E1cB, Erwärmen): Deprotonierung neben der C=O-Gruppe und Abspaltung von OH⁻ ergeben das konjugierte Cyclohexenon. Hier zusammengefasst in einem Pfeilsatz.',
        row: [a, '→', p, '+', lab(S, 'H₂O'), '+', lab(S, 'B', -1)], y: 0,
        curly: [S.cv(S.atom(a.b), S.atom(a.h1), 1), S.cv(S.pair(a.v[1], a.h1), S.pair(a.v[1], a.v[2]), 1), S.cv(S.pair(a.v[2], a.o2), S.atom(a.o2), -1)]
      });
    })()
  ]
};

/* ── Mannich ──────────────────────────────────────────────────────── */
/* keto frame with the O down; the CH₂–NR₃R₄ arm grows up from Cα */
function mannichArm(S, k, o) {
  o = o || {};
  const cm = S.at(DX, DY + (o.free ? 1.5 : 1)); if (!o.free) S.b(k.ca, cm);
  const n = S.at(2 * DX, DY + (o.free ? 1.5 : 1) + DY, 'N', o.free ? 1 : 0); S.b(cm, n, o.free ? 2 : 1);
  S.b(n, S.L(2 * DX, DY + (o.free ? 2.5 : 2) + DY, 'R₃')).b(n, S.L(3 * DX, DY + (o.free ? 1.5 : 1), 'R₄'));
  return Object.assign(k, { cm, n });
}
M['mannich'] = {
  title: 'Iminium-Ion + Enol',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const c = S.at(0, 0), o = S.to(c, 90, 'O', { order: 2 }); return {}; });
      const p = S.frag(() => {
        const c = S.at(0, 0), n = S.to(c, 30, 'N', { order: 2, charge: 1 }); S.to(n, 90, null, { label: 'R₃' }); S.to(n, -30, null, { label: 'R₄' }); return {};
      });
      return S.step({
        caption: '1. Formaldehyd und das sekundäre Amin bilden — wie bei der Iminbildung, aber ohne N–H am Ende — das Iminium-Ion CH₂=N⁺R₃R₄ (Eschenmoser-Salz). Es ist ein stärkeres Elektrophil als der Aldehyd selbst.',
        row: [a, { arrow: '→', above: 'R₃R₄NH, H⁺', below: '−H₂O' }, p], y: 0.3
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => A(S, { z: 'R₂', hUp: true }));
      const p = S.frag(() => A(S, { z: 'R₂', enolate: true, oh: true }));
      return S.step({
        caption: '2. Die Säure katalysiert die Keto-Enol-Tautomerie: Ein kleiner Anteil des Ketons liegt als Enol vor — das Nucleophil.',
        row: [a, { arrow: '⇌', above: 'H⁺' }, p], y: 0
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => mannichArm(S, A(S, { z: 'R₂', enolate: true, oh: true }), { free: true }));
      const p = S.frag(() => mannichArm(S, A(S, { z: 'R₂', oq: 1, oh: true })));
      return S.step({
        caption: '3. Das Enol greift das Iminium-C an; das freie Elektronenpaar des O schiebt nach. Es entsteht das protonierte Keton.',
        row: [a, '→', p], y: DY,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), 1), S.cv(S.pair(a.ca, a.c), S.atom(a.cm), 1), S.cv(S.pair(a.cm, a.n), S.atom(a.n), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => mannichArm(S, A(S, { z: 'R₂', oq: 1, oh: true })));
      const p = S.frag(() => mannichArm(S, A(S, { z: 'R₂' })));
      return S.step({
        caption: '4. Abgabe des Protons: β-Aminoketon („Mannich-Base“). Sie lässt sich leicht zum Enon eliminieren (Amin als Abgangsgruppe) — ein Weg zu Michael-Akzeptoren.',
        row: [a, { arrow: '→', above: '−H⁺' }, p], y: DY
      });
    })()
  ]
};

/* ── Knoevenagel ──────────────────────────────────────────────────── */
/* aldehyde: R₁ (0,0) – C (DX,DY), O up, H to the lower right. In the
   product that H is up and the CZ₁Z₂ carbon sits where the H was. */
function znuc(S, x, y, q, hs) {               // C(Z₁)(Z₂) with H atoms at the given angles
  const c = S.at(x, y, 'C', q);
  S.b(c, S.L(x, y - 1, 'Z₁')).b(c, S.L(x + DX, y + DY, 'Z₂'));
  const k = { c };
  (hs || []).forEach((d, i) => { k[i ? 'h2' : 'h'] = H(S, c, d); });
  return k;
}
function knAdd(S, o) {
  o = o || {};
  const r = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY); S.b(r, c1);
  const k = { c1 };
  k.o = S.at(...polar([DX, DY], 150, 1), 'O', o.oq); S.b(c1, k.o);
  if (o.oh) k.oh = H(S, k.o, 210);
  H(S, c1, 90);
  const z = znuc(S, 2 * DX, 0, 0, o.h2 ? [210] : []); S.b(c1, z.c);
  return Object.assign(k, { c2: z.c, h2: z.h });
}
M['knoevenagel'] = {
  title: 'Aldoladdition einer CH-aciden Verbindung, dann Eliminierung',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const z = znuc(S, 0, 0, 0, [150, 210]); z.b = S.L(-1.55, 1.0, 'B'); return z; });
      const p = S.frag(() => znuc(S, 0, 0, -1, [210]));
      return S.step({
        caption: '1. Die schwache Base (Piperidin, Pyridin) genügt, um die doppelt aktivierte CH₂-Gruppe zu deprotonieren (pK_s ≈ 9–13). Eine starke Base würde den Aldehyd mit sich selbst kondensieren lassen.',
        row: [a, '→', p, '+', lab(S, 'H–B', 1)], y: 0,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.c, a.h), S.atom(a.c), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY), o = S.at(DX, DY + 1, 'O'); S.b(r, c1).b(c1, o, 2); S.b(c1, S.L(...polar([DX, DY], 150, 1), 'H'));
        const z = znuc(S, 2 * DX + 0.45, -0.35, -1, [210]); return { c1, o, c2: z.c };
      });
      const p = S.frag(() => knAdd(S, { oq: -1, h2: true }));
      return S.step({
        caption: '2. Das Carbanion addiert an den Aldehyd (wie bei der Aldolreaktion): Alkoxid.',
        row: [a, '→', p], y: DY,
        curly: [S.cv(S.atom(a.c2), S.atom(a.c1), -1), S.cv(S.pair(a.c1, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = knAdd(S, { oh: true, h2: true }); k.b = S.L(...polar(S.xy(k.h2), 270, 1.1), 'B'); return k; });
      const p = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY); S.b(r, c1); H(S, c1, 90);
        const z = znuc(S, 2 * DX, 0, 0, []); S.b(c1, z.c, 2); return {};
      });
      return S.step({
        caption: '3. Nach Protonierung zum Alkohol wird das noch verbliebene, sehr acide H am Z₁Z₂-C abgespalten, und OH⁻ geht (E1cB): Das stark konjugierte Alken ist die Triebkraft. Mit Malonsäure und Pyridin folgt oft gleich die Decarboxylierung (Doebner-Variante → Zimtsäuren).',
        row: [a, '→', p, '+', lab(S, 'H₂O'), '+', lab(S, 'B')], y: DY,
        curly: [S.cv(S.atom(a.b), S.atom(a.h2), 1), S.cv(S.pair(a.c2, a.h2), S.pair(a.c1, a.c2), -1), S.cv(S.pair(a.c1, a.o), S.atom(a.o), -1)]
      });
    })()
  ]
};

/* ── Malonester-Synthese ──────────────────────────────────────────── */
/* product frame: R₁ (0,0) – Cα (DX,DY) – C (2DX,0) (=O down, O–Et/H to the upper right), Z = CO₂Et up from Cα */
function mal(S, o) {
  o = o || {};
  const ca = S.at(DX, DY, 'C', o.caq), c = S.at(2 * DX, 0);
  S.b(ca, c, o.enol ? 2 : 1);
  const k = { ca, c };
  if (o.r1) { k.r1 = S.L(0, 0, 'R₁'); S.b(k.r1, ca); }
  if (o.h210) k.h = H(S, ca, 210);
  // right group: C(=O)–O–Et (or OH)
  k.o = S.at(2 * DX, -1, 'O', o.oq); S.b(c, k.o, o.enol || o.rightOH2 ? 1 : 2);
  if (o.enol) H(S, k.o, 210);
  const oe = S.at(3 * DX, DY, 'O'); S.b(c, oe);
  k.oe = oe;
  if (o.acid) H(S, oe, 30); else S.b(oe, S.L(4 * DX, 0, 'Et'));
  // the Z group up from Cα
  if (o.z !== false) {
    k.cz = S.at(DX, DY + 1); S.b(ca, k.cz);
    k.oz = S.at(0, DY + 1 + DY, 'O'); S.b(k.cz, k.oz, 2);
    k.ozr = S.at(2 * DX, DY + 1 + DY, 'O'); S.b(k.cz, k.ozr);
    if (o.acid) k.hz = H(S, k.ozr, -40); else S.b(k.ozr, S.L(3 * DX, DY + 1, 'Et'));
  } else if (o.hUp) H(S, ca, 90);
  return k;
}
M['malonester-synthese'] = {
  title: 'Alkylierung des Malonat-Anions, Verseifung, Decarboxylierung',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = mal(S, { h210: true }); k.b = S.L(-1.05, -0.3, 'EtO', -1); return k; });
      const p = S.frag(() => mal(S, { caq: -1 }));
      return S.step({
        caption: '1. Das CH₂ zwischen zwei Estergruppen ist acide (pK_s ≈ 13): Ethanolat deprotoniert es vollständig. Das Anion ist über beide C=O delokalisiert. (Acetessigester: Z = COCH₃ statt CO₂Et — gleiche Chemie, am Ende ein Methylketon.)',
        row: [a, '→', p, '+', lab(S, 'EtOH')], y: DY,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), -1), S.cv(S.pair(a.ca, a.h), S.atom(a.ca), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = mal(S, { caq: -1 }); k.r1 = S.L(-0.45, -0.2, 'R₁'); k.x = S.to(k.r1, 210, null, { label: 'X' }); return k; });
      const p = S.frag(() => mal(S, { r1: true }));
      return S.step({
        caption: '2. S_N2: Das Malonat-Anion greift das (primäre) Alkylhalogenid an. Eine zweite Alkylierung ist möglich, wenn man nochmals Base und R–X zugibt.',
        row: [a, '→', p, '+', lab(S, 'X', -1)], y: DY,
        curly: [S.cv(S.atom(a.ca), S.atom(a.r1), 1), S.cv(S.pair(a.r1, a.x), S.atom(a.x), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => mal(S, { r1: true }));
      const p = S.frag(() => mal(S, { r1: true, acid: true }));
      return S.step({
        caption: '3. Saure (oder basische, dann angesäuerte) Esterhydrolyse liefert die substituierte Malonsäure — Mechanismus siehe Esterhydrolyse.',
        row: [a, { arrow: '→', above: 'H₃O⁺', below: '−2 EtOH' }, p], y: DY
      });
    })(),
    (() => {
      const S = scene();
      // the right-hand COOH turned so its C=O faces the H of the upper COOH
      const a = S.frag(() => {
        const ca = S.at(DX, DY), c = S.at(2 * DX, 0); S.b(ca, c); const r1 = S.L(0, 0, 'R₁'); S.b(r1, ca);
        const o2 = S.at(3 * DX, DY, 'O'); S.b(c, o2, 2); const oh = S.at(2 * DX, -1, 'O'); S.b(c, oh); H(S, oh, 210);
        const cz = S.at(DX, DY + 1); S.b(ca, cz); const oz = S.at(0, DY + 1 + DY, 'O'); S.b(cz, oz, 2);
        const ozr = S.at(2 * DX, DY + 1 + DY, 'O'); S.b(cz, ozr); const hz = S.at(2.45, 1.3, 'H'); S.b(ozr, hz);
        return { ca, c, o2, cz, oz, ozr, hz };
      });
      const p = S.frag(() => {
        const ca = S.at(DX, DY), c = S.at(2 * DX, 0); S.b(ca, c, 2); const r1 = S.L(0, 0, 'R₁'); S.b(r1, ca);
        const o2 = S.at(3 * DX, DY, 'O'); S.b(c, o2); H(S, o2, 90); const oh = S.at(2 * DX, -1, 'O'); S.b(c, oh); H(S, oh, 210);
        return {};
      });
      const co2 = lab(S, 'CO₂');
      return S.step({
        caption: '4. Beim Erhitzen decarboxyliert die β-Dicarbonsäure über einen cyclischen Sechsring-Übergangszustand: Das H wandert auf das Carbonyl-O der anderen Gruppe, CO₂ entweicht, zurück bleibt ein Enol.',
        row: [a, { arrow: '→', above: 'Δ' }, p, '+', co2], y: 0,
        curly: (() => { const w = { away: S.centre([a.ca, a.c, a.o2, a.hz, a.ozr, a.cz]) };
          return [S.cv(S.atom(a.o2), S.atom(a.hz), 0, w), S.cv(S.pair(a.ozr, a.hz), S.pair(a.cz, a.ozr), 0, w), S.cv(S.pair(a.ca, a.cz), S.pair(a.ca, a.c), 0, w)]; })()
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const ca = S.at(DX, DY), c = S.at(2 * DX, 0); S.b(ca, c, 2); const r1 = S.L(0, 0, 'R₁'); S.b(r1, ca);
        const o2 = S.at(3 * DX, DY, 'O'); S.b(c, o2); H(S, o2, 90); const oh = S.at(2 * DX, -1, 'O'); S.b(c, oh); H(S, oh, 210);
        return {};
      });
      const p = S.frag(() => {
        const ca = S.at(DX, DY), c = S.at(2 * DX, 0); S.b(ca, c); const r1 = S.L(0, 0, 'R₁'); S.b(r1, ca);
        S.b(c, S.at(2 * DX, -1, 'O'), 2); S.b(c, S.L(3 * DX, DY, 'OH')); return {};
      });
      return S.step({
        caption: '5. Das Enol tautomerisiert zur Carbonsäure R₁–CH₂–COOH: Aus R–X ist eine um zwei C-Atome verlängerte Säure geworden.',
        row: [a, { arrow: '→', above: 'Tautomerie' }, p], y: DY
      });
    })()
  ]
};

/* ── α-Alkylierung (LDA) ──────────────────────────────────────────── */
/* scheme frame: R₁ (0,0) – C (DX,DY) (=O UP) – Cα (2DX,0) – R₂ (3DX,DY); R₃ down from Cα */
function ka(S, o) {
  o = o || {};
  const r1 = S.L(0, 0, 'R₁'), c = S.at(DX, DY), ca = S.at(2 * DX, 0, 'C', o.caq), r2 = S.L(3 * DX, DY, 'R₂');
  S.b(r1, c).b(c, ca, o.enolate || o.enol ? 2 : 1).b(ca, r2);
  const k = { c, ca };
  k.o = S.at(DX, DY + 1, 'O', o.enolate ? -1 : o.oq); S.b(c, k.o, o.enolate || o.enol || o.oh ? 1 : 2);
  if (o.oh || o.enol) k.oh = H(S, k.o, 150);
  if (o.h) k.h = H(S, ca, 270);
  if (o.down) k.d = S.to(ca, 270, o.down.sym || null, o.down.sym ? {} : { label: o.down.label });
  return k;
}
M['enolat-alkylierung'] = {
  title: 'Kinetisches Enolat mit LDA, dann S_N2',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = ka(S, { h: true }); k.b = S.L(2 * DX + 0.3, -1.95, 'N(iPr)₂', -1); return k; });
      const p = S.frag(() => ka(S, { enolate: true }));
      return S.step({
        caption: '1. LDA (Lithiumdiisopropylamid) ist eine sehr starke (pK_s(HNiPr₂) ≈ 36), aber sperrige, kaum nucleophile Base: Sie deprotoniert bei −78 °C schnell und vollständig — am weniger substituierten α-C (kinetisches Enolat). Kein Keton bleibt übrig, also keine Aldol-Nebenreaktion.',
        row: [a, '→', p, '+', lab(S, 'HN(iPr)₂')], y: DY,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.ca, a.h), S.pair(a.c, a.ca), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = ka(S, { enolate: true }); k.r3 = S.L(2 * DX, -1.4, 'R₃'); k.x = S.to(k.r3, 270, null, { label: 'X' }); return k; });
      const p = S.frag(() => ka(S, { down: { label: 'R₃' } }));
      return S.step({
        caption: '2. Das Enolat greift das Alkylhalogenid über das C-Atom an (S_N2): α-alkyliertes Keton. Nur reaktive, primäre Elektrophile (CH₃I, Allyl-, Benzylbromid) — sekundäre eliminieren.',
        row: [a, '→', p, '+', lab(S, 'X', -1)], y: DY,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), -1), S.cv(S.pair(a.c, a.ca), S.atom(a.r3), 1), S.cv(S.pair(a.r3, a.x), S.atom(a.x), 1)]
      });
    })()
  ]
};

/* ── α-Halogenierung (sauer) ──────────────────────────────────────── */
M['alpha-halogenierung'] = {
  title: 'Säurekatalysiert über das Enol',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = ka(S, { h: true }); k.hh = S.at(DX - 1.25, DY + 1.35, 'H'); k.ha = S.to(k.hh, 180, null, { label: 'A' }); return k;
      });
      const p = S.frag(() => ka(S, { h: true, oq: 1, oh: true }));
      return S.step({
        caption: '1. Die Säure (HBr, HOAc) protoniert den Carbonyl-Sauerstoff.',
        row: [a, '→', p, '+', lab(S, 'A', -1)], y: DY,
        curly: [S.cv(S.atom(a.o), S.atom(a.hh), -1), S.cv(S.pair(a.hh, a.ha), S.atom(a.ha), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = ka(S, { h: true, oq: 1, oh: true }); k.b = S.L(2 * DX + 1.2, -1.15, 'A', -1); return k; });
      const p = S.frag(() => ka(S, { enol: true }));
      return S.step({
        caption: '2. Abspaltung eines α-H liefert das Enol (langsamster Schritt: Die Geschwindigkeit hängt nicht von [Br₂] ab).',
        row: [a, '→', p, '+', lab(S, 'H–A')], y: DY,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), -1), S.cv(S.pair(a.ca, a.h), S.pair(a.c, a.ca), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = ka(S, { enol: true }); k.b1 = S.at(2 * DX, -1.35, 'Br'); k.b2 = S.to(k.b1, 270, 'Br'); return k; });
      const p = S.frag(() => ka(S, { oq: 1, oh: true, down: { sym: 'Br' } }));
      return S.step({
        caption: '3. Das elektronenreiche Enol greift Br₂ an (wie ein Alken); das O-Elektronenpaar schiebt nach.',
        row: [a, '→', p, '+', lab(S, 'Br', -1)], y: DY,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), -1), S.cv(S.pair(a.c, a.ca), S.atom(a.b1), 1), S.cv(S.pair(a.b1, a.b2), S.atom(a.b2), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => ka(S, { oq: 1, oh: true, down: { sym: 'Br' } }));
      const p = S.frag(() => ka(S, { down: { sym: 'Br' } }));
      return S.step({
        caption: '4. Abgabe des Protons: α-Bromketon. Im Sauren bleibt es bei EINER Halogenierung — das elektronenziehende Br macht die erneute Protonierung und damit die zweite Enolisierung langsamer. Im Basischen ist es umgekehrt (jedes Br macht das nächste α-H acider): Mehrfachhalogenierung bis zur Haloform-Reaktion.',
        row: [a, { arrow: '→', above: '−H⁺' }, p], y: DY
      });
    })()
  ]
};

/* ── Stork-Enamin-Alkylierung ─────────────────────────────────────── */
/* enamine frame: R₁ – Cα = C – R₂, N down from C with R₃ (lower left) and R₄ (lower right) */
function en(S, o) {
  o = o || {};
  const r1 = S.L(0, 0, 'R₁'), ca = S.at(DX, DY), c = S.at(2 * DX, 0), r2 = S.L(3 * DX, DY, 'R₂');
  S.b(r1, ca).b(ca, c, o.enamine ? 2 : 1).b(c, r2);
  const k = { ca, c };
  if (o.n !== false) {
    k.n = S.at(2 * DX, -1, 'N', o.nq); S.b(c, k.n, o.iminium ? 2 : 1);
    S.b(k.n, S.L(DX, -1 - DY, 'R₃')).b(k.n, S.L(3 * DX, -1 - DY, 'R₄'));
  }
  if (o.r5) S.b(ca, S.L(DX, DY + 1, 'R₅'));
  return k;
}
M['stork-enamin-alkylierung'] = {
  title: 'Enamin als neutrales Enolat-Äquivalent',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = en(S, { enamine: true }); k.r5 = S.L(DX, DY + 1.5, 'R₅'); k.x = S.to(k.r5, 90, null, { label: 'X' }); return k; });
      const p = S.frag(() => en(S, { iminium: true, nq: 1, r5: true }));
      return S.step({
        caption: '1. Das freie Elektronenpaar des N schiebt durch die C=C-Bindung: Das α-C greift das Elektrophil an (S_N2 an R₅–X oder Michael-Addition an einen Akzeptor). Es entsteht ein Iminium-Ion. Vorteil gegenüber Enolaten: neutrale, milde Bedingungen und kaum Mehrfachalkylierung.',
        row: [a, '→', p, '+', lab(S, 'X', -1)], y: 0,
        curly: [S.cv(S.atom(a.n), S.pair(a.c, a.n), 1), S.cv(S.pair(a.ca, a.c), S.atom(a.r5), 1), S.cv(S.pair(a.r5, a.x), S.atom(a.x), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = en(S, { iminium: true, nq: 1, r5: true }); k.w = S.at(2 * DX + 1.4, -0.7, 'O'); H(S, k.w, 30); H(S, k.w, -30); return k; });
      const p = S.frag(() => {
        const k = en(S, { r5: true }); k.o = S.to(k.c, -30, 'O', { charge: 1 }); H(S, k.o, 30); H(S, k.o, -30); return k;
      });
      return S.step({
        caption: '2. Wässrige Aufarbeitung: Wasser greift das Iminium-C an (Umkehrung der Enamin-/Iminiumbildung).',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.atom(a.w), S.atom(a.c), 1), S.cv(S.pair(a.c, a.n), S.atom(a.n), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = en(S, { r5: true, nq: 1 }); H(S, k.n, 270); k.o = S.to(k.c, -30, 'O'); H(S, k.o, 30); return k;
      });
      const p = S.frag(() => {
        const r1 = S.L(0, 0, 'R₁'), ca = S.at(DX, DY), c = S.at(2 * DX, 0), r2 = S.L(3 * DX, DY, 'R₂');
        S.b(r1, ca).b(ca, c).b(c, r2).b(c, S.at(2 * DX, -1, 'O'), 2).b(ca, S.L(DX, DY + 1, 'R₅')); return {};
      });
      return S.step({
        caption: '3. Nach Protonenübertrag auf das N stößt das O-Elektronenpaar das Amin hinaus; Abgabe des Protons am O ergibt das α-alkylierte Keton. Das sekundäre Amin wird zurückgewonnen.',
        row: [a, '→', p, '+', lab(S, 'R₃R₄NH')], y: 0,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), 1), S.cv(S.pair(a.c, a.n), S.atom(a.n), -1)]
      });
    })()
  ]
};

/* ── Reformatsky ──────────────────────────────────────────────────── */
/* ester frame of the scheme: Cα (DX,DY) – C (2DX,0) (=O down) – O–Et; the
   ketone C ends up above Cα with OH up left, R₁ up, R₂ up right */
function bromoEster(S, o) {
  o = o || {};
  const ca = S.at(DX, DY), c = S.at(2 * DX, 0); S.b(ca, c, o.enolate ? 2 : 1);
  const k = { ca, c };
  k.o = S.at(2 * DX, -1, 'O', o.enolate ? -1 : 0); S.b(c, k.o, o.enolate ? 1 : 2);
  const oe = S.at(3 * DX, DY, 'O'); S.b(c, oe); S.b(oe, S.L(4 * DX, 0, 'Et'));
  if (o.br) { k.br = S.at(0, 0, 'Br'); S.b(ca, k.br); }
  return k;
}
function hydroxyUp(S, k, o) {
  o = o || {};
  k.cb = S.at(DX, DY + 1); S.b(k.ca, k.cb);
  k.ob = S.at(0, DY + 1 + DY, 'O', o.q); S.b(k.cb, k.ob);
  S.b(k.cb, S.L(DX, DY + 2, 'R₁')).b(k.cb, S.L(2 * DX, DY + 1 + DY, 'R₂'));
  return k;
}
M['reformatsky'] = {
  title: 'Zink-Enolat addiert an die Carbonylgruppe',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => bromoEster(S, { br: true }));
      const p = S.frag(() => bromoEster(S, { enolate: true }));
      return S.step({
        caption: '1. Zink schiebt sich in die C–Br-Bindung (oxidative Insertion an der Metalloberfläche): Es entsteht ein Zink-Enolat BrZn–O–C(OEt)=CH₂. Zink-Enolate sind weniger reaktiv als Li-Enolate oder Grignard-Reagenzien — sie greifen den Ester selbst nicht an.',
        row: [a, { arrow: '→', above: 'Zn' }, p, '+', lab(S, 'ZnBr', 1)], y: 0
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = bromoEster(S, { enolate: true });
        k.cb = S.at(DX, DY + 1.55); k.ob = S.at(0, DY + 1.55 + DY, 'O'); S.b(k.cb, k.ob, 2);
        S.b(k.cb, S.L(2 * DX, DY + 1.55 + DY, 'R₂')); S.b(k.cb, S.L(DX, DY + 2.55, 'R₁'));
        return k;
      });
      const p = S.frag(() => hydroxyUp(S, bromoEster(S), { q: -1 }));
      return S.step({
        caption: '2. Das Enolat-C greift das Carbonyl-C des Aldehyds/Ketons an — über einen sechsgliedrigen, sesselförmigen Übergangszustand, in dem das Zn beide O-Atome koordiniert (Zimmerman-Traxler). Es entsteht ein Zinkalkoholat.',
        row: [a, '→', p], y: DY,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), 1), S.cv(S.pair(a.ca, a.c), S.atom(a.cb), 1), S.cv(S.pair(a.cb, a.ob), S.atom(a.ob), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = hydroxyUp(S, bromoEster(S), { q: -1 });
        k.h = S.at(...polar(S.xy(k.ob), 210, 1.15), 'H'); k.ho = S.to(k.h, 210, 'O', { charge: 1 }); H(S, k.ho, 150); H(S, k.ho, 270); return k;
      });
      const p = S.frag(() => hydroxyUp(S, bromoEster(S)));
      return S.step({
        caption: '3. Saure Aufarbeitung protoniert das Alkoholat: β-Hydroxyester.',
        row: [a, '→', p, '+', lab(S, 'H₂O')], y: DY,
        curly: [S.cv(S.atom(a.ob), S.atom(a.h), 1), S.cv(S.pair(a.h, a.ho), S.atom(a.ho), 1)]
      });
    })()
  ]
};

/* ── Henry (Nitroaldol) ───────────────────────────────────────────── */
/* product frame: R₁ (0,0) – Cβ (DX,DY) (OH up) – Cα (2DX,0) – N (3DX,DY) (O up, O⁻ right) */
function nitro(S, n, nitronate) {
  const o1 = S.to(n, 90, 'O', nitronate ? { charge: -1 } : { order: 2 });
  const o2 = S.to(n, -30, 'O', { charge: -1 });
  return { o1, o2 };
}
function henryProd(S, o) {
  o = o || {};
  const r = S.L(0, 0, 'R₁'), cb = S.at(DX, DY), ca = S.at(2 * DX, 0), n = S.at(3 * DX, DY, 'N', 1);
  S.b(r, cb).b(cb, ca).b(ca, n);
  const k = Object.assign({ cb, ca, n }, nitro(S, n));
  k.o = S.at(DX, DY + 1, 'O', o.q); S.b(cb, k.o);
  H(S, cb, 150);
  return k;
}
M['henry-nitroaldol'] = {
  title: 'Nitronat-Anion als C-Nucleophil',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const c = S.at(2 * DX, 0), n = S.at(3 * DX, DY, 'N', 1); S.b(c, n); const k = Object.assign({ c, n }, nitro(S, n));
        k.h = H(S, c, 210); k.b = S.L(...polar(S.xy(k.h), 210, 1.15), 'B', -1); return k;
      });
      const p = S.frag(() => {
        const c = S.at(2 * DX, 0), n = S.at(3 * DX, DY, 'N', 1); S.b(c, n, 2); return Object.assign({ c, n }, nitro(S, n, true));
      });
      return S.step({
        caption: '1. Das C–H neben der Nitrogruppe ist erstaunlich acide (pK_s ≈ 10): Die Base bildet das mesomeriestabilisierte Nitronat-Anion.',
        row: [a, '→', p, '+', lab(S, 'H–B')], y: 0,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.c, a.h), S.pair(a.c, a.n), -1), S.cv(S.pair(a.n, a.o1), S.atom(a.o1), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), cb = S.at(DX, DY), o = S.at(DX, DY + 1, 'O'); S.b(r, cb).b(cb, o, 2); H(S, cb, 150);
        const c = S.at(2 * DX + 0.4, -0.35), n = S.to(c, 30, 'N', { order: 2, charge: 1 }); const k = Object.assign({ cb, o, c, n }, nitro(S, n, true));
        return k;
      });
      const p = S.frag(() => henryProd(S, { q: -1 }));
      return S.step({
        caption: '2. Das Nitronat-C addiert an den Aldehyd — eine Aldoladdition mit einem Nitroalkan als Nucleophil.',
        row: [a, '→', p], y: DY,
        curly: [S.cv(S.atom(a.o1), S.pair(a.n, a.o1), 1), S.cv(S.pair(a.c, a.n), S.atom(a.cb), -1), S.cv(S.pair(a.cb, a.o), S.atom(a.o), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = henryProd(S, { q: -1 }); k.h = S.at(DX + 1.15, DY + 1.35, 'H'); k.hb = S.to(k.h, 30, null, { label: 'B' }); return k; });
      const p = S.frag(() => henryProd(S));
      return S.step({
        caption: '3. Protonierung des Alkoxids: β-Nitroalkohol. Alle Schritte sind umkehrbar; bei Erwärmen eliminiert leicht Wasser zum Nitroalken (ein guter Michael-Akzeptor), und die Nitrogruppe lässt sich zum Amin reduzieren.',
        row: [a, '→', p, '+', lab(S, 'B', -1)], y: DY,
        curly: [S.cv(S.atom(a.o), S.atom(a.h), -1), S.cv(S.pair(a.h, a.hb), S.atom(a.hb), -1)]
      });
    })()
  ]
};

module.exports = M;
