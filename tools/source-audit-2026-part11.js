/* Source audit, part 11 — Landeswettbewerbe (LW 43–52), papers from
   oecho.at/bewerb/aufgaben. */
const { Q, N, G, E, syn, SA, setSec, findSec, addSection, upsertQuestion, patch } = require('./source-audit-2026');

const dimeo = 'c1ccc(OC)c(OC)c1';

patch('lw43 papaverin', () => {
  const q = Q('lw43-2017-papaverin');
  q.intro = 'Papaverin ist ein Alkaloid des Isochinolin-Typs und besitzt eine direkte krampflösende Wirkung auf die glatte Muskulatur. Es ist u. a. im Milchsaft des Schlafmohns enthalten. Nach der Strukturaufklärung durch G. Goldschmiedt folgte 1908 die erste Totalsynthese durch Pictet und Gams. Wir betrachten eine Synthese ausgehend von Vanillin.';
  const rest = q.sections.filter(s => s.type !== 'synthesis');
  q.sections = [syn('Die Synthese von Papaverin', [
    G('V', 'Vanillin', 'COc1cc(C=O)ccc1O'),
    N('A', 'A', 'O=C' + dimeo),
    N('B', 'B', 'OC' + dimeo, { caption: 'C_9H_12O_3' }),
    N('C', 'C', 'ClC' + dimeo),
    G('D', 'D', 'N#CC' + dimeo),
    N('Ee', 'E', 'NCC' + dimeo, { explanation: 'LiAlH_4 reduziert das Nitril zum primären Amin (C_10H_15NO_2).' }),
    N('F', 'F', 'OC(=O)C' + dimeo, { explanation: 'Saure Hydrolyse des Nitrils.' }),
    G('Gg', 'G', 'ClC(=O)C' + dimeo),
    N('H', 'H', 'O=C(C' + dimeo + ')NCC' + dimeo, { explanation: 'Aminolyse des Säurechlorids → Säureamid.' }),
    G('DHI', '', 'COc1ccc(CC2=NCCc3cc(OC)c(OC)cc32)cc1OC', { explanation: 'Bischler-Napieralski-Cyclisierung (POCl_3) → 3,4-Dihydroisochinolin.' }),
    G('P', 'Papaverin', 'COc1ccc(Cc2nccc3cc(OC)c(OC)cc23)cc1OC')
  ], [
    E('V', 'A', '1. NaOH, 2. (CH_3)_2SO_4', 'S_N'),
    E('A', 'B', 'NaBH_4', 'RED'),
    E('B', 'C', 'HCl(g)', '?'),
    E('C', 'D', 'NaCN', '?'),
    E('D', 'Ee', 'LiAlH_4'),
    E('D', 'F', 'H^+/H_2O'),
    E('F', 'Gg', 'SOCl_2'),
    E(['Ee', 'Gg'], 'H', 'Δ', '-HCl'),
    E('H', 'DHI', '(POCl_3)', '-H_2O'),
    E('DHI', 'P', 'Pt, Δ')
  ], {
    body: 'D ist Ausgangsmaterial für die zwei Schlüsselbausteine E und G des Papaverins.',
    hints: ['E ist ein Amin mit der Zusammensetzung (m/m): 66,3 % C, 8,3 % H, 7,7 % N, Rest O.']
  }), ...rest];
  addSection(q, SA('Reaktionstypen (b)', 'Was müsste man statt der beiden Fragezeichen (B → C und C → D) als Reaktionstypen unter die Pfeile schreiben?', 'Beide Male S_N (nucleophile Substitution).'), 0);
  addSection(q, SA('Summenformel von E (c)', 'Berechnen Sie die Summenformel von E.', 'C_10H_15NO_2'), 1);
});

