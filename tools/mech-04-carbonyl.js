/* Mechanisms — Carbonyl-Additionen (frames as in lib-rx-04-carbonyl.js):
   R₁ (0,0) – C (DX,DY) – R₂ (2DX,0), the C=O straight up at (DX,DY+1).
   The nucleophile comes in where the scheme's product has it. */
const { scene, polar, DX, DY } = require('./lib-mech.js');

const M = {};
const lab = (S, label, q) => S.frag(() => ({ i: S.L(0, 0, label, q) }));

/* the carbonyl frame. o: { r2 (label|null), top (sym/label|null), tq,
   single (C–top single), cq } */
function K(S, o) {
  o = o || {};
  const r1 = S.L(0, 0, o.r1 || 'R₁'), c = S.at(DX, DY, 'C', o.cq);
  S.b(r1, c);
  const k = { r1, c };
  if (o.r2 !== null) { k.r2 = S.L(2 * DX, 0, o.r2 || 'R₂'); S.b(c, k.r2); }
  if (o.top !== null) { k.o = S.any(DX, DY + 1, o.top || 'O', o.tq); S.b(c, k.o, o.single ? 1 : 2); }
  return k;
}
const H = (S, i, deg) => S.to(i, deg, 'H', { len: 0.85 });
/* H₃O⁺ with its reacting H at (x,y); the O lies `deg` further on */
function h3o(S, x, y, deg) {
  const h = S.at(x, y, 'H'), ho = S.to(h, deg, 'O', { charge: 1 });
  H(S, ho, deg + 60); H(S, ho, deg - 60);
  return { h, ho };
}
/* the two arrows of a protonation by H₃O⁺: O → H, H–O⁺ → O⁺ */
const prot = (S, a, side) => [S.cv(S.atom(a.o), S.atom(a.h), side || 1), S.cv(S.pair(a.h, a.ho), S.atom(a.ho), side || 1)];
function water(S, x, y, away) {                 // H₂O, both H pointing towards `away`
  const o = S.at(x, y, 'O'); H(S, o, away + 50); H(S, o, away - 50); return o;
}
/* a generic two-step "attack, then protonate": used by several entries */
function attackThenProtonate(o) {
  return [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = K(S); k.nu = o.nucleophile(S, k); return k; });
      const p = S.frag(() => { const k = K(S, { top: 'O', tq: -1, single: true }); o.added(S, k); return k; });
      return S.step({
        caption: o.cap1,
        row: [a, '→', p].concat(o.after1 ? ['+', o.after1(S)] : []), y: DY,
        curly: [o.attackArrow(S, a), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)].concat(o.moreArrows ? o.moreArrows(S, a) : [])
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = K(S, { top: 'O', tq: -1, single: true }); o.added(S, k);
        const po = polar(S.xy(k.o), o.hDeg, 1.25);
        k.h = S.at(po[0], po[1], 'H');
        if (o.acid) { k.ha = S.to(k.h, o.hDeg, null, { label: o.acid.label }); }
        else { k.ha = S.to(k.h, o.hDeg, 'O', { charge: 1 }); H(S, k.ha, o.hDeg + 60); H(S, k.ha, o.hDeg - 60); }
        return k;
      });
      const p = S.frag(() => { const k = K(S, { top: 'O', single: true }); o.added(S, k); return k; });
      return S.step({
        caption: o.cap2,
        row: [a, '→', p, '+', o.acid ? o.acid.after(S) : lab(S, 'H₂O')], y: DY,
        curly: [S.cv(S.atom(a.o), S.atom(a.h), o.hSide || 1), S.cv(S.pair(a.h, a.ha), S.atom(a.ha), o.hSide || 1)]
      });
    })()
  ];
}

/* ── A_N allgemein ────────────────────────────────────────────────── */
M['nucleophile-addition-carbonyl'] = {
  title: 'Angriff am Carbonyl-C, dann Protonierung',
  steps: attackThenProtonate({
    nucleophile: (S, k) => S.L(...polar(S.xy(k.c), 150, 1.55), 'Nu', -1),
    attackArrow: (S, a) => S.cv(S.atom(a.nu), S.atom(a.c), -1),
    added: (S, k) => S.to(k.c, 150, null, { label: 'Nu' }),
    hDeg: 30,
    cap1: '1. Das Nucleophil greift das positivierte Carbonyl-C an (Bürgi-Dunitz-Winkel ≈ 107°, also schräg von oben), die π-Elektronen klappen auf den Sauerstoff. Aus dem planaren sp²-C wird ein tetraedrisches Alkoxid.',
    cap2: '2. Bei der wässrigen Aufarbeitung wird das Alkoxid protoniert. Aldehyde reagieren schneller als Ketone (weniger Sterik, weniger Elektronenschub). Bei schwachen Nucleophilen (H₂O, ROH) aktiviert man umgekehrt erst die C=O-Gruppe durch Protonierung.'
  })
};

/* ── Grignard ─────────────────────────────────────────────────────── */
M['grignard-addition'] = {
  title: 'Das polarisierte R–Mg als Carbanion-Äquivalent',
  steps: attackThenProtonate({
    nucleophile: (S, k) => {
      const r3 = S.L(DX + 1.55, DY + 0.25, 'R₃'); const mg = S.to(r3, 60, 'Mg'); S.to(mg, 0, 'X');
      k.mg = mg; return r3;
    },
    attackArrow: (S, a) => S.cv(S.pair(a.nu, a.mg), S.atom(a.c), -1),
    added: (S, k) => S.to(k.c, 0, null, { label: 'R₃' }),
    after1: S => lab(S, 'MgX', 1),
    moreArrows: () => [],
    hDeg: 150, hSide: -1,
    cap1: '1. Die C–Mg-Bindung ist stark polar (δ⁻ am C): Das C-Atom von R₃ greift wie ein Carbanion das Carbonyl-C an, Mg²⁺ koordiniert dabei den Carbonyl-O (Lewis-Säure). Es entsteht ein Magnesium-Alkoholat. Alles strikt wasserfrei — Wasser würde R₃–MgX sofort zu R₃–H protonieren.',
    cap2: '2. Saure Aufarbeitung (H₃O⁺) protoniert das Alkoholat. Formaldehyd → primärer, Aldehyd → sekundärer, Keton → tertiärer Alkohol.'
  })
};

