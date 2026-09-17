/* Source audit, part 5 — BW 47 (2021, Ersatzwettbewerb), Aufgaben 2 und 5 B.
   Question names no longer give away the target where the Angabe keeps
   it hidden ("Der Aromastoff in Oregano (C)", "ein Inhaltsstoff"). */
const { Q, N, G, E, syn, SA, setSec, findSec, addSection, patch } = require('./source-audit-2026');

const KOCH = 'Beim Online-Kochen mit Chefkoch Scherl und seinen Assistenten ist die Chemie nicht zu kurz gekommen. Als köstliches Gericht wurde eine Lasagne zubereitet.';

patch('bw47 oregano', () => {
  const q = Q('bw47-2021-thymol');
  q.name = 'Aromastoff in Oregano aus p-Cymol — BW 2021';
  q.intro = KOCH + ' Der Aromastoff in Oregano (C) ist ein Monoterpen, das in keiner Lasagne fehlen darf.';
  setSec(q, 0, syn('A. Typisch italienischer Flair — Synthese von Oregano', [
    G('Ed', 'p-Cymol', 'Cc1ccc(C(C)C)cc1'),
    N('A', 'A', 'CC(C)c1ccc(C)cc1S(=O)(=O)O', { explanation: 'Sulfonierung (S_E) des p-Cymols.' }),
    N('C', 'C', 'Cc1ccc(C(C)C)c(O)c1', { name: 'Thymol', explanation: 'Alkalischmelze: die Sulfonatgruppe wird durch OH^- ersetzt (S_N am Aromaten); H^+ protoniert das Phenolat.' }),
    N('B', 'B', 'Cc1cccc(O)c1', { caption: 'meta-disubstituiert (X, Y)', name: 'm-Kresol' })
  ], [
    E('Ed', 'A', 'SO_3 / H_2SO_4', '1'),
    E('A', 'C', '1) NaOH-Schmelze, 2) H^+', '2'),
    E('B', 'C', '2-Chlorpropan, AlCl_3', '3')
  ]));
  addSection(q, SA('Mechanismen der Reaktionen 1–3 (2.2)', 'Nach welchen Reaktionsmechanismen verlaufen die Reaktionen 1, 2 und 3?', '1: S_E; 2: S_N; 3: S_E'), 0);
});

