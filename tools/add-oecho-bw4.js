/**
 * BW batch 4 — BW47 (2021): Thymol, Capsaicin, Carvon syntheses.
 */
const fs = require('fs');
const path = require('path');
const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const data = JSON.parse(fs.readFileSync(QFILE, 'utf8'));
const existing = new Set(data.map(q => q.id));

const ENTRIES = [
  /* ════════════════════════════════════════════════════════════════════
     BW 47 (2021) — Aufgabe 2 A: Thymol (Oregano) aus p-Cymol
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw47-2021-thymol',
    category: 'Mehrstufige Synthesen',
    name: 'Thymol (Oregano) aus p-Cymol — BW 2021',
    difficulty: 'B',
    source: 'ÖChO Bundeswettbewerb 2021 (BW 47), Aufgabe 2 A',
    intro: 'Synthese des Aromastoffes Thymol (Oregano-Hauptkomponente) aus p-Cymol. Klassische 3-Stufen-Sequenz: Sulfonierung (SE) → Phenol-Bildung über Alkalischmelze (SN) → para-Friedel-Crafts-Alkylierung mit Isopropylchlorid/AlCl_3 (SE).',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema',
        scheme: {
          nodes: [
            { id: 'Ed', label: 'p-Cymol', given: true, name: 'p-Cymol (1-Methyl-4-isopropylbenzol)',
              smiles: 'Cc1ccc(C(C)C)cc1',
              explanation: 'Ausgangsmaterial. Beide Substituenten sind aktivierend.' },
            { id: 'A', label: 'A', given: false, name: 'p-Cymol-2-sulfonsäure',
              smiles: 'Cc1ccc(C(C)C)cc1S(=O)(=O)O',
              explanation: 'SO_3/H_2SO_4: Sulfonierung in 2-Position (SE — beide bestehende Alkyl-Substituenten dirigieren ortho/para). Mechanismus 1: S_E.' },
            { id: 'C', label: 'C', given: false, name: 'Thymol (2-Isopropyl-5-methylphenol)',
              smiles: 'Cc1ccc(O)c(C(C)C)c1',
              explanation: 'Alkali-Schmelze: NaOH (Schmelze) substituiert die Sulfonat-Gruppe durch OH (Ar-SN, Meisenheimer-artig); H^+-Aufarbeitung liefert Thymol. Mechanismus 2: S_N am Aromaten.' },
            { id: 'IC', label: '(2-Cl-Propan)', given: false, name: 'Isopropylchlorid (Elektrophil)',
              smiles: 'CC(C)Cl',
              explanation: 'Friedel-Crafts-Elektrophil; AlCl_3 polarisiert die C-Cl-Bindung als Lewis-Säure und macht den C zum starken Elektrophil.' },
            { id: 'B', label: 'B', given: false, name: '3-Isopropylphenol (meta-Carvacrol-Isomer)',
              smiles: 'CC(C)c1cccc(O)c1',
              note: 'Hinweis: Aufgrund der Lewis-Säure-Aktivierung wandert die Iso-Propyl-Gruppe in meta-Position (Carbenium-Wanderung möglich).',
              explanation: 'AlCl_3 + Isopropylchlorid → Isopropyl-Kation → SE am Aromaten. Da Thymol als Phenol stark aktivierend ist, kann unter den Bedingungen Umlagerung/Migration zum meta-Substitutionsmuster erfolgen.',
              related_reaction_id: 'fc-alkylierung' }
          ],
          edges: [
            { from: ['Ed'], to: 'A', reagent_above: 'SO_3 / H_2SO_4',     reagent_below: 'SE (1)' },
            { from: ['A'],  to: 'C', reagent_above: '1. NaOH-Schmelze',   reagent_below: '2. H^+ (SN, 2)' },
            { from: ['C','IC'], to: 'B', reagent_above: 'AlCl_3',          reagent_below: 'SE (3)' }
          ]
        }
      },
      {
        type: 'multiple_choice',
        title: 'Funktion von AlCl_3',
        prompt: 'Warum wird Aluminiumchlorid für die Friedel-Crafts-Alkylierung als Katalysator benötigt?',
        choices: [
          { id: 'a', label: 'AlCl_3 ist eine Brønsted-Säure',                                   correct: false },
          { id: 'b', label: 'AlCl_3 ist eine Lewis-Säure und aktiviert das schwache Elektrophil RCl', correct: true  },
          { id: 'c', label: 'AlCl_3 stabilisiert das aromatische System',                       correct: false },
          { id: 'd', label: 'AlCl_3 schützt die OH-Gruppe',                                     correct: false }
        ],
        explanation: 'AlCl_3 (Lewis-Säure) koordiniert das Cl der C-Cl-Bindung, polarisiert diese und macht den C zu einem Carbenium-artigen starken Elektrophil. Ohne diese Aktivierung wäre Isopropylchlorid kein hinreichend gutes Elektrophil für die elektrophile aromatische Substitution.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     BW 47 (2021) — Aufgabe 2 B: Capsaicin aus Vanillin
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw47-2021-capsaicin',
    category: 'Mehrstufige Synthesen',
    name: 'Capsaicin aus Vanillin — BW 2021',
    difficulty: 'C',
    source: 'ÖChO Bundeswettbewerb 2021 (BW 47), Aufgabe 2 B',
    intro: 'Capsaicin — der Schärfestoff in Chili — wird in zwei parallelen Strängen aufgebaut: aus Vanillin via Imin (Schiff-Base) zum primären Amin (B), und aus 6-Bromhexansäure via Wittig-Reagenz (D) + isobutyraldehyd-Kopplung (Wittig) zum (E)-α,β-ungesättigten Carbonsäure (E). Säurechlorid-Bildung (F) und Aminolyse mit B liefert Capsaicin (G).',
    sections: [
      {
        type: 'synthesis',
        title: 'Pfad 1: Vanillin → Amin B',
        scheme: {
          nodes: [
            { id: 'V', label: 'Vanillin', given: true, name: 'Vanillin (4-Hydroxy-3-methoxybenzaldehyd)',
              smiles: 'COc1cc(C=O)ccc1O',
              explanation: 'Edukt aus Vanille-Schoten.' },
            { id: 'A', label: 'A', given: false, name: 'Imin (Schiff-Base) aus Vanillin + NH_3',
              smiles: 'COc1cc(/C=N)ccc1O',
              explanation: 'NH_3 addiert ans Aldehyd-Carbonyl, -H_2O → Imin.' },
            { id: 'B', label: 'B', given: false, name: '4-Hydroxy-3-methoxybenzylamin',
              smiles: 'COc1cc(CN)ccc1O',
              explanation: 'NaBH_3CN reduziert das Imin selektiv zum primären Amin (reduktive Aminierung; in einem Topf möglich).' }
          ],
          edges: [
            { from: ['V'], to: 'A', reagent_above: 'NH_3',      reagent_below: '-H_2O' },
            { from: ['A'], to: 'B', reagent_above: 'NaBH_3CN',  reagent_below: '' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Pfad 2: 6-Bromhexansäure → α,β-ungesättigte Säure E → Säurechlorid F',
        scheme: {
          nodes: [
            { id: 'C', label: 'C', given: false, name: '6-Bromhexansäure',
              smiles: 'OC(=O)CCCCCBr',
              note: 'C_6H_{11}BrO_2. 1H-NMR zeigt 1H (COOH), 2H (CH_2-Br) + 8H (Methylene).',
              explanation: 'Edukt — terminales Alkylbromid.' },
            { id: 'D', label: 'D', given: false, name: 'Phosphonium-Ylid (Wittig-Reagenz)',
              smiles: 'OC(=O)CCCCC[P+](c1ccccc1)(c2ccccc2)c3ccccc3',
              explanation: 'Reaktion mit Triphenylphosphin (PPh_3) → Phosphoniumsalz. Nach Deprotonierung mit KO^tBu entsteht das Ylid (Phosphonium-Carbanion).' },
            { id: 'E', label: 'E', given: false, name: '(E)-8-Methyl-non-6-ensäure',
              smiles: 'CC(C)/C=C/CCCCC(=O)O',
              note: '1H-NMR: zwei Signale bei 6-7 ppm mit Kopplung J = 15,8 Hz (typisch trans).',
              explanation: 'Wittig-Reaktion: Ylid + Isobutyraldehyd (CH_3)_2CH-CHO → α,β-ungesättigte Säure mit (E)-Konfiguration. Über das Oxaphosphetan-Intermediat.' },
            { id: 'F', label: 'F', given: false, name: 'Säurechlorid von E',
              smiles: 'CC(C)/C=C/CCCCC(=O)Cl',
              explanation: 'SOCl_2 wandelt die Carbonsäure zum Säurechlorid.' }
          ],
          edges: [
            { from: ['C'], to: 'D', reagent_above: 'PPh_3', reagent_below: 'dann KO^tBu' },
            { from: ['D'], to: 'E', reagent_above: '(CH_3)_2CH-CHO', reagent_below: 'Wittig' },
            { from: ['E'], to: 'F', reagent_above: 'SOCl_2',          reagent_below: '' }
          ]
        }
      },
      {
        type: 'synthesis',
        title: 'Kupplung zum Capsaicin (G)',
        scheme: {
          nodes: [
            { id: 'G', label: 'Capsaicin', given: false, name: 'Capsaicin',
              smiles: 'COc1cc(CNC(=O)CCCC/C=C/C(C)C)ccc1O',
              explanation: 'Aminolyse: das primäre Amin B greift den Carbonyl-C des Säurechlorids F nukleophil an, -HCl → sekundäres Amid = Capsaicin.' }
          ],
          edges: [
            { from: ['F','B'], to: 'G', reagent_above: 'Δ', reagent_below: '-HCl' }
          ]
        }
      },
      {
        type: 'short_answer',
        title: 'Reagenz d für die Wittig-Reaktion',
        prompt: 'Welche zwei Reagenzien sind für den Wittig-Schritt D → E gemeinsam erforderlich?',
        expected_answer: 'KO^tBu (starke, sterisch gehinderte Base, deprotoniert das Phosphoniumsalz zum Ylid) und (CH_3)_2CH-CHO (Isobutyraldehyd, der Aldehyd-Partner für die Olefinbildung). Das Ylid greift den Carbonyl-C des Aldehyds nukleophil an, bildet Betaine → Oxaphosphetan → Zerfall zu (E)-Alken + Ph_3P=O.'
      }
    ]
  },

  /* ════════════════════════════════════════════════════════════════════
     BW 47 (2021) — Aufgabe 2 C: (R)-Carvon — BW 2021
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'bw47-2021-carvon',
    category: 'Mehrstufige Synthesen',
    name: 'Carvon (Kümmel-Aroma) — BW 2021',
    difficulty: 'D',
    source: 'ÖChO Bundeswettbewerb 2021 (BW 47), Aufgabe 2 C',
    intro: 'Synthese des (R)-Carvon-Aromastoffes (Kümmel/Carrway). Komplexe Sequenz aus 9 Stufen: Grignard-Addition + Dehydratisierung, Ketalschutz, SeO_2-α-Oxidation, LiAlH_4-Reduktion, Hg-katalysierte Vinyletherbildung, Claisen-Umlagerung, TsOH-Hydrolyse und basenkatalysierte intramolekulare Aldolkondensation. Das Schema enthält ein „Wolken-feld" mit verdecktem Reagenz F, das via Strukturhinweise rekonstruiert werden muss.',
    sections: [
      {
        type: 'synthesis',
        title: 'Synthese-Schema',
        scheme: {
          nodes: [
            { id: 'A', label: 'A', given: false, name: '(E)-4-Methylpent-2-enoylchlorid',
              smiles: 'CC(C)/C=C/C(=O)Cl',
              note: 'C_6H_9ClO. MS: zwei Molekülpeaks 132 / 134 im Verhältnis 75:25 (typisches Cl-Isotopenmuster). 1H-NMR-Signale bei 6,14 / 7,18 ppm mit J = 16 Hz (trans-Alken). Hydrolyseempfindlich.',
              explanation: 'Edukt — α,β-ungesättigtes Säurechlorid.' },
            { id: 'B', label: 'B', given: false, name: 'α,β-ungesättigtes Keton (Grignard-Produkt)',
              smiles: 'CC(C)/C=C/C(=O)CC',
              explanation: '1. EtMgBr addiert an das Acylchlorid (1,2-Addition, einmal); 2. saure Aufarbeitung liefert das Ethylketon.' },
            { id: 'C', label: 'C', given: false, name: 'Acetal (1,3-Dioxolan-geschütztes Keton)',
              smiles: 'CC(C)/C=C/C1(CC)OCCO1',
              note: 'C besitzt nur ein Proton im Bereich 6-7 ppm, kann keine E/Z-Isomere bilden.',
              explanation: 'Ethylenglycol + H^+ schützt das Keton als 1,3-Dioxolan (Ketal-Bildung).' },
            { id: 'D', label: 'D', given: false, name: 'α,β-ungesättigter Aldehyd (SeO_2-Produkt)',
              smiles: 'O=C/C=C/C(C)(C1(CC)OCCO1)C',
              note: 'D zeigt im 1H-NMR ein Proton bei 9,8 ppm (Aldehyd-H).',
              explanation: 'SeO_2 oxidiert eine allylische CH_3-Gruppe zum α,β-ungesättigten Aldehyd (Riley-Oxidation).' },
            { id: 'E', label: 'E', given: false, name: 'Allyl-Alkohol',
              smiles: 'OC/C=C/C(C)(C1(CC)OCCO1)C',
              explanation: 'LiAlH_4 reduziert den Aldehyd zum Alkohol.' },
            { id: 'F', label: 'F', given: false, name: 'Vinyl-Allyl-Ether',
              smiles: 'C=COC/C=C/C(C)(C1(CC)OCCO1)C',
              note: 'F enthält die Vinylether-Funktion für die Claisen-Umlagerung. Aus E + Vinylethyl-Ether (CH_2=CHOEt) unter Hg(OAc)_2-Katalyse (Transferalkylierung).',
              explanation: 'Hg(OAc)_2 katalysiert den Austausch von OH durch -O-CH=CH_2 (Vinyl-Ether-Bildung).' },
            { id: 'G', label: 'G', given: false, name: 'γ,δ-ungesättigter Aldehyd (Claisen-Produkt)',
              smiles: 'O=CC/C(=C/C(C)(C1(CC)OCCO1)C)C',
              explanation: '[3,3]-sigmatrope Claisen-Umlagerung: der Allyl-Vinyl-Ether reorganisiert konzertiert → γ,δ-ungesättigter Aldehyd mit neuer C-C-Bindung an der distalen Allyl-Position.' },
            { id: 'H', label: 'H', given: false, name: 'Diketon (Ketal entschützt)',
              smiles: 'O=CC/C(=C\\C(=O)CC)/C(=C)C',
              note: 'Aciditätshinweis: α-H zum Aldehyd sind am acidesten.',
              explanation: 'TsOH (saurer Katalysator) entfernt das Ketal-Schutzgruppe → Diketon mit α,β-Allyl-Verzweigung.' },
            { id: 'I', label: '(R)-Carvon', given: false, name: '(R)-Carvon',
              smiles: 'O=C1CC[C@@H](C(=C)C)CC1=C',
              note: 'In der Originalfrage: "Carvon" mit Methyl + Isopropenyl-Gruppen am Cyclohexenon.',
              explanation: 'Basenkatalysierte intramolekulare Aldolkondensation (-H_2O) schließt den 6-Ring zum Cyclohex-2-enon mit der typischen Carvon-Konstitution.',
              related_reaction_id: 'aldoladdition' }
          ],
          edges: [
            { from: ['A'], to: 'B', reagent_above: '1. EtMgBr', reagent_below: '2. H^+' },
            { from: ['B'], to: 'C', reagent_above: 'H^+/(CH_2OH)_2', reagent_below: 'Ketalisierung' },
            { from: ['C'], to: 'D', reagent_above: 'SeO_2', reagent_below: 'allylische α-Oxidation' },
            { from: ['D'], to: 'E', reagent_above: 'LiAlH_4', reagent_below: '' },
            { from: ['E'], to: 'F', reagent_above: 'Hg(OAc)_2', reagent_below: 'CH_2=CH-OEt' },
            { from: ['F'], to: 'G', reagent_above: 'Claisen-Umlagerung', reagent_below: 'Δ' },
            { from: ['G'], to: 'H', reagent_above: 'TsOH', reagent_below: 'Ketal-Hydrolyse' },
            { from: ['H'], to: 'I', reagent_above: 'Base', reagent_below: 'intramolekulare Aldolkondensation' }
          ]
        }
      },
      {
        type: 'short_answer',
        title: 'Acideste H in H',
        prompt: 'Welche H-Atome in der offenkettigen Verbindung H sind die acidesten, und warum?',
        expected_answer: 'Die α-H-Atome zum Aldehyd-Carbonyl. Sie werden bei Deprotonierung mesomeriestabilisiert: das Enolat-Carbanion ist über C=C/C-C^- Resonanz mit der Carbonyl-Gruppe in Konjugation. pK_a ≈ 17 für gewöhnliche α-Aldehyd-Protonen vs ≈25 für nicht-aktivierte Alkyl-Protonen.'
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
