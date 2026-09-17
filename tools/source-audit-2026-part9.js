/* Source audit, part 9 — BW 51 (2025), Aufgaben 4 und 5 */
const { Q, N, G, E, syn, SA, setSec, findSec, addSection, patch } = require('./source-audit-2026');

const P2 = 'COP(=O)([O-])[O-]';
const pyr = (sub) => sub + 'c1c(O)c(C)[nH+]cc1' + P2;

patch('bw51 pku', () => {
  const q = Q('bw51-2025-phenylketonurie');
  q.intro = 'Phenylketonurie (PKU) ist eine erbliche Stoffwechselstörung, die die Verarbeitung der Aminosäure Phenylalanin A beeinträchtigt. Ohne Behandlung akkumuliert diese im Körper und kann schwere neurologische Schäden verursachen. Hier einige Stoffwechselpfade.';
  const rest = q.sections.slice(1);
  setSec(q, 0, syn('A. Stoffwechselpfade von Phenylalanin', [
    G('A', 'A', 'N[C@@H](Cc1ccccc1)C(=O)O'),
    G('W', 'W', 'OC(=O)CCC(=O)C(=O)O'),
    N('F', 'F', 'NCCc1ccccc1', { name: 'Phenylethylamin' }),
    N('G', 'G', 'N[C@@H](Cc1ccc(O)cc1)C(=O)O', { name: 'L-Tyrosin' }),
    N('B', 'B', 'O=C(C(=O)O)Cc1ccccc1', { name: 'Phenylbrenztraubensäure' }),
    N('X', 'X', 'N[C@@H](CCC(=O)O)C(=O)O', { name: 'L-Glutaminsäure' }),
    N('C', 'C', 'OC(Cc1ccccc1)C(=O)O', { name: 'Phenylmilchsäure' }),
    N('D', 'D', 'OC(=O)Cc1ccccc1', { name: 'Phenylessigsäure' }),
    N('Y', 'Y', 'NC(=O)CC[C@H](N)C(=O)O', { name: 'L-Glutamin' }),
    N('Ee', 'E', 'NC(=O)CC[C@H](NC(=O)Cc1ccccc1)C(=O)O', { caption: 'C_13H_16N_2O_4', name: 'Phenylacetylglutamin' })
  ], [
    E('A', 'F'),
    E('A', 'G'),
    E(['A', 'W'], 'B', 'PLP (Pyridoxalphosphat)'),
    E(['A', 'W'], 'X', 'PLP (Pyridoxalphosphat)'),
    E('B', 'C', 'NADH/H^+'),
    E('B', 'D', 'NAD^+', 'CO_2 + NADH/H^+'),
    E(['D', 'Y'], 'Ee', '', 'H_2O')
  ], {
    hints: [
      'Die Reaktion A → F wird katalysiert durch eine Decarboxylase.',
      'F ist ein Neurotransmitter.',
      'X entsteht durch Hydrolyse aus Y.',
      'Für die Reaktion A + W → B + X werden ein Enzym und ein Vitamin als Cofaktor benötigt.',
      'A → G (eine kanonische Aminosäure) benötigt als Enzym Phenylalaninhydroxylase.'
    ]
  }));
  q.sections = [q.sections[0],
    syn('Katalytischer Cyclus der Transaminierung (4.4)', [
      G('PMP', '', pyr('NC')),
      G('W2', 'W', 'OC(=O)CCC(=O)C(=O)O'),
      N('K', 'K', 'OC(=O)CCC(=N' + pyr('C') + ')C(=O)O', { explanation: 'Kondensation der Aminogruppe von PMP mit der Ketogruppe von W (-H_2O) → Ketimin.' }),
      N('I', 'I', 'OC(=O)CCC(=NC=C1C(' + P2 + ')=CNC(C)=C1O)C(=O)O', { explanation: 'Tautomerisierung über das chinoide Intermediat.' }),
      N('K2', 'K´', 'OC(=O)CCC(N=C' + pyr('') + ')C(=O)O', { explanation: 'Aldimin.' }),
      N('X2', 'X', 'N[C@@H](CCC(=O)O)C(=O)O'),
      N('L', 'L', pyr('O=C'), { name: 'Pyridoxalphosphat (PLP)' })
    ], [
      E(['PMP', 'W2'], 'K', '-H_2O'),
      E('K', 'I'),
      E('I', 'K2'),
      E('K2', 'X2', 'H_2O'),
      E('K2', 'L', 'H_2O')
    ], { body: 'Die Umwandlung A + W → B + X erfolgt in mehreren Schritten als katalytischer Cyclus, wobei auch diese Reaktionsfolge auftaucht, in der einer der beiden Ausgangsstoffe (Sie müssen entscheiden, welcher) umgesetzt wird. Die Pfeile sind Gleichgewichtspfeile.' }),
    ...rest];
  addSection(q, SA('Enzymklassen (4.2)', 'Schreiben Sie zu den Reaktionen A → F, A → G, B → C und A → B die korrekte Enzymklasse auf.', 'A → F: Lyase; A → G: Oxidoreduktase; B → C: Oxidoreduktase; A → B: Transferase'));
  addSection(q, SA('Die Gruppe „-OP" (4.3)', 'Benennen Sie die eingekreiste funktionelle Gruppe und zeichnen Sie die vollständige Struktur von „-OP" bei physiologischem pH-Wert.', 'Phosphorsäureester: R-O-PO_3^{2-}'));
});

