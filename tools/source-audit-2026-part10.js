/* Source audit, part 10 — BW 52 (2026), Aufgabe 4 „Von (bio)organischen
   Synthesen" (new). Source: 52-BW-2026-Theorie-Angabe / -m-Losungen
   from oecho.at. */
const { N, G, E, syn, SA, upsertQuestion, patch } = require('./source-audit-2026');

const SRC = 'ÖChO Bundeswettbewerb 2026 (BW 52), Aufgabe 4';
const R = '[C@@H](O)[C@H](O)[C@H](O)CO';   // D-fructose C3–C6
const SIPH2 = 'O[Si](c9ccccc9)(c9ccccc9)';

patch('bw52 maillard + zucker (neu)', () => {
  upsertQuestion({
    id: 'bw52-2026-maillard-zucker',
    category: 'Mehrstufige Synthesen',
    name: 'Maillard-Reaktion & Zuckerrätsel — BW 2026',
    type: 'composed',
    difficulty: 'C',
    source: SRC + ' A, B, F',
    intro: 'Von (bio)organischen Synthesen: rund um die Maillard-Reaktion, ein kleines Zuckerrätsel und die Derivatisierung eines Zuckers.',
    sections: [
      syn('A. Rund um die Maillard-Reaktion', [
        N('A', 'A', 'OCC(=O)' + R, { name: 'D-Fructose' }),
        G('ASN', '', 'N[C@@H](CC(N)=O)C(=O)O'),
        N('B', 'B', 'NC(=O)C[C@H](NC(O)(CO)' + R + ')C(=O)O', { caption: 'N-Fructosylasparagin' }),
        N('C', 'C', 'NC(=O)C[C@H](N=C(CO)' + R + ')C(=O)O', { explanation: 'Wasserabspaltung → Imin (Schiff-Base).' }),
        N('D', 'D', 'NC(=O)CC=NC(CO)' + R, { explanation: 'Decarboxylierung (−CO_2, −H^+) mit Verschiebung der C=N-Bindung.' }),
        N('Ee', 'E', 'NC(=O)CC=O', { explanation: 'Hydrolyse des Imins → 3-Oxopropanamid (C_3H_5NO_2, Aldehyd → positiver Tollens-Test).' }),
        N('F', 'F', 'NC(=O)CCO'),
        N('Gg', 'G', 'C=CC(N)=O', { caption: 'Acrylamid' }),
        N('CYS', 'Cystein', 'N[C@@H](CS)C(=O)O'),
        N('H', 'H', 'NC(=O)CCSC[C@H](N)C(=O)O', { explanation: 'Thia-Michael-Addition des Thiols an Acrylamid.' }),
        N('H2', 'H´', 'NC(=O)CCN[C@@H](CS)C(=O)O', { explanation: 'Aza-Michael-Addition der Aminogruppe an Acrylamid (Isomer zu H).' }),
        N('I', 'I', 'NC(=O)CCN[C@@H](CSCCC(N)=O)C(=O)O', { explanation: 'Zweite Michael-Addition eines weiteren Acrylamids.' })
      ], [
        E(['A', 'ASN'], 'B', '⇌'),
        E('B', 'C', '-H_2O'),
        E('C', 'D', '-H^+', 'Decarboxylierung'),
        E('D', 'Ee', '', 'Hydrolyse'),
        E('Ee', 'F', '', 'Reduktion'),
        E('F', 'Gg', '', 'Dehydratisierung'),
        E(['Gg', 'CYS'], 'H', 'Cystein'),
        E(['Gg', 'CYS'], 'H2', 'Cystein'),
        E('H', 'I', 'Acrylamid'),
        E('H2', 'I', 'Acrylamid')
      ], {
        hints: [
          'Verbindung A trägt den IUPAC-Namen (3S,4R,5R)-1,3,4,5,6-Pentahydroxyhexanon und stellt die wohl bekannteste Ketose dar.',
          'E hat die Summenformel C_3H_5NO_2 und zeigt einen positiven Tollens-Test.',
          'Cystein trägt den IUPAC-Namen (R)-2-Amino-3-sulfanylpropansäure.',
          'H + H´ sind Isomere.',
          'B enthält zwei sp^2-hybridisierte C-Atome.'
        ]
      }),
      syn('B. Ein kleines Zuckerrätsel', [
        N('X', 'X', 'C([C@H]([C@@H]1[C@@H]([C@@H]([C@@H](O1)O)O)O)O)O', { name: 'β-D-Mannofuranose' }),
        N('A2', 'A', 'CC1(OC[C@@H](O1)[C@@H]2[C@H]3[C@@H]([C@H](O2)O)OC(O3)(C)C)C', { name: '2,3:5,6-Di-O-isopropyliden-D-mannofuranose' })
      ], [
        E('X', 'A2', 'Aceton (Überschuss)', 'p-TsOH (kat.)')
      ], {
        hints: [
          'Die Elementaranalyse des Monosaccharids X ergibt die Summenformel C_6H_12O_6.',
          'X kann 2,3- und/oder 5,6-Acetonide bilden.',
          'Bei der Behandlung von X mit Aceton im Überschuss und katalytischen Mengen p-Toluensulfonsäure entsteht ausschließlich ein Produkt A. Die massenspektrometrische Analyse von A zeigte: M(A) = M(X) + 80.',
          'Bei Behandlung von X mit Bromwasser kann eine rasche Entfärbung beobachtet werden.',
          'X reagiert mit Periodat unter der Bildung von Methanal und Ameisensäure.',
          'In der cyclischen Form soll der Zucker als β-D-Furanose betrachtet werden.'
        ]
      }),
      SA('Aldose oder Ketose? (4.2)', 'Handelt es sich bei X um eine Aldose, eine Ketose oder einen Zuckeralkohol?', 'Aldose'),
      syn('F. Derivatisierung eines Zuckers', [
        G('FR', '', 'C1[C@H]([C@H]([C@@H]([C@](O1)(CO)O)O)O)O'),
        N('A3', 'A', 'C1[C@H]([C@H]([C@@H]([C@]2(O1)COC(C)(C)O2)OC(C)=O)OC(C)=O)OS(=O)(=O)c1ccc(C)cc1', {
          explanation: '1. Acetonid über die OH-Gruppen an C1 und C2 (Spiro-Dioxolan). 2. Tosylierung (1 eq) der zugänglichsten sekundären OH-Gruppe. 3. Acetylierung der übrigen OH-Gruppen.' })
      ], [
        E('FR', 'A3', '1. CH_3C(OCH_3)_2, H^+ (1 eq)', '2. TsCl / Pyridin (1 eq); 3. Ac_2O / Pyridin (Überschuss)')
      ], { body: 'Der vorliegende Zucker wird in 3 Schritten mit verschiedenen Reagenzien behandelt.' })
    ]
  });
});

