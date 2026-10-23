/* Mechanisms — Nucleophile Substitution & Eliminierung.
   Every skeleton is drawn where the reaction scheme draws it
   (lib-rx-01-substitution.js); see lib-mech.js for the layout. */
const { scene, DX, DY } = require('./lib-mech.js');

const M = {};

/* R₁R₂R₃C–Y as in the scheme's tert(): C at (0,0), R₁ upper left,
   R₂ lower left, R₃ up, Y lower right. `plus` makes C a cation and
   leaves Y off. */
function tert(S, yLabel, opts) {
  opts = opts || {};
  const c = S.at(0, 0, 'C', opts.plus ? 1 : 0);
  const r1 = S.L(-DX, DY, 'R₁'), r2 = S.L(-DX, -DY, 'R₂'), r3 = S.L(0, 1, 'R₃');
  S.b(c, r1).b(c, r2).b(c, r3);
  let y = null;
  if (yLabel) { y = S.L(DX, -DY, yLabel, opts.yCharge); S.b(c, y); }
  return { c, y };
}
/* R₁–CH₂–Y as in prim(): R₁ (0,0), C (DX,DY), Y (2DX,0). */
function prim(S, y, opts) {
  opts = opts || {};
  const r = S.L(0, 0, opts.left || 'R₁'), c = S.at(DX, DY);
  const yy = opts.label ? S.L(2 * DX, 0, y, opts.charge) : S.any(2 * DX, 0, y, opts.charge);
  S.b(r, c).b(c, yy);
  return { r, c, y: yy };
}
const ion = (S, label, q) => S.frag(() => ({ i: S.L(0, 0, label, q) }));
const hb = (S, q) => S.frag(() => { const h = S.at(0, 0, 'H'), b = S.L(1, 0, 'B', q); S.b(h, b); return { h, b }; });

/* ── S_N1 ─────────────────────────────────────────────────────────── */
M['sn1'] = {
  title: 'S_N1 — über das planare Carbenium-Ion',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => tert(S, 'X'));
      const b = S.frag(() => tert(S, null, { plus: true }));
      return S.step({
        caption: '1. Heterolyse (langsam, geschwindigkeitsbestimmend): Die C–X-Bindung bricht, beide Elektronen gehen mit dem Halogenid. Zurück bleibt das planare, sp²-hybridisierte Carbenium-Ion.',
        row: [a, '→', b, '+', ion(S, 'X', -1)], y: 0,
        curly: [S.cv(S.pair(a.c, a.y), S.atom(a.y))]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = tert(S, null, { plus: true });
        const nu = S.L(1.55, -0.9, 'Nu'), h = S.at(2.35, -1.45, 'H'); S.b(nu, h);
        return Object.assign(k, { nu });
      });
      const b = S.frag(() => {
        const k = tert(S, 'Nu', { yCharge: 1 });
        S.to(k.y, 270, 'H', { len: 0.85 }); return k;
      });
      return S.step({
        caption: '2. Das Lösungsmittel Nu–H (H₂O, ROH) greift das Kation an — von oben wie von unten gleich gut. Ein Stereozentrum wird deshalb racemisiert.',
        row: [a, '→', b], y: 0,
        curly: [S.cv(S.atom(a.nu), S.atom(a.c))]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = tert(S, 'Nu', { yCharge: 1 });
        k.h = S.to(k.y, 270, 'H', { len: 0.85 });
        k.s = S.L(DX + 1.3, -DY - 0.85, 'Nu'); S.to(k.s, 0, 'H', { len: 0.85 });
        return k;
      });
      const b = S.frag(() => tert(S, 'Nu'));
      const c = S.frag(() => ({ i: S.L(0, 0, 'H₂Nu', 1) }));
      return S.step({
        caption: '3. Ein weiteres Lösungsmittelmolekül nimmt das Proton ab — das neutrale Substitutionsprodukt bleibt zurück.',
        row: [a, '→', b, '+', c], y: 0,
        curly: [S.cv(S.atom(a.s), S.atom(a.h), 1), S.cv(S.pair(a.y, a.h), S.atom(a.y), 1)]
      });
    })()
  ]
};

/* ── Williamson ───────────────────────────────────────────────────── */
/* Ether frame of the scheme: R₁ (0,0) – O (DX,DY) – C (2DX,0) – R₂ (3DX,DY). */
M['williamson-ethersynthese'] = {
  title: 'Alkoholat-Bildung, dann S_N2',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), o = S.at(DX, DY, 'O'), h = S.at(2 * DX, 0, 'H');
        S.b(r, o).b(o, h);
        const b = S.L(2 * DX + 1.25, 0, 'B', -1);
        return { o, h, b };
      });
      const p = S.frag(() => { const r = S.L(0, 0, 'R₁'), o = S.at(DX, DY, 'O', -1); S.b(r, o); return {}; });
      return S.step({
        caption: '1. Die Base (NaH: H⁻, oder K₂CO₃ bei Phenolen) deprotoniert den Alkohol zum Alkoholat — einem viel besseren Nucleophil.',
        row: [a, '→', p, '+', hb(S)], y: DY / 2,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), -1), S.cv(S.pair(a.o, a.h), S.atom(a.o), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), o = S.at(DX, DY, 'O', -1); S.b(r, o);
        // R₂–CH₂–X with the C where the ether C will be, X on the far side
        const c = S.at(2 * DX + 0.55, -0.3), r2 = S.L(3 * DX + 0.55, DY - 0.3, 'R₂'), x = S.L(3 * DX + 0.55, -DY - 0.3, 'X');
        S.b(c, r2).b(c, x);
        return { o, c, x };
      });
      const p = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), o = S.at(DX, DY, 'O'), c = S.at(2 * DX, 0), r2 = S.L(3 * DX, DY, 'R₂');
        S.b(r, o).b(o, c).b(c, r2); return {};
      });
      return S.step({
        caption: '2. S_N2: Das Alkoholat greift das Halogenid-C von der Rückseite an, X⁻ wird verdrängt. Deshalb muss R₂–CH₂–X primär sein — bei tertiärem Halogenid wirkt das Alkoholat als Base (E2).',
        row: [a, '→', p, '+', ion(S, 'X', -1)], y: DY / 2,
        curly: [S.cv(S.atom(a.o), S.atom(a.c), 1), S.cv(S.pair(a.c, a.x), S.atom(a.x), 1)]
      });
    })()
  ]
};

