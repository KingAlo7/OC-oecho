/**
 * Auto-link related_reaction_id on synthesis-scheme nodes
 * where the explanation/note unambiguously matches a known reaction.
 *
 * Rules:
 * - Only ADD a link; never overwrite an existing one.
 * - Pattern must be specific (named reaction OR distinctive reagent),
 *   not a generic word that could appear in many contexts.
 * - Tested patterns rejected for being too noisy:
 *   - 'NaOMe' alone (used in many contexts) → only match when explicitly with phosphonate
 *   - 'Pd(OH)2' alone → only when paired with 'Debenzyl' or 'Bn' or 'Cbz'
 */
const fs = require('fs');
const path = require('path');
const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const questions = JSON.parse(fs.readFileSync(QFILE, 'utf8'));

// pattern → reaction id  (order matters: more specific first)
const RULES = [
  // Named reactions — high confidence
  [/Wolff[- ]?Kishner/i,                                    'wolff-kishner'],
  [/Eschweiler[- ]?Clarke/i,                                'eschweiler-clarke'],
  [/Robinson[- ]?Anelliierung|Robinson[- ]?Annulierung|Robinson[- ]?Annel/i, 'robinson-anellierung'],
  [/Knoevenagel/i,                                          'knoevenagel'],
  [/Reformatsky/i,                                          'reformatsky'],
  [/Mannich/i,                                              'mannich'],
  [/Henry[- ]Reaktion|Nitroaldol/i,                          'henry-reaktion'],
  [/Arbuzov/i,                                              'arbuzov'],
  [/Baeyer[- ]?Villiger/i,                                  'baeyer-villiger'],
  [/Wittig[- ]?Reaktion|Ph_?3P\s*=\s*CH/i,                  'wittig'],
  [/HWE[- ]?Wittig|HWE[- ]?Olefin|Horner[- ]?Wadsworth[- ]?Emmons|HWE\b/i, 'hwe-wittig'],
  [/Michael[- ]?Addition/i,                                 'michael-addition'],
  [/Claisen[- ]?Umlag|\[3,3\][- ]?sigmatrop/i,              'claisen-umlagerung'],
  [/Diels[- ]?Alder|\[4\+2\][- ]?Cycloadd/i,                'diels-alder'],
  [/1,3[- ]?dipolar|\[3\+2\][- ]?Cycloadd/i,                'dipolar-32-cycloaddition'],
  [/\[2\+2\][- ]?Cycloadd|Keten[- ]?Cycloadd/i,             'cycloadd-22'],
  [/elektrocyclisch|konrotatorisch|disrotatorisch/i,        'elektrocyclisch'],

  // Reagent-named, high confidence
  [/DIBAL[- ]?H|i-?Bu_?2AlH/i,                              'dibal-reduktion'],
  [/SeO_?2/i,                                               'seo2-allyl'],
  [/DCC|Dicyclohexylcarbodiimid|Carbodiimid/i,              'dcc-amidkupplung'],
  [/NaIO_?4/i,                                              'periodat-spaltung'],
  [/OsO_?4/i,                                               'oso4-diol'],
  [/m[- ]?CPBA|meta[- ]?Chlorperbenzoes/i,                  'epoxidierung'],
  [/Diazoti|Diazonium|NaNO_?2.*HCl/i,                       'diazotierung'],
  [/Hydrogenolyse|H_?2\s*\/\s*Pd\(OH\)_?2|Debenzyl/i,       'hydrogenolyse'],
  [/MsCl|MeSO_?2Cl|Methansulfonylchlorid|Mesyl(?:at|gruppe|ierung)/i, 'mesylierung'],
  [/NaBH_?3CN.*[Ii]min|reduktive Aminierung/i,              'reduktive-aminierung'],
  [/Aldol[- ]?Addition\b/i,                                  'aldoladdition'],

  // S_E am Aromaten
  [/Friedel[- ]?Crafts[- ]?Alkyl|Friedl[- ]?Crafts[- ]?Alkyl/i, 'friedel-crafts-alkyl'],
  [/Friedel[- ]?Crafts[- ]?Acyl|Friedl[- ]?Crafts[- ]?Acyl/i,  'friedel-crafts-acyl'],
  [/Sulfonier|Chlorsulfonier|SO_?3\s*\/\s*H_?2SO_?4|ClSO_?3H/i, 'arom-sulfonierung'],
  [/HNO_?3\s*\/\s*H_?2SO_?4|Nitrierung am Aromat|aromatische\s+Nitrierung|para[- ]?Nitrierung|NO_?2\^?\+/i, 'arom-nitrierung'],
  [/Azokupp/i,                                              'azokupplung'],

  // Iodolactonisierung
  [/Iodolact|Iodonium/i,                                    'iodolactonisierung']
];

let added = 0;
let skipped = 0;
const auditLog = [];

function tryLink(node, parentQid, hint) {
  if (node.related_reaction_id) { skipped++; return; }
  const text = (node.explanation || '') + ' ' + (node.note || '') + ' ' + (node.name || '');
  for (const [pat, rxid] of RULES) {
    if (pat.test(text)) {
      node.related_reaction_id = rxid;
      added++;
      auditLog.push({ qid: parentQid, where: hint, rxid, snippet: text.replace(/\s+/g,' ').slice(0,75) });
      return;
    }
  }
}

for (const Q of questions) {
  if (!Array.isArray(Q.sections)) continue;
  for (const s of Q.sections) {
    if (!s.scheme || !Array.isArray(s.scheme.nodes)) continue;
    for (const n of s.scheme.nodes) {
      tryLink(n, Q.id, 'node:' + (n.label || n.id));
    }
  }
}

fs.writeFileSync(QFILE, JSON.stringify(questions, null, 2) + '\n');

console.log('Auto-linked nodes:', added);
console.log('Already had a link (skipped):', skipped);
console.log('\nLinks added (first 50):');
auditLog.slice(0, 50).forEach(a =>
  console.log(' ', a.qid.padEnd(35), a.where.padEnd(22), '→', a.rxid)
);
if (auditLog.length > 50) console.log('  ... +', auditLog.length - 50, 'more');

// Summary
const counts = {};
auditLog.forEach(a => counts[a.rxid] = (counts[a.rxid] || 0) + 1);
console.log('\nLinks added per reaction:');
Object.entries(counts).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) =>
  console.log(' ', v.toString().padStart(3), k)
);
