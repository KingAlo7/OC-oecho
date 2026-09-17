/**
 * Source audit (Sept 2026) — brings data/questions.json in line with the
 * original ÖChO Angaben:
 *   - starting materials that the Angabe draws are `given`
 *   - reagents, conditions and step order exactly as printed
 *   - every "Hinweis" / Zusatzinformation of the Angabe is present
 *     (per section, in `hints`), nothing that gives answers away
 *   - text printed under an unknown compound (sum formula, name, "R-Form")
 *     is kept as an always-visible `caption`
 *   - schemes that were missing entirely are added
 *
 * Sources: Level C - BW/BW-Sammlung (BW 39, 42–51) and the LW/BW papers
 * downloaded from oecho.at/bewerb/aufgaben (LW 43–52, BW 52).
 *
 * Run:  node tools/source-audit-2026.js
 * Idempotent: the base is always data/questions.json as of commit 18a5cb3.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'questions.json');
// Patches rebuild sections relative to the PRE-audit data, so the base is
// always read from the commit before the audit. Re-running is idempotent.
const BASE_REV = '18a5cb3';
const qs = JSON.parse(require('child_process').execFileSync(
  'git', ['show', BASE_REV + ':data/questions.json'], { cwd: path.join(__dirname, '..'), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));

/* ── helpers ─────────────────────────────────────────────────────── */

function Q(id) {
  const q = qs.find(x => x.id === id);
  if (!q) throw new Error('unknown question ' + id);
  return q;
}

/* node: N(id, label, smiles, { given, name, caption, explanation, ... }) */
function N(id, label, smiles, extra) {
  const n = { id, label, given: false, smiles };
  return Object.assign(n, extra || {});
}
const G = (id, label, smiles, extra) => N(id, label, smiles, Object.assign({ given: true }, extra || {}));

/* edge: E(from | [from...], to, above, below) */
function E(from, to, above, below) {
  const e = { from: [].concat(from), to };
  if (above) e.reagent_above = above;
  if (below) e.reagent_below = below;
  return e;
}

/* Carry explanations etc. over from the previous version of a section
   when a node keeps its id; keep a baked MOL only if the structure is
   unchanged. */
function carry(oldSec, nodes) {
  const old = new Map(((oldSec && oldSec.scheme && oldSec.scheme.nodes) || []).map(n => [n.id, n]));
  return nodes.map(n => {
    const o = old.get(n.id);
    if (!o) return n;
    for (const k of ['explanation', 'note', 'related_reaction_id']) {
      if (n[k] == null && o[k]) n[k] = o[k];
    }
    if (o.mol && o.smiles === n.smiles && n.mol == null) n.mol = o.mol;
    return n;
  });
}

function syn(title, nodes, edges, extra) {
  return Object.assign({ type: 'synthesis', title, scheme: { nodes, edges } }, extra || {});
}
const SA = (title, prompt, expected_answer, extra) =>
  Object.assign({ type: 'short_answer', title, prompt, expected_answer }, extra || {});

/* Replace section i of q, carrying node info from the old section. */
function setSec(q, i, sec) {
  if (sec.type === 'synthesis') sec.scheme.nodes = carry(q.sections[i], sec.scheme.nodes);
  q.sections[i] = sec;
}

function findSec(q, pred) {
  const i = q.sections.findIndex(pred);
  if (i < 0) throw new Error(q.id + ': section not found');
  return i;
}

function addSection(q, sec, afterIdx) {
  const dup = q.sections.findIndex(s => s.title && s.title === sec.title);
  if (dup >= 0) { q.sections[dup] = sec; return; }
  if (afterIdx == null) q.sections.push(sec);
  else q.sections.splice(afterIdx + 1, 0, sec);
}

function upsertQuestion(q) {
  const i = qs.findIndex(x => x.id === q.id);
  if (i >= 0) qs[i] = q; else qs.push(q);
}

const patches = [];
const patch = (name, fn) => patches.push({ name, fn });

/* ════════════════════════════════════════════════════════════════════
   BW 39 (2013) — Aufgabe 5 C, Grandisol
   ════════════════════════════════════════════════════════════════════ */
