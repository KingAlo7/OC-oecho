/* Source audit, part 4 — BW 46 (2020, Ersatzwettbewerb), Aufgabe 5 */
const { Q, N, G, E, syn, SA, setSec, findSec, addSection, patch } = require('./source-audit-2026');

const Ph2CH = 'C(c9ccccc9)c9ccccc9';

patch('bw46 conicein', () => {
  const q = Q('bw46-2020-conicein');
  q.intro = 'In dieser Aufgabe geht es um die Synthese von Conicein, einem heterocyclischen Alkaloid. 1991 wurde es über elegante pericyclische Reaktionsschritte hergestellt (Jung, M. E.; Choi, Y. M. J. Org. Chem. 1991, 56, 6729).';
  setSec(q, 0, syn('A. Synthese von Conicein', [
    G('Ed', '', 'OC1CN(' + Ph2CH + ')C1'),
    N('A', 'A', 'CS(=O)(=O)OC1CN(' + Ph2CH + ')C1', { explanation: 'MsCl mesyliert die OH-Gruppe → gute Abgangsgruppe für die spätere Eliminierung.' }),
    N('B', 'B', 'CS(=O)(=O)OC1CNC1', { caption: 'C_4H_9NSO_3', explanation: 'Hydrogenolyse (H_2, Pd(OH)_2) spaltet die Benzhydryl-Gruppe vom Stickstoff ab.' }),
    N('C', 'C', 'C=CCCC(=O)N1CC(OS(C)(=O)=O)C1', { caption: 'C_9H_15NSO_4', explanation: 'N-Acylierung mit Pent-4-enoylchlorid.' }),
    N('D', 'D', 'C=CCCC(=O)N1C=CC1', { caption: 'C_8H_11NO, cyclisch', explanation: 'KO^tBu als starke, sterisch gehinderte Base: E2-Eliminierung von MsOH → 2-Azetin.' }),
    N('E', 'E', 'C=CCCC(=O)N=CC=C', { caption: 'acyclisch', explanation: 'Thermische 4π-elektrocyclische Ringöffnung (conrotatorisch) des Azetins → N-Acyl-1-azadien.' }),
    G('F', 'F', 'O=C1CCC2CCC=CN12', { explanation: 'Intramolekulare [4+2]-Cycloaddition (Diels-Alder mit inversem Elektronenbedarf/Aza-Diels-Alder).' }),
    N('G', 'G', 'C1CCN2CCCC2C1', { caption: 'Conicein', explanation: 'H_2/Pd hydriert die C=C-Bindung, LiAlH_4 reduziert das Lactam zum Amin (Indolizidin).' })
  ], [
    E('Ed', 'A', 'MsCl'),
    E('A', 'B', 'H_2, Pd(OH)_2'),
    E('B', 'C', 'CH_2=CH-CH_2CH_2-COCl'),
    E('C', 'D', 'KO^tBu'),
    E('D', 'E', 'Δ', 'elektrocycl. Reaktion'),
    E('E', 'F', 'Δ'),
    E('F', 'G', '1. H_2 (Pd)', '2. LiAlH_4')
  ], {
    hints: ['Abkürzungen: MsCl = Cl-SO_2-CH_3; ^-O^tBu = tert-Butanolat; Ph = Phenyl.']
  }));
  addSection(q, SA('Funktion von KO^tBu in C → D (5.4)', 'Schreiben Sie die konkrete Funktion von KO^tBu in der Reaktion C → D auf. Benennen Sie den Mechanismus.', 'Base — basen-induzierte Eliminierung nach E2-Kinetik.'), 0);
});