patch('lw44 oxybuprocain', () => {
  const q = Q('lw44-2018-oxybuprocain');
  q.source = 'ÖChO Landeswettbewerb 2018 (LW 44), Problem E';
  q.intro = 'Drei organische Aufgaben. Oxybuprocain (C_17H_28N_2O_3) ist ein wirksames Lokalanästhetikum, das vor allem in der Augenheilkunde und bei Erkrankungen im Hals-Nasen-Ohren-Bereich Verwendung findet. Es liegt dann wegen der besseren Wasserlöslichkeit als Hydrochlorid vor.';
  const rest = q.sections.filter(s => s.type !== 'synthesis');
  const ar = (x) => 'c1ccc(' + x + ')c(OCCCC)c1';
  q.sections = [
    syn('E.1 Chemische Strukturermittlung', [
      N('A', 'A', 'CCC=C(C)C', { caption: 'C_6H_12', name: '2-Methylpent-2-en' }),
      N('K', '', 'CC(C)=O', { name: 'Propanon (reagiert mit DNPH, nicht mit Fehling)' }),
      N('S', '', 'CCC(=O)O', { name: 'Propansäure (M ≈ 74 g/mol)' })
    ], [
      E('A', 'K', 'KMnO_4 / H^+'),
      E('A', 'S', 'KMnO_4 / H^+')
    ], {
      body: 'Eine organische acyclische Verbindung A hat die Summenformel C_6H_12. Oxidiert man A mit Kaliumpermanganat in saurer Lösung, so werden nach Molekülspaltung zwei Produkte isoliert.',
      hints: [
        'Eines der Produkte gibt mit 2,4-Dinitrophenylhydrazin einen gelben Niederschlag, reagiert aber nicht mit Fehling-Reagenz. Das zweite Produkt ist eine Säure.',
        '1,814 g dieser Säure werden in Wasser gelöst und auf 100 cm^3 verdünnt. 10,0 cm^3 titriert man mit 0,104 M NaOH, wobei 23,6 cm^3 verbraucht werden.'
      ]
    }),
    syn('E.2 Synthese von Oxybuprocain', [
      G('MB', '', 'COC(=O)c1ccccc1'),
      N('B', 'B', 'OC(=O)c1cccc([N+](=O)[O-])c1', { caption: '50,3 % C, 3,0 % H, 8,4 % N; Rest O' }),
      N('C', 'C', 'OC(=O)c1cccc(N)c1', { caption: 'C_7H_7NO_2' }),
      G('D', 'D', 'OC(=O)c1cccc(O)c1'),
      N('Ee', 'E', 'OC(=O)c1ccc([N+](=O)[O-])c(O)c1', { caption: 'C_7H_5NO_5', explanation: 'Nitrierung (S_E) ortho zur OH-Gruppe, para zur Carboxygruppe.' }),
      N('F', 'F', 'CCOC(=O)c1ccc([N+](=O)[O-])c(O)c1'),
      N('Gg', 'G', 'CCOC(=O)' + ar('[N+](=O)[O-]').replace('c1ccc(', 'c1ccc('), { caption: 'C_13H_17NO_5', explanation: 'Williamson-Ethersynthese: KOH deprotoniert das Phenol, S_N2 an n-Brombutan.' }),
      N('H', 'H', 'OC(=O)c1ccc([N+](=O)[O-])c(OCCCC)c1', { caption: 'C_11H_13NO_5' }),
      G('I', 'I', 'ClC(=O)c1ccc([N+](=O)[O-])c(OCCCC)c1'),
      G('J', 'J', 'CCN(CC)CCO'),
      N('K2', 'K', 'CCN(CC)CCOC(=O)c1ccc([N+](=O)[O-])c(OCCCC)c1'),
      G('OX', 'Oxybuprocain', 'CCCCOc1cc(C(=O)OCCN(CC)CC)ccc1N')
    ], [
      E('MB', 'B', '1. HNO_3/H_2SO_4', '2. NaOH/dann H^+'),
      E('B', 'C', 'H_2 / Pd'),
      E('C', 'D', '1. NaNO_2 / H^+', '2. H_2O verkochen'),
      E('D', 'Ee', 'HNO_3'),
      E('Ee', 'F', 'C_2H_5OH / H^+'),
      E('F', 'Gg', '1. KOH', '2. + n-Brombutan'),
      E('Gg', 'H', '1. KOH', '2. H^+'),
      E('H', 'I', 'SOCl_2'),
      E(['I', 'J'], 'K2', 'J'),
      E('K2', 'OX', '(Reduktion)')
    ], { body: 'Das Schema zeigt die Synthese beginnend mit Methylbenzoat bis zu K, der unmittelbaren Vorstufe von Oxybuprocain.' }),
    ...rest
  ];
  q.sections[1].scheme.nodes.find(n => n.id === 'Gg').smiles = 'CCOC(=O)c1ccc([N+](=O)[O-])c(OCCCC)c1';
  addSection(q, SA('Säure und Keton aus A (E.1 e)', 'Berechnen Sie die Molmasse der Säure und geben Sie die Struktur des Produktes an, das mit 2,4-Dinitrophenylhydrazin reagiert.', 'M = 1,814 g / (10 · 0,104 mol/L · 0,0236 L) ≈ 74 g/mol → Propansäure. Zweites Produkt: Propanon (Aceton). A = 2-Methylpent-2-en.'), 1);
  addSection(q, SA('Summenformel von B (E.2 c)', 'Berechnen Sie die Summenformel von B.', 'C_7H_5NO_4'));
  addSection(q, SA('K → Oxybuprocain und D → E (E.2 d, e)', 'Durch welche Art Reaktion gelangt man von K zum Oxybuprocain? Nach welchem Mechanismus verläuft D → E?', 'K → Oxybuprocain: Reduktion (der Nitrogruppe). D → E: elektrophile Substitution (S_E).'));
  addSection(q, SA('Herstellung von J (E.2 g)', 'J kann in zwei Schritten aus je 1 mol Ethandiol, HCl und Diethylamin hergestellt werden. Formulieren Sie beide Schritte.', '1) HO-CH_2CH_2-OH + HCl → HO-CH_2CH_2-Cl + H_2O. 2) HO-CH_2CH_2-Cl + HN(C_2H_5)_2 → HO-CH_2CH_2-N(C_2H_5)_2 + HCl'));
});

