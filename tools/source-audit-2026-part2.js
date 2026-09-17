/* Source audit, part 2 — BW 44 (2018), Aufgabe 3 „Organische Synthesen" */
const { Q, N, G, E, syn, SA, setSec, findSec, addSection, patch } = require('./source-audit-2026');

const LA_RR = 'C[C@H]1OC(=O)[C@@H](C)OC1=O';
const LA_SS = 'C[C@@H]1OC(=O)[C@H](C)OC1=O';
const LA_MESO = 'C[C@H]1OC(=O)[C@H](C)OC1=O';

patch('bw44 lactid', () => {
  const q = Q('bw44-2018-lactid-pla');
  q.intro = 'Polylactide, kurz PLA, sind Polymere, die durch ROP (ring opening polymerisation) gebildet werden können. Erstmalig beschrieben wurden Polylactide 1845 von Théophile-Jules Pelouze. Die aus PLA herstellbaren Thermoplaste erfreuen sich wegen ihrer biologischen Abbaubarkeit wachsender Beliebtheit. Ein Verfahren zur Herstellung von PLA aus Lactiden wurde 1932 entwickelt und 1954 von der Firma DuPont patentiert.';
  // Labels no longer name the configuration — that is what 3.1 asks.
  setSec(q, 0, syn('Stereoisomere des Lactids (3.1)', [
    N('RR', 'Isomer 1', LA_RR, { name: '(3R,6R)-Lactid' }),
    N('SS', 'Isomer 2', LA_SS, { name: '(3S,6S)-Lactid' }),
    N('RS', 'Isomer 3', LA_MESO, { name: '(3R,6S)-Lactid (meso)' })
  ], [], { body: 'Geben Sie die Konfigurationsformeln aller möglichen Stereoisomere des Lactids an und bestimmen Sie die absoluten Konfigurationen aller stereogenen Zentren.' }));
  setSec(q, 1, syn('Ringöffnungspolymerisation von Lactid (3.2)', [
    G('LA', 'Lactid (LA)', LA_RR),
    N('I', '', 'COC(=O)[C@@H](C)OC(=O)[C@@H](C)[O-].[Na+]', { name: 'Initiation',
      explanation: 'Methanolat greift ein Carbonyl-C des Lactids an (Acylsubstitution); der Ring öffnet sich zum Alkoxid. Die stereogenen Zentren bleiben unverändert (R).' }),
    N('P2', '', 'COC(=O)[C@@H](C)OC(=O)[C@@H](C)OC(=O)[C@@H](C)OC(=O)[C@@H](C)[O-].[Na+]', { name: 'Propagation (n = 1)',
      explanation: 'Das Alkoxid öffnet das nächste Lactid-Molekül; die Kette wächst um zwei Milchsäure-Einheiten.' }),
    N('P3', '', 'COC(=O)[C@@H](C)OC(=O)[C@@H](C)OC(=O)[C@@H](C)OC(=O)[C@@H](C)O', { name: 'Termination',
      explanation: 'H_3O^+ protoniert das Alkoxid-Kettenende. Repetitive Einheit: -[O-CH(CH_3)-C(=O)]-.' })
  ], [
    E('LA', 'I', '1 äq. NaOCH_3', '1'),
    E('I', 'P2', 'n LA', '2'),
    E('P2', 'P3', 'H_3O^+', '3')
  ]));
  addSection(q, SA('Saure Hydrolyse des Lactids (3.4)',
    'Geben Sie den/die IUPAC-Namen für das Produkt / die Produkte der sauren Hydrolyse des Lactids LA inklusive etwaiger Stereodeskriptoren an.',
    '(R)-2-Hydroxypropansäure'));
});

