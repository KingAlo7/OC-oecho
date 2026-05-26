/**
 * BW batch 9 — BW42 (2016) Aufgabe 1: Manche Antibiotika
 *   A. Prontosil (Sulfonamid-Azofarbstoff)
 *   B. Chloramphenicol
 *   C. Trimethoprim
 *   D. Penicillin V
 */
const fs = require('fs');
const path = require('path');
const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const data = JSON.parse(fs.readFileSync(QFILE, 'utf8'));
const existing = new Set(data.map(q => q.id));

const ENTRIES = [
  /* ════════════════════════════════════════════════════════════════════
     A. Prontosil — Sulfonamid-Azofarbstoff (erstes synthet. Antibiotikum)
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw42-2016-prontosil',
    category: 'Mehrstufige Synthesen',
    name: 'Prontosil (erstes Sulfonamid) — BW 2016',
    difficulty: 'B',
    source: 'ÖChO Bundeswettbewerb 2016 (BW 42), Aufgabe 1 A',
    intro: 'Prontosil — der erste klinisch eingesetzte Sulfonamid-Antibiotikum (G. Domagk, 1932, Nobelpreis 1939). Die Synthese kombiniert Chlorsulfonierung (Acetanilid → B), Aminierung (B → C), Hydrolyse (C → D = Sulfanilamid), Diazotierung (D → E) und Azokupplung mit Benzol-1,3-diamin (→ F = Prontosil).',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema',
        scheme: {
          nodes: [
            { id: 'Aa', label: 'Acetanilid', given: true,
              name: 'N-Phenyl-acetamid',
              smiles: 'CC(=O)Nc1ccccc1',
              explanation: 'Edukt — N-acetyliertes Anilin (Schutzgruppe verhindert Diazotierung der NH_2-Funktion und dirigiert para).' },
            { id: 'B', label: 'B', given: false,
              name: '4-Acetamidobenzol-sulfonsäurechlorid',
              smiles: 'CC(=O)Nc1ccc(S(Cl)(=O)=O)cc1',
              note: '2 bp.',
              explanation: 'ClSO_3H (Chlorsulfonsäure) bewirkt eine elektrophile aromatische Substitution (S_E) und chlorsulfoniert das aktivierte Acetamid in para-Stellung.' },
            { id: 'C', label: 'C', given: false,
              name: '4-Acetamidobenzol-sulfonamid',
              smiles: 'CC(=O)Nc1ccc(S(N)(=O)=O)cc1',
              note: '1,5 bp.',
              explanation: 'NH_3 substituiert das Cl am Sulfonyl-Cl-Zentrum nukleophil (Acyl-/Sulfonyl-Substitution) → Sulfonamid.' },
            { id: 'D', label: 'D = Sulfanilamid', given: false,
              name: '4-Amino-benzolsulfonamid (Sulfanilamid)',
              smiles: 'Nc1ccc(S(N)(=O)=O)cc1',
              note: '1,5 bp. Sulfanilamid ist selbst bereits antibakteriell wirksam.',
              explanation: 'H_3O^+ hydrolysiert die Acetamid-Schutzgruppe → freies aromatisches Amin (Sulfanilamid).' },
            { id: 'E', label: 'E', given: false,
              name: 'Diazoniumsalz von Sulfanilamid',
              smiles: '[Cl-].N#[N+]c1ccc(S(N)(=O)=O)cc1',
              note: '2 bp.',
              explanation: 'NaNO_2 + HCl (kalt, 0-5 °C) erzeugt salpetrige Säure (HNO_2), die als Nitrosylkation NO^+ wirkt und das freie Amin in das Diazoniumsalz überführt — schwaches Elektrophil, aber ausreichend für aktivierte Aromaten.' },
            { id: 'Bdi', label: 'Benzol-1,3-diamin', given: true,
              name: 'Benzol-1,3-diamin',
              smiles: 'Nc1cccc(N)c1',
              note: '0,5 bp. Stark aktiviert (zwei +M-NH_2-Gruppen).',
              explanation: 'Kupplungs-Reagenz für die Azokupplung. Würde stattdessen unsubstituiertes Benzol verwendet, würde keine Kupplung erfolgen — Benzol ist zu wenig reaktiv für das schwache Diazonium-Elektrophil.' },
            { id: 'F', label: 'F = Prontosil', given: false,
              name: 'Prontosil — 4-[(2,4-Diaminophenyl)diazenyl]-benzolsulfonamid',
              smiles: 'Nc1ccc(/N=N/c2ccc(S(N)(=O)=O)cc2)c(N)c1',
              note: '2 bp. Azo-Farbstoff, intensiv rot.',
              explanation: 'Azokupplung (S_E am Aromaten): das Diazonium-Kation greift das aktivierte Benzol-1,3-diamin (+M durch zwei NH_2) in 4-Position an → Azo-Verbindung (Prontosil).' }
          ],
          edges: [
            { from: ['Aa'], to: 'B', reagent_above: 'ClSO_3H',     reagent_below: 'S_E' },
            { from: ['B'],  to: 'C', reagent_above: 'NH_3',         reagent_below: '' },
            { from: ['C'],  to: 'D', reagent_above: 'H_3O^+',        reagent_below: 'Hydrolyse Schutzgruppe' },
            { from: ['D'],  to: 'E', reagent_above: 'NaNO_2 / HCl',  reagent_below: '0-5 °C — Diazotierung' },
            { from: ['E','Bdi'], to: 'F', reagent_above: 'Azokupplung', reagent_below: 'S_E' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Warum kein Benzol als Kupplungspartner? (1.2)',
        prompt: 'Warum funktioniert die Azokupplung E → F nur mit Benzol-1,3-diamin und nicht mit reinem Benzol?',
        choices: [
          { id: 'a', label: 'Diazoniumionen sind schwache Elektrophile; Benzol ist zu wenig reaktiv. Benzol-1,3-diamin ist durch zwei +M-Effekte stark aktiviert.', correct: true },
          { id: 'b', label: 'Diazoniumionen reagieren nur basisch',                       correct: false },
          { id: 'c', label: 'Benzol ist zu sauer',                                        correct: false },
          { id: 'd', label: 'Die Reaktion verläuft radikalisch',                          correct: false }
        ],
        explanation: 'Diazoniumionen sind schwache Elektrophile (positive Ladung ist über das gesamte N_2-System delokalisiert). Sie reagieren nur mit stark aktivierten Aromaten — Aniline, Phenole, ortho/para-Diamine. Die +M-Mesomeriedonor-Effekte der zwei NH_2-Gruppen erhöhen die Elektronendichte des Benzolrings ausreichend, dass S_E mit dem schwachen Elektrophil möglich wird.'
      },
      {
        type: 'short_answer',
        title: 'Stereoisomerie der Azo-Verbindung F (1.3)',
        prompt: 'Welche Art von Stereoisomerie tritt bei Prontosil (F) auf?',
        expected_answer: 'Diastereomerie: E/Z-Isomerie an der N=N-Doppelbindung — die zwei aromatischen Reste können trans (E) oder cis (Z) zueinander angeordnet sein. Die E-Form ist deutlich stabiler (sterisch entlastet) und thermodynamisch bevorzugt — UV-Licht kann die Z-Form anregen.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     B. Chloramphenicol
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw42-2016-chloramphenicol',
    category: 'Mehrstufige Synthesen',
    name: 'Chloramphenicol — Breitband-Antibiotikum (BW 2016)',
    difficulty: 'C',
    source: 'ÖChO Bundeswettbewerb 2016 (BW 42), Aufgabe 1 B',
    intro: 'Synthese von Chloramphenicol — einem klassischen Breitspektrum-Antibiotikum. Schlüsselschritte: Doppelte Henry-Reaktion (Benzaldehyd + 2 Nitromethan-Formaldehyd) → 2-Nitro-1-phenyl-propan-1,3-diol (B) → katalytische Reduktion zum Amino-Diol (C, 2R,3R-Konfiguration) → para-Nitrierung (D → E) → Acylierung mit Dichloressigsäure-Anhydrid.',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: false,
              name: 'Benzaldehyd',
              smiles: 'O=Cc1ccccc1',
              note: '0,5 bp.',
              explanation: 'Edukt für die Henry-Reaktion.' },
            { id: 'CB', label: 'CH_3NO_2-Carbanion', given: false,
              name: 'Nitromethan-Carbanion (reaktives Teilchen für A → B)',
              smiles: 'O=[N+]([O-])[CH-]',
              note: 'Mechanismus: A_N am Carbonyl-C.',
              explanation: 'NaOH deprotoniert das acide α-CH_3 von Nitromethan (pK_a ≈ 10) → resonanzstabilisiertes Carbanion (Nitronat-Anion).' },
            { id: 'B', label: 'B', given: false,
              name: '2-Nitro-1-phenyl-propan-1,3-diol',
              smiles: 'OCC([N+](=O)[O-])C(O)c1ccccc1',
              note: '2 bp. Henry-Reaktion (Nitroaldol-Addition).',
              explanation: 'Doppelte Henry-Reaktion: Nitronat-Carbanion addiert nukleophil an Benzaldehyd (A_N) → β-Nitro-Alkohol; das verbleibende α-CH (jetzt nur eines, pK_a noch immer niedrig) wird erneut deprotoniert und addiert an Formaldehyd → 2-Nitro-1,3-Diol.' },
            { id: 'C', label: 'C', given: false,
              name: '(2R,3R)-2-Amino-3-phenyl-propan-1,3-diol',
              smiles: 'OC[C@H](N)[C@H](O)c1ccccc1',
              note: '2 bp. IUPAC: (2R,3R)-2-Amino-1-phenyl-propan-1,3-diol.',
              explanation: 'Katalytische Hydrierung (H_2 / Pd) reduziert die NO_2-Gruppe stufenweise zum primären Amin: -NO_2 → -NO → -NHOH → -NH_2.' },
            { id: 'D', label: 'D', given: false,
              name: '(2R,3R)-2-Amino-1-(4-nitrophenyl)-propan-1,3-diol',
              smiles: 'OC[C@H](N)[C@H](O)c1ccc([N+](=O)[O-])cc1',
              note: '1,5 bp.',
              explanation: 'HNO_3 / H_2SO_4: das aromatische Edukt wird in para-Position nitriert (S_E mit Nitronium-Kation NO_2^+). Trotz +M-NH_2 wird die Nitrierung selektiv para zur Aliphatkette geführt (sterisch).' },
            { id: 'E', label: 'E = Chloramphenicol', given: false,
              name: 'Chloramphenicol',
              smiles: 'OC[C@H](NC(=O)C(Cl)Cl)[C@H](O)c1ccc([N+](=O)[O-])cc1',
              note: '2 bp.',
              explanation: 'Dichloressigsäure-anhydrid oder -chlorid acyliert die NH_2-Gruppe → sekundäres Amid (Dichloracetamid). Das ist die fertige Chloramphenicol-Struktur.' }
          ],
          edges: [
            { from: ['A'], to: 'B', reagent_above: '1. CH_3NO_2 / NaOH',  reagent_below: '2. H_2C=O (doppelte Henry)' },
            { from: ['B'], to: 'C', reagent_above: 'H_2 / Pd',             reagent_below: 'NO_2 → NH_2' },
            { from: ['C'], to: 'D', reagent_above: 'HNO_3 / H_2SO_4',       reagent_below: 'para-Nitrierung (S_E)' },
            { from: ['D'], to: 'E', reagent_above: '(Cl_2HCCO)_2O',          reagent_below: 'Acylierung' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Reaktionsmechanismus A → B (1.5)',
        prompt: 'Nach welchem Mechanismus läuft die Henry-Reaktion (A → B) ab?',
        choices: [
          { id: 'a', label: 'Nukleophile Addition (A_N) am Carbonyl-C', correct: true  },
          { id: 'b', label: 'S_E am Aromaten',                          correct: false },
          { id: 'c', label: 'Radikalische Substitution',                correct: false },
          { id: 'd', label: 'Elektrocyclische Ringschluss',             correct: false }
        ],
        explanation: 'Henry-Reaktion (Nitroaldol): NaOH deprotoniert α-CH des Nitromethans → Nitronat-Carbanion; dieses greift den Carbonyl-C des Benzaldehyds nukleophil an (A_N) — analog zur Aldol-Addition.'
      },
      {
        type: 'multiple_choice',
        title: 'Reaktionsmechanismus D → E (1.5)',
        prompt: 'Nach welchem Mechanismus läuft die Nitrierung am Aromaten (D-Vorstufe → E) ab?',
        choices: [
          { id: 'a', label: 'A_N',                                       correct: false },
          { id: 'b', label: 'S_E (elektrophile aromatische Substitution mit NO_2^+)', correct: true  },
          { id: 'c', label: 'S_N1',                                       correct: false },
          { id: 'd', label: 'Diels-Alder',                                correct: false }
        ],
        explanation: 'HNO_3 + H_2SO_4 erzeugt Nitronium-Kation (NO_2^+, reaktives Elektrophil — Lösung 1.5). NO_2^+ greift den Aromaten an → Wheland-Intermediat → Deprotonierung → para-nitrierter Aromat.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     C. Trimethoprim
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw42-2016-trimethoprim',
    category: 'Mehrstufige Synthesen',
    name: 'Trimethoprim-Baustein — BW 2016',
    difficulty: 'C',
    source: 'ÖChO Bundeswettbewerb 2016 (BW 42), Aufgabe 1 C',
    intro: 'Synthese eines Schlüssel-Bausteins für Trimethoprim (Dihydrofolat-Reduktase-Inhibitor). Gallolyl-Säurechlorid → Methylester → -aldehyd → 3,4,5-Trimethoxy-Derivat → α-Cyano-β-(3,4,5-Trimethoxyphenyl)-acrylsäureethylester via Knoevenagel-artige Kondensation.',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: false,
              name: '3,4,5-Trihydroxybenzoylchlorid (Gallolyl-Säurechlorid)',
              smiles: 'OC(=O)c1cc(O)c(O)c(O)c1.ClC(=O)c1cc(O)c(O)c(O)c1',
              note: '1,5 bp.',
              explanation: 'Säurechlorid der Gallussäure (Pyrogallol-5-carbonsäure).' },
            { id: 'B', label: 'B', given: false,
              name: 'Methylgallat',
              smiles: 'COC(=O)c1cc(O)c(O)c(O)c1',
              note: '1 bp. X = HCl.',
              explanation: 'MeOH (Methanol) substituiert das Cl am Säurechlorid nukleophil → Methylester (Methylgallat).' },
            { id: 'X', label: 'X', given: false,
              name: 'Methanol (Nebenprodukt-Reagenz)',
              smiles: 'OC',
              note: 'X ist im Aufgabe als CH_3OH gegeben (0,5 bp).',
              explanation: 'Methanol wird als Nucleophil und Lösungsmittel eingesetzt.' },
            { id: 'C', label: 'C', given: false,
              name: '3,4,5-Trihydroxybenzaldehyd',
              smiles: 'O=Cc1cc(O)c(O)c(O)c1',
              note: '2 bp.',
              explanation: 'Reduktion des Esters zum Aldehyd — DIBAL-H bei tiefer T (eine H^--Übertragung).' },
            { id: 'D', label: 'D', given: false,
              name: '3,4,5-Trimethoxybenzaldehyd',
              smiles: 'O=Cc1cc(OC)c(OC)c(OC)c1',
              note: '1,5 bp.',
              explanation: 'Methylierung aller drei Phenol-OH-Gruppen mit z. B. (CH_3O)_2SO_2 (Dimethylsulfat) oder CH_3I + Base → Tri-O-Methylether (Williamson).' },
            { id: 'E', label: 'E', given: false,
              name: '(E)-2-Cyano-3-(3,4,5-trimethoxyphenyl)-acryl-säureethylester',
              smiles: 'CCOC(=O)/C(=C/c1cc(OC)c(OC)c(OC)c1)C#N',
              note: '2 bp. α-Cyano-Acrylat als reaktives Michael-Akzeptor.',
              explanation: 'Knoevenagel-artige Kondensation: das α-CH-acide Cyanessigsäureethylester (NC-CH_2-COOEt) wird deprotoniert → Carbanion → Aldol-Addition an D → β-Hydroxy-Intermediat → H_2O-Eliminierung → (E)-α,β-ungesättigtes Cyanoacrylat.' }
          ],
          edges: [
            { from: ['A','X'], to: 'B', reagent_above: 'CH_3OH',           reagent_below: '-HCl' },
            { from: ['B'],      to: 'C', reagent_above: 'DIBAL-H',          reagent_below: 'Ester → Aldehyd' },
            { from: ['C'],      to: 'D', reagent_above: '(CH_3O)_2SO_2 / Base', reagent_below: 'O-Methylierung' },
            { from: ['D'],      to: 'E', reagent_above: 'NC-CH_2-CO_2Et',    reagent_below: 'Base — Knoevenagel' }
          ]
        }
      },
      {
        type: 'short_answer',
        title: 'Mesomerie des protonierten Guanidins (1.8)',
        prompt: 'Warum ist Guanidin so basisch (pK_b ≈ 0,4)? Welche elektronischen Effekte stabilisieren das protonierte Guanidinium-Ion?',
        expected_answer: 'Mesomerie (M-Effekt): Im Guanidinium-Kation (H_2N)_3C^+ ist die positive Ladung gleichmäßig über alle drei NH_2-Stickstoff-Atome delokalisiert — drei äquivalente mesomere Grenzstrukturen mit C=N^+(H_2). Diese symmetrische Delokalisierung über drei Heteroatome stabilisiert das Kation außerordentlich → Guanidin ist nach OH^- die stärkste neutrale Base in der organischen Chemie.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     D. Penicillin V
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw42-2016-penicillin-v',
    category: 'Mehrstufige Synthesen',
    name: 'Penicillin V — β-Lactam-Ringschluss (BW 2016)',
    difficulty: 'C',
    source: 'ÖChO Bundeswettbewerb 2016 (BW 42), Aufgabe 1 D',
    intro: 'Schlüsselschritt der Penicillin-Synthese: Schließung des β-Lactam-Vier-Rings aus einem offenen Vorläufer A (Phenoxyacetyl-Cys-Val-Tripeptid-Analog mit freier Aminogruppe und Carbonsäure) mittels Carbodiimid-aktivierter intramolekularer Amidbildung → Penicillin V (B).',
    sections: [
      {
        type: 'synthesis',
        title: 'A (offene Form) → B (Penicillin V)',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: true,
              name: 'Phenoxyacetyl-amino-cystein-Val-Säure (offene Vorform)',
              smiles: 'O=C(Cc1ccccc1)NC(C(=O)O[K])C(N)C(C)(C)SC(C(=O)O)C',
              note: '1 bp. K^+-Salz der offenen Form: freies sec. NH_2 + freie COOH.',
              explanation: 'Tripeptid-artiges Edukt mit Phenoxyacetyl-Amid, geschützter Carbonsäure und freier Aminogruppe sowie freier Carbonsäure am Cysteinyl-Valin-Rückgrat.' },
            { id: 'B', label: 'B = Penicillin V', given: false,
              name: 'Penicillin V (β-Lactam)',
              smiles: 'O=C(Cc1ccccc1)NC2C(=O)N3C2SC(C)(C)C3C(=O)O[K]',
              note: '2 bp. Vierring-Lactam (β-Lactam) ist die charakteristische Pharmakophor-Gruppe.',
              explanation: 'Carbodiimid (DCC, R-N=C=N-R) aktiviert die COOH durch Bildung eines O-Acylisoharnstoffes; die intramolekulare NH_2-Gruppe greift den aktivierten Carbonyl-C nukleophil an (Acylsubstitution) → β-Lactam-Vierring + Harnstoff-Nebenprodukt.' }
          ],
          edges: [
            { from: ['A'], to: 'B', reagent_above: 'DCC (R-N=C=N-R)', reagent_below: 'intramol. Acylsubstitution' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Funktionelle Gruppe im β-Lactam (1.11)',
        prompt: 'Welche spezielle funktionelle Gruppe wird beim Schritt A → B gebildet?',
        choices: [
          { id: 'a', label: 'Lactam (cyclisches Amid)',         correct: true  },
          { id: 'b', label: 'Lacton (cyclischer Ester)',        correct: false },
          { id: 'c', label: 'Anhydrid',                         correct: false },
          { id: 'd', label: 'Imid',                             correct: false }
        ],
        explanation: 'Beim Ringschluss greift ein NH-Atom (Amin) den Carbonyl-C einer Carbonsäure an → cyclisches Amid = Lactam. Der besonders gespannte 4-Ring (β-Lactam) macht Penicillin reaktiv genug, um bakterielle Zellwandsynthese-Enzyme (Penicillin-Bindeproteine) kovalent zu hemmen.'
      },
      {
        type: 'short_answer',
        title: 'Rolle des Carbodiimids (1.10)',
        prompt: 'Warum benötigt der Ringschluss A → B ein Carbodiimid (R-N=C=N-R)? Was passiert mechanistisch?',
        expected_answer: 'Eine freie Carbonsäure ist kein gutes Elektrophil — direkt mit einem Amin würde sie nur ein nicht-reaktives Salz bilden. Das Carbodiimid wird zunächst von der deprotonierten Carbonsäure (RCOO^-) addiert → O-Acylisoharnstoff (R-C(=O)-O-C(=NR)-NHR), in dem die Carboxylat-Position jetzt eine ausgezeichnete Abgangsgruppe (Harnstoff-Derivat) trägt. Anschließend greift das Amin den Carbonyl-C an (Acyl-Substitution) → Amid + Harnstoff (R-NH-C(=O)-NH-R). Bei intramolekularer Reaktion entsteht der β-Lactam-Ring.'
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
