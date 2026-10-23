/* Mechanisms — Carbonsäuren & Derivate (frames as in lib-rx-06-carbonsaeure.js):
   acyl C at (DX,DY), C=O UP, R₁ lower left at (0,0), the group that is
   exchanged lower right at (2DX,0). In the tetrahedral intermediates the
   nucleophile sits at 30° (upper right), the leaving group at −30°; after
   the C=O has re-formed, the new group swings down to the scheme's place. */
const { scene, polar, DX, DY } = require('./lib-mech.js');

const M = {};
const lab = (S, label, q) => S.frag(() => ({ i: S.L(0, 0, label, q) }));
const H = (S, i, deg) => S.to(i, deg, 'H', { len: 0.85 });

/* the acyl frame. o: { top: 'O'|null, tq, tSingle, y: sym/label at −30°, yq,
   nu: sym/label at 30°, nuq } */
function acyl(S, o) {
  o = o || {};
  const r = S.L(0, 0, o.r1 || 'R₁'), c = S.at(DX, DY); S.b(r, c);
  const k = { r, c };
  if (o.top !== null) { k.o = S.at(DX, DY + 1, 'O', o.tq); S.b(c, k.o, o.tSingle ? 1 : 2); }
  if (o.y) { k.y = S.any(...polar([DX, DY], -30, 1), o.y, o.yq); S.b(c, k.y); }
  if (o.nu) { k.nu = S.any(...polar([DX, DY], 30, 1), o.nu, o.nuq); S.b(c, k.nu); }
  return k;
}
/* an H–A acid with its H at (x,y) and A in direction deg */
function ha(S, x, y, deg, label) { const h = S.at(x, y, 'H'), a = S.to(h, deg, null, { label: label || 'A' }); return { h, a }; }

/* ── Fischer-Veresterung ──────────────────────────────────────────── */
M['fischer-veresterung'] = {
  title: 'Säurekatalysierte Addition–Eliminierung (alle Schritte umkehrbar)',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = acyl(S, { y: 'O' }); H(S, k.y, 270); Object.assign(k, ha(S, DX - 1.2, DY + 1.3, 180)); return k; });
      const p = S.frag(() => { const k = acyl(S, { y: 'O', tq: 1 }); H(S, k.y, 270); H(S, k.o, 150); return k; });
      return S.step({
        caption: '1. Die Säure (H₂SO₄, TsOH) protoniert den Carbonyl-Sauerstoff — das Carbonyl-C wird elektrophil genug für den schwachen Nucleophil-Alkohol.',
        row: [a, '→', p, '+', lab(S, 'A', -1)], y: DY,
        curly: [S.cv(S.atom(a.o), S.atom(a.h), -1), S.cv(S.pair(a.h, a.a), S.atom(a.a), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = acyl(S, { y: 'O', tq: 1 }); H(S, k.y, 270); H(S, k.o, 150);
        k.n = S.at(...polar([DX, DY], 30, 1.55), 'O'); H(S, k.n, 90); S.to(k.n, -30, null, { label: 'R₂' }); return k;
      });
      const p = S.frag(() => {
        const k = acyl(S, { y: 'O', tSingle: true, nu: 'O', nuq: 1 }); H(S, k.y, 270); H(S, k.o, 150); H(S, k.nu, 90); S.to(k.nu, 0, null, { label: 'R₂' }); return k;
      });
      return S.step({
        caption: '2. Der Alkohol greift an: tetraedrische Zwischenstufe.',
        row: [a, '→', p], y: DY,
        curly: [S.cv(S.atom(a.n), S.atom(a.c), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = acyl(S, { y: 'O', tSingle: true, nu: 'O', nuq: 1 }); H(S, k.y, 270); H(S, k.o, 150); H(S, k.nu, 90); S.to(k.nu, 0, null, { label: 'R₂' }); return k;
      });
      const p = S.frag(() => {
        const k = acyl(S, { y: 'O', yq: 1, tSingle: true, nu: 'O' }); H(S, k.y, 270); H(S, k.y, 0); H(S, k.o, 150); S.to(k.nu, 0, null, { label: 'R₂' }); return k;
      });
      return S.step({
        caption: '3. Protonenübertrag (über das Lösungsmittel): Das Proton wandert vom neuen O auf eine der OH-Gruppen — die wird damit zur guten Abgangsgruppe H₂O.',
        row: [a, { arrow: '⇌', above: 'H⁺-Transfer' }, p], y: DY
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = acyl(S, { y: 'O', yq: 1, tSingle: true, nu: 'O' }); H(S, k.y, 270); H(S, k.y, 0); H(S, k.o, 150); S.to(k.nu, 0, null, { label: 'R₂' }); return k;
      });
      const p = S.frag(() => { const k = acyl(S, { tq: 1, nu: 'O' }); H(S, k.o, 150); S.to(k.nu, 0, null, { label: 'R₂' }); return k; });
      return S.step({
        caption: '4. Das O-Elektronenpaar bildet die C=O-Bindung zurück und stößt Wasser aus.',
        row: [a, '→', p, '+', lab(S, 'H₂O')], y: DY,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), 1), S.cv(S.pair(a.c, a.y), S.atom(a.y), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = acyl(S, { tq: 1, nu: 'O' }); k.h = H(S, k.o, 150); S.to(k.nu, 0, null, { label: 'R₂' }); k.b = S.L(...polar(S.xy(k.h), 180, 1.1), 'A', -1); return k; });
      const p = S.frag(() => { const k = acyl(S, { y: 'O' }); S.b(k.y, S.L(3 * DX, DY, 'R₂')); return k; });
      return S.step({
        caption: '5. Abgabe des Protons: Ester, der Katalysator ist zurück. Alle Schritte sind Gleichgewichte (K ≈ 4) — man nimmt den Alkohol im Überschuss und entfernt Wasser. Isotopenmarkierung zeigt: Das O der Estergruppe stammt aus dem Alkohol, das abgespaltene Wasser aus der Säure.',
        row: [a, '→', p, '+', lab(S, 'H–A')], y: DY,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), -1), S.cv(S.pair(a.o, a.h), S.atom(a.o), -1)]
      });
    })()
  ]
};