/* ── Grignard + CO₂ ───────────────────────────────────────────────── */
M['grignard-co2'] = {
  title: 'Addition an CO₂ zum Carboxylat',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), mg = S.at(-1.0, -0.6, 'Mg'); S.b(r, mg); S.to(mg, 180, 'X');
        const o1 = S.at(DX + 0.35, DY + 1.25, 'O'), c = S.at(DX + 0.35, DY + 0.25), o2 = S.at(DX + 0.35, DY - 0.75, 'O');
        S.b(o1, c, 2).b(c, o2, 2); return { r, mg, c, o2 };
      });
      const p = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), c = S.at(DX, DY); S.b(r, c);
        S.b(c, S.at(DX, DY + 1, 'O'), 2); S.b(c, S.at(2 * DX, 0, 'O', -1)); return {};
      });
      return S.step({
        caption: '1. Das nucleophile C von R–MgX greift das C-Atom von CO₂ an (Trockeneis, im Überschuss); eine C=O-Bindung klappt auf. Es entsteht das Magnesiumcarboxylat — die Kette ist um ein C-Atom länger.',
        row: [a, '→', p, '+', lab(S, 'MgX', 1)], y: DY,
        curly: [S.cv(S.pair(a.r, a.mg), S.atom(a.c), -1), S.cv(S.pair(a.c, a.o2), S.atom(a.o2), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), c = S.at(DX, DY); S.b(r, c);
        S.b(c, S.at(DX, DY + 1, 'O'), 2); const o = S.at(2 * DX, 0, 'O', -1); S.b(c, o);
        return Object.assign({ o }, h3o(S, 2 * DX + 1.1, -0.45, -20));
      });
      const p = S.frag(() => {
        const r = S.L(0, 0, 'R₁'), c = S.at(DX, DY); S.b(r, c);
        S.b(c, S.at(DX, DY + 1, 'O'), 2); S.b(c, S.L(2 * DX, 0, 'OH')); return {};
      });
      return S.step({
        caption: '2. Die saure Aufarbeitung protoniert das Carboxylat: Carbonsäure. Ein zweiter Angriff des Grignard-Reagens findet nicht statt — das Carboxylat ist kein Elektrophil mehr.',
        row: [a, '→', p, '+', lab(S, 'H₂O')], y: DY,
        curly: prot(S, a, -1)
      });
    })()
  ]
};

/* ── Acetylid-Addition ────────────────────────────────────────────── */
/* product of the scheme: OH at 150°, the alkyne leaving at 30° */
function alkynyl(S, from, q) {
  const c1 = S.to(from, 30, 'C', { charge: q }); const c2 = S.to(c1, 30, 'C', { order: 3 }); S.to(c2, 30, null, { label: 'R₃' });
  return c1;
}
M['acetylid-addition'] = {
  title: 'Das Acetylid als C-Nucleophil',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = K(S); const p = polar(S.xy(k.c), 30, 1.55);
        k.nu = S.at(p[0], p[1], 'C', -1); const c2 = S.to(k.nu, 30, 'C', { order: 3 }); S.to(c2, 30, null, { label: 'R₃' });
        return k;
      });
      const p = S.frag(() => { const k = K(S, { top: null }); k.o = S.to(k.c, 150, 'O', { charge: -1 }); alkynyl(S, k.c); return k; });
      return S.step({
        caption: '1. Das Acetylid-Anion (aus dem terminalen Alkin mit n-BuLi oder NaNH₂, pK_s ≈ 25) greift das Carbonyl-C an. Das sp-hybridisierte C ist ein gutes, wenig sperriges Nucleophil.',
        row: [a, '→', p, '+', lab(S, 'Li', 1)], y: DY + 0.5,
        curly: [S.cv(S.atom(a.nu), S.atom(a.c), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = K(S, { top: null }); k.o = S.to(k.c, 150, 'O', { charge: -1 }); alkynyl(S, k.c);
        Object.assign(k, h3o(S, ...polar(S.xy(k.o), 90, 1.2), 30)); return k;
      });
      const p = S.frag(() => { const k = K(S, { top: null }); S.to(k.c, 150, 'O'); alkynyl(S, k.c); return k; });
      return S.step({
        caption: '2. Wässrige Aufarbeitung: Propargylalkohol. Die Dreifachbindung bleibt für weitere Umsetzungen erhalten (Lindlar, Hydratisierung, Rupe-Umlagerung).',
        row: [a, '→', p, '+', lab(S, 'H₂O')], y: DY + 0.5,
        curly: prot(S, a)
      });
    })()
  ]
};

/* ── Cyanhydrin ───────────────────────────────────────────────────── */
function cn(S, from, q) { const c = S.to(from, 30, 'C', { charge: q }); S.to(c, 30, 'N', { order: 3 }); return c; }
M['cyanhydrin'] = {
  title: 'Cyanid greift an, HCN liefert das Proton',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = K(S); const p = polar(S.xy(k.c), 30, 1.55);
        k.nu = S.at(p[0], p[1], 'C', -1); S.to(k.nu, 30, 'N', { order: 3 }); return k;
      });
      const p = S.frag(() => { const k = K(S, { tq: -1, single: true }); cn(S, k.c); return k; });
      return S.step({
        caption: '1. Das Cyanid-Ion greift über das C-Atom das Carbonyl-C an. Man braucht freies CN⁻: Mit reiner HCN (schwache Säure, pK_s ≈ 9) läuft nichts — deshalb NaCN/KCN mit nur katalytisch Säure.',
        row: [a, '→', p], y: DY + 0.5,
        curly: [S.cv(S.atom(a.nu), S.atom(a.c), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = K(S, { tq: -1, single: true }); cn(S, k.c);
        k.h = S.at(...polar(S.xy(k.o), 150, 1.15), 'H'); k.hc = S.to(k.h, 180, 'C'); S.to(k.hc, 180, 'N', { order: 3 });
        return k;
      });
      const p = S.frag(() => { const k = K(S, { single: true }); cn(S, k.c); return k; });
      const cnm = S.frag(() => { const c = S.at(0, 0, 'C', -1); S.to(c, 0, 'N', { order: 3 }); return {}; });
      return S.step({
        caption: '2. Das Alkoxid holt sich das Proton von HCN — dabei entsteht CN⁻ neu: Die Base wirkt katalytisch. Das Gleichgewicht liegt bei Aldehyden und unsymmetrischen Methylketonen auf der Seite des Cyanhydrins.',
        row: [a, '→', p, '+', cnm], y: DY + 0.5,
        curly: [S.cv(S.atom(a.o), S.atom(a.h), -1), S.cv(S.pair(a.h, a.hc), S.atom(a.hc), -1)]
      });
    })()
  ]
};