patch('bw46 bergamoten', () => {
  const q = Q('bw46-2020-bergamoten');
  q.intro = 'Bergamotene bilden eine Gruppe isomerer Verbindungen, die in verschiedenen Pflanzen, besonders in ätherischen Ölen, vorkommen. Hier geht es um die Synthese von β-trans-Bergamoten (Corey, E. J.; Desai, M. C. Tet. Lett. 1985, 26, 3535). Als Pheromon wirkt es verteidigend gegen den Angriff herbivorer Insekten, indem es natürliche Feinde dieser Insekten anlockt.';
  const tail = 'CC/C=C(\\C)CCC=C(C)C';
  const rest = q.sections.slice(1);
  q.sections = [q.sections[0]];
  setSec(q, 0, syn('B. Synthese von β-trans-Bergamoten', [
    G('Ed', 'Geranylacetat', 'CC(=O)' + tail),
    N('A', 'A', '[Li]CC(=O)' + tail, { explanation: 'LDA deprotoniert kinetisch die Methylgruppe des Methylketons → Lithium-Enolat.' }),
    N('B', 'B', 'OC(=O)CC(=O)' + tail, { explanation: 'Carboxylierung des Enolats mit CO_2 → β-Ketosäure.' }),
    N('C', 'C', 'OC(=O)CC(=C)' + tail, { explanation: 'Wittig-Olefinierung der Ketogruppe → exo-Methylen.' }),
    N('D', 'D', 'ClC(=O)CC(=C)' + tail, { explanation: 'SOCl_2 → Säurechlorid.' }),
    G('E', 'E', 'O=C=CC(=C)CCC=C(C)CCC=C(C)C'),
    N('F', 'F', 'C=C1CCC2C(=O)C1C2(C)CCC=C(C)C', { caption: '43 %',
      explanation: 'Intramolekulare [2+2]-Cycloaddition des Ketens mit der trisubstituierten C=C-Bindung → Bicyclo[3.1.1]heptanon (IR 1710 cm^{-1}).' }),
    N('G', 'G', 'CC(=CCCC1(C2CCC(=C)C1C2)C)C', { caption: 'β-trans-Bergamoten',
      explanation: 'Wolff-Kishner-Reduktion (Huang-Minlon-Variante mit KO^tBu/DMSO) entfernt die Ketogruppe.' })
  ], [
    E('Ed', 'A', '1äq. LDA', '(THF)'),
    E('A', 'B', 'CO_2'),
    E('B', 'C', 'Ph_3P=CH_2', '83 %'),
    E('C', 'D', 'SOCl_2', '40 %'),
    E('D', 'E', 'Aminbase', 'in Toluen'),
    E('E', 'F', 'Cycloaddition'),
    E('F', 'G', 'NH_2-NH_2, KO^tBu', 'in DMSO')
  ], {
    hints: [
      'Im Schritt E nach F findet eine [2+2]-Cycloaddition mit den π-Elektronen des Ketens und einer C=C-Doppelbindung statt. Dabei entsteht ein Derivat des Bicyclus „Bicyclo[3.1.1]heptan".',
      'Substanz F zeigt eine intensive IR-Absorption bei 1710 cm^{-1}, Substanz G nicht.',
      'Abkürzungen: LDA = Lithiumdiisopropylamid, THF = Tetrahydrofuran, DMSO = Dimethylsulfoxid, tBu = tertiär-Butylgruppe, Ph = Phenyl.'
    ]
  }));
  q.sections.push(syn('Herstellung des Ylids (Reaktionen 1 und 2)', [
    G('P0', '', 'P(c1ccccc1)(c1ccccc1)c1ccccc1'),
    G('P1', '', 'C[P+](c1ccccc1)(c1ccccc1)c1ccccc1.[Br-]'),
    G('P2', '', 'C=P(c1ccccc1)(c1ccccc1)c1ccccc1')
  ], [
    E('P0', 'P1', 'a', '1'),
    E('P1', 'P2', 'b', '2')
  ]));
  q.sections.push(...rest);
  addSection(q, SA('Reagenzien a und b (5.6)', 'Schlagen Sie ein Reagenz a und ein Reagenz b für Reaktion 1 bzw. 2 vor.', 'a: CH_3Br; b: NaH oder n-BuLi (starke, schwach nucleophile Base).'), 1);
  addSection(q, SA('Mechanismus von Reaktion 1 (5.7)', 'Nach welchem Reaktionsmechanismus verläuft Reaktion 1?', 'S_N2'), 2);
});