/* ── Esterhydrolyse (basisch) ─────────────────────────────────────── */
M['esterhydrolyse'] = {
  title: 'Verseifung: Addition–Eliminierung, dann Säure-Base-Reaktion',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = acyl(S, { y: 'O' }); S.b(k.y, S.L(3 * DX, DY, 'R₂')); k.n = S.L(...polar([DX, DY], 30, 1.6), 'OH', -1); return k; });
      const p = S.frag(() => { const k = acyl(S, { tq: -1, tSingle: true, y: 'O', nu: 'OH' }); S.b(k.y, S.L(...polar(S.xy(k.y), 270, 1), 'R₂')); return k; });
      return S.step({
        caption: '1. Hydroxid greift das Carbonyl-C an: tetraedrisches Alkoxid.',
        row: [a, '→', p], y: DY,
        curly: [S.cv(S.atom(a.n), S.atom(a.c), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = acyl(S, { tq: -1, tSingle: true, y: 'O', nu: 'OH' }); S.b(k.y, S.L(...polar(S.xy(k.y), 270, 1), 'R₂')); return k; });
      const p = S.frag(() => acyl(S, { nu: 'OH' }));
      return S.step({
        caption: '2. Die C=O-Bindung bildet sich zurück, das Alkoholat R₂O⁻ wird ausgestoßen.',
        row: [a, '→', p, '+', lab(S, 'R₂O', -1)], y: DY,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), 1), S.cv(S.pair(a.c, a.y), S.atom(a.y), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = acyl(S, { nu: 'O' }); k.h = H(S, k.nu, 30); k.b = S.L(...polar(S.xy(k.h), 30, 1.15), 'OR₂', -1); return k;
      });
      const p = S.frag(() => acyl(S, { nu: 'O', nuq: -1 }));
      return S.step({
        caption: '3. Sofortige, irreversible Säure-Base-Reaktion: Das Alkoholat deprotoniert die Carbonsäure. Das Carboxylat ist mesomeriestabilisiert und wird von Nucleophilen nicht mehr angegriffen — deshalb läuft die Verseifung (anders als die saure Hydrolyse) vollständig ab. Erst Ansäuern (H₃O⁺) liefert die freie Carbonsäure.',
        row: [a, '→', p, '+', lab(S, 'R₂OH')], y: DY,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.nu, a.h), S.atom(a.nu), 1)]
      });
    })()
  ]
};

