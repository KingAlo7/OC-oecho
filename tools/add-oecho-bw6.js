/**
 * BW batch 6 — BW45 (2019) Aufgabe 2: Organische Chemie und Musik
 *   A.1 ABA — Abscisinsäure (Take a Chance on Me)
 *   B.  Twistan-Synthese (Let's twist again)
 */
const fs = require('fs');
const path = require('path');
const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const data = JSON.parse(fs.readFileSync(QFILE, 'utf8'));
const existing = new Set(data.map(q => q.id));

const ENTRIES = [
  /* ════════════════════════════════════════════════════════════════════
     A. Abscisinsäure (ABA) — 87 bp gesamtes Kapitel
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw45-2019-abscisinsaeure',
    category: 'Mehrstufige Synthesen',
    name: 'Abscisinsäure (ABA) — Pflanzenhormon-Synthese (BW 2019)',
    difficulty: 'D',
    source: 'ÖChO Bundeswettbewerb 2019 (BW 45), Aufgabe 2 A',
    intro: 'Abscisinsäure (ABA) ist ein wichtiges Pflanzenhormon. Die Synthese kombiniert eine Robinson-Anellierung (A + B → C), Ketal-Schutz (E → F), DIBAL-H-Reduktion zum Aldehyd (F → G), Reformatsky-artige Zn-Kopplung (G → H), mCPBA-Epoxidierung (H → I), Hydrolyse (I → J, C_{15}H_{20}O_4) und schließlich Tautomerie/Eliminierung mit NaOH zur fertigen Abscisinsäure.',
    sections: [
      {
        type: 'synthesis',
        title: 'Robinson-Anellierungs-Sequenz (A,B → C/D → E)',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: false,
              name: 'Acetessigsäureethylester (Acetoacetat)',
              smiles: 'CC(=O)CC(=O)OCC',
              note: '1H-NMR: 2,3 (CH_3-CO), 3,4 (CH_2 zwischen den C=O), 4,1 (OCH_2), 1,2 (CH_3 vom Ester). 13C: 200 (Keton C=O), 168 (Ester C=O).',
              explanation: 'In CD_3CN/D_2O wird die acide α-CH_2-Position H/D-ausgetauscht; das Enol-Tautomer ist nachweisbar.' },
            { id: 'B', label: 'B', given: false,
              name: 'Mesityloxid (4-Methyl-3-penten-2-on)',
              smiles: 'CC(=O)/C=C(C)/C',
              explanation: 'α,β-ungesättigtes Keton — der Michael-Akzeptor für die Robinson-Anellierung.' },
            { id: 'D', label: 'D', given: false,
              name: 'Michael-Addukt (offenkettig)',
              smiles: 'CCOC(=O)C(C(C)=O)CC(C)(C)C(C)=O',
              explanation: 'KOH (kat.) deprotoniert die Acetessigsäure-α-Position → Enolat. Konjugate (Michael)-Addition an Mesityloxid → 1,5-Diketon-Ester (offenkettig).' },
            { id: 'C', label: 'C', given: false,
              name: 'Robinson-Anellierungs-Produkt (Cyclohexenon)',
              smiles: 'CCOC(=O)C1C(=O)CC(C)(C)C(=C1)C',
              explanation: 'Basenkatalysierte intramolekulare Aldolkondensation (–H_2O): das verbleibende α-Carbonyl-H attackiert das andere Carbonyl → 6-Ring → α,β-ungesättigtes Cyclohexenon mit gem-Dimethyl und CO_2Et.' },
            { id: 'E', label: 'E', given: true,
              name: 'Isomerisiertes Cyclohexenon (gegeben)',
              smiles: 'CCOC(=O)C1=C(C)CC(=O)CC1(C)C',
              note: 'IR: 1715 cm^{-1} (C=O Ester) + ein α,β-ungesättigtes Keton. Drei isomere E/E\'/E\'\' werden in Aufgabe 2.9 verglichen.',
              explanation: 'Tautomerie/Isomerisierung von C unter den Reaktionsbedingungen → konjugierte Form mit C=C-C(=O) in direkter Konjugation zum Ester.' }
          ],
          edges: [
            { from: ['A','B'], to: 'D', reagent_above: 'KOH (kat.)', reagent_below: 'EtOH — Michael' },
            { from: ['D'],     to: 'C', reagent_above: 'KOH (kat.)', reagent_below: 'Aldol-Kondensation (–H_2O)' },
            { from: ['C'],     to: 'E', reagent_above: '(Isomerisierung)', reagent_below: 'Tautomerie' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Schutzgruppe + Reduktion + Reformatsky + Epoxidierung (E → J)',
        scheme: {
          nodes: [
            { id: 'F', label: 'F', given: false,
              name: 'Ketal-geschütztes E',
              smiles: 'CCOC(=O)C1=C(C)CC2(OCCO2)CC1(C)C',
              explanation: 'H_2SO_4 + Ethylenglycol (HOCH_2CH_2OH) schützt das Keton als 1,3-Dioxolan — verhindert in der nächsten Stufe Nebenreaktionen am Keton.' },
            { id: 'G', label: 'G', given: false,
              name: 'Aldehyd (DIBAL-H-Reduktion)',
              smiles: 'O=CC1=C(C)CC2(OCCO2)CC1(C)C',
              explanation: 'DIBAL-H in Toluol reduziert den Ester selektiv zum Aldehyd (eine H^-Übertragung, dann Hydrolyse — bei tiefer T stopt die Reduktion auf der Aldehyd-Stufe).' },
            { id: 'H', label: 'H', given: false,
              name: 'Reformatsky/Zn-Kopplungsprodukt (α-Pyron-Lacton)',
              smiles: 'OC(C1=C(C)CC2(OCCO2)CC1(C)C)CC(=O)OC',
              note: 'Bromester-Reagenz: CH_3-O-C(=O)-CBr=C(CH_3)_2 — Zn insertiert in C-Br → Zink-Reformatsky-Reagenz, das den Aldehyd-Carbonyl-C nukleophil angreift → β-Hydroxy-Ester, lactonisiert zum α,β-ungesättigten Lacton.',
              explanation: 'Zn / 2-Brom-3-methyl-2-butensäuremethylester: Reformatsky-artige Carbonyl-Addition liefert ein α,β-ungesättigtes δ-Lacton an der Aldehyd-Position.' },
            { id: 'I', label: 'I', given: false,
              name: 'Epoxid (mCPBA-Oxidation)',
              smiles: 'OC(C1=C(C)CC2(OCCO2)CC1(C)C)CC(=O)OC',
              note: 'mCPBA = meta-Chlorperbenzoesäure; Epoxidiert das elektronenreichste Alken (das im Ketal-geschützten Cyclohexen) selektiv.',
              explanation: 'mCPBA überträgt ein O-Atom auf die ungeschützte C=C — Bildung eines Epoxids. Der Ketal-Schutz erhält das Keton vor Baeyer-Villiger-Oxidation.' },
            { id: 'J', label: 'J (C_{15}H_{20}O_4)', given: false,
              name: 'ABA-Vorläufer mit Keton + Hydroxy + Epoxid',
              smiles: 'OC1C(C)=CC(=O)CC1(C)C',
              note: 'Summenformel C_{15}H_{20}O_4. Strukturell sehr ähnlich zur Abscisinsäure, nur dass das letzte ungesättigte Dien-Carbonsäure-Ende noch nicht freigelegt ist.',
              explanation: 'H_3O^+ hydrolysiert das Ketal (= Vollacetal → Keton zurück) — Aufdeckung des Cyclohexenons mit α-Hydroxy-Gruppe; gleichzeitig öffnet sich das Epoxid.' }
          ],
          edges: [
            { from: ['F'], to: 'G', reagent_above: 'DIBAL-H',     reagent_below: 'Toluol, tiefe T' },
            { from: ['G'], to: 'H', reagent_above: 'Zn / BrC(CH_3)=C(CH_3)CO_2Me', reagent_below: 'Reformatsky' },
            { from: ['H'], to: 'I', reagent_above: 'mCPBA',       reagent_below: 'Epoxidierung' },
            { from: ['I'], to: 'J', reagent_above: 'H_3O^+',       reagent_below: 'Ketal-Hydrolyse' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Letzter Schritt: J → Abscisinsäure (NaOH)',
        scheme: {
          nodes: [
            { id: 'ABA', label: 'Abscisinsäure', given: false,
              name: 'Abscisinsäure (S, 2Z, 3E)',
              smiles: 'O=C1C=C(C)C[C@]1(O)/C=C(\\C)/C=C/C(=O)O',
              note: 'Stereodeskriptoren: S (Stereozentrum am C mit OH), 2Z, 3E (Geometrie der Diensäure). 2 Enantiomere (R/S), 2^3 = 8 Stereoisomere insgesamt.',
              explanation: 'NaOH öffnet das δ-Lacton und führt zur freien Carbonsäure. Tautomerie/Eliminierung etablieren das gekoppelte (2Z,3E)-Diensäure-System der Abscisinsäure.' }
          ],
          edges: [
            { from: ['J'], to: 'ABA', reagent_above: 'NaOH', reagent_below: 'Verseifung + Tautomerie' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Funktion der Ketal-Schutzgruppe (Aufgabe 2.6)',
        prompt: 'Welche zwei Reaktionen werden durch die Ketal-Schutzgruppe von E nach F im weiteren Reaktionsverlauf verhindert?',
        choices: [
          { id: 'a', label: 'A_N mit metallorganischer Verbindung am Keton (im Schritt G → H)', correct: true  },
          { id: 'b', label: 'Oxidation des Ketons zum Ester mit mCPBA (Baeyer-Villiger)',         correct: true  },
          { id: 'c', label: 'Eliminierung der OH-Gruppe',                                          correct: false },
          { id: 'd', label: 'Hydrierung des Alkens',                                               correct: false }
        ],
        explanation: 'Beide korrekten Antworten sind die im offiziellen Lösungsweg genannten: (1) Das Reformatsky-Reagenz (metallorganisch) würde sonst auch am Keton angreifen → unselektiv; (2) mCPBA würde am elektronenreichen Keton eine Baeyer-Villiger-Oxidation zum Ester durchführen — der Ketal-Schutz verhindert beide Nebenreaktionen.'
      },
      {
        type: 'short_answer',
        title: 'IR-Verschiebung der drei E-Isomeren (Aufgabe 2.9-2.10)',
        prompt: 'Warum absorbiert das α,β-ungesättigte Keton-Isomer von E bei niedrigerer Wellenzahl (1680 cm^{-1}) als das nicht-konjugierte (1715 cm^{-1})? Welche elektronischen Effekte erklären den Aldehyd bei 1730 cm^{-1}?',
        expected_answer: 'Konjugation (+M-Effekt) verschiebt C=O-Banden zu NIEDRIGEREN Wellenzahlen, da die π-Konjugation die effektive C=O-Bindungsordnung absenkt (weniger Doppelbindungscharakter → kleinere Kraftkonstante). Der Aldehyd absorbiert bei 1730 cm^{-1} höher, weil ihm im Vergleich zum Keton ein zweiter +I-stabilisierender Alkylrest fehlt — der Carbonyl-C ist somit elektrophiler und die C=O-Bindung etwas stärker (höhere Wellenzahl). Eine konjugationsbedingte Bandenverschiebung erfolgt durch den +M-Effekt zu niedrigeren Wellenzahlen (nicht zu höheren).'
      },
      {
        type: 'multiple_choice',
        title: 'Stereodeskriptoren von ABA',
        prompt: 'Wie viele Stereoisomere besitzt Abscisinsäure (gegeben die Konstitution mit drei stereogenen Elementen: ein C-Zentrum + zwei Doppelbindungen)?',
        choices: [
          { id: 'a', label: '2 Stereoisomere',                  correct: false },
          { id: 'b', label: '4 Stereoisomere',                  correct: false },
          { id: 'c', label: '8 Stereoisomere (2^3)',            correct: true  },
          { id: 'd', label: '16 Stereoisomere',                 correct: false }
        ],
        explanation: '2^3 = 8 Stereoisomere: 1 chirales Zentrum (R/S) × 2 Doppelbindungen (jeweils E/Z). Es existieren 4 Enantiomerenpaare = 8 Stereoisomere insgesamt. ABA wird im natürlichen System als (S, 2Z, 3E)-Form vorgefunden, aber 2 Enantiomere haben die identische Konstitution.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     B. Twistan-Synthese — "Let's twist again"
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw45-2019-twistan',
    category: 'Mehrstufige Synthesen',
    name: 'Twistan-Synthese — Käfig-Kohlenwasserstoff (BW 2019)',
    difficulty: 'E',
    source: 'ÖChO Bundeswettbewerb 2019 (BW 45), Aufgabe 2 B',
    intro: 'Twistan (Tricyclo[4.4.0.0^{3,8}]decan) ist ein hochsymmetrischer Käfig-Kohlenwasserstoff (C_2-Achse, Inversionszentrum). Aufbau ausgehend von 2-Methyl-bicyclo[2.2.1]hept-5-en-2-carbonsäure-ethylester: LiAlH_4-Reduktion → Mesylierung/Cyanierung → Hydrolyse → Iodolactonisierung → Dehalogenierung → Lacton-Reduktion → Mesyl-Mono-Schutz → CrO_3-Oxidation → intramolekulare Alkylierung mit NaH → Wolff-Kishner.',
    sections: [
      {
        type: 'synthesis',
        title: 'Funktionalisierung des Norbornen-Edukts',
        scheme: {
          nodes: [
            { id: 'Ed', label: 'Edukt', given: true,
              name: '2-Methyl-bicyclo[2.2.1]hept-5-en-2-carbonsäure-ethylester',
              smiles: 'CCOC(=O)C1(C)CC2CC1C=C2',
              explanation: 'Norbornen mit α-Methyl-Ester-Gruppe — Diels-Alder-Addukt von Methacrylsäureester an Cyclopentadien.' },
            { id: 'A', label: 'A', given: false,
              name: 'Norbornen-Methanol (C_9H_{14}O)',
              smiles: 'OCC1(C)CC2CC1C=C2',
              note: 'C_9H_{14}O. Reduktion mit LiAlH_4 vollständig zum primären Alkohol.',
              explanation: 'LiAlH_4 reduziert die Ester-Funktion via Aldehyd zum primären Alkohol.' },
            { id: 'B', label: 'B', given: false,
              name: 'Norbornen-Acetonitril',
              smiles: 'N#CCC1(C)CC2CC1C=C2',
              explanation: '1. MeSO_2Cl → Mesylat (gute Abgangsgruppe). 2. NaCN → S_N2-Verdrängung mit CN^- → Nitril. Übergangszustand: planar trigonal-bipyramidaler C mit NC^- und ^-OSO_2Me als axialen Liganden.' },
            { id: 'C', label: 'C', given: false,
              name: 'Norbornen-Essigsäure',
              smiles: 'OC(=O)CC1(C)CC2CC1C=C2',
              explanation: 'Saure Hydrolyse (H_3O^+) wandelt das Nitril zur Carbonsäure über die Amid-Stufe.' }
          ],
          edges: [
            { from: ['Ed'], to: 'A', reagent_above: 'LiAlH_4',                reagent_below: 'Ester → Alkohol' },
            { from: ['A'],  to: 'B', reagent_above: '1. MeSO_2Cl',            reagent_below: '2. NaCN (S_N2)' },
            { from: ['B'],  to: 'C', reagent_above: 'H_3O^+',                 reagent_below: 'Nitril → COOH' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Iodolactonisierung + Käfigaufbau',
        scheme: {
          nodes: [
            { id: 'D', label: 'D', given: false,
              name: 'Iod-γ-Lacton (cage)',
              smiles: 'IC1C2CC3CC1C(C)(C3)CC(=O)O2',
              explanation: 'I_2/KI + NaHCO_3 (mild basisch): Iodonium-Bildung an der C=C; intramolekulares Carboxylat öffnet das Iodonium anti → cis-fusioniertes Iod-Lacton mit transannularer Iod-Funktion.',
              related_reaction_id: 'halogenierung-alken' },
            { id: 'E', label: 'E', given: false,
              name: 'Lacton (deiodiert)',
              smiles: 'O=C1OC2CC3CC1C(C)(C3)CC2',
              note: '1 bp — Hydrierung entfernt nur das C-I, das Lacton bleibt erhalten.',
              explanation: 'H_2 / Pt mit NEt_3 (Base, neutralisiert HI) entfernt das Iod via Hydrogenolyse — –HI.' },
            { id: 'F', label: 'F', given: true,
              name: 'Diol (LiAlH_4-Reduktion des Lactons)',
              smiles: 'OCC1C2CC3CC1C(C)(C3)CC2O',
              explanation: 'LiAlH_4 reduziert das Lacton vollständig — zwei Hydrid-Übertragungen → primärer Alkohol + sekundärer Alkohol (Diol).' },
            { id: 'G', label: 'G', given: false,
              name: 'Mono-Mesylat (primäre OH selektiv)',
              smiles: 'OC1CC2CC3CC1C(C)(C3)COS(=O)(=O)C',
              note: '1,5 bp. Selektive Mono-Mesylierung der weniger gehinderten primären OH-Gruppe.',
              explanation: 'MeSO_2Cl + Pyridin (Base) reagiert mit der sterisch weniger gehinderten primären OH-Gruppe → Mono-Mesylat, sekundäre OH bleibt frei.' },
            { id: 'H', label: 'H', given: false,
              name: 'Keto-Mesylat (CrO_3-Oxidation)',
              smiles: 'O=C1CC2CC3CC1C(C)(C3)COS(=O)(=O)C',
              note: '1,5 bp.',
              explanation: 'CrO_3 (Jones-Reagenz) oxidiert die verbliebene sekundäre OH-Gruppe zum Keton.' },
            { id: 'I', label: 'I', given: false,
              name: 'Twistanon (intramolekulare Alkylierung)',
              smiles: 'O=C1C2CC3CC1C(C)(C3)CC2',
              note: '1,5 bp. Cage-Keton (Twistanon).',
              explanation: 'NaH / DMF deprotoniert das α-CH zum Keton → C-Carbanion, das das intramolekulare Mesylat (S_N2, -OMs^-) verdrängt → neuer C-C-Käfig-Ring. NaH ist hier eine Base.' },
            { id: 'T', label: 'Twistan', given: false,
              name: 'Twistan',
              smiles: 'C1C2CC3CC1C(C)(C3)CC2',
              note: 'C_2-Achse + Inversionszentrum.',
              explanation: 'Wolff-Kishner-Reduktion: NH_2-NH_2 + KOH (oder N_2H_4 / KOH) → Hydrazon → unter Erhitzen Zerfall mit Abspaltung von N_2 → CH_2-Käfig-Kohlenwasserstoff = Twistan.' }
          ],
          edges: [
            { from: ['C'], to: 'D', reagent_above: 'I_2 / NaHCO_3', reagent_below: 'Iodolactonisierung' },
            { from: ['D'], to: 'E', reagent_above: 'H_2 / Pt, NEt_3', reagent_below: '-HI' },
            { from: ['E'], to: 'F', reagent_above: 'LiAlH_4', reagent_below: 'a' },
            { from: ['F'], to: 'G', reagent_above: 'MeSO_2Cl, Py', reagent_below: 'sel. prim.' },
            { from: ['G'], to: 'H', reagent_above: 'CrO_3', reagent_below: '' },
            { from: ['H'], to: 'I', reagent_above: 'NaH', reagent_below: 'DMF — intramol. S_N2' },
            { from: ['I'], to: 'T', reagent_above: 'N_2H_4 / KOH', reagent_below: 'Wolff-Kishner (b)' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Funktion von NaH im Schritt H → I (Aufgabe 2.30)',
        prompt: 'Welche Funktion hat NaH bei der intramolekularen Alkylierung H → I?',
        choices: [
          { id: 'a', label: 'Oxidationsmittel',                                                          correct: false },
          { id: 'b', label: 'Reduktionsmittel',                                                          correct: false },
          { id: 'c', label: 'Base — deprotoniert α-CH zum Keton, das gebildete Enolat verdrängt OMs^-', correct: true  },
          { id: 'd', label: 'Schutzgruppe',                                                              correct: false }
        ],
        explanation: 'NaH ist eine starke, nicht-nukleophile Base (pK_a-H_2 ≈ 35). Es deprotoniert das acide α-CH zur Ketogruppe → Enolat-Carbanion → intramolekulare S_N2-Substitution am Mesyl-tragenden C → neuer C-C-Bindung schließt den dritten Ring des Twistanon-Gerüsts.'
      },
      {
        type: 'short_answer',
        title: 'Symmetrieelemente von Twistan (Aufgabe 2.31)',
        prompt: 'Welche Symmetrieelemente besitzt Twistan?',
        expected_answer: 'C_2-Achse (zweizählige Drehachse) und Inversionszentrum (i). Twistan gehört zur Punktgruppe C_2h beziehungsweise S_2 = C_i; die Kombination C_2 + i impliziert eine Spiegelebene σ_h senkrecht zur C_2-Achse (also Punktgruppe C_2h). Trotz der Käfigstruktur ist Twistan ACHIRAL aufgrund des Inversionszentrums.'
      },
      {
        type: 'multiple_choice',
        title: 'Wolff-Kishner-Mechanismus (Schritt b)',
        prompt: 'Welcher elementare Reaktionsschritt steht am Beginn der Wolff-Kishner-Reduktion?',
        choices: [
          { id: 'a', label: 'A_N — Hydrazin addiert nukleophil an den Carbonyl-C → Hydrazon',     correct: true  },
          { id: 'b', label: 'S_N2 am α-Kohlenstoff',                                                correct: false },
          { id: 'c', label: 'Elektrocyclische Ringöffnung',                                         correct: false },
          { id: 'd', label: 'Radikalische Addition',                                                correct: false }
        ],
        explanation: 'Schritt 1 ist klassische Carbonyl-Kondensation (A_N + –H_2O): H_2N-NH_2 addiert ans Keton, Halbaminal, dann Wasserabspaltung → Hydrazon (C=N-NH_2). Anschließend isomerisiert KOH zum Diazo, Wärme treibt N_2-Eliminierung → Carbanion → Protonierung → CH_2.'
      }
    ]
  }
];

let added = 0;
for (const e of ENTRIES) {
  if (existing.has(e.id)) { console.log('skip:', e.id); continue; }
  data.push(e); existing.add(e.id); added++;
  console.log('added:', e.id);
}
fs.writeFileSync(QFILE, JSON.stringify(data, null, 2) + '\n');
console.log('\nTotal entries:', data.length, '(+'+added+')');