patch('bw44 kaffeesaeure', () => {
  const q = Q('bw44-2018-kaffeesaeure');
  q.intro = 'In dieser Aufgabe geht es um die Synthese eines Kaffeesäurederivates I, das neben 20 anderen Estern der Kaffeesäure in Bezug auf cytoprotektive Eigenschaften gegenüber H_2O_2-induzierter Cytotoxizität untersucht wurde.';
  const MOM = 'COC';
  const cat = (x) => `c1ccc(O${x})c(O${x})c1`;
  const rest = q.sections.slice(3);
  q.sections = [q.sections[0]];
  setSec(q, 0, syn('B. Synthese eines Kaffeesäurederivates', [
    N('Z', 'Z', 'OC(=O)CBr'),
    G('C', 'C', 'OC(=O)CP(=O)(OCc1ccccc1)OCc1ccccc1'),
    N('A', 'A', 'O=Cc1ccc(O)c(O)c1'),
    N('B', 'B', 'O=Cc1ccc2OCOc2c1', { explanation: 'Methanal bildet unter Säurekatalyse mit dem Catechol ein cyclisches Acetal (Methylendioxy-Gruppe); X = H_2O.' }),
    N('F', 'F', 'OC(=O)/C=C/c1ccc(O)c(O)c1', { caption: 'Kaffeesäure',
      explanation: 'Horner-Wadsworth-Emmons-Reaktion: NaOEt deprotoniert das Phosphonat C; das Carbanion addiert an den Aldehyd (A_N) → E-Alken. HCl spaltet anschließend die Schutzgruppe.' }),
    N('F2', 'F´', 'OC(=O)/C=C\\c1ccc(O)c(O)c1', { name: 'Z-Kaffeesäure' }),
    N('D', 'D', 'O=C' + cat(MOM), { explanation: 'Williamson-Ethersynthese (S_N2): NaH deprotoniert die Phenole, die Phenolate substituieren MOM-Cl. Schutz vor Oxidation der Phenole.' }),
    N('E', 'E', 'O=C/C=C/' + cat(MOM), { explanation: 'Aldolkondensation (A_N, dann Eliminierung) mit Ethanal → α,β-ungesättigter Aldehyd (E-Form).' }),
    N('E2', 'E´', 'O=C/C=C\\' + cat(MOM), { name: 'Z-Form' }),
    N('G', 'G', 'OC(=O)/C=C/' + cat(MOM)),
    N('H', 'H', 'ClC(=O)/C=C/' + cat(MOM)),
    N('I', 'I', 'O=C(/C=C/c1ccc(O)c(O)c1)OCCCc1ccccc1', { explanation: 'Veresterung des Säurechlorids mit 3-Phenylpropan-1-ol (Y = HCl); HCl spaltet die MOM-Ether.' })
  ], [
    E('Z', 'C', 'P(OBn)_3', '-BnBr'),
    E('A', 'B', 'H_2C=O, H^+', '-X'),
    E(['B', 'C'], 'F', '1. NaOEt', '2. HCl'),
    E('F', 'F2', 'Isomerisierung'),
    E('A', 'D', 'MOM-Cl, NaH', 'CH_2Cl_2'),
    E('D', 'E', 'Base, Ethanal', '-H_2O'),
    E('D', 'E2', 'Base, Ethanal', '-H_2O'),
    E('E', 'F', '1. PDC', '2. HCl, 7h'),
    E('E2', 'F2', '1. PDC', '2. HCl, 7h'),
    E('F', 'G', 'MOM-Cl, NaH', 'CH_2Cl_2'),
    E('G', 'H', 'SOCl_2'),
    E('H', 'I', '1. 3-Phenylpropan-1-ol', '2. HCl, 7h; -Y')
  ], {
    hints: [
      'Substanz A trägt den Namen 3,4-Dihydroxybenzencarbaldehyd.',
      'E und E´ sind Stereoisomere.',
      'F und F´ sind Stereoisomere.',
      'Substanz F kann durch eine Isomerisierungsreaktion in F´ übergeführt werden.',
      'F und F´ haben folgende Elementarzusammensetzung (w/w): 60,00 % C, 4,48 % H, 35,52 % O.',
      'Abkürzungen: Ph = Phenyl, Bn = Benzyl (Phenylmethyl), MOMCl = CH_3OCH_2Cl, PDC = Pyridiniumdichromat.'
    ]
  }));
  q.sections.push(...rest);
  const t = (re, title) => {
    if (q.sections.some(s => s.title === title)) return;
    const i = findSec(q, s => re.test(s.title || '')); q.sections[i].title = title;
  };
  t(/Arbuzov/, 'Mechanismus P(OBn)_3 + Z → C (3.7)');
  t(/MOM-Schutzgruppe/, 'Bildung von D aus A (3.12)');
  t(/Z-Isomerisierung/, 'Isomerisierung F → F´ (3.9)');
  addSection(q, SA('Summenformel von F und F´ (3.5)', 'Schreiben Sie die Summenformel von F und F´ auf.', 'C_9H_8O_4'), 0);
  addSection(q, SA('Moleküle X und Y', 'Geben Sie die Summenformeln der abgespaltenen Moleküle X und Y an.', 'X = H_2O, Y = HCl'));
  addSection(q, SA('E/E´ und F/F´ (3.8)', 'In welchem stereochemischen Verhältnis stehen E und E´ bzw. F und F´ jeweils zueinander?', 'Diastereomere (geometrische Isomere, E/Z).'));
  addSection(q, SA('Rolle von NaOEt (3.10)',
    'Welche Funktion hat NaOEt im ersten Schritt bei der Bildung von F aus B und C? Welcher Mechanismus folgt, und wie heißt die Namensreaktion?',
    'NaOEt ist Base und deprotoniert das Phosphonat C zum Carbanion; dieses reagiert per A_N mit dem Aldehyd B. Namensreaktion: Horner-Wadsworth-Emmons (HWE-Wittig).'));
});