/* ── Säurechlorid (SOCl₂) ─────────────────────────────────────────── */
/* the OH of the acid at −30° attacks S; the chlorosulfite then hangs there */
function acylClSulfite(S, o) {
  o = o || {};
  const k = acyl(S, { y: 'O', yq: o.h ? 1 : 0, tq: o.tq, tSingle: o.tSingle, nu: o.nu, nuq: o.nuq });
  if (o.h) H(S, k.y, 270);
  k.s = S.to(k.y, 30, 'S'); S.to(k.s, 90, 'O', { order: 2 }); k.cl = S.to(k.s, -30, 'Cl');
  return k;
}
M['saeurechlorid'] = {
  title: 'Über das Acylchlorsulfit',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = acyl(S, { y: 'O' }); H(S, k.y, 270);
        k.s = S.at(...polar(S.xy(k.y), 30, 1.45), 'S'); S.to(k.s, 90, 'O', { order: 2 }); S.to(k.s, -30, 'Cl'); k.cl = S.to(k.s, 30, 'Cl'); return k;
      });
      const p = S.frag(() => acylClSulfite(S, { h: true }));
      return S.step({
        caption: '1. Die OH-Gruppe der Säure greift das S-Atom von SOCl₂ an, Chlorid wird verdrängt. Nach Abgabe des Protons liegt das Acylchlorsulfit vor — aus OH ist eine sehr gute Abgangsgruppe geworden.',
        row: [a, '→', p, '+', lab(S, 'Cl', -1)], y: DY,
        curly: [S.cv(S.atom(a.y), S.atom(a.s), -1), S.cv(S.pair(a.s, a.cl), S.atom(a.cl), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = acylClSulfite(S); k.n = S.L(...polar([DX, DY], 150, 1.55), 'Cl', -1); return k; });
      const p = S.frag(() => {
        const k = acyl(S, { tq: -1, tSingle: true, y: 'O' }); k.s = S.to(k.y, 30, 'S'); S.to(k.s, 90, 'O', { order: 2 }); k.cl = S.to(k.s, -30, 'Cl');
        S.b(k.c, S.L(...polar([DX, DY], 150, 1), 'Cl')); return k;
      });
      return S.step({
        caption: '2. Chlorid greift das Carbonyl-C an: tetraedrische Zwischenstufe.',
        row: [a, '→', p], y: DY,
        curly: [S.cv(S.atom(a.n), S.atom(a.c), -1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = acyl(S, { tq: -1, tSingle: true, y: 'O' }); k.s = S.to(k.y, 30, 'S'); S.to(k.s, 90, 'O', { order: 2 }); k.cl = S.to(k.s, -30, 'Cl');
        S.b(k.c, S.L(...polar([DX, DY], 150, 1), 'Cl')); return k;
      });
      const p = S.frag(() => acyl(S, { y: 'Cl' }));
      return S.step({
        caption: '3. Die C=O-Bindung bildet sich zurück; der Chlorsulfit-Rest zerfällt in SO₂ und Cl⁻ (zwei Gase/Ionen — die Reaktion läuft vollständig). Mit Oxalylchlorid (COCl)₂/DMF analog über ein Vilsmeier-Reagenz.',
        row: [a, '→', p, '+', lab(S, 'SO₂'), '+', lab(S, 'Cl', -1)], y: DY,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), 1), S.cv(S.pair(a.c, a.y), S.pair(a.y, a.s), -1), S.cv(S.pair(a.s, a.cl), S.atom(a.cl), 1)]
      });
    })()
  ]
};

/* ── Amid aus Säurechlorid ────────────────────────────────────────── */
function amine(S, n) { S.to(n, 30, null, { label: 'R₂' }); return n; }
M['amidbildung'] = {
  title: 'Addition–Eliminierung am Säurechlorid',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = acyl(S, { y: 'Cl' }); k.n = S.at(...polar([DX, DY], 30, 1.55), 'N'); amine(S, k.n); H(S, k.n, 90); H(S, k.n, -30); return k;
      });
      const p = S.frag(() => {
        const k = acyl(S, { tq: -1, tSingle: true, y: 'Cl', nu: 'N', nuq: 1 }); amine(S, k.nu); H(S, k.nu, 90); k.h = H(S, k.nu, -30); return k;
      });
      return S.step({
        caption: '1. Das Amin greift das sehr elektrophile Carbonyl-C des Säurechlorids an.',
        row: [a, '→', p], y: DY,
        curly: [S.cv(S.atom(a.n), S.atom(a.c), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = acyl(S, { tq: -1, tSingle: true, y: 'Cl', nu: 'N', nuq: 1 }); amine(S, k.nu); H(S, k.nu, 90); H(S, k.nu, -30); return k;
      });
      const p = S.frag(() => { const k = acyl(S, { nu: 'N', nuq: 1 }); amine(S, k.nu); H(S, k.nu, 90); k.h = H(S, k.nu, -30); return k; });
      return S.step({
        caption: '2. Die C=O-Bindung bildet sich zurück, Chlorid — eine sehr gute Abgangsgruppe — wird ausgestoßen.',
        row: [a, '→', p, '+', lab(S, 'Cl', -1)], y: DY,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), 1), S.cv(S.pair(a.c, a.y), S.atom(a.y), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = acyl(S, { nu: 'N', nuq: 1 }); amine(S, k.nu); H(S, k.nu, 90); k.h = H(S, k.nu, -30);
        k.b = S.L(...polar(S.xy(k.h), -30, 1.15), 'B'); return k;
      });
      const p = S.frag(() => { const k = acyl(S, { y: 'N' }); S.b(k.y, S.L(3 * DX, DY, 'R₂')); return k; });
      return S.step({
        caption: '3. Die Base (NaOH im Zweiphasensystem, oder NEt₃) fängt das Proton bzw. das HCl ab. Ohne sie würde das HCl die Hälfte des Amins als Ammoniumsalz blockieren.',
        row: [a, '→', p, '+', lab(S, 'H–B', 1)], y: DY,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.nu, a.h), S.atom(a.nu), -1)]
      });
    })()
  ]
};

