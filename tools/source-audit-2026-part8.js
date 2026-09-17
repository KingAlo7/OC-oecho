/* Source audit, part 8 — BW 50 (2024), Aufgabe 2
   „Von natürlichen Wirkstoffen gegen neurodegenerative Erkrankungen und
   Stress bei Pflanzen". Part A was missing and is added as a question. */
const { qs, Q, N, G, E, syn, SA, setSec, findSec, addSection, upsertQuestion, patch } = require('./source-audit-2026');

const TBS = 'O[Si](C)(C)C(C)(C)C';
const SRC = 'ÖChO Bundeswettbewerb 2024 (BW 50), Aufgabe 2';

patch('bw50 warm-up (neu)', () => {
  const Ph = 'c1ccccc1';
  const q = {
    id: 'bw50-2024-warmup-bromierung',
    category: 'Mehrstufige Synthesen',
    name: 'Bromierung von Alkenen & zwei Reaktionen — BW 2024',
    type: 'composed',
    difficulty: 'B',
    source: SRC + ' A',
    intro: 'Warming up — Reaktionen. Folgende drei Alkene werden mit Brom zur Reaktion gebracht.',
    sections: [
      syn('Bromierung von A, B und C (2.1)', [
        G('A', 'A', 'c1ccc(/C=C/c2ccccc2)cc1'),
        N('PA', '', 'Br[C@@H](' + Ph + ')[C@H](Br)' + Ph, { name: 'meso-Form', explanation: 'anti-Addition von Br_2 an (E)-Stilben → meso-1,2-Dibrom-1,2-diphenylethan.' }),
        G('B', 'B', 'c1ccc(/C=C\\c2ccccc2)cc1'),
        N('PB1', '', 'Br[C@@H](' + Ph + ')[C@@H](Br)' + Ph, { name: '(S,S)', explanation: 'anti-Addition an (Z)-Stilben → Enantiomerenpaar (R,R)/(S,S).' }),
        N('PB2', '', 'Br[C@H](' + Ph + ')[C@H](Br)' + Ph, { name: '(R,R)' }),
        G('C', 'C', 'C=C(C)[C@H](C)' + Ph),
        N('PC1', '', 'BrC[C@](C)(Br)[C@H](C)' + Ph, { name: 'Diastereomer 1', explanation: 'Das Bromonium-Ion bildet sich von beiden Seiten; das bestehende Stereozentrum bleibt → Diastereomere.' }),
        N('PC2', '', 'BrC[C@@](C)(Br)[C@H](C)' + Ph, { name: 'Diastereomer 2' })
      ], [
        E('A', 'PA', 'Br_2'),
        E('B', 'PB1', 'Br_2'),
        E('B', 'PB2', 'Br_2'),
        E('C', 'PC1', 'Br_2'),
        E('C', 'PC2', 'Br_2')
      ], { body: 'Schreiben Sie unter Berücksichtigung der Stereochemie alle möglichen Reaktionsprodukte auf und geben Sie jeweils deren stereochemische Beziehung an.' }),
      SA('Mechanismus der Bromierung (2.2)', 'Benennen Sie den Mechanismus der vorliegenden Bromierung.', 'Elektrophile Addition (A_E) über ein Bromonium-Ion; anti-Addition.'),
      syn('Zwei weitere Reaktionen (2.3)', [
        G('K', '', 'O=C1CCCC1'),
        G('Am', '', 'NC1CCCCC1'),
        N('Im', '', 'C1CCC(=NC2CCCCC2)C1', { name: 'Imin (A_N)', explanation: 'Nucleophile Addition des Amins an das Keton, dann Wasserabspaltung → Imin.' }),
        G('S', '', 'OC(=O)CCC1CN(C(=O)c2ccccc2)c2ccccc21'),
        N('Ke', '', 'O=C1CCC2CN(C(=O)c3ccccc3)c3cccc1c32', { name: 'Keton (S_E)', explanation: 'SOCl_2 → Säurechlorid; AlCl_3 → intramolekulare Friedel-Crafts-Acylierung (S_E) in 4-Position.' })
      ], [
        E(['K', 'Am'], 'Im'),
        E('S', 'Ke', '1. SOCl_2', '2. AlCl_3')
      ], { body: 'Schreiben Sie die Strukturformeln der Reaktionsprodukte auf und benennen Sie jeweils den Reaktionsmechanismus.' })
    ]
  };
  upsertQuestion(q);
});

