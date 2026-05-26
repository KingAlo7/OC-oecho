/**
 * BW batch 5 — BW46 (2020 ErsatzWB Stufe II) Aufgabe 5: Organische Synthesen.
 *   A. Conicein (Jung/Choi 1991)
 *   B. β-trans-Bergamoten (Corey/Desai 1985)
 *   D. Prostaglandin-Fragment (Corey/Ensley 1975)
 *   E. Pericyclische DA (cyclopentadien + fumarsäure)
 * (Aufgabe 5C Aspidospermin ist 25 bp / 11 Strukturen mit Stereo — als short_answer-Übersicht.)
 */
const fs = require('fs');
const path = require('path');
const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const data = JSON.parse(fs.readFileSync(QFILE, 'utf8'));
const existing = new Set(data.map(q => q.id));

const ENTRIES = [
  /* ════════════════════════════════════════════════════════════════════
     A. Conicein (15 bp) — pericyclische 4+2 + 4π-Elektrocyclisierung
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw46-2020-conicein',
    category: 'Mehrstufige Synthesen',
    name: 'Conicein — pericyclische Synthese (BW 2020)',
    difficulty: 'D',
    source: 'ÖChO Bundeswettbewerb 2020 (BW 46), Aufgabe 5 A',
    intro: 'Synthese des heterocyclischen Alkaloids (–)-Coniceín (Indolizidin) nach Jung/Choi (J. Org. Chem. 1991, 56, 6729). Schlüsselschritte: Mesylat-Schutz → Debenzylierung → Acylierung mit Pent-4-enoylchlorid → basenkatalysierte Eliminierung zum Azetin → 4π-elektrocyclisches Ringöffnen → intramolekulare [4+2]-Cycloaddition → Reduktion zum Indolizidin.',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema',
        scheme: {
          nodes: [
            { id: 'Ed', label: '1-Benzyl-azetidin-3-ol', given: true,
              name: '1-Benzyl-azetidin-3-ol',
              smiles: 'OC1CN(Cc2ccccc2)C1',
              explanation: 'Edukt — N-Benzyl-Schutzgruppe + freie OH.' },
            { id: 'A', label: 'A', given: false,
              name: '1-Benzyl-3-(methylsulfonyloxy)-azetidin',
              smiles: 'CS(=O)(=O)OC1CN(Cc2ccccc2)C1',
              note: 'MsCl wandelt die schlechte Abgangsgruppe OH^- in das bessere Mesylat (OMs^-).',
              explanation: 'Veresterung des Alkohols mit Methansulfonylchlorid → Mesylat. Die Mesylgruppe ist eine wesentlich bessere Abgangsgruppe als OH^- und blockiert zugleich die OH-Funktion vor Esterbildung mit dem späteren Säurechlorid.' },
            { id: 'B', label: 'B', given: false,
              name: '3-(Methylsulfonyloxy)-azetidin',
              smiles: 'CS(=O)(=O)OC1CNC1',
              note: 'C_4H_9NSO_3.',
              explanation: 'H_2 / Pd(OH)_2 entfernt die N-Benzyl-Schutzgruppe (Hydrogenolyse) → freies sekundäres Amin.' },
            { id: 'C', label: 'C', given: false,
              name: 'N-Pent-4-enoyl-3-mesyloxy-azetidin',
              smiles: 'C=CCCC(=O)N1CC(OS(C)(=O)=O)C1',
              note: 'C_9H_{15}NSO_4.',
              explanation: 'Acylierung des Amins mit Pent-4-enoylchlorid → tertiäres Amid mit terminalem Alken.' },
            { id: 'D', label: 'D', given: false,
              name: '1-(Pent-4-enoyl)-2,3-dihydroazet (cyclisch)',
              smiles: 'C=CCCC(=O)N1CC=C1',
              note: 'C_8H_{11}NO. Vierring mit C=C.',
              explanation: 'KO^tBu (starke, sterisch gehinderte Base) deprotoniert α zum Mesylat → E2-Eliminierung von MsOH → 4-Ring-Enamid (Azet).' },
            { id: 'E', label: 'E', given: false,
              name: '(1Z,3E)-Hexa-1,3-dien-amid-Derivat (acyclisch)',
              smiles: 'C=CCCC(=O)/N=C/C=C',
              note: 'Acyclisch, 1,3-Dien-System (N als Teil des Diens).',
              explanation: '4π-konrotatorische elektrocyclische Ringöffnung (thermisch, Woodward-Hoffmann) öffnet den 4-Ring → 1,3-Aza-Dien.' },
            { id: 'F', label: 'F', given: false,
              name: 'Bicyclisches Lactam (intramolekulare [4+2])',
              smiles: 'O=C1CCC2CCN12',
              explanation: '[4+2]-Cycloaddition (Diels-Alder) — das in E generierte 1-Aza-Dien addiert intramolekular an das pendante terminale Alken → bicyclisches Indolizidin-Lactam.',
              related_reaction_id: 'diels-alder' },
            { id: 'G', label: 'G = Conicein', given: false,
              name: '(–)-Coniceín (Indolizidin)',
              smiles: 'C1CCC2CCCCN12',
              explanation: '1. H_2/Pd reduziert die verbliebene Doppelbindung; 2. LiAlH_4 reduziert das Lactam zum tertiären Amin → Indolizidin = Conicein.' }
          ],
          edges: [
            { from: ['Ed'], to: 'A', reagent_above: 'MsCl', reagent_below: 'Base' },
            { from: ['A'],  to: 'B', reagent_above: 'H_2 / Pd(OH)_2', reagent_below: 'Debenzylierung' },
            { from: ['B'],  to: 'C', reagent_above: 'Pent-4-enoylchlorid', reagent_below: '' },
            { from: ['C'],  to: 'D', reagent_above: 'KO^tBu', reagent_below: 'E2 (–MsOH)' },
            { from: ['D'],  to: 'E', reagent_above: 'Δ', reagent_below: 'elektrocycl. Ringöffnung (4π, kon)' },
            { from: ['E'],  to: 'F', reagent_above: 'Δ', reagent_below: 'intramolekulare [4+2]' },
            { from: ['F'],  to: 'G', reagent_above: '1. H_2 / Pd', reagent_below: '2. LiAlH_4' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Funktion der Mesyl-Gruppe (5.5)',
        prompt: 'Warum wird die OH-Gruppe in der Conicein-Synthese in ein Mesylat überführt?',
        choices: [
          { id: 'a', label: 'Damit die OH-Gruppe nicht mit dem Säurechlorid verestern kann',                    correct: true },
          { id: 'b', label: 'Um die Wasserlöslichkeit zu erhöhen',                                              correct: false },
          { id: 'c', label: 'Damit OMs^- in der E2-Eliminierung eine bessere Abgangsgruppe ist als OH^-',       correct: true },
          { id: 'd', label: 'Um die Stereochemie umzukehren',                                                   correct: false }
        ],
        explanation: 'Beide korrekten Antworten: (1) OMs^- ist eine deutlich bessere Abgangsgruppe (geringere Nukleophilie) als OH^-, ohne die die Eliminierung C → D nicht abliefe; (2) blockiert zugleich die OH-Funktion gegen unerwünschte Veresterung mit dem späteren Säurechlorid.'
      },
      {
        type: 'short_answer',
        title: 'Pericyclische Schlüssel-Schritte',
        prompt: 'Welche zwei perizyklische Reaktionstypen verbinden D → E → F? Benennen Sie sie konkret (Woodward-Hoffmann).',
        expected_answer: 'D → E: 4π-elektrocyclische Ringöffnung des Cyclobuten-artigen Azets, thermisch konrotatorisch (Woodward-Hoffmann). E → F: intramolekulare [4+2]-Cycloaddition (Hetero-Diels-Alder), thermisch suprafacial/suprafacial — das 1-Aza-Dien reagiert mit dem terminalen Alken als Dienophil.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     B. β-trans-Bergamoten (13.5 bp) — Wittig + Keten-[2+2]
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw46-2020-bergamoten',
    category: 'Mehrstufige Synthesen',
    name: 'β-trans-Bergamoten (Pheromon) — BW 2020',
    difficulty: 'D',
    source: 'ÖChO Bundeswettbewerb 2020 (BW 46), Aufgabe 5 B',
    intro: 'Synthese des Sesquiterpen-Pheromons β-trans-Bergamoten nach Corey/Desai (Tet. Lett. 1985, 26, 3535). Aus Geranylacetat: LDA-Deprotonierung, CO_2-Carboxylierung, Wittig-Methylenierung, Säurechlorid-Bildung, Keten-Erzeugung mit Aminbase, [2+2]-Cycloaddition zum Bicyclo[3.1.1]heptan-Gerüst und Wolff-Kishner-Reduktion.',
    sections: [
      {
        type: 'synthesis',
        title: 'Pfad: Geranylacetat → β-trans-Bergamoten',
        scheme: {
          nodes: [
            { id: 'Ed', label: 'Geranylacetat', given: true,
              name: 'Geranylacetat',
              smiles: 'CC(=CCCC(=CCOC(C)=O)C)C',
              explanation: 'Edukt — Acetat eines C_{10}-Terpen-Alkohols.' },
            { id: 'A', label: 'A', given: false,
              name: 'Lithium-Enolat des Geranylacetats',
              smiles: 'CC(=CCCC(=CCOC(=O)C[Li])C)C',
              explanation: '1 äq. LDA in THF deprotoniert die α-CH_3-Gruppe des Esters → kinetisches Lithium-Enolat.' },
            { id: 'B', label: 'B', given: false,
              name: 'Malonsäure-Halbester (α-Carbonsäure)',
              smiles: 'CC(=CCCC(=CCOC(=O)CC(=O)O)C)C',
              explanation: 'CO_2 wird vom Carbanion nukleophil angegriffen → α-Carboxylierung. Saure Aufarbeitung liefert die freie Säure.' },
            { id: 'C', label: 'C', given: false,
              name: 'α-Methylen-Ester (Wittig-Produkt)',
              smiles: 'CC(=CCCC(=CCOC(=O)C(=C))C)C',
              explanation: 'Wittig-Reagenz Ph_3P=CH_2 wandelt die α-Carbonsäure-Carbonyl in eine =CH_2-Gruppe (Methylenierung).' },
            { id: 'D', label: 'D', given: false,
              name: 'Säurechlorid mit α-Methylen-Gruppe',
              smiles: 'CC(=CCCC(=CCOC(=O)C(=C))C)C',
              note: '40 % Ausbeute. SOCl_2-Aktivierung (siehe Aufgabe — D wird in der nächsten Stufe als Säurechlorid eingesetzt).',
              explanation: 'SOCl_2 wandelt die freie Säure in das Säurechlorid um (Aktivierung für Keten-Bildung).' },
            { id: 'E', label: 'E', given: false,
              name: 'α-Methylen-Keten',
              smiles: 'CC(=CCCC(=CCO\\C(=C=O)\\C=C)C)C',
              note: 'In Toluol, Aminbase (z.B. Et_3N) eliminiert HCl aus dem α-CH-Säurechlorid → Keten (C=C=O).',
              explanation: 'Ein konjugiertes Vinyl-Keten mit terminalem Alken.' },
            { id: 'F', label: 'F', given: false,
              name: 'Bicyclo[3.1.1]heptan-on (Keten-[2+2]-Cycloaddukt)',
              smiles: 'O=C1CC2(CCC1)C2',
              note: 'IR: 1710 cm^{-1} (Cyclobutanon-C=O). Bicyclus mit Vier- und Sechs-Ring kondensiert.',
              explanation: '[2+2]-Cycloaddition zwischen den π-Elektronen des Ketens und einer C=C-Doppelbindung im Molekül → Bicyclo[3.1.1]heptan-Gerüst (Pinen-Skelett).' },
            { id: 'G', label: 'G = β-trans-Bergamoten', given: false,
              name: 'β-trans-Bergamoten',
              smiles: 'CC(=CCCC1(C)CC2CC1C2=C)C',
              note: 'IR ohne C=O bei 1710 cm^{-1} → Carbonyl wegreduziert; exocyclische =CH_2.',
              explanation: 'Wolff-Kishner: NH_2-NH_2 + KO^tBu in DMSO reduziert das Keton zum Methylen (C=O → CH_2) → die exocyclische =CH_2-Gruppe entsteht via Hydrazon und N_2-Eliminierung.' }
          ],
          edges: [
            { from: ['Ed'], to: 'A', reagent_above: '1 äq. LDA', reagent_below: 'THF' },
            { from: ['A'],  to: 'B', reagent_above: 'CO_2',       reagent_below: 'Carboxylierung' },
            { from: ['B'],  to: 'C', reagent_above: 'Ph_3P=CH_2', reagent_below: 'Wittig (83 %)' },
            { from: ['C'],  to: 'D', reagent_above: 'SOCl_2',     reagent_below: '40 %' },
            { from: ['D'],  to: 'E', reagent_above: 'Aminbase',    reagent_below: 'Toluol → Keten' },
            { from: ['E'],  to: 'F', reagent_above: 'Cycloaddition', reagent_below: '[2+2] intramolekular (43 %)' },
            { from: ['F'],  to: 'G', reagent_above: 'NH_2-NH_2, KO^tBu', reagent_below: 'DMSO (Wolff-Kishner)' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Ylid-Mesomerie (Reaktion 2, 5.8)',
        prompt: 'Welche mesomere Grenzstruktur des Wittig-Ylids Ph_3P=CH_2 ist korrekt?',
        choices: [
          { id: 'a', label: 'Ph_3P^+-CH_2^- (Phosphonium-Carbanion)',  correct: true  },
          { id: 'b', label: 'Ph_3P^--CH_2^+ (Phosphor-Carbenium)',     correct: false },
          { id: 'c', label: 'Ph_3P-CH_3 (kein Ylid)',                  correct: false },
          { id: 'd', label: 'Ph_3P-CH_2-Cl',                           correct: false }
        ],
        explanation: 'Das Ylid ist ein 1,2-Dipol — die zweite Grenzstruktur ist Ph_3P^+–CH_2^-, das Carbanion an P^+. Beide Grenzstrukturen tragen zur Stabilisierung bei, und der nukleophile Charakter am C ermöglicht den Angriff auf den Aldehyd.'
      },
      {
        type: 'short_answer',
        title: 'Lösungsmittel-Wahl für die Wittig (5.9)',
        prompt: 'Welches Lösungsmittel ist für die Wittig-Reaktion geeignet und warum?',
        expected_answer: 'Geeignet: THF (aprotisch, koordiniert das Li-Gegenion, zerstört das Ylid nicht). Ungeeignet: EtOH (protisch — protoniert das Ylid und macht es unreaktiv).'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     C. Aspidospermin — Kurzfassung (zu komplex für volles Schema)
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw46-2020-aspidospermin',
    category: 'Mehrstufige Synthesen',
    name: 'Aspidospermin (Stork-Synthese, 1963) — BW 2020',
    difficulty: 'E',
    source: 'ÖChO Bundeswettbewerb 2020 (BW 46), Aufgabe 5 C',
    intro: 'Stork & Dolfini (J. Am. Chem. Soc. 1963, 85, 2872) — die historische erste totalsynthetische Strategie zum Indolalkaloid Aspidospermin. 11 Stufen ausgehend von Butanal: Enamin-Bildung mit Pyrrolidin, Michael-Addition an Acrolein-Ester, Ketal-Schutz, Mannich/Robinson-Annelierung, LiAlH_4-Reduktion, Acylierung, intramolekulare Cyclisierung mit Base, Kondensation mit 2-Methoxyphenylhydrazin (Fischer-Indol-Vorläufer Z).',
    sections: [
      {
        type: 'short_answer',
        title: 'Stork-Enamin (Schritt 1)',
        prompt: 'Was passiert beim Schritt Butanal + Pyrrolidin → A? Welche Reaktionsklasse? Welche E/Z-Geometrie?',
        expected_answer: 'Stork-Enamin-Bildung: das sekundäre Amin Pyrrolidin reagiert mit dem Aldehyd Butanal unter Wasserabspaltung zum Enamin (R_2N-CR\'=CR\'\'H statt zum Iminium). Es entstehen E- und Z-Isomere (das E-Isomer ist meist bevorzugt). Das Enamin dient als nukleophiles Äquivalent für die α-C-Alkylierung des Aldehyds — vorteilhaft gegenüber Enolat, da basische Bedingungen vermieden werden.'
      },
      {
        type: 'short_answer',
        title: 'Robinson-Annelierung (Schritt D + HOAc/T)',
        prompt: 'Wie funktioniert die Robinson-Anellierung im Schritt D → E? Welcher Sechs-Ring entsteht?',
        expected_answer: 'Michael-Addition des Stork-Enamins an einen α,β-ungesättigten Methylvinylketon-Akzeptor, gefolgt von intramolekularer Aldolkondensation (–H_2O) unter HOAc/Wärme → α,β-ungesättigtes Cyclohexenon. Liefert das ABC-Ringsystem von Aspidospermin.'
      },
      {
        type: 'multiple_choice',
        title: 'Bildung von K aus J (5.12)',
        prompt: 'Nach welchem Mechanismus erfolgt die Bildung von K (Hydrazon-Vorläufer) aus dem Keton J + 2-Methoxyphenylhydrazin Z?',
        choices: [
          { id: 'a', label: 'A_N (nukleophile Addition) + Eliminierung von H_2O',        correct: true  },
          { id: 'b', label: 'S_N1',                                                       correct: false },
          { id: 'c', label: 'E1',                                                         correct: false },
          { id: 'd', label: 'Diels-Alder',                                                correct: false }
        ],
        explanation: 'Klassische Carbonyl-Kondensation: nukleophile Addition (A_N) des Hydrazin-N an den Carbonyl-C → Tetraeder-Intermediat → Eliminierung von H_2O → Hydrazon. Anschließend (außerhalb dieser Frage) liefert eine Fischer-Indol-artige [3,3]-sigmatrope Umlagerung den Indol-Ring von Aspidospermin.'
      },
      {
        type: 'short_answer',
        title: 'Konfiguration der stereogenen Zentren',
        prompt: 'Aspidospermin enthält 4 stereogene Zentren (1-4) im Skelett. Welche absoluten Konfigurationen werden in der Originalfrage angegeben für die Zentren 2, 3, 4?',
        expected_answer: '2 = R; 3 = R; 4 = R (alle drei gleich). Zentrum 1 wird in der Aufgabe nicht zugeordnet, da es nicht stereogen ist (Spiro-/Brückenkopf-C in symmetrischer Umgebung). Die Stereoanordnung erzeugt die typische cis-Verknüpfung der C-D-Ringe in den Aspidosperma-Alkaloiden.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     D. Prostaglandin-Fragment (10 bp) — Iodolactonisierung
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw46-2020-prostaglandin-fragment',
    category: 'Mehrstufige Synthesen',
    name: 'Prostaglandin-Fragment (Corey 1975) — BW 2020',
    difficulty: 'C',
    source: 'ÖChO Bundeswettbewerb 2020 (BW 46), Aufgabe 5 D',
    intro: 'Corey/Ensley (J. Am. Chem. Soc. 1975, 97, 6908) — Schlüssel-Sequenz zur Synthese eines Prostaglandin-Cyclopentan-Bausteins. LiAlH_4-Reduktion eines Bicyclo-Ester-Bausteins → Diol → NaIO_4-Diolspaltung → Aldehyd-Säure → Iodolactonisierung (I_2/KI in NaHCO_3) → cis-konfiguriertes Iod-Lacton.',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema',
        scheme: {
          nodes: [
            { id: 'Ed', label: 'Bicyclo-Ester', given: true,
              name: 'Norbornen-Diester-Edukt (BnO-CH_2 / OH / COOR)',
              smiles: 'O=C(OC)C1C(O)C2CC1C=C2COCc1ccccc1',
              explanation: 'Bicyclo[2.2.1]hept-2-en mit endo-OH, endo-COOR und BnO-CH_2 — Corey-Lactol-Vorläufer.' },
            { id: 'A', label: 'A', given: false,
              name: 'Triol-Diol (LiAlH_4-Reduktion)',
              smiles: 'OCC1C(O)C2CC1C=C2COCc1ccccc1',
              note: '1,5 bp.',
              explanation: 'LiAlH_4 reduziert die Ester-Funktion zum primären Alkohol (A_N am Carbonyl, –OR^-). Das übrige Norbornen-Gerüst bleibt unverändert.' },
            { id: 'B', label: 'B', given: false,
              name: 'Cyclopenten-Aldehyd-Carbonsäure (NaIO_4-Spaltung)',
              smiles: 'O=C(O)C1C(O)C(C=O)C=C1COCc1ccccc1',
              note: '2 bp. Vicinales Diol nicht vorhanden — Spaltung erfolgt nach Vorbehandlung; in Corey-Variante eigentlich Periodat-Spaltung des intermediären Diols.',
              explanation: 'NaIO_4 spaltet die gegenüberliegende C-C-Bindung des cis-Diols → öffnet den Bicyclus zum 5-Ring mit einer Aldehyd- und einer Carbonsäure-Funktion.' },
            { id: 'C', label: 'C', given: false,
              name: 'Iod-Lacton (cis-konfiguriert)',
              smiles: 'IC1C(O)C(COCc2ccccc2)CC1OC(=O)C',
              note: '3 bp. Iodolactonisierung: das Carboxylat (deprotoniert von NaHCO_3) greift das mit I^+ aktivierte Alken intramolekular trans-diaxial an.',
              explanation: 'I_2 bildet zunächst ein cyclisches Iodonium-Ion mit dem Alken; das durch NaHCO_3 deprotonierte Carboxylat öffnet das Iodonium von der Rückseite (anti) → cis-fusioniertes Iod-γ-Lacton mit Iod und Acyloxy in 1,2-trans-Stellung.',
              related_reaction_id: 'halogenierung-alken' }
          ],
          edges: [
            { from: ['Ed'], to: 'A', reagent_above: 'LiAlH_4', reagent_below: 'Ester-Reduktion' },
            { from: ['A'],  to: 'B', reagent_above: 'NaIO_4', reagent_below: 'Diolspaltung' },
            { from: ['B'],  to: 'C', reagent_above: 'I_2 / KI', reagent_below: 'NaHCO_3 (Iodolactonisierung)' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Funktion von NaHCO_3 (5.15)',
        prompt: 'Welche Rolle spielt NaHCO_3 in der Iodolactonisierung B → C?',
        choices: [
          { id: 'a', label: 'Es wirkt als Base und deprotoniert die -COOH-Funktion zum Carboxylat-Nukleophil', correct: true  },
          { id: 'b', label: 'Es reduziert Iod zu Iodid',                                                       correct: false },
          { id: 'c', label: 'Es bildet den Iodonium-Ring',                                                     correct: false },
          { id: 'd', label: 'Es ist ein Lösungsmittel',                                                        correct: false }
        ],
        explanation: 'NaHCO_3 ist eine milde Base — gerade stark genug, um die Carbonsäure (pK_a ≈ 4-5) zu deprotonieren, aber zu schwach, um andere Funktionalitäten zu beeinflussen. Das Carboxylat ist ein deutlich besseres Nukleophil als die Säure und greift das Iodonium-Ion intramolekular an → Lactonbildung.'
      },
      {
        type: 'short_answer',
        title: 'Mechanismus B → A (5.17)',
        prompt: 'Welcher Mechanismus liegt der Reaktion Edukt → A zugrunde und welche Funktion erfüllt LiAlH_4?',
        expected_answer: 'A_N am Carbonyl (nukleophile Acyl-Substitution / Reduktion): Hydrid (H^-) aus LiAlH_4 addiert an den Carbonyl-C des Esters → Tetraeder-Intermediat → OR^- als Abgangsgruppe → Aldehyd → zweite H^--Addition → Alkoholat → bei Aufarbeitung primärer Alkohol. LiAlH_4 fungiert als Hydrid-Quelle und reduziert die Carbonsäure-Ester-Funktion vollständig zum primären Alkohol.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     E. Pericyclische DA (9 bp) — cyclopentadien + fumarsäure
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw46-2020-pericyclic-da',
    category: 'Pericyclische Reaktionen',
    name: 'Diels-Alder mit Fumarsäure & photochem. [4+2] — BW 2020',
    difficulty: 'C',
    source: 'ÖChO Bundeswettbewerb 2020 (BW 46), Aufgabe 5 E',
    intro: 'Zwei Diels-Alder-Aufgaben: (1) Fumarsäure als Dienophil reagiert thermisch mit (E,E)-Hexa-2,4-dien (offenkettiges 1,3-Dien) bzw. mit Cyclopentadien zum Norbornen-Dicarbonsäure-Addukt; (2) photochemisch erzeugtes ortho-Chinodimethan (aus 2-Benzyl-benzophenon) reagiert in [4+2]- und [4+4]-Cycloadditionen mit Maleinsäureanhydrid.',
    sections: [
      {
        type: 'synthesis',
        title: 'Aufgabe 5.18: Fumarsäure + Diene → A und B',
        scheme: {
          nodes: [
            { id: 'D1', label: 'Cyclopentadien', given: true,
              name: 'Cyclopentadien',
              smiles: 'C1=CCC=C1',
              explanation: '1,3-Dien (s-cis fixiert).' },
            { id: 'FA', label: 'Fumarsäure', given: true,
              name: '(E)-2-Butendisäure (Fumarsäure)',
              smiles: 'OC(=O)/C=C/C(=O)O',
              explanation: 'Dienophil mit trans-konfigurierten COOH-Gruppen.' },
            { id: 'A', label: 'A', given: false,
              name: 'Bicyclo[2.2.1]hept-2-en-trans-5,6-dicarbonsäure',
              smiles: 'OC(=O)C1C2CC(C=C2)C1C(=O)O',
              note: '1,5 bp. cis-fusioniertes Norbornen mit den COOH-Gruppen in trans-Stellung zueinander (gemäß Konservierung der Dienophil-Stereochemie, „cis-Prinzip").',
              explanation: '[4+2]-Diels-Alder zwischen Cyclopentadien und Fumarsäure: thermisch suprafacial/suprafacial — die ursprünglich trans-Konfiguration des Dienophils wird ins Produkt übertragen (5,6-trans-Dicarbonsäure).' },
            { id: 'D2', label: 'Hexa-2,4-dien', given: true,
              name: '(E,E)-Hexa-2,4-dien',
              smiles: 'C/C=C/C=C/C',
              explanation: 'Offenkettiges 1,3-Dien — bedarf für DA einer s-cis-Konformation.' },
            { id: 'B', label: 'B', given: false,
              name: 'trans,trans-3,6-Dimethyl-cyclohex-4-en-1,2-dicarbonsäure',
              smiles: 'CC1C(C(O)=O)C(C(O)=O)C(C)C=C1',
              note: '1,5 bp. Vier stereogene Zentren — die Methyl-Gruppen am Dien und die COOH-Gruppen am Dienophil bleiben jeweils in ihrer ursprünglichen relativen Anordnung erhalten.',
              explanation: '[4+2]-Cycloaddition: aus (E,E)-Dien + (E)-Dienophil entsteht ein Cyclohexen, in dem beide Methyl-Gruppen all-trans zu den beiden COOH-Gruppen stehen.' }
          ],
          edges: [
            { from: ['D1','FA'], to: 'A', reagent_above: 'Δ', reagent_below: '[4+2] suprafacial/suprafacial' },
            { from: ['D2','FA'], to: 'B', reagent_above: 'Δ', reagent_below: '[4+2]' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Aufgabe 5.19: Photochemisches ortho-Chinodimethan + Maleinsäureanhydrid',
        scheme: {
          nodes: [
            { id: 'BP', label: 'Edukt', given: true,
              name: '2-Benzyl-benzophenon',
              smiles: 'O=C(c1ccccc1)c1ccccc1Cc1ccccc1',
              explanation: 'Aromatisches Keton mit benachbarter Benzyl-Gruppe — Vorläufer für photochemische Norrish-Typ-II / Enolisierung.' },
            { id: 'En', label: 'Enol', given: false,
              name: 'Photo-Enol (ortho-Chinodimethan-Derivat)',
              smiles: 'OC(=C1C=CC=CC1=Cc1ccccc1)c1ccccc1',
              note: 'Hellschritt: das Keton tautomerisiert photochemisch in das instabile ortho-Chinodimethan-Enol.',
              explanation: 'UV-Anregung führt zu γ-H-Wanderung (Norrish II / 1,5-H-Shift) → ortho-Chinodimethan (= 1,3-Dien an benzoanellierten Sechsring).' },
            { id: 'A', label: 'A', given: false,
              name: 'Benzocyclobuten-ol (thermisch, 4π elektrocycl. Schluss)',
              smiles: 'OC1(c2ccccc2)C(c2ccccc2)c2ccccc21',
              note: '2 bp. Konrotatorischer 4π-elektrocyclischer Ringschluss.',
              explanation: 'In der Wärme schließt das ortho-Chinodimethan thermisch konrotatorisch (4π) zum Benzocyclobuten-ol → das Stereozentrum trägt OH und Ph in disrotatorischer Anordnung.' },
            { id: 'B', label: 'B', given: false,
              name: 'Benzocyclobuten-ol (photochemisch, 4π disrotatorisch)',
              smiles: 'OC1(c2ccccc2)C(c2ccccc2)c2ccccc21',
              note: '2 bp. Photochemisch dis-rotatorischer Ringschluss — Stereo-Komplement zu A.',
              explanation: 'Belichtung des Enols liefert via disrotatorischem 4π-Ringschluss das diastereomere Benzocyclobuten-ol (Stereo-Inversion gegenüber A).' },
            { id: 'C', label: 'C', given: false,
              name: '[4+2]-Cycloaddukt aus ortho-Chinodimethan + Maleinsäureanhydrid',
              smiles: 'O=C1OC(=O)C2C1C(O)(c1ccccc1)c1ccccc1C2c1ccccc1',
              note: '2 bp. Tetrahydronaphthalin-Anhydrid mit cis-konfiguriertem Anhydrid (vom Maleinsäureanhydrid übertragen).',
              explanation: 'Maleinsäureanhydrid als Dienophil reagiert mit dem photochemisch erzeugten ortho-Chinodimethan in einer [4+2]-Cycloaddition → fused Tetrahydronaphthalin-Anhydrid mit Phenyl- und Hydroxy-Substituenten.' }
          ],
          edges: [
            { from: ['BP'], to: 'En', reagent_above: 'Licht', reagent_below: '1,5-H-Shift' },
            { from: ['En'], to: 'A', reagent_above: 'Hitze', reagent_below: '4π konrotatorisch' },
            { from: ['En'], to: 'B', reagent_above: 'Licht', reagent_below: '4π disrotatorisch' },
            { from: ['En'], to: 'C', reagent_above: 'Maleinsäureanhydrid', reagent_below: '[4+2]' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Stereochemie-Regel der Diels-Alder',
        prompt: 'Welche Aussage zur Stereochemie der Diels-Alder-Reaktion ist KORREKT?',
        choices: [
          { id: 'a', label: 'Die cis/trans-Beziehung der Substituenten am Dienophil bleibt im Produkt erhalten („cis-Prinzip")', correct: true  },
          { id: 'b', label: 'Dienophil-Konfiguration wird stets invertiert',                                                     correct: false },
          { id: 'c', label: 'Die Reaktion verläuft stets antarafacial am Dien',                                                  correct: false },
          { id: 'd', label: 'Das endo-Produkt ist stets das thermodynamisch stabilere',                                          correct: false }
        ],
        explanation: 'Die konzertierte [4+2]-Cycloaddition ist suprafacial/suprafacial — alle vier neuen σ-Bindungen werden gleichzeitig auf derselben Seite des Diens bzw. Dienophils gebildet. Folglich wird die Stereochemie beider Edukte ins Produkt übernommen (cis-Prinzip). Endo ist meist kinetisch (nicht thermodynamisch) bevorzugt.'
      },
      {
        type: 'short_answer',
        title: 'kon- vs. dis-rotatorisch',
        prompt: 'Erklären Sie kurz mit Woodward-Hoffmann, warum der 4π-elektrocyclische Ringschluss des Photo-Enols thermisch konrotatorisch, photochemisch aber disrotatorisch verläuft.',
        expected_answer: 'Bei 4π-Elektrocyclisierungen entscheidet die Symmetrie des HOMO. Thermisch ist das HOMO ψ_2 (antisymmetrisch) — der konrotatorische Schluss bringt die beiden p-Orbitale phasengleich überein. Photochemisch wird ein Elektron in ψ_3 (symmetrisch) angeregt — der disrotatorische Schluss ist nun phasengleich. Die beiden Mechanismen liefern stereochemisch komplementäre Produkte (cis vs trans-Anordnung der terminalen Substituenten).'
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
