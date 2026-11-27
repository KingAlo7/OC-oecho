/**
 * Remap related_reaction_id in questions.json to the ids of the rebuilt
 * reaction library.
 *
 * tools/build-reaction-library.js replaced the old 256-entry library with new
 * ids (e.g. 'aldoladdition' → 'aldol-addition'), but the quiz links on scheme
 * nodes, sections and MCQs still used the old ones. quiz.html then shows the
 * raw id ("→ aldoladdition") and index.html#<id> opens the welcome page.
 *
 *   MAP        old id → its successor in the new library.
 *   OVERRIDES  single occurrences ('question-id#node-id') whose step is a
 *              different reaction than the old id's successor, e.g. an
 *              intramolecular aldol condensation linked to 'aldoladdition'.
 *   NO_MATCH   old ids without a counterpart in the new library; they are
 *              left untouched for a manual decision (drop the link or add an
 *              entry to the library).
 *
 * Idempotent: once all ids resolve, a re-run changes nothing.
 * Usage: node tools/remap-related-reaction-ids.js [--dry]
 */
const fs = require('fs');
const path = require('path');
const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const RFILE = path.join(__dirname, '..', 'data', 'reactions.json');
const DRY = process.argv.includes('--dry');

const raw = fs.readFileSync(QFILE, 'utf8');
const questions = JSON.parse(raw);
const reactionIds = new Set(JSON.parse(fs.readFileSync(RFILE, 'utf8')).map(r => r.id));

const MAP = {
  'nabh4-lialh4':         'carbonyl-reduktion',
  'oso4-diol':            'syn-dihydroxylierung',
  'aldoladdition':        'aldol-addition',
  'grignard-co':          'grignard-addition',
  'alken-hx-markownikow': 'elektrophile-addition-hx',
  'friedel-crafts-alkyl': 'friedel-crafts-alkylierung',
  'friedel-crafts-acyl':  'friedel-crafts-acylierung',
  'arom-sulfonierung':    'sulfonierung',
  'arom-nitrierung':      'nitrierung',
  'sn2-alkylhalogenid':   'sn2',
  'hydrogenolyse':        'katalytische-hydrierung',  // covers Bn/Cbz hydrogenolysis
  'epoxidierung':         'epoxidierung-mcpba',
  'veresterung':          'fischer-veresterung',
  'seo2-allyl':           'allylische-oxidation-seo2',
  'mesylierung':          'tosylierung',
  'elektrocyclisch':      'elektrocyclisierung',
  'cycloadd-22':          'photo-2plus2',             // only [2+2] entry; written for hν
  'wolff-kishner':        'wolff-kishner-clemmensen',
  'hwe-wittig':           'wittig',                   // covers HWE
  'henry-reaktion':       'henry-nitroaldol',
  'dcc-amidkupplung':     'peptidkupplung-dcc',
};

// 'question-id#node-id' → [old id, new id]
const OVERRIDES = {
  'stork-cantharidin-1951#J': ['aldoladdition', 'aldol-kondensation'],      // Base, -H2O → Enal
  'bw48-2022-z-jasmon#H':     ['aldoladdition', 'aldol-kondensation'],
  'bw47-2021-carvon#I':       ['aldoladdition', 'aldol-kondensation'],
  'bw49-2023-ibuprofen#F':    ['grignard-co', 'grignard-co2'],              // RMgX + CO2
  'bw50-2024-vitamin-e#A':    ['sn2-alkylhalogenid', 'nitril-aus-halogenid'], // NaCN, -OTs
  'bw49-2023-lidocain#L':     ['sn2-alkylhalogenid', 'amin-alkylierung'],     // Et2NH, α-Cl-Amid
  'bw46-2020-conicein#D':     ['mesylierung', 'e2'],                        // KOtBu, -MsOH
};

const NO_MATCH = new Set([
  'ester-pyrolyse',  // thermische syn-Eliminierung (Ei) — keine Entsprechung
  'arbuzov',         // Michaelis-Arbuzov — keine Entsprechung
]);

for (const id of [...Object.values(MAP), ...Object.values(OVERRIDES).map(o => o[1])]) {
  if (!reactionIds.has(id)) throw new Error('Mapping target not in reactions.json: ' + id);
}

const changes = [];
const unresolved = [];

function relink(obj, qid, where) {
  const old = obj.related_reaction_id;
  if (reactionIds.has(old)) return;
  const pin = OVERRIDES[qid + '#' + obj.id];
  const next = pin && pin[0] === old ? pin[1] : MAP[old];
  if (!next) { unresolved.push({ qid, where, old }); return; }
  obj.related_reaction_id = next;
  changes.push({ qid, where, old, next });
}

function walk(node, qid, where) {
  if (Array.isArray(node)) { node.forEach((v, i) => walk(v, qid, where + '[' + i + ']')); return; }
  if (!node || typeof node !== 'object') return;
  if (typeof node.related_reaction_id === 'string') {
    relink(node, qid, (where || '(Frage)') + (node.id !== undefined ? ' ' + node.id : ''));
  }
  for (const [k, v] of Object.entries(node)) walk(v, qid, where ? where + '.' + k : k);
}

for (const q of questions) walk(q, q.id, '');

if (!DRY && changes.length) {
  // Same layout as server.js (2-space JSON); keep the file's line endings.
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  fs.writeFileSync(QFILE, JSON.stringify(questions, null, 2).replace(/\n/g, eol) + eol);
}

console.log((DRY ? 'Would relink ' : 'Relinked ') + changes.length + ' related_reaction_id values:');
changes.forEach(c => console.log('  ' + c.qid.padEnd(30), c.where.padEnd(28), c.old, '→', c.next));
if (unresolved.length) {
  console.log('\nLeft unchanged (' + unresolved.length + '):');
  unresolved.forEach(u => console.log('  ' + u.qid.padEnd(30), u.where.padEnd(28), u.old,
    NO_MATCH.has(u.old) ? '(no match in reactions.json)' : '(unknown — add to MAP)'));
}