patch('bw51 sapropterin', () => {
  const q = Q('bw51-2025-sapropterin');
  q.intro = 'Sapropterin ist ein synthetisches Analogon von Tetrahydrobiopterin, einem wichtigen Co-Faktor für Enzyme, die Phenylalanin abbauen. Es wird zur Behandlung bestimmter Formen der Phenylketonurie (PKU) eingesetzt.';
  const acet = 'C[C@@H]1OC(C)(C)O[C@@H]1';
  const pyrim = 'c1nc(NC(C)=O)[nH]c(=O)c1[N+](=O)[O-]';
  setSec(q, 0, syn('B. Synthese von Sapropterin', [
    G('Ed', '', 'COC(=O)/C=C/C'),
    N('A', 'A', 'C[C@@H]1O[C@H]1C(=O)OC', { explanation: 'Epoxidierung der E-Doppelbindung → trans-Epoxid.' }),
    N('X', 'X', 'CC(C)=O', { name: 'Aceton' }),
    G('AE', '', acet + 'C(=O)OC'),
    N('B', 'B', acet + 'C(=O)O', { explanation: 'Esterverseifung (NaOH), dann Ansäuern.' }),
    G('CK', '', acet + 'C(=O)CCl'),
    N('C', 'C', acet + 'C(=O)CN=[N+]=[N-]', { explanation: 'S_N2 mit Azid.' }),
    G('AK', '', 'C[C@@H]([C@@H](C(=O)CN)O)O'),
    G('PY', '', 'CC(=O)Nc1nc(Cl)c([N+](=O)[O-])c(=O)[nH]1'),
    N('D', 'D', 'C[C@@H]([C@@H](C(=O)CN' + pyrim + ')O)O', { explanation: 'S_NAr: die Aminogruppe ersetzt das Cl am Nitropyrimidinon.' }),
    N('Ee', 'E', 'C[C@@H]([C@@H](C1=Nc2c(NC1)nc(NC(C)=O)[nH]c2=O)O)O', { explanation: 'Die Nitrogruppe wird zum Amin reduziert, das mit dem Keton zum Dihydropterin kondensiert (neuer Heterocyclus).' }),
    N('F', 'F', 'C[C@@H]([C@@H]([C@H]1CNc2nc(NC(C)=O)[nH]c(=O)c2N1)O)O', { caption: 'Sapropterin', explanation: 'Hydrierung der weniger stabilen C=N-Bindung → Tetrahydropterin (6R).' })
  ], [
    E('Ed', 'A', 'm-CPBA'),
    E(['A', 'X'], 'AE', 'Lewissäure'),
    E('AE', 'B', 'NaOH, EtOH'),
    E('B', 'CK'),
    E('CK', 'C', 'Aceton', 'NaN_3'),
    E('C', 'AK'),
    E(['AK', 'PY'], 'D'),
    E('D', 'Ee', 'H_2 Pd/C, EtOH'),
    E('Ee', 'F', 'H_2 Pd/C, EtOH')
  ], {
    hints: [
      'm-CPBA = meta-Chlorperbenzoesäure',
      'Bei der Bildung von E bildet sich ein weiterer Heterocyclus.',
      'Bei der Bildung von F wird die weniger stabile Doppelbindung angegriffen.'
    ]
  }));
});

