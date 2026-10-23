#!/usr/bin/env node
/**
 * Links quiz steps to the reaction library.
 *
 * Every scheme node that is the product of a reaction worth knowing by
 * name gets `related_reaction_id`; the quiz shows it as "→ <Reaktion>" in
 * the node's info panel. The table is written by hand, one entry per
 * product node, because the same reagent means different reactions in
 * different contexts (LiAlH₄, H₂/Pd, "Base" …).
 *
 * Key: "<question id>|<section index>:<node id>", or "<question id>|S<n>"
 * for a whole section (multiple choice, mechanism). Listed links replace
 * whatever was there; nodes that are not listed are left alone, except
 * that links to ids the library no longer has are removed.
 *
 * Run:  node tools/link-quiz-reactions.js
 */

const fs = require('fs');
const path = require('path');

const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const RFILE = path.join(__dirname, '..', 'data', 'reactions.json');

const LINKS = {
  'stork-cantharidin-1951': {
    '0:C': 'diels-alder', '0:D': 'diels-alder', '0:E': 'carbonyl-reduktion', '0:F': 'tosylierung',
    '0:G': 'sn2', '0:H': 'syn-dihydroxylierung', '0:I': 'diolspaltung-periodat', '0:J': 'aldol-kondensation',
    '0:K': 'grignard-addition', '0:L': 'esterpyrolyse', '0:M': 'ozonolyse', '0:Y': 'ozonolyse',
  },
  'regio-hbr-propen-markownikow': { 'S0': 'elektrophile-addition-hx' },
  'mechanismus-aldol-base': { 'S0': 'aldol-addition' },
  'lw50-2024-rohypnol': {
    '0:A': 'benzylische-halogenierung', '0:B': 'nitril-aus-halogenid', '0:C': 'nitrilhydrolyse',
    '0:D': 'saeurechlorid', '0:Ee': 'friedel-crafts-acylierung', '0:F': 'oxim-hydrazon',
    '0:IN': 'fischer-indol', '0:Gg': 'ozonolyse', '0:AB': 'ozonolyse', '0:I': 'iminbildung',
  },
  'lw49-2023-tazaroten': {
    '0:A': 'seitenketten-oxidation', '0:B': 'fischer-veresterung', '0:C': 'saeurechlorid',
    '1:Ee': 'sn2', '1:F': 'friedel-crafts-alkylierung', '1:Gg': 'friedel-crafts-acylierung',
  },
  'lw48-2022-elemicin': {
    '1:B': 'williamson-ethersynthese', '1:C': 'saeurechlorid', '1:D': 'amidbildung',
    '1:Gg': 'dibal-reduktion', '1:F': 'carbonyl-reduktion',
    '4:H': 'grignard-addition', '4:I': 'dehydratisierung-alkohol',
  },
  'lw51-2025-cyclohexylethanol': {
    '2:B': 'katalytische-hydrierung', '2:C': 'dehydratisierung-alkohol',
    '2:E': 'alkohol-zu-halogenid', '2:F': 'grignard-addition',
  },
  'lw51-2025-sildenafil': {
    '0:Ee': 'esterhydrolyse', '0:F': 'nitrierung', '0:Gg': 'saeurechlorid', '0:H': 'amidbildung',
    '0:I': 'nitro-reduktion', '0:K': 'amidbildung', '0:S': 'sulfonierung',
  },
  'lw45-2019-phenylacetylen-routen': {
    '2:X': 'alkin-aus-dihalogenid', '4:A': 'friedel-crafts-acylierung', '4:X': 'alkin-aus-dihalogenid',
    '5:D': 'halogenierung-aromat', '5:F': 'grignard-addition', '5:St': 'dehydratisierung-alkohol',
    '5:Gg': 'bromierung-alken', '5:X': 'alkin-aus-dihalogenid',
    '8:H1': 'bromierung-alken', '8:H2': 'bromierung-alken', '10:K': 'bromierung-alken',
    '12:M': 'glaser-kupplung', '12:Nn': 'hydratisierung-alkin',
  },
  'lw42-2015-phellandral': {
    '0:A': 'friedel-crafts-alkylierung', '0:B': 'sulfonierung', '0:C': 'alkalischmelze',
    '0:D': 'katalytische-hydrierung', '0:E': 'sek-alkohol-zu-keton', '0:F': 'cyanhydrin',
    '0:G': 'anhydrid-acylierung', '0:H': 'esterpyrolyse', '0:I': 'nitrilhydrolyse',
    '0:J': 'saeurechlorid', '0:K': 'rosenmund-reduktion',
  },
  'lw43-2017-papaverin': {
    '0:A': 'williamson-ethersynthese', '0:B': 'carbonyl-reduktion', '0:C': 'alkohol-zu-halogenid',
    '0:D': 'nitril-aus-halogenid', '0:F': 'nitrilhydrolyse', '0:Gg': 'saeurechlorid',
    '0:H': 'amidbildung', '0:DHI': 'bischler-napieralski',
  },
  'lw44-2018-oxybuprocain': {
    '2:B': 'nitrierung', '2:C': 'nitro-reduktion', '2:D': 'diazonium-verkochung', '2:Ee': 'nitrierung',
    '2:F': 'fischer-veresterung', '2:Gg': 'williamson-ethersynthese', '2:H': 'esterhydrolyse',
    '2:I': 'saeurechlorid', '2:OX': 'nitro-reduktion', '8:J': 'amin-alkylierung',
  },
  'lw50-2024-ghb-gbl': { '0:GBL': 'lactonbildung' },
  'bw50-2024-merrilacton': {
    '0:A': 'diels-alder', '0:D': 'ozonolyse', '0:Ee': 'aldol-kondensation',
    '0:CJ': 'claisen-umlagerung', '0:F': 'iodlactonisierung',
  },
  'bw50-2024-vitamin-e': {
    '0:A': 'nitril-aus-halogenid', '0:B': 'dibal-reduktion', '0:C': 'acetylid-addition',
    '0:C2': 'acetylid-addition', '0:D': 'lindlar-hydrierung', '0:D2': 'lindlar-hydrierung',
  },
  'bw50-2024-tyr-asp-dipeptid': {
    '0:A': 'gabriel-synthese', '0:B': 'malonester-synthese', '0:C': 'gabriel-synthese',
    '0:D': 'esterhydrolyse', '0:Ee': 'decarboxylierung', '0:F': 'boc-schutz',
    '0:Gg': 'peptidkupplung-dcc', '0:H': 'hydrogenolyse-benzyl',
  },
  'bw51-2025-sapropterin': {
    '0:A': 'epoxidierung-mcpba', '0:AE': 'epoxid-oeffnung', '0:B': 'esterhydrolyse',
    '0:C': 'sn2', '0:D': 'snar', '0:Ee': 'nitro-reduktion',
  },
  'bw51-2025-farnesol': {
    '0:A': 'ozonolyse', '0:B': 'ozonolyse', '0:C': 'ozonolyse',
    '1:R1': 'katalytische-hydrierung', '1:R2': 'anhydrid-acylierung',
    '1:R3': 'prim-alkohol-zu-aldehyd', '1:R4': 'oxim-hydrazon',
    '2:A2': 'malonester-synthese', '2:B2': 'decarboxylierung', '2:D2': 'alkin-aus-dihalogenid',
    '2:E2': 'acetylid-addition', '2:Fa': 'gilman-kupplung',
  },
  'bw51-2025-phenylketonurie': {
    '0:B': 'transaminierung-plp', '0:X': 'transaminierung-plp',
    '3:K': 'transaminierung-plp', '3:L': 'transaminierung-plp',
  },
  'bw49-2023-methylorange': { '0:M': 'azokupplung' },
  'bw49-2023-ibuprofen': {
    '0:B': 'friedel-crafts-acylierung', '0:C': 'carbonyl-reduktion',
    '0:D': 'alkohol-zu-halogenid', '0:F': 'grignard-co2',
  },
  'bw49-2023-benzocain': {
    '0:B': 'nitrierung', '0:C': 'nitro-reduktion', '0:D': 'anhydrid-acylierung',
    '0:Ee': 'seitenketten-oxidation', '0:Bc': 'fischer-veresterung',
  },
  'bw49-2023-lidocain': { '0:I': 'amidbildung', '0:L': 'amin-alkylierung' },
  'bw48-2022-butanon-reaktionen': {
    '0:A': 'oxim-hydrazon', '0:C': 'beckmann-umlagerung', '0:B': 'baeyer-villiger',
    '0:D': 'carbonyl-reduktion', '0:Ee': 'dehydratisierung-alkohol', '0:F': 'elektrophile-addition-hx',
    '0:Gg': 'allylische-oxidation-seo2', '0:H': 'wittig', '0:I': 'grignard-addition',
  },
  'bw48-2022-z-jasmon': {
    '0:B': 'malonester-synthese', '0:C': 'decarboxylierung', '0:D': 'claisen-kondensation',
    '0:Ee': 'malonester-synthese', '0:Gg': 'decarboxylierung', '0:H': 'aldol-kondensation',
  },
  'bw48-2022-lysergsaeure-myers-allen': { '0:C': 'mitsunobu', '2:F': 'mitsunobu' },
  'bw47-2021-thymol': { '0:A': 'sulfonierung', '0:B': 'friedel-crafts-alkylierung', '0:C': 'alkalischmelze' },
  'bw47-2021-capsaicin': {
    '0:A': 'iminbildung', '0:B': 'reduktive-aminierung', '0:D': 'wittig', '0:Zs': 'wittig',
    '0:F': 'saeurechlorid', '0:Gc': 'amidbildung',
  },
  'bw47-2021-carvon': {
    '0:B': 'grignard-addition', '0:C': 'acetal-schutz', '0:D': 'allylische-oxidation-seo2',
    '0:Ee': 'carbonyl-reduktion', '0:F': 'claisen-umlagerung', '0:Gc': 'claisen-umlagerung',
    '0:H': 'acetal-schutz', '0:I': 'aldol-kondensation',
  },
  'bw46-2020-conicein': {
    '0:A': 'tosylierung', '0:B': 'hydrogenolyse-benzyl', '0:C': 'amidbildung', '0:D': 'e2',
    '0:E': 'elektrocyclisierung', '0:F': 'diels-alder',
  },
  'bw46-2020-bergamoten': {
    '0:P1': 'wittig', '0:P2': 'wittig', '1:A': 'enolat-alkylierung', '1:C': 'wittig',
    '1:D': 'saeurechlorid', '1:E': 'keten-cycloaddition', '1:F': 'keten-cycloaddition',
    '1:G': 'wolff-kishner-clemmensen',
  },
  'bw46-2020-aspidospermin': {
    '0:A': 'enaminbildung', '0:B': 'stork-enamin-alkylierung', '0:C': 'enaminbildung',
    '0:RB': 'robinson-anellierung', '0:E': 'acetal-schutz', '0:Gc': 'michael-addition',
    '0:H': 'amidbildung', '0:I': 'enolat-alkylierung', '0:K': 'oxim-hydrazon', '0:ASP': 'fischer-indol',
  },
  'bw46-2020-prostaglandin-fragment': {
    '0:A': 'carbonyl-reduktion', '0:B': 'diolspaltung-periodat', '0:C': 'iodlactonisierung',
  },
  'bw46-2020-pericyclic-da': {
    '0:A': 'diels-alder', '0:B': 'diels-alder', '1:En': 'elektrocyclisierung',
    '1:A': 'elektrocyclisierung', '1:B': 'elektrocyclisierung', '1:C': 'diels-alder',
  },
  'bw45-2019-abscisinsaeure': {
    '0:C': 'robinson-anellierung', '0:D': 'robinson-anellierung', '0:F': 'acetal-schutz',
    '0:G': 'dibal-reduktion', '0:H': 'reformatsky', '0:I': 'epoxidierung-mcpba', '0:J': 'acetal-schutz',
    '11:X': 'ozonolyse', '11:Y': 'ozonolyse', '11:Z': 'ozonolyse',
  },
  'bw45-2019-twistan': {
    '0:A': 'carbonyl-reduktion', '0:B': 'nitril-aus-halogenid', '0:C': 'nitrilhydrolyse',
    '0:D': 'iodlactonisierung', '0:G': 'tosylierung', '0:H': 'sek-alkohol-zu-keton',
    '0:I': 'enolat-alkylierung', '0:T': 'wolff-kishner-clemmensen',
  },
  'bw44-2018-kaffeesaeure': {
    '0:Z': 'michaelis-arbuzov', '0:C': 'michaelis-arbuzov', '0:B': 'acetal-schutz', '0:F': 'horner-wadsworth-emmons',
    '0:D': 'williamson-ethersynthese', '0:E': 'aldol-kondensation', '0:E2': 'aldol-kondensation',
    '0:G': 'williamson-ethersynthese', '0:H': 'saeurechlorid',
  },
  'bw44-2018-colchicin': {
    '0:B': 'benzylische-halogenierung', '0:C': 'wittig', '0:E': 'wittig', '0:G2': 'prim-alkohol-zu-aldehyd',
    '0:H': 'wittig', '0:I': 'friedel-crafts-alkylierung', '0:L': 'grignard-co2', '0:M': 'fischer-veresterung',
    '0:N': 'dieckmann-kondensation', '0:O': 'decarboxylierung', '0:P': 'claisen-kondensation',
    '0:R': 'thioacetal-raney',
  },
  'bw43-2017-atropin': {
    '0:C': 'dipolare-cycloaddition', '0:D': 'amin-alkylierung', '1:TN': 'mannich',
    '2:G': 'grignard-addition', '2:H': 'esterhydrolyse', '2:I': 'fischer-veresterung',
  },
  'bw43-2017-ferruginin': {
    '0:B': 'baeyer-villiger', '0:C': 'tosylierung', '0:D': 'enolat-alkylierung',
    '0:F': 'sek-alkohol-zu-keton', '0:H': 'syn-dihydroxylierung', '0:I': 'diolspaltung-periodat',
    '0:K': 'iminbildung', '0:L': 'reduktive-aminierung',
  },
  'bw42-2016-prontosil': {
    '0:B': 'sulfonierung', '0:E': 'diazotierung', '0:F': 'azokupplung',
  },
  'bw42-2016-chloramphenicol': {
    '0:A': 'henry-nitroaldol', '0:B': 'henry-nitroaldol', '0:D': 'anhydrid-acylierung', '0:E': 'nitrierung',
  },
  'bw42-2016-trimethoprim': { '0:C': 'dibal-reduktion', '0:E': 'knoevenagel' },
  'bw42-2016-penicillin-v': { '0:B': 'peptidkupplung-dcc' },
  'bw39-2013-grandisol': {
    '0:B': 'enolat-alkylierung', '0:C': 'epoxidierung-mcpba', '0:D': 'epoxid-oeffnung',
    '0:E': 'dibal-reduktion', '0:F': 'oxim-hydrazon', '0:G': 'wolff-kishner-clemmensen',
    '0:H': 'sek-alkohol-zu-keton', '0:I': 'wittig', '0:P1': 'acetal-schutz',
    '5:K': 'photo-2plus2', '5:L': 'alpha-halogenierung', '5:M': 'grignard-addition',
    '5:N': 'ozonolyse', '5:P2': 'wittig',
  },
  'bw47-2021-coffein': {
    '0:A': 'amin-alkylierung', '0:B': 'nitrierung', '0:C': 'nitro-reduktion',
    '0:E': 'nitro-reduktion', '0:F': 'amin-alkylierung',
  },
  'bw47-2021-yuehchukene': { '0:A': 'nazarov-cyclisierung' },
  'bw49-2023-hirsuten': {
    '0:A': 'diels-alder', '0:B': 'photo-2plus2', '1:N2': 'radikalische-cyclisierung',
  },
  'bw52-2026-maillard-zucker': {
    '0:C': 'iminbildung', '0:H': 'michael-addition', '0:H2': 'michael-addition', '0:I': 'michael-addition',
    '1:A2': 'acetal-schutz', '3:A3': 'acetal-schutz',
  },
  'bw52-2026-adrenosteron': {
    '0:A': 'enolat-alkylierung', '0:B': 'enolat-alkylierung', '0:C': 'michael-addition',
    '0:D': 'robinson-anellierung', '0:Ee': 'acetylid-addition', '0:F': 'anhydrid-acylierung',
    '0:Gg': 'rupe-umlagerung', '0:H': 'thioacetal-raney', '0:K': 'diels-alder',
    '0:Nn': 'dieckmann-kondensation', '0:ADR': 'decarboxylierung',
  },
  'bw52-2026-thymol-kuemmel': {
    '0:A': 'nitrierung', '0:B': 'wolff-kishner-clemmensen', '0:C': 'diazonium-verkochung',
    '0:D': 'friedel-crafts-alkylierung',
  },
  'lw52-2026-fentanyl-diphenhydramin': {
    '0:A': 'amin-alkylierung', '0:B': 'iminbildung', '0:C': 'reduktive-aminierung', '0:FE': 'amidbildung',
    '7:FA': 'friedel-crafts-alkylierung', '7:FB': 'benzylische-halogenierung', '7:FC': 'williamson-ethersynthese',
    '8:FD': 'grignard-addition', '8:FB2': 'sn1', '8:Ep': 'sn1', '8:C2': 'amin-alkylierung',
  },
  'bw50-2024-warmup-bromierung': {
    '0:PA': 'bromierung-alken', '0:PB1': 'bromierung-alken', '0:PC1': 'bromierung-alken',
    '2:Im': 'iminbildung', '2:Ke': 'friedel-crafts-acylierung',
  },
};