patch('bw50 merrilacton', () => {
  const q = Q('bw50-2024-merrilacton');
  q.intro = 'Merrilacton — ein Naturstoff gegen neurodegenerative Erkrankungen. Die Synthese beginnt mit einer Diels-Alder-Reaktion.';
  setSec(q, 0, syn('B. Merrilacton', [
    G('Di', '', 'C=C/C=C\\' + TBS),
    G('An', '', 'CC1=C(C)C(=O)OC1=O'),
    N('A', 'A', 'C[C@@]12CC=C[C@H](' + TBS + ')[C@]1(C)C(=O)OC2=O', { explanation: 'Diels-Alder (endo): Silyloxy-Gruppe und Anhydrid cis, beide Methylgruppen auf der Gegenseite.' }),
    N('B', 'B', 'C[C@@]1(C(=O)O)CC=C[C@H](' + TBS + ')[C@]1(C)C(=O)OC', { caption: 'C_17H_30O_5Si' }),
    N('B2', 'B´', 'C[C@@]1(C(=O)OC)CC=C[C@H](' + TBS + ')[C@]1(C)C(=O)O', { caption: 'C_17H_30O_5Si', explanation: 'Methanolyse des Anhydrids an der anderen Carbonylgruppe → Konstitutionsisomer zu B.' }),
    N('C', 'C', 'C[C@@]1(C(=O)OC(=O)OC)CC=C[C@H](' + TBS + ')[C@]1(C)C(=O)OC', { caption: 'C_19H_32O_7Si' }),
    N('C2', 'C´', 'C[C@@]1(C(=O)OC)CC=C[C@H](' + TBS + ')[C@]1(C)C(=O)OC(=O)OC', { caption: 'C_19H_32O_7Si' }),
    G('L0', '', 'C[C@]12COC(=O)[C@@]1(C)[C@@H](' + TBS + ')C=CC2'),
    N('D', 'D', 'C[C@]1(CC=O)COC(=O)[C@@]1(C)[C@@H](' + TBS + ')C=O', { explanation: 'Ozonolyse der Ring-Doppelbindung mit reduktiver Aufarbeitung → Dialdehyd.' }),
    N('Ee', 'E', 'O=CC1=C[C@H](' + TBS + ')[C@]2(C)C(=O)OC[C@]12C', { explanation: 'Intramolekulare Aldolkondensation → Cyclopentencarbaldehyd.' }),
    G('AL', '', 'OCC1=C[C@H](' + TBS + ')[C@]2(C)C(=O)OC[C@]12C'),
    G('CJ', '', 'C=C1[C@@H](CC(=O)OCC)[C@H](' + TBS + ')[C@]2(C)C(=O)OC[C@]12C'),
    N('F', 'F', 'IC[C@]12OC(=O)C[C@H]1[C@H](' + TBS + ')[C@]1(C)C(=O)OC[C@]21C', { explanation: 'LiOH verseift den Ethylester; Iodlactonisierung (I_2, NaHCO_3) an der exocyclischen Doppelbindung → γ-Lacton mit CH_2I.' }),
    G('MER', 'Merrilacton A', 'C[C@@]12COC(=O)[C@@]1([C@H]3[C@@]45[C@@]2(C[C@@H](C4(O3)C)O)OC(=O)C5)C')
  ], [
    E(['Di', 'An'], 'A', '165 °C'),
    E('A', 'B', 'NaOMe', 'MeOH'),
    E('A', 'B2', 'NaOMe', 'MeOH'),
    E('B', 'C', 'Cl-CO_2Me'),
    E('B2', 'C2', 'Cl-CO_2Me'),
    E(['C', 'C2'], 'L0', 'Reduktion'),
    E('L0', 'D', '1. O_3', '2. (CH_3)_2S'),
    E('D', 'Ee', 'Base', 'Cyclisierung, -H_2O'),
    E('Ee', 'AL', 'Y'),
    E('AL', 'CJ', 'Claisen-Johnson'),
    E('CJ', 'F', '1. LiOH', '2. I_2, NaHCO_3'),
    E('F', 'MER', '(mehrere Stufen)')
  ], { hints: ['TDBMS = O-Si(CH_3)_2-C(CH_3)_3 (tert-Butyldimethylsilyloxy)'] }));
  addSection(q, SA('Reagenz Y (2.4)', 'Geben Sie die Summenformel für Reagenz Y an.', 'Y = NaBH_4'), 0);
  const iso = q.sections.findIndex(s => /Isomerie B/.test(s.title || ''));
  if (iso >= 0) q.sections[iso].title = 'Isomerieart B/B´ bzw. C/C´ (2.5)';
});