patch('bw39 grandisol', () => {
  const q = Q('bw39-2013-grandisol');
  // The old hints were invented, and "Route 1 liefert ein Racemat" is the
  // answer to 5.11. The Angabe's Zusatzinformationen go on the section.
  delete q.hints;
  setSec(q, 0, syn('Route 1: klassische Synthese (1970er)', [
    G('A', 'A', 'C/C=C\\CCCC#N'),
    N('B', 'B', 'C/C=C\\CCC(CCOC1CCCCO1)C#N'),
    N('C', 'C', 'CC1OC1CCC(CCOC1CCCCO1)C#N'),
    N('D', 'D', 'CC(O)C1CCC1(C#N)CCOC1CCCCO1', { caption: '(C_14H_23NO_3)' }),
    N('E', 'E', 'CC(O)C1CCC1(C=O)CCOC1CCCCO1', { caption: '(C_14H_24O_4)' }),
    N('F', 'F', 'CC(O)C1CCC1(C=NN)CCOC1CCCCO1'),
    N('G', 'G', 'CC(O)C1CCC1(C)CCOC1CCCCO1', { caption: '(C_14H_26O_3)' }),
    N('H', 'H', 'CC(=O)C1CCC1(C)CCOC1CCCCO1'),
    N('I', 'I', 'C=C(C)C1CCC1(C)CCOC1CCCCO1'),
    G('P1', 'Grandisol', 'C=C(C)[C@@H]1CC[C@]1(C)CCO')
  ], [
    E('A', 'B', '1. Base', '2. Br-CH_2CH_2-OTHP'),
    E('B', 'C', 'MCPBA'),
    E('C', 'D', '1. Base', '2. H_2O'),
    E('D', 'E', 'DIBAL'),
    E('E', 'F', 'NH_2NH_2'),
    E('F', 'G', 'KOH/H_2O', 'Δ'),
    E('G', 'H', 'CrO_3'),
    E('H', 'I', 'Ph_3P=CH_2'),
    E('I', 'P1', 'H_2SO_4, H_2O, Δ')
  ], {
    body: 'In den 1970er Jahren wurde eine klassische Synthese für Grandisol entwickelt.',
    hints: [
      'MCPBA steht für m-Chlorperbenzoesäure.',
      'DIBAL steht für Diisobutylaluminiumhydrid.',
      'Br-CH_2CH_2-O-THP: 2-(2-Bromethoxy)tetrahydropyran, abgekürzt Br-CH_2CH_2-OTHP.',
      'Im Schritt von C → D erfolgt der Ringschluss.'
    ]
  }));
  setSec(q, 1, syn('Route 2: Vierring über [2+2]-Photocycloaddition', [
    G('S1', '', 'C=C', { name: 'Ethen' }),
    G('S2', '', 'CC1=CC(=O)CCC1'),
    N('K', 'K', 'O=C1CCCC2(C)CCC12'),
    N('L', 'L', 'O=C1C=CCC2(C)CCC12'),
    G('M', 'M', 'CC4(O)[C@@H]1CC[C@]1(C)CC=C4'),
    G('N', 'N', 'CC(=O)[C@@H]1CC[C@]1(C)CC(=O)O'),
    G('P2', 'Grandisol', 'C=C(C)[C@@H]1CC[C@]1(C)CCO')
  ], [
    E(['S1', 'S2'], 'K', 'hν'),
    E('K', 'L', '1. Br_2', '2. Base (-HBr)'),
    E('L', 'M', '1. CH_3MgBr', '2. H_2O/H^+'),
    E('M', 'N', '1. O_3, Zn/HAc', '2. NaIO_4'),
    E('N', 'P2', '1. Ph_3P=CH_2', '2. BH_3/THF')
  ], { body: 'Eine weitere Synthese von Grandisol benützt eine andere Strategie zur Bildung des Cyclobutanringes.' }));
});

/* ════════════════════════════════════════════════════════════════════
   BW 42 (2016) — Aufgabe 1 „Manche Antibiotika"
   ════════════════════════════════════════════════════════════════════ */