patch('lw45 phenylacetylen', () => {
  const q = Q('lw45-2019-phenylacetylen-routen');
  q.name = 'Ein Student der organischen Chemie — LW 2019';
  q.intro = 'Ein Student, nennen wir ihn in Anlehnung an einen großen deutschen Chemiker des 19. Jahrhunderts Justus, findet in einem Lehrbuch für organische Synthesen seines Großvaters aus dem Jahr 1922 eine Vorschrift für die Synthese der Verbindung X und probiert sie sofort aus.';
  const X = 'C#Cc1ccccc1';
  const BS = 'Br/C=C/c1ccccc1';
  const rest = q.sections.filter(s => s.type !== 'synthesis');
  q.sections = [
    syn('E.1 Eine Synthese aus Großvaters Buch', [
      N('P1', '', BS, { caption: '1-Brom-2-phenylethen' }),
      N('X', 'X', X, { name: 'Ethinylbenzen (Phenylacetylen)' })
    ], [E('P1', 'X', 'KOH', '200 °C')], {
      hints: ['Er bringt 100 g 1-Brom-2-phenylethen mit 150 g heißer KOH bei 200 °C zur Reaktion. Nach Aufarbeitung erhält er 37,0 g der Verbindung X, welche laut Elementaranalyse 94,08 % C, aber kein Heteroatom enthält.']
    }),
    syn('E.2 Alternative Synthesewege — Weg 1', [
      G('Bz', '', 'c1ccccc1'),
      N('A', 'A', 'CC(=O)c1ccccc1'),
      N('B', 'B', 'CC(Cl)(Cl)c1ccccc1', { caption: '54,9 % C, enthält -CH_3' }),
      N('X', 'X', X)
    ], [
      E('Bz', 'A', 'CH_3COCl', 'AlCl_3'),
      E('A', 'B', '+ PCl_5', '- POCl_3'),
      E('B', 'X', '+ KOH', 'Δ')
    ]),
    syn('E.2 Alternative Synthesewege — Weg 2', [
      G('Bz', '', 'c1ccccc1'),
      N('D', 'D', 'Brc1ccccc1'),
      N('Ee', 'E', 'Br[Mg]c1ccccc1'),
      N('F', 'F', 'CC(O)c1ccccc1'),
      G('St', 'Styren', 'C=Cc1ccccc1'),
      N('Gg', 'G', 'BrCC(Br)c1ccccc1'),
      N('X', 'X', X),
      N('H1', 'H_1', 'COC(CBr)c1ccccc1'),
      N('H2', 'H_2', 'BrC(COC)c1ccccc1')
    ], [
      E('Bz', 'D', 'Br_2', 'FeBr_3'),
      E('D', 'Ee', 'Mg'),
      E('Ee', 'F', '+ CH_3CHO', 'dann H^+/H_2O'),
      E('F', 'St', 'H^+', '-H_2O'),
      E('St', 'Gg', '+ Br_2', 'in Cyclohexan'),
      E('Gg', 'X', 'KOH', 'in EtOH'),
      E('St', 'H1', 'Br_2', 'in Methanol'),
      E('St', 'H2', 'Br_2', 'in Methanol')
    ], {
      hints: [
        'In einem ersten Versuch führte Justus die Bromierung von Styren in Methanol statt Cyclohexan durch und erhielt fast ausschließlich zwei Konstitutionsisomere H_1 und H_2.',
        '^1H-NMR (für beide ähnlich): 3,2 ppm (s, 3H); 3,8 ppm (m, 1H); 4,0 ppm (m, 1H); 4,7 ppm (t, 1H); 7,4 ppm (m, 5H). Elementaranalyse von H: 50,20 % C, 5,10 % H, 37,15 % Br, Rest O.'
      ]
    }),
    syn('E.3 Als der Ausgangsstoff zur Neige geht', [
      G('Zs', '', 'OC(=O)/C=C/c1ccccc1'),
      N('K', 'K', 'OC(=O)C(Br)C(Br)c1ccccc1', { explanation: 'anti-Addition von Br_2 → Gemisch der Stereoisomere (2 Enantiomerenpaare möglich).' }),
      N('L', 'L', 'OC(=O)/C(Br)=C/c1ccccc1', { caption: '2-Brom-3-phenylprop-2-ensäure' }),
      N('P1', '', BS, { caption: '1-Brom-2-phenylethen' })
    ], [
      E('Zs', 'K', 'Br_2, CCl_4'),
      E('K', 'L', 'NaOAc, EtOH/H_2O', '- HBr'),
      E('L', 'P1', 'Δ', '- CO_2')
    ], {
      body: 'Justus beschließt, 1-Brom-2-phenylethen selbst zu synthetisieren. Ausgangsmaterial ist die Zimtsäure (3-Phenylpropensäure).',
      hints: ['Käufliche Zimtsäure ist (E)-3-Phenylpropensäure. Wird diese mit Br_2 umgesetzt, sind theoretisch 4 Additionsprodukte möglich.']
    }),
    syn('E.3 Synthese des heterocyclischen Aromaten O', [
      N('X', 'X', X, { caption: '2 X' }),
      N('M', 'M', 'C(#Cc1ccccc1)C#Cc1ccccc1'),
      N('Nn', 'N', 'O=C(CCC(=O)c1ccccc1)c1ccccc1', { caption: 'C_16H_14O_2' }),
      N('O', 'O', 'c1ccc(-c2ccc(-c3ccccc3)o2)cc1', { caption: 'C_16H_12O' })
    ], [
      E('X', 'M', 'Pyridin, -2 e^-', 'CuCl'),
      E('M', 'Nn', '+ H_2O', 'Hg(II)acetat'),
      E('Nn', 'O', 'P_2O_5')
    ], {
      hints: ['M zeigt im ^1H-NMR-Spektrum nur Protonen im Aromatenbereich. Das ^1H-NMR-Spektrum von N zeigt neben aromatischen Protonen ein Singulett bei δ = 3,5 ppm; das Intensitätsverhältnis von Aromaten-H zu Aliphaten-H ist 5:2.']
    }),
    ...rest
  ];
  addSection(q, SA('Summenformel und Name von X (b, c)', 'Berechnen Sie die Summenformel von X und benennen Sie X nach IUPAC.', 'C_8H_6; Ethinylbenzen (Phenylacetylen).'), 0);
  addSection(q, SA('Summenformel von H (g)', 'Berechnen Sie die Summenformel von H.', 'C_9H_11BrO'));
});