/* ── Peptidkupplung (DCC) ─────────────────────────────────────────── */
/* O-acylisourea: acyl–O (−30°) – C(=N–Cy)(–NH–Cy) */
function isourea(S, k, o) {
  o = o || {};
  const ci = S.to(k.y, 30, 'C');
  const n1 = S.to(ci, 90, 'N', { order: o.n1db === false ? 1 : 2 }); S.to(n1, 150, null, { label: 'Cy' });
  const n2 = S.to(ci, -30, 'N'); S.to(n2, 30, null, { label: 'Cy' }); H(S, n2, 270);
  return Object.assign(k, { ci, n1, n2 });
}
M['peptidkupplung-dcc'] = {
  title: 'DCC aktiviert die Carboxygruppe als O-Acylisoharnstoff',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = acyl(S, { y: 'O' }); k.h = H(S, k.y, 30);
        const n = S.at(...polar(S.xy(k.h), 30, 1.1), 'N'); S.to(n, 120, null, { label: 'Cy' });
        const c = S.to(n, -30, null, { order: 2, label: 'C', len: 1 }); const n2 = S.to(c, -30, 'N', { order: 2 }); S.to(n2, 30, null, { label: 'Cy' });
        return Object.assign(k, { n, c2: c });
      });
      const p = S.frag(() => acyl(S, { y: 'O', yq: -1 }));
      const dcch = S.frag(() => {
        const n = S.at(0, 0, 'N', 1); S.to(n, 120, null, { label: 'Cy' }); H(S, n, 210);
        const c = S.to(n, -30, null, { order: 2, label: 'C', len: 1 }); const n2 = S.to(c, -30, 'N', { order: 2 }); S.to(n2, 30, null, { label: 'Cy' }); return {};
      });
      return S.step({
        caption: '1. Dicyclohexylcarbodiimid (DCC, Cy–N=C=N–Cy) wird von der Carbonsäure am N protoniert.',
        row: [a, '→', p, '+', dcch], y: 0,
        curly: [S.cv(S.atom(a.n), S.atom(a.h), 1), S.cv(S.pair(a.y, a.h), S.atom(a.y), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = acyl(S, { y: 'O', yq: -1 });
        k.ci = S.L(...polar(S.xy(k.y), 30, 1.45), 'C'); const n1 = S.to(k.ci, 90, 'N', { order: 2, charge: 1 }); S.to(n1, 150, null, { label: 'Cy' }); H(S, n1, 30);
        k.n2 = S.to(k.ci, -30, 'N', { order: 2 }); S.to(k.n2, 30, null, { label: 'Cy' });
        return k;
      });
      const p = S.frag(() => isourea(S, acyl(S, { y: 'O' })));
      return S.step({
        caption: '2. Das Carboxylat greift das zentrale C des protonierten Carbodiimids an: O-Acylisoharnstoff — ein „Aktivester“ mit sehr guter Abgangsgruppe.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.atom(a.y), S.atom(a.ci), 1), S.cv(S.pair(a.ci, a.n2), S.atom(a.n2), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = isourea(S, acyl(S, { y: 'O' }));
        k.n = S.at(...polar([DX, DY], 150, 1.55), 'N'); S.to(k.n, 150, null, { label: 'R₂' }); H(S, k.n, 90); H(S, k.n, 210); return k;
      });
      const p = S.frag(() => {
        const k = isourea(S, acyl(S, { tq: -1, tSingle: true, y: 'O' }));
        const n = S.to(k.c, 150, 'N', { charge: 1 }); S.to(n, 150, null, { label: 'R₂' }); H(S, n, 90); H(S, n, 210); return k;
      });
      return S.step({
        caption: '3. Das Amin (die Aminokomponente des Peptids) greift das aktivierte Carbonyl-C an.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.atom(a.n), S.atom(a.c), -1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = isourea(S, acyl(S, { tq: -1, tSingle: true, y: 'O' }));
        const n = S.to(k.c, 150, 'N', { charge: 1 }); S.to(n, 150, null, { label: 'R₂' }); H(S, n, 90); H(S, n, 210); return k;
      });
      const p = S.frag(() => { const k = acyl(S, { y: 'N' }); H(S, k.y, 270); S.b(k.y, S.L(3 * DX, DY, 'R₂')); return k; });
      const dcu = lab(S, 'DCU');
      return S.step({
        caption: '4. Die tetraedrische Zwischenstufe zerfällt: Amid (Peptidbindung) und Dicyclohexylharnstoff (DCU), der als schwerlöslicher Feststoff ausfällt. HOBt fängt den O-Acylisoharnstoff zuvor als Aktivester ab und verhindert so Racemisierung und die Umlagerung zum N-Acylharnstoff.',
        row: [a, { arrow: '→', below: 'H⁺-Transfer' }, p, '+', dcu], y: 0,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), 1), S.cv(S.pair(a.c, a.y), S.atom(a.y), -1)]
      });
    })()
  ]
};