/* ── Alkohol → Halogenalkan (SOCl₂) ───────────────────────────────── */
/* R₁ (0,0) – CH₂ (DX,DY) – O (2DX,0); H on O to the lower left, the S
   to the lower right (so O⁺ keeps its charge corner free), S=O up, Cl down. */
function chlorosulfite(S, opts) {
  opts = opts || {};
  const k = prim(S, 'O', { charge: opts.h ? 1 : 0 });
  if (opts.h) k.h = S.to(k.y, 250, 'H', { len: 0.85 });
  k.s = S.to(k.y, -30, 'S'); k.so = S.to(k.s, 30, 'O', { order: 2 }); k.cl = S.to(k.s, 270, 'Cl');
  return k;
}
M['alkohol-zu-halogenid'] = {
  title: 'Über den Chlorsulfitester (SOCl₂)',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = prim(S, 'O'); S.to(k.y, 250, 'H', { len: 0.85 });
        k.s = S.at(3 * DX + 0.4, -DY - 0.25, 'S'); S.to(k.s, 30, 'O', { order: 2 }); S.to(k.s, 270, 'Cl'); k.cl = S.to(k.s, -30, 'Cl');
        return k;
      });
      const p = S.frag(() => chlorosulfite(S, { h: true }));
      return S.step({
        caption: '1. Der Alkohol-Sauerstoff greift das Schwefelatom an, Chlorid wird verdrängt.',
        row: [a, '→', p, '+', ion(S, 'Cl', -1)], y: 0,
        curly: [S.cv(S.atom(a.y), S.atom(a.s), -1), S.cv(S.pair(a.s, a.cl), S.atom(a.cl), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = chlorosulfite(S, { h: true });
        k.b = S.L(2 * DX - 1.25, -1.35, 'B');
        return k;
      });
      const p = S.frag(() => chlorosulfite(S));
      return S.step({
        caption: '2. Pyridin (B) nimmt das Proton ab: Es entsteht der Chlorsulfitester R–O–S(O)Cl — aus der schlechten Abgangsgruppe OH wurde eine sehr gute.',
        row: [a, '→', p, '+', hb(S, 1)], y: 0,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.y, a.h), S.atom(a.y), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = chlorosulfite(S);
        k.nu = S.L(DX - 1.3, DY + 0.75, 'Cl', -1);
        return k;
      });
      const p = S.frag(() => prim(S, 'Cl'));
      const so2 = S.frag(() => { const s = S.at(0, 0, 'S'); S.to(s, 150, 'O', { order: 2 }); S.to(s, 30, 'O', { order: 2 }); return {}; });
      return S.step({
        caption: '3. S_N2: Chlorid greift das C-Atom von der Rückseite an; der Chlorsulfit-Rest zerfällt dabei zu SO₂ und Cl⁻ — SO₂ entweicht als Gas. Mit PBr₃ läuft es analog über R–O–PBr₂.',
        row: [a, '→', p, '+', so2, '+', ion(S, 'Cl', -1)], y: 0,
        curly: [S.cv(S.atom(a.nu), S.atom(a.c), 1), S.cv(S.pair(a.c, a.y), S.pair(a.y, a.s), 1), S.cv(S.pair(a.s, a.cl), S.atom(a.cl), 1)]
      });
    })()
  ]
};