patch('lw48 terpene + elemicin', () => {
  const q = Q('lw48-2022-elemicin');
  q.source = 'ÖChO Landeswettbewerb 2022 (LW 48), Problem E';
  q.name = 'Terpene und Phenylpropanoide: Elemicin — LW 2022';
  q.intro = 'In dieser Aufgabe geht es um Terpene und Phenylpropanoide. Terpene sind aus Isopreneinheiten (Isopren = 2-Methylbuta-1,3-dien) aufgebaut. Phenylpropanoide leiten sich vom Phenylpropan (IUPAC: Propylbenzen) ab.';
  const tmp = 'c1cc(OC)c(OC)c(OC)c1';
  const rest = q.sections.filter(s => s.type !== 'synthesis');
  const dib = rest.find(s => /DIBAL/.test(s.title || ''));
  if (dib) {
    dib.title = 'Reagenz Y (p)';
    dib.prompt = 'Wählen Sie für die Umsetzung von E zu G ein geeignetes Reagenz Y aus: LiAlH_4, H_2SO_4, DIBAL-H, H_2O_2, Cr_2O_7^{2-}/H^+, KMnO_4.';
  }
  q.sections = [
    syn('E.1 Rund um den Terpenbaustein Isopren', [
      N('IS', 'Isopren', 'C=CC(C)=C'),
      N('IH', '', 'CCC(C)C', { name: '2-Methylbutan' })
    ], [E('IS', 'IH', 'H_2 (vollständige Hydrierung)')]),
    syn('E.4 Synthese des Phenylpropanoids Elemicin', [
      G('A', 'A', 'OC(=O)c1cc(O)c(O)c(O)c1'),
      N('B', 'B', 'OC(=O)' + tmp, { caption: 'C_10H_12O_5' }),
      N('C', 'C', 'ClC(=O)' + tmp),
      N('D', 'D', 'NC(=O)' + tmp),
      N('Ee', 'E', 'N#C' + tmp),
      N('F', 'F', 'OC' + tmp, { explanation: 'LiAlH_4 reduziert die Carbonsäure zum primären Alkohol (C_10H_14O_4).' }),
      G('Gg', 'G', 'O=C' + tmp)
    ], [
      E('A', 'B', '1) NaOH(aq), (CH_3)_2SO_4', '2) HCl(aq)'),
      E('B', 'C', 'SOCl_2', '-SO_2, -HCl'),
      E('C', 'D', 'NH_3', '-X'),
      E('D', 'Ee', 'P_4O_10', '-H_2O'),
      E('Ee', 'Gg', '+Y'),
      E('B', 'F', 'LiAlH_4'),
      E('F', 'Gg', 'MnO_2')
    ], {
      hints: [
        'F enthält 10 C-Atome. Elementaranalyse (m/m): C: 60,6 %, H: 7,1 %, O: 32,3 %.',
        'X: als Reinstoff bei RT gasförmig, M = 36,5 g/mol.',
        '^1H-NMR von B: δ ≈ 12,8 ppm (1H), 7,3 ppm (2H), 3,85 ppm (6H), 3,75 ppm (3H).'
      ]
    }),
    syn('E.4 Die weiteren Schritte zum Elemicin', [
      G('Gg', 'G', 'O=C' + tmp),
      N('H', 'H', 'CC[C@@H](O)' + tmp),
      N('I', 'I', 'C/C=C/' + tmp),
      N('J', 'J', 'C=CC' + tmp, { caption: 'Elemicin' })
    ], [
      E('Gg', 'H', '1) H_5C_2-Mg-I', '2) H^+/H_2O'),
      E('H', 'I', 'Dehydratisierung', 'p-TsOH (Kat.)'),
      E('I', 'J', 'Isomerisierung')
    ], { hints: ['I und J sind Stellungsisomere (Regioisomere). Verbindung I kann E- oder Z-konfiguriert vorliegen, Verbindung J hingegen nicht.'] }),
    ...rest
  ];
  addSection(q, SA('Summenformeln von F und X (n)', 'Schreiben Sie die Summenformeln von F und X auf.', 'F: C_10H_14O_4; X: HCl'), 2);
});