/* ── Boc-Schutz ───────────────────────────────────────────────────── */
/* product frame: R₁ (0,0) – N (DX,DY) – C (2DX,0) (=O DOWN) – O (3DX,DY) – tBu */
function carb(S, o) {
  o = o || {};
  const r = S.L(0, 0, 'R₁'), n = S.at(DX, DY, 'N', o.nq), c = S.at(2 * DX, 0);
  S.b(r, n).b(n, c);
  const k = { n, c };
  k.o = S.at(2 * DX, -1, 'O', o.oq); S.b(c, k.o, o.oq ? 1 : 2);
  const ot = S.at(3 * DX, DY, 'O'); S.b(c, ot); S.b(ot, S.L(4 * DX, 0, 'tBu'));
  if (o.lg) { k.lg = S.at(...polar([2 * DX, 0], -30, 1), 'O'); S.b(c, k.lg); S.b(k.lg, S.L(...polar(S.xy(k.lg), -30, 1), 'Boc')); }
  if (o.nh !== undefined) for (let i = 0; i < o.nh; i++) k['h' + i] = H(S, n, [90, 150][i]);
  return k;
}
M['boc-schutz'] = {
  title: 'Acylierung des Amins mit Boc₂O',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), n = S.at(DX, DY, 'N'); S.b(r, n); H(S, n, 90); H(S, n, 150);
        const c = S.at(2 * DX + 0.4, -0.3); const o = S.at(2 * DX + 0.4, -1.3, 'O'); S.b(c, o, 2);
        const ot = S.at(3 * DX + 0.4, DY - 0.3, 'O'); S.b(c, ot); S.b(ot, S.L(4 * DX + 0.4, -0.3, 'tBu'));
        const lg = S.at(...polar([2 * DX + 0.4, -0.3], -30, 1), 'O'); S.b(c, lg); S.b(lg, S.L(...polar(S.xy(lg), -30, 1), 'Boc'));
        return { n, c, o };
      });
      const p = S.frag(() => carb(S, { nq: 1, oq: -1, lg: true, nh: 2 }));
      return S.step({
        caption: '1. Das Amin greift eine Carbonylgruppe von Di-tert-butyldicarbonat (Boc₂O = Boc–O–Boc) an.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.atom(a.n), S.atom(a.c), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => carb(S, { nq: 1, oq: -1, lg: true, nh: 2 }));
      const p = S.frag(() => carb(S, { nq: 1, nh: 2 }));
      return S.step({
        caption: '2. Die C=O-Bindung bildet sich zurück, tert-Butylcarbonat wird ausgestoßen. Es zerfällt in CO₂ und tert-Butanolat — das entweichende CO₂ macht den Schritt irreversibel.',
        row: [a, '→', p, '+', lab(S, 'CO₂'), '+', lab(S, 'tBuO', -1)], y: 0,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), 1), S.cv(S.pair(a.c, a.lg), S.atom(a.lg), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = carb(S, { nq: 1, nh: 2 }); k.b = S.L(...polar(S.xy(k.h0), 90, 1.15), 'NEt₃'); return k; });
      const p = S.frag(() => carb(S, { nh: 1 }));
      return S.step({
        caption: '3. NEt₃ (oder das tBuO⁻) nimmt das Proton ab: Boc-geschütztes Amin (ein Carbamat). Es ist gegen Basen und Nucleophile stabil. Abspaltung mit TFA: Protonierung, dann geht das stabile tert-Butyl-Kation (→ Isobuten), die Carbaminsäure decarboxyliert zum freien Amin.',
        row: [a, '→', p, '+', lab(S, 'HNEt₃', 1)], y: 0,
        curly: [S.cv(S.atom(a.b), S.atom(a.h0), 1), S.cv(S.pair(a.n, a.h0), S.atom(a.n), 1)]
      });
    })()
  ]
};

