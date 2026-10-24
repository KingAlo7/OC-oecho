/* Mechanisms — Oxidation & Reduktion (frames as in lib-rx-07-redox.js).
   No mechanism for catalytic hydrogenolysis/Rosenmund (surface reactions)
   and the Glaser coupling (Cu-mediated, not arrow-pushing). */
const { scene, polar, DX, DY } = require('./lib-mech.js');

const M = {};
const lab = (S, label, q) => S.frag(() => ({ i: S.L(0, 0, label, q) }));
const H = (S, i, deg) => S.to(i, deg, 'H', { len: 0.85 });

/* a chromate ester on oxygen `o`: Cr in direction `deg`, two Cr=O and X */
function chromate(S, o, deg, x) {
  const cr = S.to(o, deg, 'Cr');
  const o1 = S.to(cr, deg + 60, 'O', { order: 2 }); S.to(cr, deg - 60, 'O', { order: 2 });
  S.to(cr, deg, null, { label: x || 'OH' });
  return { cr, o1 };
}

/* ── Primärer Alkohol → Aldehyd (PCC) ─────────────────────────────── */
/* scheme frame: R₁ (0,0) – CH₂ (DX,DY) – O (2DX,0) */
M['prim-alkohol-zu-aldehyd'] = {
  title: 'Chromatester, dann E2-artige Eliminierung',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const r = S.L(0, 0, 'R₁'), c = S.at(DX, DY), o = S.at(2 * DX, 0, 'O'); S.b(r, c).b(c, o); H(S, o, -30); return {}; });
      const p = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), c = S.at(DX, DY), o = S.at(2 * DX, 0, 'O'); S.b(r, c).b(c, o); H(S, c, 90);
        chromate(S, o, 30, 'Cl'); return {};
      });
      return S.step({
        caption: '1. Der Alkohol-Sauerstoff greift das Cr(VI) von PCC (Pyridiniumchlorochromat, [ClCrO₃]⁻ pyH⁺) an; nach Protonenübertrag und Abgabe von OH⁻/H₂O liegt der Chromsäureester vor.',
        row: [a, { arrow: '→', above: 'PCC', below: '−H₂O' }, p], y: 0.3
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), c = S.at(DX, DY), o = S.at(2 * DX, 0, 'O'); S.b(r, c).b(c, o); const h = H(S, c, 90);
        const k = chromate(S, o, 30, 'Cl'); const b = S.L(DX - 1.0, DY + 1.25, 'B'); return Object.assign(k, { c, o, h, b });
      });
      const p = S.frag(() => { const r = S.L(0, 0, 'R₁'), c = S.at(DX, DY), o = S.at(2 * DX, 0, 'O'); S.b(r, c).b(c, o, 2); H(S, c, 90); return {}; });
      const cr = S.frag(() => {
        const cr = S.at(0, 0, 'Cr', -1); S.to(cr, 90, 'O', { order: 2 }); S.to(cr, -30, 'O'); S.to(cr, 210, null, { label: 'Cl' }); return {};
      });
      return S.step({
        caption: '2. Eine Base (Pyridin) nimmt das H am Carbinol-C ab; das C–H-Elektronenpaar bildet die C=O-Bindung, und die O–Cr-Bindung bricht mit beiden Elektronen zum Chrom: Cr(VI) → Cr(IV). Weil PCC wasserfrei arbeitet, bildet der Aldehyd kein Hydrat — und wird deshalb nicht weiter zur Säure oxidiert.',
        row: [a, '→', p, '+', lab(S, 'H–B', 1), '+', cr], y: 0.3,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), -1), S.cv(S.pair(a.c, a.h), S.pair(a.c, a.o), -1), S.cv(S.pair(a.o, a.cr), S.atom(a.cr), 1)]
      });
    })()
  ]
};

