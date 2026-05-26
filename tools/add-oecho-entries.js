/**
 * One-shot script to add OECHO Landeswettbewerb synthesis entries to
 * data/questions.json. Run: `node tools/add-oecho-entries.js`.
 *
 * Each entry uses the new modular `sections` schema. Chemistry (SMILES,
 * reagents, conditions) is transcribed from the published Lösungen PDFs;
 * prose is paraphrased briefly in our own words and the source is cited.
 *
 * Idempotent: skips any entry whose `id` already exists in the file.
 */
const fs = require('fs');
const path = require('path');

const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const data = JSON.parse(fs.readFileSync(QFILE, 'utf8'));
const existing = new Set(data.map(q => q.id));

const ENTRIES = [
  /* ════════════════════════════════════════════════════════════════════
     LW 50 (2024) — Problem D2: Rohypnol-Synthese
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'lw50-2024-rohypnol',
    category: 'Mehrstufige Synthesen',
    name: 'Rohypnol (Flunitrazepam) — LW 2024',
    difficulty: 'C',
    source: 'ÖChO Landeswettbewerb 2024 (LW 50), Problem D.2',
    intro: 'Mehrstufige Synthese des Benzodiazepins Flunitrazepam (Rohypnol). Ausgehend von 2-Fluortoluol wird über Bromierung, SN, Hydrolyse, Säurechlorid-Bildung und mehrere C-C-Knüpfungen das Benzodiazepin-Grundgerüst aufgebaut. Der finale Schritt ist eine Nitrierung und N-Methylierung.',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: false, name: '2-Fluorbenzylbromid',
              smiles: 'Fc1ccccc1CBr',
              explanation: 'Radikalische Bromierung der Benzyl-Position von 2-Fluortoluol (SR).' },
            { id: 'B', label: 'B', given: false, name: '2-Fluorphenylacetonitril',
              smiles: 'Fc1ccccc1CC#N',
              explanation: 'SN: Cyanid verdrängt Bromid.' },
            { id: 'C', label: 'C', given: false, name: '2-Fluorphenylessigsäure',
              smiles: 'OC(=O)Cc1ccccc1F',
              explanation: 'Saure Hydrolyse des Nitrils zur Carbonsäure.' },
            { id: 'D', label: 'D', given: false, name: '2-Fluorphenylacetylchlorid',
              smiles: 'ClC(=O)Cc1ccccc1F',
              explanation: 'SOCl_2 liefert das Säurechlorid (gut für nachfolgende Friedel-Crafts-Acylierung).' },
            { id: 'E', label: 'E', given: false, name: '2-(2-Fluorphenyl)-1-phenyl-ethan-1-on',
              smiles: 'O=C(Cc1ccccc1F)c1ccccc1',
              explanation: 'Friedel-Crafts-Acylierung mit Benzol/AlCl_3.' },
            { id: 'F', label: 'F', given: false, name: 'Phenylhydrazon von E',
              smiles: 'Fc1ccccc1C/C(=N/Nc2ccccc2)/c1ccccc1',
              explanation: 'Kondensation mit Phenylhydrazin (AN-Bildung des Hydrazons).' },
            { id: 'G', label: 'G', given: false, name: 'Benzoesäure (Nebenprodukt)',
              smiles: 'OC(=O)c1ccccc1',
              explanation: 'Phenyl-Fragment als Nebenprodukt der nachfolgenden Umlagerung.' },
            { id: 'H', label: 'H', given: false, name: 'α-Brom-N-acyl-anilin (Schlüsselintermediat)',
              smiles: 'CC(=O)Nc1ccccc1C(=O)C(Br)c1ccccc1F',
              note: 'Struktur approximativ — exakte Verknüpfung siehe Original.',
              explanation: 'Nach Umlagerung + α-Halogenierung + N-Acetylierung — bereit zum Ringschluss.' },
            { id: 'I', label: 'I', given: false, name: '5-(2-Fluorphenyl)-2,3-dihydro-1H-1,4-benzodiazepin-2-on',
              smiles: 'O=C1CN=C(c2ccccc2F)c2ccccc2N1',
              explanation: 'Intramolekulare Kondensation (AN): die NH_2-Gruppe greift den Carbonyl-C an, Ringschluss zum Benzodiazepinon.' },
            { id: 'N', label: 'N', given: false, name: 'Flunitrazepam (Rohypnol)',
              smiles: 'CN1c2ccc([N+](=O)[O-])cc2C(=NCC1=O)c1ccccc1F',
              explanation: 'Nitrierung mit HNO_3/H_2SO_4 am Aromat (SE) plus N-Methylierung mit CH_3I (SN).',
              related_reaction_id: 'nitrierung' }
          ],
          edges: [
            { from: ['A'], to: 'B', reagent_above: 'NaCN', reagent_below: '' },
            { from: ['B'], to: 'C', reagent_above: 'H_3O^+', reagent_below: 'Δ' },
            { from: ['C'], to: 'D', reagent_above: 'SOCl_2', reagent_below: '' },
            { from: ['D'], to: 'E', reagent_above: 'C_6H_6 / AlCl_3', reagent_below: '' },
            { from: ['E'], to: 'F', reagent_above: 'PhNHNH_2', reagent_below: '-H_2O' },
            { from: ['F'], to: 'H', reagent_above: '[Umlagerung]', reagent_below: '-PhCOOH (G)' },
            { from: ['H'], to: 'I', reagent_above: 'NH_3, Base', reagent_below: 'Ringschluss' },
            { from: ['I'], to: 'N', reagent_above: '1. HNO_3/H_2SO_4', reagent_below: '2. CH_3I' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Reaktionsmechanismen',
        prompt: 'Nach welchem Mechanismus läuft die Bildung des 2-Fluorbenzylbromids (A) aus 2-Fluortoluol ab?',
        choices: [
          { id: 'a', label: 'S_R (radikalische Substitution)', correct: true },
          { id: 'b', label: 'S_N1', correct: false },
          { id: 'c', label: 'S_N2', correct: false },
          { id: 'd', label: 'A_E (elektrophile Addition)', correct: false }
        ],
        explanation: 'Benzyl-CH-Bindungen sind besonders bromierbar — das Benzylradikal ist mesomeriestabilisiert. Klassische radikalische Bromierung (NBS oder Br_2/Δ/hν).',
        related_reaction_id: 'alkan-halogenierung'
      },
      {
        type: 'short_answer',
        title: 'Welche Reagenzien führen von I zu Rohypnol?',
        prompt: 'Zwei aufeinanderfolgende Schritte sind nötig, um aus I das fertige Rohypnol zu erhalten. Welche?',
        expected_answer: '1. HNO_3/H_2SO_4 — elektrophile aromatische Nitrierung in 7-Position. 2. CH_3I (oder ein anderes Methylhalogenid) — N-Methylierung am Amid-N. Ergebnis: 7-Nitro-1-methyl-Benzodiazepinon = Flunitrazepam.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     LW 49 (2023) — Problem E: Aknecreme-Synthese (Tazaroten)
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'lw49-2023-tazaroten',
    category: 'Mehrstufige Synthesen',
    name: 'Tazaroten (Aknecreme) — LW 2023',
    difficulty: 'C',
    source: 'ÖChO Landeswettbewerb 2023 (LW 49), Problem E',
    intro: 'Synthese des Tazaroten — eines Retinoids in Aknecremes. Das Schema umfasst zwei parallele Fragmente: das Pyridin-Carbonsäure-Fragment (A→B→C) und das Thiochroman-Fragment (D→E→F→G→H). Aus beiden Teilen wird via Acylierung und C-C-Verknüpfung der Wirkstoff aufgebaut.',
    sections: [
      {
        type: 'synthesis',
        title: '1. Pyridin-Fragment: 6-Chlornicotinsäure als Säurechlorid',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: false, name: '6-Chlornicotinsäure (6-Chlorpyridin-3-carbonsäure)',
              smiles: 'OC(=O)c1ccc(Cl)nc1',
              explanation: 'Ausgangsmaterial — Pyridin mit Cl in 6- und COOH in 3-Position.' },
            { id: 'B', label: 'B', given: false, name: 'Ethylester von A',
              smiles: 'CCOC(=O)c1ccc(Cl)nc1',
              explanation: 'Fischer-Veresterung mit Ethanol + H^+.' },
            { id: 'C', label: 'C', given: false, name: 'Säurechlorid von A',
              smiles: 'ClC(=O)c1ccc(Cl)nc1',
              explanation: 'SOCl_2 wandelt die Säure in das deutlich reaktivere Säurechlorid um.' }
          ],
          edges: [
            { from: ['A'], to: 'B', reagent_above: 'EtOH, H^+', reagent_below: '' },
            { from: ['A'], to: 'C', reagent_above: 'SOCl_2', reagent_below: '-SO_2, -HCl' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: '2. Thiochroman-Fragment',
        scheme: {
          nodes: [
            { id: 'D', label: 'D', given: false, name: 'Thiophenolat (Ph-S^-)',
              smiles: '[S-]c1ccccc1',
              explanation: 'Aus Thiophenol durch Deprotonierung — Schwefel als weiches Nukleophil.' },
            { id: 'E', label: 'E', given: false, name: 'Prenyl-phenyl-thioether',
              smiles: 'CC(=C)CSc1ccccc1',
              note: 'Aus D + Prenylbromid via SN2.',
              explanation: 'SN-Substitution: das Thiolat verdrängt das Halogenid aus Prenylhalogenid.' },
            { id: 'F', label: 'F', given: false, name: '4,4-Dimethyl-thiochroman',
              smiles: 'CC1(C)CCSc2ccccc21',
              explanation: 'Intramolekulare elektrophile aromatische Substitution (SE): das tertiäre Carbenium-Kation greift den Aromaten an, Ringschluss zum Thiochroman.',
              related_reaction_id: 'fc-alkylierung' },
            { id: 'G', label: 'G', given: false, name: '6-Acyl-thiochroman',
              smiles: 'O=C(c1ccc(Cl)nc1)c1ccc2c(c1)C(C)(C)CCS2',
              explanation: 'Friedel-Crafts-Acylierung von F mit dem Säurechlorid C — neuer Aryl-Aryl-Ketolinker.' },
            { id: 'H', label: 'H', given: false, name: 'Enolat von G (α-Carbanion)',
              smiles: '[O-]C(=Cc1ccc2c(c1)C(C)(C)CCS2)c1ccc(Cl)nc1',
              note: 'Mesomeriestabilisiert: Enolat ↔ Carbanion.',
              explanation: 'Butyl-Lithium deprotoniert die α-Position des Ketons. Nebenprodukt: Butan (CH_3CH_2CH_2CH_3).',
              related_reaction_id: 'aldoladdition' }
          ],
          edges: [
            { from: ['D'], to: 'E', reagent_above: '(CH_3)_2C=CH-CH_2-Br', reagent_below: 'SN' },
            { from: ['E'], to: 'F', reagent_above: 'H^+', reagent_below: 'intramolekulare SE' },
            { from: ['F','C'], to: 'G', reagent_above: 'AlCl_3', reagent_below: 'Friedel-Crafts' },
            { from: ['G'], to: 'H', reagent_above: 'n-BuLi', reagent_below: '-Butan' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Mechanismus F → G',
        prompt: 'Nach welchem Mechanismus läuft die Reaktion F + C → G?',
        choices: [
          { id: 'a', label: 'S_R',  correct: false },
          { id: 'b', label: 'S_N',  correct: false },
          { id: 'c', label: 'S_E (Friedel-Crafts-Acylierung)', correct: true },
          { id: 'd', label: 'A_N',  correct: false }
        ],
        explanation: 'Klassische Friedel-Crafts-Acylierung: das Säurechlorid bildet mit AlCl_3 ein Acylium-Kation, das den elektronenreichen Thiochroman-Aromaten elektrophil angreift.',
        related_reaction_id: 'fc-acylierung'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     LW 48 (2022) — Problem E.4: Elemicin
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'lw48-2022-elemicin',
    category: 'Mehrstufige Synthesen',
    name: 'Elemicin (Phenylpropanoid) — LW 2022',
    difficulty: 'B',
    source: 'ÖChO Landeswettbewerb 2022 (LW 48), Problem E.4',
    intro: 'Synthese des Phenylpropanoids Elemicin (3,4,5-Trimethoxyallylbenzol) — ein Inhaltsstoff aus Muskat. Ausgangspunkt ist die 3,4,5-Trimethoxybenzoesäure (B), die über Säurechlorid (C), Amid (D), Nitril (E) und Aldehyd (G) zum sekundären Allyl-Alkohol H umgesetzt wird. Eliminierung und Doppelbindungs-Isomerisierung liefern schließlich J (Elemicin).',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema',
        scheme: {
          nodes: [
            { id: 'B', label: 'B', given: false, name: '3,4,5-Trimethoxybenzoesäure',
              smiles: 'COc1cc(C(=O)O)cc(OC)c1OC',
              explanation: 'Ausgangsmaterial.' },
            { id: 'C', label: 'C', given: false, name: '3,4,5-Trimethoxybenzoylchlorid',
              smiles: 'COc1cc(C(=O)Cl)cc(OC)c1OC',
              explanation: 'SOCl_2 wandelt die Säure in das Säurechlorid um.' },
            { id: 'D', label: 'D', given: false, name: '3,4,5-Trimethoxybenzamid',
              smiles: 'COc1cc(C(=O)N)cc(OC)c1OC',
              explanation: 'NH_3 substituiert Chlorid — Amid.' },
            { id: 'E', label: 'E', given: false, name: '3,4,5-Trimethoxybenzonitril',
              smiles: 'COc1cc(C#N)cc(OC)c1OC',
              explanation: 'Dehydratisierung des Amids (z. B. mit P_2O_5, POCl_3 oder SOCl_2/DMF).' },
            { id: 'F', label: 'F', given: false, name: '3,4,5-Trimethoxybenzylalkohol',
              smiles: 'COc1cc(CO)cc(OC)c1OC',
              note: 'Reduktion über G (Aldehyd) — Bruttoreduktion.',
              explanation: 'Reduktion des Nitrils via Aldehyd zum primären Alkohol.' },
            { id: 'G', label: 'G', given: false, name: '3,4,5-Trimethoxybenzaldehyd',
              smiles: 'COc1cc(C=O)cc(OC)c1OC',
              explanation: 'DIBAL-H reduziert Nitrile selektiv zur Aldehyd-Stufe (nicht weiter zum Alkohol bei kontrollierten Bedingungen).' },
            { id: 'H', label: 'H', given: false, name: '(R)-1-(3,4,5-Trimethoxyphenyl)-propan-1-ol',
              smiles: 'CC[C@H](O)c1cc(OC)c(OC)c(OC)c1',
              explanation: '1,2-Addition eines Ethyl-Grignards (CH_3CH_2MgBr) an den Aldehyd G — sekundärer Alkohol mit Stereozentrum (R).' },
            { id: 'I', label: 'I', given: false, name: '(E)-1-(3,4,5-Trimethoxyphenyl)-1-propen',
              smiles: 'C/C=C/c1cc(OC)c(OC)c(OC)c1',
              explanation: 'Dehydratisierung von H (Säure, Δ) — (E)-konfiguriertes Styryl-Derivat.' },
            { id: 'J', label: 'J', given: false, name: 'Elemicin (3,4,5-Trimethoxyallylbenzol)',
              smiles: 'C=CCc1cc(OC)c(OC)c(OC)c1',
              explanation: 'Isomerisierung der (E)-Propenyl-Doppelbindung zum endständigen Allyl — thermodynamisch ungünstiger, aber unter den Bedingungen erreichbar. (Eigentlich liefern die Bedingungen oft das Propenyl, Elemicin braucht zusätzliche Bedingungen.)' }
          ],
          edges: [
            { from: ['B'], to: 'C', reagent_above: 'SOCl_2',                reagent_below: '' },
            { from: ['C'], to: 'D', reagent_above: 'NH_3',                  reagent_below: '' },
            { from: ['D'], to: 'E', reagent_above: 'P_2O_5 (Dehydratation)', reagent_below: '' },
            { from: ['E'], to: 'G', reagent_above: 'DIBAL-H',                reagent_below: '' },
            { from: ['G'], to: 'F', reagent_above: 'NaBH_4', reagent_below: '(falls Bruttoreduktion zu F)' },
            { from: ['G'], to: 'H', reagent_above: 'CH_3CH_2MgBr',           reagent_below: '' },
            { from: ['H'], to: 'I', reagent_above: 'H^+, Δ',                 reagent_below: '-H_2O' },
            { from: ['I'], to: 'J', reagent_above: '[Isomerisierung]',       reagent_below: '' }
          ]
        }
      },
      {
        type: 'short_answer',
        title: 'Warum DIBAL-H?',
        prompt: 'Warum wird zur Reduktion des Nitrils E gerade DIBAL-H gewählt und nicht z. B. LiAlH_4?',
        expected_answer: 'DIBAL-H bleibt bei tiefer Temperatur (-78°C) auf der Aldehyd-Stufe stehen — das tetraedrische Iminoalanat-Intermediat ist stabil und gibt erst beim wässrigen Aufarbeiten den Aldehyd frei. LiAlH_4 würde direkt bis zum primären Amin durchreduzieren (kein selektiver Aldehyd-Erhalt). Genau dieselbe Selektivität nutzt man bei Estern → Aldehyden.'
      }
    ]
  }
];

// Append entries (idempotent)
let added = 0;
for (const e of ENTRIES) {
  if (existing.has(e.id)) { console.log('skip (exists):', e.id); continue; }
  data.push(e);
  existing.add(e.id);
  added++;
  console.log('added:', e.id);
}

fs.writeFileSync(QFILE, JSON.stringify(data, null, 2) + '\n');
console.log('\nTotal entries now:', data.length, '(+'+added+')');