/* ── Lactonisierung ───────────────────────────────────────────────── */
/* In the orientation of the product γ-lactone (scheme: ring(5), node at
   the bottom): v1 the acyl C (=O radial), v2 the ring O. Open until the
   γ-OH has attacked. */
function lac(S, o) {
  o = o || {};
  const v = [270, 342, 54, 126, 198].map(d => polar([0, 0], d, 0.8507));
  if (o.open) v[2] = polar(v[2], 54, 0.35);
  const a = v.map((p, i) => S.at(p[0], p[1], i === 2 ? 'O' : 'C', i === 2 ? o.o2q : 0));
  S.b(a[0], a[1]).b(a[2], a[3]).b(a[3], a[4]).b(a[4], a[0]);
  if (!o.open) S.b(a[1], a[2]);
  const k = { a };
  if (o.o2h) k.h2 = H(S, a[2], 90);
  // the carbonyl O, radial (342°)
  k.oc = S.at(...polar(v[1], 342, 1), 'O', o.ocq); S.b(a[1], k.oc, o.ocSingle ? 1 : 2);
  if (o.och) k.hc = H(S, k.oc, 30);
  // the second O of the acid, below v1 — it leaves as water
  if (o.oh !== false) { k.oh = S.at(...polar(v[1], 280, 1), 'O', o.ohq); S.b(a[1], k.oh); H(S, k.oh, 230); if (o.ohq) H(S, k.oh, 330); }
  return k;
}
M['lactonbildung'] = {
  title: 'Intramolekulare Fischer-Veresterung',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = lac(S, { open: true, o2h: true }); Object.assign(k, ha(S, ...polar(S.xy(k.oc), 300, 1.15), 300)); return k; });
      const p = S.frag(() => lac(S, { open: true, o2h: true, ocq: 1, och: true }));
      return S.step({
        caption: '1. Die Säure protoniert den Carbonyl-Sauerstoff. (Die Kette ist schon so gezeichnet, wie sie den Ring schließt — γ- und δ-Hydroxysäuren cyclisieren besonders leicht: Fünf- und Sechsringe.)',
        row: [a, '→', p, '+', lab(S, 'A', -1)], y: 0,
        curly: [S.cv(S.atom(a.oc), S.atom(a.h), 1), S.cv(S.pair(a.h, a.a), S.atom(a.a), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => lac(S, { open: true, o2h: true, ocq: 1, och: true }));
      const p = S.frag(() => lac(S, { o2h: true, o2q: 1, ocSingle: true, och: true, tet: true }));
      return S.step({
        caption: '2. Die γ-OH-Gruppe greift das Carbonyl-C an — intramolekular, deshalb schnell: Ringschluss zur tetraedrischen Zwischenstufe.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.atom(a.a[2]), S.atom(a.a[1]), 1), S.cv(S.pair(a.a[1], a.oc), S.atom(a.oc), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => lac(S, { ocSingle: true, och: true, tet: true, ohq: 1 }));
      const p = S.frag(() => lac(S, { ocq: 1, och: true, oh: false }));
      return S.step({
        caption: '3. Nach Protonenübertrag auf die OH-Gruppe geht Wasser ab; das O-Elektronenpaar bildet die C=O-Bindung zurück.',
        row: [a, '→', p, '+', lab(S, 'H₂O')], y: 0,
        curly: [S.cv(S.atom(a.oc), S.pair(a.a[1], a.oc), -1), S.cv(S.pair(a.a[1], a.oh), S.atom(a.oh), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => lac(S, { ocq: 1, och: true, oh: false }));
      const p = S.frag(() => lac(S, { oh: false }));
      return S.step({
        caption: '4. Abgabe des Protons: γ-Butyrolacton. Weil Ringschluss entropisch günstig ist, liegt das Gleichgewicht anders als bei der intermolekularen Veresterung meist weit auf der Seite des Lactons.',
        row: [a, { arrow: '→', above: '−H⁺' }, p], y: 0
      });
    })()
  ]
};

/* ── Decarboxylierung (β-Ketosäure) ───────────────────────────────── */
/* scheme: R₁ (0,0) – Ck (DX,DY) (=O up) – Cα (2DX,0) – C (3DX,DY) – O; the
   acid is turned so that its OH points up — then Ok, Ck, Cα, C, O and H
   form the six-membered ring of the transition state. */
M['decarboxylierung'] = {
  title: 'Cyclischer Sechsring-Übergangszustand',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), ck = S.at(DX, DY), ok = S.at(DX, DY + 1, 'O'), ca = S.at(2 * DX, 0), c = S.at(3 * DX, DY);
        const o1 = S.at(3 * DX, DY + 1, 'O'), o2 = S.at(4 * DX, 0, 'O'), h = S.at(2 * DX, DY + 1.5, 'H');
        S.b(r, ck).b(ck, ok, 2).b(ck, ca).b(ca, c).b(c, o1).b(c, o2, 2).b(o1, h);
        return { ck, ok, ca, c, o1, h };
      });
      const p = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), ck = S.at(DX, DY), ok = S.at(DX, DY + 1, 'O'), ca = S.at(2 * DX, 0);
        S.b(r, ck).b(ck, ok).b(ck, ca, 2); H(S, ok, 30); return {};
      });
      return S.step({
        caption: '1. Beim Erhitzen bildet das Carbonyl-O mit dem H der Säuregruppe einen Sechsring: Das H wandert zum Keton-O, CO₂ wird abgespalten, und es bleibt ein Enol. Nur β-Ketosäuren (und Malonsäuren) decarboxylieren so leicht — der Ring braucht die C=O-Gruppe in β-Stellung.',
        row: [a, { arrow: '→', above: 'Δ' }, p, '+', lab(S, 'CO₂')], y: DY,
        curly: (() => { const w = { away: S.centre([a.ok, a.ck, a.ca, a.c, a.o1, a.h]) };
          return [S.cv(S.atom(a.ok), S.atom(a.h), 0, w), S.cv(S.pair(a.o1, a.h), S.pair(a.c, a.o1), 0, w), S.cv(S.pair(a.ca, a.c), S.pair(a.ck, a.ca), 0, w)]; })()
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), ck = S.at(DX, DY), ok = S.at(DX, DY + 1, 'O'), ca = S.at(2 * DX, 0);
        S.b(r, ck).b(ck, ok).b(ck, ca, 2); H(S, ok, 30); return {};
      });
      const p = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), ck = S.at(DX, DY), ok = S.at(DX, DY + 1, 'O'), ca = S.at(2 * DX, 0);
        S.b(r, ck).b(ck, ok, 2).b(ck, ca); return {};
      });
      return S.step({
        caption: '2. Keto-Enol-Tautomerie: Das Enol lagert sich in das stabilere Keton um.',
        row: [a, { arrow: '→', above: 'Tautomerie' }, p], y: DY
      });
    })()
  ]
};