patch('bw50 vitamin-e', () => {
  const q = Q('bw50-2024-vitamin-e');
  q.intro = 'Vitamin E — auch gegen neurodegenerative Erkrankungen. Zwei Wege führen zu den Bausteinen D und D´.';
  const tail = 'CC(C)(C)OC[C@H](C)C';
  setSec(q, 0, syn('C. Vitamin E', [
    G('Ed', '', tail + 'OS(=O)(=O)c1ccc(C)cc1'),
    N('A', 'A', tail + 'C#N'),
    N('B', 'B', tail + 'C=O', { caption: 'C: 68,3 %, H: 11,5 %, O: 20,2 %' }),
    G('Br', '', tail + 'Br'),
    N('C', 'C', tail + '[C@@H](O)C#CC', { explanation: 'Addition des Propinyl-Lithiums an den Aldehyd B (A_N) → Propargylalkohol; beide Epimere am Carbinol-C entstehen (C und C´).' }),
    N('C2', 'C´', tail + '[C@H](O)C#CC', { caption: '(Isomere)' }),
    N('D', 'D', tail + '[C@@H](O)/C=C/C', { explanation: 'Birch-artige Reduktion (Na/NH_3) → E-Alken.' }),
    N('D2', 'D´', tail + '[C@@H](O)/C=C\\C', { caption: '(Isomere)', explanation: 'Lindlar-Hydrierung (Pd/PbAc_2) → Z-Alken.' }),
    G('VE', 'Vitamin E', 'CC(C)CCCC(C)CCCC(C)CCCC1(C)CCc2c(C)c(O)c(C)c(C)c2O1')
  ], [
    E('Ed', 'A', 'NaCN'),
    E('A', 'B', 'iBu_2AlH'),
    E('B', 'C', '1. Li-C≡C-CH_3', '2. H^+(aq)'),
    E('B', 'C2', '1. Li-C≡C-CH_3', '2. H^+(aq)'),
    E('Br', 'C', '1. X', '2. Y'),
    E('C', 'D', 'Na / NH_3 (l)'),
    E('C', 'D2', 'H_2', 'Pd + PbAc_2'),
    E(['D', 'D2'], 'VE', '(mehrere Stufen)')
  ], { hints: ['OtBu = tert-Butoxy; OTs = Tosylat (p-Toluolsulfonat)'] }));
  addSection(q, SA('Summenformel von B (2.6)', 'Geben Sie die Summenformel von B an.', 'C_9H_18O_2'), 0);
  addSection(q, SA('Reagenzien X und Y (2.7)', 'Geben Sie die Summenformel von Reagenz X und die Struktur von Y an.', 'X = Mg (Grignard-Bildung); Y = But-2-inal, CH_3-C≡C-CHO'), 1);
  addSection(q, SA('Stereoisomere von Vitamin E (2.9, 2.10)', 'Wie viele Stereoisomere gibt es von Vitamin E? Ist Vitamin E lipophil oder hydrophil?', '2^3 = 8 Stereoisomere; lipophil.'));
});

