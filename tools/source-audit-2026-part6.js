/* Source audit, part 6 — BW 48 (2022), Aufgaben 2 und 4 B */
const { Q, N, G, E, syn, SA, setSec, findSec, addSection, patch } = require('./source-audit-2026');

const ROEMER = 'Organische Chemie bei den alten Römern.';

patch('bw48 butanon', () => {
  const q = Q('bw48-2022-butanon-reaktionen');
  q.name = 'Zehn Reaktionen eines Ketons — BW 2022';
  setSec(q, 0, syn('A. Einige Reaktionen aus der organischen Chemie', [
    G('Ed', '', 'CCC(C)=O'),
    N('A', 'A', 'CCC(/C)=N/O'),
    N('C', 'C', 'CC(=O)NCC', { explanation: 'Aus A: Beckmann-Umlagerung (H_2SO_4). Aus B: Aminolyse des Esters mit Ethylamin.' }),
    N('B', 'B', 'CCOC(C)=O', { caption: 'C_4H_8O_2', explanation: 'Baeyer-Villiger-Oxidation: das höher substituierte Ethyl wandert → Ethylacetat.' }),
    N('D', 'D', 'CCC(C)O', { caption: 'C_4H_10O' }),
    N('Ee', 'E', 'C/C=C/C', { caption: 'C_4H_8' }),
    N('F', 'F', 'CCC(C)Cl'),
    N('Gg', 'G', 'CC(=O)C(C)=O', { caption: 'C_4H_6O_2' }),
    N('H', 'H', 'CCC(C)=C1CCCC1', { explanation: 'Wittig: NaH bildet aus dem Cyclopentyl-Phosphoniumsalz das Ylid; Olefinierung der C=O-Gruppe.' }),
    N('I', 'I', 'CCC(C)(O)CC')
  ], [
    E('Ed', 'A', 'NH_2OH', '1'),
    E('A', 'C', 'H_2SO_4', '3'),
    E('Ed', 'B', 'CF_3COOOH, Oxidation mit Persäure', '2'),
    E('B', 'C', 'CH_3CH_2NH_2', '4'),
    E('Ed', 'D', 'NaBH_4', '5'),
    E('D', 'Ee', 'konz. H_2SO_4', '6'),
    E('Ee', 'F', 'HCl', '7'),
    E('Ed', 'Gg', 'SeO_2', '8'),
    E('Ed', 'H', '1. Cyclopentyl-PPh_3^+ Br^-', '+ 1 äq. NaH; 9'),
    E('Ed', 'I', '1. CH_3CH_2-MgCl, 2. H^+/H_2O', '10')
  ], {
    hints: [
      'Von B, I, G sind die ^1H-NMR-Daten (gemessen in CDCl_3) gegeben.',
      'In Reaktion 1 entsteht als Nebenprodukt Wasser.',
      'Substanz E: E-Isomer.',
      '^1H-NMR-Spektrum von B: δ ≈ 4,1 ppm (q, 2H), 2,0 ppm (s, 3H), 1,25 ppm (t, 3H).',
      '^1H-NMR-Daten von I: 1,53 ppm (s, breit, 1H); 1,49 ppm (m, 4H); 1,13 ppm (s, 3H); 0,90 ppm (t, 6H).',
      'Das ^1H-NMR-Spektrum von G zeigt nur ein Singulett mit Integral 6 bei 2,34 ppm.'
    ]
  }));
  addSection(q, SA('IUPAC-Name des Eduktes (2.1)', 'Schreiben Sie den IUPAC-Namen des Eduktes auf.', 'Butan-2-on'), 0);
});