/* ── Sekundärer Alkohol → Keton (Jones) ───────────────────────────── */
/* scheme frame: R₁ – C (DX,DY) – R₂, the O up */
function sec(S, o) {
  o = o || {};
  const r1 = S.L(0, 0, 'R₁'), c = S.at(DX, DY), r2 = S.L(2 * DX, 0, 'R₂'); S.b(r1, c).b(c, r2);
  const ox = S.at(DX, DY + 1, 'O'); S.b(c, ox, o.keto ? 2 : 1);
  const k = { c, o: ox };
  if (!o.keto) k.h = H(S, c, 150);
  if (o.oh) H(S, ox, 30);
  if (o.cr) Object.assign(k, chromate(S, ox, 30));
  return k;
}
M['sek-alkohol-zu-keton'] = {
  title: 'Chromatester, dann E2-artige Eliminierung',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => sec(S, { oh: true }));
      const p = S.frag(() => sec(S, { cr: true }));
      return S.step({
        caption: '1. CrO₃ bildet in Schwefelsäure Chromsäure H₂CrO₄. Der Alkohol kondensiert mit ihr zum Chromsäureester (Angriff des O am Cr, Protonenübertrag, Abspaltung von Wasser).',
        row: [a, { arrow: '→', above: 'H₂CrO₄', below: '−H₂O' }, p], y: DY
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = sec(S, { cr: true }); k.w = S.at(...polar(S.xy(k.h), 180, 1.15), 'O'); H(S, k.w, 120); H(S, k.w, 240); return k; });
      const p = S.frag(() => sec(S, { keto: true }));
      const cr = S.frag(() => { const cr = S.at(0, 0, 'Cr', -1); S.to(cr, 90, 'O', { order: 2 }); S.to(cr, -30, 'O'); S.to(cr, 210, null, { label: 'HO' }); return {}; });
      return S.step({
        caption: '2. Wasser nimmt das H am C ab; C=O entsteht, Chrom wird reduziert (Cr(VI) → Cr(IV), weiter zu grünem Cr(III) — daher der Farbumschlag von Orange nach Grün). Tertiäre Alkohole haben kein solches H und werden nicht oxidiert.',
        row: [a, '→', p, '+', lab(S, 'H₃O', 1), '+', cr], y: DY,
        curly: [S.cv(S.atom(a.w), S.atom(a.h), -1), S.cv(S.pair(a.c, a.h), S.pair(a.c, a.o), -1), S.cv(S.pair(a.o, a.cr), S.atom(a.cr), 1)]
      });
    })()
  ]
};

/* ── Primärer Alkohol → Carbonsäure ───────────────────────────────── */
/* acid frame of the scheme: R₁ – C (DX,DY), C=O up, OH lower right */
function ald(S) {
  const r = S.L(0, 0, 'R₁'), c = S.at(DX, DY), o = S.at(DX, DY + 1, 'O'), h = S.L(2 * DX, 0, 'H');
  S.b(r, c).b(c, o, 2).b(c, h); return { c, o };
}
function hydrate(S, o) {
  o = o || {};
  const r = S.L(0, 0, 'R₁'), c = S.at(DX, DY); S.b(r, c);
  const top = S.at(DX, DY + 1, 'O', o.tq); S.b(c, top);
  const side = S.at(...polar([DX, DY], 30, 1), 'O', o.sq); S.b(c, side);
  const h = H(S, c, -30);
  const k = { c, top, side, h };
  if (o.cr) Object.assign(k, chromate(S, top, 120));
  else if (o.tq !== -1) H(S, top, 150);
  H(S, side, 90); if (o.sq) H(S, side, -30);
  return k;
}
M['prim-alkohol-zu-saeure'] = {
  title: 'Über den Aldehyd und dessen Hydrat',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const r = S.L(0, 0, 'R₁'), c = S.at(DX, DY), o = S.at(2 * DX, 0, 'O'); S.b(r, c).b(c, o); return {}; });
      const p = S.frag(() => ald(S));
      return S.step({
        caption: '1. Zuerst wird der Alkohol zum Aldehyd oxidiert — Mechanismus wie bei PCC bzw. Jones (Chromatester, Eliminierung).',
        row: [a, { arrow: '→', above: '[Cr(VI)]' }, p], y: DY
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = ald(S); k.w = S.at(...polar([DX, DY], 30, 1.55), 'O'); H(S, k.w, 90); H(S, k.w, -30); return k; });
      const p = S.frag(() => hydrate(S, { tq: -1, sq: 1 }));
      return S.step({
        caption: '2. In wässriger Lösung addiert Wasser an den Aldehyd (der Aldehyd-H weicht dabei nach unten aus).',
        row: [a, '→', p], y: DY,
        curly: [S.cv(S.atom(a.w), S.atom(a.c), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => hydrate(S, { tq: -1, sq: 1 }));
      const p = S.frag(() => hydrate(S));
      return S.step({
        caption: '3. Protonenübertrag: das Aldehydhydrat (ein geminales Diol) — formal wieder ein Alkohol mit einem H am Carbinol-C.',
        row: [a, { arrow: '⇌', above: 'H⁺-Transfer' }, p], y: DY
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = hydrate(S, { cr: true });
        k.w = S.at(...polar(S.xy(k.h), -30, 1.15), 'O'); H(S, k.w, 30); H(S, k.w, -90); return k;
      });
      const p = S.frag(() => { const r = S.L(0, 0, 'R₁'), c = S.at(DX, DY); S.b(r, c); S.b(c, S.at(DX, DY + 1, 'O'), 2); S.b(c, S.L(2 * DX, 0, 'OH')); return {}; });
      return S.step({
        caption: '4. Das Hydrat bildet einen Chromsäureester und wird wie ein sekundärer Alkohol oxidiert: Carbonsäure. Deshalb geht die Oxidation in Wasser (Jones, KMnO₄) bis zur Säure, mit PCC in CH₂Cl₂ nicht. Mit KMnO₄ läuft es analog über einen Mangansäureester.',
        row: [a, { arrow: '→', below: '−Cr(IV)' }, p], y: DY,
        curly: [S.cv(S.atom(a.w), S.atom(a.h), 1), S.cv(S.pair(a.c, a.h), S.pair(a.c, a.top), 1), S.cv(S.pair(a.top, a.cr), S.atom(a.cr), -1)]
      });
    })()
  ]
};