patch('bw51 farnesol', () => {
  const q = Q('bw51-2025-farnesol');
  q.intro = 'Farnesol wurde um 1905 nach dem Farnese-Akazienbaum (Vachellia farnesiana) benannt, da die Substanz in der Essenz von dessen Blüten identifiziert wurde. Gleich mehrere Wege — Strukturaufklärung und Synthese — führen hier zur Struktur des Farnesols.';
  const tail = 'CC/C=C(\\C)CCC=C(C)C';
  const FARN = 'CC(=CCC/C(=C/CC/C(=C/CO)/C)/C)C';
  const rest = q.sections.slice(1);
  q.sections = [
    syn('Strukturaufklärung: Ozonolyse', [
      G('FA', 'Farnesol', FARN),
      N('A', 'A', 'CC(=O)CCC=O', { caption: '(2 Äquivalente)' }),
      N('B', 'B', 'CC(C)=O'),
      N('C', 'C', 'OCC=O')
    ], [
      E('FA', 'A', '1. O_3', '2. (CH_3)_2S'),
      E('FA', 'B', '1. O_3', '2. (CH_3)_2S'),
      E('FA', 'C', '1. O_3', '2. (CH_3)_2S')
    ], {
      body: 'Farnesol wurde einer Ozonolyse unterworfen und mit Dimethylsulfid aufgearbeitet. Dabei erhielt man die drei Substanzen A, B und C im Verhältnis 2 : 1 : 1 (NMR in CD_3OD).',
      hints: [
        'A: ^1H δ = 9,6 (1H, t, 6,65 Hz); 2,9 (2H, td, 7,41 Hz, 6,65 Hz); 2,7 (2H, t, 7,41 Hz); 2,1 (3H, s). ^{13}C δ = 29,8; 35,6; 37,5; 200,0; 206,5 ppm.',
        'B: ^1H δ = 2,1 (6H, s). ^{13}C δ = 30,7; 206,7 ppm.',
        'C: ^1H δ = 9,5 (1H, t, 6,03 Hz); 3,8 (2H, 6,03 Hz). ^{13}C δ = 63,9; 201,4 ppm.'
      ]
    }),
    syn('Strukturaufklärung: Reaktionen 1–4', [
      G('FA', 'Farnesol', FARN),
      N('R1', 'Reaktion 1', 'CC(C)CCCC(C)CCCC(C)CCO'),
      N('R2', 'Reaktion 2', 'CC(=CCC/C(=C/CC/C(=C/COC(C)=O)/C)/C)C'),
      N('R3', 'Reaktion 3', 'CC(=CCC/C(=C/CC/C(=C/C=O)/C)/C)C'),
      N('R4', 'Reaktion 4', 'CC(=CCC/C(=C/CC/C(=C/C=NO)/C)/C)C')
    ], [
      E('FA', 'R1', '3 Äq. H_2'),
      E('FA', 'R2', 'Ethansäureanhydrid'),
      E('FA', 'R3', 'Chrom(VI)-oxid'),
      E('R3', 'R4', 'Hydroxylamin')
    ]),
    syn('Synthese', [
      G('EA', '', 'CCOC(=O)CC(C)=O'),
      G('GC', '', 'ClC/C=C(\\C)CCC=C(C)C'),
      N('A2', 'A', 'CCOC(=O)C(C(C)=O)C/C=C(\\C)CCC=C(C)C'),
      N('B2', 'B', 'CC(=O)' + tail, { explanation: 'Esterverseifung und Decarboxylierung der β-Ketosäure → Geranylaceton.' }),
      N('C2', 'C', 'CC(Cl)(Cl)' + tail, { explanation: 'PCl_5 wandelt das Keton in das geminale Dichlorid um (M = 248 u, Cl_2-Isotopenmuster).' }),
      N('D2', 'D', '[Na]C#C' + tail, { explanation: 'Doppelte Eliminierung von HCl; das terminale Alkin wird zum Natriumacetylid deprotoniert.' }),
      N('E2', 'E', 'OCC#C' + tail, { explanation: 'A_N des Acetylids an Formaldehyd → Propargylalkohol (IR: 2155 und 3300 cm^{-1}).' }),
      G('F2', 'F', 'OC/C=C(\\I)' + tail),
      N('Fa', 'Farnesol', FARN, { explanation: 'Me_2CuLi ersetzt das Vinyliodid unter Retention → (2E,6E)-Farnesol.' })
    ], [
      E(['EA', 'GC'], 'A2', 'NaOEt', 'EtOH'),
      E('A2', 'B2', '1. Ba(OH)_2', '2. HCl'),
      E('B2', 'C2', 'PCl_5', '-POCl_3'),
      E('C2', 'D2', 'NaNH_2 / NH_3(l)'),
      E('D2', 'E2', 'H_2CO'),
      E('E2', 'F2'),
      E('F2', 'Fa', 'Me_2CuLi')
    ], {
      hints: [
        'Von C ist ein Massenspektrum gegeben: Molekülpeaks bei m/z = 248, 250 und 252 (Intensitäten ≈ 100 : 65 : 11).',
        'D und E zeigen Signale im IR — D: eine Bande bei 2260 cm^{-1}; E: bei 2155 cm^{-1} und eine breite Bande bei 3300 cm^{-1}.'
      ]
    }),
    ...rest
  ];
  addSection(q, SA('IUPAC-Name von Farnesol (4.11)', 'Geben Sie den IUPAC-Namen von Farnesol samt Stereodeskriptoren an.', '(2E,6E)-3,7,11-Trimethyldodeca-2,6,10-trien-1-ol'));
  const st = q.sections.findIndex(s => /Stereoisomere/.test(s.title || ''));
  if (st >= 0) q.sections[st].expected_answer = '4 (zwei stereogene Doppelbindungen: C2=C3 und C6=C7 → 2^2 = 4).';
});