/* ── Tosylierung ──────────────────────────────────────────────────── */
function tsyl(S, s) {                              // –S(=O)₂–Ar on atom s
  S.to(s, 90, 'O', { order: 2 }); S.to(s, 270, 'O', { order: 2 });
  return S.to(s, 30, null, { label: 'Ar' });
}
function tosylate(S, opts) {
  opts = opts || {};
  const k = prim(S, 'O', { charge: opts.h ? 1 : 0 });
  if (opts.h) k.h = S.to(k.y, 250, 'H', { len: 0.85 });
  k.s = S.to(k.y, -30, 'S'); tsyl(S, k.s);
  return k;
}
M['tosylierung'] = {
  title: 'Angriff am Schwefel — das C-Atom bleibt unberührt',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = prim(S, 'O'); S.to(k.y, 250, 'H', { len: 0.85 });
        k.s = S.at(3 * DX + 0.4, -DY - 0.25, 'S'); tsyl(S, k.s); k.cl = S.to(k.s, -30, 'Cl');
        return k;
      });
      const p = S.frag(() => tosylate(S, { h: true }));
      return S.step({
        caption: '1. Der Alkohol-Sauerstoff greift das S-Atom des Sulfonylchlorids an, Chlorid wird verdrängt. Die C–O-Bindung bleibt dabei intakt — die Konfiguration am C bleibt erhalten.',
        row: [a, '→', p, '+', ion(S, 'Cl', -1)], y: 0,
        curly: [S.cv(S.atom(a.y), S.atom(a.s), -1), S.cv(S.pair(a.s, a.cl), S.atom(a.cl), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = tosylate(S, { h: true }); k.b = S.L(2 * DX - 1.25, -1.35, 'B'); return k; });
      const p = S.frag(() => tosylate(S));
      return S.step({
        caption: '2. Pyridin (B) nimmt das Proton ab. Ergebnis: der Sulfonsäureester R–OTs (Ar = p-Tolyl); TsO⁻ ist als Abgangsgruppe so gut wie Bromid. (MsCl reagiert mit NEt₃ teils über das Sulfen CH₂=SO₂ — gleiches Produkt.)',
        row: [a, '→', p, '+', hb(S, 1)], y: 0,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.y, a.h), S.atom(a.y), 1)]
      });
    })()
  ]
};

/* ── Mitsunobu ────────────────────────────────────────────────────── */
/* Alcohol frame of the scheme: R₁ (0,0) – C (DX,DY) – R₂ (2DX,0), O up (hashed). */
function sec(S, top, opts) {
  opts = opts || {};
  const r1 = S.L(0, 0, 'R₁'), c = S.at(DX, DY), r2 = S.L(2 * DX, 0, 'R₂');
  const t = S.any(DX, DY + 1, top, opts.charge);
  S.b(r1, c).b(c, r2).b(c, t, 1, opts.stereo == null ? 6 : opts.stereo);
  return { c, o: t };
}
/* E–N=N–E (E = CO₂Et) with N1 at (x,y), N2 lower right; E on N1 at
   `e1` (150°), on N2 at −30°, an optional H on N2 straight down. */