/* ── Baeyer-Villiger ──────────────────────────────────────────────── */
/* ketone frame: R₁ – C (DX,DY) – R₂, O up. The peracid O comes in at 30°;
   R₂ (at −30°) migrates onto it. Ar = m-Chlorphenyl. */
function peroxy(S, oa, deg) {           // –O_b–C(=O)–Ar hanging on O_a
  const ob = S.to(oa, deg, 'O'), c = S.to(ob, deg - 60, 'C');
  S.to(c, deg - 120, 'O', { order: 2 }); S.to(c, deg, null, { label: 'Ar' });
  return { ob, cp: c };
}
M['baeyer-villiger'] = {
  title: 'Criegee-Zwischenstufe und 1,2-Wanderung zum O',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r1 = S.L(0, 0, 'R₁'), c = S.at(DX, DY), o = S.at(DX, DY + 1, 'O'), r2 = S.L(2 * DX, 0, 'R₂');
        S.b(r1, c).b(c, o, 2).b(c, r2);
        const oa = S.at(...polar([DX, DY], 30, 1.6), 'O'); H(S, oa, 90);
        return Object.assign({ c, o, oa }, peroxy(S, oa, 30));
      });
      const p = S.frag(() => {
        const r1 = S.L(0, 0, 'R₁'), c = S.at(DX, DY), o = S.at(DX, DY + 1, 'O'), r2 = S.L(2 * DX, 0, 'R₂');
        S.b(r1, c).b(c, o).b(c, r2); H(S, o, 150);
        const oa = S.to(c, 30, 'O'); return Object.assign({ c, o, oa, r2 }, peroxy(S, oa, 30));
      });
      return S.step({
        caption: '1. Die Persäure (m-CPBA) addiert an die Carbonylgruppe (säurekatalysiert); nach Protonenübertrag liegt die Criegee-Zwischenstufe vor: ein Peroxyhalbacetal.',
        row: [a, { arrow: '→', below: 'H⁺-Transfer' }, p], y: DY + 0.3,
        curly: [S.cv(S.atom(a.oa), S.atom(a.c), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r1 = S.L(0, 0, 'R₁'), c = S.at(DX, DY), o = S.at(DX, DY + 1, 'O'), r2 = S.L(2 * DX, 0, 'R₂');
        S.b(r1, c).b(c, o).b(c, r2); H(S, o, 150);
        const oa = S.to(c, 30, 'O'); return Object.assign({ c, o, oa, r2 }, peroxy(S, oa, 30));
      });
      const p = S.frag(() => {
        const r1 = S.L(0, 0, 'R₁'), c = S.at(DX, DY), o = S.at(DX, DY + 1, 'O'), o2 = S.at(2 * DX, 0, 'O');
        S.b(r1, c).b(c, o, 2).b(c, o2).b(o2, S.L(3 * DX, DY, 'R₂')); return {};
      });
      const acid = lab(S, 'ArCO₂H');
      return S.step({
        caption: '2. Konzertiert: Das OH-Elektronenpaar bildet die C=O-Bindung, R₂ wandert mit seinem Bindungselektronenpaar vom C auf das benachbarte O, und die schwache O–O-Bindung bricht (Carboxylat als Abgangsgruppe). Der Rest wandert, der eine positive Ladung am besten trägt: tert. Alkyl > sek. Alkyl ≈ Phenyl > prim. Alkyl > CH₃ — unter Retention seiner Konfiguration. Das O schiebt sich so in die C–R₂-Bindung ein: Ester (aus cyclischen Ketonen Lactone).',
        row: [a, { arrow: '→', below: '−H⁺' }, p, '+', acid], y: DY + 0.3,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), 1), S.cv(S.pair(a.c, a.r2), S.pair(a.r2, a.oa), -1), S.cv(S.pair(a.oa, a.ob), S.atom(a.ob), -1)]
      });
    })()
  ]
};

