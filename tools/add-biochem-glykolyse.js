/**
 * Biochemie — Glykolyse (Embden-Meyerhof-Parnas-Weg)
 *   Schema: alle 10 Schritte von α-D-Glucose bis Pyruvat
 *   + Multiple-Choice- und Kurzantwortfragen zu Enzymen, Bilanz,
 *     Regulation und Mechanismen.
 *
 * Alle Strukturen sind offenkettig in Fischer-Projektion als Molfile
 * gespeichert (tools/lib-fischer.js); Phosphat erscheint als Ⓟ (P im Kreis,
 * gezeichnet von mol-renderer.js). Coenzyme stehen an halbkreisförmigen
 * Cofaktor-Pfeilen (edge.curve). Das Skript ersetzt einen vorhandenen
 * Eintrag gleicher id.
 */
const fs = require('fs');
const path = require('path');
const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const data = JSON.parse(fs.readFileSync(QFILE, 'utf8'));
const { build } = require('./lib-fischer');

const ENTRIES = [
  {
    id: 'biochem-glykolyse',
    category: 'Biochemie',
    name: 'Glykolyse — von Glucose zu Pyruvat',
    difficulty: 'B',
    intro: 'Die Glykolyse (Embden-Meyerhof-Parnas-Weg) ist der zentrale Abbauweg der Glucose und läuft im Cytosol praktisch aller Zellen ab. In zehn enzymkatalysierten Schritten wird ein Molekül Glucose (C_6) in zwei Moleküle Pyruvat (C_3) zerlegt.\n\nVorbereitungsphase (Schritte 1–5): Unter Einsatz von 2 ATP wird Glucose zweimal phosphoryliert und in zwei Triosephosphate gespalten.\nErtragsphase (Schritte 6–10): Jedes Glycerinaldehyd-3-phosphat wird oxidiert; dabei entstehen pro Triose 1 NADH und 2 ATP.\n\nHinweis: Alle Verbindungen sind offenkettig in der Fischer-Projektion gezeichnet (C1 oben). Ⓟ steht für eine Phosphatgruppe –PO_3H_2 (bei pH 7 überwiegend –PO_3^2−).',
    sections: [
      /* ── 1. Schema ─────────────────────────────────────────────── */
      {
        type: 'synthesis',
        title: 'Die zehn Schritte der Glykolyse',
        scheme: {
          nodes: [
            { id: 'Glc', label: 'D-Glucose', given: true,
              name: 'D-Glucose (offenkettige Form)',
              smiles: 'OC[C@H]1O[C@H](O)[C@H](O)[C@@H](O)[C@@H]1O',
              explanation: 'Ausgangsstoff. Gelangt über GLUT-Transporter in die Zelle.' },
            { id: 'A', label: 'A', given: false,
              name: 'Glucose-6-phosphat (G6P)',
              smiles: 'O=P(O)(O)OC[C@H]1O[C@H](O)[C@H](O)[C@@H](O)[C@@H]1O',
              caption: 'C_6H_13O_9P',
              explanation: 'Schritt 1 — Hexokinase (Leber: Glucokinase) überträgt die γ-Phosphatgruppe von ATP auf die primäre 6-OH-Gruppe (Transferase, Mg^2+-abhängig). Irreversibel. Das geladene G6P kann die Zelle nicht mehr verlassen („Glucose-Falle“). Hexokinase wird durch ihr Produkt G6P gehemmt.' },
            { id: 'B', label: 'B', given: false,
              name: 'Fructose-6-phosphat (F6P)',
              smiles: 'O=P(O)(O)OC[C@@H]1[C@H]([C@@H]([C@](O1)(CO)O)O)O',
              caption: 'C_6H_13O_9P',
              explanation: 'Schritt 2 — Phosphoglucose-Isomerase: Aldose → Ketose über ein cis-Endiol(at)-Intermediat (Isomerase; das Enzym öffnet dazu den Pyranosering und schließt danach den Furanosering). Reversibel. Aus dem Aldehyd an C1 wird die Ketogruppe an C2 — Voraussetzung für die spätere Aldolspaltung zwischen C3 und C4.' },
            { id: 'C', label: 'C', given: false,
              name: 'Fructose-1,6-bisphosphat (F1,6BP)',
              smiles: 'O=P(O)(O)OC[C@@H]1[C@H]([C@@H]([C@](O1)(COP(=O)(O)O)O)O)O',
              caption: 'C_6H_14O_12P_2',
              explanation: 'Schritt 3 — Phosphofructokinase-1 (PFK-1) phosphoryliert die 1-OH-Gruppe mit ATP. Irreversibel und geschwindigkeitsbestimmend: der wichtigste Regulationspunkt der Glykolyse (Schrittmacherenzym).' },
            { id: 'D', label: 'D', given: false,
              name: 'Dihydroxyacetonphosphat (DHAP)',
              smiles: 'OCC(=O)COP(=O)(O)O',
              caption: 'C_3H_7O_6P',
              explanation: 'Schritt 4 — Aldolase spaltet F1,6BP in einer Retro-Aldol-Reaktion zwischen C3 und C4. C1–C3 werden zu DHAP. (Tier-Aldolase = Klasse I: Schiff-Base mit einem Lysin; Bakterien/Pilze: Klasse II, Zn^2+.)' },
            { id: 'E', label: 'E', given: false,
              name: 'D-Glycerinaldehyd-3-phosphat (GAP)',
              smiles: 'O=C[C@H](O)COP(=O)(O)O',
              caption: 'C_3H_7O_6P',
              explanation: 'Schritt 4 liefert C4–C6 als GAP; Schritt 5 — Triosephosphat-Isomerase (TIM) wandelt auch DHAP über ein Endiol-Intermediat in GAP um. Im Gleichgewicht liegt DHAP vor (~96 %), aber GAP wird laufend verbraucht. Damit entstehen pro Glucose 2 GAP. TIM ist ein „katalytisch perfektes“ (diffusionskontrolliertes) Enzym.' },
            { id: 'F', label: 'F', given: false,
              name: '1,3-Bisphosphoglycerat (1,3-BPG)',
              smiles: 'O=C(OP(=O)(O)O)[C@H](O)COP(=O)(O)O',
              caption: 'C_3H_8O_10P_2',
              explanation: 'Schritt 6 — Glycerinaldehyd-3-phosphat-Dehydrogenase (GAPDH): Oxidation des Aldehyds mit NAD^+ und Einbau von anorganischem Phosphat (P_i) → gemischtes Carbonsäure-Phosphorsäure-Anhydrid (Acylphosphat) mit sehr hohem Gruppenübertragungspotential.' },
            { id: 'G', label: 'G', given: false,
              name: '3-Phosphoglycerat (3-PG)',
              smiles: 'OC(=O)[C@H](O)COP(=O)(O)O',
              caption: 'C_3H_7O_7P',
              explanation: 'Schritt 7 — Phosphoglycerat-Kinase überträgt die Acylphosphatgruppe auf ADP → ATP. Erste Substratkettenphosphorylierung. (Trotz des Namens „Kinase“ läuft die Reaktion physiologisch in Richtung ATP-Bildung.)' },
            { id: 'H', label: 'H', given: false,
              name: '2-Phosphoglycerat (2-PG)',
              smiles: 'OC(=O)[C@H](OP(=O)(O)O)CO',
              caption: 'C_3H_7O_7P',
              explanation: 'Schritt 8 — Phosphoglycerat-Mutase verschiebt die Phosphatgruppe von C3 nach C2 (über 2,3-Bisphosphoglycerat als Intermediat, phosphoryliertes His im aktiven Zentrum).' },
            { id: 'I', label: 'I', given: false,
              name: 'Phosphoenolpyruvat (PEP)',
              smiles: 'OC(=O)C(=C)OP(=O)(O)O',
              caption: 'C_3H_5O_6P',
              explanation: 'Schritt 9 — Enolase spaltet Wasser ab (Lyase, Mg^2+-abhängig; Eliminierung über ein Carbanion/Enolat). Das Enolphosphat PEP hat das höchste Phosphatgruppen-Übertragungspotential im Stoffwechsel (ΔG°\' der Hydrolyse ≈ −62 kJ/mol). Enolase wird durch Fluorid gehemmt.' },
            { id: 'J', label: 'J', given: false,
              name: 'Pyruvat (Brenztraubensäure)',
              smiles: 'CC(=O)C(=O)O',
              caption: 'C_3H_4O_3',
              explanation: 'Schritt 10 — Pyruvatkinase überträgt die Phosphatgruppe von PEP auf ADP → ATP (zweite Substratkettenphosphorylierung). Das entstehende Enol tautomerisiert spontan zum Keton — diese Tautomerie macht den Schritt stark exergon und irreversibel.' }
          ],
          edges: [
            { from: ['Glc'], to: 'A', reagent_above: 'Hexokinase',             curve: true, curve_in: 'ATP', curve_out: 'ADP' },
            { from: ['A'],   to: 'B', reagent_above: 'Phosphoglucose-Isomerase' },
            { from: ['B'],   to: 'C', reagent_above: 'PFK-1',                  curve: true, curve_in: 'ATP', curve_out: 'ADP' },
            { from: ['C'],   to: 'D', reagent_above: 'Aldolase' },
            { from: ['C'],   to: 'E', reagent_above: 'Aldolase' },
            { from: ['D'],   to: 'E', reagent_above: 'TIM' },
            { from: ['E'],   to: 'F', reagent_above: 'GAPDH',                  curve: true, curve_in: 'NAD^+ + P_i', curve_out: 'NADH + H^+' },
            { from: ['F'],   to: 'G', reagent_above: 'Phosphoglycerat-Kinase', curve: true, curve_in: 'ADP', curve_out: 'ATP' },
            { from: ['G'],   to: 'H', reagent_above: 'Phosphoglycerat-Mutase' },
            { from: ['H'],   to: 'I', reagent_above: 'Enolase',                curve: true, curve_out: 'H_2O' },
            { from: ['I'],   to: 'J', reagent_above: 'Pyruvatkinase',          curve: true, curve_in: 'ADP', curve_out: 'ATP' }
          ]
        }
      },

      /* ── 2. Irreversible Schritte ─────────────────────────────── */
      {
        type: 'multiple_choice',
        title: 'Irreversible Schritte',
        prompt: 'Welche drei Enzyme katalysieren die (unter zellulären Bedingungen) irreversiblen Schritte der Glykolyse, die in der Gluconeogenese umgangen werden müssen?',
        choices: [
          { id: 'a', label: 'Hexokinase, Phosphofructokinase-1, Pyruvatkinase', correct: true },
          { id: 'b', label: 'Hexokinase, Aldolase, Enolase', correct: false },
          { id: 'c', label: 'Phosphoglucose-Isomerase, GAPDH, Pyruvatkinase', correct: false },
          { id: 'd', label: 'Phosphofructokinase-1, Phosphoglycerat-Kinase, Phosphoglycerat-Mutase', correct: false }
        ],
        explanation: 'Nur diese drei Schritte haben unter zellulären Bedingungen ein stark negatives ΔG. In der Gluconeogenese werden sie durch eigene Enzyme umgangen: Glucose-6-Phosphatase, Fructose-1,6-Bisphosphatase sowie Pyruvat-Carboxylase + PEP-Carboxykinase. Alle anderen Schritte arbeiten nahe am Gleichgewicht und werden in beide Richtungen genutzt.'
      },

      /* ── 3. Bilanz ────────────────────────────────────────────── */
      {
        type: 'multiple_choice',
        title: 'Nettobilanz',
        prompt: 'Wie lautet die Nettobilanz der Glykolyse pro Molekül Glucose?',
        choices: [
          { id: 'a', label: '2 Pyruvat, 2 ATP, 2 NADH + 2 H^+', correct: true },
          { id: 'b', label: '2 Pyruvat, 4 ATP, 2 NADH + 2 H^+', correct: false },
          { id: 'c', label: '2 Pyruvat, 2 ATP, 4 NADH + 4 H^+', correct: false },
          { id: 'd', label: '2 Lactat, 2 ATP, 2 NADH + 2 H^+', correct: false }
        ],
        explanation: 'Brutto werden 4 ATP gebildet (je 2 bei Phosphoglycerat-Kinase und Pyruvatkinase, weil pro Glucose 2 Triosen durchlaufen), aber 2 ATP in der Vorbereitungsphase investiert (Hexokinase, PFK-1) → netto 2 ATP. GAPDH liefert 2 NADH.\nGesamtgleichung: Glucose + 2 NAD^+ + 2 ADP + 2 P_i → 2 Pyruvat + 2 NADH + 2 H^+ + 2 ATP + 2 H_2O'
      },

      /* ── 4. Substratkettenphosphorylierung ────────────────────── */
      {
        type: 'multiple_choice',
        title: 'Substratkettenphosphorylierung',
        prompt: 'In welchen Schritten wird ATP durch Substratkettenphosphorylierung gebildet?',
        choices: [
          { id: 'a', label: '1,3-BPG → 3-PG und PEP → Pyruvat', correct: true },
          { id: 'b', label: 'GAP → 1,3-BPG und 2-PG → PEP', correct: false },
          { id: 'c', label: 'Glucose → G6P und F6P → F1,6BP', correct: false },
          { id: 'd', label: 'Nur PEP → Pyruvat', correct: false }
        ],
        explanation: 'Bei der Substratkettenphosphorylierung wird eine energiereiche Phosphatgruppe direkt von einem Substrat auf ADP übertragen — im Gegensatz zur oxidativen Phosphorylierung (ATP-Synthase, Protonengradient). Die beiden Donoren sind das Acylphosphat 1,3-BPG und das Enolphosphat PEP. Ihr hohes Übertragungspotential wird in den vorangehenden Schritten (GAPDH bzw. Enolase) aufgebaut.'
      },

      /* ── 5. Enolase-Produkt (Strukturen) ──────────────────────── */
      {
        type: 'multiple_choice',
        title: 'Enolase',
        givens: { smiles: 'OC(=O)[C@H](OP(=O)(O)O)CO' },
        prompt: 'Welches Produkt bildet die Enolase (Mg^2+) aus dem gezeigten 2-Phosphoglycerat?',
        choices: [
          { id: 'a', smiles: 'OC(=O)C(=C)OP(=O)(O)O', label: 'Phosphoenolpyruvat', correct: true },
          { id: 'b', smiles: 'CC(=O)C(=O)O', label: 'Pyruvat', correct: false },
          { id: 'c', smiles: 'OC(=O)[C@H](O)COP(=O)(O)O', label: '3-Phosphoglycerat', correct: false },
          { id: 'd', smiles: 'OC(=O)C(=O)COP(=O)(O)O', label: '3-Phosphohydroxypyruvat', correct: false }
        ],
        explanation: 'Enolase katalysiert eine Dehydratisierung (Abspaltung von H_2O aus C2-H und C3-OH, E1cB-artig über ein Mg^2+-stabilisiertes Enolat). Es entsteht das Enolphosphat PEP. Die Phosphatgruppe hält das Molekül in der energiereichen Enolform fest — erst nach ihrer Übertragung auf ADP (Pyruvatkinase) kann das Enol zum Pyruvat tautomerisieren.'
      },

      /* ── 6. Regulation PFK-1 ──────────────────────────────────── */
      {
        type: 'multiple_choice',
        title: 'Regulation der PFK-1',
        prompt: 'Welche Aussage zur allosterischen Regulation der Phosphofructokinase-1 ist richtig?',
        choices: [
          { id: 'a', label: 'Aktivierung durch AMP und Fructose-2,6-bisphosphat; Hemmung durch ATP und Citrat', correct: true },
          { id: 'b', label: 'Aktivierung durch ATP und Citrat; Hemmung durch AMP', correct: false },
          { id: 'c', label: 'Aktivierung durch Glucose-6-phosphat; Hemmung durch Fructose-2,6-bisphosphat', correct: false },
          { id: 'd', label: 'PFK-1 wird nicht allosterisch reguliert, sondern nur über die Genexpression', correct: false }
        ],
        explanation: 'PFK-1 misst den Energiezustand der Zelle: Hohe ATP- und Citratkonzentrationen („Energie und Bausteine genug“) hemmen, AMP („Energiemangel“) hebt die ATP-Hemmung auf. Der stärkste Aktivator ist Fructose-2,6-bisphosphat, dessen Spiegel hormonell (Insulin ↑, Glucagon ↓) über das bifunktionelle Enzym PFK-2/FBPase-2 eingestellt wird. Gleichzeitig hemmt F2,6BP die Fructose-1,6-Bisphosphatase der Gluconeogenese.'
      },

      /* ── 7. Arsenat ───────────────────────────────────────────── */
      {
        type: 'multiple_choice',
        title: 'Arsenatvergiftung',
        prompt: 'Arsenat (HAsO_4^2−) kann im GAPDH-Schritt anstelle von Phosphat eingebaut werden. Das entstehende 1-Arseno-3-phosphoglycerat hydrolysiert spontan zu 3-Phosphoglycerat. Welche Folge hat das für die Glykolyse?',
        choices: [
          { id: 'a', label: 'Die Glykolyse läuft weiter, liefert aber netto kein ATP mehr.', correct: true },
          { id: 'b', label: 'Die Glykolyse kommt sofort zum Stillstand, weil kein 3-PG mehr entsteht.', correct: false },
          { id: 'c', label: 'Es entsteht kein NADH mehr, die ATP-Bilanz bleibt aber gleich.', correct: false },
          { id: 'd', label: 'Die ATP-Ausbeute verdoppelt sich, weil die Kinase-Reaktion übersprungen wird.', correct: false }
        ],
        explanation: 'Das Arsenat-Anhydrid wird hydrolysiert, bevor Phosphoglycerat-Kinase ATP bilden kann. 3-PG entsteht trotzdem, und auch NADH wird gebildet. Es fehlen aber die 2 ATP aus Schritt 7. Die 2 ATP aus der Pyruvatkinase gleichen nur die Investition der Vorbereitungsphase aus → netto 0 ATP. Arsenat wirkt also als Entkoppler der Substratkettenphosphorylierung.'
      },

      /* ── 8. NAD+-Regeneration ─────────────────────────────────── */
      {
        type: 'short_answer',
        title: 'NAD^+-Regeneration unter anaeroben Bedingungen',
        prompt: 'Warum kommt die Glykolyse ohne Sauerstoff rasch zum Erliegen, wenn das gebildete NADH nicht reoxidiert wird? Beschreiben Sie, wie (a) der Skelettmuskel und (b) Hefe das Problem lösen. Geben Sie jeweils Enzym(e) und Endprodukt an.',
        expected_answer: 'Die Zelle hat nur wenig NAD^+. GAPDH (Schritt 6) braucht NAD^+ als Oxidationsmittel. Ohne Reoxidation des NADH (aerob über die Atmungskette) stoppt die Glykolyse an diesem Schritt.\n(a) Muskel — Milchsäuregärung: Lactat-Dehydrogenase reduziert Pyruvat mit NADH zu L-Lactat. Pyruvat + NADH + H^+ → Lactat + NAD^+\n(b) Hefe — alkoholische Gärung: Pyruvat-Decarboxylase (Cofaktor Thiaminpyrophosphat, TPP) spaltet CO_2 ab → Acetaldehyd. Alkohol-Dehydrogenase reduziert Acetaldehyd mit NADH zu Ethanol.\nIn beiden Fällen bleibt die Bilanz bei 2 ATP pro Glucose.'
      },

      /* ── 9. GAPDH-Mechanismus ─────────────────────────────────── */
      {
        type: 'short_answer',
        title: 'Mechanismus der GAPDH',
        prompt: 'Die Oxidation eines Aldehyds zur Carbonsäure ist stark exergon. Erklären Sie, wie GAPDH diese Energie nicht als Wärme verliert, sondern im Acylphosphat 1,3-BPG speichert. Nennen Sie die Schlüsselintermediate und die Rolle des Cysteinrests im aktiven Zentrum.',
        expected_answer: '1) Der Thiolat-Rest eines Cysteins im aktiven Zentrum greift die Aldehydgruppe von GAP nucleophil an → Thiohalbacetal.\n2) Hydridübertragung vom Thiohalbacetal-C auf NAD^+ (Oxidation) → Thioester (Acyl-Enzym) + NADH. Die Oxidationsenergie bleibt in der energiereichen Thioesterbindung erhalten, statt bei der Bildung einer freien Carbonsäure verloren zu gehen.\n3) NADH wird gegen frisches NAD^+ ausgetauscht. Anorganisches Phosphat greift den Thioester an (Phosphorolyse) → 1,3-Bisphosphoglycerat. Das freie Cystein liegt wieder vor.\nDie Kopplung von Oxidation und Phosphorylierung über den Thioester macht den Gesamtschritt nahezu thermoneutral.'
      },

      /* ── 10. Aldolase Klasse I ────────────────────────────────── */
      {
        type: 'short_answer',
        title: 'Aldolase — Retro-Aldol über eine Schiff-Base',
        prompt: 'Die Aldolase der Tiere (Klasse I) spaltet Fructose-1,6-bisphosphat über eine kovalente Zwischenstufe. (a) Welche funktionelle Gruppe des Enzyms reagiert mit welcher Gruppe des Substrats, und welches Intermediat entsteht? (b) Warum ist die vorherige Isomerisierung Glucose-6-P → Fructose-6-P (Schritt 2) dafür notwendig?',
        expected_answer: '(a) Die ε-Aminogruppe eines Lysinrests kondensiert mit der Ketogruppe an C2 von F1,6BP → protonierte Schiff-Base (Iminium-Ion). Das Iminium wirkt als Elektronensenke: Die C3–C4-Bindung wird gespalten (Retro-Aldol), GAP wird freigesetzt, und es entsteht ein Enamin. Dieses wird protoniert, und die Hydrolyse der Schiff-Base setzt DHAP frei.\n(b) Eine Retro-Aldol-Spaltung trennt die Bindung zwischen dem α- und dem β-C-Atom einer β-Hydroxycarbonylverbindung. In Glucose (Carbonyl an C1) läge die gespaltene Bindung zwischen C2 und C3 → ungleiche Bruchstücke C_2 + C_4. Erst mit der Ketogruppe an C2 (Fructose) wird C3–C4 gespalten → zwei C_3-Triosen, die beide (nach TIM) in GAP überführt werden können.'
      }
    ]
  }
];

