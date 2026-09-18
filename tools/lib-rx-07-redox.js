/* Reaction library — Oxidation und Reduktion (ohne die schon in den
   Carbonyl- und Additions-Kapiteln geführten Fälle). */

module.exports = function (ctx) {
const { R, Mol, B, DX, DY } = ctx;

const C_RX = 'Oxidation & Reduktion';

R({
  id: 'prim-alkohol-zu-aldehyd', category: C_RX, name: 'Primärer Alkohol → Aldehyd (PCC / Swern / Dess-Martin)',
  difficulty: 'B', reaktionstyp: 'Oxidation', transformation: 'R–CH₂–OH → R–CHO',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C'); const o = m.add(2 * DX, 0, 'O');
      m.bond(r, c, 1); m.bond(c, o, 1); return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C'); const o = m.add(DX, DY + B, 'O');
      const h = m.gen(2 * DX, 0, 'H');
      m.bond(r, c, 1); m.bond(c, o, 2); m.bond(c, h, 1); return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'PCC / PDC', below: 'CH_2Cl_2 (wasserfrei!)',
  conditions: 'Pyridiniumchlorochromat (PCC) oder -dichromat (PDC) in wasserfreiem CH₂Cl₂; moderner Swern (DMSO/(COCl)₂/NEt₃, −78 °C) oder Dess-Martin-Periodinan.',
  substituents: 'R₁ = Alkyl, Aryl, Vinyl (C=C bleibt unangetastet)',
  key_points: [
    'Der entscheidende Punkt ist das FEHLEN von Wasser: in Wasser entsteht aus dem Aldehyd das Hydrat, das zur Säure weiteroxidiert wird.',
    'Deshalb stoppt PCC/PDC auf der Aldehydstufe, wässriges CrO₃ oder KMnO₄ dagegen nicht.',
    'Swern und Dess-Martin arbeiten chromfrei und sind für empfindliche Substrate die erste Wahl.',
    'Sekundäre Alkohole liefern mit allen diesen Reagenzien das Keton — dort gibt es kein Überoxidations-Problem.'
  ],
  seen_in: 'BW 2019 (Abscisinsäure, PDC), BW 2024 (Merrilacton A), BW 2020 (Prostaglandin)'
});

R({
  id: 'sek-alkohol-zu-keton', category: C_RX, name: 'Sekundärer Alkohol → Keton',
  difficulty: 'A', reaktionstyp: 'Oxidation', transformation: 'R₁R₂CH–OH → R₁R₂C=O',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      const o = m.add(DX, DY + B, 'O'); const z = m.gen(2 * DX, 0, 'R₂');
      m.bond(r, c, 1); m.bond(c, o, 1); m.bond(c, z, 1); return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      const o = m.add(DX, DY + B, 'O'); const z = m.gen(2 * DX, 0, 'R₂');
      m.bond(r, c, 1); m.bond(c, o, 2); m.bond(c, z, 1); return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'CrO_3 / H_2SO_4 (Jones)', below: 'bzw. K_2Cr_2O_7  ·  PCC  ·  MnO_2',
  conditions: 'Jones-Reagenz (CrO₃/H₂SO₄/Aceton), Dichromat, PCC oder — für allylische/benzylische Alkohole — MnO₂.',
  substituents: 'R₁, R₂ = Alkyl, Aryl (beide ≠ H, sonst entsteht ein Aldehyd)',
  key_points: [
    'Ein Keton hat am Carbonyl-C kein H mehr und kann deshalb nicht weiteroxidiert werden — anders als ein Aldehyd.',
    'Deshalb ist die Wahl des Oxidationsmittels hier unkritisch; auch wässrige Bedingungen sind erlaubt.',
    'TERTIÄRE Alkohole lassen sich gar nicht oxidieren (kein H am C–OH).',
    'MnO₂ ist selektiv für ALLYLISCHE und BENZYLISCHE Alkohole und lässt gesättigte stehen.'
  ],
  seen_in: 'BW 2021 (Carvon, CrO₃), BW 2022 (Butanon), LW 2016 (Phellandral), BW 2019 (Abscisinsäure, MnO₂)'
});

R({
  id: 'prim-alkohol-zu-saeure', category: C_RX, name: 'Primärer Alkohol / Aldehyd → Carbonsäure',
  difficulty: 'A', reaktionstyp: 'Oxidation', transformation: 'R–CH₂–OH → R–COOH',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C'); const o = m.add(2 * DX, 0, 'O');
      m.bond(r, c, 1); m.bond(c, o, 1); return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      const o1 = m.add(DX, DY + B, 'O'); const o2 = m.add(2 * DX, 0, 'O');
      m.bond(r, c, 1); m.bond(c, o1, 2); m.bond(c, o2, 1); return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'KMnO_4 / H^+', below: 'bzw. CrO_3/H_2O  ·  Ag(NH_3)_2^+',
  conditions: 'Wässriges KMnO₄ oder CrO₃; für die reine Aldehyd→Säure-Stufe reicht Tollens-Reagenz [Ag(NH₃)₂]⁺ oder Fehling.',
  substituents: 'R₁ = Alkyl, Aryl',
  key_points: [
    'In WASSER steht der Aldehyd im Gleichgewicht mit seinem Hydrat R–CH(OH)₂, das ein oxidierbares C–H trägt — deshalb läuft es durch bis zur Säure.',
    'Wer beim Aldehyd anhalten will, muss wasserfrei arbeiten (PCC, Swern).',
    'Tollens (Silberspiegel) und Fehling sind die klassischen Nachweise, weil nur Aldehyde und keine Ketone reagieren.',
    'Bei Alkenen spaltet heißes KMnO₄ zusätzlich die C=C-Bindung.'
  ],
  seen_in: 'BW 2022 (Butanon-Reaktionen), BW 2021 (p-Cymol), BW 2026 (Zuckerchemie)'
});

R({
  id: 'baeyer-villiger', category: C_RX, name: 'Baeyer-Villiger-Oxidation',
  difficulty: 'C', reaktionstyp: 'Oxidation + Umlagerung', transformation: 'R₁–CO–R₂ → R₁–CO–O–R₂',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      const o = m.add(DX, DY + B, 'O'); const z = m.gen(2 * DX, 0, 'R₂');
      m.bond(r, c, 1); m.bond(c, o, 2); m.bond(c, z, 1); return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      const o1 = m.add(DX, DY + B, 'O'); const o2 = m.add(2 * DX, 0, 'O');
      const z = m.gen(3 * DX, DY, 'R₂');
      m.bond(r, c, 1); m.bond(c, o1, 2); m.bond(c, o2, 1); m.bond(o2, z, 1); return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'm-CPBA  bzw. CF_3CO_3H', below: 'CH_2Cl_2',
  conditions: 'Persäure (m-CPBA, Peressigsäure, Trifluorperessigsäure) in CH₂Cl₂.',
  stereochemistry: 'Der wandernde Rest behält seine Konfiguration vollständig bei (Retention).',
  substituents: 'R₁, R₂ = Alkyl, Aryl · WANDERUNGSTENDENZ: tertiär > Cyclohexyl ≈ sekundär ≈ Benzyl ≈ Aryl > primär > Methyl',
  key_points: [
    'Ein O-Atom wird zwischen Carbonyl-C und einen der beiden Reste geschoben — aus dem Keton wird ein Ester.',
    'Welcher Rest wandert, entscheidet die Wanderungstendenz: der Rest, der die positive Ladung besser trägt, wandert.',
    'Deshalb ist die Reaktion regioselektiv vorhersagbar — eine beliebte Prüfungsfrage.',
    'Cyclische Ketone liefern LACTONE, der Ring wird dabei um ein Glied größer (Cyclohexanon → ε-Caprolacton).',
    'Achtung: dasselbe Reagenz epoxidiert C=C — bei ungesättigten Ketonen konkurrieren beide Reaktionen.'
  ],
  seen_in: 'BW 2013 (Grandisol, Persäure-Oxidation), BW 2024 (Merrilacton A), BW 2023 (Hirsuten)'
});

R({
  id: 'allylische-oxidation-seo2', category: C_RX, name: 'Allylische Oxidation mit SeO₂',
  difficulty: 'D', reaktionstyp: 'Oxidation (En-Typ)', transformation: 'Allyl-CH₃ → Allyl-CH₂OH',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁');
      const c1 = m.add(DX, DY, 'C'); const c2 = m.add(2 * DX, 0, 'C');
      const c3 = m.add(3 * DX, DY, 'C');
      m.bond(r, c1, 1); m.bond(c1, c2, 2); m.bond(c2, c3, 1); return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁');
      const c1 = m.add(DX, DY, 'C'); const c2 = m.add(2 * DX, 0, 'C');
      const c3 = m.add(3 * DX, DY, 'C'); const o = m.add(4 * DX, 0, 'O');
      m.bond(r, c1, 1); m.bond(c1, c2, 2); m.bond(c2, c3, 1); m.bond(c3, o, 1); return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'SeO_2', below: 'Dioxan / EtOH, Δ',
  conditions: 'Katalytisches oder stöchiometrisches SeO₂, oft mit TBHP als Reoxidans.',
  stereochemistry: 'Meist (E)-selektiv; die Doppelbindung bleibt an ihrem Platz.',
  substituents: 'R₁ = Alkyl · greift bevorzugt die höher substituierte Seite des Alkens an',
  key_points: [
    'Führt eine OH-Gruppe in ALLYLSTELLUNG ein, ohne die Doppelbindung zu verschieben.',
    'Mechanistisch eine En-Reaktion gefolgt von einer [2,3]-sigmatropen Umlagerung.',
    'In der Terpenchemie das Standardwerkzeug, um aus einer Methylgruppe eine Hydroxymethylgruppe zu machen.',
    'Weiteroxidation mit MnO₂ liefert den allylischen Aldehyd.'
  ],
  seen_in: 'BW 2025 (Farnesol), BW 2019 (Abscisinsäure, SeO₂)'
});

R({
  id: 'dibal-reduktion', category: C_RX, name: 'DIBAL-H — Ester/Nitril → Aldehyd',
  difficulty: 'C', reaktionstyp: 'Reduktion', transformation: 'R–CO₂R′ → R–CHO',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      const o1 = m.add(DX, DY + B, 'O'); const o2 = m.add(2 * DX, 0, 'O');
      const r2 = m.gen(3 * DX, DY, 'R₂');
      m.bond(r, c, 1); m.bond(c, o1, 2); m.bond(c, o2, 1); m.bond(o2, r2, 1); return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      const o = m.add(DX, DY + B, 'O'); const h = m.gen(2 * DX, 0, 'H');
      m.bond(r, c, 1); m.bond(c, o, 2); m.bond(c, h, 1); return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'DIBAL-H (1 Äq.)', below: 'Toluol, -78 °C',
  conditions: 'Diisobutylaluminiumhydrid, genau ein Äquivalent, bei −78 °C; danach vorsichtig wässrig aufarbeiten.',
  substituents: 'R₁ = Alkyl, Aryl · R₂ = Me, Et · funktioniert ebenso mit Nitrilen (→ Aldehyd) und Lactonen (→ Lactol)',
  key_points: [
    'Der Trick ist die TEMPERATUR: bei −78 °C ist das tetraedrische Aluminium-Alkoxid stabil und kollabiert erst beim Aufarbeiten zum Aldehyd.',
    'LiAlH₄ würde durchreduzieren bis zum primären Alkohol, weil der entstehende Aldehyd sofort weiterreagiert.',
    'Ein Äquivalent ist entscheidend — im Überschuss entsteht auch hier der Alkohol.',
    'Damit lässt sich die Oxidationsstufe „Aldehyd" direkt aus dem Ester erreichen, ohne den Umweg Alkohol → Oxidation.'
  ],
  seen_in: 'BW 2024 (Vitamin E, DIBAL), BW 2020 (Prostaglandin, iBu₂AlH), BW 2022 (Lysergsäure)'
});

R({
  id: 'birch-reduktion', category: C_RX, name: 'Birch-Reduktion',
  difficulty: 'D', reaktionstyp: 'Reduktion (Einelektronen)', transformation: 'Ar–H → 1,4-Cyclohexadien',
  rx: (() => {
    const a = (() => { const m = new Mol(); m.benzene(0, 0, B); return m; })();
    const b = (() => {
      const m = new Mol();
      const v = m.ring(6, 0, 0);
      // 1,4-diene: double bonds between v0–v1 and v3–v4, sp3 at v2 and v5.
      for (const [i, j] of [[0, 1], [3, 4]]) {
        const bo = m.bonds.find(x => (x.a === v[i] && x.b === v[j]) || (x.a === v[j] && x.b === v[i]));
        bo.order = 2;
      }
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'Na  bzw. Li', below: 'NH_3(l) / EtOH, -78 °C',
  conditions: 'Alkalimetall in flüssigem Ammoniak mit einem Alkohol als Protonenquelle.',
  substituents: 'Substituenten steuern die Regiochemie: elektronenziehende Gruppen landen AM sp²-C, elektronenschiebende am sp³-C',
  key_points: [
    'Die solvatisierten Elektronen des Alkalimetalls in NH₃ reduzieren den Aromaten über Radikalanionen.',
    'Das Produkt ist das UNKONJUGIERTE 1,4-Dien, nicht das thermodynamisch stabilere 1,3-Dien — ein Kennzeichen der Reaktion.',
    'Dieselben Bedingungen reduzieren interne Alkine stereoselektiv zum (E)-Alken.',
    'Eine der wenigen Möglichkeiten, den aromatischen Ring überhaupt teilweise zu reduzieren.'
  ],
  seen_in: 'BW 2022 (Lysergsäure, Na/NH₃), BW 2018 (Colchicin)'
});

};