/* ── Riley-Oxidation (SeO₂) ───────────────────────────────────────── */
/* allyl frame: R₁ (0,0) – C1 (DX,DY) = C2 (2DX,0) – C3 (3DX,DY). For the
   ene step C1, C2, C3, H, O, Se form a hexagon above the chain. */
function allyl(S, o) {
  o = o || {};
  const r = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY), c2 = S.at(2 * DX, 0), c3 = S.at(3 * DX, DY);
  S.b(r, c1).b(c1, c2, o.shift ? 1 : 2).b(c2, c3, o.shift ? 2 : 1);
  return { c1, c2, c3 };
}
M['allylische-oxidation-seo2'] = {
  title: 'En-Reaktion, dann [2,3]-sigmatrope Umlagerung',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = allyl(S); k.h = S.at(3 * DX, DY + 1, 'H'); S.b(k.c3, k.h);
        k.se = S.at(DX, DY + 1.35, 'Se'); k.o = S.at(2 * DX, DY + 1.85, 'O'); S.b(k.se, k.o, 2); S.to(k.se, 150, 'O', { order: 2 });
        return k;
      });
      const p = S.frag(() => {
        const k = allyl(S, { shift: true }); k.se = S.at(DX, DY + 1, 'Se'); S.b(k.c1, k.se);
        k.o = S.at(2 * DX, DY + 1.5, 'O'); S.b(k.se, k.o); H(S, k.o, 30); S.to(k.se, 150, 'O', { order: 2 }); return k;
      });
      return S.step({
        caption: '1. En-Reaktion: SeO₂ (O=Se=O) ist das Enophil. In einem cyclischen Sechsring-Übergangszustand bildet sich die C–Se-Bindung, die Doppelbindung verschiebt sich, und das allylische H wandert auf ein O des Selens: allylische Seleninsäure.',
        row: [a, '→', p], y: DY + 0.3,
        curly: (() => { const w = { away: S.centre([a.c1, a.c2, a.c3, a.h, a.o, a.se]) };
          return [S.cv(S.pair(a.c1, a.c2), S.pair(a.c1, a.se), 0, w), S.cv(S.pair(a.c3, a.h), S.pair(a.c2, a.c3), 0, w), S.cv(S.pair(a.se, a.o), S.pair(a.o, a.h), 0, w)]; })()
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = allyl(S, { shift: true }); k.se = S.at(DX, DY + 1, 'Se'); S.b(k.c1, k.se);
        k.o = S.at(2 * DX, DY + 1.5, 'O'); S.b(k.se, k.o, 2); const oh = S.to(k.se, 150, 'O'); H(S, oh, 90); return k;
      });
      const p = S.frag(() => {
        const k = allyl(S); const o = S.to(k.c3, -30, 'O'); const se = S.to(o, 30, 'Se'); const oh = S.to(se, -30, 'O'); H(S, oh, 30); return k;
      });
      return S.step({
        caption: '2. [2,3]-Sigmatrope Umlagerung: Das Se=O-Sauerstoffatom (die beiden O am Se tauschen über das Proton leicht die Rolle) bindet an das endständige C, die Doppelbindung springt zurück, die C–Se-Bindung bricht. Ergebnis: ein Selenit-Ester des Allylalkohols — mit der Doppelbindung wieder am ursprünglichen Ort.',
        row: [a, '→', p], y: DY + 0.3,
        curly: [S.cv(S.atom(a.o), S.atom(a.c3), -1), S.cv(S.pair(a.c2, a.c3), S.pair(a.c1, a.c2), -1), S.cv(S.pair(a.c1, a.se), S.atom(a.se), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = allyl(S); const o = S.to(k.c3, -30, 'O'); const se = S.to(o, 30, 'Se'); const oh = S.to(se, -30, 'O'); H(S, oh, 30); return k; });
      const p = S.frag(() => { const k = allyl(S); S.to(k.c3, -30, 'O'); return k; });
      return S.step({
        caption: '3. Hydrolyse des Selenit-Esters liefert den Allylalkohol (bei längerer Reaktion weiter oxidiert: Enal). Bevorzugt reagiert die CH₃- bzw. CH₂-Gruppe am höher substituierten Ende der Doppelbindung; die Doppelbindung bleibt (E).',
        row: [a, { arrow: '→', above: 'H₂O' }, p, '+', lab(S, 'Se(OH)₂')], y: DY
      });
    })()
  ]
};