function dead(S, x, y, opts) {
  opts = opts || {};
  const n1 = S.at(x, y, 'N', opts.q1), n2 = S.at(x + DX, y - DY, 'N', opts.q2);
  S.b(n1, n2, opts.single ? 1 : 2);
  S.to(n1, opts.e1 || 150, null, { label: 'E', len: 1 }); S.to(n2, -30, null, { label: 'E', len: 1 });
  const h = opts.h2 ? S.to(n2, 270, 'H', { len: 0.85 }) : null;
  return { n1, n2, h };
}
/* the alcohol with Ph₃P⁺ on its O, horizontally to the right */
function alkoxyP(S, opts) {
  opts = opts || {};
  const k = sec(S, 'O', { charge: opts.h ? 1 : 0 });
  if (opts.h) k.h = S.to(k.o, 150, 'H', { len: 0.85 });
  k.p = S.to(k.o, 0, null, { label: 'PPh₃', charge: 1 });
  return k;
}
M['mitsunobu'] = {
  title: 'Aktivierung als Alkoxyphosphonium-Ion, dann S_N2',
  steps: [
    (() => {
      const S = scene();
      const d = S.frag(() => Object.assign(dead(S, 0, 0), { p: S.L(0.75, 1.3, 'Ph₃P') }));
      const b = S.frag(() => {
        const k = dead(S, 0, 0, { single: true, q2: -1 }); S.to(k.n1, 90, null, { label: 'PPh₃', charge: 1 }); return k;
      });
      return S.step({
        caption: '1. PPh₃ addiert an die N=N-Bindung des DEAD (E = CO₂Et): Es entsteht ein Betain mit P⁺ und N⁻.',
        row: [d, '→', b], y: 0,
        curly: [S.cv(S.atom(d.p), S.atom(d.n1), -1), S.cv(S.pair(d.n1, d.n2), S.atom(d.n2), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const b = S.frag(() => {
        const k = dead(S, 0, 0, { single: true, q2: -1 }); S.to(k.n1, 90, null, { label: 'PPh₃', charge: 1 });
        k.h = S.at(DX, -DY - 1.45, 'H'); k.nu = S.to(k.h, 180, null, { label: 'Nu' });
        return k;
      });
      const p = S.frag(() => { const k = dead(S, 0, 0, { single: true, h2: true }); S.to(k.n1, 90, null, { label: 'PPh₃', charge: 1 }); return k; });
      return S.step({
        caption: '2. Das basische N⁻ deprotoniert die acide Komponente Nu–H (pK_s < ~13) — so entsteht das eigentliche Nucleophil Nu⁻.',
        row: [b, '→', p, '+', ion(S, 'Nu', -1)], y: 0,
        curly: [S.cv(S.atom(b.n2), S.atom(b.h), -1), S.cv(S.pair(b.h, b.nu), S.atom(b.nu), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = sec(S, 'O'); S.to(k.o, 150, 'H', { len: 0.85 });
        k.p = S.L(DX + 1.85, DY + 1, "PPh₃", 1);
        const d = dead(S, DX + 3.5, DY + 1, { single: true, e1: 90 }); S.b(k.p, d.n1); S.to(d.n2, 270, 'H', { len: 0.85 });
        k.n1 = d.n1;
        return k;
      });
      const p = S.frag(() => alkoxyP(S, { h: true }));
      const hyd = S.frag(() => {
        const d = dead(S, 0, DY + 1, { single: true, q1: -1, e1: 90 }); S.to(d.n2, 270, 'H', { len: 0.85 }); return d;
      });
      return S.step({
        caption: '3. Der Alkohol greift das P⁺ an, das Hydrazid-Anion wird verdrängt.',
        row: [a, '→', p, '+', hyd], y: DY + 0.5,
        curly: [S.cv(S.atom(a.o), S.atom(a.p), 1), S.cv(S.pair(a.p, a.n1), S.atom(a.n1), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const hyd = S.frag(() => {
        const d = dead(S, -2.2, DY + 1, { single: true, q1: -1, e1: 90 }); S.to(d.n2, 270, 'H', { len: 0.85 });
        return d;
      });
      const a = S.frag(() => alkoxyP(S, { h: true }));
      const p = S.frag(() => alkoxyP(S));
      return S.step({
        caption: '4. Protonenübertrag: Das Hydrazid-Anion holt sich das Proton vom Oxonium-Ion. Es bleiben das Alkoxyphosphonium-Ion R–O–P⁺Ph₃ — mit einer hervorragenden Abgangsgruppe — und der Hydrazindicarbonsäureester EHN–NHE.',
        row: [hyd, '+', a, '→', p, '+', S.frag(() => ({ i: S.L(0, 0, 'EHN–NHE') }))], y: DY + 0.5,
        curly: [S.cv(S.atom(hyd.n1), S.atom(a.h), 1), S.cv(S.pair(a.o, a.h), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = alkoxyP(S); k.nu = S.L(DX, DY - 1.45, 'Nu', -1); return k; });
      const p = S.frag(() => sec(S, 'Nu', { stereo: 1 }));
      const po = S.frag(() => { const o = S.at(0, 0, 'O'); S.to(o, 0, null, { label: 'PPh₃', order: 2 }); return {}; });
      return S.step({
        caption: '5. S_N2: Nu⁻ greift das Carbinol-C von der Gegenseite der Abgangsgruppe an (O hinter der Ebene, Nu davor), Ph₃P=O wird abgespalten — seine sehr starke P=O-Bindung ist die Triebkraft. Ergebnis: vollständige Inversion.',
        row: [a, '→', p, '+', po], y: DY,
        curly: [S.cv(S.atom(a.nu), S.atom(a.c), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), -1)]
      });
    })()
  ]
};

/* ── Kolbe-Nitrilsynthese ─────────────────────────────────────────── */
M['nitril-aus-halogenid'] = {
  title: 'S_N2 mit Cyanid',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = prim(S, 'X', { label: true });
        // ⁻C≡N lined up behind the C, opposite to X
        k.cn = S.at(DX - 1.25, DY + 0.72, 'C', -1); const n = S.at(DX - 2.25, DY + 1.3, 'N'); S.b(k.cn, n, 3);
        return k;
      });
      const p = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY), c2 = S.at(2 * DX, 0), n = S.at(3 * DX, -DY, 'N');
        S.b(r, c1).b(c1, c2).b(c2, n, 3); return {};
      });
      return S.step({
        caption: 'Das Cyanid-Ion greift über das C-Atom (das weichere, nucleophilere Ende) von der Rückseite an, X⁻ wird verdrängt. Polar-aprotische Lösungsmittel (DMSO) lassen CN⁻ unsolvatisiert und damit reaktiv.',
        row: [a, '→', p, '+', ion(S, 'X', -1)], y: DY / 2,
        curly: [S.cv(S.atom(a.cn), S.atom(a.c), -1), S.cv(S.pair(a.c, a.y), S.atom(a.y), -1)]
      });
    })()
  ]
};

/* ── N-Alkylierung ────────────────────────────────────────────────── */
/* Amine frame: R₁ (0,0) – N (DX,DY) – C (2DX,0) – R₂ (3DX,DY). */
M['amin-alkylierung'] = {
  title: 'S_N2 am Halogenalkan, dann Deprotonierung',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), n = S.at(DX, DY, 'N'); S.b(r, n);
        S.to(n, 90, 'H', { len: 0.85 }); S.to(n, 150, 'H', { len: 0.85 });
        S.m.atoms[S.m.atoms.length - 1].x = DX - 0.75; S.m.atoms[S.m.atoms.length - 1].y = DY + 0.45;
        const c = S.at(2 * DX + 0.55, -0.3), r2 = S.L(3 * DX + 0.55, DY - 0.3, 'R₂'), x = S.L(3 * DX + 0.55, -DY - 0.3, 'X');
        S.b(c, r2).b(c, x);
        return { n, c, x };
      });
      const p = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), n = S.at(DX, DY, 'N', 1), c = S.at(2 * DX, 0), r2 = S.L(3 * DX, DY, 'R₂');
        S.b(r, n).b(n, c).b(c, r2); S.to(n, 90, 'H', { len: 0.85 });
        const h2 = S.at(DX - 0.75, DY + 0.45, 'H'); S.b(n, h2); return {};
      });
      return S.step({
        caption: '1. S_N2: Das freie Elektronenpaar des Amins greift das C-Atom von der Rückseite an, X⁻ wird verdrängt. Es entsteht ein Ammonium-Ion.',
        row: [a, '→', p, '+', ion(S, 'X', -1)], y: DY / 2,
        curly: [S.cv(S.atom(a.n), S.atom(a.c), 1), S.cv(S.pair(a.c, a.x), S.atom(a.x), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), n = S.at(DX, DY, 'N', 1), c = S.at(2 * DX, 0), r2 = S.L(3 * DX, DY, 'R₂');
        S.b(r, n).b(n, c).b(c, r2); const h = S.to(n, 90, 'H', { len: 0.85 });
        const h2 = S.at(DX - 0.75, DY + 0.45, 'H'); S.b(n, h2);
        const b = S.L(DX + 1.25, DY + 1.0, 'B');
        return { n, h, b };
      });
      const p = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), n = S.at(DX, DY, 'N'), c = S.at(2 * DX, 0), r2 = S.L(3 * DX, DY, 'R₂');
        S.b(r, n).b(n, c).b(c, r2); S.to(n, 90, 'H', { len: 0.85 }); return {};
      });
      return S.step({
        caption: '2. Die zugesetzte Base (K₂CO₃, NEt₃) fängt das Proton ab: sekundäres Amin. Es ist nucleophiler als das Edukt und kann erneut angreifen — die Überalkylierung.',
        row: [a, '→', p, '+', hb(S, 1)], y: DY / 2,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.n, a.h), S.atom(a.n), -1)]
      });
    })()
  ]
};