patch('bw48 cantharidin', () => {
  const q = Q('stork-cantharidin-1951');
  q.intro = 'Cantharidin ist ein Terpenoid, das Käfer je nach Spezies als Wehrsekret oder Sexuallockpheromon absondern. Heute weiß man, dass es ein starkes Gift ist. In diesem Beispiel wird die von Stork 1951 veröffentlichte Synthese von Cantharidin genauer betrachtet (Stork, G.; van Tamelen, E. E.; Friedman, L. J.; Burgstahler, A. W. J. Am. Chem. Soc. 1951, 73, 4501).';
  delete q.hints;
  const old = q.sections[0].scheme.nodes;
  const keep = id => old.find(n => n.id === id).smiles;
  setSec(q, 0, syn('B. Synthese von Cantharidin', [
    G('A', 'A', keep('A')),
    G('B', 'B', keep('B')),
    N('C', 'C', keep('C')),
    N('D', 'D', keep('D')),
    N('E', 'E', keep('E'), { caption: 'C_12H_18O_3' }),
    N('F', 'F', keep('F'), { caption: 'C_14H_22S_2O_7' }),
    N('G', 'G', keep('G'), { caption: 'C_16H_26S_2O' }),
    G('H', 'H', keep('H')),
    N('I', 'I', keep('I')),
    N('J', 'J', keep('J')),
    N('K', 'K', keep('K')),
    G('L', 'L', 'O1C2CCC1C3(C)C(=Cc4ccccc4)C=CC23C'),
    G('Y', 'Y', 'OC(=O)c1ccccc1'),
    N('M', 'M', 'OC(=O)C(=O)C1(C)C2CCC(O2)C1(C)C(=O)O', { explanation: 'Ozonolyse mit oxidativer Aufarbeitung spaltet die Ring-C=C- und die Benzyliden-Doppelbindung: Carbonsäure, α-Ketosäure und Benzoesäure (Y).' }),
    G('Nn', 'Cantharidin N', 'C[C@@]12[C@H]3CC[C@@H]([C@@]1(C(=O)OC2=O)C)O3')
  ], [
    E(['A', 'B'], 'C', 'Δ, in Benzen', '1'),
    E('C', 'D', '1. H_2 / Pd,C, 2. Buta-1,3-dien', '2'),
    E('D', 'E', '1. LiAlH_4, 2. H^+', '3'),
    E('E', 'F', 'MeSO_2Cl in Py', '4'),
    E('F', 'G', 'NaSC_2H_5', '5'),
    E('G', 'H', '1. X, 2. RaNi', '6'),
    E('H', 'I', 'HIO_4', '7'),
    E('I', 'J', 'Base, -H_2O', '8'),
    E('J', 'K', 'Ph-Li in Et_2O', '9'),
    E('K', 'L', '1. RCOCl, 2. Δ', '10'),
    E('L', 'Y', '1. O_3, 2. H_2O_2', '11'),
    E('L', 'M', '1. O_3, 2. H_2O_2', '11'),
    E('M', 'Nn', '-HCOOH', '12')
  ], {
    hints: [
      'Abkürzungen: Me = Methyl, Ph = Phenyl',
      'Reaktion 1 und Schritt 2 in Reaktion 2 sind Diels-Alder-Reaktionen ([4+2]-Cycloadditionen).',
      'Die katalytische Hydrierung in Reaktion 2 findet nur an der „leichter zugänglichen" Doppelbindung statt.',
      'I reagiert unter Niederschlagsbildung mit DNPH (2,4-Dinitrophenylhydrazin).',
      'In Reaktion 8 findet eine Aldol-Addition statt, die zu einem Ringschluss führt, der in Struktur L sichtbar ist.'
    ]
  }));
  // Keep the hand-baked MOL blocks for the unchanged intermediates.
  for (const n of q.sections[0].scheme.nodes) {
    const o = old.find(x => x.id === n.id);
    if (o && o.mol && o.smiles === n.smiles) n.mol = o.mol;
  }
  addSection(q, SA('Funktionelle Gruppen von B und N (2.5)', 'Geben Sie die Bezeichnungen der funktionellen Gruppen von Edukt B und von Produkt N (entsteht in Schritt 12) an.', 'B: Carbonsäureester; N: Carbonsäureanhydrid'));
  addSection(q, SA('Mechanismen von 4, 8 und 9 (2.7)', 'Geben Sie die Abkürzungen für die Reaktionsmechanismen von 4, 8 und 9 an.', '4: S_N2; 8: A_N; 9: A_N'));
  addSection(q, SA('NaSC_2H_5 und Abgangsgruppen (2.8, 2.9)', 'Ist „NaSC_2H_5" in Reaktion 5 ein Nucleophil, Radikal oder Elektrophil? Reihen Sie die Abgangsgruppen CF_3SO_3^-, OH^- und CH_3SO_3^- von der schlechtesten zur besten.',
    'Nucleophil (reaktive Stelle: das Thiolat-S). OH^- < CH_3SO_3^- < CF_3SO_3^-'));
  addSection(q, SA('Reagenz X', 'Welches Reagenz X wird in Schritt 6 eingesetzt?', 'X = OsO_4 (syn-Dihydroxylierung).'));
});