patch('bw42 prontosil', () => {
  const q = Q('bw42-2016-prontosil');
  setSec(q, 0, syn('A. Prontosil', [
    G('Aa', '', 'CC(=O)Nc1ccccc1'),
    N('B', 'B', 'CC(=O)Nc1ccc(S(Cl)(=O)=O)cc1'),
    N('C', 'C', 'CC(=O)Nc1ccc(S(N)(=O)=O)cc1'),
    N('D', 'D', 'Nc1ccc(S(N)(=O)=O)cc1', { name: 'Sulfanilamid', caption: 'ein Sulfonamid, C_6H_8N_2O_2S' }),
    N('E', 'E', '[Cl-].N#[N+]c1ccc(S(N)(=O)=O)cc1'),
    N('F', 'F', 'Nc1ccc(/N=N/c2ccc(S(N)(=O)=O)cc2)c(N)c1', { caption: 'Prontosil' })
  ], [
    E('Aa', 'B', 'ClSO_3H'),
    E('B', 'C', 'NH_3'),
    E('C', 'D', 'HCl (aq)'),
    E('D', 'E', 'NaNO_2', 'HCl'),
    E('E', 'F', 'Benzen-1,3-diamin')
  ], {
    hints: ['B zeigt im Bereich der Molekülpeakregion die Signale m/z = 233 und m/z = 235 im Intensitätsverhältnis 3:1.']
  }));
});

patch('bw42 chloramphenicol', () => {
  const q = Q('bw42-2016-chloramphenicol');
  // Old data had the wrong nucleophile (nitromethane instead of
  // 2-nitroethanol), nitration before acylation, and (2S,3R) stereo.
  setSec(q, 0, syn('B. Chloramphenicol', [
    N('A', 'A', 'O=Cc1ccccc1', { caption: 'Benzencarbaldehyd' }),
    N('B', 'B', 'OCC([N+](=O)[O-])C(O)c1ccccc1',
      { explanation: 'Henry-Reaktion (Nitroaldol): das Nitronat-Anion aus 2-Nitroethanol (NaOCH_3 deprotoniert das α-C) addiert nukleophil (A_N) an den Carbonyl-C des Benzaldehyds.' }),
    N('C', 'C', 'OC[C@@H](N)[C@H](O)c1ccccc1', { caption: '"2R,3R"-Isomer',
      explanation: 'H_2/Pd reduziert die Nitro- zur Aminogruppe. Nach Enantiomerentrennung liegt (2R,3R)-2-Amino-3-phenylpropan-1,3-diol vor.' }),
    G('D', 'D', 'CC(=O)OCC(NC(=O)C(Cl)Cl)C(OC(C)=O)c1ccccc1'),
    N('E', 'E', 'OC[C@@H](NC(=O)C(Cl)Cl)[C@H](O)c1ccc(cc1)[N+]([O-])=O', { caption: 'Chloramphenicol – ein Amid',
      explanation: '1) Nitrierung (S_E, Angriff des Nitronium-Ions NO_2^+) in para-Stellung. 2) NaOH verseift die beiden Acetat-Ester; das Dichloracetamid bleibt erhalten.' })
  ], [
    E('A', 'B', 'O_2N-CH_2CH_2-OH', 'NaOCH_3'),
    E('B', 'C', 'H_2 / Pd', 'Enantiomerentrennung'),
    E('C', 'D', 'Ac_2O + CH_3CO-O-COCHCl_2'),
    E('D', 'E', '1) HNO_3 / H_2SO_4', '2) NaOH')
  ], { hints: ['OAc = O-CO-CH_3'] }));
  const m = findSec(q, s => /D → E|D-Vorstufe/.test(s.title + (s.prompt || '')));
  q.sections[m].prompt = 'Nach welchem Mechanismus läuft die Nitrierung am Aromaten (D → E) ab?';
  addSection(q, SA('IUPAC-Name von C (1.6)', 'Benennen Sie Substanz C nach IUPAC.',
    '(2R,3R)-2-Amino-3-phenylpropan-1,3-diol'));
});

