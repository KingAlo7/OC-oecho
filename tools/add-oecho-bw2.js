/**
 * BW batch 2 — BW49 (2023) organic syntheses: Methylorange,
 * Ibuprofen, Benzocain, Lidocain, Porphyrin electrochemistry.
 */
const fs = require('fs');
const path = require('path');
const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const data = JSON.parse(fs.readFileSync(QFILE, 'utf8'));
const existing = new Set(data.map(q => q.id));

const ENTRIES = [
  /* ════════════════════════════════════════════════════════════════════
     BW 49 (2023) — Aufgabe 1.10: Methylorange via Azokupplung
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw49-2023-methylorange',
    category: 'Mehrstufige Synthesen',
    name: 'Methylorange (Azokupplung) — BW 2023',
    difficulty: 'B',
    source: 'ÖChO Bundeswettbewerb 2023 (BW 49), Aufgabe 1.10',
    intro: 'Methylorange ist ein Azofarbstoff, hergestellt durch Azokupplung: Sulfanilsäure wird mit NaNO_2/HCl diazotiert; das resultierende Aryldiazonium-Salz greift N,N-Dimethylanilin elektrophil para zur Aminogruppe an.',
    sections: [
      {
        type: 'synthesis',
        title: 'Azokupplung',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: true, name: 'Sulfanilsäure (4-Aminobenzolsulfonsäure)',
              smiles: 'Nc1ccc(S(=O)(=O)O)cc1',
              explanation: 'Edukt 1: aromatisches Amin.' },
            { id: 'B', label: 'B', given: true, name: 'N,N-Dimethylanilin',
              smiles: 'CN(C)c1ccccc1',
              explanation: 'Edukt 2: aktivierter Aromat — N(CH_3)_2 ist stark elektronenschiebend und dirigiert para.' },
            { id: 'D', label: 'D', given: false, name: 'Diazonium-Zwischenstufe',
              smiles: '[N+](#N)c1ccc(S(=O)(=O)O)cc1',
              explanation: 'NaNO_2 + HCl bei 0°C: Diazotierung der Aminogruppe → Aryldiazonium-Salz (Elektrophil).' },
            { id: 'M', label: 'Methylorange', given: false, name: 'Methylorange (Na-Salz)',
              smiles: 'CN(C)c1ccc(/N=N/c2ccc(S(=O)(=O)[O-])cc2)cc1.[Na+]',
              explanation: 'SE: Das Diazonium-Kation greift elektrophil an die para-Position von N,N-Dimethylanilin → Azoverbindung mit charakteristischer roter/oranger Farbe (pH-Indikator).',
              related_reaction_id: 'fc-acylierung' }
          ],
          edges: [
            { from: ['A'],       to: 'D', reagent_above: 'NaNO_2 / HCl', reagent_below: '0°C' },
            { from: ['D','B'],   to: 'M', reagent_above: 'SE',            reagent_below: '-H^+' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Reaktionstyp',
        prompt: 'Welcher Reaktionstyp liegt der Kupplung Diazonium + N,N-Dimethylanilin zu Methylorange zugrunde?',
        choices: [
          { id: 'a', label: 'Elektrophile aromatische Substitution (SE)', correct: true },
          { id: 'b', label: 'Nukleophile aromatische Substitution',       correct: false },
          { id: 'c', label: 'Nukleophile Addition',                       correct: false },
          { id: 'd', label: 'Radikalische Substitution',                  correct: false }
        ],
        explanation: 'Aryldiazonium-Salze sind elektrophile Aromaten und reagieren mit elektronenreichen Aromaten via SE. Die NMe_2-Gruppe aktiviert das Aniline para zur Azokupplung.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     BW 49 (2023) — Aufgabe 7 A: Ibuprofen-Synthese
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw49-2023-ibuprofen',
    category: 'Mehrstufige Synthesen',
    name: 'Ibuprofen — BW 2023',
    difficulty: 'B',
    source: 'ÖChO Bundeswettbewerb 2023 (BW 49), Aufgabe 7 A',
    intro: 'Synthese von Ibuprofen ausgehend von p-Isobutylbenzol (A, C_{10}H_{14}). Friedel-Crafts-Acylierung mit Essigsäureanhydrid/HF (oder Acetylchlorid/AlCl_3) liefert das Aryl-methylketon B. Reduktion mit NaBH_4 zu Alkohol C, HCl ersetzt OH durch Cl (D), Mg-Insertion liefert das Grignard E, und CO_2-Quench (Kolbe-artig) + saure Aufarbeitung liefert Ibuprofen (F). Im Körper liegt es als Racemat vor — pharmakologisch wirksam ist nur das (S)-Enantiomer (das (R) wird von einer Isomerase invertiert).',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema (6 Stufen)',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: false, name: 'p-Isobutylbenzol (Isobutyltoluol)',
              smiles: 'CC(C)Cc1ccccc1',
              note: 'C_{10}H_{14}.',
              explanation: 'Edukt — Verbrennungsanalyse + 1H-NMR-Spektrum (singulettartige Signale 0,9 / 1,8 / 2,4 / 7,2 ppm).' },
            { id: 'B', label: 'B', given: false, name: 'p-Isobutylacetophenon',
              smiles: 'CC(=O)c1ccc(CC(C)C)cc1',
              explanation: 'Friedel-Crafts-Acylierung: Essigsäureanhydrid + HF (oder CH_3COCl / AlCl_3) → Aryl-methylketon.',
              related_reaction_id: 'fc-acylierung' },
            { id: 'C', label: 'C', given: false, name: '1-(p-Isobutylphenyl)ethanol',
              smiles: 'CC(O)c1ccc(CC(C)C)cc1',
              explanation: 'Reduktion des Ketons mit NaBH_4 in CH_3OH → sekundärer Alkohol.' },
            { id: 'D', label: 'D', given: false, name: '1-Chlor-1-(p-Isobutylphenyl)ethan',
              smiles: 'CC(Cl)c1ccc(CC(C)C)cc1',
              explanation: 'HCl ersetzt OH durch Cl (SN am Benzyl-C).' },
            { id: 'E', label: 'E', given: false, name: 'Grignard-Reagenz',
              smiles: 'CC([Mg]Cl)c1ccc(CC(C)C)cc1',
              explanation: 'Mg insertiert in C-Cl in Et_2O → Aryl-Alkyl-Grignard.' },
            { id: 'F', label: 'F', given: false, name: 'Ibuprofen (rac)',
              smiles: 'CC(C(=O)O)c1ccc(CC(C)C)cc1',
              note: 'C_{13}H_{18}O_2.',
              explanation: 'CO_2 wird vom Grignard nucleophil angegriffen → Magnesiumcarboxylat. Saure Aufarbeitung mit HCl liefert die freie Carbonsäure — Ibuprofen.',
              related_reaction_id: 'grignard-co' },
            { id: 'S', label: '(S)', given: false, name: '(S)-Ibuprofen (pharmakologisch aktiv)',
              smiles: 'C[C@@H](C(=O)O)c1ccc(CC(C)C)cc1',
              explanation: 'Im Körper wirkt nur das (S)-Enantiomer. Eine Isomerase konvertiert (R) → (S) bei Bedarf.' }
          ],
          edges: [
            { from: ['A'], to: 'B', reagent_above: '(CH_3CO)_2O / HF', reagent_below: 'SE' },
            { from: ['B'], to: 'C', reagent_above: 'NaBH_4 / CH_3OH',  reagent_below: '' },
            { from: ['C'], to: 'D', reagent_above: 'HCl',              reagent_below: 'SN' },
            { from: ['D'], to: 'E', reagent_above: 'Mg / Et_2O',       reagent_below: '' },
            { from: ['E'], to: 'F', reagent_above: '1. CO_2',          reagent_below: '2. HCl' }
          ]
        }
      },
      {
        type: 'short_answer',
        title: 'Mechanismus A → B',
        prompt: 'Skizzieren Sie den Mechanismus der Friedel-Crafts-Acylierung A → B mit Essigsäureanhydrid und HF (Lewis-Säure-Katalyse).',
        expected_answer: '1) HF protoniert ein Anhydrid-O → Acyloxocarbenium-Ion + Acetat. 2) Das Acylium-Kation (CH_3-CO^+) greift den elektronenreichen Aromaten elektrophil an (Wheland-Intermediat). 3) Re-Aromatisierung durch Verlust eines H^+ aus dem Sigma-Komplex → Aryl-methylketon B. Acetat fängt den abgespaltenen H^+ als Essigsäure ab.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     BW 49 (2023) — Aufgabe 7 B: Benzocain-Synthese
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw49-2023-benzocain',
    category: 'Mehrstufige Synthesen',
    name: 'Benzocain — BW 2023',
    difficulty: 'B',
    source: 'ÖChO Bundeswettbewerb 2023 (BW 49), Aufgabe 7 B',
    intro: 'Synthese des Lokalanästhetikums Benzocain (Ethyl-4-aminobenzoat) aus Toluol. Über Nitrierung (para), Reduktion zum Anilin, Acetyl-Schutz, Methyl-Oxidation, saure Hydrolyse und Fischer-Veresterung mit Ethanol entsteht der Wirkstoff.',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema (6 Stufen)',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: true, name: 'Toluol',
              smiles: 'Cc1ccccc1',
              explanation: 'Ausgangsmaterial.' },
            { id: 'B', label: 'B', given: false, name: '4-Nitrotoluol',
              smiles: 'Cc1ccc([N+](=O)[O-])cc1',
              note: '1H-NMR zeigt 2H/2H (AA′BB′) + 3H (Me) — passt zur para-Substitution.',
              explanation: 'HNO_3 / H_2SO_4: SE — der CH_3-Rest dirigiert ortho/para; das thermodynamische para-Produkt überwiegt.' },
            { id: 'C', label: 'C', given: false, name: '4-Methylanilin (p-Toluidin)',
              smiles: 'Cc1ccc(N)cc1',
              explanation: 'Fe/HCl reduziert die NO_2-Gruppe zum primären aromatischen Amin.' },
            { id: 'D', label: 'D', given: false, name: 'N-(4-Methylphenyl)acetamid (Acetanilid)',
              smiles: 'CC(=O)Nc1ccc(C)cc1',
              explanation: 'Acetylierung mit (CH_3CO)_2O — schützt die Aminogruppe (verhindert Oxidation im nächsten Schritt).' },
            { id: 'E', label: 'E', given: false, name: 'N-(4-Carboxyphenyl)acetamid (4-Acetamidobenzoesäure)',
              smiles: 'CC(=O)Nc1ccc(C(=O)O)cc1',
              explanation: 'KMnO_4 oxidiert die Methyl-Gruppe zur Carbonsäure. Die Acetamid-Schutzgruppe verhindert Oxidation am N.' },
            { id: 'F', label: 'F', given: false, name: '4-Aminobenzoesäure (PABA)',
              smiles: 'OC(=O)c1ccc(N)cc1',
              explanation: 'Saure Hydrolyse (HCl aq) spaltet die Acetyl-Schutzgruppe → freies Amin.' },
            { id: 'Bc', label: 'Benzocain', given: false, name: 'Benzocain (Ethyl-4-aminobenzoat)',
              smiles: 'CCOC(=O)c1ccc(N)cc1',
              explanation: 'Fischer-Veresterung mit Ethanol/H_2SO_4 → Ethylester.',
              related_reaction_id: 'veresterung' }
          ],
          edges: [
            { from: ['A'], to: 'B',  reagent_above: 'HNO_3 / H_2SO_4', reagent_below: 'SE' },
            { from: ['B'], to: 'C',  reagent_above: 'Fe / HCl',         reagent_below: 'Reduktion' },
            { from: ['C'], to: 'D',  reagent_above: '(CH_3CO)_2O',       reagent_below: '' },
            { from: ['D'], to: 'E',  reagent_above: 'KMnO_4',            reagent_below: 'CH_3 → COOH' },
            { from: ['E'], to: 'F',  reagent_above: 'HCl (aq)',          reagent_below: 'Hydrolyse' },
            { from: ['F'], to: 'Bc', reagent_above: 'EtOH / H_2SO_4',    reagent_below: 'Fischer-Veresterung' }
          ]
        }
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     BW 49 (2023) — Aufgabe 7 C: Lidocain-Synthese
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw49-2023-lidocain',
    category: 'Mehrstufige Synthesen',
    name: 'Lidocain — BW 2023',
    difficulty: 'B',
    source: 'ÖChO Bundeswettbewerb 2023 (BW 49), Aufgabe 7 C',
    intro: 'Synthese des Lokalanästhetikums Lidocain in zwei Stufen: Acylierung von 2,6-Dimethylanilin mit Chloracetylchlorid (E) zum α-Chloramid I, dann SN-Substitution des α-Cl durch Diethylamin (Z) zum endgültigen Lidocain.',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema (2 Stufen)',
        scheme: {
          nodes: [
            { id: 'Ed', label: 'Ed', given: true, name: '2,6-Dimethylanilin',
              smiles: 'Cc1cccc(C)c1N',
              explanation: 'Edukt — die zwei ortho-Methylgruppen schützen das Amin sterisch und verhindern später Hydrolyse.' },
            { id: 'E',  label: 'E',  given: false, name: 'Chloracetylchlorid',
              smiles: 'ClCC(=O)Cl',
              explanation: 'Bi-funktionelles Elektrophil: das Säurechlorid acyliert das Amin, das α-Cl bleibt für den Folgeschritt.' },
            { id: 'I',  label: 'I',  given: false, name: 'α-Chloramid (Zwischenprodukt)',
              smiles: 'O=C(CCl)Nc1c(C)cccc1C',
              explanation: 'NaOAc puffert das HCl, das bei der Amid-Bildung freigesetzt wird (Aminolyse des Säurechlorids).' },
            { id: 'Z',  label: 'Z',  given: false, name: 'Diethylamin',
              smiles: 'CCNCC',
              explanation: 'Nukleophil für die α-SN-Substitution.' },
            { id: 'L',  label: 'Lidocain', given: false, name: 'Lidocain',
              smiles: 'CCN(CC)CC(=O)Nc1c(C)cccc1C',
              explanation: 'SN2: Diethylamin verdrängt das α-Cl → tertiäres Amin am α-C des Amids. Bei Lidocain bildet HCl das Hydrochlorid am tertiären Amin -N(Et)_2.',
              related_reaction_id: 'sn2-alkylhalogenid' }
          ],
          edges: [
            { from: ['Ed','E'], to: 'I', reagent_above: 'NaOAc',  reagent_below: '-HCl' },
            { from: ['I','Z'],  to: 'L', reagent_above: 'Δ',      reagent_below: 'SN2 am α-C' }
          ]
        }
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     BW 49 (2023) — Aufgabe 8 B: Porphyrin-Cyclisierung
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw49-2023-porphyrin',
    category: 'Mehrstufige Synthesen',
    name: 'Porphyrin — elektrochemische Cyclisierung (BW 2023)',
    difficulty: 'D',
    source: 'ÖChO Bundeswettbewerb 2023 (BW 49), Aufgabe 8 B',
    intro: 'Smith schlug 1993 einen Mechanismus zur elektrochemischen Synthese von Porphyrinen vor. Ausgehend von einem offenkettigen Biladien werden zwei sukzessive Ein-Elektronen-Oxidationen + Protonen-Eliminierungen (-e^-, -H^+) durchgeführt; das resultierende Radikalkation cyclisiert zum Porphyrin-Grundgerüst.',
    sections: [
      {
        type: 'synthesis',
        title: 'Elektrochemische Cyclisierung',
        scheme: {
          nodes: [
            { id: 'Bi', label: 'Bi', given: true, name: 'Biladien (offenes Pyrrol-Tetramer)',
              note: 'Ein offenkettiges Bilen mit 4 verknüpften Pyrrolringen — Vorläufer für die Macrocyclisierung.',
              explanation: 'Edukt. Vier Pyrrole sind durch drei Methin-Brücken verknüpft, die Enden tragen noch freie -CH_2-Gruppen.' },
            { id: 'I1', label: '1', given: false, name: 'Radikalkation (1. Oxidation)',
              note: '1. -e^- / -H^+ bei -800 mV.',
              explanation: 'Anodische Oxidation entzieht ein Elektron der elektronenreichen Pyrrol-Methylengruppe; Verlust eines Protons → Radikal-stabilisierter Carbeniumion.' },
            { id: 'I2', label: '2', given: false, name: 'Cyclisierungs-Intermediat (2. Oxidation)',
              note: '2. -e^- / -H^+; Elektronenpaar-Wanderung schließt den Macrocyclus.',
              explanation: 'Eine zweite Oxidation + intramolekulare Elektronen-paar-Wanderung schließt den 16-gliedrigen Porphyrin-Macrocyclus.' },
            { id: 'P',  label: 'Porphyrin', given: false, name: 'Porphyrin-Grundgerüst',
              note: '4 Pyrrol-Ringe, durch 4 Methin-Brücken zu einem Macrocyclus verknüpft. Aromatisches 18-π-Elektronensystem.',
              explanation: 'Das Porphyrin trägt im Inneren 4 N-Atome (2 NH + 2 N), die Übergangsmetalle (Fe, Mg, Co...) chelatisieren. Wichtigste Vertreter: Häm, Chlorophyll, Vitamin B_{12} (Corrin).' }
          ],
          edges: [
            { from: ['Bi'], to: 'I1', reagent_above: '-800 mV',  reagent_below: '-e^-, -H^+' },
            { from: ['I1'], to: 'I2', reagent_above: '-e^-, -H^+', reagent_below: '' },
            { from: ['I2'], to: 'P',  reagent_above: 'Cyclisierung', reagent_below: '' }
          ]
        }
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
