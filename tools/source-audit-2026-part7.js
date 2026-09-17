/* Source audit, part 7 — BW 49 (2023), Aufgaben 7 und 8 */
const { Q, N, G, E, syn, SA, setSec, findSec, addSection, patch } = require('./source-audit-2026');

const iBu = 'c1ccc(CC(C)C)cc1';

patch('bw49 ibuprofen', () => {
  const q = Q('bw49-2023-ibuprofen');
  q.intro = 'Medien berichteten im Juli 2022 von Lieferengpässen bei Medikamenten für Kinder, vor allem an Fiebersäften mit den Wirkstoffen Ibuprofen und Paracetamol. In dieser Aufgabe beschäftigen Sie sich am Papier mit der Synthese von Ibuprofen (C_13H_18O_2).';
  setSec(q, 0, syn('A. Ibuprofen', [
    N('A', 'A', 'CC(C)Cc1ccccc1', { name: 'Isobutylbenzol' }),
    N('B', 'B', 'CC(=O)' + iBu, { explanation: 'Friedel-Crafts-Acylierung (S_E) in para-Stellung; HF aktiviert das Anhydrid zum Acylium-Ion.' }),
    N('C', 'C', 'CC(O)' + iBu),
    N('D', 'D', 'CC(Cl)' + iBu),
    N('Ee', 'E', 'CC([Mg]Cl)' + iBu),
    N('F', 'F', 'CC(C(=O)O)' + iBu, { caption: 'Ibuprofen' })
  ], [
    E('A', 'B', 'Ac_2O (Essigsäureanhydrid)', 'HF'),
    E('B', 'C', 'NaBH_4', 'CH_3OH'),
    E('C', 'D', 'HCl'),
    E('D', 'Ee', 'Mg'),
    E('Ee', 'F', '1) CO_2', '2) HCl')
  ], {
    hints: [
      '300 mg der organischen Verbindung A mit M < 150 g/mol liefern bei der Verbrennung bei 800 K und 101200 Pa 281,90 mg Wasserdampf und 1,467 L Kohlenstoffdioxid.',
      '^1H-NMR von A (CDCl_3): δ ≈ 7,2 ppm (5H), 2,45 ppm (2H, d), 1,85 ppm (1H, m), 0,9 ppm (6H, d).',
      'Die Reaktion von A nach B kann auch mit CH_3COCl/AlCl_3 durchgeführt werden.'
    ]
  }));
  addSection(q, SA('Summenformel von A (7.1)', 'Geben Sie die Summenformel von A an.', 'C_10H_14'), 0);
  addSection(q, SA('Wirksames Enantiomer (7.5)', 'Ibuprofen wird als Racemat eingesetzt; pharmakologisch wirksam ist nur das S-Isomer. Zeichnen Sie die Konfiguration der wirksamen Form.',
    '(S)-2-[4-(2-Methylpropyl)phenyl]propansäure — SMILES: C[C@H](C(=O)O)c1ccc(CC(C)C)cc1'));
});

patch('bw49 benzocain', () => {
  const q = Q('bw49-2023-benzocain');
  q.intro = 'Benzocain gehört zur Wirkstoffgruppe der Lokalanästhetika. Es findet Einsatz in zahlreichen OTC-Präparaten zur Linderung schmerzhafter Beschwerden im Mund- und Rachenbereich. Ein Syntheseweg ausgehend vom Toluen (Methylbenzen) ist hier gezeigt.';
  setSec(q, 0, syn('B. Benzocain', [
    N('A', 'A', 'Cc1ccccc1', { caption: 'Toluen' }),
    N('B', 'B', 'Cc1ccc([N+](=O)[O-])cc1'),
    N('C', 'C', 'Cc1ccc(N)cc1'),
    N('D', 'D', 'CC(=O)Nc1ccc(C)cc1', { explanation: 'Acetylierung schützt die Aminogruppe vor der Oxidation durch KMnO_4.' }),
    N('Ee', 'E', 'CC(=O)Nc1ccc(C(=O)O)cc1'),
    N('F', 'F', 'OC(=O)c1ccc(N)cc1'),
    N('Bc', 'Benzocain', 'CCOC(=O)c1ccc(N)cc1')
  ], [
    E('A', 'B', 'HNO_3', 'H_2SO_4'),
    E('B', 'C', 'Fe / HCl'),
    E('C', 'D', 'Ac_2O (Essigsäureanhydrid)'),
    E('D', 'Ee', 'KMnO_4'),
    E('Ee', 'F', 'HCl(aq)'),
    E('F', 'Bc', 'Ethanol', 'H_2SO_4')
  ], { hints: ['^1H-NMR von B: δ ≈ 8,1 ppm (2H), 7,45 ppm (2H), 2,45 ppm (3H).'] }));
});

