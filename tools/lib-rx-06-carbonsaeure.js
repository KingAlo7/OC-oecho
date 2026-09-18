/* Reaction library — Carbonsäuren und ihre Derivate.

   House orientation: the acyl carbon sits at the same point in reactant
   and product, C=O pointing UP, R₁ to the lower left and the leaving
   group / nucleophile to the lower right — so across the whole category
   only the group on the right changes. */

module.exports = function (ctx) {
const { R, Mol, B, DX, DY } = ctx;

const C_CS = 'Carbonsäuren & Derivate';

/* R₁–CO–Y with the acyl carbon always at (DX, DY).
   `y` is either {sym:'O'} for a real atom or {label:'X'} for a generic. */
function acyl(m, leftLabel, y) {
  const r = m.gen(0, 0, leftLabel);
  const c = m.add(DX, DY, 'C');
  const o = m.add(DX, DY + B, 'O');
  m.bond(r, c, 1); m.bond(c, o, 2);
  let yi = null;
  if (y && y.label) yi = m.gen(2 * DX, 0, y.label);
  else if (y && y.sym) yi = m.add(2 * DX, 0, y.sym);
  if (yi !== null) m.bond(c, yi, 1);
  return { r, c, o, y: yi };
}

const acid = () => { const m = new Mol(); acyl(m, 'R₁', { sym: 'O' }); return m; };

R({
  id: 'fischer-veresterung', category: C_CS, name: 'Fischer-Veresterung',
  difficulty: 'A', reaktionstyp: 'A_N + Eliminierung', transformation: 'R₁–COOH + R₂–OH ⇌ R₁–CO–OR₂',
  rx: (() => {
    const a = acid();
    const a2 = (() => { const m = new Mol();
      const r = m.gen(0, 0, 'R₂'); const o = m.add(DX, DY, 'O'); m.bond(r, o, 1); return m; })();
    const b = (() => {
      const m = new Mol();
      const p = acyl(m, 'R₁', { sym: 'O' });
      const r2 = m.gen(3 * DX, DY, 'R₂');
      m.bond(p.y, r2, 1);
      return m;
    })();
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'R_2-OH , H^+ (kat.)', below: 'Δ, -H_2O  (Gleichgewicht)',
  conditions: 'Katalytische H₂SO₄ oder TsOH, Alkohol im Überschuss oder Wasser auskreisen.',
  substituents: 'R₁ = Alkyl, Aryl · R₂ = primäres/sekundäres Alkyl (tertiär eliminiert stattdessen)',
  key_points: [
    'Ein GLEICHGEWICHT — es muss durch Alkoholüberschuss oder Wasserentzug (Wasserabscheider) auf die Produktseite gezwungen werden.',
    'Der Mechanismus ist PADPED: Protonierung, Addition, Deprotonierung, Protonierung, Eliminierung, Deprotonierung.',
    'Das Wasser stammt aus dem OH der SÄURE, nicht des Alkohols — mit ¹⁸O-markiertem Alkohol bleibt die Markierung im Ester.',
    'Für schwierige Fälle nimmt man den reaktiveren Weg über das Säurechlorid oder eine DCC-Kupplung.'
  ],
  seen_in: 'LW 2024 (GHB → GBL), BW 2023 (Benzocain), BW 2018 (Kaffeesäure-Ester), BW 2018 (Lactid/PLA)'
});

R({
  id: 'esterhydrolyse', category: C_CS, name: 'Esterhydrolyse / Verseifung',
  difficulty: 'A', reaktionstyp: 'A_N + Eliminierung', transformation: 'R₁–CO–OR₂ → R₁–COOH + R₂–OH',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const p = acyl(m, 'R₁', { sym: 'O' });
      const r2 = m.gen(3 * DX, DY, 'R₂');
      m.bond(p.y, r2, 1);
      return m;
    })();
    const b = acid();
    const b2 = (() => { const m = new Mol();
      const r = m.gen(0, 0, 'R₂'); const o = m.add(DX, DY, 'O'); m.bond(r, o, 1); return m; })();
    return { reactants: [a], products: [b, b2] };
  })(),
  above: 'NaOH / H_2O, Δ', below: 'dann H_3O^+',
  conditions: 'Basisch (Verseifung, irreversibel) oder sauer (Gleichgewicht, Umkehr der Fischer-Veresterung).',
  substituents: 'R₁ = Alkyl, Aryl · R₂ = Alkyl',
  key_points: [
    'BASISCH ist die Reaktion irreversibel: die Säure wird sofort zum Carboxylat deprotoniert, das kein Elektrophil mehr ist.',
    'Deshalb braucht die Verseifung stöchiometrische Base, die saure Hydrolyse dagegen nur katalytisch Säure.',
    'Die Seifenherstellung aus Fetten ist genau diese Reaktion (daher der Name).',
    'Die Reaktivitätsreihe der Derivate ist immer: Säurechlorid > Anhydrid > Ester ≈ Säure > Amid > Carboxylat.'
  ],
  seen_in: 'BW 2018 (Lactid/PLA), BW 2016 (Penicillin V), BW 2024 (Tyr-Asp-Dipeptid)'
});

