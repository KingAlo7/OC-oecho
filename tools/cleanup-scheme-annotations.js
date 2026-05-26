/**
 * Sanitize questions.json synthesis schemes by:
 *   1. Removing every `node.name` (only id/label kept; matches admin UI).
 *   2. Removing `edge.reagent_below` (and `reagent_above`) when its content
 *      is just a reaction-name annotation that the original exam papers
 *      did NOT show under the arrow.
 *
 * The rules are conservative — actual reagents (Δ, solvents, byproducts
 * with leading "-", multi-step "2. ..." sequences) are preserved.
 */
const fs = require('fs');
const path = require('path');
const QFILE = path.join(__dirname, '..', 'data', 'questions.json');
const data = JSON.parse(fs.readFileSync(QFILE, 'utf8'));

// Whole-string patterns: if the cleaned label matches one of these, drop it.
// These are reaction-name / mechanism / categorisation annotations that the
// original exam papers DID NOT show under or above the arrows.
const REACTION_NAMES = [
  // Mechanism abbreviations (with or without subscript underscores)
  /^S[_]?[NE][12]?$/,
  /^A[_]?[NE]$/,
  /^E[12]$/,
  /^SR$/,
  /^Acylsubstitution$/i,
  /^Acyl(?:ierung)?$/i,
  /^Aminolyse$/i,
  /^Markownikow$/i, /^Anti[- ]?Markownikow$/i,
  /^doppelte Eliminierung$/i,
  /^intramolekulare? S[_]?[NE][12]?$/i,
  /^SN am [A-Za-z]+$/i,
  /^SN2 am [αβγδ\-A-Za-z]+$/i,
  // Named reactions
  /^(Wittig|HWE|HWE[- ]?Wittig|Knoevenagel|Reformatsky|Mannich|Robinson(?:[- ]?An[ne]ll(?:ierung|ation))?|Henry|Michael(?:[- ]?Addition)?|Claisen(?:[- ]?Umlagerung)?|Aldol(?:[- ]?(?:addition|kondensation))?|Diels[- ]?Alder|Friedel[- ]?Crafts(?:[- ]?(?:Acylierung|Alkylierung))?|Wolff[- ]?Kishner|Eschweiler[- ]?Clarke|Baeyer[- ]?Villiger|Sandmeyer|Schiff[- ]?Base|Rosenmund|Stork(?:[- ]?Enamin)?|Arbuzov|Reduktion|Oxidation|Hydrolyse|Kondensation|Cyclisierung|Hydrierung|Epoxidierung|Ringschluss|Ringöffnung|Verseifung|Eliminierung|Acylierung|Alkylierung|Veresterung|(?:De)?[Hh]ydratisierung|Hydratation|Substitution|Olefinierung|Cycloaddition|Umlagerung|Tautomerie|Decarboxylierung|Diazotierung|Hydrogenolyse|Mesylierung|Diolspaltung|Acetalisierung|Ketalisierung|Anellierung|Alpha-Bromierung|α-Bromierung|α-Oxidation|Carboxylierung|Methylenierung|Halogenierung|Beckmann|Fischer|Lindlar|Paal[- ]?Knorr|Pinner|Strecker|Schmidt|Curtius|Hofmann|Krapcho|Birch|Bouveault|Tishchenko|Cannizzaro|Williamson|Finkelstein|Gabriel|Debenzylierung|Demethylierung|Esterhydrolyse|Decarboxylase|Lyase|Transferase|Hydroxylierung|N[- ]?Methylierung)$/i,
  // Cycloaddition notation
  /^\[(?:[234]\+[234]|[23],[23])\][- ]?(?:Cycloaddition|sigmatrop)?$/,
  // Electrocyclic / pericyclic descriptors
  /^(?:elektrocycl\.?\s*Ring(?:öffnung|schluss)?\s*(?:\(.*\))?)$/i,
  /^(?:konrotatorisch|disrotatorisch|sup[ra]?facial)$/i,
  // Pure category tags
  /^(?:Oxidoreduktase|Iodolactonisierung|Iodolacton|Diolspalt(?:ung)?|Riley[- ]?Oxidation|Click[- ]?Chemie|Periodatspaltung|Halbester|Carbonat|Ketal|Acetonid(?:\s*\+\s*Verseifung)?|α[- ]?Chlorketon|Aldol|Robinson|Stork)$/i,
  // E/Z geometry callouts ("(E)-Alken" or "(Z)-Vinyliodid" — these are
  // product descriptions, not arrow labels in the original exam)
  /^\([EZ]\)[- ]?[A-Za-zäöüÄÖÜß]+$/,
  // (E)/(Z)-Alken (Lindlar) etc. with parenthetical reagent — strip
  /^\([EZ]\)[- ]?[A-Za-z]+\s*\([^)]+\)$/,
  // "Halbester", "Halbacetal" alone
  /^Halb[a-zä]+$/i,
  // Numbered Rxn-callouts ("Rxn 5") or descriptive ones like "(Rxn 4)"
  /^\(?Rxn\s*\d+\)?$/i,
  // Bare elemental transformations like "NO_2 → NH_2", "CH_3 → COOH"
  /^[A-Za-z0-9_^{}]+\s*→\s*[A-Za-z0-9_^{}]+$/,
  // Pure parenthetical notes
  /^\(.*\)$/,
  // "X abgespalten" / "X eliminiert"
  /^[A-Za-z]+\s+(?:abgespalten|eliminiert|gebildet|erzeugt)$/i,
  // [Umlagerung] / [Isomerisierung]
  /^\[[A-Za-zäöüÄÖÜß]+\]$/,
  // Mechanism / orbital descriptions
  /^(?:selektive? )?[A-Za-zäöüÄÖÜß]+(?:tion|ung|ierung)$/i,
  // single-word "Cyclisierung", "Bildung" etc that survived earlier rules
];

