/* Reaction library — Heterocyclen-Synthesen und biochemische Reaktionen.
   Diese Reaktionen tauchen in den ÖChO-Angaben namentlich auf und sind
   von den allgemeinen Kapiteln klar unterscheidbar. */

module.exports = function (ctx) {
const { R, Mol, B, DX, DY } = ctx;

const C_HZ = 'Heterocyclen & Biochemie';
const C_UM = 'Umlagerungen';

R({
  id: 'bischler-napieralski', category: C_HZ, name: 'Bischler-Napieralski-Cyclisierung',
  difficulty: 'D', reaktionstyp: 'intramolekulare S_E(Ar)', transformation: 'β-Arylethylamid → 3,4-Dihydroisochinolin',
  rx: (() => {
    /* β-Arylethylamid: Ar–CH₂–CH₂–NH–CO–R₁, die Kette verlässt den Ring
       radial und zickzackt weiter. */
    const a = (() => {
      const m = new Mol();
      const v = m.benzene(0, 0, B);
      const O = [Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)];
      const step = (p, deg) => [p[0] + B * Math.cos(deg * Math.PI / 180),
                                p[1] + B * Math.sin(deg * Math.PI / 180)];
      const p1 = [2 * B * O[0], 2 * B * O[1]];
      const c1 = m.add(p1[0], p1[1], 'C');
      const p2 = step(p1, -30); const c2 = m.add(p2[0], p2[1], 'C');
      const p3 = step(p2, 30);  const n  = m.add(p3[0], p3[1], 'N');
      const p4 = step(p3, -30); const ci = m.add(p4[0], p4[1], 'C');
      const p5 = step(p4, -90); const oi = m.add(p5[0], p5[1], 'O');
      const p6 = step(p4, 30);  const r  = m.gen(p6[0], p6[1], 'R₁');
      m.bond(v[0], c1, 1); m.bond(c1, c2, 1); m.bond(c2, n, 1);
      m.bond(n, ci, 1); m.bond(ci, oi, 2); m.bond(ci, r, 1);
      return m;
    })();
    /* 3,4-Dihydroisochinolin: neuer Sechsring an die Bindung v0–v5
       anelliert, mit C=N im neuen Ring. */
    const b = (() => {
      const m = new Mol();
      const v = m.benzene(0, 0, B);
      const w = m.fuse(v[0], v[5], 6);          // w[0]…w[3], w[0] hängt an v[0]
      m.atoms[w[2]].sym = 'N';
      m.bonds.find(x => (x.a === w[1] && x.b === w[2]) || (x.a === w[2] && x.b === w[1])).order = 2;
      const rp = m.radial(w.cx, w.cy, w[1], B);
      m.bond(w[1], m.gen(rp[0], rp[1], 'R₁'), 1);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'POCl_3  bzw. P_2O_5', below: 'Δ, -H_2O',
  conditions: 'POCl₃, P₂O₅ oder PPA (Polyphosphorsäure) unter Rückfluss.',
  substituents: 'R₁ = Alkyl, Aryl (aus dem Acylrest) · der Aromat muss AKTIVIERT sein — Methoxygruppen sind fast immer nötig',
  key_points: [
    'Das Amid wird zum Nitrilium-Ion dehydratisiert, das dann intramolekular den eigenen Ring elektrophil angreift.',
    'Weil es eine S_E am Aromaten ist, braucht der Ring Donorsubstituenten — daher die vielen Dimethoxy-Isochinolin-Alkaloide.',
    'Anschließende Oxidation (Pd, S) liefert das vollaromatische Isochinolin.',
    'Der Standardzugang zu Papaverin und den Benzylisochinolin-Alkaloiden.'
  ],
  seen_in: 'LW 2017 (Papaverin), BW 2022 (Lysergsäure)'
});

R({
  id: 'fischer-indol', category: C_HZ, name: 'Fischer-Indolsynthese',
  difficulty: 'D', reaktionstyp: '[3,3] + Cyclisierung', transformation: 'Arylhydrazon → Indol',
  rx: (() => {
    /* Arylhydrazon Ar–NH–N=CR₁R₂. */
    const a = (() => {
      const m = new Mol();
      const v = m.benzene(0, 0, B);
      const O = [Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)];
      const step = (p, deg) => [p[0] + B * Math.cos(deg * Math.PI / 180),
                                p[1] + B * Math.sin(deg * Math.PI / 180)];
      const p1 = [2 * B * O[0], 2 * B * O[1]];
      const n1 = m.add(p1[0], p1[1], 'N');
      const p2 = step(p1, -30); const n2 = m.add(p2[0], p2[1], 'N');
      const p3 = step(p2, 30);  const c  = m.add(p3[0], p3[1], 'C');
      const p4 = step(p3, 90);  const r1 = m.gen(p4[0], p4[1], 'R₁');
      const p5 = step(p3, -30); const r2 = m.gen(p5[0], p5[1], 'R₂');
      m.bond(v[0], n1, 1); m.bond(n1, n2, 1); m.bond(n2, c, 2);
      m.bond(c, r1, 1); m.bond(c, r2, 1);
      return m;
    })();
    /* Indol: Pyrrolring an die Bindung v0–v5 anelliert. */
    const b = (() => {
      const m = new Mol();
      const v = m.benzene(0, 0, B);
      const w = m.fuse(v[0], v[5], 5);          // w[0] an v[0], w[2] an v[5]
      m.atoms[w[2]].sym = 'N';
      m.bonds.find(x => (x.a === w[0] && x.b === w[1]) || (x.a === w[1] && x.b === w[0])).order = 2;
      const p3 = m.radial(w.cx, w.cy, w[0], B);
      const p2 = m.radial(w.cx, w.cy, w[1], B);
      m.bond(w[0], m.gen(p3[0], p3[1], 'R₂'), 1);
      m.bond(w[1], m.gen(p2[0], p2[1], 'R₁'), 1);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'ZnCl_2  bzw. H^+', below: 'Δ, -NH_3',
  conditions: 'Arylhydrazin + Keton/Aldehyd, dann Lewis- oder Brønsted-Säure unter Erhitzen.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H — sie bestimmen die Substituenten an C2 und C3 des Indols',
  key_points: [
    'Die Schlüsselstufe ist eine [3,3]-sigmatrope Umlagerung der En-Hydrazin-Tautomeren — dieselbe Orbitalsymmetrie wie bei der Claisen-Umlagerung.',
    'Danach folgen Rearomatisierung, Ringschluss zum Aminal und Abspaltung von NH₃.',
    'Der mit Abstand wichtigste Zugang zum Indolgerüst — und damit zu Tryptamin-, Serotonin- und Ergot-Alkaloiden.',
    'Unsymmetrische Ketone können zwei Regioisomere geben; die Bedingungen steuern, welches entsteht.'
  ],
  seen_in: 'BW 2022 (Lysergsäure), BW 2021 (Yuehchukene), BW 2020 (Aspidospermin)'
});

R({
  id: 'transaminierung-plp', category: C_HZ, name: 'Transaminierung (PLP-abhängig)',
  difficulty: 'C', reaktionstyp: 'Iminaustausch', transformation: 'Aminosäure + α-Ketosäure ⇌ α-Ketosäure + Aminosäure',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁');
      const ca = m.add(DX, DY, 'C');
      const n = m.add(DX, DY + B, 'N');
      const c = m.add(2 * DX, 0, 'C');
      const o1 = m.add(2 * DX, -B, 'O');
      const o2 = m.add(3 * DX, DY, 'O');
      m.bond(r, ca, 1); m.bond(ca, n, 1); m.bond(ca, c, 1); m.bond(c, o1, 2); m.bond(c, o2, 1);
      return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁');
      const ca = m.add(DX, DY, 'C');
      const o = m.add(DX, DY + B, 'O');
      const c = m.add(2 * DX, 0, 'C');
      const o1 = m.add(2 * DX, -B, 'O');
      const o2 = m.add(3 * DX, DY, 'O');
      m.bond(r, ca, 1); m.bond(ca, o, 2); m.bond(ca, c, 1); m.bond(c, o1, 2); m.bond(c, o2, 1);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'PLP (Pyridoxalphosphat)', below: 'Transaminase  ·  + α-Ketoglutarat',
  conditions: 'Enzymatisch, Cofaktor Pyridoxal-5′-phosphat; der Akzeptor ist meist α-Ketoglutarat.',
  stereochemistry: 'Streng enantioselektiv — es entsteht ausschließlich die L-Aminosäure.',
  substituents: 'R₁ = Aminosäure-Seitenkette (bei Phenylalanin: Benzyl)',
  key_points: [
    'PLP bildet mit der Aminosäure eine Schiff-Base; das Ringstickstoff-Kation wirkt als „Elektronensenke" und stabilisiert das Carbanion am α-C.',
    'Ohne diese Stabilisierung wäre das α-H der Aminosäure viel zu wenig acide.',
    'Über das Chinoid-Zwischenprodukt wandert das Proton, und die Hydrolyse liefert die α-Ketosäure plus Pyridoxamin.',
    'Dieselbe PLP-Chemie treibt auch Decarboxylierungen, Racemisierungen und β-Eliminierungen an Aminosäuren.',
    'Ein Defekt in diesem Stoffwechselweg ist die Ursache der Phenylketonurie.'
  ],
  seen_in: 'BW 2025 (Phenylketonurie, PLP), BW 2025 (Sapropterin)'
});

R({
  id: 'maillard-amadori', category: C_HZ, name: 'Maillard-Reaktion (Amadori-Umlagerung)',
  difficulty: 'C', reaktionstyp: 'Iminbildung + Umlagerung', transformation: 'Aldose + Amin → Amadori-Produkt',
  rx: (() => {
    const a = (() => {
      // Open-chain aldose fragment: CHO–CHOH–R
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁');
      const c2 = m.add(DX, DY, 'C');
      const o2 = m.add(DX, DY + B, 'O');
      const c1 = m.add(2 * DX, 0, 'C');
      const o1 = m.add(2 * DX, -B, 'O');
      const h = m.gen(3 * DX, DY, 'H');
      m.bond(r, c2, 1); m.bond(c2, o2, 1); m.bond(c2, c1, 1); m.bond(c1, o1, 2); m.bond(c1, h, 1);
      return m;
    })();
    const b = (() => {
      // Amadori product: 1-amino-1-deoxy-2-ketose
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁');
      const c2 = m.add(DX, DY, 'C');
      const o2 = m.add(DX, DY + B, 'O');
      const c1 = m.add(2 * DX, 0, 'C');
      const n = m.add(3 * DX, DY, 'N');
      const r2 = m.gen(4 * DX, 0, 'R₂');
      m.bond(r, c2, 1); m.bond(c2, o2, 2); m.bond(c2, c1, 1); m.bond(c1, n, 1); m.bond(n, r2, 1);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'R_2-NH_2 (Lysin-Seitenkette)', below: 'Δ, -H_2O',
  conditions: 'Reduzierender Zucker und Aminogruppe beim Erhitzen; die eigentliche Bräunungskaskade folgt danach.',
  substituents: 'R₁ = restliche Zuckerkette · R₂ = Aminosäure- oder Protein-Rest (meist die ε-Aminogruppe von Lysin)',
  key_points: [
    'Erster Schritt ist eine ganz normale Iminbildung aus der offenkettigen Aldehydform des Zuckers (Glycosylamin).',
    'Die AMADORI-Umlagerung überführt dieses Aldosylamin in die stabilere 1-Amino-1-desoxy-2-ketose — im Kern eine Imin/Enaminol-Tautomerie.',
    'Danach folgen Dehydratisierung, Strecker-Abbau und Polymerisation zu den braunen Melanoidinen.',
    'Verantwortlich für Brotkruste, Röstaromen und Bratenfarbe — und medizinisch für HbA1c (glykiertes Hämoglobin).'
  ],
  seen_in: 'BW 2026 (Maillard-Reaktion & Zuckerrätsel)'
});

R({
  id: 'mutarotation-halbacetal', category: C_HZ, name: 'Halbacetalbildung und Mutarotation der Zucker',
  difficulty: 'B', reaktionstyp: 'intramolekulare A_N', transformation: 'offenkettige Aldose ⇌ Pyranose',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const o = m.add(0, 0, 'O');
      const c5 = m.add(DX, DY, 'C');
      const c4 = m.add(2 * DX, 0, 'C');
      const c3 = m.add(3 * DX, DY, 'C');
      const c2 = m.add(4 * DX, 0, 'C');
      const c1 = m.add(5 * DX, DY, 'C');
      const o1 = m.add(5 * DX, DY + B, 'O');
      const h = m.gen(6 * DX, 0, 'H');
      m.bond(o, c5, 1); m.bond(c5, c4, 1); m.bond(c4, c3, 1); m.bond(c3, c2, 1);
      m.bond(c2, c1, 1); m.bond(c1, o1, 2); m.bond(c1, h, 1);
      return m;
    })();
    const b = (() => {
      // Pyranose ring: six-ring with one O, anomeric OH pointing out.
      const m = new Mol();
      const v = m.ring(6, 0, 0);
      m.atoms[v[1]].sym = 'O';                      // ring oxygen
      const p = m.radial(0, 0, v[0], B);
      const oh = m.add(p[0], p[1], 'O');
      m.bond(v[0], oh, 1, 1);                       // anomeric centre, wedge
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'H_2O, H^+ (kat.)', below: 'Gleichgewicht  ·  α ⇌ β',
  conditions: 'Wässrige Lösung, säure- oder basenkatalysiert; stellt sich spontan ein.',
  stereochemistry: 'Am ANOMEREN C entsteht ein neues Stereozentrum → α- und β-Anomer. Ihre Umwandlung ineinander über die offene Form ist die Mutarotation.',
  substituents: 'Gilt für alle Aldosen mit passender Kettenlänge: 5-Ring = Furanose, 6-Ring = Pyranose',
  key_points: [
    'Die Carbonylgruppe wird von einer eigenen OH-Gruppe im Molekül angegriffen — eine intramolekulare Halbacetalbildung.',
    'Fünf- und Sechsringe dominieren, weil sie am wenigsten gespannt sind; in wässriger Glucose liegen >99 % cyclisch vor.',
    'Das anomere C ist das einzige, das mit ZWEI Sauerstoffen verknüpft ist — daran erkennt man es in jeder Angabe.',
    'Reagiert das Halbacetal mit einem weiteren Alkohol, entsteht das VOLLACETAL (Glykosid), und die Mutarotation kommt zum Erliegen — deshalb sind Glykoside nicht reduzierend.'
  ],
  seen_in: 'BW 2026 (Maillard & Zuckerrätsel, Xylit), BW 2024 (Kohlenhydrate)'
});

R({
  id: 'pinakol-umlagerung', category: C_UM, name: 'Pinakol-Umlagerung',
  difficulty: 'C', reaktionstyp: 'Umlagerung (1,2-Shift)', transformation: '1,2-Diol → Keton',
  rx: (() => {
    /* Das 1,2-Diol waagrecht, je drei Substituenten im 90°-Raster —
       so ist auf einen Blick zu sehen, welcher Rest wandert. */
    const a = (() => {
      const m = new Mol();
      const c1 = m.add(0, 0, 'C');
      const c2 = m.add(B, 0, 'C');
      const o1 = m.add(0, B, 'O');
      const o2 = m.add(B, B, 'O');
      const r1 = m.gen(-B, 0, 'R₁');
      const r2 = m.gen(0, -B, 'R₂');
      const r3 = m.gen(2 * B, 0, 'R₃');
      const r4 = m.gen(B, -B, 'R₄');
      m.bond(c1, c2, 1); m.bond(c1, o1, 1); m.bond(c2, o2, 1);
      m.bond(c1, r1, 1); m.bond(c1, r2, 1); m.bond(c2, r3, 1); m.bond(c2, r4, 1);
      return m;
    })();
    /* R₂ ist gewandert: aus C1 wird das Carbonyl, C2 trägt jetzt drei Reste. */
    const b = (() => {
      const m = new Mol();
      const c1 = m.add(0, 0, 'C');
      const o1 = m.add(0, B, 'O');
      const r1 = m.gen(-B, 0, 'R₁');
      const c2 = m.add(B, 0, 'C');
      const r2 = m.gen(B, B, 'R₂');
      const r3 = m.gen(2 * B, 0, 'R₃');
      const r4 = m.gen(B, -B, 'R₄');
      m.bond(c1, o1, 2); m.bond(c1, r1, 1); m.bond(c1, c2, 1);
      m.bond(c2, r2, 1); m.bond(c2, r3, 1); m.bond(c2, r4, 1);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'H_2SO_4 (konz.)', below: 'Δ, -H_2O',
  conditions: 'Konzentrierte Säure, Wärme.',
  substituents: 'R₁–R₄ = Alkyl, Aryl, H · WANDERUNGSTENDENZ: Aryl > tertiäres Alkyl > sekundär > primär > H',
  key_points: [
    'Eine OH-Gruppe wird protoniert und geht als Wasser ab — es bildet sich das STABILERE der beiden möglichen Carbenium-Ionen.',
    'Dann wandert ein Rest vom Nachbar-C mit seinem Bindungselektronenpaar zum Kation (1,2-Shift).',
    'Triebkraft ist die Bildung des mesomeriestabilisierten Oxocarbenium-Ions, das zum Keton deprotoniert.',
    'Bei Ringsystemen führt derselbe Mechanismus zur Ringverengung oder -erweiterung — das macht ihn in Terpensynthesen wertvoll.'
  ],
  seen_in: 'BW 2019 (Twistan), BW 2023 (Hirsuten)'
});

};