/* ── Nitrilhydrolyse (sauer) ──────────────────────────────────────── */
/* nitrile R₁ (0,0) – C (DX,DY) ≡ N at 30°; water comes in from above */
function nit(S, o) {
  o = o || {};
  const r = S.L(0, 0, 'R₁'), c = S.at(DX, DY); S.b(r, c);
  const n = S.at(...polar([DX, DY], 30, 1), 'N', o.nq); S.b(c, n, o.order || 3);
  const k = { c, n };
  if (o.nh) for (let i = 0; i < o.nh; i++) H(S, n, [30, -30][i] + (o.order === 1 ? 0 : 0));
  if (o.top) { k.o = S.at(DX, DY + 1, 'O', o.tq); S.b(c, k.o, o.topDouble ? 2 : 1); if (o.th) for (let i = 0; i < o.th; i++) H(S, k.o, [150, 30][i]); }
  return k;
}
M['nitrilhydrolyse'] = {
  title: 'Über das Amid zur Carbonsäure',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = nit(S); Object.assign(k, ha(S, ...polar(S.xy(k.n), 30, 1.15), 30, 'OH₂')); S.charge(k.a, 1); return k; });
      const p = S.frag(() => nit(S, { nq: 1, nh: 1 }));
      return S.step({
        caption: '1. Die Säure protoniert das Nitril-N: Das Nitrilium-Ion ist am C viel elektrophiler.',
        row: [a, '→', p, '+', lab(S, 'H₂O')], y: DY,
        curly: [S.cv(S.atom(a.n), S.atom(a.h), 1), S.cv(S.pair(a.h, a.a), S.atom(a.a), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = nit(S, { nq: 1, nh: 1 }); k.w = S.at(DX, DY + 1.45, 'O'); H(S, k.w, 150); H(S, k.w, 30); return k;
      });
      const p = S.frag(() => nit(S, { order: 2, nh: 1, top: true, tq: 1, th: 2 }));
      return S.step({
        caption: '2. Wasser greift das C-Atom an.',
        row: [a, '→', p], y: DY,
        curly: [S.cv(S.atom(a.w), S.atom(a.c), 1), S.cv(S.pair(a.c, a.n), S.atom(a.n), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => nit(S, { order: 2, nh: 1, top: true, tq: 1, th: 2 }));
      const p = S.frag(() => nit(S, { order: 1, nh: 2, top: true, topDouble: true }));
      return S.step({
        caption: '3. Abgabe eines Protons am O, Protonierung am N: Aus der Imidsäure R–C(OH)=NH wird durch Tautomerie das stabilere Amid.',
        row: [a, { arrow: '⇌', above: 'H⁺-Transfer' }, p], y: DY
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => nit(S, { order: 1, nh: 2, top: true, topDouble: true }));
      const p = S.frag(() => acyl(S, { y: 'O' }));
      return S.step({
        caption: '4. Das Amid wird unter den scharfen Bedingungen (H₃O⁺, Δ) weiter hydrolysiert — Addition von Wasser, Abspaltung von NH₃ (als NH₄⁺), wie bei der Esterhydrolyse. Basisch (OH⁻) entsteht über dieselben Stufen das Carboxylat und NH₃. Mit DIBAL bzw. LiAlH₄ lässt sich das Nitril stattdessen zum Aldehyd bzw. Amin reduzieren.',
        row: [a, { arrow: '→', above: 'H₃O⁺, Δ', below: '−NH₄⁺' }, p], y: DY
      });
    })()
  ]
};

/* ── Acetylierung mit Ac₂O ────────────────────────────────────────── */
/* product frame: R₁ (0,0) – O (DX,DY) – C (2DX,0) (=O DOWN) – CH₃ (3DX,DY) */
function acet(S, o) {
  o = o || {};
  const r = S.L(0, 0, 'R₁'), on = S.at(DX, DY, 'O', o.nq); S.b(r, on);
  const c = S.at(2 * DX, 0); S.b(on, c);
  const k = { on, c };
  k.o = S.at(2 * DX, -1, 'O', o.oq); S.b(c, k.o, o.oq ? 1 : 2);
  S.b(c, S.at(3 * DX, DY));
  if (o.lg) { k.lg = S.at(...polar([2 * DX, 0], -30, 1), 'O'); S.b(c, k.lg); S.b(k.lg, S.L(...polar(S.xy(k.lg), -30, 1), 'Ac')); }
  if (o.nh) k.h = H(S, on, 90);
  return k;
}
M['anhydrid-acylierung'] = {
  title: 'Nucleophile Acylsubstitution — Acetat als Abgangsgruppe',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), on = S.at(DX, DY, 'O'); S.b(r, on); H(S, on, 90);
        const c = S.at(2 * DX + 0.4, -0.3), o = S.at(2 * DX + 0.4, -1.3, 'O'); S.b(c, o, 2); S.b(c, S.at(3 * DX + 0.4, DY - 0.3));
        const lg = S.at(...polar([2 * DX + 0.4, -0.3], -30, 1), 'O'); S.b(c, lg); S.b(lg, S.L(...polar(S.xy(lg), -30, 1), 'Ac'));
        return { on, c, o };
      });
      const p = S.frag(() => acet(S, { nq: 1, oq: -1, lg: true, nh: true }));
      return S.step({
        caption: '1. Der Alkohol (bzw. das Amin) greift eine Carbonylgruppe des Anhydrids an. Mit DMAP läuft es viel schneller: DMAP greift zuerst an und bildet ein Acylpyridinium-Ion, das noch reaktiver ist als das Anhydrid (nucleophile Katalyse).',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.atom(a.on), S.atom(a.c), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => acet(S, { nq: 1, oq: -1, lg: true, nh: true }));
      const p = S.frag(() => acet(S, { nq: 1, nh: true }));
      return S.step({
        caption: '2. Die C=O-Bindung bildet sich zurück, Acetat (mesomeriestabilisiert, gute Abgangsgruppe) wird ausgestoßen.',
        row: [a, '→', p, '+', lab(S, 'AcO', -1)], y: 0,
        curly: [S.cv(S.atom(a.o), S.pair(a.c, a.o), 1), S.cv(S.pair(a.c, a.lg), S.atom(a.lg), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = acet(S, { nq: 1, nh: true }); k.b = S.L(...polar(S.xy(k.h), 90, 1.15), 'Py'); return k; });
      const p = S.frag(() => acet(S));
      return S.step({
        caption: '3. Pyridin nimmt das Proton ab (und neutralisiert die entstehende Essigsäure): Acetat-Ester bzw. Acetamid.',
        row: [a, '→', p, '+', lab(S, 'PyH', 1)], y: 0,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.on, a.h), S.atom(a.on), 1)]
      });
    })()
  ]
};

module.exports = M;