// Trailing annotations to strip. Each tries one mechanism / category /
// step-number suffix at a time and is applied repeatedly until idempotent.
const MECH_TRAILING_RES = [
  // " (Rxn 5)" / " (Rxn 12)" — exam-step callouts
  /\s*\(?Rxn\s*\d+\)?\.?$/i,
  // " — intramol. S_N2"
  /\s*[—\-–,/;]+\s*(int(?:e?r)?(?:a|mol)\.?[- ]?)?(?:S[_]?[NE][12]?|A[_]?[NE]|E[12]|\[\d\+\d\]|Cycloadd(?:ition)?|Aldol[- ]?(?:Addition|Kondensation)?|Wittig|HWE|Reformatsky|Mannich|Robinson(?:[- ]?An[ne]ll(?:ierung|ation))?|Knoevenagel|Reduktion|Oxidation|Hydrolyse|Kondensation|Cyclisierung|Hydrierung|Epoxidierung|Ringschluss|Ringöffnung|Verseifung|Eliminierung|Acylierung|Alkylierung|Veresterung|Dehydratisierung|Hydratisierung|Olefinierung|Decarboxylierung|Diazotierung|Hydrogenolyse|Mesylierung|Tautomerie|Diolspaltung|Riley[- ]?Oxidation|Baeyer[- ]?Villiger|Diels[- ]?Alder|Friedel[- ]?Crafts(?:[- ]?(?:Acylierung|Alkylierung))?|Wolff[- ]?Kishner|Eschweiler[- ]?Clarke|Sandmeyer|sigmatrop|konrotatorisch|disrotatorisch|Beckmann|Fischer|Lindlar|Hofmann|Williamson|Aminolyse|Markownikow|α[- ]?Oxidation|Debenzylierung|Demethylierung|elektrocycl\.?(?:\s*Ring(?:öffnung|schluss)?)?)\.?$/i,
  // trailing " (4π, kon)" or " (4π)"
  /\s*\(\d+[πpgs]?(?:,\s*(?:kon|dis|sup|s?\/s?|antara|supra)?)?\)$/i,
  // trailing parenthetical reaction-name like "(Wolff-Kishner)"
  /\s*\((?:Wolff[- ]?Kishner|Lindlar|Beckmann|Fischer|Robinson|Mannich|Knoevenagel|Reformatsky|Henry|Michael|Wittig|HWE|Aldol|Claisen|Diels[- ]?Alder|Baeyer[- ]?Villiger|Riley|Periodat|Iodolacton(?:isierung)?|sup\/sup|kon|dis)\)$/i
];

function isReactionName(s) {
  const t = String(s||'').trim();
  if (!t) return false;
  return REACTION_NAMES.some(re => re.test(t));
}

function stripTrailingMechAnnotation(s) {
  let cur = String(s||'').trim();
  // Apply every trailing-annotation rule iteratively until idempotent
  for (let i = 0; i < 6; i++) {
    let nextCur = cur;
    for (const re of MECH_TRAILING_RES) {
      nextCur = nextCur.replace(re, '').trim();
    }
    if (nextCur === cur) break;
    cur = nextCur;
  }
  return cur;
}