patch('bw49 lidocain', () => {
  const q = Q('bw49-2023-lidocain');
  q.intro = 'Lidocain gehört ebenfalls zur Wirkstoffgruppe der Lokalanästhetika. Es wirkt lokalanästhetisch, schmerzlindernd, antiarrhythmisch und juckreizlindernd. Die Effekte beruhen auf der Hemmung des Einstroms von Natriumionen in die Neuronen über spannungsabhängige Natriumkanäle.';
  setSec(q, 0, syn('C. Lidocain', [
    G('Ed', '', 'Cc1cccc(C)c1N'),
    N('E', 'E', 'ClCC(=O)Cl', { name: 'Chloracetylchlorid' }),
    N('I', 'I', 'O=C(CCl)Nc1c(C)cccc1C'),
    N('Z', 'Z', 'CCNCC', { name: 'Diethylamin' }),
    G('L', 'Lidocain', 'CCN(CC)CC(=O)Nc1c(C)cccc1C')
  ], [
    E(['Ed', 'E'], 'I', 'NaOAc'),
    E(['I', 'Z'], 'L', 'Z')
  ]));
});

patch('bw49 porphyrin', () => {
  const q = Q('bw49-2023-porphyrin');
  q.intro = 'Porphyrine (von altgriech. porphyrá, Purpurfarbstoff) sind Farbstoffe aus vier Pyrrol-Ringen, die durch vier Methingruppen zu einem Gesamtcyclus verknüpft sind. 1993 schlug Smith einen Mechanismus zur elektrochemischen Synthese von Porphyrinen vor.';
  q.sections[0] = syn('B. Porphyrine — elektrochemische Cyclisierung', [
    G('Bi', '', 'Cc1ccc([nH]1)C=C1C=CC(N1)=Cc1ccc([nH]1)C=C1C=CC(C)=N1'),
    N('I1', '1', '[CH2]c1ccc([nH]1)C=C1C=CC(N1)=Cc1ccc([nH]1)C=C1C=CC(C)=N1', { explanation: 'Einelektronenoxidation und Deprotonierung → Radikal an der Methylgruppe.' }),
    N('I2', '2', 'CC1=NC(C=C1)=CC1=NC(C=C1)=Cc1ccc([nH]1)C=C1NC(C=C1)=C', { explanation: 'Zweite Oxidation und Deprotonierung → exocyclische Methylengruppe; der Pyrrol-Stickstoff/α-C des anderen Endes greift an und schließt den Makrocyclus.' }),
    G('P', '', 'CC12C=CC(N1)=CC1=NC(C=C1)=Cc1ccc([nH]1)C=C1N=C(C=C1)C2')
  ], [
    E('Bi', 'I1', '-800 mV', '-e^-, -H^+'),
    E('I1', 'I2', '', '-e^-, -H^+'),
    E('I2', 'P')
  ]);
});

patch('bw49 hirsuten', () => {
  const q = Q('bw49-2023-hirsuten');
  q.intro = 'Obwohl das Sesquiterpen Hirsuten biologisch inaktiv ist, hat es in der Synthese als Modell für Synthesen gedient (Ringerweiterungen, radikalische Cyclisierungen, Cycloadditionen und verschiedene Umlagerungen). Im Jahr 2002 berichteten Banwell et al. über die Herstellung von Hirsuten aus dem von Toluen abgeleiteten Cyclohexadien-Diol über eine Diels-Alder-Reaktion.';
  delete q.hints;
  const HIRS = 'C[C@]12[C@H](CCC1=C)C[C@@H]3[C@H]2CC(C3)(C)C';
  setSec(q, 0, syn('Weg 1: startet mit einer Di-Oxo-Verbindung', [
    G('Q', '', 'CC1=CC(=O)C(C)=CC1=O'),
    G('CP', '', 'C1=CC=CC1'),
    N('A', 'A', 'CC12C(=O)C=C(C)C(=O)C1C1CC2C=C1'),
    N('B', 'B', 'CC12C(=O)C3C4(C)C(=O)C1C1CC2C3C41'),
    G('D1', '', 'O=C1C=CC2CC3C=C(C)C(=O)C3C12C'),
    N('H1', 'Hirsuten', HIRS)
  ], [
    E(['Q', 'CP'], 'A', '', 'Δ'),
    E('A', 'B', 'hν'),
    E('B', 'D1', 'Δ'),
    E('D1', 'H1')
  ], { body: 'Die hier gezeigte Synthese startet mit einer Di-Oxo-Verbindung. Das Triquinan-Diendion steht thermisch (Δ) mit einem Stereoisomer im Gleichgewicht.' }));
  setSec(q, 1, syn('Weg 2: Radikalkaskade', [
    G('J', '', 'ICC(C)(C)C[C@@H]1C=C(C)[C@H](CCC#C)C1'),
    N('N2', '2', HIRS, { caption: 'Hirsuten' }),
    N('K2', '1', 'C[C@]12[C@H](CCC1=O)C[C@@H]3[C@H]2CC(C3)(C)C')
  ], [
    E('J', 'N2', 'Bu_3SnH', 'AIBN'),
    E('K2', 'N2', 'Ph_3P=CH_2')
  ], {
    hints: [
      'AIBN: Azoisobutyronitril (NC(CH_3)_2C-N=N-C(CH_3)_2CN)',
      'Hirsuten enthält wie seine Vorläufersubstanz drei fünfgliedrige Carbocyclen.'
    ]
  }));
});