/* ── Gabriel ──────────────────────────────────────────────────────── */
/* Phthalimide: a regular five-ring with the N as its apex at (nx,ny),
   opening to the right (dir +1) or left (dir −1), benzo-fused on the far
   side. With `nh` the imide becomes the hydrazide ring (6-ring N–N). */
function phthal(S, nx, ny, dir, opts) {
  opts = opts || {};
  const X = (dx, dy) => [nx + dir * dx, ny + dy];
  const n = S.at(nx, ny, 'N', opts.nq);
  const c1 = S.at(...X(0.588, 0.809)), c2 = S.at(...X(0.588, -0.809));
  const a1 = S.at(...X(1.539, 0.5)), a2 = S.at(...X(1.539, -0.5));
  S.b(n, c1).b(n, c2).b(c1, a1).b(c2, a2).b(a1, a2, 2);
  const o1 = S.at(...X(0.279, 1.76), 'O'), o2 = S.at(...X(0.279, -1.76), 'O');
  S.b(c1, o1, 2).b(c2, o2, 2);
  const k0 = S.m.atoms.length;
  S.m.fuse(a1, a2, 6); S._adopt(k0);
  const nb = S.m.bonds.length;
  S.m.bonds[nb - 2].order = 2; S.m.bonds[nb - 4].order = 2;
  return { n, c1, c2, o1, o2 };
}
function nphth(S) {                               // R₁–CH₂–N-phthalimide, N where the amine N will be
  const r = S.L(0, 0, 'R₁'), c = S.at(DX, DY), ph = phthal(S, 2 * DX, 0, 1);
  S.b(r, c).b(c, ph.n);
  return Object.assign({ r, c }, ph);
}
M['gabriel-synthese'] = {
  title: 'Alkylierung des Phthalimid-Anions, dann Hydrazinolyse',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = prim(S, 'X', { label: true });
        const ph = phthal(S, DX - 1.35, DY + 0.8, -1, { nq: -1 });
        return Object.assign(k, { n: ph.n });
      });
      const p = S.frag(() => nphth(S));
      return S.step({
        caption: '1. S_N2: Das Phthalimid-Anion (das N–H zwischen zwei C=O ist acide, pK_s ≈ 8) greift das Halogenid an. Danach trägt N kein H mehr und sein Elektronenpaar ist in beide C=O delokalisiert — keine Überalkylierung.',
        row: [a, '→', p, '+', ion(S, 'X', -1)], y: DY / 2,
        curly: [S.cv(S.atom(a.n), S.atom(a.c), -1), S.cv(S.pair(a.c, a.y), S.atom(a.y), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = nphth(S); const ph = k;
        const hn = S.L(2 * DX + 1.75, 1.75, 'H₂N–NH₂');
        return Object.assign(k, ph, { hn });
      });
      const p = S.frag(() => prim(S, 'NH₂', { label: true }));
      const hyd = S.frag(() => {
        // phthalhydrazide: the five-ring widened to a six-ring N–N
        const n1 = S.at(0, 0.5, 'N'), n2 = S.at(0, -0.5, 'N');
        const c1 = S.at(DX, 1), c2 = S.at(DX, -1), a1 = S.at(2 * DX, 0.5), a2 = S.at(2 * DX, -0.5);
        S.b(n1, n2).b(n1, c1).b(n2, c2).b(c1, a1).b(c2, a2).b(a1, a2, 2);
        S.to(c1, 90, 'O', { order: 2 }); S.to(c2, 270, 'O', { order: 2 });
        S.to(n1, 150, 'H', { len: 0.85 }); S.to(n2, 210, 'H', { len: 0.85 });
        const k0 = S.m.atoms.length; S.m.fuse(a1, a2, 6); S._adopt(k0);
        const nb = S.m.bonds.length; S.m.bonds[nb - 2].order = 2; S.m.bonds[nb - 4].order = 2;
        return {};
      });
      return S.step({
        caption: '2. Hydrazinolyse (Ing-Manske): Hydrazin greift nacheinander beide C=O an — zwei nucleophile Acylsubstitutionen wie bei der Aminolyse eines Esters — und setzt das primäre Amin frei. Zurück bleibt das cyclische Phthalhydrazid. (Alternativ: Verseifung mit OH⁻/H₂O.)',
        row: [a, '→', p, '+', hyd], y: DY / 2,
        curly: [S.cv(S.atom(a.hn), S.atom(a.c1), 1), S.cv(S.pair(a.c1, a.o1), S.atom(a.o1), 1)]
      });
    })()
  ]
};

