/**
 * Batch 2: LW51 (Cyclohexylethanol + Sildenafil) and LW45 (phenylacetylene
 * routes + cinnamic acid → diphenylfuran chain).
 */
const fs = require('fs');
const path = require('path');
const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const data = JSON.parse(fs.readFileSync(QFILE, 'utf8'));
const existing = new Set(data.map(q => q.id));

const ENTRIES = [
  /* ════════════════════════════════════════════════════════════════════
     LW 51 (2025) — Problem E.1: 1-Cyclohexylethanol aus Phenol
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'lw51-2025-cyclohexylethanol',
    category: 'Mehrstufige Synthesen',
    name: '1-Cyclohexylethanol — LW 2025',
    difficulty: 'A',
    source: 'ÖChO Landeswettbewerb 2025 (LW 51), Problem E.1',
    intro: 'Fünf-stufige Synthese von 1-Cyclohexylethanol aus Phenol. Über vollständige Hydrierung, säurekatalysierte Eliminierung, Oxidation, Bromierung und schließlich eine Grignard-Reaktion mit Acetaldehyd entsteht der racemische sekundäre Alkohol.',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: false, name: 'Phenol',
              smiles: 'Oc1ccccc1',
              explanation: 'Ausgangsmaterial — C_6H_6O.' },
            { id: 'B', label: 'B', given: false, name: 'Cyclohexanol',
              smiles: 'OC1CCCCC1',
              explanation: 'Vollständige katalytische Hydrierung des aromatischen Rings (H_2 / Katalysator).' },
            { id: 'C', label: 'C', given: false, name: 'Cyclohexen',
              smiles: 'C1CCCC=C1',
              explanation: 'Säurekatalysierte Dehydratisierung des Alkohols (E1 / E2 mit konz. H_2SO_4).' },
            { id: 'D', label: 'D', given: false, name: 'Cyclohexanon',
              smiles: 'O=C1CCCCC1',
              note: 'Summenformel C_6H_{10}O.',
              explanation: 'Saure Chromat-Oxidation des Alkens — über Diol-Intermediat zum Keton oxidiert.' },
            { id: 'E', label: 'E', given: false, name: 'Bromcyclohexan',
              smiles: 'BrC1CCCCC1',
              note: 'MS zeigt M+ / M+2 bei 162 u / 164 u im ≈1:1-Verhältnis — typisches Br-Isotopenmuster.',
              explanation: 'PBr_3 wandelt das Carbonyl bzw. den korrespondierenden Alkohol zum Alkylbromid um.' },
            { id: 'X', label: 'X', given: false, name: 'Acetaldehyd (Edukt)',
              smiles: 'CC=O',
              explanation: 'Carbonyl-Komponente für die Grignard-Addition.' },
            { id: 'F', label: 'F', given: false, name: '1-Cyclohexylethanol',
              smiles: 'CC(O)C1CCCCC1',
              explanation: 'Grignard: Mg insertiert in C-Br von E → Cyclohexyl-MgBr. Addition an X (CH_3CHO) liefert nach saurer Aufarbeitung den sekundären Alkohol. Stereozentrum entsteht — racemisches Produkt.',
              related_reaction_id: 'grignard-co' }
          ],
          edges: [
            { from: ['A'], to: 'B', reagent_above: 'H_2 / Kat.',     reagent_below: '' },
            { from: ['B'], to: 'C', reagent_above: 'H_2SO_4',        reagent_below: 'Δ, -H_2O' },
            { from: ['C'], to: 'D', reagent_above: 'Cr_2O_7^{2-} / H^+', reagent_below: 'Δ' },
            { from: ['D'], to: 'E', reagent_above: 'PBr_3',          reagent_below: '' },
            { from: ['E','X'], to: 'F', reagent_above: '1. Mg / Et_2O', reagent_below: '2. H_3O^+' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Isomerie zwischen (R)- und (S)-1-Phenylethanol',
        prompt: 'Welche Art von Isomerie liegt zwischen der R- und der S-Form von 1-Phenylethanol vor?',
        choices: [
          { id: 'a', label: 'Epimerie',           correct: false },
          { id: 'b', label: 'Diastereomerie',     correct: false },
          { id: 'c', label: 'Stereoisomerie + Enantiomerie', correct: true },
          { id: 'd', label: 'Geometrische Isomerie', correct: false },
          { id: 'e', label: 'Stellungsisomerie',  correct: false }
        ],
        explanation: 'R- und S-1-Phenylethanol sind Bild und Spiegelbild — Enantiomere (eine Unterklasse der Stereoisomerie). Da nur ein Stereozentrum vorhanden ist, gibt es keine Diastereomere.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     LW 51 (2025) — Problem E.2: Sildenafil (Viagra)
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'lw51-2025-sildenafil',
    category: 'Mehrstufige Synthesen',
    name: 'Sildenafil (Viagra) — LW 2025',
    difficulty: 'D',
    source: 'ÖChO Landeswettbewerb 2025 (LW 51), Problem E.2',
    intro: 'Mehrstufige Industriesynthese des PDE-5-Inhibitors Sildenafil. Aus einem β-Ketoester (A, C_9H_{14}O_4) wird via Hydrazin-Cyclisierung ein Pyrazol gebildet, das anschließend N-methyliert, hydrolysiert, nitriert, zum Säurechlorid und Amid umgesetzt, an der Nitro-Gruppe reduziert und mit 2-Ethoxybenzoylchlorid zum bisamidischen Schlüsselintermediat acyliert wird. Zwei finale Stufen liefern Sildenafil (Pyrazolopyrimidinon + Sulfonamid-Piperazin).',
    sections: [
      {
        type: 'synthesis',
        title: 'Aufbau des Pyrazol-Kerns (A → C)',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: false, name: 'Ethyl 3-oxohexanoat (β-Ketoester)',
              smiles: 'CCOC(=O)CC(=O)CCC',
              note: 'C_9H_{14}O_4 — die 1H-NMR-Signale (a: 2H Singulett bei ≈3.4 ppm, b: 2H Quartett bei ≈4.2 ppm, c+d: CH_2-Gruppen des Propyls, e+f: zwei Methyle) bestätigen die Konstitution.',
              explanation: 'Edukt — β-Diketon-Anteil hochreaktiv gegen Hydrazin.' },
            { id: 'B', label: 'B', given: false, name: 'Ethyl 5-propyl-1H-pyrazol-3-carboxylat',
              smiles: 'CCOC(=O)c1cc(CCC)n[nH]1',
              explanation: 'N_2H_4 (Nukleophil) addiert doppelt an die zwei Carbonyl-Gruppen des β-Ketoesters → Cyclisierung zum Pyrazol unter Wasserabspaltung.' },
            { id: 'C', label: 'C', given: false, name: 'N-Methyliertes Pyrazol (Ethyl-Ester)',
              smiles: 'CCOC(=O)c1cc(CCC)nn1C',
              explanation: 'Dimethylsulfat (CH_3)_2SO_4 methyliert das nukleophilere ring-N — Methyl an N1.' }
          ],
          edges: [
            { from: ['A'], to: 'B', reagent_above: 'N_2H_4',          reagent_below: 'Kondensation' },
            { from: ['B'], to: 'C', reagent_above: '(CH_3)_2SO_4 (w)', reagent_below: 'SN am N' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Aufbau des Diamid-Intermediats (C → I)',
        scheme: {
          nodes: [
            { id: 'd', label: 'd', given: false, name: 'Ethanol (Nebenprodukt)',
              smiles: 'CCO',
              explanation: 'Hydrolyse-Nebenprodukt (46 g/mol).' },
            { id: 'E', label: 'E', given: false, name: '1-Methyl-5-propyl-1H-pyrazol-3-carbonsäure',
              smiles: 'OC(=O)c1cc(CCC)nn1C',
              explanation: 'Esterspaltung (Verseifung mit NaOH, Ansäuerung mit HCl) liefert die freie Carbonsäure.' },
            { id: 'F', label: 'F', given: false, name: '4-Nitro-1-methyl-5-propyl-pyrazol-3-carbonsäure',
              smiles: 'OC(=O)c1c([N+](=O)[O-])c(CCC)nn1C',
              explanation: 'Elektrophile aromatische Nitrierung am Pyrazol-C4 (HNO_3/H_2SO_4). Reagenz x = HNO_3/H_2SO_4.',
              related_reaction_id: 'fc-acylierung' },
            { id: 'G', label: 'G', given: false, name: 'Säurechlorid von F',
              smiles: 'ClC(=O)c1c([N+](=O)[O-])c(CCC)nn1C',
              explanation: 'SOCl_2 wandelt die Carbonsäure zum Säurechlorid um.' },
            { id: 'H', label: 'H', given: false, name: 'Carbonsäureamid von F',
              smiles: 'NC(=O)c1c([N+](=O)[O-])c(CCC)nn1C',
              explanation: 'NH_3 substituiert Cl — Amid-Bildung (Kondensation/SN am sp^2-C).' },
            { id: 'I', label: 'I', given: false, name: '4-Amino-1-methyl-5-propyl-pyrazol-3-carboxamid',
              smiles: 'NC(=O)c1c(N)c(CCC)nn1C',
              note: 'C_8H_{14}N_4O.',
              explanation: 'Fe/HCl reduziert die Nitro-Gruppe zum primären aromatischen Amin.' }
          ],
          edges: [
            { from: ['C'], to: 'E', reagent_above: '1. NaOH',      reagent_below: '2. HCl' },
            { from: ['C'], to: 'd', reagent_above: 'Hydrolyse',    reagent_below: '' },
            { from: ['E'], to: 'F', reagent_above: 'HNO_3/H_2SO_4 (x)', reagent_below: 'SE' },
            { from: ['F'], to: 'G', reagent_above: 'SOCl_2',       reagent_below: '' },
            { from: ['G'], to: 'H', reagent_above: 'NH_3',         reagent_below: 'Kondensation' },
            { from: ['H'], to: 'I', reagent_above: 'Fe / HCl',     reagent_below: 'Reduktion' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Ringschluss zum Pyrazolopyrimidinon (I → L) und Sildenafil',
        scheme: {
          nodes: [
            { id: 'K', label: 'K', given: false, name: 'Diamid-Intermediat (zwei Amidgruppen)',
              smiles: 'NC(=O)c1c(NC(=O)c2ccccc2OCC)c(CCC)nn1C',
              explanation: 'Aus I + 2-Ethoxybenzoylchlorid: das aromatische Amin acyliert nukleophil das Säurechlorid. Beide Amidgruppen werden für den nächsten Ringschluss benötigt. Nebenprodukt m = HCl (36,5 g/mol).' },
            { id: 'L', label: 'L', given: false, name: '5-(2-Ethoxyphenyl)-1-methyl-3-propyl-pyrazolo[4,3-d]pyrimidin-7(6H)-on',
              smiles: 'CCOc1ccccc1C2=NC(=O)c3c(CCC)nn(C)c3N2',
              explanation: 'Intramolekulare Kondensation: das Carboxamid-NH greift den zweiten Amid-Carbonyl an, -H_2O. Ergebnis: Pyrazolopyrimidinon-Kern.' },
            { id: 'Z', label: 'Z', given: false, name: '1-Methylpiperazin',
              smiles: 'CN1CCNCC1',
              explanation: 'Sekundärer aliphatischer Amin — Nukleophil für den letzten Schritt.' },
            { id: 'N', label: 'Sildenafil', given: false, name: 'Sildenafil (Viagra)',
              smiles: 'CCCc1nn(C)c2c1nc(-c1cc(S(=O)(=O)N3CCN(C)CC3)ccc1OCC)[nH]c2=O',
              explanation: 'Chlorsulfonierung (ClSO_3H) führt eine -SO_2Cl-Gruppe am Aromaten ein (SE). Anschließend reagiert das Sulfonylchlorid mit 1-Methylpiperazin (Z) unter HCl-Eliminierung zum Sulfonamid — fertiges Sildenafil.' }
          ],
          edges: [
            { from: ['I'], to: 'K', reagent_above: '2-EtO-C_6H_4-COCl', reagent_below: '-HCl (= m)' },
            { from: ['K'], to: 'L', reagent_above: '-H_2O',             reagent_below: 'Cyclisierung' },
            { from: ['L','Z'], to: 'N', reagent_above: '1. ClSO_3H',     reagent_below: '2. +Z, -HCl' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Aufgabe von Hydrazin in A → B',
        prompt: 'Welche Aussage zur Aufgabe von N_2H_4 in Reaktion A → B trifft zu?',
        choices: [
          { id: 'a', label: 'reagiert als Nukleophil',   correct: true },
          { id: 'b', label: 'reagiert als Elektrophil',  correct: false },
          { id: 'c', label: 'ist ein Radikal',           correct: false },
          { id: 'd', label: 'fungiert als Katalysator',  correct: false }
        ],
        explanation: 'Hydrazin trägt zwei freie Elektronenpaare am N und ist ein klassisches N-Nukleophil. Es addiert an den elektrophilen Carbonyl-C beider Carbonyle des β-Ketoesters und cyclisiert zum Pyrazol.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     LW 45 (2019) — Problem E: Phenylacetylen & Folge-Chemie
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'lw45-2019-phenylacetylen-routen',
    category: 'Mehrstufige Synthesen',
    name: 'Phenylacetylen — verschiedene Synthesewege (LW 2019)',
    difficulty: 'B',
    source: 'ÖChO Landeswettbewerb 2019 (LW 45), Problem E',
    intro: 'Phenylacetylen (Ethinylbenzol, X) wird über mehrere Wege hergestellt: aus 1-Brom-2-phenylethen (Eliminierung), aus Benzol via Bromierung/Grignard-Wege, oder via Zimtsäure → 2,3-Dibrom-3-phenylpropansäure → α-Bromzimtsäure → Phenylacetylen.',
    sections: [
      {
        type: 'synthesis',
        title: 'Hauptweg: Phenylacetylen aus 1-Brom-2-phenylethen',
        scheme: {
          nodes: [
            { id: 'P1', label: '(E)', given: false, name: '(E)-1-Brom-2-phenylethen',
              smiles: 'Br/C=C/c1ccccc1',
              explanation: 'Edukt.' },
            { id: 'X',  label: 'X',   given: false, name: 'Phenylacetylen (Ethinylbenzol)',
              smiles: 'C#Cc1ccccc1',
              note: 'C_8H_6 — bestimmt aus Massenanteilen (94,08% C, 5,92% H) und der Anforderung, mindestens einen Benzenring zu enthalten.',
              explanation: 'Doppel-Eliminierung mit starker Base (z. B. NaNH_2 in NH_3 oder KOH/EtOH) liefert das terminale Alkin.' }
          ],
          edges: [
            { from: ['P1'], to: 'X', reagent_above: 'NaNH_2 / NH_3', reagent_below: '2× -HBr' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Alternative über Benzol → Brombenzol → Grignard → sekundärer Alkohol',
        scheme: {
          nodes: [
            { id: 'Bz', label: 'Bz', given: false, name: 'Benzol',
              smiles: 'c1ccccc1',
              explanation: 'Ausgangsmaterial.' },
            { id: 'D',  label: 'D',  given: false, name: 'Brombenzol',
              smiles: 'Brc1ccccc1',
              explanation: 'Br_2 / FeBr_3 → elektrophile aromatische Substitution (SE).',
              related_reaction_id: 'sn2-alkylhalogenid' },
            { id: 'E',  label: 'E',  given: false, name: 'Phenylmagnesiumbromid',
              smiles: '[Mg]([Br])c1ccccc1',
              explanation: 'Mg-Insertion in die C-Br-Bindung in Et_2O.' },
            { id: 'F',  label: 'F',  given: false, name: '1-Phenylethanol',
              smiles: 'CC(O)c1ccccc1',
              explanation: 'Addition von E an Acetaldehyd (CH_3CHO) → sekundärer Alkohol.',
              related_reaction_id: 'grignard-co' }
          ],
          edges: [
            { from: ['Bz'], to: 'D', reagent_above: 'Br_2 / FeBr_3', reagent_below: 'SE' },
            { from: ['D'],  to: 'E', reagent_above: 'Mg / Et_2O',    reagent_below: '' },
            { from: ['E'],  to: 'F', reagent_above: 'CH_3CHO',       reagent_below: 'dann H_3O^+' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Über Styrol-Bromaddition zum vic-Dibromid',
        scheme: {
          nodes: [
            { id: 'St', label: 'St', given: false, name: 'Styrol',
              smiles: 'C=Cc1ccccc1',
              explanation: 'Ausgangsmaterial.' },
            { id: 'G',  label: 'G',  given: false, name: '1,2-Dibrom-1-phenylethan',
              smiles: 'BrCC(Br)c1ccccc1',
              explanation: 'Br_2 addiert elektrophil an die C=C-Doppelbindung (AE) — Bromonium-Intermediat führt zur anti-Addition.',
              related_reaction_id: 'alken-halogenaddition' }
          ],
          edges: [
            { from: ['St'], to: 'G', reagent_above: 'Br_2', reagent_below: 'AE' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Über Zimtsäure: 2,3-Dibrom-Addukt → α-Bromzimtsäure',
        scheme: {
          nodes: [
            { id: 'Zs', label: 'Zs', given: false, name: 'Zimtsäure ((E)-3-Phenylpropensäure)',
              smiles: 'OC(=O)/C=C/c1ccccc1',
              explanation: 'Ausgangsmaterial.' },
            { id: 'K',  label: 'K',  given: false, name: '2,3-Dibrom-3-phenylpropansäure',
              smiles: 'OC(=O)C(Br)C(Br)c1ccccc1',
              explanation: 'Br_2-Addition an die C=C der Zimtsäure (AE).' },
            { id: 'L',  label: 'L',  given: false, name: '(Z/E)-α-Bromzimtsäure',
              smiles: 'OC(=O)/C(Br)=C/c1ccccc1',
              explanation: 'Eliminierung von HBr aus K (Base/Δ) — α-Bromzimtsäure.' }
          ],
          edges: [
            { from: ['Zs'], to: 'K', reagent_above: 'Br_2',  reagent_below: 'AE' },
            { from: ['K'],  to: 'L', reagent_above: 'Base',  reagent_below: '-HBr' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Diphenylbutadiin → 1,4-Diphenylbutandion → 2,5-Diphenylfuran',
        scheme: {
          nodes: [
            { id: 'M', label: 'M', given: false, name: '1,4-Diphenylbutadiin',
              smiles: 'C(#Cc1ccccc1)C#Cc1ccccc1',
              explanation: 'Glaser-artige Kupplung zweier Phenylacetylen-Moleküle (Cu(I)/O_2).' },
            { id: 'N', label: 'N', given: false, name: '1,4-Diphenylbutan-1,4-dion',
              smiles: 'O=C(CCC(=O)c1ccccc1)c1ccccc1',
              explanation: 'Hydratisierung von M → 1,4-Diketon.' },
            { id: 'O', label: 'O', given: false, name: '2,5-Diphenylfuran',
              smiles: 'c1cc(-c2ccc(-c3ccccc3)o2)cc1',
              explanation: 'Paal-Knorr-Cyclisierung des 1,4-Diketons unter saurer Wasserabspaltung → 2,5-disubstituierter Furan.' }
          ],
          edges: [
            { from: ['M'], to: 'N', reagent_above: 'H_2O / H^+', reagent_below: '' },
            { from: ['N'], to: 'O', reagent_above: 'H^+',         reagent_below: '-H_2O (Paal-Knorr)' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Mechanismus Benzol → D und Styrol → G',
        prompt: 'Welche Mechanismen liegen den Bildungen von Brombenzol (Benzol → D) und 1,2-Dibrom-1-phenylethan (Styrol → G) zugrunde?',
        choices: [
          { id: 'a', label: 'beide S_E', correct: false },
          { id: 'b', label: 'beide A_E', correct: false },
          { id: 'c', label: 'D: S_E, G: A_E', correct: true },
          { id: 'd', label: 'D: A_E, G: S_E', correct: false }
        ],
        explanation: 'Benzol → D: elektrophile aromatische Substitution (Br^+ greift Aromaten an, Wasserstoff wird verdrängt). Styrol → G: elektrophile Addition (Br_2 addiert an die C=C-Doppelbindung — vicinales Dibromid).'
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