/* ── DIBAL-H ──────────────────────────────────────────────────────── */
/* ester frame: R₁ – C (DX,DY) (O up) – O – R₂; Al on the carbonyl O */
function est(S, o) {
  o = o || {};
  const r1 = S.L(0, 0, 'R₁'), c = S.at(DX, DY), ox = S.at(DX, DY + 1, 'O', o.oq), o2 = S.at(2 * DX, 0, 'O');
  S.b(r1, c).b(c, ox, o.tet ? 1 : 2).b(c, o2).b(o2, S.L(3 * DX, DY, 'R₂'));
  const k = { c, o: ox, o2 };
  if (o.al) { k.al = S.to(ox, 30, null, { label: 'Al(iBu)₂', charge: o.alq }); if (o.alH) k.h = S.to(k.al, 120, 'H', { len: 0.9 }); }
  if (o.tet) H(S, c, 150);
  return k;
}
M['dibal-reduktion'] = {
  title: 'Lewis-Säure-Koordination, intramolekularer Hydrid-Transfer',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = est(S); k.al = S.L(DX + 1.4, DY + 1.55, 'AlH(iBu)₂'); return k; });
      const p = S.frag(() => est(S, { oq: 1, al: true, alq: -1, alH: true }));
      return S.step({
        caption: '1. DIBAL-H (iBu₂AlH) ist eine Lewis-Säure: Das Al koordiniert zuerst den Carbonyl-Sauerstoff.',
        row: [a, '→', p], y: DY + 0.3,
        curly: [S.cv(S.atom(a.o), S.atom(a.al), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => est(S, { oq: 1, al: true, alq: -1, alH: true }));
      const p = S.frag(() => est(S, { tet: true, al: true }));
      return S.step({
        caption: '2. Das Hydrid wird vom Al auf das Carbonyl-C übertragen. Die tetraedrische Zwischenstufe — ein Aluminium-Halbacetal — ist bei −78 °C stabil und zerfällt nicht: Eine zweite Reduktion bleibt aus.',
        row: [a, '→', p], y: DY + 0.3,
        curly: [S.cv(S.pair(a.al, a.h), S.atom(a.c), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r1 = S.L(0, 0, 'R₁'), c = S.at(DX, DY), ox = S.at(DX, DY + 1, 'O'), o2 = S.at(2 * DX, 0, 'O');
        S.b(r1, c).b(c, ox).b(c, o2).b(o2, S.L(3 * DX, DY, 'R₂')); H(S, c, 150); H(S, ox, 30); return { c, o: ox, o2 };
      });
      const p = S.frag(() => {
        const r1 = S.L(0, 0, 'R₁'), c = S.at(DX, DY), ox = S.at(DX, DY + 1, 'O'); S.b(r1, c).b(c, ox, 2).b(c, S.L(2 * DX, 0, 'H')); return {};
      });
      return S.step({
        caption: '3. Erst bei der wässrigen Aufarbeitung (das Al wird durch H ersetzt) zerfällt das Halbacetal in den Aldehyd und R₂OH. Mit 1 Äquivalent DIBAL und tiefer Temperatur gelingt so die Reduktion Ester → Aldehyd; LiAlH₄ ginge bis zum Alkohol durch.',
        row: [a, { arrow: '→', above: 'H₃O⁺' }, p, '+', lab(S, 'R₂OH')], y: DY + 0.3,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), 1), S.cv(S.pair(a.c, a.o2), S.atom(a.o2), -1)]
      });
    })()
  ]
};