/* ── Michaelis-Arbuzov ────────────────────────────────────────────── */
/* Product frame: R₁ (0,0) – CH₂ (DX,DY) – P (2DX,0), P=O up, OR₂ to the
   lower right and straight down. */
function pfrag(S, opts) {
  const k = prim(S, 'P', { charge: opts.plus ? 1 : 0 });
  if (opts.top === 'OR') { k.o = S.at(2 * DX, 1, 'O'); k.r = S.L(3 * DX, 1 + DY, 'R₂'); S.b(k.y, k.o).b(k.o, k.r); }
  else { k.o = S.at(2 * DX, 1, 'O'); S.b(k.y, k.o, 2); }
  S.b(k.y, S.L(3 * DX, -DY, 'OR₂')).b(k.y, S.L(2 * DX, -1, 'OR₂'));
  return k;
}
M['michaelis-arbuzov'] = {
  title: 'Zwei S_N2-Schritte hintereinander',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = prim(S, 'X', { label: true });
        k.p = S.at(DX - 1.3, DY + 0.75, 'P');
        S.to(k.p, 90, null, { label: 'OR₂' }); S.to(k.p, 180, null, { label: 'R₂O' }); S.to(k.p, 240, null, { label: 'R₂O', len: 1 });
        return k;
      });
      const p = S.frag(() => pfrag(S, { plus: true, top: 'OR' }));
      return S.step({
        caption: '1. S_N2: Das freie Elektronenpaar des Phosphits greift das Halogenid-C an, X⁻ wird verdrängt. Es entsteht ein Alkoxyphosphonium-Ion.',
        row: [a, '→', p, '+', ion(S, 'X', -1)], y: DY / 2,
        curly: [S.cv(S.atom(a.p), S.atom(a.c), 1), S.cv(S.pair(a.c, a.y), S.atom(a.y), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = pfrag(S, { plus: true, top: 'OR' });
        k.x = S.L(3 * DX + 1.35, 1 + DY, 'X', -1);
        return k;
      });
      const p = S.frag(() => pfrag(S, {}));
      const rx = S.frag(() => ({ i: S.L(0, 0, 'R₂–X') }));
      return S.step({
        caption: '2. Zweite S_N2: Das Halogenid greift jetzt die Alkylgruppe R₂ eines Phosphit-Sauerstoffs an. Die O–R₂-Elektronen bilden die P=O-Bindung — ihre Stärke ist die Triebkraft. Produkt: das Phosphonat (für die Horner-Wadsworth-Emmons-Reaktion).',
        row: [a, '→', p, '+', rx], y: DY / 2,
        curly: [S.cv(S.atom(a.x), S.atom(a.r), 1), S.cv(S.pair(a.o, a.r), S.pair(a.y, a.o), 1)]
      });
    })()
  ]
};

/* ══ Eliminierung ═══════════════════════════════════════════════════ */
/* E2/E1 frame: R₁ (0,0) – C1 (DX,DY) – C2 (2DX,0) – R₂ (3DX,DY), X down from C2. */
function e2frame(S, opts) {
  opts = opts || {};
  const r1 = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY), c2 = S.at(2 * DX, 0, 'C', opts.c2q);
  const r2 = S.L(3 * DX, DY, opts.r2 || 'R₂');
  S.b(r1, c1).b(c1, c2, opts.db ? 2 : 1).b(c2, r2);
  const k = { r1, c1, c2, r2 };
  if (opts.r3) k.r3 = S.to(c1, 90, null, { label: opts.r3 });
  if (opts.h) k.h = S.to(c1, opts.r3 ? 150 : 90, 'H', { len: 0.85 });
  if (opts.x) {
    k.x = S.any(2 * DX, -1, opts.x, opts.xq);
    S.b(c2, k.x);
  }
  return k;
}

M['e2'] = {
  title: 'Konzertiert, H und X anti-periplanar',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = e2frame(S, { h: true, x: 'X' });
        k.b = S.L(DX, DY + 2.05, 'B', -1);
        return k;
      });
      const p = S.frag(() => e2frame(S, { db: true }));
      return S.step({
        caption: 'Alles in einem Schritt: Die Base nimmt das β-H ab, die C–H-Elektronen bilden die π-Bindung, und X⁻ geht. H und X stehen dafür anti-periplanar (hier: H nach oben, X nach unten — in Wirklichkeit eines vor, eines hinter der Ebene).',
        row: [a, '→', p, '+', hb(S), '+', ion(S, 'X', -1)], y: DY / 2,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.c1, a.h), S.pair(a.c1, a.c2), 1), S.cv(S.pair(a.c2, a.x), S.atom(a.x), 1)]
      });
    })()
  ]
};