/* ── Reduktion NaBH₄ / LiAlH₄ ─────────────────────────────────────── */
M['carbonyl-reduktion'] = {
  title: 'Hydrid-Übertragung auf das Carbonyl-C',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = K(S); k.h = S.at(...polar(S.xy(k.c), 150, 1.45), 'H'); k.b = S.to(k.h, 150, null, { label: 'H₃B', charge: -1 });
        return k;
      });
      const p = S.frag(() => { const k = K(S, { tq: -1, single: true }); H(S, k.c, 150); return k; });
      return S.step({
        caption: '1. BH₄⁻ überträgt ein Hydrid-Ion (H⁻ mit seinem Elektronenpaar) auf das Carbonyl-C. NaBH₄ (mild, in MeOH/EtOH) reduziert Aldehyde und Ketone; LiAlH₄ (viel reaktiver, nur in Ether/THF) auch Ester, Säuren, Amide und Nitrile.',
        row: [a, '→', p, '+', lab(S, 'BH₃')], y: DY,
        curly: [S.cv(S.pair(a.h, a.b), S.atom(a.c), -1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = K(S, { tq: -1, single: true }); H(S, k.c, 150);
        Object.assign(k, h3o(S, ...polar(S.xy(k.o), 30, 1.2), 30)); return k;
      });
      const p = S.frag(() => { const k = K(S, { single: true }); H(S, k.c, 150); return k; });
      return S.step({
        caption: '2. Protonierung des Alkoxids durch das Lösungsmittel bzw. bei der Aufarbeitung: Aldehyd → primärer, Keton → sekundärer Alkohol. Isolierte C=C-Bindungen bleiben unberührt.',
        row: [a, '→', p, '+', lab(S, 'H₂O')], y: DY,
        curly: prot(S, a)
      });
    })()
  ]
};

/* ── Acetal (cyclisch, Ethylenglycol) ─────────────────────────────── */
/* The dioxolane of the scheme sits as a five-ring on top of the C:
   O1 on the right (v1), CH₂ (v2, v3), O2 on the left (v4). */
const RING = (() => { const c = [DX, DY + 0.8507]; return [270, 342, 54, 126, 198].map(d => polar(c, d, 0.8507)); })();
/* the chain O1–CH₂–CH₂–O2H hanging on C at O1; `closed` bonds O2 to C;
   `o2out` turns the free OH away while the original O still sits up */
function glycol(S, c, o) {
  o = o || {};
  const s = o.s || 'O';
  const o1 = S.at(RING[1][0], RING[1][1], s, o.q1); const c2 = S.at(...RING[2]), c3 = S.at(...RING[3]);
  const p4 = o.o2out ? polar(RING[3], 120, 1) : RING[4];
  const o2 = S.at(p4[0], p4[1], s, o.q2);
  S.b(c, o1, o.d1 ? 2 : 1).b(o1, c2).b(c2, c3).b(c3, o2);
  if (o.closed) S.b(o2, c);
  const k = { o1, o2, c2, c3 };
  if (o.h1) k.h1 = H(S, o1, -20);
  if (o.h2) k.h2 = H(S, o2, o.o2out ? 180 : 200);
  return k;
}
/* the hemiacetal C: R₁, R₂, the former carbonyl O now at 150° (the top
   is taken by the glycol ring), protonated with `plus` */
