/* Reaction library — Enolate und C–C-Knüpfung.

   House orientation: the carbonyl that gets deprotonated sits on the
   right of its fragment with the O pointing UP, and the α-carbon is the
   atom immediately to its left — so in every entry the bond that is
   formed starts from the same place on the page. */

module.exports = function (ctx) {
const { R, Mol, B, DX, DY } = ctx;

const C_EN = 'Enolate & C–C-Knüpfung';

/* R₁–CH₂–CHO : an aldehyde with its α-carbon to the left.
   Returns { m, r, ca, c, o } — ca is the α-C. */
function alphaCarbonyl(m, x0, y0, leftLabel, zLabel) {
  const r  = m.gen(x0, y0, leftLabel);
  const ca = m.add(x0 + DX, y0 + DY, 'C');
  const c  = m.add(x0 + 2 * DX, y0, 'C');
  const o  = m.add(x0 + 2 * DX, y0 - B, 'O');
  m.bond(r, ca, 1); m.bond(ca, c, 1); m.bond(c, o, 2);
  let z = null;
  if (zLabel) { z = m.gen(x0 + 3 * DX, y0 + DY, zLabel); m.bond(c, z, 1); }
  return { r, ca, c, o, z };
}

R({
  id: 'aldol-addition', category: C_EN, name: 'Aldol-Addition',
  difficulty: 'B', reaktionstyp: 'A_N (Enolat)', transformation: '2 R–CH₂–CHO → β-Hydroxyaldehyd',
  rx: (() => {
    const a = (() => { const m = new Mol(); alphaCarbonyl(m, 0, 0, 'R₁', 'H'); return m; })();
    const a2 = (() => { const m = new Mol(); alphaCarbonyl(m, 0, 0, 'R₂', 'H'); return m; })();
    const b = (() => {
      const m = new Mol();
      // Left half: the former nucleophile, α-C now bonded to the new C.
      const r1 = m.gen(0, 0, 'R₁');
      const ca = m.add(DX, DY, 'C');
      const c1 = m.add(2 * DX, 0, 'C');
      const o1 = m.add(2 * DX, -B, 'O');
      const h1 = m.gen(3 * DX, DY, 'H');
      m.bond(r1, ca, 1); m.bond(ca, c1, 1); m.bond(c1, o1, 2); m.bond(c1, h1, 1);
      // The new C–C bond runs up-left from the α-C to the former carbonyl C.
      const cb = m.add(DX, DY + B, 'C');
      const oh = m.add(DX - DX, DY + B + DY, 'O');
      const r2 = m.gen(DX + DX, DY + B + DY, 'R₂');
      m.bond(ca, cb, 1); m.bond(cb, oh, 1); m.bond(cb, r2, 1);
      return m;
    })();
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'NaOH (kat.)', below: 'H_2O, 0–5 °C',
  conditions: 'Katalytische Base (NaOH, NaOEt, LDA) oder Säure; bei niedriger Temperatur bleibt es beim Aldol.',
  stereochemistry: 'Bis zu zwei neue Stereozentren; mit Evans-Auxiliaren oder (S)-Prolin steuerbar.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · das Nucleophil BRAUCHT ein α-H, das Elektrophil nicht',
  key_points: [
    'Die Base erzeugt aus dem α-H ein mesomeriestabilisiertes ENOLAT, das als C-Nucleophil das zweite Carbonyl angreift.',
    'Das Produkt ist ein β-Hydroxycarbonyl — die OH-Gruppe steht immer in β-Stellung zum C=O.',
    'Reversibel: unter drastischeren Bedingungen läuft die Retro-Aldol-Reaktion.',
    'Eine GEKREUZTE Aldolreaktion ist nur sinnvoll, wenn ein Partner kein α-H hat (Benzaldehyd, Methanal) oder wenn man das Enolat mit LDA vorbildet.'
  ],
  seen_in: 'Mechanismus-Aufgabe (Aldol basisch), BW 2022 (Z-Jasmon), BW 2026 (Adrenosteron, Thymol)'
});

R({
  id: 'aldol-kondensation', category: C_EN, name: 'Aldol-Kondensation',
  difficulty: 'B', reaktionstyp: 'A_N + E1cb', transformation: 'β-Hydroxycarbonyl → α,β-ungesättigtes Carbonyl',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r1 = m.gen(0, 0, 'R₁');
      const ca = m.add(DX, DY, 'C');
      const c1 = m.add(2 * DX, 0, 'C');
      const o1 = m.add(2 * DX, -B, 'O');
      const h1 = m.gen(3 * DX, DY, 'H');
      m.bond(r1, ca, 1); m.bond(ca, c1, 1); m.bond(c1, o1, 2); m.bond(c1, h1, 1);
      const cb = m.add(DX, DY + B, 'C');
      const oh = m.add(DX - DX, DY + B + DY, 'O');
      const r2 = m.gen(DX + DX, DY + B + DY, 'R₂');
      m.bond(ca, cb, 1); m.bond(cb, oh, 1); m.bond(cb, r2, 1);
      return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r1 = m.gen(0, 0, 'R₁');
      const ca = m.add(DX, DY, 'C');
      const c1 = m.add(2 * DX, 0, 'C');
      const o1 = m.add(2 * DX, -B, 'O');
      const h1 = m.gen(3 * DX, DY, 'H');
      m.bond(r1, ca, 1); m.bond(ca, c1, 1); m.bond(c1, o1, 2); m.bond(c1, h1, 1);
      const cb = m.add(DX, DY + B, 'C');
      const r2 = m.gen(DX + DX, DY + B + DY, 'R₂');
      m.bond(ca, cb, 2); m.bond(cb, r2, 1);   // C=C where the OH was lost
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'OH^- , Δ', below: '-H_2O',
  conditions: 'Dieselbe Base wie bei der Addition, aber warm — oder direkt sauer.',
  stereochemistry: 'Fast ausschließlich das (E)-konfigurierte Enon (konjugiert und sterisch günstiger).',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H',
  key_points: [
    'Das Aldol verliert Wasser über einen E1cb-Mechanismus: erst Deprotonierung am α-C, dann Abgang von OH⁻.',
    'Triebkraft ist die KONJUGATION des entstehenden C=C mit dem C=O.',
    'Die Wasserabspaltung gelingt hier viel leichter als bei einem gewöhnlichen Alkohol — deshalb erkennt man ein Aldolprodukt oft daran, dass es sofort weiterreagiert.',
    'Das Enon ist gleichzeitig ein Michael-Akzeptor und damit die Eintrittskarte zur Robinson-Anellierung.'
  ],
  seen_in: 'BW 2022 (Z-Jasmon), BW 2021 (Carvon), BW 2026 (Thymol aus Benzaldehyd, Adrenosteron)'
});

R({
  id: 'claisen-kondensation', category: C_EN, name: 'Claisen-Esterkondensation',
  difficulty: 'C', reaktionstyp: 'A_N + Eliminierung', transformation: '2 R–CH₂–CO₂Et → β-Ketoester',
  rx: (() => {
    const mkEster = (lbl) => {
      const m = new Mol();
      const r = m.gen(0, 0, lbl);
      const ca = m.add(DX, DY, 'C');
      const c = m.add(2 * DX, 0, 'C');
      const o1 = m.add(2 * DX, -B, 'O');
      const o2 = m.add(3 * DX, DY, 'O');
      const et = m.gen(4 * DX, 0, 'Et');
      m.bond(r, ca, 1); m.bond(ca, c, 1); m.bond(c, o1, 2); m.bond(c, o2, 1); m.bond(o2, et, 1);
      return m;
    };
    const b = (() => {
      const m = new Mol();
      const r1 = m.gen(0, 0, 'R₁');
      const ca = m.add(DX, DY, 'C');
      const c1 = m.add(2 * DX, 0, 'C');
      const o1 = m.add(2 * DX, -B, 'O');
      const oe = m.add(3 * DX, DY, 'O');
      const et = m.gen(4 * DX, 0, 'Et');
      m.bond(r1, ca, 1); m.bond(ca, c1, 1); m.bond(c1, o1, 2); m.bond(c1, oe, 1); m.bond(oe, et, 1);
      // The new ketone hangs off the α-C, pointing up.
      const ck = m.add(DX, DY + B, 'C');
      const ok = m.add(DX - DX, DY + B + DY, 'O');
      const r2 = m.gen(DX + DX, DY + B + DY, 'R₂');
      m.bond(ca, ck, 1); m.bond(ck, ok, 2); m.bond(ck, r2, 1);
      return m;
    })();
    return { reactants: [mkEster('R₁'), mkEster('R₂')], products: [b] };
  })(),
  above: '1. NaOEt (1 Äq.)', below: '2. H_3O^+ , -EtOH',
  conditions: 'Stöchiometrisches Alkoholat, dessen Alkylrest zum Ester passt (NaOEt zu Ethylestern — sonst Umesterung).',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · Et = Ethyl (oder Me bei Methylestern)',
  key_points: [
    'Der Unterschied zur Aldolreaktion: der Ester hat eine ABGANGSGRUPPE (OEt), deshalb folgt auf die Addition eine Eliminierung — es bleibt ein Keton statt eines Alkohols.',
    'Die Base wird STÖCHIOMETRISCH gebraucht: die eigentliche Triebkraft ist die Deprotonierung des sehr aciden β-Ketoesters am Ende (pK_s ≈ 11).',
    'Intramolekular heißt dieselbe Reaktion DIECKMANN-Kondensation und liefert cyclische β-Ketoester (bevorzugt Fünf- und Sechsringe).',
    'Der β-Ketoester ist der Einstieg in die Acetessigester-Synthese: alkylieren, verseifen, decarboxylieren.'
  ],
  seen_in: 'BW 2025 (Fettsäure-Biosynthese), BW 2020 (Aspidospermin), BW 2022 (Lysergsäure), BW 2013 (Grandisol)'
});

R({
  id: 'michael-addition', category: C_EN, name: 'Michael-Addition (1,4-Addition)',
  difficulty: 'C', reaktionstyp: 'A_N (konjugiert)', transformation: 'Enon + Nu⁻ → 1,5-Dicarbonyl',
  rx: (() => {
    const a = (() => {
      // Michael acceptor: C=C conjugated with C=O.
      const m = new Mol();
      const r1 = m.gen(0, 0, 'R₁');
      const cb = m.add(DX, DY, 'C');
      const ca = m.add(2 * DX, 0, 'C');
      const c = m.add(3 * DX, DY, 'C');
      const o = m.add(3 * DX, DY + B, 'O');
      const r2 = m.gen(4 * DX, 0, 'R₂');
      m.bond(r1, cb, 1); m.bond(cb, ca, 2); m.bond(ca, c, 1); m.bond(c, o, 2); m.bond(c, r2, 1);
      return m;
    })();
    const a2 = (() => { const m = new Mol(); m.gen(0, 0, 'Nu'); return m; })();
    const b = (() => {
      const m = new Mol();
      const r1 = m.gen(0, 0, 'R₁');
      const cb = m.add(DX, DY, 'C');
      const ca = m.add(2 * DX, 0, 'C');
      const c = m.add(3 * DX, DY, 'C');
      const o = m.add(3 * DX, DY + B, 'O');
      const r2 = m.gen(4 * DX, 0, 'R₂');
      const nu = m.gen(DX, DY + B, 'Nu');       // Nu lands on the β-C
      m.bond(r1, cb, 1); m.bond(cb, ca, 1); m.bond(ca, c, 1); m.bond(c, o, 2);
      m.bond(c, r2, 1); m.bond(cb, nu, 1);
      return m;
    })();
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'Nu^- (Malonat, Enamin, R_2CuLi)', below: 'EtOH  ·  1,4-Addition',
  conditions: 'Weiches, stabilisiertes Nucleophil mit katalytischer Base; Cuprate addieren ebenfalls 1,4.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · Nu⁻ = Malonat, Acetessigester, Enamin, Nitronat, RS⁻, R₂NH, R₂CuLi',
  key_points: [
    'Das Nucleophil greift NICHT den Carbonyl-C an, sondern den β-C — daher 1,4- oder konjugierte Addition.',
    'HARTE Nucleophile (RMgX, RLi, LiAlH₄) addieren dagegen 1,2 direkt ans C=O. Die Härte entscheidet, nicht das Substrat.',
    'Das Produkt ist ein 1,5-Dicarbonyl — genau das Motiv, das die Robinson-Anellierung im zweiten Schritt cyclisiert.',
    'Biochemisch verwandt: die konjugierte Addition an Fumarat in der Fumarase-Reaktion.'
  ],
  seen_in: 'BW 2022 (Cantharidin), BW 2026 (Adrenosteron), BW 2020 (Aspidospermin), BW 2023 (Hirsuten)'
});

R({
  id: 'robinson-anellierung', category: C_EN, name: 'Robinson-Anellierung',
  difficulty: 'D', reaktionstyp: 'Michael + Aldol', transformation: 'Keton + MVK → Cyclohexenon',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r1 = m.gen(0, 0, 'R₁');
      const ca = m.add(DX, DY, 'C');
      const c = m.add(2 * DX, 0, 'C');
      const o = m.add(2 * DX, -B, 'O');
      const r2 = m.gen(3 * DX, DY, 'R₂');
      m.bond(r1, ca, 1); m.bond(ca, c, 1); m.bond(c, o, 2); m.bond(c, r2, 1);
      return m;
    })();
    const a2 = (() => {
      // Methyl vinyl ketone.
      const m = new Mol();
      const cv = m.add(0, 0, 'C');
      const cb = m.add(DX, DY, 'C');
      const c = m.add(2 * DX, 0, 'C');
      const o = m.add(2 * DX, -B, 'O');
      const me = m.add(3 * DX, DY, 'C');
      m.bond(cv, cb, 2); m.bond(cb, c, 1); m.bond(c, o, 2); m.bond(c, me, 1);
      return m;
    })();
    const b = (() => {
      // Cyclohexenone: six-ring, node bottom, with the enone inside.
      const m = new Mol();
      const v = m.ring(6, 0, 0);
      // v[0]=30°, v[1]=90°, v[2]=150°, v[3]=210°, v[4]=270°, v[5]=330°
      m.bonds.find(b2 => (b2.a === v[1] && b2.b === v[2]) || (b2.a === v[2] && b2.b === v[1])).order = 2;
      const op = m.radial(0, 0, v[0], B);
      const o = m.add(op[0], op[1], 'O');
      m.bond(v[0], o, 2);
      const rp = m.radial(0, 0, v[3], B);
      const r1 = m.gen(rp[0], rp[1], 'R₁');
      m.bond(v[3], r1, 1);
      return m;
    })();
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'CH_2=CH-CO-CH_3 (MVK)', below: 'NaOH / KOH, Δ',
  conditions: 'Base im Überschuss, warm — Michael-Addition und intramolekulare Aldolkondensation laufen in einem Topf.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · statt MVK jeder Michael-Akzeptor mit endständiger CH₂=CH-Gruppe',
  key_points: [
    'Drei Schritte in einem Topf: (1) Michael-Addition, (2) intramolekulare Aldol-Addition, (3) Wasserabspaltung.',
    'Ergebnis ist immer ein anelliertes Cyclohex-2-enon — der Standardzugang zum Steroid- und Terpengerüst.',
    'Die enantioselektive Variante mit (S)-Prolin ist die Hajos-Parrish/Wieland-Miescher-Reaktion, der Einstieg in Steroidsynthesen.',
    'In Klausuren erkennt man sie am Reagenzienpaar „Keton + MVK + Base".'
  ],
  seen_in: 'BW 2026 (Adrenosteron, (S)-Prolin), BW 2020 (Aspidospermin), BW 2023 (Hirsuten)'
});

R({
  id: 'mannich', category: C_EN, name: 'Mannich-Reaktion',
  difficulty: 'C', reaktionstyp: 'A_N (Iminium)', transformation: 'Keton + CH₂O + R₂NH → β-Aminoketon',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r1 = m.gen(0, 0, 'R₁');
      const ca = m.add(DX, DY, 'C');
      const c = m.add(2 * DX, 0, 'C');
      const o = m.add(2 * DX, -B, 'O');
      const r2 = m.gen(3 * DX, DY, 'R₂');
      m.bond(r1, ca, 1); m.bond(ca, c, 1); m.bond(c, o, 2); m.bond(c, r2, 1);
      return m;
    })();
    const a2 = (() => {
      const m = new Mol();
      const c = m.add(0, 0, 'C'); const o = m.add(0, B, 'O');
      m.bond(c, o, 2); return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r1 = m.gen(0, 0, 'R₁');
      const ca = m.add(DX, DY, 'C');
      const c = m.add(2 * DX, 0, 'C');
      const o = m.add(2 * DX, -B, 'O');
      const r2 = m.gen(3 * DX, DY, 'R₂');
      m.bond(r1, ca, 1); m.bond(ca, c, 1); m.bond(c, o, 2); m.bond(c, r2, 1);
      // The aminomethyl arm grows upward off the α-C.
      const cm = m.add(DX, DY + B, 'C');
      const n = m.add(DX + DX, DY + B + DY, 'N');
      const r3 = m.gen(DX + DX, DY + B + DY + B, 'R₃');
      const r4 = m.gen(DX + 2 * DX, DY + B, 'R₄');
      m.bond(ca, cm, 1); m.bond(cm, n, 1); m.bond(n, r3, 1); m.bond(n, r4, 1);
      return m;
    })();
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'CH_2O + R_3R_4NH', below: 'H^+ (kat.)',
  conditions: 'Formaldehyd und sekundäres (oder primäres) Amin, schwach sauer.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · R₃, R₄ = Alkyl, H · statt CH₂O auch andere Aldehyde',
  key_points: [
    'Das eigentliche Elektrophil ist das IMINIUM-Ion CH₂=NR₂⁺ aus Aldehyd + Amin — deutlich reaktiver als der Aldehyd selbst.',
    'Das Enol des Ketons greift dieses Iminium an; Ergebnis ist eine β-Aminocarbonylverbindung (Mannich-Base).',
    'Die Mannich-Base eliminiert leicht zum Enon und ist so eine geschützte Michael-Akzeptor-Vorstufe.',
    'Biomimetisch enorm wichtig: Tropinon (Robinson-Synthese) und viele Alkaloide entstehen über genau diese Verknüpfung.'
  ],
  seen_in: 'BW 2017 (Atropin, Ferruginin — Tropinon), BW 2020 (Aspidospermin)'
});

R({
  id: 'knoevenagel', category: C_EN, name: 'Knoevenagel-Kondensation',
  difficulty: 'C', reaktionstyp: 'A_N + Kondensation', transformation: 'R–CHO + CH-acide Verbindung → Alken',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      const o = m.add(DX, DY + B, 'O'); const h = m.gen(2 * DX, 0, 'H');
      m.bond(r, c, 1); m.bond(c, o, 2); m.bond(c, h, 1); return m;
    })();
    const a2 = (() => {
      const m = new Mol();
      const c = m.add(0, 0, 'C');
      const z1 = m.gen(-DX, DY, 'Z₁'); const z2 = m.gen(DX, DY, 'Z₂');
      m.bond(c, z1, 1); m.bond(c, z2, 1); return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c1 = m.add(DX, DY, 'C');
      const h = m.gen(DX, DY + B, 'H');
      const c2 = m.add(2 * DX, 0, 'C');
      const z1 = m.gen(2 * DX, -B, 'Z₁'); const z2 = m.gen(3 * DX, DY, 'Z₂');
      m.bond(r, c1, 1); m.bond(c1, h, 1); m.bond(c1, c2, 2); m.bond(c2, z1, 1); m.bond(c2, z2, 1);
      return m;
    })();
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'Base (Piperidin, Pyridin)', below: '-H_2O',
  conditions: 'Schwache Aminbase, oft Piperidin in Pyridin; Wasser wird abgeschieden.',
  substituents: 'R₁ = Alkyl, Aryl · Z₁, Z₂ = elektronenziehend: –CO₂R, –CN, –NO₂, –COR (Malonester, Cyanessigester, Meldrumsäure)',
  key_points: [
    'Die CH-acide Komponente hat ZWEI elektronenziehende Gruppen — ihr Carbanion ist so stabil, dass eine schwache Aminbase genügt.',
    'Anders als die Aldolkondensation braucht sie weder starke Base noch hohe Temperatur.',
    'Mit Malonsäure schließt sich meist direkt eine Decarboxylierung an (Doebner-Variante) → Zimtsäure-Typ.',
    'So entstehen Kaffeesäure, Zimtsäure und verwandte Phenylpropanoide.'
  ],
  seen_in: 'BW 2018 (Kaffeesäure), BW 2021 (Capsaicin), LW 2022 (Elemicin)'
});