/* Fischer projections, top (C1) to bottom, and the matching open-chain
   SMILES (stereo checked with RDKit: D-Glucose 2R,3S,4R,5R; D-Fructose
   3S,4R,5R; D-GAP, 1,3-BPG, 3-PG, 2-PG all R). */
const FISCHER = {
  glc:   { smiles: 'O=C[C@H](O)[C@@H](O)[C@H](O)[C@H](O)CO',
           chain: [{ top: 'CHO' }, { L: 'H', R: 'OH' }, { L: 'OH', R: 'H' }, { L: 'H', R: 'OH' }, { L: 'H', R: 'OH' }, { group: 'CH2OH' }] },
  g6p:   { smiles: 'O=C[C@H](O)[C@@H](O)[C@H](O)[C@H](O)COP(=O)(O)O',
           chain: [{ top: 'CHO' }, { L: 'H', R: 'OH' }, { L: 'OH', R: 'H' }, { L: 'H', R: 'OH' }, { L: 'H', R: 'OH' }, { group: 'CH2OP' }] },
  f6p:   { smiles: 'OCC(=O)[C@@H](O)[C@H](O)[C@H](O)COP(=O)(O)O',
           chain: [{ group: 'CH2OH' }, { keto: true }, { L: 'OH', R: 'H' }, { L: 'H', R: 'OH' }, { L: 'H', R: 'OH' }, { group: 'CH2OP' }] },
  f16bp: { smiles: 'O=P(O)(O)OCC(=O)[C@@H](O)[C@H](O)[C@H](O)COP(=O)(O)O',
           chain: [{ group: 'CH2OP' }, { keto: true }, { L: 'OH', R: 'H' }, { L: 'H', R: 'OH' }, { L: 'H', R: 'OH' }, { group: 'CH2OP' }] },
  dhap:  { smiles: 'OCC(=O)COP(=O)(O)O',
           chain: [{ group: 'CH2OH' }, { keto: true }, { group: 'CH2OP' }] },
  gap:   { smiles: 'O=C[C@H](O)COP(=O)(O)O',
           chain: [{ top: 'CHO' }, { L: 'H', R: 'OH' }, { group: 'CH2OP' }] },
  bpg:   { smiles: 'O=C(OP(=O)(O)O)[C@H](O)COP(=O)(O)O',
           chain: [{ top: 'COOP' }, { L: 'H', R: 'OH' }, { group: 'CH2OP' }] },
  pg3:   { smiles: 'OC(=O)[C@H](O)COP(=O)(O)O',
           chain: [{ top: 'COOH' }, { L: 'H', R: 'OH' }, { group: 'CH2OP' }] },
  pg2:   { smiles: 'OC(=O)[C@H](OP(=O)(O)O)CO',
           chain: [{ top: 'COOH' }, { L: 'H', R: 'OP' }, { group: 'CH2OH' }] },
  pep:   { smiles: 'OC(=O)C(=C)OP(=O)(O)O',
           chain: [{ top: 'COOH' }, { R: 'OP', double: true }, { group: 'CH2' }] },
  pyr:   { smiles: 'CC(=O)C(=O)O',
           chain: [{ top: 'COOH' }, { keto: true }, { group: 'CH3' }] },
  php:   { smiles: 'OC(=O)C(=O)COP(=O)(O)O',
           chain: [{ top: 'COOH' }, { keto: true }, { group: 'CH2OP' }] }
};
const MOL = {};
for (const k of Object.keys(FISCHER)) MOL[k] = build(FISCHER[k].chain);