patch('bw42 trimethoprim', () => {
  const q = Q('bw42-2016-trimethoprim');
  setSec(q, 0, syn('C. Trimethoprim', [
    N('A', 'A', 'ClC(=O)c1cc(O)c(O)c(O)c1',
      { explanation: '3,4,5-Trihydroxybenzoylchlorid (Gallussäurechlorid). Mit Methanol (X) entsteht unter HCl-Abspaltung der Methylester B.' }),
    N('X', 'X', 'CO', { explanation: 'X = CH_3OH (Methanol).' }),
    N('B', 'B', 'COC(=O)c1cc(O)c(O)c(O)c1'),
    N('C', 'C', 'O=Cc1cc(O)c(O)c(O)c1',
      { explanation: 'DIBAL reduziert den Ester B zum Aldehyd; alternativ liefert die Rosenmund-Reduktion (H_2, Pd/BaSO_4) den Aldehyd direkt aus dem Säurechlorid A.' }),
    N('D', 'D', 'O=Cc1cc(OC)c(OC)c(OC)c1', { explanation: '3,4,5-Trimethoxybenzaldehyd.' }),
    N('E', 'E', 'CCOCC(C#N)=Cc1cc(OC)c(OC)c(OC)c1', { caption: '+ H_2O',
      explanation: 'Knoevenagel-artige Kondensation des Aldehyds D mit dem α-C von 3-Ethoxypropannitril (NaOEt) unter Wasserabspaltung; E/Z-Isomerengemisch.' }),
    G('T', '', 'COc1cc(Cc2cnc(N)nc2N)cc(OC)c1OC', { name: 'Trimethoprim' })
  ], [
    E(['A', 'X'], 'B', '-HCl'),
    E('B', 'C', 'DIBAL', 'in Toluen'),
    E('A', 'C', 'H_2, Pd/BaSO_4'),
    E('C', 'D', 'NaOCH_3', 'in MeOH'),
    E('D', 'E', 'NaOEt, EtOH', 'NC-CH_2CH_2-OEt'),
    E('E', 'T', 'Guanidin (H_2N)_2C=NH')
  ], {
    hints: [
      'Substanz B trägt den Namen: 3,4,5-Trihydroxybenzencarbonsäuremethylester.',
      'Substanz E ist ein Isomerengemisch.'
    ]
  }));
});

patch('bw42 penicillin', () => {
  const q = Q('bw42-2016-penicillin-v');
  setSec(q, 0, syn('D. Penicillin V', [
    G('S', '', 'CC1(C)S[C@H]([C@H](NC(=O)COc2ccccc2)C(=O)O)N[C@H]1C(=O)O'),
    N('A', 'A', 'CC1(C)S[C@H]([C@H](NC(=O)COc2ccccc2)C(=O)[O-])N[C@H]1C(=O)O.[K+]',
      { explanation: '1 Äq. KOH deprotoniert eine Carboxygruppe → Kaliumsalz (Carboxylat am späteren β-Lactam-C).' }),
    N('B', 'B', 'CC1(C)S[C@@H]2[C@H](NC(=O)COc3ccccc3)C(=O)N2[C@H]1C(=O)[O-].[K+]', { caption: 'Penicillin V',
      explanation: 'DCC aktiviert die Carbonsäure (O-Acylisoharnstoff); der Thiazolidin-Stickstoff greift intramolekular an (Acylsubstitution) → β-Lactam. Nebenprodukt: Dicyclohexylharnstoff.' })
  ], [
    E('S', 'A', '1 Äq. KOH'),
    E('A', 'B', '', 'DCC*')
  ], { hints: ['* DCC = Dicyclohexylcarbodiimid (Cyclohexyl-N=C=N-Cyclohexyl)'] }));
});

/* ── run ─────────────────────────────────────────────────────────── */
module.exports = { qs, Q, N, G, E, syn, SA, setSec, findSec, addSection, upsertQuestion, patch, patches };

if (require.main === module) {
  // Later parts register more patches.
  for (const f of fs.readdirSync(__dirname).filter(f => /^source-audit-2026-part\d+\.js$/.test(f)).sort()) {
    require(path.join(__dirname, f));
  }
  for (const p of patches) {
    try { p.fn(); console.log('✓', p.name); }
    catch (e) { console.error('✗', p.name, '—', e.message); process.exitCode = 1; }
  }
  if (!process.exitCode) {
    fs.writeFileSync(FILE, JSON.stringify(qs, null, 2) + '\n');
    console.log('wrote', FILE, '(' + qs.length + ' questions)');
  }
}