patch('bw50 dipeptid', () => {
  const q = Q('bw50-2024-tyr-asp-dipeptid');
  q.intro = 'Der Forschung ist es gelungen, die Rolle des Dipeptids (Tyr-Asp) bei der Wirkung auf eine bessere Resistenz bei Pflanzen gegenüber oxidativem und Salzstress zu beschreiben. Das Dipeptid veranlasst eine Modulation des pflanzlichen Glucosestoffwechsels in Richtung der Produktion von NADPH.';
  const phth = 'O=C1c2ccccc2C(=O)N1';
  const tyr = 'Cc1ccc(O)cc1';
  setSec(q, 0, syn('D. Synthese eines Dipeptids', [
    G('PK', '', '[K+].O=C1c2ccccc2C(=O)[N-]1'),
    G('BM', '', 'CCOC(=O)C(Br)C(=O)OCC'),
    N('A', 'A', phth + 'C(C(=O)OCC)C(=O)OCC'),
    N('Am', 'A^-', phth + '[C-](C(=O)OCC)C(=O)OCC'),
    N('X', 'X', 'BrCc1ccc(O)cc1', { caption: 'X = 4-(Brommethyl)phenol' }),
    N('B', 'B', phth + 'C(' + tyr + ')(C(=O)OCC)C(=O)OCC'),
    N('C', 'C', '[O-]C(=O)c1ccccc1C(=O)[O-]'),
    N('D', 'D', 'NC(' + tyr + ')(C(=O)[O-])C(=O)[O-]'),
    N('Ee', 'E', 'N[C@@H](' + tyr + ')C(=O)[O-]', { name: 'L-Tyrosin' }),
    N('F', 'F', 'CC(C)(C)OC(=O)N[C@@H](' + tyr + ')C(=O)[O-]'),
    G('AT', '', 'N[C@@H](CC(=O)OCc1ccccc1)C(=O)OC', { name: 'Asp(OBn)-Träger (Träger hier als CH_3 gezeichnet)' }),
    N('Gg', 'G', 'CC(C)(C)OC(=O)N[C@@H](' + tyr + ')C(=O)N[C@@H](CC(=O)OCc1ccccc1)C(=O)OC'),
    N('H', 'H', 'N[C@@H](' + tyr + ')C(=O)N[C@@H](CC(=O)O)C(=O)O', { caption: 'C_13H_16N_2O_6' })
  ], [
    E(['PK', 'BM'], 'A'),
    E('A', 'Am', 'NaOEt'),
    E(['Am', 'X'], 'B'),
    E('B', 'D', 'Δ', 'NaOH'),
    E('B', 'C', 'Δ', 'NaOH'),
    E('D', 'Ee', 'Δ, H^+', '-CO_2'),
    E('Ee', 'F', 'Boc_2O'),
    E(['F', 'AT'], 'Gg', 'DCC'),
    E('Gg', 'H', '1. H_2 / Pd', '2. HCl (konz.)')
  ], {
    hints: [
      'M(C) und M(D) sind größer als 50 g/mol, C ist ein Nebenprodukt, das nicht weiter reagiert.',
      'Abkürzungen: Boc_2O = Di-tert-butyldicarbonat, Bn = Benzyl, DCC = Dicyclohexylcarbodiimid.'
    ]
  }));
  addSection(q, SA('Funktionelle Gruppe der Peptidbindung (2.12)', 'Benennen Sie die in Peptidbindungen vorliegende funktionelle Gruppe.', 'Carbonsäureamid'));
});