const NODE = { Glc: 'glc', A: 'g6p', B: 'f6p', C: 'f16bp', D: 'dhap', E: 'gap', F: 'bpg', G: 'pg3', H: 'pg2', I: 'pep', J: 'pyr' };
const BY_SMILES = {
  'OC(=O)[C@H](OP(=O)(O)O)CO': 'pg2', 'OC(=O)C(=C)OP(=O)(O)O': 'pep', 'CC(=O)C(=O)O': 'pyr',
  'OC(=O)[C@H](O)COP(=O)(O)O': 'pg3', 'OC(=O)C(=O)COP(=O)(O)O': 'php'
};

for (const e of ENTRIES) {
  for (const sec of e.sections) {
    if (sec.scheme) for (const n of sec.scheme.nodes) {
      const k = NODE[n.id];
      if (k) { n.smiles = FISCHER[k].smiles; n.mol = MOL[k]; }
    }
    // MCQ structures: the quiz draws a molfile given in place of SMILES
    if (sec.givens && BY_SMILES[sec.givens.smiles]) sec.givens.smiles = MOL[BY_SMILES[sec.givens.smiles]];
    for (const c of sec.choices || []) if (c.smiles && BY_SMILES[c.smiles]) c.smiles = MOL[BY_SMILES[c.smiles]];
  }
}

let added = 0;
for (const e of ENTRIES) {
  const i = data.findIndex(q => q.id === e.id);
  if (i >= 0) { data[i] = e; console.log('replaced:', e.id); }
  else { data.push(e); added++; console.log('added:', e.id); }
}
fs.writeFileSync(QFILE, JSON.stringify(data, null, 2) + '\n');
console.log('\nTotal entries:', data.length, '(+' + added + ')');