// Explanations that described the wrong step.
const EXPLANATIONS = {
  'bw42-2016-chloramphenicol|0:D':
    'Acylierung: die Aminogruppe wird zum Dichloracetamid, beide OH-Gruppen werden als Acetate geschützt.',
};

const questions = JSON.parse(fs.readFileSync(QFILE, 'utf8'));
const known = new Set(JSON.parse(fs.readFileSync(RFILE, 'utf8')).map(r => r.id));

const problems = [];
for (const [qid, map] of Object.entries(LINKS)) {
  for (const [k, rx] of Object.entries(map)) {
    if (!known.has(rx)) problems.push(qid + '|' + k + ': unbekannte Reaktion ' + rx);
  }
}

const byId = new Map(questions.map(Q => [Q.id, Q]));
const used = new Set();
let set = 0, cleared = 0;

function nodeAt(Q, key) {
  const m = /^(\d+):(.+)$/.exec(key);
  const s = m && Q.sections && Q.sections[+m[1]];
  return s && s.scheme && s.scheme.nodes.find(n => n.id === m[2]);
}

for (const [qid, map] of Object.entries(LINKS)) {
  const Q = byId.get(qid);
  if (!Q) { problems.push(qid + ': Frage fehlt'); continue; }
  for (const [key, rx] of Object.entries(map)) {
    const target = /^S(\d+)$/.test(key) ? Q.sections[+key.slice(1)] : nodeAt(Q, key);
    if (!target) { problems.push(qid + '|' + key + ': Knoten fehlt'); continue; }
    if (target.related_reaction_id !== rx) { target.related_reaction_id = rx; set++; }
    used.add(qid + '|' + key);
  }
}
for (const [k, text] of Object.entries(EXPLANATIONS)) {
  const [qid, key] = k.split('|');
  const n = nodeAt(byId.get(qid), key);
  if (!n) problems.push(k + ': Knoten fehlt'); else n.explanation = text;
}

// Links to ids that no longer exist would render as dead "→" links.
for (const Q of questions) {
  (Q.sections || []).forEach((s, si) => {
    const holders = [s].concat(s.scheme ? s.scheme.nodes : []);
    for (const h of holders) {
      if (h.related_reaction_id && !known.has(h.related_reaction_id)) {
        delete h.related_reaction_id; cleared++;
      }
    }
  });
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

fs.writeFileSync(QFILE, JSON.stringify(questions, null, 2) + '\n');
let total = 0;
for (const Q of questions) for (const s of Q.sections || []) {
  if (s.related_reaction_id) total++;
  for (const n of (s.scheme ? s.scheme.nodes : [])) if (n.related_reaction_id) total++;
}
console.log('gesetzt/geändert: ' + set + ', tote Links entfernt: ' + cleared + ', Links gesamt: ' + total);