patch('lw49 tazaroten', () => {
  const q = Q('lw49-2023-tazaroten');
  q.intro = 'Gegen Schuppenflechte oder Akne kann Tazaroten (Zorac®, Tazorac®) als Creme verschrieben werden (0,05 % m/m, inaktive Vorstufe des Wirkstoffs). In dieser Aufgabe geht es um die Synthese von Tazaroten ausgehend von 2-Chlor-5-methylpyridin. Im Reaktionsschema sind nicht alle Nebenprodukte (z. B. H_2O, HCl) angegeben.';
  const tc = 'c1ccc2SCCC(C)(C)c2c1';
  const rest = q.sections.filter(s => s.type !== 'synthesis');
  q.sections = [
    syn('Teil 1: Bildung des Esters B', [
      G('PY', '', 'Cc1ccc(Cl)nc1'),
      N('A', 'A', 'OC(=O)c1ccc(Cl)nc1'),
      N('B', 'B', 'CCOC(=O)c1ccc(Cl)nc1', { caption: '(ein Ester)' }),
      N('C', 'C', 'O=C(Cl)c1ccc(Cl)nc1')
    ], [
      E('PY', 'A', 'KMnO_4'),
      E('A', 'B', 'Ethanol', 'H_2SO_4'),
      E('A', 'C', 'SOCl_2', '-SO_2; -HCl'),
      E('C', 'B', 'Ethanol')
    ]),
    syn('Teil 2: Verbindung I aus Thiophenol', [
      G('TP', 'Thiophenol', 'Sc1ccccc1'),
      N('D', 'D^-', '[S-]c1ccccc1', { caption: 'Na^+ [D^-]' }),
      N('Ee', 'E', 'CC(C)=CCSc1ccccc1', { caption: 'C_11H_14S' }),
      N('F', 'F', 'CC1(C)CCSc2ccccc21', { caption: 'C_11H_14S', explanation: 'Lewissäure-vermittelte intramolekulare Friedel-Crafts-Alkylierung → 4,4-Dimethylthiochroman.' }),
      N('Gg', 'G', 'CC(=O)' + tc, { caption: 'C_13H_16SO', explanation: 'Friedel-Crafts-Acylierung (S_E) para zum Schwefel.' }),
      N('H', 'H^-', 'C=C([O-])' + tc, { caption: 'Li^+ [H^-]', explanation: 'LDA deprotoniert die Methylgruppe → Enolat.' }),
      G('Z', 'Z', 'C=C(OP(=O)(OCC)OCC)' + tc),
      G('I', 'I', 'C#C' + tc)
    ], [
      E('TP', 'D', 'NaOH'),
      E('D', 'Ee', '(CH_3)_2C=CH-CH_2Br'),
      E('Ee', 'F', 'Cyclisierung', 'Lewissäure'),
      E('F', 'Gg', 'CH_3COCl', 'AlCl_3'),
      E('Gg', 'H', 'LDA (starke Base)', '- Diisopropylamin'),
      E('H', 'Z', '(EtO)_2P(O)Cl'),
      E('Z', 'I', 'LDA', '- Diisopropylamin, - (EtO)_2PO_2^- Li^+')
    ], { hints: ['Von den Substanzen E, F und G kennt man die Summenformeln: E: C_11H_14S, F: C_11H_14S, G: C_13H_16SO. Et = C_2H_5.'] }),
    syn('Tazaroten', [
      N('I2', 'I', 'C#C' + tc),
      N('B2', 'B', 'CCOC(=O)c1ccc(Cl)nc1'),
      G('TZ', 'Tazaroten', 'CCOC(=O)c1ccc(C#C' + tc + ')nc1')
    ], [E(['I2', 'B2'], 'TZ', '(Kupplung)')], { body: 'Das Zielmolekül Tazaroten ist in der Angabe abgebildet; I und B werden gekuppelt.' }),
    ...rest
  ];
  addSection(q, SA('Summenformel von I (b)', 'Bestimmen Sie die Summenformel von I.', 'C_13H_14S'), 2);
  addSection(q, SA('Funktionelle Gruppe H^- (d)', 'Nennen Sie den allgemeinen Namen der anionischen funktionellen Gruppe in H^-.', 'Enolat'), 3);
});

patch('lw50 rohypnol', () => {
  const q = Q('lw50-2024-rohypnol');
  q.intro = 'K.-o.-Tropfen — Nomenklatur, Isomerie & organische Synthese. Das folgende Reaktionsschema zeigt die Synthese von Rohypnol (Flunitrazepam).';
  const FPh = 'c1ccccc1F';
  const rest = q.sections.filter(s => s.type !== 'synthesis');
  q.sections = [syn('D.2 Synthese von Rohypnol', [
    G('FT', '', 'Cc1ccccc1F'),
    N('A', 'A', 'BrC' + FPh, { caption: 'C_7H_6BrF' }),
    N('B', 'B', 'N#CC' + FPh, { caption: 'C_8H_6FN' }),
    N('C', 'C', 'OC(=O)C' + FPh, { caption: 'C_8H_7FO_2' }),
    N('D', 'D', 'ClC(=O)C' + FPh, { caption: 'C_8H_6ClFO' }),
    N('Ee', 'E', 'O=C(C' + FPh + ')c1ccccc1', { caption: 'C_14H_11FO' }),
    N('F', 'F', 'C(=NNc1ccccc1)(C' + FPh + ')c1ccccc1', { caption: 'C_20H_17FN_2' }),
    G('IN', '', 'Fc1ccccc1-c1c(-c2ccccc2)[nH]c2ccccc12', { explanation: 'Fischer-Indolsynthese aus dem Phenylhydrazon F.' }),
    N('Gg', 'G', 'OC(=O)c1ccccc1', { explanation: 'Ozonolyse der Indol-C2=C3-Bindung und oxidative Aufarbeitung → Benzoesäure + 2-Amino-2´-fluorbenzophenon.' }),
    G('AB', '', 'Nc1ccccc1C(=O)' + FPh),
    N('H', 'H', 'BrCC(=O)Nc1ccccc1C(=O)' + FPh),
    G('GA', '', 'NCC(=O)Nc1ccccc1C(=O)' + FPh),
    N('I', 'I', 'O=C1CN=C(' + FPh + ')c2ccccc2N1', { explanation: 'Intramolekulare Iminbildung (A_N, dann -H_2O) → 1,4-Benzodiazepin-2-on.' }),
    G('RO', 'Rohypnol', 'CN1C(=O)CN=C(' + FPh + ')c2cc([N+](=O)[O-])ccc21')
  ], [
    E('FT', 'A', 'Br_2', 'UV-Licht'),
    E('A', 'B', 'NaCN'),
    E('B', 'C', 'H_2SO_4'),
    E('C', 'D', 'SOCl_2'),
    E('D', 'Ee', 'Benzen / AlCl_3'),
    E('Ee', 'F', 'Phenylhydrazin'),
    E('F', 'IN', '(mehrere Stufen)'),
    E('IN', 'Gg', '1. O_3', '2. H_2O_2'),
    E('IN', 'AB', '1. O_3', '2. H_2O_2'),
    E('AB', 'H', 'Br-CH_2-CO-Br'),
    E('H', 'GA', 'NH_3'),
    E('GA', 'I', 'Iminbildung', 'intramolekular'),
    E('I', 'RO', '(mehrere Stufen)')
  ]), ...rest];
  const mc = q.sections.findIndex(s => s.type === 'multiple_choice');
  if (mc >= 0) q.sections[mc].title = 'Reaktionsmechanismus der Bildung von A (i)';
  addSection(q, SA('Mechanismen A → B und Bildung von I (i)', 'Nach welchen Mechanismen verlaufen A → B und die Bildung von I?', 'A → B: S_N; Bildung von I: A_N (Iminbildung).'));
});