patch('bw47 capsaicin', () => {
  const q = Q('bw47-2021-capsaicin');
  q.name = 'Scharfstoff der Chili aus Vanillin — BW 2021';
  q.intro = 'Für ein brauchbares Lasagnerezept ist Chili unerlässlich. Chilis enthalten eine für die „Schärfe" verantwortliche Substanz. Eigenartigerweise ist ein Edukt für deren Synthese Vanillin.';
  const vanAr = 'c1ccc(O)c(OC)c1';
  const rest = q.sections.slice(3);
  q.sections = [q.sections[0]];
  setSec(q, 0, syn('B. Echt scharf — von Vanillinzucker zu Chili', [
    G('V', 'Vanillin', 'COc1cc(C=O)ccc1O'),
    N('A', 'A', 'N=C' + vanAr, { explanation: 'Kondensation mit NH_3 → Imin.' }),
    N('B', 'B', 'NC' + vanAr, { explanation: 'NaBH_3CN reduziert das Imin zum primären Amin (reduktive Aminierung).' }),
    N('C', 'C', 'OC(=O)CCCCCBr', { caption: 'C_6H_11BrO_2' }),
    N('D', 'D', 'OC(=O)CCCCC[P+](c1ccccc1)(c1ccccc1)c1ccccc1', { explanation: 'S_N2 von PPh_3 am Alkylbromid → Phosphoniumsalz.' }),
    G('Zs', '', 'CC(C)/C=C\\CCCCC(=O)O'),
    N('Ee', 'E', 'CC(C)/C=C/CCCCC(=O)O', { explanation: 'Photochemische Isomerisierung zum E-Alken (J = 15,8 Hz, trans-Kopplung).' }),
    N('F', 'F', 'CC(C)/C=C/CCCCC(=O)Cl'),
    N('Gc', 'G', 'COc1cc(CNC(=O)CCCC/C=C/C(C)C)ccc1O', { name: 'Capsaicin', explanation: 'Das Amin B greift das Säurechlorid F an (Acylsubstitution) → Amid.' })
  ], [
    E('V', 'A', 'NH_3'),
    E('A', 'B', 'NaBH_3CN'),
    E('C', 'D', 'PPh_3'),
    E('D', 'Zs', 'd'),
    E('Zs', 'Ee', 'hν'),
    E('Ee', 'F', 'SOCl_2'),
    E(['F', 'B'], 'Gc', 'B')
  ], {
    hints: [
      'Von Substanz C (C_6H_11BrO_2) ist ein ^1H-NMR-Spektrum gegeben: Signale bei δ ≈ 11 ppm (1H), 3,5 ppm (2H) sowie 2,3–1,4 ppm (zusammen 8H).',
      'In E gibt es zwei Signale (im Bereich δ = 6 bis 7 ppm) mit einer Kopplungskonstanten von J = 15,8 Hz.'
    ]
  }));
  q.sections.push(...rest);
  addSection(q, SA('Produkt aus D und d (2.6)', 'Geben Sie den Stereodeskriptor für das Produkt der Reaktion D mit d an und nennen Sie den Isomerietyp.', 'Z; Diastereomerie (geometrische Isomere).'));
  addSection(q, SA('IUPAC-Name von Vanillin (2.7)', 'Benennen Sie Vanillin nach IUPAC.', '4-Hydroxy-3-methoxybenzencarbaldehyd'));
  const d = q.sections.findIndex(s => /Reagenz d/.test(s.title || ''));
  if (d >= 0) q.sections[d].expected_answer = '(CH_3)_2CH-CHO und KO^tBu (Base zur Ylid-Bildung).';
});

patch('bw47 kuemmel', () => {
  const q = Q('bw47-2021-carvon');
  q.name = 'Inhaltsstoff des Kümmels — BW 2021';
  q.intro = 'In gutem Vitamin-C-haltigen Krautsalat darf natürlich Kümmel nicht fehlen. Ein Inhaltsstoff desselben wird hier synthetisiert, wobei sich leider auch noch eine Wolke über das Schema gelegt hat (F ist nur teilweise zu sehen).';
  setSec(q, 0, syn('C. Fit durch Krautsalat — Synthese Kümmel', [
    N('A', 'A', 'CC(C)/C=C/C(=O)Cl'),
    N('B', 'B', 'CCC(=O)/C=C/C(C)C'),
    N('C', 'C', 'CCC1(CC=C(C)C)OCCO1', { explanation: 'Ketalisierung; dabei wandert die Doppelbindung in die höher substituierte Position (keine E/Z-Isomerie mehr).' }),
    N('D', 'D', 'CCC1(C/C=C(\\C)C=O)OCCO1', { explanation: 'SeO_2 oxidiert allylständig eine Methylgruppe zum Aldehyd (E).' }),
    N('Ee', 'E', 'CCC1(C/C=C(\\C)CO)OCCO1'),
    N('F', 'F', 'CCC1(C/C=C(\\C)COC=C)OCCO1', { caption: 'unter der Wolke: Rest R', explanation: 'Hg^{2+}-katalysierte Umetherung mit Ethylvinylether → Allylvinylether.' }),
    N('Gc', 'G', 'O=CCC(C(C)=C)CC1(CC)OCCO1', { explanation: '[3,3]-sigmatrope Claisen-Umlagerung → γ,δ-ungesättigter Aldehyd.' }),
    N('H', 'H', 'O=CCC(CC(=O)CC)C(C)=C', { explanation: 'TsOH spaltet das Ketal.' }),
    N('I', 'I', 'CC1=CC[C@H](CC1=O)C(=C)C', { caption: 'C_10H_14O', name: '(R)-Carvon', explanation: 'Intramolekulare Aldolkondensation (Base) → Cyclohexenon.' })
  ], [
    E('A', 'B', '1) EtMgBr', '2) H^+'),
    E('B', 'C', 'H^+/(CH_2OH)_2'),
    E('C', 'D', 'SeO_2'),
    E('D', 'Ee', 'LiAlH_4'),
    E('Ee', 'F', 'HgAc_2', 'CH_2=CH-OEt'),
    E('F', 'Gc', 'Claisen'),
    E('Gc', 'H', 'TsOH'),
    E('H', 'I', 'Base')
  ], {
    hints: [
      'A zeigt im Massenspektrum zwei Molekülpeaks im Verhältnis 75:25 = 132 u : 134 u.',
      '^1H-NMR von A: δ ≈ 7,18 ppm (1H, d), 6,14 ppm (1H, d), 2,5 ppm (1H, m), 1,1 ppm (6H, d); die beiden H-Kerne bei 6,14 und 7,18 ppm weisen eine Kopplungskonstante J = 16 Hz auf. ^{13}C-NMR von A: δ ≈ 167, 160, 122, 30, 22 ppm.',
      'A ist besonders instabil gegenüber Hydrolyse.',
      'C besitzt nur ein Proton im Bereich 6–7 ppm und kann keine E/Z-Isomere bilden.',
      'D besitzt im ^1H-NMR ein Proton bei 9,8 ppm.',
      'Bei der Bildung von F aus E bleibt der im Schema mit R markierte Rest unverändert.',
      'I hat eine Summenformel von C_10H_14O. Gesucht ist das R-Enantiomer von I.'
    ]
  }));
});