M['e1'] = {
  title: 'Über das Carbenium-Ion',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => e2frame(S, { r3: 'R₂', r2: 'R₃', h: true, x: 'X' }));
      const p = S.frag(() => e2frame(S, { r3: 'R₂', r2: 'R₃', h: true, c2q: 1 }));
      return S.step({
        caption: '1. Heterolyse (langsam): X⁻ geht, es bleibt ein tertiäres Carbenium-Ion — genau wie bei der S_N1. Beide Reaktionen konkurrieren immer.',
        row: [a, '→', p, '+', ion(S, 'X', -1)], y: DY / 2,
        curly: [S.cv(S.pair(a.c2, a.x), S.atom(a.x), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = e2frame(S, { r3: 'R₂', r2: 'R₃', h: true, c2q: 1 });
        k.b = S.L(DX - 1.45, DY + 1.25, 'B');
        return k;
      });
      const p = S.frag(() => e2frame(S, { r3: 'R₂', r2: 'R₃', db: true }));
      return S.step({
        caption: '2. Eine schwache Base (meist das Lösungsmittel) nimmt ein Proton vom Nachbar-C ab; die C–H-Elektronen bilden die Doppelbindung. Bevorzugt entsteht das höher substituierte Alken (Saytzeff).',
        row: [a, '→', p, '+', hb(S, 1)], y: DY / 2,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.c1, a.h), S.pair(a.c1, a.c2), 1)]
      });
    })()
  ]
};

M['dehydratisierung-alkohol'] = {
  title: 'Säurekatalysiert über das Carbenium-Ion (E1)',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = e2frame(S, { h: true, x: 'O' }); k.oh = S.to(k.x, 0, 'H', { len: 0.85 });
        k.hp = S.at(2 * DX + 1.15, -1.95, 'H'); k.oa = S.to(k.hp, 0, 'O', { charge: 1 }); S.to(k.oa, 60, 'H', { len: 0.85 }); S.to(k.oa, -60, 'H', { len: 0.85 });
        return k;
      });
      const p = S.frag(() => {
        const k = e2frame(S, { h: true, x: 'O', xq: 1 }); S.to(k.x, 330, 'H', { len: 0.85 }); S.to(k.x, 210, 'H', { len: 0.85 }); return k;
      });
      return S.step({
        caption: '1. Die OH-Gruppe wird protoniert (H₃O⁺ steht für die Säure). Aus der schlechten Abgangsgruppe OH⁻ wird die gute Abgangsgruppe H₂O.',
        row: [a, '→', p, '+', S.frag(() => ({ i: S.L(0, 0, 'H₂O') }))], y: DY / 2,
        curly: [S.cv(S.atom(a.x), S.atom(a.hp), -1), S.cv(S.pair(a.hp, a.oa), S.atom(a.oa), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = e2frame(S, { h: true, x: 'O', xq: 1 }); S.to(k.x, 330, 'H', { len: 0.85 }); S.to(k.x, 210, 'H', { len: 0.85 }); return k;
      });
      const p = S.frag(() => e2frame(S, { h: true, c2q: 1 }));
      return S.step({
        caption: '2. Wasser spaltet sich ab — es bleibt ein Carbenium-Ion. Sekundäre und tertiäre Alkohole reagieren so (primäre eher E2-artig); Umlagerungen zum stabileren Kation sind möglich.',
        row: [a, '→', p, '+', S.frag(() => ({ i: S.L(0, 0, 'H₂O') }))], y: DY / 2,
        curly: [S.cv(S.pair(a.c2, a.x), S.atom(a.x), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = e2frame(S, { h: true, c2q: 1 });
        k.ow = S.at(DX - 1.45, DY + 1.25, 'O'); S.to(k.ow, 150, 'H', { len: 0.85 }); S.to(k.ow, 210, 'H', { len: 0.85 });
        return k;
      });
      const p = S.frag(() => e2frame(S, { db: true }));
      const h3o = S.frag(() => ({ i: S.L(0, 0, 'H₃O', 1) }));
      return S.step({
        caption: '3. Wasser nimmt das β-Proton ab, die Doppelbindung entsteht und die Säure wird zurückgebildet. Das hoch substituierte, E-konfigurierte Alken überwiegt (Saytzeff); Erhitzen und Abdestillieren treiben das Gleichgewicht.',
        row: [a, '→', p, '+', h3o], y: DY / 2,
        curly: [S.cv(S.atom(a.ow), S.atom(a.h), 1), S.cv(S.pair(a.c1, a.h), S.pair(a.c1, a.c2), 1)]
      });
    })()
  ]
};