R({
  id: 'malonester-synthese', category: C_EN, name: 'Malonester- und Acetessigester-Synthese',
  difficulty: 'C', reaktionstyp: 'S_N2 + Decarboxylierung', transformation: 'Malonester → R–CH₂–COOH',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const c = m.add(0, 0, 'C');
      const z = m.gen(-DX, DY, 'Z');
      const c2 = m.add(DX, DY, 'C');
      const o1 = m.add(DX, DY + B, 'O');
      const o2 = m.add(2 * DX, 0, 'O');
      const et = m.gen(3 * DX, DY, 'Et');
      m.bond(c, z, 1); m.bond(c, c2, 1); m.bond(c2, o1, 2); m.bond(c2, o2, 1); m.bond(o2, et, 1);
      return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁');
      const ca = m.add(DX, DY, 'C');
      const z = m.gen(DX, DY + B, 'Z');
      const c = m.add(2 * DX, 0, 'C');
      const o1 = m.add(2 * DX, -B, 'O');
      const o2 = m.add(3 * DX, DY, 'O');
      m.bond(r, ca, 1); m.bond(ca, z, 1); m.bond(ca, c, 1);
      m.bond(c, o1, 2); m.bond(c, o2, 1);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: '1. NaOEt  2. R_1-X', below: '3. H_3O^+ , Δ  (-CO_2)',
  conditions: 'Deprotonieren (NaOEt), alkylieren (S_N2 mit R–X), verseifen und schließlich decarboxylieren durch Erhitzen.',
  substituents: 'Z = –CO₂Et (Malonester → Carbonsäure) oder –CO–CH₃ (Acetessigester → Methylketon) · R₁ = primäres Alkyl · X = Br, I, OTs',
  key_points: [
    'Das doppelt aktivierte C–H hat pK_s ≈ 11–13 und ist mit Alkoholat vollständig deprotonierbar.',
    'Die Decarboxylierung gelingt nur, weil eine β-STÄNDIGE Carbonylgruppe da ist — über einen cyclischen sechsgliedrigen Übergangszustand.',
    'Zweimal alkylieren ergibt die α,α-disubstituierte Säure bzw. das entsprechende Keton.',
    'Merksatz: Malonester → Essigsäure-Derivat, Acetessigester → Aceton-Derivat.'
  ],
  seen_in: 'BW 2020 (Aspidospermin), BW 2013 (Grandisol), BW 2022 (Lysergsäure)'
});