patch('lw50 ghb', () => {
  const q = Q('lw50-2024-ghb-gbl');
  q.intro = 'GHB (Gamma-Hydroxybuttersäure, 4-Hydroxybutansäure) wirkt in geringer Dosis enthemmend, in höherer Dosis sedierend. Durch intramolekulare Veresterung entsteht GBL (Gammabutyrolacton).';
  q.sections[0] = syn('D.1 g/h GHB und GBL', [
    N('GHB', 'GHB', 'OCCCC(=O)O', { caption: '4-Hydroxybutansäure' }),
    N('GBL', 'GBL', 'O=C1CCCO1')
  ], [E('GHB', 'GBL', 'intramolekulare Veresterung', '-H_2O')]);
});

patch('lw51 cyclohexylethanol', () => {
  const q = Q('lw51-2025-cyclohexylethanol');
  q.intro = 'Zwei Synthesen. Und so macht man das Cyclohexylethanol: 1. Phenol A (C_6H_6O) wird vollständig zu B hydriert. 2. B wird mit Schwefelsäure behandelt, es bildet sich der Kohlenwasserstoff C. 3. Wird C mit einer sauren Chromat-Lösung erwärmt, entsteht D (C_6H_10O). 4. D wird mit PBr_3 zu E umgesetzt. 5. E wird mit Magnesium und weiter mit der Verbindung X (in Ether) zum 1-Cyclohexylethanol umgesetzt (Grignard-Reaktion).';
  const s = q.sections[0].scheme;
  s.nodes.find(n => n.id === 'A').caption = 'Phenol, C_6H_6O';
  s.nodes.find(n => n.id === 'D').caption = 'C_6H_10O';
  s.nodes.find(n => n.id === 'F').label = '1-Cyclohexylethanol';
  q.sections[0].title = 'E.1 Synthese von 1-Cyclohexylethanol';
  q.sections[0].hints = ['Im Massenspektrum von E sieht man zwei Peaks bei 162 u und 164 u im Verhältnis ~1:1.'];
  s.edges.forEach(e => {
    if (e.to === 'B') { e.reagent_above = 'vollständige Hydrierung'; delete e.reagent_below; }
    if (e.to === 'C') { e.reagent_above = 'H_2SO_4'; delete e.reagent_below; }
    if (e.to === 'D') { e.reagent_above = 'saure Chromat-Lösung'; e.reagent_below = 'erwärmen'; }
    if (e.to === 'F') { e.reagent_above = '1. Mg'; e.reagent_below = '2. X (in Ether)'; }
  });
  addSection(q, SA('R-1-Phenylethanol (a)', 'Zeichnen Sie die Konfigurationsformel der R-Form von 1-Phenylethanol und kennzeichnen Sie das chirale Zentrum.', '(R)-1-Phenylethanol: C[C@@H](O)c1ccccc1 — das Carbinol-C ist das Stereozentrum.'), 0);
});

