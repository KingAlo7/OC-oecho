/* Source audit, part 1 — BW 43 (2017) */
const { Q, N, G, E, syn, SA, setSec, findSec, addSection, patch } = require('./source-audit-2026');

/* ════════════════════════════════════════════════════════════════════
   BW 43 (2017) — Aufgabe 1 A, Atropin
   The Angabe draws the nitrone and Tropinon, names the three Robinson
   components, and prints "Tropin C8H15NO", "C11H14O3", "R-Form",
   "Tropasäure", "Atropin". Section titles no longer name the reaction
   type (that is question 1.4).
   ════════════════════════════════════════════════════════════════════ */
patch('bw43 atropin', () => {
  const q = Q('bw43-2017-atropin');
  q.intro = 'Tropan-Alkaloide sind Derivate des Tropans, eines bicyclischen Amins mit dem IUPAC-Namen 8-Methyl-8-aza-bicyclo[3.2.1]octan. Sie werden von Pflanzen, vor allem Nachtschattengewächsen, zum Schutz vor Fressfeinden gebildet. Im ersten Aufgabenteil wird die Synthese von Atropin, dem Gift der Tollkirsche, behandelt.';
  q.hints = [
    'Substanz E trägt den Namen Ethyl-2-Brom-2-phenylethanoat.',
    'A und B sind Stereoisomere.'
  ];
  const A = 'CN1[C@H]2CC[C@@H]1C[C@H](O)C2';
  const B = 'CN1[C@H]2CC[C@@H]1C[C@@H](O)C2';
  const old = q.sections.slice(0, 4);
  const rest = q.sections.slice(4);

  const s1 = syn('Weg 1: vom Nitron über C und D', [
    G('N1', '', 'C=CCC1CCC=[N+]1[O-]'),
    N('C', 'C', 'C12CCC3CC(C1)ON23'),
    N('D', 'D', 'C12CCC3CC(C1)O[N+]23C.[I-]'),
    N('A', 'A', A),
    N('B', 'B', B, { caption: 'Tropin, C_8H_15NO' })
  ], [
    E('N1', 'C'),
    E('C', 'D', 'CH_3I'),
    E('D', 'A', 'LiAlH_4'),
    E('D', 'B', 'LiAlH_4')
  ]);
  q.sections = [old[0]];
  setSec(q, 0, s1);

  const s2 = syn('Weg 2: über Tropinon', [
    G('BD', '', 'O=CCCC=O', { name: 'Butandial' }),
    G('MA', '', 'CN', { name: 'Methanamin' }),
    G('PR', '', 'CC(C)=O', { name: 'Propanon' }),
    G('TN', '', 'CN1[C@H]2CC[C@@H]1CC(=O)C2', { name: 'Tropinon',
      explanation: 'Robinson (1917): doppelte Mannich-Reaktion — Methanamin bildet mit Butandial ein Iminium; das Enol des Propanons addiert zweimal.' }),
    N('A', 'A', A),
    N('B', 'B', B, { caption: 'Tropin, C_8H_15NO' })
  ], [
    E(['BD', 'MA', 'PR'], 'TN'),
    E('TN', 'A', 'Zn, HI'),
    E('TN', 'B', 'Zn, HI')
  ]);
  q.sections.push(old[1]);
  setSec(q, 1, s2);
  // Old strand 2 stored "A/B" under id A2; carry its explanation to A.
  const a2 = (old[1].scheme.nodes || []).find(n => n.id === 'A2');
  if (a2 && a2.explanation) q.sections[1].scheme.nodes.find(n => n.id === 'A').explanation = a2.explanation;

  const s3 = syn('Tropasäure (H)', [
    N('E', 'E', 'CCOC(=O)C(Br)c1ccccc1'),
    N('F', 'F', 'CCOC(=O)C([Mg]Br)c1ccccc1'),
    N('G', 'G', 'CCOC(=O)C(CO)c1ccccc1', { caption: 'C_11H_14O_3' }),
    N('H', 'H', 'OC(=O)[C@H](CO)c1ccccc1', { caption: 'R-Form' })
  ], [
    E('E', 'F', 'Mg'),
    E('F', 'G', '1) H_2CO', '2) Aufarbeitung'),
    E('G', 'H', 'H^+/H_2O', 'erhitzen')
  ]);
  q.sections.push(old[2]);
  setSec(q, 2, s3);

  const s4 = syn('Veresterung zu Atropin (I)', [
    N('H', 'H', 'OC(=O)[C@H](CO)c1ccccc1', { caption: 'Tropasäure, R-Form' }),
    N('AB', 'A oder B', A),
    N('I', 'I', 'CN1[C@H]2CC[C@@H]1C[C@H](OC(=O)[C@H](CO)c1ccccc1)C2', { caption: 'Atropin' })
  ], [
    E(['H', 'AB'], 'I', '-X')
  ]);
  q.sections.push(old[3]);
  setSec(q, 3, s4);
  // The old section keyed the ester as AT.
  const at = (old[3].scheme.nodes || []).find(n => n.id === 'AT');
  if (at) q.sections[3].scheme.nodes.find(n => n.id === 'I').explanation = at.explanation;

  q.sections.push(...rest);
  const mc14 = findSec(q, s => /1\.4/.test(s.title || ''));
  q.sections[mc14].title = 'Reaktionstyp der Bildung von C (1.4)';
  q.sections[mc14].prompt = 'Wie wird die Bildung von C aus dem Nitron klassifiziert?';
  addSection(q, SA('Molekül X', 'Schreiben Sie die chemische Formel von X auf (Veresterung H + A → I).', 'X = H_2O'));
});

