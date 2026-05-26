/**
 * BW batch 7 — BW44 (2018) Aufgabe 3: Organische Synthesen
 *   A. Lactid → Polylactid (PLA)
 *   B. Kaffeesäure & Kaffeesäure-Ester (HWE + Aldol-Route)
 *   C. Colchicin (Kurzfassung — zu komplex für volles Schema)
 */
const fs = require('fs');
const path = require('path');
const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const data = JSON.parse(fs.readFileSync(QFILE, 'utf8'));
const existing = new Set(data.map(q => q.id));

const ENTRIES = [
  /* ════════════════════════════════════════════════════════════════════
     A. Lactid → Polylactid (PLA)
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw44-2018-lactid-pla',
    category: 'Mehrstufige Synthesen',
    name: 'Lactid → Polylactid (PLA) — BW 2018',
    difficulty: 'B',
    source: 'ÖChO Bundeswettbewerb 2018 (BW 44), Aufgabe 3 A',
    intro: 'Lactid (LA) ist das cyclische Dimer der Milchsäure (cyclischer Diester, 1,4-Dioxan-2,5-dion-Gerüst). Es bildet drei Stereoisomere: (R,R), (S,S) und meso (R,S). Bei Ringöffnungspolymerisation (ROP) mit NaOMe entsteht das Polyester PLA (Polylactid) — ein biologisch abbaubarer Kunststoff. Saure Hydrolyse liefert (R)-2-Hydroxypropansäure.',
    sections: [
      {
        type: 'synthesis',
        title: 'Stereoisomere des Lactids (3.1)',
        scheme: {
          nodes: [
            { id: 'RR', label: '(R,R)-Lactid', given: false,
              name: '(3R,6R)-3,6-Dimethyl-1,4-dioxan-2,5-dion',
              smiles: 'C[C@H]1OC(=O)[C@H](C)OC1=O',
              explanation: 'Beide Stereozentren R. Enantiomer der (S,S)-Form.' },
            { id: 'SS', label: '(S,S)-Lactid', given: false,
              name: '(3S,6S)-3,6-Dimethyl-1,4-dioxan-2,5-dion',
              smiles: 'C[C@@H]1OC(=O)[C@@H](C)OC1=O',
              explanation: 'Spiegelbild von (R,R).' },
            { id: 'RS', label: 'meso-Lactid', given: false,
              name: '(3R,6S)-3,6-Dimethyl-1,4-dioxan-2,5-dion',
              smiles: 'C[C@H]1OC(=O)[C@@H](C)OC1=O',
              note: 'Die zwei Stereozentren sind „inneres Spiegelbild" — Verbindung achiral (meso).',
              explanation: 'Ein C ist R, der andere S → interne Spiegelebene → meso (achiral, obwohl 2 Stereozentren vorhanden).' }
          ],
          edges: []
        }
      },
      {
        type: 'synthesis',
        title: 'Ringöffnungspolymerisation (ROP) zu PLA (3.2)',
        scheme: {
          nodes: [
            { id: 'LA', label: 'Lactid', given: true,
              name: 'Lactid (cyclisches Dimer)',
              smiles: 'C[C@H]1OC(=O)[C@H](C)OC1=O',
              explanation: 'Cyclischer Diester der Milchsäure (R,R-Form gezeigt).' },
            { id: 'I', label: 'Initiator', given: false,
              name: 'Erstes Ring-Öffnungs-Produkt (Initiation)',
              smiles: 'COC(=O)[C@@H](C)O[C@@H](C)C(=O)[O-].[Na+]',
              note: '1. Initiation: das Methanolat-Anion (NaOMe → CH_3O^-) greift einen der Ester-C=O nukleophil an (A_N) → tetraedrisches Intermediat → Ring-Öffnung mit dem zweiten Ester-O als Abgangsgruppe → offenkettiges Dimer-Alkoholat.',
              explanation: 'Initiation der ROP.' },
            { id: 'P', label: 'Polylactid', given: false,
              name: 'Polylactid (PLA) — n Wiederholungseinheiten',
              smiles: 'CO[C@@H](C)C(=O)O[C@@H](C)C(=O)O[C@@H](C)C(=O)O[C@@H](C)C(=O)O',
              note: 'Polymer aus Wiederholungseinheit -O-CH(CH_3)-C(=O)-. Ester-Verknüpfung → Polyester.',
              explanation: '2. Propagation: das gebildete Alkoholat greift erneut ein Lactid an → kettenverlängerung. 3. Termination: H_3O^+ protoniert das Endalkoholat → -OH-Kettenende. Repetitive Einheit: -O-CH(CH_3)-C(=O)-.' },
            { id: 'M', label: 'Milchsäure', given: false,
              name: '(R)-2-Hydroxypropansäure (Milchsäure)',
              smiles: 'C[C@@H](O)C(=O)O',
              explanation: 'Saure Hydrolyse des Lactids spaltet beide Ester-Bindungen → 2 Moleküle (R)-Milchsäure (aus (R,R)-Lactid).' }
          ],
          edges: [
            { from: ['LA'], to: 'I', reagent_above: 'NaOMe', reagent_below: '1. Initiation (A_N)' },
            { from: ['I'],  to: 'P', reagent_above: 'n × LA', reagent_below: '2. Propagation; 3. H_3O^+' },
            { from: ['LA'], to: 'M', reagent_above: 'H_3O^+', reagent_below: 'Vollständige Hydrolyse' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Polymer-Klasse (3.3)',
        prompt: 'Welche Polymerklasse entsteht bei der ROP von Lactid?',
        choices: [
          { id: 'a', label: 'Polyamid',        correct: false },
          { id: 'b', label: 'Polyester',       correct: true  },
          { id: 'c', label: 'Polyanhydrid',    correct: false },
          { id: 'd', label: 'Polycarbonsäure', correct: false }
        ],
        explanation: 'Lactid besteht aus zwei Ester-Verknüpfungen im Ring. Bei der Ringöffnung bleiben Ester-Bindungen (-O-CR-C(=O)-) erhalten → Polyester. Polylactid (PLA) ist ein wichtiges biologisch abbaubares Polymer (Verpackung, medizinische Nähfäden).'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     B. Kaffeesäure & Kaffeesäure-Ester (3.6-3.12)
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw44-2018-kaffeesaeure',
    category: 'Mehrstufige Synthesen',
    name: 'Kaffeesäure & Kaffeesäure-Ester — BW 2018',
    difficulty: 'D',
    source: 'ÖChO Bundeswettbewerb 2018 (BW 44), Aufgabe 3 B',
    intro: 'Synthese der Kaffeesäure (3,4-Dihydroxyzimtsäure, F) ausgehend von 3,4-Dihydroxybenzaldehyd (A) über zwei alternative Routen: (i) Acetal-Schutz mit Formaldehyd (B) + HWE-Wittig mit dem Arbuzov-Phosphonat C → F; (ii) MOM-Schutz (D) + Aldol-Kondensation mit Ethanal → E → PDC-Oxidation + HCl → F. Anschließend Acid chloride über SOCl_2 (H) und Veresterung mit 3-Phenylpropan-1-ol → Kaffeesäure-Ester I.',
    sections: [
      {
        type: 'synthesis',
        title: 'Route 1: Acetal-Schutz + HWE-Wittig',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: true,
              name: '3,4-Dihydroxybenzaldehyd (Protocatechualdehyd)',
              smiles: 'O=Cc1ccc(O)c(O)c1',
              explanation: 'Edukt mit Catechol-Funktion (zwei phenolische OH).' },
            { id: 'B', label: 'B', given: false,
              name: '3,4-Methylendioxybenzaldehyd (Piperonal)',
              smiles: 'O=Cc1ccc2OCOc2c1',
              note: 'X = HCl (Nebenprodukt der Acetalbildung).',
              explanation: 'H_2C=O + H^+ bildet ein cyclisches Methylendioxy-Acetal — schützt beide Phenole gleichzeitig.' },
            { id: 'Z', label: 'Z', given: false,
              name: 'Bromessigsäure',
              smiles: 'OC(=O)CBr',
              explanation: 'Edukt für Arbuzov-Reaktion mit P(OBn)_3.' },
            { id: 'C', label: 'C', given: false,
              name: 'Dibenzyl-Phosphonat-Essigsäure (Arbuzov-Produkt)',
              smiles: 'OC(=O)CP(=O)(OCc1ccccc1)OCc1ccccc1',
              note: 'Mechanismus: S_N2 von P^III auf das Bromid → Phosphoniumsalz → -BnBr Eliminierung → Phosphonat (P^V mit zwei OBn-Gruppen).',
              explanation: 'Arbuzov-Reaktion: P(OBn)_3 substituiert das Bromid in einer S_N2 → Phosphoniumsalz → eliminiert BnBr → α-Phosphono-Essigsäure. Dieses ist das HWE-Reagenz.' },
            { id: 'F', label: 'F = Kaffeesäure', given: false,
              name: '(E)-3,4-Dihydroxyzimtsäure (Kaffeesäure)',
              smiles: 'OC(=O)/C=C/c1ccc(O)c(O)c1',
              note: 'F\' wäre die Z-Form (cis-Doppelbindung) — entstehend durch UV-Isomerisierung über ein Singulett/Triplett-Diradikal.',
              explanation: '1. NaOEt deprotoniert das HWE-Phosphonat → stabilisiertes Carbanion (durch P=O). 2. A_N am Aldehyd-C → β-Hydroxy-Phosphonat → konzertierter Zerfall zu Alken + Phosphat (HWE-Wittig).' }
          ],
          edges: [
            { from: ['A'],     to: 'B', reagent_above: 'H_2C=O / H^+', reagent_below: '-H_2O' },
            { from: ['Z'],     to: 'C', reagent_above: 'P(OBn)_3',       reagent_below: 'Arbuzov (-BnBr)' },
            { from: ['B','C'], to: 'F', reagent_above: '1. NaOEt',        reagent_below: '2. HCl (HWE-Wittig)' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Route 2: MOM-Schutz + Aldol → Kaffeesäure',
        scheme: {
          nodes: [
            { id: 'D', label: 'D', given: false,
              name: '3,4-Bis(methoxymethoxy)benzaldehyd',
              smiles: 'O=Cc1ccc(OCOC)c(OCOC)c1',
              explanation: 'MOM-Cl + NaH (Base) → Williamson-Ethersynthese (S_N2) am Phenolat-O → MOM-geschützter Aldehyd. MOM verhindert Oxidation des Phenols zum Chinon im weiteren Verlauf.' },
            { id: 'E', label: 'E', given: false,
              name: 'α,β-ungesättigter Aldehyd (Aldol-Produkt)',
              smiles: 'O=C/C=C/c1ccc(OCOC)c(OCOC)c1',
              note: 'E (E-Form) und E\' (Z-Form) — Diastereomere bzgl. der C=C-Geometrie.',
              explanation: 'Base + Ethanal: das Acetaldehyd-Enolat addiert an D (Aldol-Addition), gefolgt von H_2O-Eliminierung (Kondensation) → (E)-α,β-ungesättigter Aldehyd (3-Aryl-prop-2-enal).' },
            { id: 'F2', label: 'F', given: false,
              name: 'Kaffeesäure (E-Form)',
              smiles: 'OC(=O)/C=C/c1ccc(O)c(O)c1',
              explanation: '1. PDC oxidiert den Aldehyd zur Carbonsäure. 2. HCl (7 h) entfernt die MOM-Schutzgruppen → Catechol-Funktion freigelegt → Kaffeesäure.' }
          ],
          edges: [
            { from: ['A'],  to: 'D', reagent_above: 'MOM-Cl / NaH',    reagent_below: 'CH_2Cl_2 (Williamson)' },
            { from: ['D'],  to: 'E', reagent_above: 'Base / Ethanal',   reagent_below: 'Aldol-Kondensation (-H_2O)' },
            { from: ['E'],  to: 'F2', reagent_above: '1. PDC',           reagent_below: '2. HCl, 7h' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Kaffeesäure-Ester (G → H → I)',
        scheme: {
          nodes: [
            { id: 'G', label: 'G', given: false,
              name: '3,4-Bis(MOM)-Kaffeesäure',
              smiles: 'OC(=O)/C=C/c1ccc(OCOC)c(OCOC)c1',
              explanation: 'MOM-Cl + NaH schützt erneut die zwei Phenole, damit das nächste Säurechlorid nicht mit ihnen reagiert.' },
            { id: 'H', label: 'H', given: false,
              name: 'Säurechlorid von G',
              smiles: 'ClC(=O)/C=C/c1ccc(OCOC)c(OCOC)c1',
              explanation: 'SOCl_2 wandelt COOH in COCl — aktiviert für die Veresterung.' },
            { id: 'I', label: 'I', given: false,
              name: 'Kaffeesäure-3-phenylpropyl-ester',
              smiles: 'OC(=O)/C=C/c1ccc(O)c(O)c1.OCCCc1ccccc1',
              note: 'Aufgabe schreibt: 1. 3-Phenyl-propan-1-ol → Aminolyse-artige Veresterung. 2. HCl 7 h → MOM-Schutzgruppen weg. Y = HCl (Nebenprodukt).',
              explanation: '1. 3-Phenyl-propan-1-ol greift den Carbonyl-C des Säurechlorids nukleophil an (A_N) → Ester. 2. HCl entfernt die MOM-Gruppen → Kaffeesäure-3-phenylpropyl-ester.' }
          ],
          edges: [
            { from: ['F'], to: 'G', reagent_above: 'MOM-Cl / NaH',  reagent_below: 'CH_2Cl_2' },
            { from: ['G'], to: 'H', reagent_above: 'SOCl_2',        reagent_below: '' },
            { from: ['H'], to: 'I', reagent_above: '1. PhCH_2CH_2CH_2OH', reagent_below: '2. HCl, 7h' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Mechanismus Arbuzov (3.7)',
        prompt: 'Nach welchem Mechanismus reagiert P(OBn)_3 mit Bromessigsäure?',
        choices: [
          { id: 'a', label: 'S_N1',                     correct: false },
          { id: 'b', label: 'S_N2',                     correct: true  },
          { id: 'c', label: 'A_N',                      correct: false },
          { id: 'd', label: 'Radikalisch',              correct: false }
        ],
        explanation: 'P^III ist ein gutes Nukleophil. Es greift das α-C des Br-Acetats von der Rückseite an (S_N2, Walden-Inversion) → Phosphoniumsalz (R-P^+(OBn)_3 Br^-). Diese ionische Spezies zerfällt anschließend zu Phosphonat (P^V) + BnBr (Arbuzov-Umlagerung).'
      },
      {
        type: 'multiple_choice',
        title: 'Funktion der MOM-Schutzgruppe (3.12)',
        prompt: 'Warum wird das Catechol von A vor der weiteren Synthese als MOM-Ether geschützt?',
        choices: [
          { id: 'a', label: 'Damit die Phenole nicht oxidiert werden (zu Chinonen)',                correct: true  },
          { id: 'b', label: 'Damit die Phenole nicht mit Säurechloriden verestern (im Schritt H → I)', correct: true  },
          { id: 'c', label: 'Um die Wasserlöslichkeit zu erhöhen',                                   correct: false },
          { id: 'd', label: 'Damit die Aldol-Reaktion stereoselektiv wird',                          correct: false }
        ],
        explanation: 'Beide korrekten Antworten: Catechole sind extrem leicht oxidierbar zu o-Chinonen (insbesondere unter basischen oder oxidierenden Bedingungen) — MOM verhindert das. Außerdem würden die Phenole mit Säurechloriden veresternd reagieren und die selektive Esterbildung am späteren Carbonsäure-Zentrum verhindern.'
      },
      {
        type: 'short_answer',
        title: 'Z-Isomerisierung (3.9)',
        prompt: 'Wie kann F (E-Kaffeesäure) zu F\' (Z-Form) isomerisieren? Welcher Mechanismus liegt zugrunde?',
        expected_answer: 'Photochemisch (UV): Anregung des konjugierten π-Systems verbreitert die C=C-Bindung durch Population des π*-Orbitals → die π-Bindungsordnung wird kurzzeitig 0 → freie Rotation um die ehemalige Doppelbindung. Geht das System in den Grundzustand zurück, kann es in der Z-Form „eingefangen" werden. Mechanistisch über ein elektronisch angeregtes Singulett/Triplett-Diradikal-Zwischenprodukt.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     C. Colchicin (3.13-3.17) — zu komplex für volles Schema
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw44-2018-colchicin',
    category: 'Mehrstufige Synthesen',
    name: 'Colchicin-Totalsynthese (Übersicht) — BW 2018',
    difficulty: 'E',
    source: 'ÖChO Bundeswettbewerb 2018 (BW 44), Aufgabe 3 C',
    intro: 'Klassische Totalsynthese von Colchicin — einem antimitotischen Tropolon-Alkaloid (Herbstzeitlose). Die Aufgabe umfasst 17 Strukturen (A, B, C, D, E, F, G, H, I, K, L, M, N, O, P, Q, R) mit Schlüsselschritten: Isothiazol-Aufbau, Wittig-Olefinierung, Hetero-Diels-Alder, intramolekulare Friedl-Crafts-Alkylierung zum Siebenring, Reduktionen und finalere axiale Chiralität.',
    sections: [
      {
        type: 'short_answer',
        title: 'Reagenzien Z_1 und Z_2 (3.14)',
        prompt: 'Welche Reagenzien Z_1 und Z_2 sind für die Schritte I → K vorgeschlagen?',
        expected_answer: 'Z_1 = N_2H_4 / H_2O_2 / Cu^{2+} (Cu-katalysierte Hydrazin-Reduktion der C=C-Doppelbindung — selektive Reduktion isolierter Alkene). Z_2 = LDA (Lithiumdiisopropylamid, starke nicht-nukleophile Base, deprotoniert das α-Heteroaryl-CH zum Lithium-Carbanion, das anschließend mit CO_2 carboxyliert wird).'
      },
      {
        type: 'multiple_choice',
        title: 'Ringschluss H → I (3.15)',
        prompt: 'Welcher Namensreaktion folgt der Ringschluss H → I (Bildung des Sieben-Rings im Colchicin-Skelett)?',
        choices: [
          { id: 'a', label: 'Friedl-Crafts-Alkylierung (S_E am Aromaten)', correct: true  },
          { id: 'b', label: 'Diels-Alder ([4+2])',                          correct: false },
          { id: 'c', label: 'Wittig-Olefinierung',                          correct: false },
          { id: 'd', label: 'Wolff-Kishner-Reduktion',                      correct: false }
        ],
        explanation: 'Die intramolekulare Cyclisierung schließt den 7-gliedrigen B-Ring von Colchicin durch elektrophile aromatische Substitution (S_E) — das aktivierte Allyl-Kation greift den Trimethoxyaryl von der Seite an. Mechanismus: S_E.'
      },
      {
        type: 'short_answer',
        title: 'Chiralität von Colchicin (3.16-3.17)',
        prompt: 'Welche Formen der Chiralität besitzt Colchicin und welche Stereodeskriptoren werden verwendet?',
        expected_answer: 'Colchicin besitzt EIN Stereozentrum (sp^3-C mit -NHAc-Substituent) UND eine AXIALE CHIRALITÄT (Atropisomerie: der Tropolon-Ring und der Trimethoxyaryl-Ring sind so verbrückt, dass die Rotation um die zwischen ihnen liegende C-C-Achse gehindert ist). Stereodeskriptoren: (aR, S). Das (aR) gibt die axiale Konfiguration an, (S) das klassische sp^3-Stereozentrum.'
      },
      {
        type: 'short_answer',
        title: 'Disproportionierung als roter Faden',
        prompt: 'In der Sequenz N → O wird CO_2 unter Erhitzen abgespalten. Welcher klassische Reaktionstyp liegt vor?',
        expected_answer: 'Decarboxylierung eines β-Ketoesters / β-Carbonsäure-Carboxyls (Krapcho-artig oder klassisch). Bei H_3O^+ und Erhitzen entsteht aus der β-Ketosäure zunächst die freie Säure, die unter Wärme via cyclischen 6-Ring-Übergangszustand (Enol/CO_2-Abspaltung) decarboxyliert → Keton + CO_2.'
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