patch('lw51 sildenafil', () => {
  const q = Q('lw51-2025-sildenafil');
  q.intro = 'Der Arzneistoff Sildenafil (ursprünglich gegen Herzbeschwerden entwickelt) erlangte große Bekanntheit, als er 1998 von Pfizer als „Viagra" bei erektiler Dysfunktion auf den Markt kam. Tipp: Lassen Sie sich von den großen Strukturen nicht abschrecken — die Reaktionen sind Ihnen vermutlich wohlbekannt.';
  const pz = (a, b) => a + 'c1c(' + b + ')c(CCC)nn1C';
  const rest = q.sections.filter(s => s.type !== 'synthesis');
  q.sections = [syn('E.2 Synthese von Sildenafil', [
    N('A', 'A', 'CCCC(=O)CC(=O)C(=O)OCC', { caption: 'C_9H_14O_4' }),
    G('B', 'B', 'CCOC(=O)c1cc(CCC)n[nH]1'),
    G('C', 'C', 'CCOC(=O)c1cc(CCC)nn1C'),
    N('d', 'd', 'CCO', { caption: '46 g/mol' }),
    N('Ee', 'E', 'OC(=O)c1cc(CCC)nn1C'),
    G('F', 'F', pz('OC(=O)', '[N+](=O)[O-]')),
    N('Gg', 'G', pz('ClC(=O)', '[N+](=O)[O-]')),
    N('H', 'H', pz('NC(=O)', '[N+](=O)[O-]')),
    N('I', 'I', pz('NC(=O)', 'N'), { caption: 'C_8H_14N_4O' }),
    G('AC', '', 'CCOc1ccccc1C(=O)Cl'),
    N('m', 'm', 'Cl', { caption: '36,5 g/mol' }),
    N('K', 'K', pz('NC(=O)', 'NC(=O)c2ccccc2OCC'), { caption: 'enthält 2 Amidgruppen' }),
    G('L', 'L', 'CCCc1nn(C)c2c(=O)[nH]c(-c3ccccc3OCC)nc12'),
    N('Z', 'Z', 'CN1CCNCC1'),
    G('S', 'Sildenafil', 'CCCc1nn(C)c2c1nc(-c1cc(S(=O)(=O)N3CCN(C)CC3)ccc1OCC)[nH]c2=O')
  ], [
    E('A', 'B', 'N_2H_4'),
    E('B', 'C', '+ w'),
    E('C', 'd', '1. NaOH', '2. HCl'),
    E('C', 'Ee', '1. NaOH', '2. HCl'),
    E('Ee', 'F', '+ x'),
    E('F', 'Gg', 'SOCl_2'),
    E('Gg', 'H', 'NH_3'),
    E('H', 'I', 'Fe / HCl'),
    E(['I', 'AC'], 'K'),
    E(['I', 'AC'], 'm'),
    E('K', 'L', '- H_2O'),
    E(['L', 'Z'], 'S', '1. ClSO_3H', '2. + Z, -HCl')
  ], {
    hints: ['^1H-NMR des Ausgangsstoffs A (C_9H_14O_4): δ ≈ 4,7 ppm (s, 2H, a); 4,2 ppm (q, 2H, b); 2,4 ppm (t, 2H, c); 1,6 ppm (m, 2H, d); 1,25 ppm (t, 3H, e); 0,9 ppm (t, 3H, f).']
  }), ...rest];
  addSection(q, SA('Reagenz w (f)', 'Wählen Sie ein Reagenz w für B → C: CH_3Li, CH_3MgBr, (CH_3)_2SO_4 oder CH_3OH.', '(CH_3)_2SO_4'));
  addSection(q, SA('x und m (g)', 'Geben Sie die Summenformeln von Reagenz x (2 Substanzen) und Nebenprodukt m an.', 'x = HNO_3 / H_2SO_4; m = HCl'));
  addSection(q, SA('Mechanismen (h)', 'Nach welchen Mechanismen verlaufen C → d + E, E → F, G → H, H → I und I → K?', 'C → d + E: Hydrolyse; E → F: S_E; G → H: Kondensation/S_N; H → I: Reduktion; I → K: Kondensation/S_N.'));
});

