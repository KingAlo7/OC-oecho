/* Reaction library — Oxidation und Reduktion (ohne die schon in den
   Carbonyl- und Additions-Kapiteln geführten Fälle). */

module.exports = function (ctx) {
const { R, Mol, carbonyl, alkin, B, DX, DY } = ctx;

const C_RX = 'Oxidation & Reduktion';

R({
  id: 'prim-alkohol-zu-aldehyd', category: C_RX, name: 'Oxidation primärer Alkohole zum Aldehyd',
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
  id: 'sek-alkohol-zu-keton', category: C_RX, name: 'Oxidation sekundärer Alkohole zum Keton',
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
  id: 'prim-alkohol-zu-saeure', category: C_RX, name: 'Oxidation zur Carbonsäure',
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
  id: 'allylische-oxidation-seo2', category: C_RX, name: 'Riley-Oxidation (SeO₂)',
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
  stereochemistry: 'Meist (E)-selektiv; die Doppelbindung bleibt an ihrem Platz.',
  substituents: 'R₁ = Alkyl · greift bevorzugt die höher substituierte Seite des Alkens an',
  key_points: [
    'Führt eine OH-Gruppe in ALLYLSTELLUNG ein, ohne die Doppelbindung zu verschieben.',
    'Mechanistisch eine En-Reaktion gefolgt von einer [2,3]-sigmatropen Umlagerung.',
    'In der Terpenchemie das Standardwerkzeug, um aus einer Methylgruppe eine Hydroxymethylgruppe zu machen.',
    'Weiteroxidation mit MnO₂ liefert den allylischen Aldehyd.',
    'Auch die α-CH₂-Gruppe von Ketonen wird von SeO₂ oxidiert → 1,2-Dicarbonylverbindung (z. B. Butanon → Butandion).'
  ],
  seen_in: 'BW 2025 (Farnesol), BW 2019 (Abscisinsäure, SeO₂)'
});

R({
  id: 'dibal-reduktion', category: C_RX, name: 'DIBAL-H-Reduktion zum Aldehyd',
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
  id: 'rosenmund-reduktion', category: C_RX, name: 'Rosenmund-Reduktion',
  difficulty: 'B', reaktionstyp: 'Reduktion (Hydrogenolyse C–Cl)', transformation: 'R–COCl → R–CHO',
  rx: (() => {
    const a = new Mol(); carbonyl(a, 0, 0, 'R₁', { zSym: 'Cl' });
    const b = new Mol(); carbonyl(b, 0, 0, 'R₁');
    return { reactants: [a], products: [b] };
  })(),
  above: 'H_2', below: 'Pd/BaSO_4, Chinolin',
  substituents: 'R₁ = Alkyl, Aryl',
  key_points: [
    'Selektive Reduktion des Säurechlorids zum Aldehyd: der durch BaSO₄ (und Chinolin/Schwefel) vergiftete Pd-Katalysator ist zu wenig aktiv, um den Aldehyd weiter zum Alkohol zu reduzieren.',
    'Mit unvergiftetem Pd/C würde bis zum primären Alkohol durchreduziert.',
    'Dasselbe Prinzip wie beim Lindlar-Katalysator: ein vergifteter Katalysator stoppt auf der Zwischenstufe.',
    'Andere Wege zum Aldehyd: DIBAL-H aus Ester oder Nitril, Oxidation des primären Alkohols mit PCC.'
  ],
  seen_in: 'LW 2016 (Phellandral), BW 2016 (Trimethoprim)'
});

R({
  id: 'hydrogenolyse-benzyl', category: C_RX, name: 'Hydrogenolyse von Benzylgruppen',
  difficulty: 'B', reaktionstyp: 'Reduktion (Hydrogenolyse)', transformation: 'R–O–CH₂Ph → R–OH + PhCH₃',
  rx: (() => {
    const a = new Mol();
    const r = a.gen(0, 0, 'R₁'); const o = a.add(DX, DY, 'O'); const c = a.add(2 * DX, 0, 'C');
    a.bond(r, o, 1); a.bond(o, c, 1);
    const v = a.benzene(4 * DX, 2 * DY, B);
    a.bond(c, v[3], 1);
    const b = new Mol();
    const s = b.gen(0, 0, 'R₁'); const p = b.add(DX, DY, 'O'); b.bond(s, p, 1);
    return { reactants: [a], products: [b] };
  })(),
  above: 'H_2', below: 'Pd/C  bzw. Pd(OH)_2,  -PhCH_3',
  substituents: 'Benzylether R–OBn · Benzylester RCO₂Bn · N-Benzyl- und N-Benzhydrylamine · Cbz-Carbamate (→ R–NH₂ + CO₂)',
  key_points: [
    'Benzylische C–O- und C–N-Bindungen werden am Pd-Kontakt durch H₂ gespalten; der Benzylrest geht als Toluol.',
    'Deshalb ist Benzyl (Bn) eine Schutzgruppe für Alkohole, Säuren und Amine, die unter neutralen Bedingungen wieder abgeht.',
    'Pd(OH)₂/C (Pearlman-Katalysator) ist besonders aktiv für N-Benzyl- und Benzhydrylgruppen.',
    'C=C-Doppelbindungen werden unter denselben Bedingungen mithydriert.'
  ],
  seen_in: 'BW 2020 (Conicein), BW 2024 (Tyr-Asp-Dipeptid), BW 2017 (Ferruginin)'
});

R({
  id: 'glaser-kupplung', category: C_RX, name: 'Glaser-Kupplung',
  difficulty: 'C', reaktionstyp: 'oxidative Kupplung', transformation: '2 R–C≡C–H → R–C≡C–C≡C–R',
  rx: (() => {
    const a = new Mol(); alkin(a, 0, 0, 'R₁', null);
    const b = new Mol();
    const at = b.line(6, 0, 0, 0);
    b.atoms[at[0]].alias = 'R₁'; b.atoms[at[5]].alias = 'R₁';
    [1, 3, 1, 3, 1].forEach((o, k) => b.bond(at[k], at[k + 1], o));
    return { reactants: [a], products: [b] };
  })(),
  above: 'CuCl, O_2', below: 'Pyridin',
  substituents: 'R₁ = Alkyl, Aryl (nur terminale Alkine) · liefert symmetrische 1,3-Diine',
  key_points: [
    'Oxidative Kupplung zweier Kupfer-Acetylide: es werden 2 e⁻ abgegeben, O₂ (bzw. Cu²⁺) ist das Oxidationsmittel.',
    'Eglinton-Variante: stöchiometrisch Cu(OAc)₂ in Pyridin; Hay-Variante: katalytisch CuCl/TMEDA mit Luft.',
    'Aus Phenylacetylen entsteht 1,4-Diphenylbuta-1,3-diin.'
  ],
  seen_in: 'LW 2019 (Phenylacetylen-Routen)'
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