R({
  id: 'saeurechlorid', category: C_CS, name: 'Carbonsäure → Säurechlorid',
  difficulty: 'A', reaktionstyp: 'Substitution', transformation: 'R₁–COOH → R₁–COCl',
  rx: (() => {
    const a = acid();
    const b = (() => { const m = new Mol(); acyl(m, 'R₁', { sym: 'Cl' }); return m; })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'SOCl_2', below: 'bzw. (COCl)_2  ·  PCl_5',
  conditions: 'Thionylchlorid (meist mit kat. DMF), Oxalylchlorid oder PCl₅; Nebenprodukte sind gasförmig.',
  substituents: 'R₁ = Alkyl, Aryl',
  key_points: [
    'Aktiviert die trägste brauchbare Acylstufe zur REAKTIVSTEN — das Säurechlorid reagiert mit praktisch jedem Nucleophil.',
    'Der Standardeinstieg in Ester, Amide und Anhydride, wenn das Gleichgewicht der direkten Kondensation ungünstig liegt.',
    'Auch der Acylierungspartner für die Friedel-Crafts-Acylierung.',
    'Sehr feuchtigkeitsempfindlich — Säurechloride hydrolysieren an Luft zurück zur Säure.'
  ],
  seen_in: 'BW 2023 (Ibuprofen, Lidocain), BW 2016 (Penicillin V), LW 2018 (Oxybuprocain)'
});

R({
  id: 'amidbildung', category: C_CS, name: 'Amidbildung (Schotten-Baumann)',
  difficulty: 'A', reaktionstyp: 'A_N + Eliminierung', transformation: 'R₁–COCl + R₂NH₂ → R₁–CO–NH–R₂',
  rx: (() => {
    const a = (() => { const m = new Mol(); acyl(m, 'R₁', { sym: 'Cl' }); return m; })();
    const a2 = (() => { const m = new Mol();
      const r = m.gen(0, 0, 'R₂'); const n = m.add(DX, DY, 'N'); m.bond(r, n, 1); return m; })();
    const b = (() => {
      const m = new Mol();
      const p = acyl(m, 'R₁', { sym: 'N' });
      const r2 = m.gen(3 * DX, DY, 'R₂');
      m.bond(p.y, r2, 1);
      return m;
    })();
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'R_2-NH_2', below: 'NaOH bzw. NEt_3 , 0 °C',
  conditions: 'Säurechlorid oder Anhydrid mit dem Amin, Hilfsbase (NaOH, Pyridin, NEt₃) fängt das HCl ab.',
  substituents: 'R₁ = Alkyl, Aryl · R₂ = Alkyl, Aryl, H; auch sekundäre Amine',
  key_points: [
    'Zwei Äquivalente Amin oder eine Hilfsbase sind nötig — sonst protoniert das entstehende HCl das Amin und stoppt die Reaktion.',
    'Das Amid ist das STABILSTE Säurederivat: die N-Mesomerie senkt die Elektrophilie des Carbonyl-C stark.',
    'Genau diese Mesomerie macht die Peptidbindung planar und rotationsgehemmt.',
    'Direkt aus Säure + Amin geht es nur bei hoher Temperatur oder mit einem Kupplungsreagenz (DCC, EDC).'
  ],
  seen_in: 'BW 2023 (Lidocain, Benzocain), BW 2021 (Capsaicin), LW 2018 (Oxybuprocain), LW 2026 (Fentanyl)'
});

R({
  id: 'peptidkupplung-dcc', category: C_CS, name: 'Peptidkupplung mit DCC',
  difficulty: 'C', reaktionstyp: 'Aktivierung + A_N', transformation: 'R₁–COOH + R₂NH₂ → R₁–CO–NH–R₂',
  rx: (() => {
    const a = acid();
    const a2 = (() => { const m = new Mol();
      const r = m.gen(0, 0, 'R₂'); const n = m.add(DX, DY, 'N'); m.bond(r, n, 1); return m; })();
    const b = (() => {
      const m = new Mol();
      const p = acyl(m, 'R₁', { sym: 'N' });
      const r2 = m.gen(3 * DX, DY, 'R₂');
      m.bond(p.y, r2, 1);
      return m;
    })();
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'DCC  bzw. EDC / HOBt', below: 'CH_2Cl_2 , 0 °C',
  conditions: 'Dicyclohexylcarbodiimid in CH₂Cl₂/DMF; der Dicyclohexylharnstoff fällt aus und wird abfiltriert.',
  stereochemistry: 'Racemisierungsgefahr am aktivierten α-C — HOBt/HOAt unterdrücken sie.',
  substituents: 'R₁, R₂ = Aminosäure-Reste (mit geschützten Seitenketten) oder beliebige Alkyl/Aryl-Reste',
  key_points: [
    'DCC verwandelt die OH-Gruppe der Säure in einen O-Acylisoharnstoff — eine sehr gute Abgangsgruppe.',
    'Triebkraft ist die Bildung des extrem stabilen Harnstoffs (C=N wird zu C=O).',
    'Erlaubt die Amidbildung unter milden, neutralen Bedingungen, ohne den Umweg über das Säurechlorid.',
    'In der Peptidsynthese unverzichtbar, weil Säurechloride die Stereozentren racemisieren würden.'
  ],
  seen_in: 'BW 2024 (Tyr-Asp-Dipeptid, Kupplungsreagenz), BW 2022 (Self-Splicing)'
});

R({
  id: 'boc-schutz', category: C_CS, name: 'Boc-Schutzgruppe für Amine',
  difficulty: 'B', reaktionstyp: 'A_N + Eliminierung', transformation: 'R–NH₂ → R–NH–Boc',
  rx: (() => {
    const a = (() => { const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const n = m.add(DX, DY, 'N'); m.bond(r, n, 1); return m; })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁');
      const n = m.add(DX, DY, 'N');
      const c = m.add(2 * DX, 0, 'C');
      const o1 = m.add(2 * DX, -B, 'O');
      const o2 = m.add(3 * DX, DY, 'O');
      const t = m.gen(4 * DX, 0, 'tBu');
      m.bond(r, n, 1); m.bond(n, c, 1); m.bond(c, o1, 2); m.bond(c, o2, 1); m.bond(o2, t, 1);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'Boc_2O', below: 'NEt_3   (ab: TFA)',
  conditions: 'Di-tert-butyldicarbonat mit Base; Abspaltung mit Trifluoressigsäure oder HCl/Dioxan.',
  substituents: 'R₁ = Alkyl, Aryl · tBu = tert-Butyl',
  key_points: [
    'Das Carbamat nimmt dem N-Atom die Nucleophilie und Basizität — es stört danach in keiner Folgereaktion mehr.',
    'Abspaltung SAUER und sehr sauber: es entstehen nur CO₂ und Isobuten, beides gasförmig.',
    'Komplementär zu Cbz (H₂/Pd, hydrogenolytisch) und Fmoc (Piperidin, basisch) — orthogonale Schutzgruppenstrategie.',
    'In der Peptidsynthese wird immer ein Partner am N und einer am C geschützt, damit nur die gewünschte Bindung entsteht.'
  ],
  seen_in: 'BW 2024 (Tyr-Asp-Dipeptid, Boc₂O), BW 2016 (Penicillin V)'
});

R({
  id: 'lactonbildung', category: C_CS, name: 'Lactonbildung (intramolekulare Veresterung)',
  difficulty: 'B', reaktionstyp: 'A_N + Eliminierung', transformation: 'γ-Hydroxysäure → γ-Lacton',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const o = m.add(0, 0, 'O');
      const c4 = m.add(DX, DY, 'C');
      const c3 = m.add(2 * DX, 0, 'C');
      const c2 = m.add(3 * DX, DY, 'C');
      const c1 = m.add(4 * DX, 0, 'C');
      const od = m.add(4 * DX, -B, 'O');
      const oh = m.add(5 * DX, DY, 'O');
      m.bond(o, c4, 1); m.bond(c4, c3, 1); m.bond(c3, c2, 1); m.bond(c2, c1, 1);
      m.bond(c1, od, 2); m.bond(c1, oh, 1);
      return m;
    })();
    const b = (() => {
      // γ-Butyrolactone: five-ring with the carbonyl inside and =O outward.
      const m = new Mol();
      const v = m.ring(5, 0, 0);
      const rr = v.r;
      // v[0] is the bottom node; make v[1] the carbonyl C and v[2] the ring O.
      m.atoms[v[2]].sym = 'O';
      const op = m.radial(0, 0, v[1], B);
      const o = m.add(op[0], op[1], 'O');
      m.bond(v[1], o, 2);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'H^+ (kat.)', below: 'Δ, -H_2O',
  conditions: 'Katalytische Säure, Wärme; bei γ- und δ-Hydroxysäuren läuft sie oft schon spontan.',
  substituents: 'Die Kettenlänge entscheidet: γ (5-Ring) und δ (6-Ring) bilden sich bereitwillig, β (4-Ring) und makrocyclische nur unter Zwang',
  key_points: [
    'Intramolekular gewinnt der Entropieterm — deshalb liegt das Gleichgewicht viel weiter rechts als bei der zwischenmolekularen Veresterung.',
    'Fünf- und Sechsringe bilden sich am schnellsten (geringste Ringspannung, günstige Cyclisierungsgeometrie).',
    'Makrolactone brauchen Hochverdünnung, sonst entsteht das Polyester-Oligomer.',
    'GHB → GBL ist genau dieser Ringschluss, und er ist in beide Richtungen pH-gesteuert.'
  ],
  seen_in: 'LW 2024 (GHB → GBL), BW 2024 (Merrilacton A), BW 2018 (Lactid/PLA)'
});

R({
  id: 'decarboxylierung', category: C_CS, name: 'Decarboxylierung von β-Ketosäuren',
  difficulty: 'B', reaktionstyp: 'Eliminierung', transformation: 'β-Ketosäure → Keton + CO₂',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁');
      const ck = m.add(DX, DY, 'C');
      const ok = m.add(DX, DY + B, 'O');
      const ca = m.add(2 * DX, 0, 'C');
      const c = m.add(3 * DX, DY, 'C');
      const o1 = m.add(3 * DX, DY + B, 'O');
      const o2 = m.add(4 * DX, 0, 'O');
      m.bond(r, ck, 1); m.bond(ck, ok, 2); m.bond(ck, ca, 1); m.bond(ca, c, 1);
      m.bond(c, o1, 2); m.bond(c, o2, 1);
      return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁');
      const ck = m.add(DX, DY, 'C');
      const ok = m.add(DX, DY + B, 'O');
      const ca = m.add(2 * DX, 0, 'C');
      m.bond(r, ck, 1); m.bond(ck, ok, 2); m.bond(ck, ca, 1);
      return m;
    })();
    const b2 = (() => {
      const m = new Mol();
      const o1 = m.add(0, 0, 'O'); const c = m.add(B, 0, 'C'); const o2 = m.add(2 * B, 0, 'O');
      m.bond(o1, c, 2); m.bond(c, o2, 2); return m;
    })();
    return { reactants: [a], products: [b, b2] };
  })(),
  above: 'Δ (ca. 150 °C)', below: '-CO_2',
  conditions: 'Einfaches Erhitzen; die β-Ketosäure entsteht meist in situ aus der Verseifung eines β-Ketoesters.',
  substituents: 'R₁ = Alkyl, Aryl · funktioniert auch mit Malonsäuren (β-Dicarbonsäuren)',
  key_points: [
    'Nur β-Ketosäuren und Malonsäuren decarboxylieren so leicht — eine gewöhnliche Carbonsäure tut das nicht.',
    'Grund ist ein cyclischer sechsgliedriger Übergangszustand, in dem das Carbonyl-O das saure H aufnimmt.',
    'Zwischenstufe ist das Enol, das zum Keton tautomerisiert.',
    'Der Abschlussschritt jeder Acetessigester- und Malonester-Synthese; biochemisch der Schritt im Citratzyklus und in der Fettsäurebiosynthese.'
  ],
  seen_in: 'BW 2025 (Fettsäure-Biosynthese), BW 2020 (Aspidospermin), BW 2018 (Kaffeesäure)'
});

R({
  id: 'nitrilhydrolyse', category: C_CS, name: 'Nitrilhydrolyse',
  difficulty: 'B', reaktionstyp: 'A_N + Eliminierung', transformation: 'R–C≡N → R–COOH',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁');
      const c = m.add(DX, DY, 'C');
      // C≡N linear with the C–C bond that carries it.
      const n = m.add(2 * DX, 2 * DY, 'N');
      m.bond(r, c, 1); m.bond(c, n, 3);
      return m;
    })();
    const b = acid();
    return { reactants: [a], products: [b] };
  })(),
  above: 'H_3O^+ , Δ', below: 'bzw. NaOH/H_2O, dann H^+',
  conditions: 'Kochen in verdünnter Säure oder Lauge; die Amidstufe lässt sich unter milderen Bedingungen abfangen.',
  substituents: 'R₁ = Alkyl, Aryl, Benzyl',
  key_points: [
    'Verläuft über das AMID als isolierbare Zwischenstufe — mild geführt bleibt es dort stehen.',
    'Zusammen mit der Nitrilsynthese aus R–X ergibt das die klassische C₁-Kettenverlängerung zur Carbonsäure.',
    'Mit LiAlH₄ statt Wasser entsteht stattdessen das primäre Amin R–CH₂–NH₂, mit DIBAL der Aldehyd.',
    'Das Nitril ist damit ein sehr flexibles Synthon: Säure, Amid, Amin oder Aldehyd, je nach Aufarbeitung.'
  ],
  seen_in: 'BW 2023 (Ibuprofen), BW 2016 (Trimethoprim), BW 2022 (Butanon-Reaktionen)'
});