patch('lw52 (neu)', () => {
  upsertQuestion({
    id: 'lw52-2026-fentanyl-diphenhydramin',
    category: 'Mehrstufige Synthesen',
    name: 'Fentanyl, Benzocain & Diphenhydramin — LW 2026',
    type: 'composed',
    difficulty: 'B',
    source: 'ÖChO Landeswettbewerb 2026 (LW 52), Probleme D, E, F',
    intro: 'Opioide werden in der Medizin zur Behandlung starker und stärkster Schmerzen eingesetzt. Dazu zwei weitere Wirkstoffsynthesen: das Lokalanästhetikum Benzocain und das Antihistaminikum Diphenhydramin.',
    sections: [
      syn('D. Synthese von Fentanyl', [
        G('PP', '', 'O=C1CCNCC1'),
        G('PE', '', 'BrCCc1ccccc1'),
        N('A', 'A', 'O=C1CCN(CCc2ccccc2)CC1'),
        G('AN', '', 'Nc1ccccc1'),
        N('B', 'B', 'C1CN(CCc2ccccc2)CCC1=Nc1ccccc1', { explanation: 'Iminbildung aus Keton und Anilin.' }),
        N('C', 'C', 'C1CN(CCc2ccccc2)CCC1Nc1ccccc1', { explanation: 'NaBH_4 reduziert das Imin zum sekundären Amin.' }),
        G('FE', 'Fentanyl', 'CCC(=O)N(c1ccccc1)C1CCN(CCc2ccccc2)CC1')
      ], [
        E(['PP', 'PE'], 'A', '', '-HBr'),
        E(['A', 'AN'], 'B'),
        E('B', 'C', 'NaBH_4'),
        E('C', 'FE', 'CH_3CH_2COCl')
      ], { hints: ['Die Abkürzung „Ph" im Produkt steht für Phenyl.'] }),
      SA('Atome in Fentanyl (D b)', 'Wie viele C- und H-Atome enthält Fentanyl? Wie viele Methylgruppen enthält Heroin?', 'Fentanyl: 22 C, 28 H. Heroin: 3 Methylgruppen.'),
      syn('E. Strukturaufklärung bei der Synthese von Benzocain', [
        N('A', 'A', 'Cc1ccc([N+](=O)[O-])cc1'),
        N('B', 'B', 'OC(=O)c1ccc([N+](=O)[O-])cc1', { name: '4-Nitrobenzencarbonsäure' }),
        N('C', 'C', 'Nc1ccc(C(=O)O)cc1'),
        N('D', 'D', 'CCOC(=O)c1ccc(N)cc1', { caption: 'Benzocain', name: 'Ethyl-4-aminobenzoat' })
      ], [
        E('A', 'B', '?'),
        E('B', 'C', '?'),
        E('C', 'D', '?')
      ], {
        body: 'Benzocain (D) wirkt als Lokalanästhetikum durch die Blockade spannungsabhängiger Natriumkanäle. Es kann in der Reaktionsfolge A → B → C → D hergestellt werden.',
        hints: [
          '^1H-NMR — A: 2,4 ppm (s, 3H); 7,4 ppm (d, 2H); 8 ppm (d, 2H). B: 7,5 ppm (d, 2H); 8,3 ppm (d, 2H); 12,2 ppm (1H, s_breit). C: 4,1 ppm (s_breit, 2H); 6,8 ppm (d, 2H); 7,9 ppm (d, 2H); 12,2 ppm (1H, s_breit). D: 1,3 ppm (t, 3H); 4,1 ppm (s_breit, 2H); 4,35 ppm (q, 2H); 6,8 ppm (d, 2H); 7,9 ppm (d, 2H).',
          'Die Summenformel von A wurde bestimmt: 2,000 g A lieferten bei der Verbrennungsanalyse 4,492 g CO_2, 0,920 g H_2O und 215,9 mL N_2 (p = 112334 Pa, T = 400 K).',
          'Bei der Reaktion von A nach B entsteht eine funktionelle Gruppe, welche sich im IUPAC-Namen als Suffix wiederfindet.',
          'Der Sauerstoffgehalt von C ist kleiner als der von B.'
        ]
      }),
      SA('Reagenzien (E c)', 'Schlagen Sie Reagenzien für A → B, B → C und C → D vor.', 'A → B: KMnO_4 (Oxidation der CH_3-Gruppe); B → C: Fe/HCl (Reduktion der NO_2-Gruppe); C → D: C_2H_5OH / H^+'),
      syn('F. Synthese von Diphenhydramin', [
        N('BMB', '', 'BrCc1ccccc1', { caption: 'Brommethylbenzen' }),
        N('BZ', '', 'c1ccccc1', { caption: 'Benzen' }),
        N('A', 'A', 'c1ccc(Cc2ccccc2)cc1'),
        N('B', 'B', 'BrC(c1ccccc1)c1ccccc1'),
        G('DMAE', '', 'CN(C)CCO'),
        N('C', 'C', 'CN(C)CCOC(c1ccccc1)c1ccccc1', { caption: 'Diphenhydramin (NMR)' }),
        G('PhBr', '', 'Brc1ccccc1'),
        N('BA', '', 'O=Cc1ccccc1', { caption: 'Benzencarbaldehyd' }),
        N('D', 'D', 'OC(c1ccccc1)c1ccccc1', { caption: 'C_13H_12O' }),
        N('Ep', '[E]^+', '[CH+](c1ccccc1)c1ccccc1', { explanation: 'Benzhydryl-Kation, durch Delokalisierung der positiven Ladung über beide Ringe stabilisiert.' }),
        G('CE', '', 'OCCCl'),
        N('F', 'F', 'ClCCOC(c1ccccc1)c1ccccc1'),
        N('C2', 'C', 'CN(C)CCOC(c1ccccc1)c1ccccc1')
      ], [
        E(['BMB', 'BZ'], 'A', 'AlBr_3', '1'),
        E('A', 'B', 'Br_2', 'UV; 2'),
        E(['B', 'DMAE'], 'C', 'K_2CO_3', '5'),
        E(['PhBr', 'BA'], 'D', 'Mg', 'in Ether; 3'),
        E('D', 'B', 'HBr', '-H_2O; 4'),
        E('D', 'Ep', 'H_2SO_4', '-H_2O; 5'),
        E(['Ep', 'CE'], 'F', '', '6'),
        E('F', 'C2', '(CH_3)_2NH', '-HCl; 7')
      ], {
        body: 'Diphenhydramin C ist ein antihistaminischer Wirkstoff (Allergien, Schlafstörungen, Übelkeit) und gehört zur Gruppe der Ethanolamine. Zwei Synthesewege werden beleuchtet.',
        hints: ['^1H-NMR von Diphenhydramin C: δ ≈ 7,3 ppm (10H, a); 5,35 ppm (1H, b); 3,55 ppm (2H, c); 2,8 ppm (6H, d); 2,55 ppm (2H, e).']
      }),
      SA('Mechanismen und K_2CO_3 (F c, d)', 'Welche Aufgabe hat K_2CO_3 in B → C? Ordnen Sie den Mechanismen S_R, S_E, S_N und A_N je eine Reaktionsnummer zu.', 'K_2CO_3 fängt H^+ ab und verschiebt das Gleichgewicht nach rechts. S_R: 2; S_E: 1; S_N: 4, 5, 6 oder 7; A_N: 3.')
    ]
  });
});
