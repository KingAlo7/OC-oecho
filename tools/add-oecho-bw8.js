/**
 * BW batch 8 — BW43 (2017) Aufgabe 1: Bicyclische Stickstoff-Verbindungen
 *   A. Atropin (Tropin + Tropasäure)
 *   B. Ferruginin (komplexe Mehrstufen-Synthese)
 */
const fs = require('fs');
const path = require('path');
const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const data = JSON.parse(fs.readFileSync(QFILE, 'utf8'));
const existing = new Set(data.map(q => q.id));

const ENTRIES = [
  /* ════════════════════════════════════════════════════════════════════
     A. Atropin (60 bp gesamt für 1A+1B) — Tropin via 1,3-dipolar oder
        Robinson; Tropasäure via Grignard; Veresterung zu Atropin
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw43-2017-atropin',
    category: 'Mehrstufige Synthesen',
    name: 'Atropin — Tropin + Tropasäure (BW 2017)',
    difficulty: 'D',
    source: 'ÖChO Bundeswettbewerb 2017 (BW 43), Aufgabe 1 A',
    intro: 'Synthese von Atropin — einem Alkaloid aus Atropa belladonna (Tollkirsche) mit anticholinerger Wirkung. Drei Stränge: (1) Tropin via intramolekulare 1,3-dipolare Cycloaddition eines Allyl-Nitrons (klassisch nicht-Robinson-Variante); (2) Tropinon nach Robinson 1917 aus Butandial + Methylamin + Aceton (Mannich-Doppelkondensation); (3) Tropasäure aus Phenylessigsäureester via Grignard-Reformatsky-artige Addition an Formaldehyd. Schließlich Veresterung Tropasäure + Tropin → Atropin.',
    sections: [
      {
        type: 'synthesis',
        title: 'Strang 1: Tropin via 1,3-dipolare [3+2]-Cycloaddition (1.4)',
        scheme: {
          nodes: [
            { id: 'N1', label: 'Allyl-Nitron', given: true,
              name: '1-Allyl-pyrrolidin-N-oxid (Nitron)',
              smiles: 'C=CCC1CCCN1=O',
              note: 'Nitron = 1,3-Dipol mit N^+ und O^-; das pendant-Allyl ist intramolekulares Dipolarophil.',
              explanation: 'Edukt; das N+=O-Dipol-System und die Allyl-Doppelbindung sind intramolekular durch die Pyrrolidin-Kohlenstoffe verknüpft.' },
            { id: 'C', label: 'C', given: false,
              name: 'Bicyclisches Isoxazolidin',
              smiles: 'C1CC2CCC(O2)N1C3',
              note: '3 bp. Intramolekulare [3+2] des Nitrons mit dem Allyl-Alken → fused bicyclisches Isoxazolidin (N-O-Ring + Pyrrolidin).',
              explanation: 'Pericyclische [4+2]-artige (eigentlich [3+2]) Cycloaddition: Dipol (4π) + Dipolarophil (2π) → 5-Ring mit N und O.' },
            { id: 'D', label: 'D', given: false,
              name: 'N-Methylierter quartärer Ammoniumkomplex',
              smiles: 'C1CC2CCC(O2)[N+]1(C)C.[I-]',
              note: '2 bp. CH_3I quaternisiert das Stickstoff-Atom → quaternäres Ammoniumiodid.',
              explanation: 'SN2: das Methyliodid wird vom N-Lone-Pair angegriffen → R_3N^+-CH_3 mit I^- als Gegenion.' },
            { id: 'A', label: 'A = endo-Tropin', given: false,
              name: 'endo-3-Tropanol (Tropin)',
              smiles: 'CN1[C@H]2CC[C@@H]1C[C@H](O)C2',
              note: '1 bp. C_8H_{15}NO. endo-Isomer.',
              explanation: 'LiAlH_4 reduziert die N-O-Bindung des Isoxazolidins → Amino-Alkohol. Aufgrund der Stereochemie des Übergangszustands der Cycloaddition entsteht das endo-3-Hydroxytropan (endo-3-OH).' },
            { id: 'B', label: 'B = exo-Tropin (Ψ-Tropin)', given: false,
              name: 'exo-3-Tropanol (Ψ-Tropin)',
              smiles: 'CN1[C@H]2CC[C@@H]1C[C@@H](O)C2',
              note: '1 bp. C_8H_{15}NO. Diastereomer zu A (exo-OH).',
              explanation: 'Diastereomeres exo-Isomer mit OH auf der entgegengesetzten Seite des 6-Rings.' }
          ],
          edges: [
            { from: ['N1'], to: 'C', reagent_above: 'Δ',          reagent_below: 'intramol. [3+2]' },
            { from: ['C'],  to: 'D', reagent_above: 'CH_3I',      reagent_below: 'S_N2 am N' },
            { from: ['D'],  to: 'A', reagent_above: 'LiAlH_4',    reagent_below: '(endo)' },
            { from: ['D'],  to: 'B', reagent_above: 'LiAlH_4',    reagent_below: '(exo, Ψ-Tropin)' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Strang 2: Robinson-Tropinon-Synthese (1917)',
        scheme: {
          nodes: [
            { id: 'BD', label: 'Edukte', given: true,
              name: 'Butandial + Methylamin + Aceton',
              smiles: 'O=CCCC=O.NC.CC(=O)C',
              note: 'Robinson 1917 — die historische erste One-Pot-Synthese.',
              explanation: 'Triple-Mannich: Methylamin kondensiert mit beiden Aldehyd-Funktionen des Butandials zum Bis-Imin/Iminium; Aceton (Doppel-Enol) addiert zweimal an die beiden Iminium-Zentren → intramolekulare Ringschluss zum Tropinon-Gerüst.' },
            { id: 'TN', label: 'Tropinon', given: false,
              name: 'N-Methyl-8-azabicyclo[3.2.1]octan-3-on',
              smiles: 'O=C1C[C@H]2CC[C@@H](C1)N2C',
              explanation: 'Tropan-Gerüst mit Carbonyl in 3-Position; aus dem Mannich-getriebenen Cyclisierungsprozess.' },
            { id: 'A2', label: 'A/B', given: false,
              name: 'Tropin / Ψ-Tropin (Diastereomerengemisch)',
              smiles: 'CN1[C@H]2CC[C@@H]1C[C@H](O)C2',
              explanation: 'Zn/HI reduziert das Keton zum sekundären Alkohol → Tropin (endo) und Ψ-Tropin (exo) als Diastereomerengemisch.' }
          ],
          edges: [
            { from: ['BD'], to: 'TN', reagent_above: 'pH 5',     reagent_below: '3× Mannich' },
            { from: ['TN'], to: 'A2', reagent_above: 'Zn / HI',  reagent_below: 'Reduktion C=O → CHOH' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Strang 3: Tropasäure via Grignard-Addition',
        scheme: {
          nodes: [
            { id: 'E', label: 'E', given: false,
              name: '2-Brom-2-phenyl-essigsäureethylester',
              smiles: 'CCOC(=O)C(Br)c1ccccc1',
              note: '2 bp.',
              explanation: 'Edukt — α-Brom-Phenylacetat.' },
            { id: 'F', label: 'F', given: false,
              name: 'Grignard-Reagenz',
              smiles: 'CCOC(=O)C([Mg]Br)c1ccccc1',
              note: '1 bp. Insertion von Mg^0 in die C-Br-Bindung.',
              explanation: 'Mg insertiert in C-Br → Reformatsky-artiges Carbanion-Äquivalent.' },
            { id: 'G', label: 'G', given: false,
              name: '3-Hydroxy-2-phenyl-propansäure-ethylester',
              smiles: 'CCOC(=O)C(CO)c1ccccc1',
              note: 'C_{11}H_{14}O_3, 3 bp.',
              explanation: '1. H_2C=O (Formaldehyd) wird vom Carbanion nukleophil angegriffen (A_N am Carbonyl): das C^-OEt → Tetraeder-Alkoholat. 2. Wässrige Aufarbeitung → Hydroxymethyl-Carbonsäureester.' },
            { id: 'H', label: 'H = Tropasäure', given: false,
              name: '(R)-3-Hydroxy-2-phenyl-propansäure (Tropasäure)',
              smiles: 'OC(=O)[C@H](CO)c1ccccc1',
              note: '3 bp.',
              explanation: 'H^+/H_2O + Erwärmen verseift den Ester zur freien α-Hydroxymethyl-Phenylcarbonsäure = Tropasäure (in der Natur (R)-konfiguriert).' }
          ],
          edges: [
            { from: ['E'], to: 'F', reagent_above: 'Mg',           reagent_below: 'Ether/THF' },
            { from: ['F'], to: 'G', reagent_above: '1. H_2C=O',     reagent_below: '2. wässrige Aufarbeitung' },
            { from: ['G'], to: 'H', reagent_above: 'H^+/H_2O',      reagent_below: 'Δ — Verseifung' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Endkupplung: Atropin (I)',
        scheme: {
          nodes: [
            { id: 'AT', label: 'Atropin', given: false,
              name: 'Atropin (Tropin-Ester von Tropasäure)',
              smiles: 'CN1[C@H]2CC[C@@H]1C[C@H](OC(=O)C(CO)c1ccccc1)C2',
              note: '2 bp. X = H_2O (Nebenprodukt der Veresterung).',
              explanation: 'Veresterung: die OH-Gruppe von Tropin reagiert mit der COOH-Gruppe von Tropasäure unter H_2O-Abspaltung → Ester = Atropin.' }
          ],
          edges: [
            { from: ['H','A'], to: 'AT', reagent_above: 'H^+',  reagent_below: '-H_2O (= X)' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Mechanismus F → G (Aufgabe 1.2)',
        prompt: 'Welcher Reaktionsmechanismus liegt der Bildung von G aus F (Grignard + Formaldehyd) zugrunde?',
        choices: [
          { id: 'a', label: 'Nukleophile Addition an die Carbonyl-Gruppe (A_N)', correct: true  },
          { id: 'b', label: 'S_N1',                                              correct: false },
          { id: 'c', label: 'Eliminierung',                                      correct: false },
          { id: 'd', label: 'Radikalisch',                                       correct: false }
        ],
        explanation: 'Das C-Mg-Carbanion ist hoch-nukleophil und greift den elektrophilen Carbonyl-C des Formaldehyds an (A_N). Die C=O-π-Bindung bricht auf, das O wird zum Alkoholat. Bei wässriger Aufarbeitung protoniert das Alkoholat zum primären Alkohol.'
      },
      {
        type: 'multiple_choice',
        title: 'Reaktionstyp 1,3-dipolare Cycloaddition (Aufgabe 1.4)',
        prompt: 'Wie wird die Bildung von C aus dem Allyl-Nitron klassifiziert?',
        choices: [
          { id: 'a', label: 'Pericyclische [3+2]-Cycloaddition (Dipol + Dipolarophil)', correct: true  },
          { id: 'b', label: 'Diels-Alder ([4+2]) mit dem Stickstoff als Dien',           correct: false },
          { id: 'c', label: 'S_E am Aromaten',                                            correct: false },
          { id: 'd', label: 'Radikalische Addition',                                      correct: false }
        ],
        explanation: 'Das Nitron (4π im N^+=O-Allyl-Anion-System, ein 1,3-Dipol) reagiert mit dem Allyl-Alken (Dipolarophil, 2π) in einer konzertierten [3+2]-Cycloaddition → 5-Ring-Isoxazolidin. Diese pericyclische Reaktion ist von Huisgen entwickelt und ist Vorläufer zur „Click-Chemie".'
      },
      {
        type: 'short_answer',
        title: 'Diastereomerie A vs B (Aufgabe 1.3)',
        prompt: 'In welchem stereochemischen Verhältnis stehen A (Tropin) und B (Ψ-Tropin) zueinander?',
        expected_answer: 'Sie sind Diastereomere (Exo-Endo-Isomere). Konkret unterscheiden sie sich in der Stereochemie der OH-Gruppe am 3-C des Tropan-Gerüsts: A = endo-OH (Tropin), B = exo-OH (Ψ-Tropin). Da das Tropan-Gerüst chiral, aber spiegelsymmetrisch ist, ist jedes Isomer für sich achiral (es gibt eine interne Spiegelebene).'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     B. Ferruginin (1B) — Übersicht
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw43-2017-ferruginin',
    category: 'Mehrstufige Synthesen',
    name: 'Ferruginin — Tropan-Alkaloid (BW 2017)',
    difficulty: 'E',
    source: 'ÖChO Bundeswettbewerb 2017 (BW 43), Aufgabe 1 B',
    intro: 'Synthese des Tropan-Alkaloids Ferruginin (8-Methyl-8-azabicyclo[3.2.1]oct-2-en-3-yl-methylketon) aus Cyclopentanon. 12 Stufen: Baeyer-Villiger-Ringerweiterung (A → B, δ-Valerolacton), Mesyl-Aktivierung + α-Alkylierung an Prolin-Enolat (C → D), Hydrogenolyse / Benzyl-Schutz, Oxidation zur Ketosäure, Decarboxylierung mit (COCl)_2 / Δ zum Cbz-Tropan-Keton, OsO_4/NaIO_4-Dihydroxylierung-Spaltung, TMSI-Cbz-Entfernung zu Ferruginin (C_9H_{13}NO), N-Methylierung via Eschweiler-Clarke.',
    sections: [
      {
        type: 'synthesis',
        title: 'Schlüssel-Schritte (kompakte Übersicht)',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: true,
              name: 'Cyclopentanon',
              smiles: 'O=C1CCCC1',
              note: '1 bp.',
              explanation: 'Edukt — einfaches 5-Ring-Keton.' },
            { id: 'B', label: 'B', given: false,
              name: 'δ-Valerolacton-Derivat (Baeyer-Villiger)',
              smiles: 'O=C1OCCCC1',
              note: '2 bp. Baeyer-Villiger: mCPBA insertiert ein O-Atom zwischen Carbonyl-C und α-C.',
              explanation: 'mCPBA überträgt ein O zwischen den C=O- und C(H)_2-Position → 6-Ring-Lacton (Ester-Erweiterung).' },
            { id: 'H', label: 'H', given: false,
              name: 'Bicyclisches Cbz-Tropan-Keton mit Isopropenyl',
              smiles: 'O=C1C2CCC(N2C(=O)OCc3ccccc3)CC1C(=C)C',
              note: '3 bp. Nach (COCl)_2/Δ-Cyclisierung und nachgeschalteter Aldol-Eliminierung — vereinfacht dargestellt.',
              explanation: 'Schlüssel-Cyclisierung: das Ketosäure-Säurechlorid (COCl)_2 cyclisiert intramolekular auf das gegenüberliegende α-CH zum Bicyclo[3.2.1]-Tropan-Skelett.' },
            { id: 'I', label: 'I', given: false,
              name: 'Cbz-Tropan-Keton mit Methylketon (statt Isopropenyl)',
              smiles: 'O=C(C)C1=CC2CCC(N2C(=O)OCc3ccccc3)C1',
              note: '3 bp.',
              explanation: 'OsO_4 dihydroxyliert die exocyclische C=CH_2-Doppelbindung → cis-Diol; NaIO_4 spaltet das Diol oxidativ → Methylketon + Formaldehyd (X = HCHO).' },
            { id: 'J', label: 'J = Ferruginin', given: false,
              name: 'Ferruginin (NH-bicyclisches Methylketon)',
              smiles: 'O=C(C)C1=CC2CCC(N2)C1',
              note: '2,5 bp. C_9H_{13}NO. Sek. Amin (Cbz weg).',
              explanation: 'TMSI in MeCN entfernt selektiv die Cbz-Schutzgruppe (Carbamat → Carbamat-Trimethylsilylester → Hydrolyse) → freies sekundäres Amin = Ferruginin.' },
            { id: 'L', label: 'L', given: false,
              name: 'N-Methyl-Ferruginin (Eschweiler-Clarke)',
              smiles: 'O=C(C)C1=CC2CCC(N2C)C1',
              note: '2,5 bp.',
              explanation: 'CH_2O + NaBH_3CN: reduktive Methylierung des sek. Amins (Eschweiler-Clarke-artig) → N-CH_3.' }
          ],
          edges: [
            { from: ['A'], to: 'B', reagent_above: 'mCPBA',          reagent_below: 'Baeyer-Villiger' },
            { from: ['B'], to: 'H', reagent_above: '(viele Stufen)',  reagent_below: 'C → D → E → F → G → H' },
            { from: ['H'], to: 'I', reagent_above: '1. OsO_4',        reagent_below: '2. NaIO_4 (-CH_2O)' },
            { from: ['I'], to: 'J', reagent_above: 'TMSI',            reagent_below: 'MeCN — Cbz-Entfernung' },
            { from: ['J'], to: 'L', reagent_above: 'CH_2O / NaBH_3CN', reagent_below: 'Reduktive Methylierung' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Baeyer-Villiger A → B',
        prompt: 'Welche Verschiebung wird bei der Baeyer-Villiger-Oxidation zwischen Carbonyl-C und α-C eingeschoben?',
        choices: [
          { id: 'a', label: 'Ein O-Atom (Ester-/Lacton-Bildung)',         correct: true  },
          { id: 'b', label: 'Ein N-Atom (Lactam-Bildung)',                correct: false },
          { id: 'c', label: 'Eine C=C-Doppelbindung',                     correct: false },
          { id: 'd', label: 'Eine OH-Gruppe',                             correct: false }
        ],
        explanation: 'Baeyer-Villiger-Oxidation: mCPBA überträgt ein O auf das Carbonyl-C → Criegee-Intermediat (tetraedrisch mit -O-O-Ar) → 1,2-Verschiebung des α-Restes von C nach O → Ester (lineares) oder Lacton (cyclisches Edukt) mit O zwischen den ehemaligen C-C-Bindungen.'
      },
      {
        type: 'short_answer',
        title: 'OsO_4 + NaIO_4 als „Schnitt-Sequenz" (H → I)',
        prompt: 'Wie wirken OsO_4 und NaIO_4 zusammen, um eine C=C-Doppelbindung in zwei Carbonyl-Gruppen umzuwandeln?',
        expected_answer: 'OsO_4 reagiert konzertiert mit der Doppelbindung in einer [3+2]-Cycloaddition → cyclisches Os(VI)-Diester → Hydrolyse → cis-Diol (syn-Dihydroxylierung). NaIO_4 spaltet anschließend das vicinale Diol oxidativ via cyclisches Periodester-Intermediat → zwei Carbonyl-Verbindungen (Aldehyd/Keton). Aus einer terminalen =CH_2-Gruppe entsteht so Formaldehyd (X) + ein Methylketon. Die Gesamtsequenz ist das katalytische Äquivalent einer milden Ozonolyse.'
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