R({
  id: 'stork-enamin-alkylierung', category: C_EN, name: 'Stork-Enamin-Alkylierung',
  difficulty: 'D', reaktionstyp: 'Enamin-Alkylierung', transformation: 'Keton → α-alkyliertes Keton',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r1 = m.gen(0, 0, 'R₁');
      const ca = m.add(DX, DY, 'C');
      const c = m.add(2 * DX, 0, 'C');
      const n = m.add(2 * DX, -B, 'N');
      const r2 = m.gen(3 * DX, DY, 'R₂');
      const n1 = m.gen(DX, -B - DY, 'R₃');
      const n2 = m.gen(3 * DX, -B - DY, 'R₄');
      m.bond(r1, ca, 1); m.bond(ca, c, 2); m.bond(c, n, 1); m.bond(c, r2, 1);
      m.bond(n, n1, 1); m.bond(n, n2, 1);
      return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r1 = m.gen(0, 0, 'R₁');
      const ca = m.add(DX, DY, 'C');
      const c = m.add(2 * DX, 0, 'C');
      const o = m.add(2 * DX, -B, 'O');
      const r2 = m.gen(3 * DX, DY, 'R₂');
      const r5 = m.gen(DX, DY + B, 'R₅');
      m.bond(r1, ca, 1); m.bond(ca, c, 1); m.bond(c, o, 2); m.bond(c, r2, 1); m.bond(ca, r5, 1);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: '1. R_5-X  bzw. Michael-Akzeptor', below: '2. H_3O^+   (Hydrolyse)',
  conditions: 'Enamin (aus Keton + Pyrrolidin) mit reaktivem Halogenid oder Michael-Akzeptor, danach wässrige Hydrolyse.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · R₃, R₄ = Pyrrolidin/Morpholin-Ring · R₅ = Allyl, Benzyl, α-Halogencarbonyl',
  key_points: [
    'Das Enamin ersetzt das Enolat: es ist neutral, es braucht keine starke Base und es alkyliert nur EINMAL.',
    'Genau das ist der Vorteil — ein echtes Enolat würde mehrfach alkylieren, weil das Produkt weiter deprotonierbar bleibt.',
    'Der Zyklus ist immer: Enamin bilden → alkylieren/acylieren → hydrolysieren zurück zum Keton.',
    'Regioselektiv bevorzugt das Enamin die WENIGER substituierte Seite (sterisch), was thermodynamische Enolate nicht tun.'
  ],
  seen_in: 'BW 2020 (Aspidospermin — Stork-Synthese 1963), BW 2022 (Cantharidin, Pyrrolidin)'
});