patch('bw52 xylit (neu)', () => {
  const UDPG = 'C1=CN(C(=O)NC1=O)[C@H]2[C@@H]([C@@H]([C@H](O2)COP(=O)(O)OP(=O)(O)O[C@@H]3[C@@H]([C@H]([C@@H]([C@H](O3)CO)O)O)O)O)O';
  const UDPGA = 'C1=CN(C(=O)NC1=O)[C@H]2[C@@H]([C@@H]([C@H](O2)COP(=O)(O)OP(=O)(O)O[C@@H]3[C@@H]([C@H]([C@@H]([C@H](O3)C(=O)O)O)O)O)O)O';
  upsertQuestion({
    id: 'bw52-2026-xylit',
    category: 'Mehrstufige Synthesen',
    name: 'Xylit — Stoffwechselweg aus UDP-Glucose (BW 2026)',
    type: 'composed',
    difficulty: 'C',
    source: SRC + ' C',
    intro: 'Monosaccharide spielen im Stoffwechsel eine bedeutsame Rolle, ob in der Photosynthese, in der Glycolyse, bei der Gluconeogenese oder bei der Speicherung als osmotisch inaktives Glykogen. Pflanzen (und auch die süßen Meerschweinchen) nutzen Teile des vorliegenden Stoffwechselweges für die Ascorbinsäure-Biosynthese oder zur Produktion von Xylit.',
    sections: [
      syn('C. Xylit', [
        N('U1', '', UDPG, { caption: 'UDP-D-Glucose' }),
        N('U2', '', UDPGA, { caption: 'UDP-D-Glucuronat' }),
        N('GA', '', '[C@@H]1([C@@H]([C@H](OC([C@@H]1O)O)C(=O)[O-])O)O', { caption: 'D-Glucuronat' }),
        N('LG', '', 'C([C@@H]([C@H]([C@@H]([C@@H](C(=O)[O-])O)O)O)O)O', { caption: 'L-Gulonat' }),
        N('KG', '', 'C([C@@H]([C@H](C(=O)[C@@H](C(=O)[O-])O)O)O)O', { caption: 'Keto-L-Gulonat' }),
        N('LX', '', 'C([C@@H]([C@H](C(=O)CO)O)O)O', { caption: 'L-Xylulose' }),
        N('XY', '', 'C([C@H](C([C@H](CO)O)O)O)O', { caption: 'Xylit' })
      ], [
        E('U1', 'U2', '1.', '2 NAD^+'),
        E('U2', 'GA', '2.', 'H_2O'),
        E('GA', 'LG', '3.', 'NADPH → NADP^+'),
        E('LG', 'KG', '4.', 'NAD^+'),
        E('KG', 'LX', '5.'),
        E('LX', 'XY', '6.', 'NADPH → NADP^+')
      ], {
        hints: [
          'Glucose trägt den IUPAC-Namen (2R,3S,4R,5R)-2,3,4,5,6-Pentahydroxyhexanal und stellt das bekannteste Monosaccharid dar.',
          'UDP steht für „Uridindiphosphat".',
          'In UDP-Glucose ist die Hexose am anomeren C-Atom über UDP mit einer α-Verknüpfung verestert.',
          'Reaktion 1. benötigt 2 Äquivalente NAD^+.',
          'L-Gulonat reagiert negativ auf den Tollens-Test, D-Glucuronat hingegen positiv.',
          'Keto-L-Gulonat lässt sich besonders leicht decarboxylieren (Reaktion 5.).',
          'Xylit ist eine achirale Verbindung.'
        ]
      }),
      SA('Photosynthese (4.4)', 'Formulieren Sie die abgestimmte Bruttogleichung für die Photosynthese.', '6 CO_2 + 6 H_2O → 6 O_2 + C_6H_12O_6'),
      SA('Enzymklassen (4.5)', 'Ordnen Sie den Reaktionen 1.–6. die Enzymklasse zu (I Oxidoreduktasen, II Transferasen, III Hydrolasen, IV Lyasen, V Isomerasen, VI Ligasen).', '1: I; 2: III; 3: I; 4: I; 5: IV; 6: I'),
      SA('Stereoisomere von Xylit (4.9)', 'Wie viele Stereoisomere gibt es zu Xylit?', '3 — neben Xylit gibt es Ribit (meso) sowie D- und L-Arabit.')
    ]
  });
});