/* Alkyne frame of the scheme: R₁ (0,0) – C1 (DX,DY) – C2 (2DX,0), X on C1 up and on C2 down. */
M['alkin-aus-dihalogenid'] = {
  title: 'Zweimal E2, dann Deprotonierung des terminalen Alkins',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY), c2 = S.at(2 * DX, 0);
        S.b(r, c1).b(c1, c2);
        const x1 = S.L(DX, DY + 1, 'X'), x2 = S.L(2 * DX, -1, 'X'); S.b(c1, x1).b(c2, x2);
        const h = S.to(c1, 150, 'H', { len: 0.85 });
        S.m.atoms[h].x = DX - 0.75; S.m.atoms[h].y = DY + 0.45;
        const b = S.L(DX - 1.75, DY + 0.75, 'NH₂', -1);
        return { c1, c2, h, x2, b };
      });
      const p = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY), c2 = S.at(2 * DX, 0);
        S.b(r, c1).b(c1, c2, 2); S.b(c1, S.L(DX, DY + 1, 'X')); S.to(c2, -60, 'H', { len: 0.85 }); return {};
      });
      return S.step({
        caption: '1. Erste E2: Amid (NH₂⁻) nimmt das H am X-tragenden C ab, das andere X⁻ geht — es entsteht ein Vinylhalogenid.',
        row: [a, '→', p, '+', S.frag(() => ({ i: S.L(0, 0, 'NH₃') })), '+', ion(S, 'X', -1)], y: DY / 2,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.c1, a.h), S.pair(a.c1, a.c2), 1), S.cv(S.pair(a.c2, a.x2), S.atom(a.x2), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY), c2 = S.at(2 * DX, 0);
        S.b(r, c1).b(c1, c2, 2); const x = S.L(DX, DY + 1, 'X'); S.b(c1, x); const h = S.to(c2, -60, 'H', { len: 0.85 });
        const b = S.L(2 * DX + 1.2, -1.35, 'NH₂', -1);
        return { c1, c2, h, x, b };
      });
      const p = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), c1 = S.at(1, 0), c2 = S.at(2, 0); S.b(r, c1).b(c1, c2, 3); S.to(c2, 0, 'H', { len: 0.85 }); return {};
      });
      return S.step({
        caption: '2. Zweite E2 am Vinylhalogenid (langsamer, daher die starke Base NaNH₂): das Alkin entsteht. Die sp-Kette R–C≡C–H ist linear.',
        row: [a, '→', p, '+', S.frag(() => ({ i: S.L(0, 0, 'NH₃') })), '+', ion(S, 'X', -1)], y: DY / 2,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), -1), S.cv(S.pair(a.c2, a.h), S.pair(a.c1, a.c2), -1), S.cv(S.pair(a.c1, a.x), S.atom(a.x), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), c1 = S.at(1, 0), c2 = S.at(2, 0); S.b(r, c1).b(c1, c2, 3); const h = S.to(c2, 0, 'H', { len: 0.85 });
        const b = S.L(3.95, 0, 'NH₂', -1);
        return { c2, h, b };
      });
      const p = S.frag(() => { const r = S.L(0, 0, 'R₁'), c1 = S.at(1, 0), c2 = S.at(2, 0, 'C', -1); S.b(r, c1).b(c1, c2, 3); return {}; });
      return S.step({
        caption: '3. Das terminale Alkin (pK_s ≈ 25) ist acider als NH₃ (pK_s ≈ 35) und wird sofort zum Acetylid deprotoniert — deshalb braucht man ein drittes Äquivalent Base. Erst die wässrige Aufarbeitung (H₃O⁺) liefert R–C≡C–H zurück.',
        row: [a, '→', p, '+', S.frag(() => ({ i: S.L(0, 0, 'NH₃') }))], y: 0,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.c2, a.h), S.atom(a.c2), 1)]
      });
    })()
  ]
};

/* Ester pyrolysis: the acetate O–C(=O)–CH₃ curls back under the chain to the β-H. */
M['esterpyrolyse'] = {
  title: 'Cyclischer, sechsgliedriger Übergangszustand (E_i)',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r1 = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY), c2 = S.at(2 * DX, 0), r2 = S.L(3 * DX, DY, 'R₂');
        S.b(r1, c1).b(c1, c2).b(c2, r2);
        // six-ring C1–C2–O–C(=O)…H–C1 hanging below the chain
        const o = S.at(2 * DX, -1, 'O'), cc = S.at(1.15, -1.95), oc = S.at(0.3, -1.4, 'O'), h = S.at(0.8, -0.42, 'H');
        S.b(c2, o).b(o, cc).b(cc, oc, 2).b(c1, h);
        S.to(cc, -80, null, { label: 'CH₃' });
        return { c1, c2, o, cc, oc, h };
      });
      const p = S.frag(() => {
        const r1 = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY), c2 = S.at(2 * DX, 0), r2 = S.L(3 * DX, DY, 'R₂');
        S.b(r1, c1).b(c1, c2, 2).b(c2, r2); return {};
      });
      const acoh = S.frag(() => {
        const c = S.at(0, -1.75), o1 = S.at(0.75, -1.2, 'O'), o2 = S.at(-0.75, -1.2, 'O'); S.b(c, o1, 2).b(c, o2);
        S.to(o2, 90, 'H', { len: 0.85 }); S.to(c, -90, null, { label: 'CH₃' }); return {};
      });
      return S.step({
        caption: 'Beim Erhitzen greift der Carbonyl-Sauerstoff das β-H auf DERSELBEN Seite an; in einem cyclischen Sechsring-ÜZ verschieben sich drei Elektronenpaare gleichzeitig. Deshalb syn-Eliminierung — und ohne Base oder Säure keine Umlagerungen.',
        row: [a, '→', p, '+', acoh], y: -0.4,
        curly: (() => { const w = { away: S.centre([a.c1, a.c2, a.o, a.cc, a.oc, a.h]) };
          return [S.cv(S.pair(a.cc, a.oc), S.pair(a.oc, a.h), 0, w), S.cv(S.pair(a.c1, a.h), S.pair(a.c1, a.c2), 0, w), S.cv(S.pair(a.c2, a.o), S.pair(a.o, a.cc), 0, w)]; })()
      });
    })()
  ]
};

module.exports = M;