R({
  id: 'reformatsky', category: C_EN, name: 'Reformatsky-Reaktion',
  difficulty: 'C', reaktionstyp: 'A_N (Zink-Enolat)', transformation: 'α-Bromester + R₂C=O → β-Hydroxyester',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const br = m.add(0, 0, 'Br');
      const ca = m.add(DX, DY, 'C');
      const c = m.add(2 * DX, 0, 'C');
      const o1 = m.add(2 * DX, -B, 'O');
      const o2 = m.add(3 * DX, DY, 'O');
      const et = m.gen(4 * DX, 0, 'Et');
      m.bond(br, ca, 1); m.bond(ca, c, 1); m.bond(c, o1, 2); m.bond(c, o2, 1); m.bond(o2, et, 1);
      return m;
    })();
    const a2 = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      const o = m.add(DX, DY + B, 'O'); const z = m.gen(2 * DX, 0, 'R₂');
      m.bond(r, c, 1); m.bond(c, o, 2); m.bond(c, z, 1); return m;
    })();
    const b = (() => {
      const m = new Mol();
      const ca = m.add(DX, DY, 'C');
      const c = m.add(2 * DX, 0, 'C');
      const o1 = m.add(2 * DX, -B, 'O');
      const o2 = m.add(3 * DX, DY, 'O');
      const et = m.gen(4 * DX, 0, 'Et');
      m.bond(ca, c, 1); m.bond(c, o1, 2); m.bond(c, o2, 1); m.bond(o2, et, 1);
      // The former carbonyl C, now carrying OH, R₁ and R₂.
      const cb = m.add(DX, DY + B, 'C');
      const oh = m.add(DX - DX, DY + B + DY, 'O');
      const r1 = m.gen(DX, DY + 2 * B, 'R₁');
      const r2 = m.gen(DX + DX, DY + B + DY, 'R₂');
      m.bond(ca, cb, 1); m.bond(cb, oh, 1); m.bond(cb, r1, 1); m.bond(cb, r2, 1);
      return m;
    })();
    return { reactants: [a, a2], products: [b] };
  })(),
  above: '1. Zn', below: '2. H_3O^+',
  conditions: 'Zinkstaub in Ether/Benzol; das Zink-Enolat ist deutlich milder als ein Grignard-Reagenz.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · Et = Ethyl · statt Br auch I',
  key_points: [
    'Das Zink-Enolat ist so wenig basisch, dass es die Esterfunktion im eigenen Molekül NICHT angreift — ein Grignard-Reagenz würde sich selbst zerstören.',
    'Damit lässt sich gezielt ein β-Hydroxyester aufbauen, also ein Aldol-Produkt auf der Esterstufe.',
    'Wasserabspaltung liefert anschließend den α,β-ungesättigten Ester.',
    'Historisch die erste Methode für gekreuzte Aldol-artige Reaktionen mit definierter Regiochemie.'
  ],
  seen_in: 'BW 2019 (Abscisinsäure, Zn + Bromester), BW 2020 (Bergamoten)'
});

