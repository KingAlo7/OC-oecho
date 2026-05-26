/**
 * Batch 3: LW42 (Phellandral), LW43 (Papaverin), LW44 (Oxybuprocain).
 * Plus a small bonus: LW50 D1 GHB → GBL (1-step intramolecular esterification).
 */
const fs = require('fs');
const path = require('path');
const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const data = JSON.parse(fs.readFileSync(QFILE, 'utf8'));
const existing = new Set(data.map(q => q.id));

const ENTRIES = [
  /* ════════════════════════════════════════════════════════════════════
     LW 42 (2015) — Problem F: Phellandral synthesis (Benzol → α-Phellandral)
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'lw42-2015-phellandral',
    category: 'Mehrstufige Synthesen',
    name: '(−)-Phellandral aus Benzol — LW 2015',
    difficulty: 'C',
    source: 'ÖChO Landeswettbewerb 2015 (LW 42), Problem F',
    intro: 'Klassische 11-stufige Synthese des natürlichen Aromastoffes (−)-Phellandral aus Benzol. Über Friedel-Crafts-Alkylierung, Sulfonierung mit anschließender Phenol-Bildung, Ringhydrierung, Oxidation, Cyanhydrin-Bildung, Acetylierung mit Eliminierung, Hydrolyse und schließlich Rosenmund-Reduktion entsteht ein chiraler α,β-ungesättigter Aldehyd (Summenformel C_{10}H_{16}O).',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema',
        scheme: {
          nodes: [
            { id: 'Bz', label: 'Benzol', given: true, name: 'Benzol',
              smiles: 'c1ccccc1', explanation: 'Ausgangsmaterial.' },
            { id: 'A',  label: 'A', given: false, name: 'Isopropylbenzol (Cumol)',
              smiles: 'CC(C)c1ccccc1',
              explanation: 'Friedel-Crafts-Alkylierung von Benzol mit 2-Propanol bzw. Propen / AlCl_3 (SE).',
              related_reaction_id: 'fc-alkylierung' },
            { id: 'B',  label: 'B', given: false, name: '4-Isopropylbenzolsulfonsäure',
              smiles: 'OS(=O)(=O)c1ccc(C(C)C)cc1',
              explanation: 'Sulfonierung des Aromaten (SO_3/H_2SO_4 — SE). Der Iso-propyl-Rest dirigiert para.' },
            { id: 'C',  label: 'C', given: false, name: '4-Isopropylphenol (p-Cymenol)',
              smiles: 'Oc1ccc(C(C)C)cc1',
              explanation: 'Alkalischmelze: Verschmelzen mit NaOH ergibt das Phenolat, nach Ansäuerung das Phenol (SN: -SO_3 → -OH).' },
            { id: 'D',  label: 'D', given: false, name: '4-Isopropylcyclohexanol',
              smiles: 'OC1CCC(C(C)C)CC1',
              explanation: 'Katalytische Vollhydrierung des Aromaten (H_2/Kat., Reduktion).' },
            { id: 'E',  label: 'E', given: false, name: '4-Isopropylcyclohexanon',
              smiles: 'O=C1CCC(C(C)C)CC1',
              explanation: 'Oxidation des Alkohols zum Keton (z. B. Cr_2O_7^{2-}/H^+ oder PCC).' },
            { id: 'F',  label: 'F', given: false, name: '1-Cyano-4-isopropylcyclohexan-1-ol (Cyanhydrin)',
              smiles: 'OC1(C#N)CCC(C(C)C)CC1',
              explanation: 'Nukleophile Addition von HCN ans Keton — Cyanhydrin-Bildung (A_N).' },
            { id: 'G',  label: 'G', given: false, name: '1-Acetoxy-1-cyano-4-isopropylcyclohexan',
              smiles: 'CC(=O)OC1(C#N)CCC(C(C)C)CC1',
              note: 'Hier tritt das Stereozentrum am C1 zum ersten Mal auf — F→G ist nicht stereoselektiv, zwei Enantiomere entstehen.',
              explanation: 'Acetylierung der tertiären OH-Gruppe (Essigsäureanhydrid).' },
            { id: 'H',  label: 'H', given: false, name: '1-Cyano-4-isopropyl-1-cyclohexen',
              smiles: 'N#CC1=CCC(C(C)C)CC1',
              explanation: 'Pyrolytische cis-Eliminierung der Acetyl-Gruppe → α,β-ungesättigtes Nitril.',
              related_reaction_id: 'ester-pyrolyse' },
            { id: 'I',  label: 'I', given: false, name: '4-Isopropyl-1-cyclohexen-1-carbonsäure',
              smiles: 'OC(=O)C1=CCC(C(C)C)CC1',
              explanation: 'Hydrolyse des Nitrils zur Carbonsäure (H_2SO_4 / H_2O, Hy).' },
            { id: 'J',  label: 'J', given: false, name: '4-Isopropyl-1-cyclohexen-1-carbonylchlorid',
              smiles: 'ClC(=O)C1=CCC(C(C)C)CC1',
              explanation: 'SOCl_2 wandelt Carbonsäure in das Säurechlorid um.' },
            { id: 'K',  label: 'K', given: false, name: '(−)-(S)-Phellandral',
              smiles: 'O=CC1=CC[C@@H](C(C)C)CC1',
              note: 'Natürliches (−)-Phellandral hat S-Konfiguration am chiralen C4.',
              explanation: 'Rosenmund-Reduktion (H_2/Pd-BaSO_4, Chinolin-S) reduziert das Säurechlorid selektiv zum Aldehyd.' }
          ],
          edges: [
            { from: ['Bz'], to: 'A', reagent_above: '(CH_3)_2CHOH / H_2SO_4', reagent_below: 'oder Propen/AlCl_3' },
            { from: ['A'],  to: 'B', reagent_above: 'H_2SO_4 (konz.)',         reagent_below: 'SE' },
            { from: ['B'],  to: 'C', reagent_above: '1. NaOH (Schmelze)',     reagent_below: '2. H^+' },
            { from: ['C'],  to: 'D', reagent_above: 'H_2 / Kat.',              reagent_below: 'Hydrierung' },
            { from: ['D'],  to: 'E', reagent_above: 'Cr_2O_7^{2-} / H^+',     reagent_below: 'Oxidation' },
            { from: ['E'],  to: 'F', reagent_above: 'HCN',                    reagent_below: 'A_N' },
            { from: ['F'],  to: 'G', reagent_above: '(CH_3CO)_2O',            reagent_below: '' },
            { from: ['G'],  to: 'H', reagent_above: 'Δ',                      reagent_below: '-CH_3COOH' },
            { from: ['H'],  to: 'I', reagent_above: 'H_2O / H_2SO_4',         reagent_below: 'Hydrolyse' },
            { from: ['I'],  to: 'J', reagent_above: 'SOCl_2',                 reagent_below: '' },
            { from: ['J'],  to: 'K', reagent_above: 'H_2 / Pd-BaSO_4',        reagent_below: 'Rosenmund' }
          ]
        }
      },
      {
        type: 'short_answer',
        title: 'Erster Stereoschritt',
        prompt: 'In welchem Syntheseschritt entsteht das erste chirale Zentrum, und welcher mechanistische Grund verhindert eine Stereoselektivität?',
        expected_answer: 'Im Schritt G→H bzw. genauer: in F→G entsteht das stereogene C1 (das tertiäre C-Atom mit OH/CN/CH_2/CH_2). Da das Edukt F achiral und das Reagenz Ac_2O ohne Chiralitätsinformation ist, läuft die Acetylierung beider Enantiotopen-Flächen gleich schnell ab — beide Enantiomere von G (und damit später beide Enantiomere von Phellandral) entstehen im 1:1-Verhältnis. Die Trennung in (−)- und (+)-Phellandral erfordert eine zusätzliche Racematspaltung.'
      },
      {
        type: 'multiple_choice',
        title: 'Stereochemie I → Diastereomere',
        prompt: 'Welche Beziehung haben die beiden Stereoisomere von 4-Isopropylcyclohexan-1-carbonsäure (cis vs trans Anordnung an C1 und C4)?',
        choices: [
          { id: 'a', label: 'Enantiomere',                          correct: false },
          { id: 'b', label: 'Konstitutionsisomere',                correct: false },
          { id: 'c', label: 'Diastereomere (cis/trans-Isomere)',   correct: true },
          { id: 'd', label: 'Konformere',                           correct: false }
        ],
        explanation: 'cis- und trans-Anordnungen zweier Substituenten an einem Cyclohexan-Ring sind Diastereomere — sie sind keine Bild-Spiegelbild-Paare und haben unterschiedliche physikalische Eigenschaften.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     LW 43 (2017) — Problem E: Papaverin synthesis
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'lw43-2017-papaverin',
    category: 'Mehrstufige Synthesen',
    name: 'Papaverin — LW 2017',
    difficulty: 'C',
    source: 'ÖChO Landeswettbewerb 2017 (LW 43), Problem E',
    intro: 'Synthese des Opium-Alkaloids Papaverin. Ausgangspunkt ist 3,4-Dimethoxybenzaldehyd (Veratral-Aldehyd, A); zwei parallele Pfade liefern (i) Homoveratrylamin (E) durch Reduktion und Cyanid/Reduktions-Sequenz, und (ii) Homoveratrumsäure (F) als Carbonsäure. Beide werden via Amidbildung gekoppelt und das Diamid via Bischler-Napieralski cyclisiert + oxidiert zum Isochinolin-Alkaloid Papaverin.',
    sections: [
      {
        type: 'synthesis',
        title: 'Pfad 1: Vom Aldehyd zum Amin (A → E)',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: false, name: '3,4-Dimethoxybenzaldehyd (Veratral-Aldehyd)',
              smiles: 'O=Cc1ccc(OC)c(OC)c1',
              explanation: 'Ausgangsmaterial.' },
            { id: 'B', label: 'B', given: false, name: '3,4-Dimethoxybenzylalkohol',
              smiles: 'OCc1ccc(OC)c(OC)c1',
              explanation: 'Reduktion des Aldehyds (NaBH_4 oder LiAlH_4).' },
            { id: 'C', label: 'C', given: false, name: '3,4-Dimethoxybenzylchlorid',
              smiles: 'ClCc1ccc(OC)c(OC)c1',
              explanation: 'OH → Cl mit SOCl_2 oder HCl/ZnCl_2 (SN am sp^3-Kohlenstoff).' },
            { id: 'D', label: 'D', given: false, name: '3,4-Dimethoxyphenylacetonitril',
              smiles: 'N#CCc1ccc(OC)c(OC)c1',
              explanation: 'SN: Cyanid verdrängt Chlorid.' },
            { id: 'E', label: 'E', given: false, name: 'Homoveratrylamin (2-(3,4-Dimethoxyphenyl)ethylamin)',
              smiles: 'NCCc1ccc(OC)c(OC)c1',
              note: 'C_{10}H_{15}NO_2.',
              explanation: 'Reduktion des Nitrils zum primären Amin (LiAlH_4 oder H_2/Kat.).' }
          ],
          edges: [
            { from: ['A'], to: 'B', reagent_above: 'NaBH_4',  reagent_below: '' },
            { from: ['B'], to: 'C', reagent_above: 'SOCl_2',  reagent_below: 'SN' },
            { from: ['C'], to: 'D', reagent_above: 'NaCN',    reagent_below: 'SN' },
            { from: ['D'], to: 'E', reagent_above: 'LiAlH_4', reagent_below: 'Reduktion' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Pfad 2: Vom Nitril zur Säure (D → F)',
        scheme: {
          nodes: [
            { id: 'F', label: 'F', given: false, name: 'Homoveratrumsäure (3,4-Dimethoxyphenylessigsäure)',
              smiles: 'OC(=O)Cc1ccc(OC)c(OC)c1',
              explanation: 'Hydrolyse des Nitrils D zur Carbonsäure (H_2SO_4 / H_2O, Hy).' }
          ],
          edges: [] // hint: F kommt aus D, aber wir zeigen es eigenständig im Pfad 2 zur Übersicht
        }
      },
      {
        type: 'synthesis',
        title: 'Kupplung zum Diamid und Cyclisierung zu Papaverin',
        scheme: {
          nodes: [
            { id: 'H', label: 'H', given: false, name: 'N-(3,4-Dimethoxyphenethyl)-2-(3,4-dimethoxyphenyl)acetamid',
              smiles: 'O=C(Cc1ccc(OC)c(OC)c1)NCCc1ccc(OC)c(OC)c1',
              note: 'Säureamid (kein Ester, kein sek. Amin, kein Peptid).',
              explanation: 'Kondensation des Amins E mit der Säure F (z. B. via Säurechlorid oder durch direkte Erwärmung) — Amidbildung.' },
            { id: 'P', label: 'Papaverin', given: false, name: 'Papaverin',
              smiles: 'COc1ccc(Cc2nccc3cc(OC)c(OC)cc23)cc1OC',
              explanation: 'Bischler-Napieralski-Cyclisierung (z. B. POCl_3, P_2O_5) bildet aus dem Amid das 3,4-Dihydroisochinolin; anschließende Dehydrierung (Pd) liefert das aromatische Isochinolin-Alkaloid Papaverin.' }
          ],
          edges: [
            { from: ['E','F'], to: 'H', reagent_above: 'Δ',           reagent_below: '-H_2O' },
            { from: ['H'],     to: 'P', reagent_above: 'POCl_3',      reagent_below: 'dann Pd, -H_2' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Stoffklasse von H',
        prompt: 'Zu welcher Stoffklasse gehört die Verbindung H?',
        choices: [
          { id: 'a', label: 'Ester',          correct: false },
          { id: 'b', label: 'sekundäres Amin', correct: false },
          { id: 'c', label: 'Säureamid',      correct: true },
          { id: 'd', label: 'Peptid',         correct: false }
        ],
        explanation: 'H trägt die R-CO-NH-R\'-Funktionalität — also ein Carbonsäureamid. (Peptide wären Amid-Bindungen zwischen α-Aminosäure-Resten, hier liegen keine α-Aminosäuren vor.)'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     LW 44 (2018) — Problem E.2: Oxybuprocain
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'lw44-2018-oxybuprocain',
    category: 'Mehrstufige Synthesen',
    name: 'Oxybuprocain — LW 2018',
    difficulty: 'C',
    source: 'ÖChO Landeswettbewerb 2018 (LW 44), Problem E.2',
    intro: 'Synthese des Lokalanästhetikums Oxybuprocain. Aus 3-Nitrobenzoesäure (B, durch Nitrierung von Benzoesäure A) werden über Reduktion → Diazotierung/Kochen → erneute Nitrierung → Veresterung → Williamson-Ether-Synthese → Hydrolyse → Veresterung mit 2-(Diethylamino)ethanol → Reduktion der Nitro-Gruppe insgesamt zehn aufeinander folgende Schritte gemacht.',
    sections: [
      {
        type: 'synthesis',
        title: 'Aromaten-Funktionalisierung (A → E)',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: false, name: 'Benzoesäure',
              smiles: 'OC(=O)c1ccccc1',
              explanation: 'Ausgangsmaterial.' },
            { id: 'B', label: 'B', given: false, name: '3-Nitrobenzoesäure',
              smiles: 'OC(=O)c1cccc([N+](=O)[O-])c1',
              note: 'Summenformel C_7H_5NO_4. Die -COOH-Gruppe dirigiert meta, also Nitrierung in 3-Position.',
              explanation: 'Elektrophile aromatische Nitrierung (HNO_3 / H_2SO_4, SE).' },
            { id: 'C', label: 'C', given: false, name: '3-Aminobenzoesäure',
              smiles: 'OC(=O)c1cccc(N)c1',
              explanation: 'Reduktion der NO_2- zur NH_2-Gruppe (Fe/HCl oder H_2/Kat. oder Sn/HCl).' },
            { id: 'D', label: 'D', given: false, name: '3-Hydroxybenzoesäure',
              smiles: 'OC(=O)c1cccc(O)c1',
              explanation: 'Diazotierung mit NaNO_2/HCl bei 0°C → Aryldiazonium-Salz. Erwärmen in Wasser ersetzt -N_2^+ durch -OH (SN am Aryl).' },
            { id: 'E', label: 'E', given: false, name: '3-Hydroxy-4-nitrobenzoesäure',
              smiles: 'OC(=O)c1ccc([N+](=O)[O-])c(O)c1',
              explanation: 'Erneute Nitrierung: die OH-Gruppe dirigiert ortho/para, -COOH dirigiert meta — gemeinsam ergibt das Position 4 (ortho zu OH, meta zu COOH). Mechanismus: SE.' }
          ],
          edges: [
            { from: ['A'], to: 'B', reagent_above: 'HNO_3 / H_2SO_4', reagent_below: 'SE' },
            { from: ['B'], to: 'C', reagent_above: 'Fe / HCl',         reagent_below: 'Reduktion' },
            { from: ['C'], to: 'D', reagent_above: '1. NaNO_2/HCl, 0°C', reagent_below: '2. H_2O / Δ' },
            { from: ['D'], to: 'E', reagent_above: 'HNO_3 / H_2SO_4',  reagent_below: 'SE' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Veresterung + Etherbildung + Hydrolyse (E → H)',
        scheme: {
          nodes: [
            { id: 'F', label: 'F', given: false, name: '3-Hydroxy-4-nitro-benzoesäure-ethylester',
              smiles: 'CCOC(=O)c1ccc([N+](=O)[O-])c(O)c1',
              explanation: 'Fischer-Veresterung mit Ethanol (H^+ / Δ).' },
            { id: 'G', label: 'G', given: false, name: '3-Butoxy-4-nitro-benzoesäure-ethylester',
              smiles: 'CCCCOc1cc(C(=O)OCC)ccc1[N+](=O)[O-]',
              explanation: 'Williamson-Ether-Synthese: Phenol → Phenolat (Base) → SN2 mit n-Butylbromid (oder -iodid).' },
            { id: 'H', label: 'H', given: false, name: '3-Butoxy-4-nitro-benzoesäure',
              smiles: 'CCCCOc1cc(C(=O)O)ccc1[N+](=O)[O-]',
              explanation: 'Verseifung des Ethylesters (NaOH / H_2O, dann H^+).' }
          ],
          edges: [
            { from: ['E'], to: 'F', reagent_above: 'EtOH / H^+', reagent_below: 'Δ' },
            { from: ['F'], to: 'G', reagent_above: 'n-BuBr / Base', reagent_below: 'SN2' },
            { from: ['G'], to: 'H', reagent_above: '1. NaOH',      reagent_below: '2. H^+' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Aminoalkohol J und finale Veresterung + Reduktion',
        scheme: {
          nodes: [
            { id: 'J',  label: 'J', given: false, name: '2-(Diethylamino)ethanol',
              smiles: 'CCN(CC)CCO',
              explanation: 'Aus Ethandiol via Mono-Chlorierung (HCl) und SN2 mit Diethylamin (zwei Stufen).' },
            { id: 'K',  label: 'K', given: false, name: 'Ester aus H + J',
              smiles: 'CCCCOc1cc(C(=O)OCCN(CC)CC)ccc1[N+](=O)[O-]',
              explanation: 'Veresterung der Carbonsäure H mit dem Aminoalkohol J (z. B. via H-Säurechlorid).' },
            { id: 'Ox', label: 'Oxybuprocain', given: false, name: 'Oxybuprocain',
              smiles: 'CCCCOc1cc(C(=O)OCCN(CC)CC)ccc1N',
              explanation: 'Reduktion der Nitro- zur Amino-Gruppe (Fe/HCl oder Sn/HCl oder H_2/Kat.). Das Hydrochlorid bildet sich am tertiären Amin -N(C_2H_5)_2 (basischste Stelle).',
              related_reaction_id: 'nabh4-lialh4' }
          ],
          edges: [
            { from: ['H','J'], to: 'K', reagent_above: 'H^+ / Δ', reagent_below: '-H_2O' },
            { from: ['K'],      to: 'Ox', reagent_above: 'Fe / HCl', reagent_below: 'NO_2 → NH_2' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Wo bildet sich das Oxybuprocain-Hydrochlorid?',
        prompt: 'Oxybuprocain liegt im Medikament meist als Hydrochlorid vor. An welcher Gruppe protoniert HCl bevorzugt?',
        choices: [
          { id: 'a', label: 'aromatische -NH_2-Gruppe',  correct: false },
          { id: 'b', label: '-N(C_2H_5)_2-Gruppe',       correct: true },
          { id: 'c', label: '-COO-Gruppe',               correct: false },
          { id: 'd', label: 'O am Aromaten (Ether)',     correct: false }
        ],
        explanation: 'Tertiäre aliphatische Amine sind stärkere Basen als aromatische Amine (durch elektronenschiebende Alkyl-Gruppen ohne mesomere Verdünnung). Das HCl protoniert daher das Diethylamin am Alkyl-N.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     LW 50 (2024) — Problem D.1: GHB → GBL (1-step intramolekulare Veresterung)
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'lw50-2024-ghb-gbl',
    category: 'Mehrstufige Synthesen',
    name: 'GHB → GBL (Lactonbildung) — LW 2024',
    difficulty: 'A',
    source: 'ÖChO Landeswettbewerb 2024 (LW 50), Problem D.1 g/h',
    intro: 'Sehr kurze Synthese (1 Schritt): 4-Hydroxybutansäure (GHB, „Liquid Ecstasy") cyclisiert unter Säurekatalyse durch intramolekulare Veresterung zum γ-Butyrolacton (GBL).',
    sections: [
      {
        type: 'synthesis',
        title: 'Lactonbildung',
        scheme: {
          nodes: [
            { id: 'GHB', label: 'GHB', given: true,  name: '4-Hydroxybutansäure (γ-Hydroxybuttersäure)',
              smiles: 'OCCCC(=O)O',
              explanation: 'Edukt — eine δ-Hydroxysäure mit der OH-Gruppe in geeignetem Abstand für 5-Ring-Bildung.' },
            { id: 'GBL', label: 'GBL', given: false, name: 'γ-Butyrolacton (GBL)',
              smiles: 'O=C1CCCO1',
              explanation: 'Intramolekulare Veresterung (säurekatalysiert): die -OH am C4 greift den protonierten Carbonyl-C nucleophil an, ein γ-Lacton (5-Ring) wird gebildet, Wasser wird frei. γ-Lactone sind besonders stabil (Baldwin-Regel: 5-exo-trig-Schluss).' }
          ],
          edges: [
            { from: ['GHB'], to: 'GBL', reagent_above: 'H^+ / Δ', reagent_below: '-H_2O' }
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
