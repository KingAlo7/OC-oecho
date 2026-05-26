/**
 * BW batch 1 — major syntheses from BW50 (2024) and BW51 (2025).
 *
 * BW50 has 4 organic problems (stilbene bromination, Merrilacton,
 * Vitamin E side-chain, Tyr-Asp dipeptide synthesis).
 * BW51 has 4 organic problems (Phenylketonuria pathway, Sapropterin,
 * Farnesol, Fettsäure biosynthesis).
 *
 * Chemistry transcribed from the published Lösungen. Prompts are
 * paraphrased briefly; source is cited per entry. Local only.
 */
const fs = require('fs');
const path = require('path');
const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const data = JSON.parse(fs.readFileSync(QFILE, 'utf8'));
const existing = new Set(data.map(q => q.id));

const ENTRIES = [
  /* ════════════════════════════════════════════════════════════════════
     BW 50 (2024) — Aufgabe 2 B: Merrilacton-Synthese
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw50-2024-merrilacton',
    category: 'Mehrstufige Synthesen',
    name: 'Merrilacton A — BW 2024',
    difficulty: 'D',
    source: 'ÖChO Bundeswettbewerb 2024 (BW 50), Aufgabe 2 B',
    intro: 'Synthese des Merrilactons A — ein Naturstoff mit neuroprotektiver Wirkung (sesquiterpene Lacton aus Illicium merrillianum). Ausgangspunkt ist eine [4+2]-Cycloaddition eines TDBMS-geschützten Diens mit 2,3-Dimethyl-maleinsäureanhydrid. Es folgen Esterspaltung, Decarboxylierung, Ester-Veresterung (Carbonatbildung), Reduktion, Ozonolyse, intramolekulare Aldol-Cyclisierung, Claisen-Johnson-Umlagerung und Iodlactonisierung.',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema (mit Stereochemie)',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: false, name: 'Diels-Alder-Addukt',
              smiles: 'CC1=C(C)C(=O)OC1=O.C=CC=C[CH2]O[Si](C)(C)C(C)(C)C',
              note: '[4+2]-Cycloaddition bei 165 °C — TDBMS-geschütztes Dien + Dimethylmaleinsäureanhydrid. Bicyclisches Anhydrid mit zwei cis-Methyl-Stereozentren.',
              explanation: 'Diels-Alder-[4+2]-Cycloaddition. TDBMS = tert-Butyldimethylsilyl-Ether-Schutzgruppe für den primären Alkohol.',
              related_reaction_id: 'diels-alder' },
            { id: 'B', label: 'B', given: false, name: 'B + B′: Halbester (regiosomere Paare)',
              smiles: 'OC(=O)C1(C)CC=CCC1(C)C(=O)OC',
              note: 'Methanolyse des Anhydrids → cis-Halbester. B und B′ unterscheiden sich nur in der Konstitution (welche Carbonsäure noch frei ist) → Konstitutionsisomere.',
              explanation: 'NaOMe/MeOH öffnet das Anhydrid → Halbester (C17H30O6Si). Da das Anhydrid nicht symmetrisch ist, entstehen B und B′ als Konstitutionsisomere.' },
            { id: 'C', label: 'C', given: false, name: 'C + C′: gemischte Carbonate',
              smiles: 'O=C(OC(=O)OC)OC(=O)C1(C)CC=CCC1(C)C(=O)OC',
              note: 'C19H32O8Si.',
              explanation: 'Methylchloroformiat (Cl-CO2Me) acyliert die freie Carbonsäure → gemischtes Anhydrid (Carbonat).' },
            { id: 'D', label: 'D', given: false, name: 'Dialdehyd (nach Ozonolyse)',
              smiles: 'O=CC[C@]1(C)CC[C@@](C=O)(C(=O)OC)CC1',
              note: 'TDBMS noch dran — vereinfacht hier nicht gezeigt.',
              explanation: '1. O3 spaltet die C=C-Bindung der Cyclohexen-Brücke; 2. (CH3)2S reduziert das Ozonid zum Dialdehyd.',
              related_reaction_id: 'ozonolyse-oxidativ' },
            { id: 'E', label: 'E', given: false, name: 'Aldol-cyclisiertes Lacton',
              smiles: 'O=C1OC2CC=C[C@H]2[C@@H](C=O)[C@@]1(C)C',
              note: 'Basenkatalysierte intramolekulare Aldol → 5-Ring; Cyclisierung des Carbonsäureanteils mit benachbartem Alkohol gibt das Lacton.',
              explanation: 'Intramolekulare Aldol-Cyclisierung mit anschließender H2O-Eliminierung. Reagenz Y = NaBH4 für die nachfolgende Reduktion.' },
            { id: 'Y', label: 'Y', given: false, name: 'Reagenz Y',
              smiles: '[Na+].[BH4-]',
              note: 'Summenformel NaBH4.',
              explanation: 'NaBH4 reduziert die noch freie Aldehyd- oder Carbonyl-Gruppe selektiv zum Alkohol.' },
            { id: 'F', label: 'F', given: false, name: 'Iodlacton (vor finaler Cyclisierung)',
              smiles: 'O=C1O[C@@H]2C[C@H]([C@@]1(C)C)C(=C2)CI',
              note: 'Claisen-Johnson-Umlagerung + Iodlactonisierung.',
              explanation: 'Claisen-Johnson-Orthoester-Umlagerung führt die Carbon-Säure-Funktion ein; LiOH spaltet den Ester; I2/NaHCO3 cyclisiert via Iodlactonisierung zum finalen 5,5,5-Tricyclus mit angeknüpftem CH2I — Vorläufer von Merrilacton A.' }
          ],
          edges: [
            { from: ['A'], to: 'B', reagent_above: 'NaOMe / MeOH',     reagent_below: 'Halbester' },
            { from: ['B'], to: 'C', reagent_above: 'Cl-CO_2Me',         reagent_below: 'Carbonat' },
            { from: ['C'], to: 'D', reagent_above: '1. O_3',            reagent_below: '2. (CH_3)_2S' },
            { from: ['D'], to: 'E', reagent_above: 'Base (Cyclisierung)', reagent_below: '-H_2O' },
            { from: ['E','Y'], to: 'F', reagent_above: '1. Claisen-Johnson', reagent_below: '2. LiOH, dann I_2 / NaHCO_3' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Isomerie B vs B′',
        prompt: 'In welcher Isomeriebeziehung stehen B und B′ (bzw. C und C′)?',
        choices: [
          { id: 'a', label: 'Enantiomere',          correct: false },
          { id: 'b', label: 'Diastereomere',        correct: false },
          { id: 'c', label: 'Konstitutionsisomere', correct: true },
          { id: 'd', label: 'Konformere',           correct: false }
        ],
        explanation: 'B und B′ unterscheiden sich darin, welche Carboxyl-Gruppe noch frei ist und welche bereits zum Methylester umgesetzt wurde — also unterschiedliche Atomverknüpfungen → Konstitutionsisomere.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     BW 50 (2024) — Aufgabe 2 C: Vitamin E Seitenkette
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw50-2024-vitamin-e',
    category: 'Mehrstufige Synthesen',
    name: 'Vitamin E — Seitenketten-Synthese (BW 2024)',
    difficulty: 'C',
    source: 'ÖChO Bundeswettbewerb 2024 (BW 50), Aufgabe 2 C',
    intro: 'Stereoselektive Synthese eines Bausteins für die Vitamin-E-Seitenkette aus einem chiralen Tosylat-Edukt. Über Nitril, Aldehyd, Alkin-Anbau und cis/trans-selektive Reduktion entstehen die diastereomeren Allylalkohole D und D′.',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema',
        scheme: {
          nodes: [
            { id: 'Ed', label: 'Ed', given: true,  name: 'Edukt — chirales (R)-Tosylat',
              smiles: 'CC(C)(C)OC[C@@H](C)COS(=O)(=O)c1ccc(C)cc1',
              explanation: 't-BuO-CH2-CHMe-CH2-OTs. OTs ist eine ausgezeichnete Abgangsgruppe.' },
            { id: 'A',  label: 'A',  given: false, name: 'Nitril (SN-Produkt)',
              smiles: 'CC(C)(C)OC[C@@H](C)CC#N',
              explanation: 'SN: Cyanid substituiert das Tosylat.',
              related_reaction_id: 'sn2-alkylhalogenid' },
            { id: 'B',  label: 'B',  given: false, name: 'Aldehyd',
              smiles: 'CC(C)(C)OC[C@@H](C)CC=O',
              note: 'C9H18O2.',
              explanation: 'iBu2AlH (DIBAL-H) reduziert das Nitril selektiv zum Aldehyd.' },
            { id: 'C',  label: 'C',  given: false, name: 'Propargylalkohol (Alkin-Addukt)',
              smiles: 'CC(C)(C)OCC(C)CC(O)C#C',
              note: 'C + C′ als Stereoisomere (zwei neue Stereozentren am Alkin-Kohlenstoff).',
              explanation: 'Ethinyl-Lithium (Li-C≡CH) addiert nucleophil an den Aldehyd → sekundärer Alkohol mit terminalem Alkin.' },
            { id: 'X',  label: 'X',  given: false, name: 'Reagenz X',
              smiles: '[Mg]', note: 'Magnesium-Span — bildet Grignard.',
              explanation: 'Grignard-Reagenz-Bildung aus dem primären Bromid (in den vorgelagerten Schritten).' },
            { id: 'Y',  label: 'Y',  given: false, name: 'Reagenz Y',
              smiles: 'CC#CC=O', note: 'Propinal (2-Butin-1-al).',
              explanation: 'Y wird als Carbonyl-Partner für die nachfolgende Grignard-Addition eingesetzt.' },
            { id: 'D',  label: 'D',  given: false, name: '(E)-Allylalkohol',
              smiles: 'CC(C)(C)OCC(C)C[C@@H](O)/C=C/C',
              explanation: 'Birch-artige Reduktion mit Na/NH3 (flüssig) liefert das (E)-Alken aus dem Alkin.' },
            { id: 'Dp', label: 'D′', given: false, name: '(Z)-Allylalkohol',
              smiles: 'CC(C)(C)OCC(C)C[C@@H](O)/C=C\\C',
              explanation: 'Lindlar-artige Hydrierung (H2/Pd-PbAc2) liefert das (Z)-Alken — diastereomer zu D bezüglich der Doppelbindungsgeometrie.' }
          ],
          edges: [
            { from: ['Ed'], to: 'A', reagent_above: 'NaCN',           reagent_below: 'SN' },
            { from: ['A'],  to: 'B', reagent_above: 'iBu_2AlH (DIBAL)', reagent_below: '' },
            { from: ['B'],  to: 'C', reagent_above: '1. Li-C≡CH',       reagent_below: '2. H_3O^+' },
            { from: ['C'],  to: 'D', reagent_above: 'Na / NH_3 (l)',   reagent_below: '(E)-Alken' },
            { from: ['C'],  to: 'Dp', reagent_above: 'H_2 / Pd-PbAc_2', reagent_below: '(Z)-Alken (Lindlar)' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Tosylat vs Hydroxid',
        prompt: 'Welche Aussagen zur Tosylat-Abgangsgruppe (OTs^-) treffen zu?',
        choices: [
          { id: 'a', label: 'TsO^- ist ein schwächeres Nukleophil als OH^-',          correct: true },
          { id: 'b', label: 'OH^- ist im Vergleich zu TsO^- weniger reaktiv (Nukleophil)', correct: false },
          { id: 'c', label: 'OH^- ist die bessere Abgangsgruppe',                       correct: false },
          { id: 'd', label: 'Die negative Ladung ist im TsO^- mesomeriestabilisiert',   correct: true }
        ],
        explanation: 'TsO^- ist eine sehr gute Abgangsgruppe, weil die negative Ladung am Sulfonat über drei Sauerstoffe mesomeriestabilisiert ist. OH^- ist umgekehrt das bessere Nukleophil aber die schlechtere Abgangsgruppe.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     BW 50 (2024) — Aufgabe 2 D: Tyr-Asp Dipeptid-Synthese
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw50-2024-tyr-asp-dipeptid',
    category: 'Mehrstufige Synthesen',
    name: 'Tyr-Asp Dipeptid — BW 2024',
    difficulty: 'C',
    source: 'ÖChO Bundeswettbewerb 2024 (BW 50), Aufgabe 2 D',
    intro: 'Synthese des Dipeptids Tyr-Asp via klassischer Phthalimid-Schutzgruppen-Strategie (Gabriel) + Festphasen-artige DCC-Kupplung. Ausgangspunkt ist das Kaliumphthalimid + Diethylbrommalonat. Über Alkylierung mit 4-Brommethylphenol, Verseifung, Decarboxylierung, Boc-Schutz, DCC-Kupplung an Asparaginsäure-Träger und finale Entschützung entsteht Tyr-Asp (H, C13H16N2O6).',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema',
        scheme: {
          nodes: [
            { id: 'A',  label: 'A',  given: false, name: 'Phthalimid-Diethylmalonat',
              smiles: 'O=C1c2ccccc2C(=O)N1C(C(=O)OCC)C(=O)OCC',
              explanation: 'Kalium-phthalimid (Gabriel) + Diethyl-brommalonat → SN am sp3-C. Phthalimid schützt das spätere α-Amin.' },
            { id: 'Am', label: 'A^-', given: false, name: 'Malonat-Carbanion',
              smiles: 'O=C1c2ccccc2C(=O)N1[C-](C(=O)OCC)C(=O)OCC',
              explanation: 'NaOEt deprotoniert die acidic α-CH des Diethylmalonats — bereit für Alkylierung.' },
            { id: 'X',  label: 'X',  given: false, name: 'Alkylierungs-Reagenz',
              smiles: 'OC1=CC=C(CBr)C=C1',
              note: '4-Brommethylphenol.',
              explanation: 'Elektrophil für die SN-Alkylierung.' },
            { id: 'B',  label: 'B',  given: false, name: 'Alkyliertes Phthalimid-Diethylmalonat',
              smiles: 'O=C1c2ccccc2C(=O)N1C(Cc1ccc(O)cc1)(C(=O)OCC)C(=O)OCC',
              explanation: 'Das Carbanion A^- greift X (4-Brommethylphenol) an — SN am Benzyl-Position. Der nukleophil substituierte C trägt nun den Tyrosin-Phenol-Seitenketten-Vorläufer.' },
            { id: 'C',  label: 'C',  given: false, name: 'Phthalat-Dianion (Nebenprodukt)',
              smiles: '[O-]C(=O)c1ccccc1C(=O)[O-]',
              note: 'C nicht im weiteren Verlauf eingesetzt.',
              explanation: 'Bei der NaOH-Verseifung von B entsteht neben dem Tyrosin-Vorläufer (D) auch das Phthalat-Anion C als Nebenprodukt.' },
            { id: 'D',  label: 'D',  given: false, name: 'Tyrosin als Malonsäure-Dianion',
              smiles: 'N[C@](Cc1ccc(O)cc1)(C(=O)[O-])C(=O)[O-]',
              explanation: 'NaOH spaltet Phthalimid (→ Phthalat C) und beide Ester (→ Dicarboxylat) gleichzeitig.' },
            { id: 'E',  label: 'E',  given: false, name: 'L-Tyrosin (nach Decarboxylierung)',
              smiles: 'N[C@@H](Cc1ccc(O)cc1)C(=O)O',
              explanation: 'Thermische Decarboxylierung (-CO2) eines der beiden COOH-Gruppen liefert die freie α-Amino-säure L-Tyrosin.' },
            { id: 'F',  label: 'F',  given: false, name: 'N-Boc-L-Tyrosin',
              smiles: 'CC(C)(C)OC(=O)N[C@@H](Cc1ccc(O)cc1)C(=O)O',
              explanation: 'Boc-Schutzgruppe für das α-Amin (mit Boc2O); die Carboxyl-Gruppe bleibt frei für die nachfolgende Kupplung.' },
            { id: 'G',  label: 'G',  given: false, name: 'Tyr-Asp-Kupplungsprodukt (Boc, Bn-Schutz)',
              smiles: 'CC(C)(C)OC(=O)N[C@@H](Cc1ccc(O)cc1)C(=O)N[C@@H](CC(=O)OCc1ccccc1)C(=O)OC',
              note: 'Asp ist hier mit Bn (Benzyl-Ester) geschützt und am Polymer-Träger.',
              explanation: 'DCC (Dicyclohexylcarbodiimid) aktiviert die Carbonsäure von F durch Bildung des O-Acylharnstoffs; die Amino-Gruppe des Asp-Trägers greift nukleophil an → Amid-Bindung.' },
            { id: 'H',  label: 'H', given: false, name: 'Tyr-Asp (Dipeptid)',
              smiles: 'N[C@@H](Cc1ccc(O)cc1)C(=O)N[C@@H](CC(=O)O)C(=O)O',
              note: 'C13H16N2O6 (S,S-Konfiguration an beiden α-C). Freies N- und C-Terminus.',
              explanation: '1. H2/Pd-Katalysator entfernt den Benzyl-Ester (Hydrogenolyse). 2. Konz. HCl entfernt die Boc-Gruppe (Säurespaltung). Ergebnis: freies L-Tyr-L-Asp Dipeptid.' }
          ],
          edges: [
            { from: ['A'],   to: 'B', reagent_above: 'NaOEt, dann X', reagent_below: 'SN' },
            { from: ['B'],   to: 'D', reagent_above: 'NaOH',          reagent_below: '-Phthalat (C)' },
            { from: ['D'],   to: 'E', reagent_above: 'Δ',             reagent_below: '-CO_2' },
            { from: ['E'],   to: 'F', reagent_above: 'Boc_2O',        reagent_below: '' },
            { from: ['F'],   to: 'G', reagent_above: 'DCC, Asp(OBn)-Träger', reagent_below: 'Amid-Kupplung' },
            { from: ['G'],   to: 'H', reagent_above: '1. H_2 / Pd',   reagent_below: '2. HCl (konz.)' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Funktion von DCC',
        prompt: 'Welche Aufgabe hat das Reagenz DCC (Dicyclohexylcarbodiimid)?',
        choices: [
          { id: 'a', label: 'Base',                          correct: false },
          { id: 'b', label: 'Säure',                         correct: false },
          { id: 'c', label: 'Katalysator',                   correct: false },
          { id: 'd', label: 'Kupplungsreagenz',              correct: true },
          { id: 'e', label: 'Lösungsmittel',                 correct: false },
          { id: 'f', label: 'Aktivierung von Carboxygruppen', correct: true }
        ],
        explanation: 'DCC ist das klassische Carbodiimid-Kupplungsreagenz für Amid-Bildung in der Peptidsynthese. Es aktiviert die Carbonsäure durch Bildung des O-Acylharnstoffs, der dann vom Amin nukleophil angegriffen wird. Nebenprodukt: Dicyclohexylharnstoff (DCU).'
      },
      {
        type: 'multiple_choice',
        title: 'Mechanismus B → C',
        prompt: 'Nach welchem Reaktionsmechanismus verläuft die Reaktion von B nach C (Spaltung des Phthalimid-Rests durch NaOH)?',
        choices: [
          { id: 'a', label: 'nukleophile Substitution', correct: false },
          { id: 'b', label: 'nukleophile Addition',     correct: true  },
          { id: 'c', label: 'elektrophile Addition',    correct: false },
          { id: 'd', label: 'Eliminierung',             correct: false }
        ],
        explanation: 'Hydroxid greift nukleophil am Imid-Carbonyl an (nukleophile Addition an sp^2-C) → tetraedrisches Intermediat → Spaltung der C-N-Bindung → Phthalat + freies Amin.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     BW 51 (2025) — Aufgabe 4 B: Sapropterin-Synthese
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw51-2025-sapropterin',
    category: 'Mehrstufige Synthesen',
    name: 'Sapropterin (BH4-Analogon) — BW 2025',
    difficulty: 'D',
    source: 'ÖChO Bundeswettbewerb 2025 (BW 51), Aufgabe 4 B',
    intro: 'Synthese des Tetrahydrobiopterin-Analogons Sapropterin zur Behandlung der Phenylketonurie. Ausgangsmaterial ist trans-Methylcrotonsäureester. Über Epoxidierung mit m-CPBA, Acetonid-Schützung, Saponifizierung, Chlorierung, Azid-Substitution und Reduktion sowie Kupplung mit einem Pyrimidinon-Vorläufer und finale Reduktion/Cyclisierung entsteht Sapropterin.',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema (8 Stufen)',
        scheme: {
          nodes: [
            { id: 'Ed', label: 'Ed', given: true, name: 'trans-Methylester der Crotonsäure',
              smiles: 'COC(=O)/C=C/C',
              explanation: 'Edukt: (E)-Methylcrotonat.' },
            { id: 'A',  label: 'A', given: false, name: 'Epoxid',
              smiles: 'COC(=O)[C@@H]1O[C@@H]1C',
              explanation: 'm-CPBA (meta-Chlorperbenzoesäure) epoxidiert die C=C-Bindung stereospezifisch trans.' },
            { id: 'X',  label: 'X', given: false, name: 'Aceton',
              smiles: 'CC(C)=O',
              explanation: 'Carbonyl-Komponente für Acetonid-Bildung — bildet 5-Ring-Ketal mit dem Diol.' },
            { id: 'B',  label: 'B', given: false, name: 'Acetonid-geschütztes Säure',
              smiles: 'OC(=O)[C@@H]1OC(C)(C)O[C@H]1C',
              explanation: 'Lewis-Säure öffnet Epoxid zum Diol, das mit Aceton zum 5-Ring-Acetonid kondensiert. NaOH/EtOH verseift den Methylester zur freien Säure.' },
            { id: 'C',  label: 'C', given: false, name: 'α-Chlor-keton mit Acetonid',
              smiles: 'O=C(CCl)[C@@H]1OC(C)(C)O[C@H]1C',
              note: 'α-Chlormethyl-keton.',
              explanation: 'Aktivierung der Säure → α-Chlormethyl-keton (Friedel-Crafts-artig mit Cl-CH2-Cl).' },
            { id: 'D',  label: 'D', given: false, name: 'Aminoalkohol-Trägerstruktur (gekoppelt mit Pyrimidinon)',
              smiles: 'CC(=O)Nc1nc([N+](=O)[O-])c(NC[C@@H](O)[C@@H](O)C)nc1Cl',
              note: 'Hier ist das Stickstoff-Heterocyclus 2-Acetamido-4-chlor-5-nitropyrimidinon angeknüpft.',
              explanation: 'Aceton/NaN3 substituiert das α-Cl durch Azid; H2 (Pd/EtOH) reduziert das Azid zum primären Amin und entacetonidet — Aminodiol. Anschließend SN-Substitution am 4-Chlorpyrimidinon liefert D.' },
            { id: 'E',  label: 'E', given: false, name: 'Dihydropteridin (Heterocyclus aufgebaut)',
              smiles: 'CC(=O)Nc1nc2NCC([C@@H](O)C)=Nc2c(=O)[nH]1',
              note: 'Bildung eines weiteren Hetero-Rings (Pteridin-Kern) durch Cyclisierung.',
              explanation: 'H2/Pd/C/EtOH reduziert die Nitro-Gruppe zum Amin und cyclisiert intramolekular (Schiff-Base-Bildung) zum dihydropteridinon.' },
            { id: 'F',  label: 'F (Sapropterin)', given: false, name: 'Sapropterin',
              smiles: 'CC(=O)Nc1nc2NC[C@H]([C@@H](O)[C@H](O)C)Nc2c(=O)[nH]1',
              explanation: 'H2/Pd/C/EtOH reduziert die weniger stabile (Imin-)Doppelbindung selektiv → Tetrahydropteridinon-Grundgerüst mit chiraler Diol-Seitenkette = Sapropterin.' }
          ],
          edges: [
            { from: ['Ed'], to: 'A', reagent_above: 'm-CPBA',            reagent_below: 'Epoxidierung' },
            { from: ['A','X'], to: 'B', reagent_above: 'Lewis-Säure, dann NaOH/EtOH', reagent_below: 'Acetonid + Verseifung' },
            { from: ['B'],  to: 'C', reagent_above: 'SOCl_2 + Cl-CH_2-Cl', reagent_below: 'α-Chlorketon' },
            { from: ['C'],  to: 'D', reagent_above: '1. NaN_3 / Aceton',  reagent_below: '2. H_2/Pd, dann SN am Pyrimidinon' },
            { from: ['D'],  to: 'E', reagent_above: 'H_2 / Pd-C, EtOH',   reagent_below: 'Cyclisierung' },
            { from: ['E'],  to: 'F', reagent_above: 'H_2 / Pd-C, EtOH',   reagent_below: 'selektive Reduktion' }
          ]
        }
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     BW 51 (2025) — Aufgabe 4 D: Farnesol-Synthese
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw51-2025-farnesol',
    category: 'Mehrstufige Synthesen',
    name: 'Farnesol — BW 2025',
    difficulty: 'C',
    source: 'ÖChO Bundeswettbewerb 2025 (BW 51), Aufgabe 4 D',
    intro: 'Synthese von (2E,6E)-Farnesol, einem Sesquiterpen-Alkohol mit blumigem Aroma (aus Akazienblüten). Aus Ethyl-acetoacetat + Geranylchlorid wird über Alkylierung, Verseifung/Decarboxylierung, PCl5-Chlorierung, doppelte Eliminierung zum Alkin, formaldehyd-vermittelter Hydroxymethylierung und Cu-katalysierter Carbocupration der (2E,6E)-Trien-Alkohol aufgebaut.',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema (7 Stufen)',
        scheme: {
          nodes: [
            { id: 'Ed', label: 'Ed', given: true, name: 'Ethyl-acetoacetat + Geranylchlorid',
              smiles: 'CCOC(=O)CC(C)=O.CC(=CCCC(C)=CCCl)C',
              explanation: 'β-Ketoester + Geranylchlorid als Alkylierungspartner.' },
            { id: 'A', label: 'A', given: false, name: 'Alkylierter β-Ketoester',
              smiles: 'CCOC(=O)C(/CC=C(\\C)CCC=C(C)C)C(C)=O',
              explanation: 'NaOEt deprotoniert die acide CH2-Gruppe des β-Ketoesters; das Enolat alkyliert SN2 mit Geranylchlorid.' },
            { id: 'B', label: 'B', given: false, name: 'Methylketon (nach Verseifung + Decarboxylierung)',
              smiles: 'CC(=O)C/C=C(\\C)CCC=C(C)C',
              explanation: '1. Ba(OH)2 verseift den Ester zur freien Säure; 2. saure Aufarbeitung und Erwärmen → β-Keto-Decarboxylierung (-CO2) → Methylketon.' },
            { id: 'C', label: 'C', given: false, name: 'Vinylchlorid (gem-Dichlorid)',
              smiles: 'CC(=CC/C=C(/C)CCC=C(C)C)Cl',
              note: 'Mass-Spektrum zeigt typisches Cl-Isotopen-Muster.',
              explanation: 'PCl5 ersetzt die C=O durch geminales Cl,Cl; Eliminierung von POCl3 + HCl liefert das (E)-Vinylchlorid.' },
            { id: 'D', label: 'D', given: false, name: 'Terminales Alkin',
              smiles: 'C#CC/C=C(\\C)CCC=C(C)C',
              note: 'IR-Bande bei 2260 cm^-1 (C≡C).',
              explanation: 'NaNH2 in NH3 (l) eliminiert zweimal HCl aus dem Vinylchlorid → terminales Alkin.' },
            { id: 'E', label: 'E', given: false, name: 'Propargyl-Alkohol',
              smiles: 'OCC#CC/C=C(\\C)CCC=C(C)C',
              note: 'IR: 3300 cm^-1 (OH) + 2155 cm^-1 (C≡C).',
              explanation: 'Das deprotonierte Alkin (vom vorigen Schritt) greift Formaldehyd nukleophil an → Propargyl-Alkohol.' },
            { id: 'F', label: 'F', given: false, name: '(Z)-Vinyliodid',
              smiles: 'OC/C=C(/I)C/C=C(\\C)CCC=C(C)C',
              explanation: 'Cu-katalysierte syn-Carbometallierung + Iodierung führt zur (Z)-Vinyliodid-Stufe.' },
            { id: 'Fa', label: 'Farnesol', given: false, name: '(2E,6E)-Farnesol',
              smiles: 'CC(=CCC/C(C)=C/CC/C(C)=C/CO)C',
              note: '(2E,6E)-3,7,11-Trimethyldodeca-2,6,10-trien-1-ol.',
              explanation: 'Me2CuLi (Gilman-Reagenz) liefert via Methyl-Übertragung das (E)-konfigurierte Methylvinyl-Produkt — Farnesol.' }
          ],
          edges: [
            { from: ['Ed'], to: 'A', reagent_above: 'NaOEt / EtOH',    reagent_below: 'SN-Alkylierung' },
            { from: ['A'],  to: 'B', reagent_above: '1. Ba(OH)_2',     reagent_below: '2. HCl, Δ, -CO_2' },
            { from: ['B'],  to: 'C', reagent_above: 'PCl_5',           reagent_below: '-POCl_3' },
            { from: ['C'],  to: 'D', reagent_above: 'NaNH_2 / NH_3(l)', reagent_below: 'doppelte Eliminierung' },
            { from: ['D'],  to: 'E', reagent_above: 'H_2CO',           reagent_below: 'Propargylalkohol' },
            { from: ['E'],  to: 'F', reagent_above: 'Cu-Kat., I_2',    reagent_below: '(Z)-Vinyliodid' },
            { from: ['F'],  to: 'Fa', reagent_above: 'Me_2CuLi',       reagent_below: '(E)-Methyl-Vinyl' }
          ]
        }
      },
      {
        type: 'short_answer',
        title: 'Anzahl Stereoisomere von Farnesol',
        prompt: 'Wie viele Stereoisomere kann Farnesol grundsätzlich haben?',
        expected_answer: '4. Farnesol hat zwei C=C-Doppelbindungen mit definierter E/Z-Geometrie (an C2 und C6). Jede Doppelbindung kann unabhängig E oder Z sein → 2^2 = 4 Stereoisomere ((2E,6E), (2E,6Z), (2Z,6E), (2Z,6Z)). Die terminale Doppelbindung an C10 hat keine cis/trans-Beziehung (gem-Dimethyl).'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     BW 51 (2025) — Aufgabe 4 A: Phenylketonurie (PKU) — Stoffwechsel
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw51-2025-phenylketonurie',
    category: 'Mehrstufige Synthesen',
    name: 'Phenylketonurie — Stoffwechselpfade von Phenylalanin (BW 2025)',
    difficulty: 'C',
    source: 'ÖChO Bundeswettbewerb 2025 (BW 51), Aufgabe 4 A',
    intro: 'Stoffwechselpfade rund um Phenylalanin. Bei PKU fehlt die Phenylalanin-Hydroxylase (A→G) und Phenylalanin wird stattdessen über alternative Pfade abgebaut: Decarboxylierung zu Phenethylamin (F, Neurotransmitter), Transaminierung mit α-Ketoglutarat (A+W→B+X, PLP als Cofaktor), oxidative Decarboxylierung zu Phenylacetat-Derivaten (B→C, B→D), Hydrolyse-Produkte (E).',
    sections: [
      {
        type: 'synthesis',
        title: 'PKU-Stoffwechselschema',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: true,  name: 'L-Phenylalanin',
              smiles: 'N[C@@H](Cc1ccccc1)C(=O)O',
              explanation: 'Essentielle Aminosäure. Substrat aller folgenden Pfade.' },
            { id: 'W', label: 'W', given: true,  name: 'α-Ketoglutarat (Cosubstrat)',
              smiles: 'OC(=O)CCC(=O)C(=O)O',
              explanation: 'Cosubstrat der Transaminase.' },
            { id: 'F', label: 'F', given: false, name: 'β-Phenethylamin (Neurotransmitter)',
              smiles: 'NCCc1ccccc1',
              explanation: 'A → F: Decarboxylase-katalysierte Decarboxylierung (-CO2). Klasse: Lyase.' },
            { id: 'G', label: 'G', given: false, name: 'L-Tyrosin',
              smiles: 'N[C@@H](Cc1ccc(O)cc1)C(=O)O',
              explanation: 'A → G: Phenylalanin-Hydroxylase hydroxyliert die para-Position des Aromaten. Klasse: Oxidoreduktase. Bei PKU defekt.' },
            { id: 'B', label: 'B', given: false, name: 'Phenylpyruvat',
              smiles: 'O=C(C(=O)O)Cc1ccccc1',
              explanation: 'A + W → B + X: Pyridoxalphosphat (PLP)-abhängige Transaminase überträgt die α-Aminogruppe von Phenylalanin auf α-Ketoglutarat. Klasse: Transferase.' },
            { id: 'X', label: 'X', given: false, name: 'L-Glutamat',
              smiles: 'N[C@@H](CCC(=O)O)C(=O)O',
              explanation: 'X entsteht durch Hydrolyse aus dem PLP-Glutamat-Schiff-Base-Intermediat Y.' },
            { id: 'C', label: 'C', given: false, name: 'Phenyllactat',
              smiles: 'OC(Cc1ccccc1)C(=O)O',
              explanation: 'B → C: Reduktion der α-Carbonyl-Gruppe durch NADH (Oxidoreduktase).' },
            { id: 'D', label: 'D', given: false, name: 'Phenylacetat',
              smiles: 'OC(=O)Cc1ccccc1',
              explanation: 'B → D: oxidative Decarboxylierung (-CO2, -NADH).' },
            { id: 'E', label: 'E', given: false, name: 'Phenylacetyl-Glutamin',
              smiles: 'NC(=O)CC[C@@H](NC(=O)Cc1ccccc1)C(=O)O',
              note: 'C13H16N2O4.',
              explanation: 'D + Glutamin → Amid (Glutaminkonjugat). Wird im Urin ausgeschieden.' },
            { id: 'Y', label: 'Y', given: false, name: 'Aldimin (PLP-Schiff-Base mit Glu)',
              smiles: 'Cc1[nH+]cc(COP(=O)(O)O)c(/C=N/[C@@H](CCC(=O)O)C(=O)O)c1O',
              note: 'Cofaktor-Schiff-Base; X entsteht durch Hydrolyse von Y.',
              explanation: 'Cofaktor-Intermediat: Pyridoxalphosphat (PLP) trägt vorübergehend die NH2-Gruppe als externes Aldimin.' }
          ],
          edges: [
            { from: ['A'], to: 'F', reagent_above: 'Decarboxylase',         reagent_below: '-CO_2 (Lyase)' },
            { from: ['A'], to: 'G', reagent_above: 'Phenylalanin-Hydroxylase', reagent_below: 'Oxidoreduktase' },
            { from: ['A','W'], to: 'B', reagent_above: 'Transaminase (PLP)', reagent_below: 'Transferase' },
            { from: ['A','W'], to: 'X', reagent_above: '+ via Y',            reagent_below: '' },
            { from: ['B'], to: 'C', reagent_above: 'NADH/H^+',               reagent_below: 'Oxidoreduktase' },
            { from: ['B'], to: 'D', reagent_above: 'NAD^+, -CO_2',           reagent_below: 'NADH/H^+' },
            { from: ['D'], to: 'E', reagent_above: 'Glutamin',               reagent_below: '-H_2O' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Enzymklasse A → F',
        prompt: 'Zu welcher Enzymklasse gehört die Decarboxylierung A → F?',
        choices: [
          { id: 'a', label: 'Lyase',          correct: true  },
          { id: 'b', label: 'Oxidoreduktase', correct: false },
          { id: 'c', label: 'Transferase',    correct: false },
          { id: 'd', label: 'Hydrolase',      correct: false }
        ],
        explanation: 'Lyasen spalten Bindungen ohne Hydrolyse oder Redox-Schritt. Decarboxylasen (-CO2) sind klassische Lyasen.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     BW 51 (2025) — Aufgabe 5: Fettsäure-Biosynthese
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw51-2025-fettsaeure-biosynthese',
    category: 'Mehrstufige Synthesen',
    name: 'Fettsäure-Biosynthese (Palmitinsäure) — BW 2025',
    difficulty: 'B',
    source: 'ÖChO Bundeswettbewerb 2025 (BW 51), Aufgabe 5',
    intro: 'Schrittweise Verlängerung der Fettsäure-Kette aus Acetyl-CoA und Malonyl-CoA-Einheiten an der Fettsäure-Synthase. Pro Cyclus eine C2-Verlängerung; für Palmitinsäure (C16) sind 7 Cyclen nötig. Cofaktoren: NADPH/H^+ (×2 pro Cyclus). Enzyme: AC (Acetyl-CoA-Carboxylase), KS, KR, HD, ER.',
    sections: [
      {
        type: 'synthesis',
        title: 'Aktivierung: Bildung von Malonyl-CoA',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: false, name: 'Carboxyphosphat (aktivierter HCO_3^-)',
              smiles: 'OC(=O)OP(=O)(O)O',
              explanation: 'Hydrogencarbonat + ATP → A (Phosphat-Adapter) + B (ADP). Aktivierungsschritt.' },
            { id: 'B', label: 'B', given: false, name: 'ADP',
              smiles: 'Nc1ncnc2c1ncn2C1OC(COP(=O)(O)OP(=O)(O)O)C(O)C1O',
              note: 'Adenosindiphosphat.' },
            { id: 'C', label: 'C', given: false, name: 'Carboxybiotin-Enzym',
              smiles: 'O=C(O)N1C(=O)NC2CSC(CCCCC(=O)N-Enzym)C12',
              note: 'CO_2-übertragender Cofaktor: Biotin.',
              explanation: 'Biotin-Enzym wird durch CO2 von A carboxyliert → Biotin-Enzym-COO^-.' },
            { id: 'D', label: 'D', given: false, name: 'Phosphat',
              smiles: 'OP(=O)(O)O',
              note: 'PO_4^{3-}.' },
            { id: 'E', label: 'E', given: false, name: 'CoA-SH',
              smiles: 'CC(C)(COP(=O)(O)OP(=O)(O)OCC1OC(n2cnc3c(N)ncnc32)C(OP(=O)(O)O)C1O)C(O)C(=O)NCCC(=O)NCCS',
              note: 'Coenzym A — der Schwefel ist die reaktive Thiol-Gruppe.',
              explanation: 'Acetyl-CoA wird durch Carboxybiotin am α-C carboxyliert → Malonyl-CoA. CoA-SH ist Cofaktor-Träger.' },
            { id: 'M', label: 'Malonyl-CoA', given: false, name: 'Malonyl-CoA',
              smiles: 'OC(=O)CC(=O)SCCNC(=O)CCNC(=O)C(O)C(C)(C)COP(=O)(O)OP(=O)(O)OCC1OC(n2cnc3c(N)ncnc32)C(OP(=O)(O)O)C1O',
              explanation: 'Schlüssel-Synthon für die FS-Biosynthese — der α-C ist nukleophil (Enol-/Enolat-Form), die β-Carboxyl-Gruppe wird beim nächsten Cycluselemt-Spaltung als CO_2 freigesetzt.' }
          ],
          edges: [
            { from: ['B'], to: 'M', reagent_above: 'Acetyl-CoA + Carboxybiotin (C)', reagent_below: 'D abgespalten' }
          ]
        }
      },
      {
        type: 'short_answer',
        title: 'Anzahl Cyclen für Palmitinsäure',
        prompt: 'Wie oft muss der Verlängerungscyclus der Fettsäure-Biosynthese durchlaufen werden, um Palmitinsäure (C16, Hexadecansäure) herzustellen?',
        expected_answer: '7 Cyclen. Jeder Cyclus verlängert um C2 (von Malonyl-CoA). Start ist Acetyl-CoA (C2). 2 + 7×2 = 16 C-Atome. Palmitinsäure-SMILES: CCCCCCCCCCCCCCCC(=O)O.'
      },
      {
        type: 'multiple_choice',
        title: 'Funktionelle Gruppen im FS-Schema',
        prompt: 'Wie heißen die beiden funktionellen Gruppen am Enzym-Komplex bzw. CoA, die im FS-Biosynthese-Schema markiert sind?',
        choices: [
          { id: 'a', label: '-SH (Thiol) und R-CO-S-CoA (Thioester)',  correct: true  },
          { id: 'b', label: '-OH (Hydroxyl) und R-CO-O-R′ (Ester)',     correct: false },
          { id: 'c', label: '-NH_2 (Amin) und R-CO-NH-R′ (Amid)',       correct: false },
          { id: 'd', label: '-PO_3H (Phosphat) und R-O-PO_3 (Ester)',   correct: false }
        ],
        explanation: 'Das ACP (Acyl-Carrier-Protein) trägt eine -SH-Gruppe, an die der Acyl-Rest als Thioester gebunden wird. Coenzym A (CoA-SH) bringt eine zweite -SH mit; die Beladung gibt einen Thioester R-CO-S-CoA.'
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