patch('bw48 jasmon', () => {
  const q = Q('bw48-2022-z-jasmon');
  q.source = 'ÖChO Bundeswettbewerb 2022 (BW 48), Aufgabe 2 E';
  q.intro = 'Jasmon könnte chemisch betrachtet zu den Cyclopentenonen gezählt werden. Als Duftstoff in Jasminblüten verwendeten bereits die Römer den Duft zur Parfumherstellung.';
  setSec(q, 0, syn('E. Synthese von (Z)-Jasmon', [
    G('A', 'A', 'CCOC(=O)CC(C)=O'),
    N('B', 'B', 'CCOC(=O)C(C/C=C\\CC)C(C)=O', { caption: '(11 C-Atome)' }),
    N('C', 'C', 'CC(=O)CC/C=C\\CC', { caption: 'C_8H_14O', explanation: 'Esterverseifung, dann Decarboxylierung der β-Ketosäure.' }),
    N('D', 'D', 'COC(=O)CC(=O)CC/C=C\\CC', { caption: 'C_10H_16O_3', explanation: 'Deprotonierung am primären C (Methylgruppe), Acylierung mit Dimethylcarbonat → β-Ketoester.' }),
    N('Ee', 'E', 'COC(=O)C(CC(C)=O)C(=O)CC/C=C\\CC', { caption: '(13 C-Atome)' }),
    G('Gg', 'G', 'CC(=O)CCC(=O)CC/C=C\\CC', { caption: 'Zwischenprodukt vor Ringbildung' }),
    N('H', 'H', 'CC/C=C\\CC1=C(C)CCC1=O', { caption: '(Z)-Jasmon', explanation: 'Intramolekulare Aldolkondensation → Cyclopentenon.' })
  ], [
    E('A', 'B', '1. Base', '2. (Z)-Br-CH_2-CH=CH-CH_2CH_3'),
    E('B', 'C', '1. NaOH (5 %)', '2. Δ, H_3O^+'),
    E('C', 'D', '1. Base', '2. (CH_3O)_2C=O'),
    E('D', 'Ee', '1. Base', '2. Br-CH_2-CO-CH_3'),
    E('Ee', 'Gg', '1. NaOH (5 %)', '2. Δ, H_3O^+'),
    E('Gg', 'H', '-H_2O', 'Base')
  ], {
    hints: [
      'Bedenken Sie, dass β-Carbonyl-Carbonsäuren im Basischen und Sauren leicht decarboxylieren.',
      'Im Schritt C → D wird am primären C deprotoniert.',
      'Im letzten Schritt des Syntheseschemas findet eine Aldol-Addition unter Bildung eines Cyclopentenon-Ringes statt. Das ^1H-NMR von H weist zahlreiche Signale auf, aber nur zwei, deren Integration 3 beträgt, nämlich ein Singulett (2,2 ppm) und ein Triplett (1,1 ppm).'
    ]
  }));
  addSection(q, SA('Acidestes Proton in A (2.11)', 'Zeichnen Sie Edukt A und kennzeichnen Sie das Proton mit dem kleinsten pK_A-Wert.', 'Die CH_2-Protonen zwischen den beiden Carbonylgruppen (Acetessigester, pK_A ≈ 11).'));
});

patch('bw48 lysergsaeure', () => {
  const q = Q('bw48-2022-lysergsaeure-myers-allen');
  q.intro = 'Die erste Totalsynthese (racemischer) Lysergsäure gelang Woodward bereits 1956. 2011 veröffentlichten Fujii und Ohno eine enantioselektive Synthese mit einer Palladium-katalysierten Domino-Cyclisierung als Schlüsselschritt. Ausgangsmaterial dieses Schlüsselschritts ist das chirale Allen G, das mithilfe der 1996 von Myers entwickelten Methode aus dem Propargylalkohol E hergestellt werden kann.';
  const Ts = 'S(=O)(=O)c9ccc(C)cc9';
  const ox = 'C8CN(' + Ts + ')C(c7ccccc7)OC8';
  const ind = (r) => 'Brc1cccc2c1c(' + r + ')cn2' + Ts;
  q.sections[0] = syn('Myers-Methode', [
    G('B', 'B', 'O[C@@H](C#Cc1ccccc1)C1CCCCC1'),
    G('C', 'C', 'NN([C@H](C#Cc1ccccc1)C1CCCCC1)S(=O)(=O)c1ccccc1', { caption: '[Intermediat]' }),
    G('D', 'D', 'C(=C=Cc1ccccc1)C1CCCCC1')
  ], [
    E('B', 'C', 'ArSO_2NHNH_2', 'Ph_3P, DEAD, -15 °C'),
    E('C', 'D', '23 °C')
  ], { body: 'Prinzip der Myers-Methode (Cy = Cyclohexyl, Ar = Aryl).' });
  addSection(q, syn('Synthese des chiralen Allens G', [
    G('Ee', 'E', ind('CC(O)C#C' + ox)),
    N('F', 'F', ind('CC(N(N)S(=O)(=O)c3ccccc3)C#C' + ox), { caption: '[Intermediat]',
      explanation: 'Mitsunobu-Reaktion: das Sulfonylhydrazid substituiert die OH-Gruppe unter Inversion am Propargyl-C.' }),
    N('Gg', 'G', ind('CC=C=C' + ox), { explanation: 'Abspaltung von ArSO_2H → Propargyldiazen; retro-En-artige, suprafaciale N_2-Abspaltung überträgt die Chiralität auf die Allenachse.' })
  ], [
    E('Ee', 'F', 'ArSO_2NHNH_2', 'Ph_3P, DEAD, -15 °C'),
    E('F', 'Gg', 'RT')
  ], { hints: ['X = Halogen (hier als Br gezeichnet); TsOH = Me-Ph-SO_3H; DEAD = Diethylazodicarboxylat (EtOCO)_2N_2.'] }), 0);
  addSection(q, SA('Stereodeskriptor von D (4.3)', 'Geben Sie den Stereodeskriptor von D an.', 'aR'), 1);
});
