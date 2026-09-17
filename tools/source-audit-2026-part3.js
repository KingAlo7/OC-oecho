/* Source audit, part 3 — BW 45 (2019), Aufgabe 2 „Organische Chemie und Musik" */
const { Q, N, G, E, syn, SA, setSec, findSec, addSection, patch } = require('./source-audit-2026');

const ABA = 'CC1=CC(=O)CC([C@]1(/C=C/C(=C\\C(=O)O)/C)O)(C)C';

patch('bw45 abscisinsaeure', () => {
  const q = Q('bw45-2019-abscisinsaeure');
  q.intro = 'Phytohormone sind pflanzeneigene organische Verbindungen, die als primäre Botenstoffe Wachstum und Entwicklung der Pflanzen steuern und koordinieren. Abscisinsäure (ABA, von engl. abscisic acid) ist ein Phytohormon mit hemmender Wirkung und zählt zu den monocyclischen Sesquiterpenen. Ausgangssubstanzen der Synthese sind 4-Methylpent-3-en-2-on (Verbindung B) und Verbindung A, deren Struktur aus dem ^1H- und ^{13}C-NMR-Spektrum ermittelt werden kann.';
  const rest = q.sections.slice(3);
  const ket = 'C2(CC1(C)C)OCCO2';
  q.sections = [q.sections[0]];
  setSec(q, 0, syn('A.1 Synthese von ABA', [
    N('A', 'A', 'CC(=O)CC(=O)OCC', { name: 'Acetessigsäureethylester' }),
    N('B', 'B', 'CC(=O)C=C(C)C', { caption: '4-Methylpent-3-en-2-on' }),
    N('C', 'C', 'CCOC(=O)C1C(=O)C=C(C)CC1(C)C', { caption: 'C_12H_18O_3',
      explanation: 'Michael-Addition des Enolats von A an B, dann intramolekulare Aldolkondensation → Cyclohexenon (Stellungsisomer zu D).' }),
    N('D', 'D', 'CCOC(=O)C1C(C)=CC(=O)CC1(C)C', { caption: 'C_12H_18O_3',
      explanation: 'Michael-Addition, dann Knoevenagel-/Aldolkondensation über die Ketongruppe von A → Stellungsisomer zu C.' }),
    G('E', 'E', 'CCOC(=O)C1=C(C)CC(=O)CC1(C)C'),
    N('F', 'F', 'CCOC(=O)C1=C(C)C' + ket, { explanation: 'Ethylenglycol/H_2SO_4 schützt das Keton als cyclisches Acetal (Ketal).' }),
    N('G', 'G', 'O=CC1=C(C)C' + ket, { explanation: 'DIBAL-H reduziert den Ester zum Aldehyd (IR 1730 cm^{-1}).' }),
    N('H', 'H', 'CC1=CC(=O)OC(C1)C1=C(C)C' + ket, { explanation: 'Reformatsky-Reaktion (A_N des Zinkenolats an den Aldehyd), dann Lactonisierung → δ-Lacton (Heterocyclus mit 6 Ringatomen).' }),
    N('I', 'I', 'CC1=CC(=O)OC(C1)C12OC1(C)CC3(CC2(C)C)OCCO3', { explanation: 'mCPBA epoxidiert die elektronenreichere, tetrasubstituierte Ring-Doppelbindung.' }),
    N('J', 'J', 'CC1=CC(=O)OC(C1)C12OC1(C)CC(=O)CC2(C)C', { explanation: 'H_3O^+ spaltet das Ketal; J = C_15H_20O_4.' }),
    G('ABA', 'Abscisinsäure', ABA)
  ], [
    E(['A', 'B'], 'C', 'KOH (Kat.)', 'EtOH'),
    E(['A', 'B'], 'D', 'KOH (Kat.)', 'EtOH'),
    E('C', 'E', '(mehrere Stufen)'),
    E('D', 'E', '(mehrere Stufen)'),
    E('E', 'F', 'CH_2OHCH_2OH', 'H_2SO_4'),
    E('F', 'G', 'DIBAL-H', 'in Toluen'),
    E('G', 'H', 'Zn, Br-CH_2-C(CH_3)=CH-CO_2Me'),
    E('H', 'I', 'mCPBA'),
    E('I', 'J', 'H_3O^+'),
    E('J', 'ABA', 'z')
  ], {
    hints: [
      'Spektren von A — ^1H-NMR (500 MHz, CDCl_3): δ = 1,2 (3H, t); 2,3 (3H, s); 3,41 (2H, s); 4,11 (2H, q) ppm. ^{13}C-NMR (125 MHz, CDCl_3): δ = 14,1; 30,0; 50,0; 61,0; 168; 200 ppm.',
      'C und D sind Stellungsisomere (C_12H_18O_3), es bilden sich jeweils Carbocyclen mit 6 C-Atomen im Ring.',
      'G hat im IR-Spektrum eine Bande bei 1730 cm^{-1}.',
      'G → H: Es bildet sich ein zusätzlicher Heterocyclus mit 6 Ringatomen.',
      'J: Elementaranalyse: C: 68,16 %; H: 7,63 %; O: 24,21 % (w/w).',
      'Abkürzungen: DIBAL-H = Diisobutylaluminiumhydrid, mCPBA = meta-Chlorperbenzoesäure.'
    ]
  }));
  q.sections.push(syn('A.2 Strukturaufklärung: Ozonolyse von ABA', [
    G('ABA', 'Abscisinsäure', ABA),
    N('X', 'X', 'CC(=O)C(O)(C(=O)O)C(C)(C)CC(=O)C(=O)O', { name: 'C_10H_14O_7' }),
    N('Y', 'Y', 'CC(=O)C(=O)O', { name: 'Brenztraubensäure' }),
    N('Z', 'Z', 'OC(=O)C(=O)O', { name: 'Oxalsäure', explanation: 'Oxalat fällt mit Ca^{2+} als schwer lösliches Calciumoxalat.' })
  ], [
    E('ABA', 'X', '1. O_3', '2. oxidative Aufarbeitung'),
    E('ABA', 'Y', '1. O_3', '2. oxidative Aufarbeitung'),
    E('ABA', 'Z', '1. O_3', '2. oxidative Aufarbeitung')
  ], {
    body: 'Die Ozonolyse mit oxidativer Aufarbeitung von Abscisinsäure liefert die 3 Produkte X, Y und Z.',
    hints: [
      '1,0000 g von X liefern bei der Verbrennung 1,7872 g CO_2 und 0,5123 g H_2O. Die molare Masse beträgt 246,24 g/mol.',
      'Eine basische Lösung von Z liefert mit einer Calciumnitrat-Lösung einen schwer löslichen Niederschlag.'
    ]
  }));
  q.sections.push(...rest);
  addSection(q, SA('Summenformel von J (2.3)', 'Geben Sie die Summenformel von J an.', 'C_15H_20O_4'), 0);
  addSection(q, SA('Reagenz z (2.5)', 'Schlagen Sie ein Reagenz z für die Umwandlung von J zu Abscisinsäure vor.', 'NaOH'), 1);
  addSection(q, SA('A in D_2O/CD_3CN (2.2)', 'Welche Struktur hätte A, wenn man als Lösungsmittel für die NMR-Messung eine 1:1-Mischung aus D_2O/CD_3CN verwendete?',
    'Die aciden CH_2-Protonen zwischen den beiden Carbonylgruppen werden gegen Deuterium ausgetauscht: CH_3-CO-CD_2-CO-OEt.'), 1);
  addSection(q, SA('Stereodeskriptoren von ABA (2.13)', 'Geben Sie die Stereodeskriptoren der Abscisinsäure an.', 'S (Stereozentrum), 2Z, 4E (Doppelbindungen der Seitenkette).'));
});