function hemi(S, plus) {
  const k = K(S, { top: null });
  k.o = S.to(k.c, 150, 'O', { charge: plus ? 1 : 0 }); H(S, k.o, 210);
  if (plus) H(S, k.o, 140);
  return k;
}
M['acetal-schutz'] = {
  title: 'Säurekatalysiert über Halbacetal und Oxocarbenium-Ion',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = K(S); Object.assign(k, h3o(S, DX + 1.05, DY + 1.55, 0)); return k; });
      const p = S.frag(() => { const k = K(S, { tq: 1 }); H(S, k.o, 150); return k; });
      return S.step({
        caption: '1. Die Säure protoniert den Carbonyl-Sauerstoff — das Carbonyl-C wird deutlich elektrophiler, sodass auch das schwache Nucleophil ROH angreifen kann.',
        row: [a, '→', p, '+', lab(S, 'H₂O')], y: DY,
        curly: prot(S, a)
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = K(S, { tq: 1 }); H(S, k.o, 150);
        // ethylene glycol coming in from the right with its first O
        const o1 = S.at(RING[1][0] + 0.55, RING[1][1] - 0.35, 'O'); H(S, o1, -40);
        const c2 = S.to(o1, 20, 'C'), c3 = S.to(c2, 80, 'C'), o2 = S.to(c3, 140, 'O'); H(S, o2, 200);
        return Object.assign(k, { o1 });
      });
      const m = S.frag(() => {
        const k = hemi(S); Object.assign(k, glycol(S, k.c, { q1: 1, h1: true, h2: true, o2out: true })); return k;
      });
      const p = S.frag(() => {
        const k = hemi(S); Object.assign(k, glycol(S, k.c, { h2: true, o2out: true })); return k;
      });
      return S.step({
        caption: '2. Eine OH-Gruppe des Ethylenglycols greift an; nach Abgabe des Protons liegt das Halbacetal vor.',
        row: [a, '→', m, { arrow: '→', above: '−H⁺' }, p], y: DY + 0.5,
        curly: [S.cv(S.atom(a.o1), S.atom(a.c), -1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const h = S.frag(() => {
        const k = hemi(S); Object.assign(k, glycol(S, k.c, { h2: true, o2out: true })); return k;
      });
      const a = S.frag(() => {
        const k = hemi(S, true); Object.assign(k, glycol(S, k.c, { h2: true, o2out: true })); return k;
      });
      const p = S.frag(() => {
        const k = K(S, { top: null }); Object.assign(k, glycol(S, k.c, { q1: 1, d1: true, h2: true, o2out: true })); return k;
      });
      return S.step({
        caption: '3. Die OH-Gruppe des Halbacetals wird protoniert und verlässt das Molekül als Wasser; das freie Elektronenpaar des Ring-O schiebt nach. Das Oxocarbenium-Ion ist mesomeriestabilisiert. Wasser abtrennen (Dean-Stark) treibt das Gleichgewicht.',
        row: [h, { arrow: '→', above: '+H⁺' }, a, '→', p, '+', lab(S, 'H₂O')], y: DY + 0.5,
        curly: [S.cv(S.atom(a.o1), S.pair(a.c, a.o1), -1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = K(S, { top: null }); Object.assign(k, glycol(S, k.c, { q1: 1, d1: true, h2: true })); return k;
      });
      const m = S.frag(() => {
        const k = K(S, { top: null }); Object.assign(k, glycol(S, k.c, { q2: 1, h2: true, closed: true })); return k;
      });
      const p = S.frag(() => { const k = K(S, { top: null }); Object.assign(k, glycol(S, k.c, { closed: true })); return k; });
      return S.step({
        caption: '4. Die zweite OH-Gruppe schließt den Ring (intramolekular, deshalb besonders günstig); Abgabe des Protons regeneriert den Katalysator. Das cyclische Acetal ist gegen Basen, Nucleophile und Hydride stabil — mit wässriger Säure wird die Carbonylgruppe wieder freigesetzt.',
        row: [a, '→', m, { arrow: '→', above: '−H⁺' }, p], y: DY + 0.5,
        curly: [S.cv(S.atom(a.o2), S.atom(a.c), 1), S.cv(S.pair(a.c, a.o1), S.atom(a.o1), -1)]
      });
    })()
  ]
};

/* ── Imin / Oxim / Hydrazon ───────────────────────────────────────── */
/* The N comes in at 30° (upper right). After water has left, the C=N
   swings up to where the C=O was — the scheme's product. */
function iminSteps(sub, opts) {
  const nr = (S, n, deg) => sub.sym ? S.to(n, deg, sub.sym) : S.to(n, deg, null, { label: sub.label });
  const nh = (S, n, deg) => H(S, n, deg);
  return [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = K(S); k.n = S.at(...polar(S.xy(k.c), 30, 1.6), 'N'); nr(S, k.n, 30); nh(S, k.n, 90); nh(S, k.n, -30); return k;
      });
      const p = S.frag(() => {
        const k = K(S, { tq: -1, single: true }); k.n = S.to(k.c, 30, 'N', { charge: 1 }); nr(S, k.n, 30); nh(S, k.n, 90); nh(S, k.n, -30); return k;
      });
      return S.step({
        caption: '1. Das freie Elektronenpaar des N greift das Carbonyl-C an (nucleophile Addition). ' + opts.cap1,
        row: [a, '→', p], y: DY + 0.3,
        curly: [S.cv(S.atom(a.n), S.atom(a.c), -1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = K(S, { tq: -1, single: true }); k.n = S.to(k.c, 30, 'N', { charge: 1 }); nr(S, k.n, 30); k.h = nh(S, k.n, 90); nh(S, k.n, -30); return k;
      });
      const p = S.frag(() => {
        const k = K(S, { single: true }); H(S, k.o, 150); k.n = S.to(k.c, 30, 'N'); nr(S, k.n, 30); nh(S, k.n, -30); return k;
      });
      return S.step({
        caption: '2. Protonenübertrag vom N auf das O (über das Lösungsmittel): Halbaminal (Carbinolamin).',
        row: [a, '→', p], y: DY + 0.3,
        curly: [S.cv(S.atom(a.o), S.atom(a.h), 1), S.cv(S.pair(a.n, a.h), S.atom(a.n), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = K(S, { single: true, tq: 1 }); H(S, k.o, 150); H(S, k.o, 90);
        k.n = S.to(k.c, 30, 'N'); nr(S, k.n, 30); nh(S, k.n, -30); return k;
      });
      const p = S.frag(() => {
        const k = K(S, { top: 'N', tq: 1 }); nr(S, k.o, 30); nh(S, k.o, 150); return k;
      });
      return S.step({
        caption: '3. Die OH-Gruppe wird protoniert und geht als Wasser; das Elektronenpaar des N bildet die C=N-Doppelbindung: Iminium-Ion. ' + opts.cap3,
        row: [a, '→', p, '+', lab(S, 'H₂O')], y: DY + 0.3,
        curly: [S.cv(S.atom(a.n), S.pair(a.c, a.n), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = K(S, { top: 'N', tq: 1 }); nr(S, k.o, 30); k.h = nh(S, k.o, 150);
        k.w = water(S, ...polar(S.xy(k.h), 180, 1.15), 0); return k;
      });
      const p = S.frag(() => { const k = K(S, { top: 'N' }); nr(S, k.o, 30); return k; });
      return S.step({
        caption: '4. Abgabe des Protons am N: ' + opts.cap4,
        row: [a, '→', p, '+', lab(S, 'H₃O', 1)], y: DY + 0.3,
        curly: [S.cv(S.atom(a.w), S.atom(a.h), 1), S.cv(S.pair(a.o, a.h), S.atom(a.o), -1)]
      });
    })()
  ];
}
M['iminbildung'] = {
  title: 'Addition, dann Wasserabspaltung (pH ≈ 4–5)',
  steps: iminSteps({ label: 'R₃' }, {
    cap1: 'Es entsteht ein Zwitterion.',
    cap3: 'Dafür braucht es Säure — aber nicht zu viel: Bei zu tiefem pH ist das Amin protoniert und nicht mehr nucleophil. Daher das Optimum bei pH 4–5.',
    cap4: 'Imin (Schiff-Base). Die Reaktion ist umkehrbar; Wasser wird abgetrennt.'
  })
};
M['oxim-hydrazon'] = {
  title: 'Wie die Iminbildung — mit H₂N–OH bzw. H₂N–NH₂',
  steps: iminSteps({ label: 'OH' }, {
    cap1: 'Hydroxylamin (bzw. Hydrazin) ist durch das benachbarte freie Elektronenpaar (α-Effekt) besonders nucleophil.',
    cap3: '',
    cap4: 'Oxim (mit Hydrazin: Hydrazon). Anders als einfache Imine sind Oxime und Hydrazone stabil und kristallin — früher zur Identifizierung von Carbonylverbindungen genutzt; Oxime sind die Edukte der Beckmann-Umlagerung.'
  })
};

/* ── Enamin ───────────────────────────────────────────────────────── */
/* Scheme frame: R₁ (0,0) – Cα (DX,DY) – C (2DX,0) – R₂ (3DX,DY), O DOWN at (2DX,−1). */
function E(S, o) {
  o = o || {};
  const r1 = S.L(0, 0, 'R₁'), ca = S.at(DX, DY), c = S.at(2 * DX, 0), r2 = S.L(3 * DX, DY, 'R₂');
  S.b(r1, ca).b(ca, c, o.enamine ? 2 : 1).b(c, r2);
  const k = { ca, c };
  if (o.ha) k.ha = H(S, ca, 90);
  if (o.bottom) { k.x = S.at(2 * DX, -1, o.bottom, o.bq); S.b(c, k.x, o.single ? 1 : 2); }
  return k;
}
function nR2(S, n) { S.to(n, 210, null, { label: 'R₃' }); S.to(n, -30, null, { label: 'R₄' }); }
M['enaminbildung'] = {
  title: 'Iminium-Ion, dann Deprotonierung am α-C',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = E(S, { bottom: 'O' }); k.n = S.at(...polar(S.xy(k.c), -30, 1.6), 'N');
        S.to(k.n, 0, null, { label: 'R₄' }); S.to(k.n, -90, null, { label: 'R₃' }); return k;
      });
      const p = S.frag(() => {
        const k = E(S, { bottom: 'O', bq: -1, single: true }); const n = S.to(k.c, -30, 'N', { charge: 1 });
        S.to(n, 0, null, { label: 'R₄' }); S.to(n, -90, null, { label: 'R₃' }); return k;
      });
      return S.step({
        caption: '1. Das sekundäre Amin (Pyrrolidin, Morpholin) greift das Carbonyl-C an.',
        row: [a, '→', p], y: 0,
        curly: [S.cv(S.atom(a.n), S.atom(a.c), -1), S.cv(S.pair(a.c, a.x), S.atom(a.x), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = E(S, { bottom: 'O', bq: 1, single: true }); H(S, k.x, 210); H(S, k.x, 270);
        k.n = S.to(k.c, -30, 'N'); S.to(k.n, 0, null, { label: 'R₄' }); S.to(k.n, -90, null, { label: 'R₃' }); return k;
      });
      const p = S.frag(() => { const k = E(S, { ha: true, bottom: 'N', bq: 1 }); nR2(S, k.x); return k; });
      return S.step({
        caption: '2. Nach Protonenübertrag zum O (Halbaminal) und Protonierung der OH-Gruppe geht Wasser; das N-Elektronenpaar bildet das Iminium-Ion. (Das Amin dreht dabei unter das C, wo der Sauerstoff war.)',
        row: [a, '→', p, '+', lab(S, 'H₂O')], y: 0,
        curly: [S.cv(S.atom(a.n), S.pair(a.c, a.n), 1), S.cv(S.pair(a.c, a.x), S.atom(a.x), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = E(S, { ha: true, bottom: 'N', bq: 1 }); nR2(S, k.x);
        k.w = water(S, ...polar(S.xy(k.ha), 180, 1.15), 0); return k;
      });
      const p = S.frag(() => { const k = E(S, { enamine: true, bottom: 'N', single: true }); nR2(S, k.x); return k; });
      return S.step({
        caption: '3. Ein sekundäres Iminium-Ion hat am N kein H mehr — also gibt es ein Proton vom α-C ab: Die C–H-Elektronen bilden die C=C-Bindung, die C=N-Elektronen gehen zum N. Enamin. Das α-C ist jetzt nucleophil (Stork-Enamin-Reaktion).',
        row: [a, '→', p, '+', lab(S, 'H₃O', 1)], y: 0,
        curly: [S.cv(S.atom(a.w), S.atom(a.ha), 1), S.cv(S.pair(a.ca, a.ha), S.pair(a.ca, a.c), 1), S.cv(S.pair(a.c, a.x), S.atom(a.x), -1)]
      });
    })()
  ]
};

/* ── Reduktive Aminierung ─────────────────────────────────────────── */
M['reduktive-aminierung'] = {
  title: 'Iminium-Ion, dann Hydrid',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => K(S));
      const p = S.frag(() => { const k = K(S, { top: 'N', tq: 1 }); S.to(k.o, 30, null, { label: 'R₃' }); H(S, k.o, 150); return k; });
      return S.step({
        caption: '1. Carbonylverbindung und Amin bilden im schwach Sauren (pH ≈ 6) das Iminium-Ion — Mechanismus wie bei der Iminbildung.',
        row: [a, { arrow: '⇌', above: 'R₃–NH₂, H⁺', below: '−H₂O' }, p], y: DY + 0.3
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = K(S, { top: 'N', tq: 1 }); S.to(k.o, 30, null, { label: 'R₃' }); H(S, k.o, 150);
        k.h = S.at(...polar(S.xy(k.c), 150, 1.45), 'H'); k.b = S.to(k.h, 180, null, { label: 'NCBH₂', charge: -1 });
        S.m.atoms[k.b].alias = 'NC–BH₂'; return k;
      });
      const p = S.frag(() => { const k = K(S, { top: 'N', single: true }); S.to(k.o, 30, null, { label: 'R₃' }); H(S, k.o, 150); H(S, k.c, 150); return k; });
      return S.step({
        caption: '2. NaBH₃CN überträgt ein Hydrid auf das Iminium-C. Der Trick: Durch die elektronenziehende CN-Gruppe ist es so mild, dass es bei pH 6 die C=O-Gruppe kaum angreift, das viel elektrophilere Iminium-Ion aber schnell — beides kann deshalb in einem Topf laufen. Kein Überalkylierungsproblem wie bei R–X.',
        row: [a, '→', p, '+', lab(S, 'NC–BH₂')], y: DY + 0.3,
        curly: [S.cv(S.pair(a.h, a.b), S.atom(a.c), -1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })()
  ]
};

/* ── Wittig ───────────────────────────────────────────────────────── */
/* Oxaphosphetane drawn as a square on the upper left of C1 so that the
   new C=C points up, as in the scheme's product: C2 above C1, P to the
   upper left, O to the left. */
function oxaphos(S, o) {
  o = o || {};
  const c1 = S.at(DX, DY), c2 = S.at(DX, DY + 1), p = S.L(DX - 1.2, DY + 1, o.p || 'Ph₃P', o.pq), ox = S.at(DX - 1.2, DY, 'O', o.oq);
  S.b(c1, c2).b(c2, p).b(p, ox, o.po || 1);
  if (!o.open) S.b(ox, c1);
  S.b(c1, S.L(DX - 0.5, DY - DX, 'R₁')).b(c1, S.L(2 * DX, 0, o.r2 || 'R₂'));
  if (o.r3 !== false) S.b(c2, S.L(...polar([DX, DY + 1], 100, 1), 'R₃'));
  S.b(c2, S.L(2 * DX, DY + 1 + DY, o.r4 || 'R₄'));
  return { c1, c2, p, o: ox };
}
M['wittig'] = {
  title: '[2+2] zum Oxaphosphetan, dann Zerfall',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = K(S);
        k.y = S.at(DX + 1.7, DY + 0.95, 'C', -1); k.p = S.L(DX + 1.7, DY + 2.05, 'PPh₃', 1); S.b(k.y, k.p);
        S.to(k.y, 0, null, { label: 'R₄' }); S.to(k.y, -60, null, { label: 'R₃' }); return k;
      });
      const p = S.frag(() => oxaphos(S));
      return S.step({
        caption: '1. Das Ylid Ph₃P⁺–C⁻R₃R₄ (aus Phosphoniumsalz + starker Base) reagiert mit der Carbonylgruppe: Das nucleophile Ylid-C bindet an das Carbonyl-C, der Carbonyl-O an das P. Es entsteht ein viergliedriger Ring, das Oxaphosphetan. (Der O wandert dabei an den Platz, an dem gleich das P steht.)',
        row: [a, '→', p], y: DY + 0.5,
        curly: [S.cv(S.atom(a.y), S.atom(a.c), 1), S.cv(S.pair(a.c, a.o), S.pair(a.o, a.p), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => oxaphos(S));
      const p = S.frag(() => {
        const r1 = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY), r2 = S.L(2 * DX, 0, 'R₂'), c2 = S.at(DX, DY + 1);
        S.b(r1, c1).b(c1, r2).b(c1, c2, 2).b(c2, S.L(0, DY + 1 + DY, 'R₃')).b(c2, S.L(2 * DX, DY + 1 + DY, 'R₄')); return {};
      });
      const po = S.frag(() => { const o = S.at(0, 0, 'O'); S.to(o, 0, null, { label: 'PPh₃', order: 2 }); return {}; });
      return S.step({
        caption: '2. Der Ring zerfällt in einer Retro-[2+2]-Reaktion in das Alken und Triphenylphosphanoxid. Triebkraft ist die sehr starke P=O-Bindung. Nicht stabilisierte Ylide liefern bevorzugt (Z)-, stabilisierte (mit C=O am Ylid-C) (E)-Alkene.',
        row: [a, '→', p, '+', po], y: DY + 0.5,
        curly: [S.cv(S.pair(a.c2, a.p), S.pair(a.c1, a.c2), 1), S.cv(S.pair(a.c1, a.o), S.pair(a.o, a.p), -1)]
      });
    })()
  ]
};