patch('bw52 adrenosteron (neu)', () => {
  const ring = (tail) => 'C[C@]12CCC3(SCCS3)C=C1CC' + tail;
  const Y = 'O[C@@H](c9ccccc9)[C@H](c9ccccc9)OC(=O)C(C)=CC=CC(=O)OC';
  upsertQuestion({
    id: 'bw52-2026-adrenosteron',
    category: 'Mehrstufige Synthesen',
    name: 'Totalsynthese von (+)-Adrenosteron — BW 2026',
    type: 'composed',
    difficulty: 'D',
    source: SRC + ' D',
    intro: 'Totalsynthese von (+)-Adrenosteron (ein Hormonzeugsl) — von der Wieland-Miescher-Ketonbildung über eine intramolekulare Diels-Alder-Reaktion zum Steroidgerüst.',
    sections: [
      syn('D. Totalsynthese von (+)-Adrenosteron', [
        G('SM', '', 'O=C1CCCC(=O)C1'),
        N('A', 'A', 'O=C1CCCC(=O)C1[Li]'),
        N('B', 'B', 'CC1C(=O)CCCC1=O'),
        N('C', 'C', 'CC(=O)CCC1(C)C(=O)CCCC1=O', { explanation: 'Michael-Addition an Methylvinylketon.' }),
        N('D', 'D', 'C[C@]12CCC(=O)C=C1CCCC2=O', { name: '(S)-Wieland-Miescher-Keton', explanation: 'Prolin-katalysierte, enantioselektive intramolekulare Aldolkondensation (Hajos-Parrish).' }),
        N('Ee', 'E', 'C[C@]12CCC(=O)C=C1CCC[C@@]2(O)C#C', { explanation: 'x = Lithiumacetylid addiert an das nicht konjugierte Keton.' }),
        G('F', 'F', 'CC(=O)OC1=CC2=CCC[C@@](OC(C)=O)(C#C)[C@@]2(C)CC1'),
        N('Gg', 'G', 'C[C@]12CCC(=O)C=C1CCC=C2C(C)=O', { explanation: 'Ameisensäure: Rupe-Umlagerung des tertiären Propargylacetats → α,β-ungesättigtes Methylketon; das Enolacetat wird gespalten.' }),
        N('H', 'H', ring('C=C2C(C)=O'), { explanation: 'Selektive Thioketalisierung des Enons (1 eq Ethandithiol, BF_3·OEt_2).' }),
        N('Yr', 'y', Y),
        G('I', 'I', ring('C=C2C(=C)' + SIPH2 + 'O[C@H](c9ccccc9)[C@@H](c9ccccc9)OC(=O)C(C)=CC=CC(=O)OC')),
        N('K', 'K', 'C[C@]12CCC3(SCCS3)C=C1CCC1C2=C4CC(C)(C(=O)OC(c2ccccc2)C(c2ccccc2)O[Si](c2ccccc2)(c2ccccc2)O4)C1/C=C\\C(=O)OC',
          { explanation: 'Intramolekulare Diels-Alder-Reaktion (Toluen, 200 °C) über den Silicium-Tether → Ring C.' }),
        N('L', 'L', 'C[C@]12CCC3(SCCS3)C=C1CCC1C2C(=O)CC(C)(C(=O)OC)C1/C=C\\C(=O)OC', { explanation: 'K_2CO_3/MeOH spaltet den Tether: Methylester und Keton an C11.' }),
        G('M', 'M', 'C[C@]12CCC3(SCCS3)C=C1CCC1C2C(=O)CC(C)(C(=O)OC)C1CCC(=O)OC'),
        N('Nn', 'N', 'C[C@]12CCC3(SCCS3)C=C1CCC1C2C(=O)CC2(C)C(=O)C(C(=O)OC)CC12', { explanation: 'Dieckmann-Kondensation (^tBuOK) → Ring D.' }),
        N('ADR', '(+)-Adrenosteron', 'C[C@]12CCC(=O)C=C1CC[C@@H]3[C@@H]2C(=O)C[C@]4([C@H]3CCC4=O)C', { explanation: 'Esterhydrolyse und Decarboxylierung, dann Entschützung des Thioketals mit Hg^{2+}.' })
      ], [
        E('SM', 'A', 'LDA (1eq)', 'in THF'),
        E('A', 'B', 'CH_3I'),
        E('B', 'C', 'CH_2=CH-CO-CH_3', 'KOH (CH_3OH)'),
        E('C', 'D', '(S)-Prolin (Kat.)'),
        E('D', 'Ee', 'x'),
        E('Ee', 'F', 'Ac_2O', 'p-TsOH (cat.)'),
        E('F', 'Gg', 'HCOOH', '(90 %, 100 °C)'),
        E('Gg', 'H', 'HSCH_2CH_2SH (1eq)', 'BF_3·OEt_2'),
        E(['H', 'Yr'], 'I', 'KHMDS, Ph_2SiCl_2', 'y'),
        E('I', 'K', 'Toluen, 200 °C'),
        E('K', 'L', 'K_2CO_3, CH_3OH'),
        E('L', 'M', 'Mg'),
        E('M', 'Nn', '^tButOK', 'Toluen'),
        E('Nn', 'ADR', '1. HCl 2. NaOH', '3. Hg-Salz')
      ], {
        hints: [
          'LDA = ((CH_3)_2CH)_2NLi; KHMDS = ((CH_3)_3Si)_2NK; p-TsOH = p-Toluensulfonsäure',
          'Verbindung C zeigt im ^{13}C-NMR-Spektrum 3 Signale im Bereich von 160 ppm und ist ein Zwischenprodukt, das im Eintopfverfahren direkt zu D weiterreagiert.',
          'Verbindung D besitzt nur ein Stereozentrum.',
          'In der Totalsynthese kommt eine Cycloaddition vor.'
        ]
      }),
      SA('Mechanismus A → B (4.10)', 'Nennen Sie den Reaktionsmechanismus von A → B aus der Sichtweise von Methyliodid.', 'S_N2'),
      SA('Reagenzien x und y (4.11)', 'Schlagen Sie Reagenzien für x und y vor.', 'x: Lithiumacetylid (Li-C≡C-H); y: der Diol-Monoester (1R,2R)-2-Hydroxy-1,2-diphenylethyl-(2E,4Z)-5-methoxycarbonyl-2-methylpenta-2,4-dienoat, der über Ph_2SiCl_2 als Tether an das Enolat gebunden wird.'),
      SA('Aussagen zu (+)-Adrenosteron (4.13)', 'Richtig oder falsch? (a) Das + steht für die Konfiguration R. (b) Das + kann mit einem Polarimeter bestimmt werden. (c) (+)- und (−)-Adrenosteron sind Diastereomere. (d) Eine äquimolare Mischung von (+)- und (−)-Adrenosteron ist ein Racemat. (e) (+)- und (−)-Adrenosteron haben unterschiedliche Siedepunkte.',
        '(a) F, (b) R, (c) F (Enantiomere), (d) R, (e) F')
    ]
  });
});