patch('bw45 twistan', () => {
  const q = Q('bw45-2019-twistan');
  if (!q.difficulty) q.difficulty = 'D';
  q.intro = 'Twistan gehört zu den polycyclischen Verbindungen. Der verdrillte Kohlenwasserstoff Twistan heißt systematisch Tricyclo[4.4.0.0^{3,8}]decan. Die Teilschritte der Synthese sind im folgenden Schema dargestellt.';
  const rest = q.sections.slice(2);
  q.sections = [q.sections[0]];
  q.sections[0] = syn('B. „Let´s twist again" — Synthese von Twistan', [
    G('Ed', '', 'CCOC(=O)C1CC2CCC1C=C2'),
    N('A', 'A', 'OCC1CC2CCC1C=C2', { caption: 'C_9H_14O', explanation: 'LiAlH_4 reduziert den Ester zum primären Alkohol.' }),
    N('B', 'B', 'N#CCC1CC2CCC1C=C2', { explanation: 'Mesylierung, dann S_N2 durch Cyanid.' }),
    N('C', 'C', 'OC(=O)CC1CC2CCC1C=C2', { explanation: 'Saure Hydrolyse des Nitrils zur Carbonsäure.' }),
    N('D', 'D', 'O=C1CC2CC3CCC2C(O1)C3I', { explanation: 'Iodlactonisierung: I_2 bildet ein Iodonium-Ion, das Carboxylat öffnet es intramolekular → δ-Lacton mit trans-ständigem I.' }),
    N('E', 'E', 'O=C1CC2CC3CCC2C(O1)C3', { explanation: 'Hydrogenolyse der C–I-Bindung (NEt_3 fängt HI ab).' }),
    G('F', 'F', 'OCCC1CC2CCC1C(O)C2'),
    N('G', 'G', 'CS(=O)(=O)OCCC1CC2CCC1C(O)C2', { explanation: 'Nur die sterisch besser zugängliche primäre OH-Gruppe wird mesyliert.' }),
    N('H', 'H', 'CS(=O)(=O)OCCC1CC2CCC1C(=O)C2', { explanation: 'CrO_3 oxidiert den sekundären Alkohol zum Keton.' }),
    N('I', 'I', 'O=C1C2CCC3CC2CCC13', { explanation: 'NaH bildet das Enolat; intramolekulare S_N2-Alkylierung am Mesylat schließt den Käfig (Twistanon).' }),
    G('T', 'Twistan', 'C1C2CCC3CC2CCC13')
  ], [
    E('Ed', 'A', 'LiAlH_4'),
    E('A', 'B', '1. MeSO_2Cl', '2. NaCN'),
    E('B', 'C', 'H_3O^+'),
    E('C', 'D', 'I_2', 'NaHCO_3'),
    E('D', 'E', 'H_2, Pt, NEt_3', '-HI'),
    E('E', 'F', 'a'),
    E('F', 'G', 'MeSO_2Cl, Py'),
    E('G', 'H', 'CrO_3'),
    E('H', 'I', 'NaH', 'DMF'),
    E('I', 'T', 'b')
  ], {
    hints: [
      'Bei der Reaktion F → G erfolgt die Reaktion nur an der sterisch besser zugänglichen Hydroxy-Gruppe.',
      'Bei der Reaktion H → I fungiert DMF (N,N-Dimethylformamid) als Lösungsmittel.'
    ]
  });
  q.sections.push(...rest);
  const wk = q.sections.findIndex(s => /Wolff-Kishner/.test(s.title || ''));
  if (wk >= 0) q.sections[wk].title = 'Erster Schritt der Reaktion b (2.29)';
  addSection(q, SA('Mechanismus A → B (2.28)', 'Benennen Sie den Reaktionsmechanismus im zweiten Schritt von A → B.', 'S_N2 (Cyanid verdrängt das Mesylat; trigonal-bipyramidaler Übergangszustand).'), 0);
  addSection(q, SA('Reagenzien a und b (2.29)', 'Schlagen Sie Reagenzien a (E → F) und b (I → Twistan) vor. Wie heißt die Namensreaktion von Schritt b?',
    'a: LiAlH_4 (reduziert das Lacton zum Diol). b: N_2H_4 / KOH — Wolff-Kishner-Reduktion (erster Schritt: A_N des Hydrazins an das Keton).'), 1);
});
