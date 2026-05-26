/**
 * BW batch 3 — BW48 (2022): (Z)-Jasmon, Butan-2-on Reaktionen, Lysergsäure
 * Myers chirales Allen, Self-Splicing.
 */
const fs = require('fs');
const path = require('path');
const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const data = JSON.parse(fs.readFileSync(QFILE, 'utf8'));
const existing = new Set(data.map(q => q.id));

const ENTRIES = [
  /* ════════════════════════════════════════════════════════════════════
     BW 48 (2022) — Aufgabe 2 A: Butan-2-on Reaktionen (10 Pfade)
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw48-2022-butanon-reaktionen',
    category: 'Mehrstufige Synthesen',
    name: 'Butan-2-on — 10 Reaktionen (BW 2022)',
    difficulty: 'B',
    source: 'ÖChO Bundeswettbewerb 2022 (BW 48), Aufgabe 2 A',
    intro: 'Aus dem Edukt Butan-2-on (Methylethylketon) gehen 10 verschiedene organische Transformationen aus. Klassische Reaktionen: Oxim-Bildung, Beckmann-Umlagerung, Baeyer-Villiger-Oxidation, Aminolyse, Reduktion zum Alkohol, säurekatalysierte Eliminierung, Markovnikow-HCl-Addition, SeO_2-α-Oxidation, Wittig-Reaktion, Grignard-Addition.',
    sections: [
      {
        type: 'synthesis',
        title: 'Reaktionsfächer um Butan-2-on',
        scheme: {
          nodes: [
            { id: 'Ed', label: 'Edukt', given: true, name: 'Butan-2-on (Methylethylketon)',
              smiles: 'CCC(C)=O', explanation: 'Edukt für alle 10 Reaktionen.' },
            { id: 'A', label: 'A', given: false, name: 'Oxim',
              smiles: 'CCC(/C)=N/O',
              explanation: 'Reaktion 1: Hydroxylamin (NH_2OH) addiert nukleophil ans Carbonyl (A_N), Wasser wird abgespalten — Oxim.' },
            { id: 'C', label: 'C', given: false, name: 'N-Ethyl-acetamid (Beckmann-Produkt)',
              smiles: 'CC(=O)NCC',
              explanation: 'Reaktion 3: Beckmann-Umlagerung des Oxims (H_2SO_4) — der zur OH-Gruppe anti-stehende Rest wandert zum N. Bildet sek. Amid.' },
            { id: 'B', label: 'B', given: false, name: 'Ethylacetat (Baeyer-Villiger)',
              smiles: 'CCOC(C)=O',
              note: 'C_4H_8O_2.',
              explanation: 'Reaktion 2: Trifluorperessigsäure (CF_3COOOH) oxidiert das Keton zum Ester — der bessere Wanderer (Et) migriert zum O.' },
            { id: 'D', label: 'D', given: false, name: 'Butan-2-ol',
              smiles: 'CCC(C)O', note: 'C_4H_{10}O.',
              explanation: 'Reaktion 5: NaBH_4 reduziert das Keton zum sekundären Alkohol.' },
            { id: 'E', label: 'E', given: false, name: '(E)-But-2-en',
              smiles: 'C/C=C/C', note: 'C_4H_8.',
              explanation: 'Reaktion 6: konz. H_2SO_4 dehydratisiert den Alkohol — Saytzeff-Eliminierung liefert das thermodynamisch stabilere (E)-But-2-en.' },
            { id: 'F', label: 'F', given: false, name: '2-Chlorbutan',
              smiles: 'CCC(C)Cl',
              explanation: 'Reaktion 7: HCl addiert Markownikow ans Alken — H ans terminale C, Cl an das innere C (sekundäres C-Atom, stabileres Carbenium).' },
            { id: 'G', label: 'G', given: false, name: 'Butan-2,3-dion (Diacetyl)',
              smiles: 'CC(=O)C(C)=O',
              note: 'C_4H_6O_2. 1H-NMR: nur ein Singulett bei 2,34 ppm (CH_3).',
              explanation: 'Reaktion 8: SeO_2 oxidiert die α-Methylengruppe selektiv zum zweiten Carbonyl → α-Diketon.' },
            { id: 'H', label: 'H', given: false, name: 'Wittig-Produkt (Methylencyclopentan-Derivat)',
              smiles: 'CC(=CC1CCCC1)CC',
              note: 'Aus Cyclopentyl-triphenylphosphoniumbromid + NaH → Ylid, das mit Butan-2-on ein Wittig-Alken bildet.',
              explanation: 'Reaktion 9: Wittig-Reaktion. Das Ylid (deprotoniertes Phosphoniumsalz) addiert ans Carbonyl, der Betaine cyclisiert zum Oxaphosphetan, Zerfall liefert Alken + Ph_3PO.' },
            { id: 'I', label: 'I', given: false, name: '3-Methylpentan-3-ol (Grignard-Addukt)',
              smiles: 'CCC(C)(O)CC',
              note: 'Tertiärer Alkohol. 1H-NMR: 1,53 (s, br, OH), 1,49 (m, 4H), 1,13 (s, 3H), 0,90 (t, 6H).',
              explanation: 'Reaktion 10: CH_3CH_2MgCl (Grignard) addiert nucleophil ans Carbonyl → tertiärer Alkohol nach saurer Aufarbeitung.',
              related_reaction_id: 'grignard-co' }
          ],
          edges: [
            { from: ['Ed'], to: 'A', reagent_above: 'NH_2OH',           reagent_below: '-H_2O (Rxn 1)' },
            { from: ['A'],  to: 'C', reagent_above: 'H_2SO_4',          reagent_below: 'Beckmann (Rxn 3)' },
            { from: ['Ed'], to: 'B', reagent_above: 'CF_3COOOH',        reagent_below: 'Baeyer-Villiger (Rxn 2)' },
            { from: ['B'],  to: 'C', reagent_above: 'CH_3CH_2NH_2',     reagent_below: 'Aminolyse (Rxn 4)' },
            { from: ['Ed'], to: 'D', reagent_above: 'NaBH_4',           reagent_below: 'Rxn 5' },
            { from: ['D'],  to: 'E', reagent_above: 'konz. H_2SO_4',    reagent_below: 'Eliminierung (Rxn 6)' },
            { from: ['E'],  to: 'F', reagent_above: 'HCl',              reagent_below: 'Markownikow (Rxn 7)' },
            { from: ['Ed'], to: 'G', reagent_above: 'SeO_2',            reagent_below: 'α-Oxidation (Rxn 8)' },
            { from: ['Ed'], to: 'H', reagent_above: 'Cyclopentyl-PPh_3^+Br^-, NaH', reagent_below: 'Wittig (Rxn 9)' },
            { from: ['Ed'], to: 'I', reagent_above: '1. CH_3CH_2MgCl',  reagent_below: '2. H^+/H_2O (Rxn 10)' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Mechanismus der Oxim-Bildung',
        prompt: 'Welcher Reaktionsmechanismus liegt der Bildung des Oxims A aus Butan-2-on + Hydroxylamin zugrunde?',
        choices: [
          { id: 'a', label: 'Nukleophile Addition (A_N) mit anschließender H_2O-Eliminierung', correct: true },
          { id: 'b', label: 'Elektrophile Addition',                                              correct: false },
          { id: 'c', label: 'Nukleophile Substitution',                                           correct: false },
          { id: 'd', label: 'Radikalische Substitution',                                          correct: false }
        ],
        explanation: 'NH_2OH greift mit dem freien Elektronenpaar des N nucleophil das elektrophile Carbonyl-C an (A_N). Das gebildete Halbaminal verliert Wasser → Oxim. Klassisches Muster aller Carbonyl-NH_2-Reaktionen.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     BW 48 (2022) — Aufgabe 2 A: (Z)-Jasmon-Synthese (Frage 2.12)
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw48-2022-z-jasmon',
    category: 'Mehrstufige Synthesen',
    name: '(Z)-Jasmon — BW 2022',
    difficulty: 'C',
    source: 'ÖChO Bundeswettbewerb 2022 (BW 48), Aufgabe 2 A.12',
    intro: 'Synthese des Riechstoffes (Z)-Jasmon (in Jasminblüten) via doppelte Alkylierung eines β-Ketoesters. Acetessigester wird zweimal α-alkyliert (mit (Z)-Pent-2-enyl-bromid und Iod-Aceton), beide Carboxylgruppen werden verseift + decarboxyliert, und der entstandene 1,4-Diketon-Vorläufer cyclisiert basenkatalysiert zum Cyclopent-2-enon mit Pentenyl-Substituent.',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: true,  name: 'Acetessigsäureethylester (Ed)',
              smiles: 'CCOC(=O)CC(C)=O',
              explanation: 'Edukt. Die acidic CH_2-Gruppe (pK_a ≈ 11) lässt sich leicht deprotonieren.' },
            { id: 'B', label: 'B', given: false, name: 'α-Pentenyl-acetessigester',
              smiles: 'CCOC(=O)C(/C=C\\CC)C(C)=O',
              note: 'C-alkyliert mit (Z)-Pent-2-enylbromid.',
              explanation: '1. NaOEt deprotoniert α-C; 2. (Z)-Pent-2-enylbromid alkyliert das Enolat — SN2 am Allyl-C.' },
            { id: 'C', label: 'C', given: false, name: 'Methylketon (nach Verseifung + Decarboxylierung)',
              smiles: 'CC(=O)C/C=C\\CC',
              explanation: '1. NaOH (5%) verseift den Ester zur Säure; 2. saure Aufarbeitung + Δ → β-Keto-Decarboxylierung (-CO_2) → Methylketon.' },
            { id: 'D', label: 'D', given: false, name: 'Methylester (transverestert)',
              smiles: 'COC(=O)CC(=O)C/C=C\\CC',
              note: 'Methylester-Variante; das Edukt für die zweite Alkylierung.',
              explanation: 'Umesterung zu Methylester für die zweite Alkylierungsstufe.' },
            { id: 'E', label: 'E', given: false, name: 'Doppelt α-alkylierter β-Ketoester',
              smiles: 'COC(=O)C(CC(C)=O)(/C=C\\CC)C(=O)CC',
              explanation: '1. Base; 2. Iod-Aceton (CH_3COCH_2I) alkyliert nochmals den α-C.' },
            { id: 'G', label: 'G', given: false, name: '1,4-Diketon (vor Ringbildung)',
              smiles: 'CC(=O)CCC(=O)C/C=C\\CC',
              explanation: 'Erneute Esterspaltung + Decarboxylierung liefert das 1,4-Diketon mit (Z)-Pent-2-enyl-Seitenkette.' },
            { id: 'H', label: '(Z)-Jasmon', given: false, name: '(Z)-Jasmon (Z-Jasmone)',
              smiles: 'CC1=C(C/C=C\\CC)C(=O)CC1',
              note: 'Riechstoff in Jasmin- und Rosenblüten.',
              explanation: 'Basenkatalysierte intramolekulare Aldolkondensation (-H_2O) des 1,4-Diketons schließt einen Cyclopentenon-Ring. Das α,β-ungesättigte Carbonyl entsteht.',
              related_reaction_id: 'aldoladdition' }
          ],
          edges: [
            { from: ['A'], to: 'B', reagent_above: '1. Base', reagent_below: '2. (Z)-PentenylBr' },
            { from: ['B'], to: 'C', reagent_above: '1. NaOH (5%)', reagent_below: '2. Δ, H_3O^+' },
            { from: ['C'], to: 'D', reagent_above: '(MeO Umesterung)', reagent_below: '' },
            { from: ['D'], to: 'E', reagent_above: '1. Base', reagent_below: '2. ICH_2COCH_3' },
            { from: ['E'], to: 'G', reagent_above: '1. NaOH (5%)', reagent_below: '2. Δ, H_3O^+' },
            { from: ['G'], to: 'H', reagent_above: 'Base', reagent_below: '-H_2O' }
          ]
        }
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     BW 48 (2022) — Aufgabe 4 B: Lysergsäure-Vorstufe (Myers chirales Allen)
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw48-2022-lysergsaeure-myers-allen',
    category: 'Mehrstufige Synthesen',
    name: 'Lysergsäure — Myers-Allen-Synthese (BW 2022)',
    difficulty: 'D',
    source: 'ÖChO Bundeswettbewerb 2022 (BW 48), Aufgabe 4 B',
    intro: 'Fujii und Ohno publizierten 2011 eine enantioselektive Lysergsäure-Synthese. Schlüsselschritt ist eine Pd-katalysierte Domino-Cyclisierung eines chiralen Allens. Das chirale Allen wird nach der Myers-Methode aus einem Propargyl-Alkohol hergestellt: Hydrazon-Bildung mit ArSO_2NHNH_2/Ph_3P/DEAD (Mitsunobu-artig) → bei -15°C ein chirales Hydrazid, das bei RT zum chiralen Allen mit aR-Konfiguration zerfällt.',
    sections: [
      {
        type: 'synthesis',
        title: 'Myers-Methode (Vereinfachte Modellverbindung)',
        scheme: {
          nodes: [
            { id: 'B', label: 'B', given: false, name: 'Propargyl-Alkohol (Ph/Cy substituiert)',
              smiles: 'OC(C#Cc1ccccc1)C1CCCCC1',
              explanation: 'Sek. Propargyl-Alkohol — Edukt der Myers-Methode.' },
            { id: 'C', label: 'C', given: false, name: 'Chirales Hydrazid (Intermediat)',
              smiles: 'O=S(=O)(c1ccc(C)cc1)N(N)C(C#Cc2ccccc2)C3CCCCC3',
              note: 'Mitsunobu-Inversion: OH → NHNHSO_2Ar.',
              explanation: 'Mitsunobu mit ArSO_2NHNH_2/Ph_3P/DEAD substituiert OH durch -NHNHSO_2Ar unter Inversion am C.' },
            { id: 'D', label: 'D', given: false, name: 'Chirales Allen (aR-Konfiguration)',
              smiles: 'C(=C=C(c1ccccc1)[H])(C2CCCCC2)[H]',
              note: 'Stereodeskriptor aR.',
              explanation: 'Bei Raumtemperatur thermische Eliminierung — Stickstoff entweicht, ein neues C-C-Allen entsteht (1,3-Wasserstoff-Verschiebung mit gleichzeitiger Eliminierung).' }
          ],
          edges: [
            { from: ['B'], to: 'C', reagent_above: 'ArSO_2NHNH_2, Ph_3P, DEAD', reagent_below: '-15 °C' },
            { from: ['C'], to: 'D', reagent_above: 'RT',                          reagent_below: '-N_2, -ArSO_2H' }
          ]
        }
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     BW 48 (2022) — Aufgabe 2 C: Self-Splicing (Thioester-Intermediat)
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw48-2022-self-splicing-thioester',
    category: 'Mechanismen',
    name: 'Self-Splicing — Thioester-Intermediat (BW 2022)',
    difficulty: 'C',
    source: 'ÖChO Bundeswettbewerb 2022 (BW 48), Aufgabe 2 C',
    intro: 'In der nativen chemischen Ligation (NCL, Dawson 1994) bzw. beim Protein-Self-Splicing wandert die Acyl-Gruppe vom Carbonsäureamid auf das SH eines benachbarten Cys-Restes (intramolekulare Umlagerung). Das so entstandene Thioester-Intermediat ist reaktiver als das Amid und ermöglicht die kovalente Verknüpfung zweier Peptidfragmente.',
    sections: [
      {
        type: 'mechanism',
        title: 'Amid → Thioester-Umlagerung',
        prompt: 'In der eingekreisten Amidbindung des Edukts greift die SH-Gruppe des Cys-Restes nukleophil den Carbonyl-C an; das tetraedrische Intermediat kollabiert unter Spaltung der C-N-Bindung; das Amin wird frei. Resultat: Thioester R-CO-S-CH_2- + freies α-NH_2.',
        mech_steps: [
          { name: 'Edukt', prompt: 'Peptidkette mit Cys-SH neben Amidbindung.',
            smiles: 'O=C(NC(CS)C(=O)N)CC',
            explanation: 'Die SH-Gruppe des Cys-Restseite liegt räumlich nah am Amid-Carbonyl.' },
          { name: 'Tetraedrisches Intermediat', prompt: 'Nach SH-Angriff auf Carbonyl-C:',
            smiles: '[O-]C(SC(C(=O)N)NC(C)=O)CC',
            explanation: 'Das S greift nucleophil das Carbonyl-C an; sp^2 → sp^3.' },
          { name: 'Produkt A (Thioester)', prompt: 'C-N-Spaltung, NH_2 frei:',
            smiles: 'O=C(SCC(N)C(=O)N)CC',
            explanation: 'Der Thioester R-CO-S- ist labiler als das Amid und reagiert in der nächsten Stufe mit einem zweiten Peptidfragment (das ein N-terminales Cys trägt).' }
        ],
        explanation: 'Diese N→S-Acyl-Wanderung ist die Grundlage der nativen chemischen Ligation — der Thioester ist das aktivierte Acyl-Intermediat für nachfolgende Peptidbindungsknüpfungen.'
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