patch('bw44 colchicin', () => {
  const q = Q('bw44-2018-colchicin');
  q.intro = 'Colchicin, das Hauptalkaloid der Herbstzeitlosen, ist einer der prominentesten Naturstoffe. Einerseits potentes Pflanzengift, besitzt es andererseits großes pharmazeutisches Potential, da es als Mitose-Hemmstoff die Ausbildung des Spindelapparates inhibiert. Die Reaktionsfolge in dieser Aufgabe geht auf Woodward (1963) zurück. Ein besonderes Merkmal dieser Synthese ist die sehr frühe strategische Einführung der Stickstofffunktionalität am C-7.';
  const Ar = 'c1cc(OC)c(OC)c(OC)c1';
  const tri = 'c2cc(OC)c(OC)c(OC)c21';
  const sec = syn('C. Die Woodward-Synthese von Colchicin (3.13)', [
    N('A', 'A', 'COC(=O)/C=C(\\C)N'),
    G('IT', '', 'Cc1nscc1C(=O)OC'),
    N('B', 'B', 'BrCc1nscc1C(=O)OC', { explanation: 'Radikalische Substitution (NBS, hν) an der benzylartigen Methylgruppe.' }),
    N('C', 'C', '[Br-].COC(=O)c1csnc1C[P+](c1ccccc1)(c1ccccc1)c1ccccc1', { explanation: 'S_N2 von PPh_3 am Brommethyl-C → Phosphoniumsalz.' }),
    N('D', 'D', 'O=C' + Ar, { explanation: '3,4,5-Trimethoxybenzaldehyd. W = NaOMe erzeugt das Ylid (Wittig).' }),
    G('E', 'E', 'COC(=O)c1csnc1C=C' + Ar),
    N('F', 'F', 'OCc1csnc1CC' + Ar, { explanation: 'Diimid (aus N_2H_4/H_2O_2/Cu^{2+}) hydriert die C=C-Bindung; LiAlH_4 reduziert den Ester zum primären Alkohol.' }),
    N('G2', 'G', 'O=Cc1csnc1CC' + Ar, { explanation: 'PDC oxidiert den primären Alkohol zum Aldehyd.' }),
    N('H', 'H', 'OC(=O)/C=C/C=C/c1csnc1CC' + Ar, { explanation: 'Wittig-Olefinierung mit dem Dienyl-Ylid, Esterverseifung und Isomerisierung zum E,E-Dien.' }),
    N('I', 'I', 'OC(=O)C/C=C/C1c2csnc2CC' + tri, { explanation: 'Säurekatalysierter Ringschluss: Friedel-Crafts-Alkylierung (S_E) des elektronenreichen Aromaten → Siebenring; die Doppelbindung wandert.' }),
    G('K', 'K', '[Li]OC(=O)CCCC1c2c([Li])snc2CC' + tri),
    N('L', 'L', 'OC(=O)CCCC1c2c(C(=O)O)snc2CC' + tri),
    N('M', 'M', 'COC(=O)CCCC1c2c(C(=O)OC)snc2CC' + tri),
    N('N', 'N', 'COC(=O)C1CCC2c3c(snc3CCc3cc(OC)c(OC)c(OC)c32)C1=O', { explanation: 'Dieckmann-Kondensation (NaH) → Siebenring-β-Ketoester.' }),
    N('O', 'O', 'O=C1CCCC2c3c1snc3CCc1cc(OC)c(OC)c(OC)c21', { caption: 'C_19H_21NO_4S', explanation: 'Esterhydrolyse und Decarboxylierung des β-Ketoesters.' }),
    N('P', 'P', 'O=C1C(=CO)CCC2c3c1snc3CCc1cc(OC)c(OC)c(OC)c21', { caption: 'Enolform, C_20H_21NO_5S', explanation: 'Claisen-Kondensation mit Ameisensäureethylester → Hydroxymethylenketon (Enolform).' }),
    G('Qd', 'Q', 'O=C1c2snc3CCc4cc(OC)c(OC)c(OC)c4C(CCC15SCCS5)c23'),
    N('R', 'R', 'O=C1c2snc3CCc4cc(OC)c(OC)c(OC)c4C(CCC1=O)c23', { explanation: 'Hg^{2+} spaltet das Dithioacetal → 1,2-Diketon.' }),
    G('COL', 'Colchicin', 'COC1=CC=C2C(=CC1=O)[C@H](CCC3=CC(=C(C(=C32)OC)OC)OC)NC(C)=O')
  ], [
    E('A', 'IT', 'CSCl_2', 'NEt_3 / Et_2O'),
    E('IT', 'B', 'NBS / CCl_4', 'hν'),
    E('B', 'C', 'PPh_3'),
    E(['C', 'D'], 'E', '1. W', '2. D'),
    E('E', 'F', '1. N_2H_4 / H_2O_2 / Cu^{2+}', '2. LiAlH_4'),
    E('F', 'G2', 'PDC'),
    E('G2', 'H', '1. Ph_3P=CH-CH=CH-CO_2Me', '2. a) NaOH b) H^+\n3. Isomerisierung zum E,E-Dien'),
    E('H', 'I', '1. Ringschluss, HClO_4', '2. HClO_4, Umwandlung Stellungsisomere'),
    E('I', 'K', 'Z_1', 'Z_2'),
    E('K', 'L', '1. CO_2', '2. H^+'),
    E('L', 'M', 'CH_3OH / H^+'),
    E('M', 'N', 'NaH / Dioxan', 'Cyclisierung'),
    E('N', 'O', 'H_3O^+, erhitzen', '-CO_2'),
    E('O', 'P', 'NaH, HCO_2Et', 'EtOH'),
    E('P', 'Qd', '(mehrere Stufen)'),
    E('Qd', 'R', 'H^+, erhitzen, Hg(Ac)_2', '-X, -Y'),
    E('R', 'COL', '(mehrere Stufen)')
  ], {
    hints: [
      'Substanz A: Methyl-(E)-3-aminobut-2-enoat',
      'N_2H_4 / H_2O_2 / Cu^{2+}: spezielles Reduktionsmittel, reduziert nicht aromatische Doppelbindungen',
      'PDC: Pyridiniumdichromat',
      'Für F bis R gibt die Angabe als Teilstrukturen den Trimethoxyphenyl-Teil und den Isothiazol-Ring vor.'
    ]
  });
  if (!(q.sections[0] && q.sections[0].type === 'synthesis')) q.sections.unshift({ type: 'synthesis', scheme: { nodes: [] } });
  setSec(q, 0, sec);
  addSection(q, SA('Moleküle W, X und Y', 'Geben Sie die Summenformeln von W, X und Y an.',
    'W = NaOMe (Base für die Ylid-Bildung); X und Y: beim Entschützen abgespalten — Hg(SCH_2CH_2S) und HAc (Essigsäure).'), 0);
});
