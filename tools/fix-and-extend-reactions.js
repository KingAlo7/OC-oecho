/**
 * (1) Fix broken related_reaction_id values in questions.json
 * (2) Add missing reactions to reactions.json (from BW/LW qualitative list)
 *
 * Broken-link rewrites (after manual triage of the 7 broken keys):
 *   nitrierung           → arom-nitrierung
 *   fc-alkylierung       → friedel-crafts-alkyl
 *   fc-acylierung        → friedel-crafts-acyl
 *   ozonolyse-oxidativ   → ozonolyse
 *   halogenierung-alken  → iodolactonisierung   (these refs were all iodolactonisations, not simple halogenations)
 *   sn2-alkylhalogenid   → sn2-alkylhalogenid   (NEW generic reaction added)
 *   ester-pyrolyse       → ester-pyrolyse       (NEW reaction added)
 */
const fs = require('fs');
const path = require('path');

const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const RFILE = path.join(__dirname, '..', 'data', 'reactions.json');

const questions = JSON.parse(fs.readFileSync(QFILE, 'utf8'));
const reactions = JSON.parse(fs.readFileSync(RFILE, 'utf8'));

/* ──────────────────────────────────────────────────────────────────
   STEP 1: Rewrite broken related_reaction_id values
   ────────────────────────────────────────────────────────────────── */
const REWRITES = {
  'nitrierung':         'arom-nitrierung',
  'fc-alkylierung':     'friedel-crafts-alkyl',
  'fc-acylierung':      'friedel-crafts-acyl',
  'ozonolyse-oxidativ': 'ozonolyse',
  'halogenierung-alken':'iodolactonisierung'
  // 'sn2-alkylhalogenid' and 'ester-pyrolyse' kept as-is (new reactions added below)
};

function rewriteNode(n) {
  if (n.related_reaction_id && REWRITES[n.related_reaction_id]) {
    const old = n.related_reaction_id;
    n.related_reaction_id = REWRITES[old];
    return 1;
  }
  return 0;
}

let rewrites = 0;
for (const q of questions) {
  rewrites += rewriteNode(q);
  if (Array.isArray(q.sections)) {
    for (const s of q.sections) {
      rewrites += rewriteNode(s);
      if (s.scheme && Array.isArray(s.scheme.nodes)) {
        s.scheme.nodes.forEach(n => { rewrites += rewriteNode(n); });
      }
    }
  }
  if (q.scheme && Array.isArray(q.scheme.nodes)) {
    q.scheme.nodes.forEach(n => { rewrites += rewriteNode(n); });
  }
}
console.log('Rewrote', rewrites, 'broken related_reaction_id values.');

/* ──────────────────────────────────────────────────────────────────
   STEP 2: Add missing reactions
   ────────────────────────────────────────────────────────────────── */
const existingIds = new Set(reactions.map(r => r.id));