/* ════════════════════════════════════════════════════════════════════
   BW 43 (2017) — Aufgabe 1 B, Ferruginin (full scheme of the Angabe)
   ════════════════════════════════════════════════════════════════════ */
patch('bw43 ferruginin', () => {
  const q = Q('bw43-2017-ferruginin');
  const Cbz = 'C(=O)OCc9ccccc9';
  const sec = syn('B. Synthese von Ferruginin', [
    N('A', 'A', 'CC1CCCC1=O'),
    N('B', 'B', 'CC1CCCC(=O)O1', { explanation: 'Baeyer-Villiger-Oxidation: das O wird zwischen Carbonyl-C und dem höher substituierten α-C eingeschoben → 6-Methyl-δ-valerolacton.' }),
    N('C', 'C', 'COC(=O)CCCC(C)OS(C)(=O)=O', { explanation: '1) NaOMe/MeOH öffnet das Lacton zum Methylester mit freier OH-Gruppe. 2) MesCl mesyliert den Alkohol.' }),
    N('D', 'D', 'COC([O-])=CCCC(C)OS(C)(=O)=O', { explanation: 'NaHMDS deprotoniert das α-C des Esters → Esterenolat (reaktives Intermediat).' }),
    G('P', '', 'CC(C)(C)OC(=O)[C@@H]1CCC(=C2CCC(C)OC2=O)N1Cc1ccccc1'),
    N('E', 'E', 'CC(C)(C)OC(=O)[C@@H]1CC[C@H](C2CCC(C)OC2=O)N1Cc1ccccc1',
      { explanation: '1) H_2, Pd/C hydriert die exocyclische C=C-Bindung (cis, von der weniger gehinderten Seite) und spaltet dabei auch die N-Benzylgruppe ab. 2) BnBr benzyliert den Stickstoff erneut.' }),
    N('F', 'F', 'CC(C)(C)OC(=O)[C@@H]1CC[C@H](C(CCC(C)=O)C(=O)OC)N1Cc1ccccc1',
      { explanation: '1) NaHCO_3/MeOH: Methanolyse des Lactons → Methylester + sekundärer Alkohol. 2) CrO_3/H^+ oxidiert den Alkohol zum Methylketon.' }),
    N('G', 'G', 'OC(=O)[C@@H]1CC[C@H](C(CCC(C)=O)C(=O)OC)N1Cc1ccccc1',
      { explanation: 'H^+/H_2O spaltet selektiv den tert-Butylester (über das tert-Butyl-Kation); der Methylester bleibt erhalten.' }),
    G('BC1', '', 'COC(=O)C1C(C(C)=O)CC2CCC1N2' + Cbz),
    G('BC2', '', 'C=C(C)C1=CCC2CCC1N2' + Cbz),
    N('H', 'H', 'CC(O)(CO)C1=CCC2CCC1N2' + Cbz, { explanation: 'OsO_4 dihydroxyliert die weniger substituierte, exocyclische Doppelbindung (syn) → 1,2-Diol.' }),
    N('I', 'I', 'CC(=O)C1=CCC2CCC1N2' + Cbz, { explanation: 'NaIO_4 spaltet das 1,2-Diol (Malaprade) → Methylketon; X = Methanal (M = 30,03 g/mol).' }),
    N('J', 'J', 'CC(=O)C1=CCC2CCC1N2', { caption: 'C_9H_13NO, Ferruginin', explanation: 'TMSI spaltet den Cbz-Carbamat (Silylester → Carbamidsäure → CO_2 + Amin).' }),
    N('K', 'K', 'CC(=O)C1=CCC2CCC1[N+]2=C', { explanation: 'Das sekundäre Amin kondensiert mit Methanal zum Iminium-Ion.' }),
    N('L', 'L', 'CC(=O)C1=CCC2CCC1N2C', { explanation: 'NaBH_3CN reduziert das Iminium-Ion selektiv → N-Methylamin (reduktive Aminierung).' })
  ], [
    E('A', 'B', 'm-CPBA'),
    E('B', 'C', '1) NaOMe / MeOH', '2) MesCl'),
    E('C', 'D', 'NaHMDS'),
    E('D', 'P', '(mehrere Stufen)'),
    E('P', 'E', '1) H_2, Pd/C', '2) BnBr'),
    E('E', 'F', '1) NaHCO_3 / MeOH', '2) CrO_3 / H^+'),
    E('F', 'G', 'H^+/H_2O'),
    E('G', 'BC1', '1) (COCl)_2', '2) Δ'),
    E('BC1', 'BC2', '(mehrere Stufen)'),
    E('BC2', 'H', 'OsO_4, THF'),
    E('H', 'I', 'NaIO_4, -X', 'THF/H_2O'),
    E('I', 'J', 'TMSI', 'MeCN'),
    E('J', 'K', 'CH_2O'),
    E('K', 'L', 'NaBH_3CN')
  ], {
    body: 'Im zweiten Teil geht es um Ferruginin, einen Agonisten nikotinischer Acetylcholinrezeptoren.',
    hints: [
      'Die Substanz A trägt den IUPAC-Namen 2-Methylcyclopentanon.',
      'Die Reaktion C → D führt zu einem reaktiven Intermediat.',
      'Bei der Reaktion F → G bleibt die Methylesterfunktion erhalten.',
      'Beim Schritt von G zum Bicyclus wurde eine Schutzgruppe durch eine andere ersetzt.',
      'In Schritt H → I erfolgt keine Reaktion innerhalb des Cyclus, das abgespaltene Molekül X hat eine molare Masse von 30,03 g/mol.',
      'Abkürzungen: Bn = Benzyl, Cbz = Benzyloxycarbonyl, Mes = Mesyl = Methansulfonyl, TMSI = Trimethylsilyliodid, NaHDMS = [(CH_3)_3Si]_2NNa'
    ]
  });
  // Old node ids H/I/J/L meant different compounds; start fresh.
  q.sections[0] = sec;
  const osi = findSec(q, s => /OsO_4/.test(s.title || '') && s.type !== 'synthesis');
  q.sections[osi].title = 'OsO_4 + NaIO_4 als Spaltsequenz (BC2 → H → I)';
  addSection(q, SA('Molekül X', 'Welches Molekül X wird im Schritt H → I abgespalten?', 'X = Methanal (Formaldehyd), H_2C=O, M = 30,03 g/mol.'));
  if (!q.difficulty) q.difficulty = 'D';
});