/* ── Horner-Wadsworth-Emmons ──────────────────────────────────────── */
const PO = '(EtO)₂P';
/* C1 (DX,DY) below C2 (DX,DY+1); P upper left with (EtO)₂ and an exo O;
   ring O lower left. stage: 'alkoxide' | 'ring' */
function hweRing(S, stage) {
  const c1 = S.at(DX, DY), c2 = S.at(DX, DY + 1);
  const p = S.at(DX - 1.2, DY + 1, 'P'), ox = S.at(DX - 1.2, DY, 'O', stage === 'alkoxide' ? -1 : 0);
  S.b(c1, c2).b(c2, p).b(ox, c1);
  if (stage === 'ring') S.b(p, ox);
  const exo = S.to(p, 90, 'O', stage === 'alkoxide' ? { order: 2 } : { charge: -1 });
  S.to(p, 150, null, { label: 'EtO' }); S.to(p, 210, null, { label: 'EtO' });
  S.b(c1, S.L(DX - 0.5, DY - DX, 'R₁'));
  S.b(c2, S.L(2 * DX, DY + 1 + DY, 'CO₂R₂'));
  return { c1, c2, p, o: ox, exo };
}
M['horner-wadsworth-emmons'] = {
  title: 'Phosphonat-Carbanion, dann Eliminierung wie bei Wittig',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const c = S.at(0, 0), p = S.to(c, 150, null, { label: PO }); S.to(c, 30, null, { label: 'CO₂R₂' });
        S.to(p, 90, 'O', { order: 2, len: 1 });
        const h = H(S, c, 270); const b = S.L(0, -1.95, 'B', -1); return { c, h, b };
      });
      const p = S.frag(() => {
        const c = S.at(0, 0, 'C', -1), p = S.to(c, 150, null, { label: PO }); S.to(c, 30, null, { label: 'CO₂R₂' }); S.to(p, 90, 'O', { order: 2, len: 1 }); return {};
      });
      return S.step({
        caption: '1. Die Base (NaH, RO⁻) deprotoniert die CH₂-Gruppe zwischen Phosphonat und Ester (doppelt aktiviert, pK_s ≈ 13). Das Phosphonat stammt aus der Michaelis-Arbuzov-Reaktion.',
        row: [a, '→', p, '+', lab(S, 'H–B')], y: 0,
        curly: [S.cv(S.atom(a.b), S.atom(a.h), 1), S.cv(S.pair(a.c, a.h), S.atom(a.c), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = K(S, { r2: null });
        k.y = S.at(DX + 1.7, DY + 0.95, 'C', -1); const p = S.to(k.y, 90, 'P'); S.to(p, 90, 'O', { order: 2 }); S.to(p, 0, null, { label: 'OEt' }); S.to(p, 180, null, { label: 'EtO' });
        S.to(k.y, -30, null, { label: 'CO₂R₂' });
        return k;
      });
      const p = S.frag(() => hweRing(S, 'alkoxide'));
      return S.step({
        caption: '2. Das Carbanion addiert an den Aldehyd: Alkoxid. (Gezeichnet schon in der Lage, in der das O⁻ gleich das P erreicht.)',
        row: [a, '→', p], y: DY + 0.5,
        curly: [S.cv(S.atom(a.y), S.atom(a.c), 1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => hweRing(S, 'alkoxide'));
      const p = S.frag(() => hweRing(S, 'ring'));
      return S.step({
        caption: '3. Das Alkoxid greift das P an, die P=O-Bindung klappt auf: Oxaphosphetan. Weil Addition und Ringschluss umkehrbar sind, stellt sich das stabilere Diastereomer ein — mit R₁ und CO₂R₂ auf entgegengesetzten Seiten.',
        row: [a, '→', p], y: DY + 0.5,
        curly: [S.cv(S.atom(a.o), S.atom(a.p), 1), S.cv(S.pair(a.p, a.exo), S.atom(a.exo), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => hweRing(S, 'ring'));
      const p = S.frag(() => {
        const r1 = S.L(0, 0, 'R₁'), c1 = S.at(DX, DY), c2 = S.at(DX, DY + 1); S.b(r1, c1).b(c1, c2, 2).b(c2, S.L(2 * DX, DY + 1 + DY, 'CO₂R₂')); return {};
      });
      return S.step({
        caption: '4. Zerfall wie bei der Wittig-Reaktion: fast ausschließlich das (E)-Alken. Das Nebenprodukt (EtO)₂PO₂⁻ ist wasserlöslich und leicht abzutrennen — ein praktischer Vorteil gegenüber Ph₃P=O.',
        row: [a, '→', p, '+', lab(S, '(EtO)₂PO₂', -1)], y: DY + 0.5,
        curly: [S.cv(S.pair(a.c2, a.p), S.pair(a.c1, a.c2), 1), S.cv(S.pair(a.c1, a.o), S.pair(a.o, a.p), -1)]
      });
    })()
  ]
};

/* ── Wolff-Kishner ────────────────────────────────────────────────── */
/* hydrazone: N1 up from C, N2 to the upper right */
function hz(S, o) {
  o = o || {};
  const k = K(S, { top: o.c ? null : 'N', single: false });
  if (o.c) { // C–H / carbanion stage
    if (o.ch) k.hc = H(S, k.c, 150);
    if (o.cq) S.charge(k.c, o.cq);
    if (o.n) { k.o = S.at(DX, DY + 1, 'N'); S.b(k.c, k.o); k.n2 = S.to(k.o, 30, 'N', { order: 2, charge: o.n2q }); if (o.n2h) k.h2 = H(S, k.n2, 90); }
    return k;
  }
  k.n2 = S.to(k.o, 30, 'N', { charge: o.n2q }); if (o.n2h !== 0) k.h2 = H(S, k.n2, 90); if (o.n2h === 2) k.h2b = H(S, k.n2, -30);
  return k;
}
M['wolff-kishner-clemmensen'] = {
  title: 'Wolff-Kishner: über das Hydrazon, N₂ als Triebkraft',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => K(S));
      const p = S.frag(() => hz(S, { n2h: 2 }));
      return S.step({
        caption: '1. Mit Hydrazin bildet sich zuerst das Hydrazon (wie bei der Iminbildung). (Die Clemmensen-Reduktion mit Zn(Hg)/HCl läuft dagegen an der Metalloberfläche ab; ihr Mechanismus ist nicht genau bekannt — sie ist das saure Gegenstück für basenempfindliche Substrate.)',
        row: [a, { arrow: '→', above: 'H₂N–NH₂', below: '−H₂O' }, p], y: DY + 0.3
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = hz(S, { n2h: 2 }); k.b = S.L(...polar(S.xy(k.h2b), 0, 1.25), 'OH', -1); return k; });
      const p = S.frag(() => hz(S, { n2q: -1 }));
      return S.step({
        caption: '2. In heißer KOH (Diethylenglycol, ~200 °C) wird die NH₂-Gruppe deprotoniert.',
        row: [a, '→', p, '+', lab(S, 'H₂O')], y: DY + 0.3,
        curly: [S.cv(S.atom(a.b), S.atom(a.h2b), 1), S.cv(S.pair(a.n2, a.h2b), S.atom(a.n2), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = hz(S, { n2q: -1 }); k.h = S.at(...polar(S.xy(k.c), 150, 1.35), 'H'); k.ow = S.to(k.h, 150, 'O'); H(S, k.ow, 90);
        return k;
      });
      const p = S.frag(() => hz(S, { c: true, ch: true, n: true, n2h: true }));
      return S.step({
        caption: '3. Das Elektronenpaar wandert: N=N entsteht, das C wird von Wasser protoniert. (Diazen-Zwischenstufe R₂CH–N=N–H.)',
        row: [a, '→', p, '+', lab(S, 'OH', -1)], y: DY + 0.3,
        curly: [S.cv(S.atom(a.n2), S.pair(a.o, a.n2), 1), S.cv(S.pair(a.c, a.o), S.atom(a.h), 1), S.cv(S.pair(a.h, a.ow), S.atom(a.ow), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = hz(S, { c: true, ch: true, n: true, n2h: true }); k.b = S.L(...polar(S.xy(k.h2), 30, 1.25), 'OH', -1); return k;
      });
      const p = S.frag(() => hz(S, { c: true, ch: true, cq: -1 }));
      const n2 = S.frag(() => { const n = S.at(0, 0, 'N'); S.to(n, 0, 'N', { order: 3 }); return {}; });
      return S.step({
        caption: '4. Zweite Deprotonierung am N — und Stickstoff entweicht: Zurück bleibt ein Carbanion. Die Bildung von N₂ (sehr stabil, gasförmig) treibt diesen sonst ungünstigen Schritt.',
        row: [a, '→', p, '+', n2, '+', lab(S, 'H₂O')], y: DY + 0.3,
        curly: [S.cv(S.atom(a.b), S.atom(a.h2), 1), S.cv(S.pair(a.n2, a.h2), S.pair(a.o, a.n2), 1), S.cv(S.pair(a.c, a.o), S.atom(a.c), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = hz(S, { c: true, ch: true, cq: -1 }); k.h = S.at(DX + 0.45, DY + 1.35, 'H'); k.ow = S.to(k.h, 30, 'O'); H(S, k.ow, 90); return k;
      });
      const p = S.frag(() => { const k = hz(S, { c: true, ch: true }); H(S, k.c, 90); return k; });
      return S.step({
        caption: '5. Das Carbanion wird von Wasser protoniert: CH₂-Gruppe. Aus C=O ist CH₂ geworden.',
        row: [a, '→', p, '+', lab(S, 'OH', -1)], y: DY + 0.3,
        curly: [S.cv(S.atom(a.c), S.atom(a.h), -1), S.cv(S.pair(a.h, a.ow), S.atom(a.ow), -1)]
      });
    })()
  ]
};

/* ── Thioacetal / Raney-Ni ────────────────────────────────────────── */
M['thioacetal-raney'] = {
  title: 'Wie die Acetalbildung — mit Thiolen und BF₃',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = K(S); k.bf = S.L(DX + 1.35, DY + 1, 'BF₃'); return k; });
      const p = S.frag(() => { const k = K(S, { tq: 1 }); S.to(k.o, 0, null, { label: 'BF₃', charge: -1 }); return k; });
      return S.step({
        caption: '1. Die Lewis-Säure BF₃ koordiniert den Carbonyl-Sauerstoff und aktiviert das Carbonyl-C — die Rolle, die bei der Acetalbildung das Proton spielt.',
        row: [a, '→', p], y: DY + 0.3,
        curly: [S.cv(S.atom(a.o), S.atom(a.bf), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = K(S, { tq: 1 }); S.to(k.o, 150, null, { label: 'F₃B', charge: -1 });
        const s1 = S.at(RING[1][0] + 0.55, RING[1][1] - 0.35, 'S'); H(S, s1, -40);
        const c2 = S.to(s1, 20, 'C'), c3 = S.to(c2, 80, 'C'), s2 = S.to(c3, 140, 'S'); H(S, s2, 200);
        return Object.assign(k, { s1 });
      });
      const p = S.frag(() => {
        const k = K(S, { top: null }); Object.assign(k, glycol(S, k.c, { s: 'S', q1: 1, d1: true, h2: true, o2out: true })); return k;
      });
      return S.step({
        caption: '2. Die erste SH-Gruppe addiert an das Carbonyl-C; nach Protonenübertrag geht der Sauerstoff (als HO–BF₃⁻) ab, das S-Elektronenpaar schiebt nach: Thionium-Ion (S ist ein sehr gutes Nucleophil, deshalb gelingt das schon ohne Wasserabtrennung).',
        row: [a, { arrow: '→', below: '−HOBF₃⁻' }, p], y: DY + 0.5,
        curly: [S.cv(S.atom(a.s1), S.atom(a.c), -1), S.cv(S.pair(a.c, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = K(S, { top: null }); Object.assign(k, glycol(S, k.c, { s: 'S', q1: 1, d1: true, h2: true })); return k; });
      const p = S.frag(() => { const k = K(S, { top: null }); Object.assign(k, glycol(S, k.c, { s: 'S', closed: true })); return k; });
      return S.step({
        caption: '3. Die zweite SH-Gruppe schließt den Ring: 1,3-Dithiolan (nach Abgabe des Protons). Anders als O-Acetale sind Thioacetale auch gegen wässrige Säure stabil.',
        row: [a, { arrow: '→', below: '−H⁺' }, p], y: DY + 0.5,
        curly: [S.cv(S.atom(a.o2), S.atom(a.c), 1), S.cv(S.pair(a.c, a.o1), S.atom(a.o1), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = K(S, { top: null }); Object.assign(k, glycol(S, k.c, { s: 'S', closed: true })); return k; });
      const p = S.frag(() => K(S, { top: null }));
      return S.step({
        caption: '4. Raney-Nickel (mit adsorbiertem Wasserstoff) spaltet beide C–S-Bindungen und ersetzt sie durch C–H — eine radikalische Hydrogenolyse an der Metalloberfläche, ohne klassischen Pfeil-Mechanismus. Netto: C=O → CH₂ unter neutralen Bedingungen.',
        row: [a, { arrow: '→', above: 'Raney-Ni', below: '(H₂)' }, p], y: DY + 0.5
      });
    })()
  ]
};

module.exports = M;