R({
  id: 'anhydrid-acylierung', category: C_CS, name: 'Acylierung mit Anhydrid (Acetylierung)',
  difficulty: 'A', reaktionstyp: 'A_N + Eliminierung', transformation: 'R–OH bzw. R–NH₂ → Acetat bzw. Acetamid',
  rx: (() => {
    const a = (() => { const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const o = m.add(DX, DY, 'O'); m.bond(r, o, 1); return m; })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁');
      const o = m.add(DX, DY, 'O');
      const c = m.add(2 * DX, 0, 'C');
      const od = m.add(2 * DX, -B, 'O');
      const me = m.add(3 * DX, DY, 'C');
      m.bond(r, o, 1); m.bond(o, c, 1); m.bond(c, od, 2); m.bond(c, me, 1);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'Ac_2O (Essigsäureanhydrid)', below: 'Pyridin bzw. DMAP',
  conditions: 'Essigsäureanhydrid mit Pyridin oder kat. DMAP; auch Acetylchlorid.',
  substituents: 'R₁ = Alkyl, Aryl · dasselbe funktioniert mit Aminen (→ Acetamid) und Phenolen',
  key_points: [
    'Die gängigste Schutzgruppe für Alkohole und Amine — schnell drauf, mit NaOH/MeOH wieder ab.',
    'Bei Anilinen ist die Acetylierung vor einer Nitrierung Pflicht: sie dämpft die Aktivierung und verhindert, dass die Säure das Amin protoniert.',
    'DMAP beschleunigt enorm, weil es ein sehr reaktives N-Acylpyridinium-Ion bildet.',
    'Acetylsalicylsäure (Aspirin) entsteht genau so aus Salicylsäure.'
  ],
  seen_in: 'BW 2021 (Coffein), BW 2018 (Kaffeesäure), BW 2016 (Chloramphenicol), BW 2026 (Zucker)'
});

};