patch('bw46 aspidospermin', () => {
  const q = Q('bw46-2020-aspidospermin');
  q.intro = 'In dieser Aufgabe geht es um die Synthese von Aspidospermin, einem monoterpenoiden Indolalkaloid (Stork, G.; Dolfini, J. E. J. Am. Chem. Soc. 1963, 85, 2872). Aspidospermin ist eines von über 100 bekannten Aspidosperma-Alkaloiden und wurde erstmalig aus dem in Chile beheimateten Quebrachobaum isoliert.';
  const pyr = 'Pyrrolidin';
  const sec = syn('C. Synthese von Aspidospermin', [
    N('BU', 'Butanal', 'CCCC=O'),
    N('A', 'A', 'CCC=CN1CCCC1', { caption: 'E+Z-Isomere', explanation: 'Butanal + Pyrrolidin → Enamin (Stork), E/Z-Gemisch.' }),
    N('B', 'B', 'CCC(C=O)CCC(=O)OCC', { caption: 'C_9H_16O_3', explanation: 'Michael-Addition des Enamins an Acrylsäureethylester, dann Hydrolyse des Iminiums.' }),
    N('C', 'C', 'CCC(=CN1CCCC1)CCC(=O)OCC', { explanation: 'Erneute Enaminbildung am Aldehyd.' }),
    N('D', 'D', 'C=CC(C)=O', { name: 'Methylvinylketon' }),
    G('RB', '', 'CCOC(=O)CCC1(CC)C=CC(=O)CC1', { explanation: 'Robinson-Anellierung: Michael-Addition an Methylvinylketon, dann Aldolkondensation.' }),
    N('E', 'E', 'NC(=O)CCC1(CC)C=CC2(CC1)OCCO2', { explanation: 'Ketal-Schutz des Enons, Ester → Amid (NH_3).' }),
    N('F', 'F', 'NCCCC1(CC)C=CC(=O)CC1', { caption: 'C_11H_19NO', explanation: 'LiAlH_4 reduziert das Amid zum Amin; H_2O/H^+ spaltet das Ketal.' }),
    N('Gc', 'G', 'CCC12CCC(=O)CC1NCCC2', { caption: 'C_11H_19NO', explanation: 'Intramolekulare Aza-Michael-Addition des Amins an das Enon (Cyclisierung).' }),
    N('H', 'H', 'CCC12CCC(=O)CC1N(C(=O)CCl)CCC2', { explanation: 'N-Acylierung mit Chloracetylchlorid.' }),
    N('I', 'I', 'CCC12CCC(=O)C3CC(=O)N(CCC1)C32', { caption: 'C_13H_19NO_2', explanation: 'KO^tBu bildet das Enolat; intramolekulare Alkylierung → Lactam-Fünfring.' }),
    N('J', 'J', 'CCC12CCC(=O)C3CCN(CCC1)C32', { explanation: 'Ketal-Schutz, LiAlH_4 reduziert das Lactam, Entschützen.' }),
    N('Z', 'Z', 'COc1ccccc1NN', { caption: '2-Methoxyphenylhydrazin' }),
    N('K', 'K', 'CCC12CCC(=NNc4ccccc4OC)C3CCN(CCC1)C32', { explanation: 'Hydrazonbildung: A_N des Hydrazins an das Keton, dann Eliminierung von H_2O. Danach Fischer-Indolsynthese.' }),
    G('ASP', 'Aspidospermin', 'CC[C@]12CCCN3[C@H]1[C@@]4(CC3)[C@@H](CC2)N(C5=C4C=CC=C5OC)C(=O)C')
  ], [
    E('BU', 'A', pyr),
    E('A', 'B', '1. CH_2=CH-CO_2Et', '2. H_2O / H^+'),
    E('B', 'C', pyr),
    E(['C', 'D'], 'RB', '1. D', '2. HOAc, T (Cyclisierung)'),
    E('RB', 'E', '1. (CH_2OH)_2 / H^+', '2. NH_3'),
    E('E', 'F', '1. LiAlH_4', '2. H_2O / H^+'),
    E('F', 'Gc', 'Base', '(Cyclisierung)'),
    E('Gc', 'H', 'ClCH_2COCl'),
    E('H', 'I', 'KO^tBu, Benzen', '(Cyclisierung)'),
    E('I', 'J', '1. (CH_2OH)_2 / H^+', '2. LiAlH_4; 3. H_2O / H^+'),
    E(['J', 'Z'], 'K', '+ Z'),
    E('K', 'ASP', '(mehrere Stufen)')
  ], {
    body: 'Der Schritt C → Cyclohexenon ist eine Robinson-Anellierung.',
    hints: ['Abkürzungen: HOAc = Essigsäure, tBu = tertiär-Butylgruppe.']
  });
  q.sections.unshift(sec);
  addSection(q, SA('Konfiguration in Aspidospermin (5.13)', 'Bestimmen Sie die absoluten Konfigurationen der stereogenen Zentren 2–4 im Aspidospermin (Nummerierung wie in der Angabe).', '2 = R; 3 = R; 4 = R'));
  const old = q.sections.findIndex(s => /Konfiguration der stereogenen Zentren/.test(s.title || ''));
  if (old >= 0) q.sections.splice(old, 1);
});