const NEW_REACTIONS = [
  /* ════════════════════════════════════════════════════════════════
     Generic S_N2 with alkyl halide (e.g. with various nucleophiles)
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'sn2-alkylhalogenid',
    category: 'Halogenkohlenwasserstoffe',
    name: 'S_N2 mit Alkylhalogenid (generisch)',
    difficulty: 'A',
    reaktionstyp: 'S_N2',
    transformation: 'R-X + Nu^- → R-Nu + X^-',
    reaction_smiles: 'CCBr.[CN-]>>CCC#N.[Br-]',
    reagent_label: 'Nu^-',
    conditions: 'Polar-aprotisches Lösungsmittel (DMSO, DMF, Aceton)',
    stereochemistry: 'Walden-Inversion am Stereozentrum',
    key_points: [
      'Konzertiert, bimolekular: Nu greift Rückseite an, X verlässt vorn',
      'Übergangszustand: trigonal-bipyramidal mit teilbindenden Nu und X',
      'Geschwindigkeit: prim. > sek. >> tert. (sterisch); CH₃- > Et- > iPr-',
      'Abgangsgruppen-Reihenfolge: I^- > Br^- > Cl^- >> F^-',
      'Polar-aprotische LM beschleunigen (kein Nu-Solvatisieren)',
      'Beispiele: -CN, -OR, -NR₂, -N₃, -SR (alle gute Nucleophile)'
    ],
    notes: 'Allgemeiner Mechanismus für viele Nu-Substitutionen (Williamson, Finkelstein, Gabriel, Cyanid, Azid …).',
    tags: ['SN2', 'Alkylhalogenid', 'Nucleophil', 'Walden-Inversion']
  },

  /* ════════════════════════════════════════════════════════════════
     Iodolactonisierung
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'iodolactonisierung',
    category: 'Alkene (C=C)',
    name: 'Iodolactonisierung',
    difficulty: 'C',
    reaktionstyp: 'A_E intramolekular',
    transformation: 'γ,δ-ungesättigte Carbonsäure → cis-Iod-γ-Lacton',
    reaction_smiles: 'C=CCCC(=O)O>>O=C1OCC(I)C1',
    reagent_label: 'I_2 / NaHCO_3',
    conditions: 'KI, NaHCO_3 in H_2O oder MeCN',
    stereochemistry: 'anti-Addition (trans-diaxial): I und C-O liegen anti',
    key_points: [
      'I_2 bildet zunächst ein cyclisches Iodonium-Ion mit der C=C',
      'Intramolekulares Carboxylat (durch NaHCO_3 deprotoniert) öffnet das Iodonium von der Rückseite',
      'Stereospezifisch trans-diaxiale Öffnung → cis-fusioniertes Lacton',
      'Markownikow-artige Selektivität: -O greift den höher substituierten C an',
      'Häufig zur Differenzierung von 5-exo vs 6-endo-Cyclisierung (Baldwin)'
    ],
    notes: 'Wichtige Strategie zum Aufbau cis-substituierter Lactone in der Naturstoff-Totalsynthese (Corey, Prostaglandine, Twistan).',
    tags: ['Iodolacton', 'Halogenocyclisierung', 'Iodonium', 'Baldwin']
  },

  /* ════════════════════════════════════════════════════════════════
     Ester-Pyrolyse (β-Eliminierung)
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'ester-pyrolyse',
    category: 'Carbonsäureester',
    name: 'Ester-Pyrolyse (cis-β-Eliminierung)',
    difficulty: 'C',
    reaktionstyp: 'E_i (intramolekular, cis-syn-periplanar)',
    transformation: 'Acetatester → Alken + Essigsäure',
    reaction_smiles: 'CCOC(C)=O>>C=C.CC(=O)O',
    reagent_label: 'Δ (300-500 °C)',
    conditions: 'Gasphase oder hochsiedendes LM, ohne Base',
    stereochemistry: 'cis (syn-periplanar) — 6-Ring-Übergangszustand',
    key_points: [
      'Pericyclische [1,4]-syn-Eliminierung über planaren 6-Ring-ÜZ',
      'Carbonyl-O abstrahiert das β-H von der gleichen Seite',
      'Keine Base notwendig, kein Carbanion, keine Umlagerung',
      'Selektivitäts-Maxime: Hofmann-Produkt (weniger substituiertes Alken)',
      'Verwandt: Cope-Eliminierung (Aminoxide), Chugaev (Xanthate)'
    ],
    notes: 'Anwendung z. B. zur thermisch milden Erzeugung empfindlicher Alkene ohne Carbocation-Umlagerungen.',
    tags: ['Pyrolyse', 'Eliminierung', 'syn-periplanar', 'Cope-artig']
  },

  /* ════════════════════════════════════════════════════════════════
     Horner-Wadsworth-Emmons (HWE)
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'hwe-wittig',
    category: 'Aldehyde und Ketone',
    name: 'Horner-Wadsworth-Emmons-Olefinierung',
    difficulty: 'C',
    reaktionstyp: 'A_N + Eliminierung',
    transformation: 'Aldehyd/Keton + Phosphonat → (E)-Alken + (RO)_2P(=O)O^-',
    reaction_smiles: 'CC=O.CCOC(=O)CP(=O)(OCC)OCC>>CC=CC(=O)OCC',
    reagent_label: '(RO)_2P(=O)-CHR\'-COR\'\'',
    reagent_label_below: 'Base (NaH, KO^tBu)',
    conditions: 'THF, –78 °C bis RT',
    stereochemistry: 'überwiegend (E)-Alken (thermodynamisch via stabileres trans-Oxaphosphetan)',
    key_points: [
      'Stabilisiertes Carbanion am α-C des Phosphonats (durch P=O und EWG)',
      'A_N am Carbonyl → β-Alkoxy-Phosphonat (Betaine)',
      'Zerfall via Oxaphosphetan → (E)-Alken + Dialkylphosphat',
      'Vorteil ggü. Wittig: wasserlösliches Phosphat-Nebenprodukt (leicht abtrennbar)',
      'Stark (E)-selektiv (im Gegensatz zu nicht-stabilisierten Wittig-Yliden)'
    ],
    notes: 'Auch Still-Gennari-Modifikation (Z-selektiv mit (CF_3CH_2O)_2P) bekannt.',
    tags: ['HWE', 'Olefinierung', 'Phosphonat', 'E-selektiv']
  },

  /* ════════════════════════════════════════════════════════════════
     Knoevenagel-Kondensation
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'knoevenagel',
    category: 'Aldehyde und Ketone',
    name: 'Knoevenagel-Kondensation',
    difficulty: 'B',
    reaktionstyp: 'A_N + Aldolkondensation',
    transformation: 'Aldehyd + CH-azide Verbindung → α,β-ungesättigtes Produkt + H_2O',
    reaction_smiles: 'O=Cc1ccccc1.N#CCC(=O)OCC>>O=C(OCC)/C(=C/c1ccccc1)C#N',
    reagent_label: 'aktive Methylen-Verbindung',
    reagent_label_below: 'sek. Amin (Piperidin), Δ',
    conditions: 'Pyridin, Piperidin/EtOH, oder Lösung mit Doebner-Modifikation (Pyridin/Piperidin + CO_2-Abspaltung)',
    key_points: [
      'CH-azide Verbindungen (CH(CO_2R)_2, NC-CH_2-CO_2R, Malonsäure, Acetessigester)',
      'pK_a ≈ 9-13 — durch sek. Amin deprotonierbar',
      'Carbanion addiert nukleophil an Carbonyl → β-Hydroxy-Verbindung',
      '–H_2O liefert α,β-ungesättigtes Produkt (konjugierter Akzeptor)',
      'Doebner-Variante: zusätzliche Decarboxylierung mit Malonsäure → α,β-ungesättigte Säure'
    ],
    notes: 'Verwandt mit der Aldol-Kondensation, aber mit acideren CH-Komponenten und sek. Amin als Katalysator.',
    tags: ['Knoevenagel', 'Kondensation', 'CH-azide', 'Doebner']
  },

  /* ════════════════════════════════════════════════════════════════
     Reformatsky-Reaktion
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'reformatsky',
    category: 'Carbonsäureester',
    name: 'Reformatsky-Reaktion',
    difficulty: 'C',
    reaktionstyp: 'A_N (Zn-Enolat)',
    transformation: 'α-Brom-ester + Carbonyl → β-Hydroxy-ester',
    reaction_smiles: 'BrCC(=O)OCC.O=Cc1ccccc1>>OC(c1ccccc1)CC(=O)OCC',
    reagent_label: 'Zn^0',
    reagent_label_below: 'Aldehyd/Keton',
    conditions: 'Zn (aktiviert mit I_2 oder Cu), Benzol/THF, Δ',
    key_points: [
      'Zn insertiert in C-Br → Zn-Enolat des α-Brom-esters (Organozink)',
      'Milder als Grignard — toleriert -CN, -NO_2, -CO-Funktionalitäten',
      'A_N an Aldehyd-/Keton-Carbonyl → Zn-Alkoholat',
      'Wässrige Aufarbeitung → β-Hydroxy-ester (Aldolprodukt)',
      'Wichtige Variante: Furukawa (Et_2Zn/CH_2I_2 für Cyclopropanierung)'
    ],
    notes: 'Klassische Reaktion zum Aufbau von β-Hydroxy-Carbonyl-Strukturen ohne starke Base (für basenlabile Edukte).',
    tags: ['Reformatsky', 'Zink', 'β-Hydroxy-ester', 'Organozink']
  },

  /* ════════════════════════════════════════════════════════════════
     Henry-Reaktion (Nitroaldol)
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'henry-reaktion',
    category: 'Aldehyde und Ketone',
    name: 'Henry-Reaktion (Nitroaldol)',
    difficulty: 'B',
    reaktionstyp: 'A_N',
    transformation: 'Aldehyd + Nitroalkan → β-Nitro-Alkohol',
    reaction_smiles: 'O=Cc1ccccc1.C[N+](=O)[O-]>>OC(c1ccccc1)C[N+](=O)[O-]',
    reagent_label: 'R-CH_2-NO_2',
    reagent_label_below: 'NaOH, KF oder organokatalytisch',
    conditions: 'EtOH/H_2O, RT-Δ',
    key_points: [
      'α-CH des Nitroalkans ist acid (pK_a ≈ 10) — Deprotonierung zum Nitronat-Anion',
      'Nitronat ist mesomeriestabilisiert (über C=N^+(O^-)O^- )',
      'A_N am Aldehyd-Carbonyl → β-Hydroxy-Nitro-Verbindung',
      'Reversibel — bei höherer T Aldolkondensation zum Nitroalken möglich',
      'Reduktion der -NO_2 (z. B. H_2/Pd, LiAlH_4) → β-Hydroxy-Amin (vicinales Amino-alkohol)'
    ],
    notes: 'Schlüsselschritt z. B. in der Chloramphenicol-Synthese (doppelte Henry-Reaktion).',
    tags: ['Henry', 'Nitroaldol', 'Nitronat', 'β-Nitro-Alkohol']
  },

  /* ════════════════════════════════════════════════════════════════
     Michael-Addition
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'michael-addition',
    category: 'Aldehyde und Ketone',
    name: 'Michael-Addition (1,4-Konjugat)',
    difficulty: 'B',
    reaktionstyp: 'A_N (1,4-konjugiert)',
    transformation: 'α,β-ungesättigtes Carbonyl + Nu → 1,4-Addukt',
    reaction_smiles: 'CC(=O)/C=C/C.CC(=O)CC(=O)OCC>>CC(=O)C(C)CC(C)CC(=O)OCC',
    reagent_label: 'Stabilisiertes Carbanion (Nu^-)',
    reagent_label_below: 'Base (NaOEt, KOH)',
    conditions: 'EtOH oder THF, RT',
    key_points: [
      'Donor (CH-azid, Nu) addiert konjugiert an β-C des Akzeptors',
      'Vorteil ggü. 1,2-Addition: thermodynamisch günstiger (Enolat statt Alkoholat)',
      'Donoren: Malonate, Acetessigester, Nitroverbindungen, Enamine',
      'Akzeptoren: α,β-ungesättigte Ketone/Ester/Nitrile, Vinylsulfone',
      'Wichtiger Baustein der Robinson-Anellierung (Michael + Aldolkondensation)'
    ],
    notes: 'Heute oft enantioselektiv mit Organokatalysatoren (Hayashi, MacMillan).',
    tags: ['Michael', '1,4-Addition', 'Konjugat', 'CH-azid']
  },

  /* ════════════════════════════════════════════════════════════════
     Mannich-Reaktion
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'mannich',
    category: 'Aldehyde und Ketone',
    name: 'Mannich-Reaktion',
    difficulty: 'C',
    reaktionstyp: 'A_N (Drei-Komponenten)',
    transformation: 'Keton + Aldehyd + Amin → β-Aminoketon (Mannich-Base)',
    reaction_smiles: 'CC(=O)C.O=C.CN(C)>>CC(=O)CCN(C)C',
    reagent_label: 'HCHO + R_2NH',
    conditions: 'EtOH, kat. HCl, Δ',
    key_points: [
      'Schritt 1: Amin + Aldehyd → Iminium-Ion (R_2N^+=CH_2)',
      'Schritt 2: Enol/Enolat des Ketons greift Iminium-C nukleophil an',
      'Liefert β-Aminoketon (Mannich-Base)',
      'Bei intramolekularen Varianten Drei-Ring-Verschlüsse möglich (Tropinon!)',
      'Robinson-Tropinon-Synthese (1917): Triple-Mannich aus Butandial + MeNH_2 + Aceton'
    ],
    notes: 'Klassische Drei-Komponenten-Reaktion. Iminium-Ionen sind aktivere Elektrophile als Carbonyle.',
    tags: ['Mannich', 'Iminium', '3-Komponenten', 'β-Aminoketon']
  },

  /* ════════════════════════════════════════════════════════════════
     Robinson-Anellierung
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'robinson-anellierung',
    category: 'Aldehyde und Ketone',
    name: 'Robinson-Anellierung',
    difficulty: 'C',
    reaktionstyp: 'Michael + Aldolkondensation',
    transformation: 'Keton + α,β-ungesättigtes Keton → Cyclohex-2-enon',
    reaction_smiles: 'CC(=O)CC(C)=O.CC=CC(=O)C>>O=C1CCC(C)CC1C',
    reagent_label: 'Methylvinylketon (oder Analoga)',
    reagent_label_below: 'Base (NaOH, KOH), Δ',
    conditions: 'EtOH/H_2O, kat. Base',
    key_points: [
      'Schritt 1: Michael-Addition des Enolats an Methylvinylketon → 1,5-Diketon',
      'Schritt 2: intramolekulare Aldol-Addition (neue C-C-Bindung)',
      'Schritt 3: Eliminierung von H_2O → α,β-ungesättigtes Cyclohexenon',
      'Konstruktion von 6-Ringen mit gleichzeitiger Funktionalisierung',
      'Standard-Strategie für Steroid-Synthese (CD-Ring)'
    ],
    notes: 'Wichtige Sequenz für die Steroid-Totalsynthese (z. B. Bauerle, Stork-Strategie).',
    tags: ['Robinson', 'Anellierung', 'Michael', 'Aldol', '6-Ring']
  },

  /* ════════════════════════════════════════════════════════════════
     Wolff-Kishner-Reduktion
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'wolff-kishner',
    category: 'Aldehyde und Ketone',
    name: 'Wolff-Kishner-Reduktion',
    difficulty: 'B',
    reaktionstyp: 'Kondensation + Reduktion',
    transformation: 'Keton/Aldehyd → Alkan (C=O → CH_2)',
    reaction_smiles: 'CC(=O)C>>CCC',
    reagent_label: 'N_2H_4 / KOH',
    reagent_label_below: 'Diethylenglycol, Δ (180-200 °C)',
    conditions: 'Hoch siedendes LM (Diethylenglycol, DMSO), starke Base, Δ',
    key_points: [
      'Schritt 1: A_N von Hydrazin am Carbonyl → Hydrazon (C=N-NH_2)',
      'Schritt 2: Base deprotoniert → Diazenyl-Anion (C-N=N-H ↔ C^- -N=N-H)',
      'Schritt 3: Erhitzen → N_2-Eliminierung → Carbanion → Protonierung → CH_2',
      'Reduktion in basischem Milieu — verträgt säureempfindliche Gruppen',
      'Alternative: Clemmensen-Reduktion (Zn(Hg)/HCl) für basenempfindliche Edukte'
    ],
    notes: 'Spaltung von C=O zu CH_2 ohne Reduktion anderer Funktionalitäten (Estern, etc.).',
    tags: ['Wolff-Kishner', 'Reduktion', 'Hydrazon', 'Clemmensen-Alternative']
  },

  /* ════════════════════════════════════════════════════════════════
     Eschweiler-Clarke-Methylierung
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'eschweiler-clarke',
    category: 'Amine',
    name: 'Eschweiler-Clarke-Methylierung',
    difficulty: 'B',
    reaktionstyp: 'Reduktive Aminierung',
    transformation: 'prim./sek. Amin → tertiäres N-CH_3-Amin',
    reaction_smiles: 'CCN.O=C.OC=O>>CCN(C)C',
    reagent_label: 'HCHO + HCO_2H',
    conditions: 'Δ — Formaldehyd wird vom Formiat als Hydrid-Donor reduziert',
    key_points: [
      'Schritt 1: Amin + HCHO → Iminium-Ion (R_2N^+=CH_2)',
      'Schritt 2: HCO_2H überträgt H^- auf das Iminium → R_2N-CH_3 + CO_2',
      'Liefert vollständig N-methyliertes (tertiäres) Amin',
      'Vorteil ggü. CH_3I: keine Überalkylierung zum quartären Salz',
      'Verwandt: NaBH_3CN/HCHO (modernere Variante, milder)'
    ],
    notes: 'Klassische Methode zur N,N-Dimethylierung primärer und sekundärer Amine.',
    tags: ['Eschweiler-Clarke', 'N-Methylierung', 'reduktive Aminierung', 'Iminium']
  },

  /* ════════════════════════════════════════════════════════════════
     Reduktive Aminierung
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'reduktive-aminierung',
    category: 'Amine',
    name: 'Reduktive Aminierung',
    difficulty: 'B',
    reaktionstyp: 'Kondensation + Reduktion',
    transformation: 'Keton/Aldehyd + Amin → sek./tert. Amin',
    reaction_smiles: 'CC=O.CCN>>CCNCC',
    reagent_label: 'NaBH_3CN (oder NaBH(OAc)_3)',
    reagent_label_below: 'AcOH (pH 4-7)',
    conditions: 'MeOH/THF, RT, schwach sauer (Iminium-Bildung beschleunigt)',
    key_points: [
      'Schritt 1: Amin + Carbonyl → Halbaminal → Imin/Iminium (–H_2O)',
      'Schritt 2: Hydrid (NaBH_3CN) reduziert selektiv das Iminium zum Amin',
      'NaBH_3CN reduziert Iminien viel schneller als Carbonyle (selektiv)',
      'Vorteil: keine Trennung des Imin-Intermediats nötig (one-pot)',
      'Liefert Mono-, Di- oder Tri-substituierte Amine je nach Edukt'
    ],
    notes: 'NaBH_3CN ist die klassische selektive Reagenz; modernere Variante: NaBH(OAc)_3 (Abdel-Magid).',
    tags: ['reduktive Aminierung', 'NaBH3CN', 'Iminium', 'sekundäres Amin']
  },

  /* ════════════════════════════════════════════════════════════════
     DIBAL-H-Reduktion
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'dibal-reduktion',
    category: 'Carbonsäureester',
    name: 'DIBAL-H-Reduktion (Ester → Aldehyd)',
    difficulty: 'C',
    reaktionstyp: 'A_N (kontrolliertes Hydrid)',
    transformation: 'Ester → Aldehyd (bei tiefer T) oder primärer Alkohol (bei Überschuss/RT)',
    reaction_smiles: 'CCOC(=O)CC>>CCC=O',
    reagent_label: 'DIBAL-H (i-Bu_2AlH)',
    reagent_label_below: 'Toluol, -78 °C',
    conditions: 'Toluol oder CH_2Cl_2, -78 °C, 1 Äq.',
    key_points: [
      'Sterisch gehinderter Aluminium-Hydrid-Donor',
      'Bei -78 °C: nur eine H^--Übertragung → tetraedrisches Aluminium-Alkoxid (stabil!)',
      'Aufarbeitung mit Rochelle-Salz spaltet das Alkoxid → Aldehyd (statt weiter zum Alkohol)',
      'Bei 2 Äq./RT: weiter zum primären Alkohol (wie LiAlH_4)',
      'Reduziert auch Nitrile zum Aldehyd (Stephen-artig) und Lactone zum Lactol'
    ],
    notes: 'Wichtig wenn der Aldehyd das gewünschte Produkt ist (LiAlH_4 würde weiterreduzieren).',
    tags: ['DIBAL', 'Aldehyd', 'Reduktion', 'kontrolliert']
  },

  /* ════════════════════════════════════════════════════════════════
     SeO_2 — allylische Oxidation (Riley)
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'seo2-allyl',
    category: 'Alkene (C=C)',
    name: 'Allylische Oxidation mit SeO_2 (Riley)',
    difficulty: 'C',
    reaktionstyp: 'Pericyclische En-Reaktion + [2,3]-Umlagerung',
    transformation: 'Allyl-Methyl → Allyl-Aldehyd / Allyl-Alkohol',
    reaction_smiles: 'CC=CCC>>O=CC=CCC',
    reagent_label: 'SeO_2',
    reagent_label_below: 'Dioxan oder t-BuOOH, Δ',
    conditions: 'Dioxan, EtOH oder t-BuOOH (kat. SeO_2), 80-100 °C',
    key_points: [
      'Schritt 1: En-Reaktion zwischen SeO_2 und Allyl-CH → Allyl-Selenium(IV)-Ester',
      'Schritt 2: [2,3]-sigmatrope Umlagerung → Allyl-Alkohol (oder weiter zu Aldehyd)',
      'Selektiv für allylische CH-Positionen (kein Angriff am sp²-C)',
      'Reaktivität: CH_3 > CH_2 > CH (das umgekehrte zum SR!)',
      'Doppelbindung kann sich umlagern (Allyl-Shift)'
    ],
    notes: 'Wichtige milde Methode zur allylischen Aldehyd-Synthese (z. B. Carvon-Synthese aus Mesityloxid).',
    tags: ['SeO2', 'allylische Oxidation', 'Riley', 'En-Reaktion']
  },

  /* ════════════════════════════════════════════════════════════════
     Periodat-Spaltung
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'periodat-spaltung',
    category: 'Alkohole und Phenole',
    name: 'Periodat-Spaltung (NaIO_4) vicinaler Diole',
    difficulty: 'C',
    reaktionstyp: 'Oxidative C-C-Spaltung',
    transformation: 'vic-Diol → zwei Carbonyl-Verbindungen',
    reaction_smiles: 'OC(C)C(O)C>>CC=O.CC=O',
    reagent_label: 'NaIO_4',
    conditions: 'H_2O oder MeOH/H_2O, RT',
    stereochemistry: 'erfordert syn (cis) vicinales Diol (cyclischer ÜZ)',
    key_points: [
      'Bildet cyclischen Periodester (5-Ring) mit den beiden OH-Gruppen',
      'Konzertierter Zerfall → 2 C=O + IO_3^- + H_2O',
      'Spaltung NUR zwischen den beiden Diol-C-Atomen',
      'Aus terminaler CH_2OH/CHOH-Gruppe entsteht HCHO bzw. ein Aldehyd',
      'Mildes Äquivalent zur Ozonolyse, wenn vorher OsO_4-Dihydroxylierung erfolgt'
    ],
    notes: 'OsO_4 + NaIO_4 (Lemieux-Johnson) = milde alternative zur Ozonolyse zur Spaltung einer C=C in zwei C=O.',
    tags: ['NaIO4', 'Periodat', 'Diolspaltung', 'Lemieux-Johnson']
  },

  /* ════════════════════════════════════════════════════════════════
     1,3-Dipolare [3+2]-Cycloaddition
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'dipolar-32-cycloaddition',
    category: 'Alkene (C=C)',
    name: '1,3-Dipolare Cycloaddition [3+2]',
    difficulty: 'D',
    reaktionstyp: 'Pericyclisch [3+2]',
    transformation: '1,3-Dipol + Dipolarophil → 5-Ring-Heterocyclus',
    reaction_smiles: 'C=CC.[N-]=[N+]=N>>C1=CC(C)N=NN1',
    reagent_label: '1,3-Dipol (Azid, Nitron, Diazo, Ozon, Carbonyl-Ylid)',
    reagent_label_below: 'Δ oder hν',
    conditions: 'Thermisch oder photochemisch, oft ohne Katalysator',
    stereochemistry: 'suprafacial/suprafacial, konzertiert — cis-Stereochemie erhalten',
    key_points: [
      'Dipol: 4π-System mit 4 Elektronen (Allyl-/Propargyl-artig)',
      'Dipolarophil: 2π-System (Alken, Alkin)',
      'Konzertierter ÜZ, [4πs+2πs]-thermisch erlaubt (Huisgen)',
      'Beispiele: Nitron + Alken → Isoxazolidin; Azid + Alkin → Triazol (Click-Chemie)',
      'Cu(I)-katalysierte Variante (CuAAC): regioselektiv 1,4-Triazol'
    ],
    notes: 'Grundlage der „Click-Chemie" (Sharpless, Meldal, Bertozzi — Nobelpreis 2022).',
    tags: ['Huisgen', '1,3-dipolar', 'Click', 'Triazol']
  },

  /* ════════════════════════════════════════════════════════════════
     [2+2]-Cycloaddition (Keten/photochemisch)
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'cycloadd-22',
    category: 'Alkene (C=C)',
    name: '[2+2]-Cycloaddition',
    difficulty: 'D',
    reaktionstyp: 'Pericyclisch [2+2]',
    transformation: 'zwei Alkene → Cyclobutan; oder Keten + Alken → Cyclobutanon',
    reaction_smiles: 'C=C.C=CC>>C1CCC1C',
    reagent_label: 'hν (photochemisch) ODER Keten (thermisch)',
    conditions: 'UV-Licht (für Alken-Alken-[2+2]) oder Keten in Lösung (thermisch erlaubt)',
    stereochemistry: 'suprafacial/suprafacial: cis-Substituenten bleiben cis',
    key_points: [
      'Thermisch zwischen zwei Alkenen [2πs+2πs] NICHT erlaubt (WH-Regeln)',
      'Photochemisch [2πs+2πs] erlaubt (Anregung in π*-Orbital ändert Symmetrie)',
      'Ketene reagieren thermisch [2πs+2πa] erlaubt (orthogonale π-Orbitale)',
      'Liefern Cyclobutanon (mit Keten als Dienophil)',
      'Wichtig in Naturstoff-Synthese (β-Pinen, Bergamoten)'
    ],
    notes: 'Paterno-Büchi (Carbonyl + Alken photochemisch) liefert Oxetane.',
    tags: ['[2+2]', 'Keten', 'photochemisch', 'Cyclobutan']
  },

  /* ════════════════════════════════════════════════════════════════
     Claisen-Umlagerung ([3,3]-sigmatrop)
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'claisen-umlagerung',
    category: 'Alkohole und Phenole',
    name: 'Claisen-Umlagerung ([3,3]-sigmatrop)',
    difficulty: 'C',
    reaktionstyp: 'Pericyclisch [3,3]-sigmatrop',
    transformation: 'Allyl-Vinyl-Ether → γ,δ-ungesättigter Aldehyd/Keton',
    reaction_smiles: 'C=COCC=CC>>O=CCC(=CC)C',
    reagent_label: 'Δ (150-200 °C)',
    conditions: 'Hoch siedendes inertes LM oder neat',
    stereochemistry: 'Sessel-ÜZ — chair-like; chirale Information übertragbar (Ireland-Claisen)',
    key_points: [
      'Konzertiert über 6-Ring-ÜZ (Sessel)',
      'Allyl-Vinyl-Ether: O-C-C=C — C=C-C-O wird zu O=C-C-C — C-C=C',
      'Aromatic Claisen (Allyl-Aryl-Ether): wandert ortho, dann re-aromatisiert',
      'Varianten: Ireland (Ester-Enolat-Silylether), Eschenmoser (Amid), Johnson (Orthoester)',
      'Wichtige Strategie für stereoselektive C-C-Bildung in Naturstoff-Synthese'
    ],
    notes: 'NICHT zu verwechseln mit der Claisen-Esterkondensation (Aldol-analog).',
    tags: ['Claisen', '[3,3]', 'sigmatrop', 'Ireland']
  },

  /* ════════════════════════════════════════════════════════════════
     Elektrocyclische Reaktion
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'elektrocyclisch',
    category: 'Alkene (C=C)',
    name: 'Elektrocyclische Reaktion',
    difficulty: 'D',
    reaktionstyp: 'Pericyclisch (intramolekular)',
    transformation: 'Polyen ⇌ Cycloalken (Ringschluss oder -öffnung)',
    reaction_smiles: 'C=CC=C>>C1=CCC1',
    reagent_label: 'Δ (thermisch) ODER hν (photochemisch)',
    conditions: 'Wärme oder UV-Licht',
    stereochemistry: 'Konrotatorisch vs. disrotatorisch — vorhergesagt durch HOMO-Symmetrie (WH-Regeln)',
    key_points: [
      '4π-thermisch: konrotatorisch (HOMO = ψ_2, antisym)',
      '4π-photochemisch: disrotatorisch (HOMO = ψ_3, sym)',
      '6π-thermisch: disrotatorisch',
      '6π-photochemisch: konrotatorisch',
      'Allgemein: thermisch (4n)π → kon, (4n+2)π → dis; photochemisch genau umgekehrt',
      'Beispiele: Hexatrien → Cyclohexadien (6π); Butadien → Cyclobuten (4π)'
    ],
    notes: 'Klassisches Lehrbuchbeispiel der Woodward-Hoffmann-Regeln. Stereochemie ist diagnostisch.',
    tags: ['elektrocyclisch', 'WH-Regeln', 'kon-rotatorisch', 'dis-rotatorisch']
  },

  /* ════════════════════════════════════════════════════════════════
     Arbuzov-Reaktion
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'arbuzov',
    category: 'Halogenkohlenwasserstoffe',
    name: 'Arbuzov-Reaktion (Michaelis-Arbuzov)',
    difficulty: 'C',
    reaktionstyp: 'S_N2 + Umlagerung',
    transformation: 'Trialkylphosphit + R-X → Dialkyl-Phosphonat + R\'-X',
    reaction_smiles: 'BrCC(=O)O.OP(OCc1ccccc1)(OCc1ccccc1)OCc1ccccc1>>OC(=O)CP(=O)(OCc1ccccc1)OCc1ccccc1.BrCc1ccccc1',
    reagent_label: 'P(OR)_3 + R\'-X',
    conditions: 'neat oder hochsiedendes LM, Δ',
    key_points: [
      'Schritt 1: P^III (nucleophil) greift α-C des Alkylhalogenids → Phosphoniumsalz (P^V)',
      'Schritt 2: X^- greift einen der OR-Reste an → R-X + Dialkylphosphonat',
      'Resultat: P-C-Bindung neu gebildet, OR durch R\' ausgetauscht',
      'Vorläufer für HWE-Olefinierung (mit α-CH-aciden Phosphonaten)',
      'Beispielsweise BrCH_2CO_2Et + P(OEt)_3 → (EtO)_2P(=O)CH_2CO_2Et + EtBr'
    ],
    notes: 'Wichtigster industrieller Weg zu Phosphonaten (z. B. für Glyphosat, HWE-Reagenzien).',
    tags: ['Arbuzov', 'Phosphonat', 'P-C-Bildung', 'HWE-Vorläufer']
  },

  /* ════════════════════════════════════════════════════════════════
     Carbodiimid-Amidkupplung (DCC)
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'dcc-amidkupplung',
    category: 'Carbonsäuren und -derivate',
    name: 'Carbodiimid-Amidkupplung (DCC)',
    difficulty: 'C',
    reaktionstyp: 'Acyl-Substitution',
    transformation: 'Carbonsäure + Amin → Amid (+ Harnstoff-Nebenprodukt)',
    reaction_smiles: 'OC(=O)CC.NCC>>CCNC(=O)CC',
    reagent_label: 'DCC (Dicyclohexylcarbodiimid)',
    reagent_label_below: 'CH_2Cl_2, RT; HOBt als Additiv',
    conditions: 'CH_2Cl_2 oder DMF, 0 °C → RT',
    key_points: [
      'Schritt 1: COO^- addiert an C=N=N → O-Acylisoharnstoff (Carboxyl jetzt aktiviert)',
      'Schritt 2: Amin greift Carbonyl-C nukleophil an → Amid + N,N\'-Dicyclohexylharnstoff (Nebenprodukt)',
      'HOBt unterdrückt Racemisierung (für Peptid-Synthese)',
      'Wichtig in Peptid-/β-Lactam-Synthese (Penicillin V!)',
      'Moderne Varianten: EDC (wasserlöslich), HATU, PyBOP'
    ],
    notes: 'Standard-Methode für die Amidkupplung in der Peptid-Chemie.',
    tags: ['DCC', 'Amidkupplung', 'Carbodiimid', 'Peptidsynthese']
  },

  /* ════════════════════════════════════════════════════════════════
     Diazotierung
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'diazotierung',
    category: 'Amine',
    name: 'Diazotierung (prim. aromat. Amin → Diazoniumsalz)',
    difficulty: 'B',
    reaktionstyp: 'A_N + Eliminierung',
    transformation: 'Ar-NH_2 → Ar-N_2^+',
    reaction_smiles: 'Nc1ccccc1>>[N+]#Nc1ccccc1',
    reagent_label: 'NaNO_2 / HCl',
    reagent_label_below: '0-5 °C',
    conditions: 'wässrige HCl, NaNO_2 (in situ HNO_2), 0-5 °C (instabil oberhalb)',
    key_points: [
      'HNO_2 wird in situ aus NaNO_2 + HCl erzeugt',
      'Bildet H_2O + N=O^+ (Nitrosylkation, eigentliches Elektrophil)',
      'N-Nitrosierung am Amin → N-Nitrosamin → Tautomerie → Diazohydroxid → -H_2O → Diazonium',
      'Aliphatische Diazoniumsalze zerfallen sofort (N_2 + Carbenium); aromatische bei 0 °C stabil',
      'Folgereaktionen: Azokupplung (mit aktivierten Aromaten), Sandmeyer (Cu-Salze → Ar-X), Schiemann (BF_4^- → Ar-F)'
    ],
    notes: 'Zentrale Reaktion in der Farbstoff-Chemie (Azofarbstoffe) und für funktionale-Gruppen-Transformation am Aromaten.',
    tags: ['Diazotierung', 'Diazonium', 'Sandmeyer', 'Azofarbstoff']
  },

  /* ════════════════════════════════════════════════════════════════
     Hydrogenolyse (Bn / Cbz)
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'hydrogenolyse',
    category: 'Halogenkohlenwasserstoffe',
    name: 'Hydrogenolyse von Bn/Cbz/CBz',
    difficulty: 'B',
    reaktionstyp: 'Reduktive C-X-Spaltung',
    transformation: 'Ar-CH_2-X → Ar-CH_3 + H-X (X = OR, NR_2, OC(=O)NR_2)',
    reaction_smiles: 'OC(=O)Cc1ccccc1>>Cc1ccccc1.OC=O',
    reagent_label: 'H_2 / Pd(OH)_2',
    reagent_label_below: 'EtOH oder EtOAc, RT',
    conditions: '1 atm H_2, Pd/C oder Pd(OH)_2 (Pearlman), Lösungsmittel',
    key_points: [
      'H_2 spaltet die schwache benzylische C-X-Bindung reduktiv',
      'Übliche Anwendungen: Bn-Ether (-O-CH_2-Ph), Cbz/Z-Carbamat, Bn-Ester',
      'Selektiv: andere C-O/C-N-Bindungen meist unangetastet',
      'Pd(OH)_2 (Pearlman) reaktiver als Pd/C — auch für Tribenzyl',
      'Toleriert: Alkene werden oft mitreduziert! → Lindlar oder mildere Bedingungen wählen'
    ],
    notes: 'Standard zur Entfernung der Bn-Schutzgruppe nach Synthese.',
    tags: ['Hydrogenolyse', 'Bn-Entschützung', 'Cbz', 'Pd(OH)2']
  },

  /* ════════════════════════════════════════════════════════════════
     Mesylierung (OH → OMs)
     ════════════════════════════════════════════════════════════════ */
  {
    id: 'mesylierung',
    category: 'Alkohole und Phenole',
    name: 'Mesylierung / Tosylierung (OH → OSO_2R)',
    difficulty: 'B',
    reaktionstyp: 'Acyl-Substitution am S',
    transformation: 'R-OH → R-OMs (oder R-OTs)',
    reaction_smiles: 'CCO.CS(Cl)(=O)=O>>CCOS(C)(=O)=O.Cl',
    reagent_label: 'MeSO_2Cl (oder TsCl)',
    reagent_label_below: 'Pyridin oder NEt_3 (Base)',
    conditions: 'CH_2Cl_2, 0 °C → RT, Pyridin oder Triethylamin als HCl-Fänger',
    key_points: [
      'OH ist eine miserable Abgangsgruppe (pK_a H_2O ≈ 16)',
      'MeSO_2Cl + Base → Sulfonatester (R-OMs)',
      'OMs^- ist hervorragende Abgangsgruppe (pK_a MsOH ≈ -2)',
      'Pyridin neutralisiert das freigesetzte HCl',
      'Schwester-Reaktion mit TsCl (p-Toluolsulfonylchlorid) → Tosylat (OTs)',
      'Tosyl > Mesyl in Abgangsqualität (Resonanzstabilisierung des Tosylat-Anions)'
    ],
    notes: 'Standard-Aktivierung von Alkoholen für nachfolgende S_N2-Reaktionen (z. B. mit CN^-, N_3^-, R_2NH).',
    tags: ['Mesylierung', 'Tosylierung', 'OH-Aktivierung', 'Abgangsgruppe']
  }
];

let added = 0;
for (const r of NEW_REACTIONS) {
  if (existingIds.has(r.id)) {
    console.log('skip (exists):', r.id);
    continue;
  }
  reactions.push(r);
  existingIds.add(r.id);
  added++;
  console.log('added:', r.id);
}

/* ──────────────────────────────────────────────────────────────────
   Write both files
   ────────────────────────────────────────────────────────────────── */
fs.writeFileSync(QFILE, JSON.stringify(questions, null, 2) + '\n');
fs.writeFileSync(RFILE, JSON.stringify(reactions, null, 2) + '\n');

console.log('\n=== SUMMARY ===');
console.log('Rewrites in questions.json:', rewrites);
console.log('New reactions added to reactions.json:', added);
console.log('Total reactions now:', reactions.length);