/* ── Birch-Reduktion ──────────────────────────────────────────────── */
/* benzene on the origin as in the scheme; the product 1,4-diene keeps
   C=C at v0–v1 and v3–v4, the new H go to v2 and v5. */
function ring6(S, db, q, rad, h2, h5) {
  const v = [];
  for (let k = 0; k < 6; k++) { const p = polar([0, 0], 30 + 60 * k, 1); v.push(S.at(p[0], p[1], 'C', (q || {})[k])); }
  for (let k = 0; k < 6; k++) { const j = (k + 1) % 6; S.b(v[k], v[j], db.some(d => (d[0] === k && d[1] === j)) ? 2 : 1); }
  if (rad != null) S.radical(v[rad]);
  const k = { v };
  if (h2) k.h2 = S.to(v[2], 150, 'H', { len: 0.85 });
  if (h5) k.h5 = S.to(v[5], -30, 'H', { len: 0.85 });
  return k;
}
function etoh(S, x, y, deg) { const h = S.at(x, y, 'H'), o = S.to(h, deg, 'O'); S.to(o, deg + 60, null, { label: deg > 90 && deg < 270 ? 'Et' : 'Et' }); return { h, o }; }
M['birch-reduktion'] = {
  title: 'Elektron, Proton, Elektron, Proton',
  steps: [
    (() => {
      const S = scene();
      const na = S.frag(() => { const n = S.L(0, 0, 'Na'); S.radical(n); return { n }; });
      const a = S.frag(() => ring6(S, [[0, 1], [2, 3], [4, 5]]));
      const p = S.frag(() => ring6(S, [[0, 1], [3, 4]], { 2: -1 }, 5));
      return S.step({
        caption: '1. Natrium löst sich in flüssigem NH₃ unter Bildung solvatisierter Elektronen (tiefblau). Ein Elektron geht in das π*-System des Aromaten: Radikal-Anion.',
        row: [na, '+', a, '→', p, '+', lab(S, 'Na', 1)], y: 0,
        curly: [S.one(S.atom(na.n), S.pair(a.v[2], a.v[3]), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = ring6(S, [[0, 1], [3, 4]], { 2: -1 }, 5); Object.assign(k, etoh(S, -1.9, 0.9, 180)); return k; });
      const p = S.frag(() => ring6(S, [[0, 1], [3, 4]], null, 5, true));
      return S.step({
        caption: '2. Das stark basische Carbanion wird vom zugesetzten Alkohol protoniert (NH₃ allein ist zu schwach sauer): Cyclohexadienyl-Radikal.',
        row: [a, '→', p, '+', lab(S, 'EtO', -1)], y: 0,
        curly: [S.cv(S.atom(a.v[2]), S.atom(a.h), 1), S.cv(S.pair(a.h, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const na = S.frag(() => { const n = S.L(0, 0, 'Na'); S.radical(n); return { n }; });
      const a = S.frag(() => ring6(S, [[0, 1], [3, 4]], null, 5, true));
      const p = S.frag(() => ring6(S, [[0, 1], [3, 4]], { 5: -1 }, null, true));
      return S.step({
        caption: '3. Ein zweites Elektron: Cyclohexadienyl-Anion. Die Ladung ist über drei C verteilt, am größten in der Mitte (gegenüber dem schon reduzierten C).',
        row: [na, '+', a, '→', p, '+', lab(S, 'Na', 1)], y: 0,
        curly: [S.one(S.atom(na.n), S.atom(a.v[5]), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = ring6(S, [[0, 1], [3, 4]], { 5: -1 }, null, true); Object.assign(k, etoh(S, 1.6, -1.55, 0)); return k; });
      const p = S.frag(() => ring6(S, [[0, 1], [3, 4]], null, null, true, true));
      return S.step({
        caption: '4. Protonierung genau dort: 1,4-Cyclohexadien — das nicht konjugierte, kinetische Produkt. Elektronenschiebende Substituenten landen dabei an einer Doppelbindung, elektronenziehende an einem sp³-C.',
        row: [a, '→', p, '+', lab(S, 'EtO', -1)], y: 0,
        curly: [S.cv(S.atom(a.v[5]), S.atom(a.h), -1), S.cv(S.pair(a.h, a.o), S.atom(a.o), -1)]
      });
    })()
  ]
};

module.exports = M;