patch('bw52 thymol (neu)', () => {
  upsertQuestion({
    id: 'bw52-2026-thymol-kuemmel',
    category: 'Mehrstufige Synthesen',
    name: 'Thymol aus Benzaldehyd — BW 2026',
    type: 'composed',
    difficulty: 'B',
    source: SRC + ' E',
    intro: 'Synthese von Thymol in Kümmel.',
    sections: [
      syn('E. Synthese von Thymol', [
        G('BZ', 'Benzaldehyd', 'O=Cc1ccccc1'),
        N('A', 'A', 'O=Cc1cccc([N+](=O)[O-])c1'),
        N('B', 'B', 'Cc1cccc([N+](=O)[O-])c1'),
        N('C', 'C', 'Cc1cccc(O)c1'),
        N('D', 'D', 'Cc1ccc(C(C)C)c(O)c1', { caption: 'Thymol, C_10H_14O' })
      ], [
        E('BZ', 'A', 'HNO_3'),
        E('A', 'B', 'N_2H_4 / KOH'),
        E('B', 'C', 'NaNO_2 / HCl', 'wässrige Aufarbeitung'),
        E('C', 'D', '2-Chlorpropan', 'AlCl_3')
      ], {
        body: 'Benzaldehyd wird mit Nitriersäure zu A umgesetzt, anschließend erfolgt eine Reduktion der Carbonylgruppe mit Hydrazin/KOH, wobei B gebildet wird. B wird mit NaNO_2/HCl umgesetzt, die wässrige Aufarbeitung liefert C. C liefert mit 2-Chlorpropan und Aluminiumchlorid das Produkt Thymol (D, C_10H_14O).',
        hints: ['B zeigt im NMR u. a. ein Singulett mit dem Integral 3 bei 1,5 ppm.']
      })
    ]
  });
});