patch('bw51 fettsaeure', () => {
  const q = Q('bw51-2025-fettsaeure-biosynthese');
  q.intro = 'Die Fettsäurebiosynthese ist ein anaboler Prozess im Cytosol, bei dem Fettsäuren durch schrittweise Verlängerung aus C_2-Einheiten synthetisiert werden. In Eukaryoten und vielen Bakterien erfolgt die Synthese an einem Multienzymkomplex.';
  const BIO = 'O=C1NC2CSC(CCCCC(=O)NC)C2N1';
  const SNAC = 'SCCNC(C)=O';
  const rest = q.sections.slice(1);
  q.sections = [
    syn('Glg. 1 und 2: Bildung von Malonyl-CoA (5.1)', [
      G('HC', 'Hydrogencarbonat', 'OC(=O)[O-]'),
      N('A', 'A', '[O-]C(=O)OP(=O)([O-])[O-]', { name: 'Carboxyphosphat' }),
      G('BE', 'Biotin-Enzym', BIO),
      N('C', 'C', '[O-]C(=O)N1C(=O)NC2CSC(CCCCC(=O)NC)C21', { name: 'Carboxybiotin-Enzym' }),
      N('D', 'D', '[O-]P(=O)([O-])[O-]', { name: 'Phosphat' }),
      N('M', 'Malonyl-CoA', '[O-]C(=O)CC(=O)' + SNAC, { name: 'Malonyl-CoA (CoA hier als SNAC-Modell)' })
    ], [
      E('HC', 'A', 'ATP', '(+ B = ADP)'),
      E(['BE', 'A'], 'C'),
      E(['BE', 'A'], 'D'),
      E('C', 'M', 'Acetyl-CoA', '(+ E = Biotin-Enzym)')
    ], {
      body: 'Glg. 1: Hydrogencarbonat + ATP → A + B. Glg. 2: Biotin-Enzym + A → C + D; + Acetyl-CoA → Malonyl-CoA + E.',
      hints: ['Abkürzungen: AC = Acetyl-CoA-Carboxylase, ER = Enoyl-ACP-Reduktase, HD = 3-Hydroxyacyl-ACP-Dehydratase, KS = β-Ketoacyl-ACP-Synthase, KR = β-Ketoacyl-ACP-Reduktase.']
    }),
    syn('Verlängerungscyclus an der FS-Synthase (5.2)', [
      G('S0', '', 'CC(=O)' + SNAC + '.[O-]C(=O)CC(=O)' + SNAC, { name: 'Acetyl- und Malonyl-FS-Synthase' }),
      G('S1', '', 'CC(=O)CC(=O)' + SNAC),
      N('S2', '', 'C[C@@H](O)CC(=O)' + SNAC, { name: '3-Hydroxybutyryl-FS', explanation: 'KR (β-Ketoacyl-ACP-Reduktase) reduziert die Ketogruppe mit NADPH/H^+.' }),
      N('S3', '', 'C/C=C/C(=O)' + SNAC, { name: 'Crotonyl-FS', explanation: 'HD (Dehydratase) spaltet Wasser ab (Y = H_2O).' }),
      N('S4', '', 'CCCC(=O)' + SNAC, { name: 'Butyryl-FS', explanation: 'ER (Enoyl-ACP-Reduktase) reduziert die C=C-Bindung mit NADPH/H^+.' })
    ], [
      E('S0', 'S1', '○', '± Y'),
      E('S1', 'S2', '○  NADPH/H^+', '→ NADP^+'),
      E('S2', 'S3', '○', '± Y'),
      E('S3', 'S4', '○  NADPH/H^+', '→ NADP^+')
    ], {
      body: 'Die Kreise ○ stehen für die jeweils nötigen Enzyme (Abkürzungen oben). Die FS-Synthase ist hier als S-Thioester-Modell (SNAC) gezeichnet.',
      hints: ['Beim ersten Schritt (KS) wird CO_2 abgespalten.']
    }),
    ...rest
  ];
  addSection(q, SA('Enzyme und Nebenprodukte im Cyclus (5.2)', 'Welche Enzyme gehören in die Kreise und welche Nebenprodukte Y entstehen?',
    'Acetyl/Malonyl → Acetoacetyl: KS, Y = CO_2 (abgespalten). Reduktion: KR (NADPH). Dehydratisierung: HD, Y = H_2O. Reduktion der C=C-Bindung: ER (NADPH).'));
});