patch('bw47 coffein', () => {
  const q = Q('bw47-2021-coffein');
  q.name = 'Kaffee-Inhaltsstoff aus Uracil — BW 2021';
  q.intro = 'Zur Nachspeise, Eispalatschinken passend, synthetisieren wir hier einen Inhaltsstoff von Kaffee.';
  q.hints = [
    'A enthält 6 C-Atome.',
    'Bei der Umwandlung von D nach E entsteht ein weiterer Heterocyclus, es findet ein Ringschluss statt.'
  ];
  const s = q.sections[0].scheme;
  const u = s.nodes.find(n => n.id === 'U');
  u.label = 'Uracil'; delete u.name;
  const a = s.nodes.find(n => n.id === 'A'); delete a.name;
  const f = s.nodes.find(n => n.id === 'F'); f.given = false; f.name = 'Coffein';
  const e = s.nodes.find(n => n.id === 'E'); e.name = 'Theophyllin';
  addSection(q, SA('Funktion von NaOCH_3 bzw. NaH (2.13)', 'Nennen Sie die Funktion von NaOCH_3 bzw. NaH für die Reaktionen Uracil → A und E → F.',
    'Beide sind Basen: sie deprotonieren die N–H-Gruppen und erzeugen so das Nucleophil für die S_N2-Methylierung mit CH_3I.'));
});

patch('bw47 yuehchukene', () => {
  const q = Q('bw47-2021-yuehchukene');
  q.hints = ['Die Cyclisierung verläuft thermisch und daher konrotatorisch.'];
  q.sections[0] = syn('B. Synthese von Yuehchukene', [
    G('S', '', 'O=C(c1c[nH]c2ccccc12)C1=CC=C(C)CC1(C)C'),
    N('A', 'A', 'CC1=C[C@H]2[C@@H](C(=O)C3=C2C4=CC=CC=C4N3)C(C1)(C)C', {
      explanation: '4π-Elektrocyclisierung des Pentadienyl-Kations (Nazarov), thermisch conrotatorisch → die beiden H-Atome an den Ringverknüpfungs-C-Atomen stehen trans.' }),
    N('Y', 'Yuehchukene', 'CC1=C[C@@H]2[C@@H]([C@H](C3=C2C4=CC=CC=C4N3)C5=CNC6=CC=CC=C65)C(C1)(C)C')
  ], [
    E('S', 'A', 'Nazarovcyclisierung'),
    E('A', 'Y')
  ]);
});