R({
  id: 'henry-nitroaldol', category: C_EN, name: 'Henry-Reaktion (Nitroaldol)',
  difficulty: 'C', reaktionstyp: 'A_N (Nitronat)', transformation: 'R–CHO + R′CH₂NO₂ → β-Nitroalkohol',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      const o = m.add(DX, DY + B, 'O'); const h = m.gen(2 * DX, 0, 'H');
      m.bond(r, c, 1); m.bond(c, o, 2); m.bond(c, h, 1); return m;
    })();
    const a2 = (() => {
      const m = new Mol();
      const c = m.add(0, 0, 'C');
      const n = m.add(DX, DY, 'N');
      const o1 = m.add(DX, DY + B, 'O');
      const o2 = m.add(2 * DX, 0, 'O');
      m.bond(c, n, 1); m.bond(n, o1, 2); m.bond(n, o2, 1);
      m.charge(n, 1); m.charge(o2, -1);
      return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁');
      const cb = m.add(DX, DY, 'C');
      const oh = m.add(DX, DY + B, 'O');
      const ca = m.add(2 * DX, 0, 'C');
      const n = m.add(3 * DX, DY, 'N');
      const o1 = m.add(3 * DX, DY + B, 'O');
      const o2 = m.add(4 * DX, 0, 'O');
      m.bond(r, cb, 1); m.bond(cb, oh, 1); m.bond(cb, ca, 1);
      m.bond(ca, n, 1); m.bond(n, o1, 2); m.bond(n, o2, 1);
      m.charge(n, 1); m.charge(o2, -1);
      return m;
    })();
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'R′CH_2NO_2 , Base', below: 'EtOH, 0 °C',
  conditions: 'Katalytische Base (NaOEt, Et₃N, KF); das Nitroalkan ist mit pK_s ≈ 10 CH-acide genug.',
  stereochemistry: 'Zwei benachbarte Stereozentren; mit Cu-Bisoxazolin-Katalysatoren enantioselektiv führbar.',
  substituents: 'R₁ = Alkyl, Aryl · R′ = H, Alkyl',
  key_points: [
    'Die Nitrogruppe ist die stärkste gängige CH-aktivierende Gruppe — deshalb genügt eine milde Base.',
    'Das Produkt ist vielseitig: Reduktion (H₂/Pd) gibt den 1,2-Aminoalkohol, Nef-Reaktion gibt das Carbonyl, Dehydratisierung das Nitroalken.',
    'Über den Weg zum 1,2-Aminoalkohol entstehen Sympathomimetika und Chloramphenicol.',
    'In Klausuren an der Kombination „Aldehyd + Nitroalkan + Base" zu erkennen.'
  ],
  seen_in: 'BW 2016 (Chloramphenicol), BW 2021 (Capsaicin-Vorstufen)'
});

};