// Explicit overrides — labels we know we want gone or rewritten that
// the regex layer doesn't quite catch.
const LITERAL_DROPS = new Set([
  'SE', 'SN', 'SE (1)', 'sel. prim.', 'a', 'b', 'allylische α', 'α',
  'Wittig', 'Aminolyse', 'Beckmann', 'Markownikow', 'Eliminierung',
  'Baeyer-Villiger', 'Amid-Kupplung', 'Propargylalkohol', '(E)-Methyl-Vinyl',
  'NaHCO_3', 'DMSO', 'Ester', 'Verseifung + Tautomerie',
  '[2+2] intramolekular (43 %)', '[4+2] suprafacial/suprafacial',
  '1,5-H-Shift', '4π konrotatorisch', '4π disrotatorisch',
  'EtOH — Michael', 'DMF — intramol. S_N2', 'DMF — intramol. SN2',
  'Aldol-Kondensation (–H_2O)', 'Aldol-Kondensation (-H_2O)',
  'Reduktion C=O → CHOH', 'Reduktive Methylierung', 'Hydrolyse Schutzgruppe',
  'para-Nitrierung (S_E)', 'O-Methylierung', 'intramol. Acylsubstitution',
  'MeCN — Cbz-Entfernung', '2. NaIO_4 (-CH_2O)', '3× Mannich',
  'Arbuzov (-BnBr)', 'CH_2Cl_2 (Williamson)', '2. HCl (HWE-Wittig)',
  '1. Initiation (A_N)', '2. Propagation; 3. H_3O^+',
  'intramol. [3+2]', 'intramolekulare [4+2]', 'intramolekulare Aldolkondensation',
  '2. H^+ (SN, 2)', 'S_N2 am N', '-CO_2 (Lyase)',
  'CH_2=CH-OEt', '2. H_2C=O (doppelte Henry)', 'sel. prim.',
  'Wittig (83 %)', '40 %', 'Wolff-Kishner (b)',
  'Toluol, tiefe T', 'Ether/THF', '2. wässrige Aufarbeitung',
  'Vollständige Hydrolyse', 'C → D → E → F → G → H',
  'E2 (–MsOH)', '2. NaCN (S_N2)', 'intramol. S_N2',
  'NO_2 → NH_2', 'CH_3 → COOH', 'D abgespalten'
]);

function cleanLabel(s) {
  if (!s) return s;
  const orig = String(s).trim();
  if (!orig) return '';
  if (LITERAL_DROPS.has(orig)) return '';
  // Whole-string reaction name → drop entirely
  if (isReactionName(orig)) return '';
  // Otherwise, strip any trailing "— S_N2" / ", Aldol" / "(Rxn N)" etc.
  let trimmed = stripTrailingMechAnnotation(orig);
  if (!trimmed) return '';
  // After trimming, re-check the literal drop list and whole-string match
  if (LITERAL_DROPS.has(trimmed)) return '';
  if (isReactionName(trimmed)) return '';
  return trimmed;
}

let stripped = { names: 0, reagentBelow: 0, reagentAbove: 0, reagentBelowTrimmed: 0, reagentAboveTrimmed: 0 };

function processScheme(scheme) {
  if (!scheme) return;
  for (const n of (scheme.nodes || [])) {
    if (n.name != null) { delete n.name; stripped.names++; }
  }
  for (const e of (scheme.edges || [])) {
    if (e.reagent_above != null) {
      const cleaned = cleanLabel(e.reagent_above);
      if (cleaned === '') { delete e.reagent_above; stripped.reagentAbove++; }
      else if (cleaned !== e.reagent_above) { e.reagent_above = cleaned; stripped.reagentAboveTrimmed++; }
    }
    if (e.reagent_below != null) {
      const cleaned = cleanLabel(e.reagent_below);
      if (cleaned === '') { delete e.reagent_below; stripped.reagentBelow++; }
      else if (cleaned !== e.reagent_below) { e.reagent_below = cleaned; stripped.reagentBelowTrimmed++; }
    }
  }
}

for (const q of data) {
  const sections = Array.isArray(q.sections) ? q.sections : [q];
  for (const s of sections) processScheme(s.scheme);
}

fs.writeFileSync(QFILE, JSON.stringify(data, null, 2) + '\n');
console.log('Sanitization complete:');
console.log('  node.name removed:        ', stripped.names);
console.log('  reagent_above removed:    ', stripped.reagentAbove);
console.log('  reagent_above trimmed:    ', stripped.reagentAboveTrimmed);
console.log('  reagent_below removed:    ', stripped.reagentBelow);
console.log('  reagent_below trimmed:    ', stripped.reagentBelowTrimmed);