patch('bw46 prostaglandin', () => {
  const q = Q('bw46-2020-prostaglandin-fragment');
  q.intro = 'Prostaglandine sind Derivate des Eicosans und wirken im tierischen und menschlichen Organismus als Gewebshormone. Hier geht es um die Synthese eines speziellen Prostaglandin-Fragments (Corey, E. J.; Ensley, H. E. J. Am. Chem. Soc. 1975, 97, 6908).';
  const Bn = 'COCc9ccccc9';
  q.sections[0] = syn('D. Synthese eines Prostaglandin-Fragments', [
    G('Ed', '', 'OC1(C(=O)OC)CC2C=CC1C2' + Bn, { caption: 'COOR' }),
    N('A', 'A', 'OCC1(O)CC2C=CC1C2' + Bn, { explanation: 'LiAlH_4 reduziert den Ester zum primären Alkohol (A_N des Hydrids) → 1,2-Diol.' }),
    N('B', 'B', 'O=C1CC2C=CC1C2' + Bn, { explanation: 'NaIO_4 spaltet das 1,2-Diol → Keton (+ Methanal).' }),
    G('P', '', 'OC(=O)CC1C=CC(O)C1' + Bn),
    N('C', 'C', 'O=C1CC2C(O1)C(I)C(O)C2' + Bn, { explanation: 'Iodlactonisierung: NaHCO_3 deprotoniert die Säure; das Carboxylat öffnet das Iodonium-Ion anti → Iodlacton (Corey-Lacton-Vorstufe).' })
  ], [
    E('Ed', 'A', 'LiAlH_4'),
    E('A', 'B', 'NaIO_4'),
    E('B', 'P', '(mehrere Stufen)'),
    E('P', 'C', 'I_2 / KI', 'NaHCO_3')
  ], {
    body: 'Das Iodlacton C wird in mehreren Stufen zum Prostaglandin weiter umgesetzt.',
    hints: ['Bn: Benzyl']
  });
  const mech = q.sections.findIndex(s => /5\.17/.test(s.title || ''));
  if (mech >= 0) {
    q.sections[mech].title = 'Mechanismus zu A (5.17)';
    q.sections[mech].prompt = 'Benennen Sie den Mechanismus, nach dem die Reaktion zu Substanz A verläuft, und nennen Sie die Funktion, die LiAlH_4 hier hat.';
    q.sections[mech].expected_answer = 'Reduktion des Esters; Mechanismus A_N (nucleophile Addition des Hydrids).';
  }
});

patch('bw46 pericyclic', () => {
  const q = Q('bw46-2020-pericyclic-da');
  q.intro = 'Denken Sie bei den folgenden Aufgaben an die Woodward-Hoffmann-Regeln und die Begriffe kon- und disrotatorisch.';
  q.sections[0] = syn('5.18: Fumarsäure + Diene', [
    G('D1', '', 'C1=CCC=C1'),
    G('FA', '', 'OC(=O)/C=C/C(=O)O'),
    N('A', 'A', 'C1[C@@H]2C=C[C@H]1[C@H]([C@@H]2C(=O)O)C(=O)O', { explanation: 'Diels-Alder: die trans-Anordnung der COOH-Gruppen der Fumarsäure bleibt erhalten (suprafacial) → trans-Norbornendicarbonsäure (racemisch).' }),
    G('D2', '', 'C/C=C/C=C/C'),
    N('B', 'B', 'C[C@H]1C=C[C@@H](C)[C@H](C(=O)O)[C@H]1C(=O)O', { explanation: 'Aus dem (E,E)-Dien werden beide Methylgruppen cis; die COOH-Gruppen bleiben trans (racemisch).' })
  ], [
    E(['FA', 'D1'], 'A'),
    E(['FA', 'D2'], 'B')
  ]);
  q.sections[1] = syn('5.19: Photoenol, Elektrocyclisierung und Diels-Alder', [
    G('BP', '', 'O=C(c1ccccc1)c1ccccc1Cc1ccccc1'),
    G('En', '', 'OC(=C1C=CC=CC1=Cc1ccccc1)c1ccccc1'),
    N('A', 'A', 'O[C@]1(c2ccccc2)[C@H](c2ccccc2)c2ccccc21', { explanation: 'Thermisch: 4π-Elektrocyclisierung conrotatorisch → Phenylgruppen trans.' }),
    N('B', 'B', 'O[C@]1(c2ccccc2)[C@@H](c2ccccc2)c2ccccc21', { explanation: 'Photochemisch: disrotatorisch → Phenylgruppen cis.' }),
    N('C', 'C', 'O=C1OC(=O)C2C1C(O)(c1ccccc1)c1ccccc1C2c1ccccc1', { explanation: 'Diels-Alder mit Maleinsäureanhydrid (endo, suprafacial) → Tetrahydronaphthalin-Anhydrid.' })
  ], [
    E('BP', 'En', 'Licht'),
    E('En', 'A', 'Hitze'),
    E('En', 'B', 'Licht'),
    E('En', 'C', 'Maleinsäureanhydrid')
  ]);
});
