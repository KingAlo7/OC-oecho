/* Source audit, final part — task texts.
   Every intro, body, hint, question title, prompt and choice was compared
   with the Angabe. Anything the sheet does not say (and that helps with
   an answer) is removed; anything the sheet says that was missing is
   added. Runs last (file name sorts after part1–part11). */
const { Q, patch } = require('./source-audit-2026');

const sec = (q, re) => {
  const s = q.sections.find(x => re.test(x.title || ''));
  if (!s) throw new Error(q.id + ': no section ' + re);
  return s;
};
const drop = (q, re) => {
  const n = q.sections.length;
  q.sections = q.sections.filter(x => !re.test(x.title || ''));
  if (q.sections.length === n) throw new Error(q.id + ': nothing to drop for ' + re);
};
const edge = (s, from, to) => {
  const e = s.scheme.edges.find(x => x.from.join('+') === from && x.to === to);
  if (!e) throw new Error('no edge ' + from + '>' + to);
  return e;
};
const node = (s, id) => {
  const n = s.scheme.nodes.find(x => x.id === id);
  if (!n) throw new Error('no node ' + id);
  return n;
};
/* Replace the choices of a multiple-choice section, keeping the old
   explanation; `correct` lists the labels that are right. */
const choices = (s, labels, correct) => {
  s.choices = labels.map((label, i) => {
    const c = { id: String.fromCharCode(97 + i), label };
    if (correct.includes(label)) c.correct = true;
    return c;
  });
};

/* ── BW 39 ─────────────────────────────────────────────────────────── */
patch('texts bw39', () => {
  const q = Q('bw39-2013-grandisol');
  q.intro = 'Ebenso zur Substanzklasse der Terpene gehört das Grandisol, ein Cyclobutanderivat, an dem einige Strategien zur Synthese des Cyclobutan-Systems studiert wurden. (+)-Grandisol ist das Sexualpheromon des männlichen Baumwollkapselkäfers. Dieser Käfer verursacht jährlich große Schäden z. B. an der amerikanischen Baumwollernte.';
  sec(q, /^Route 2/).title = 'Route 2: eine andere Strategie';
  const s = sec(q, /Stereochemischer Ausgang/);
  s.title = 'Stereochemischer Ausgang von Route 1 (5.11)';
  s.prompt = 'Welche Behauptung(en) treffen auf das Produkt von Route 1 zu? Es entsteht reines (+)-Grandisol / optisch inaktives Material / ein Racemat / ein Diastereomerengemisch. Begründen Sie.';
});

/* ── BW 42 ─────────────────────────────────────────────────────────── */
const BW42_INTRO = 'Die österreichische Sandoz GmbH mit ihrem Werk in Tirol ist der größte Hersteller von Antibiotika und der einzige bedeutende Produzent von Penicillin in der westlichen Welt. Die Firma deckt etwa zwei Drittel der weltweiten Produktion an Penicillin V ab, dem säurestabilen Penicillin, das 1951 von zwei Kundler Wissenschaftlern entdeckt worden ist. Dieses Penicillin V sowie drei weitere Antibiotika geben in dieser Aufgabe einen kleinen Einblick in Synthesewege der organischen Chemie.';

patch('texts bw42', () => {
  let q = Q('bw42-2016-prontosil');
  q.intro = BW42_INTRO;
  q.name = 'Prontosil — BW 2016';
  let s = sec(q, /Benzol als Kupplungspartner/);
  s.title = 'Benzen statt Benzen-1,3-diamin (1.2)';
  s.prompt = 'Warum funktioniert Schritt E → F nicht, wenn anstelle von Benzen-1,3-diamin Benzen verwendet wird?';
  s = sec(q, /Stereoisomerie/);
  s.title = 'Stereoisomerie von F (1.3)';
  s.prompt = 'Welche Art der Stereoisomerie kann bei F auftreten?';

  q = Q('bw42-2016-chloramphenicol');
  q.intro = BW42_INTRO;
  sec(q, /A → B/).prompt = 'Nach welchem Reaktionsmechanismus läuft die Reaktion A → B ab?';
  sec(q, /D → E/).prompt = 'Nach welchem Reaktionsmechanismus läuft die Reaktion D → E ab?';

  q = Q('bw42-2016-trimethoprim');
  q.intro = BW42_INTRO;
  q.name = 'Trimethoprim — BW 2016';
  s = sec(q, /Guanidin/);
  s.title = 'Basizität von Guanidin (1.8)';
  s.prompt = 'Guanidin (Reagenz der letzten Reaktion) ist überraschend basisch (pK_B = 0,35). Welcher Effekt ist dafür im protonierten Guanidin verantwortlich? Zeigen Sie das mit mindestens zwei Strukturen.';

  q = Q('bw42-2016-penicillin-v');
  q.intro = BW42_INTRO;
  q.name = 'Penicillin V — BW 2016';
  s = sec(q, /Funktionelle Gruppe/);
  s.title = 'Funktionelle Gruppe (1.11)';
  s.prompt = 'Schreiben Sie den Namen der in der Reaktion A → B gebildeten speziellen funktionellen Gruppe auf.';
  s = sec(q, /Carbodiimid/);
  s.title = 'Mechanismus A → B (1.10)';
  s.prompt = 'Formulieren Sie den Mechanismus der Reaktion von A nach B (nur die beteiligten Molekülteile, Rest = R).';
});

/* ── BW 43 ─────────────────────────────────────────────────────────── */
const BW43_INTRO = 'In dieser Aufgabe geht es um Tropan-Alkaloide, Derivate des Tropans, einem bicyclischen Amin mit dem IUPAC-Namen 8-Methyl-8-aza-bicyclo[3.2.1]octan. Diese Tropan-Alkaloide werden von Pflanzen, vor allem Nachtschattengewächsen, zum Schutz vor Fressfeinden gebildet. Tropan-Derivate haben auch pharmazeutische Bedeutung erlangt. Daher beschäftigt sich die Wissenschaft schon seit rund 100 Jahren mit verschiedenen Synthesen dieser Alkaloide.';

patch('texts bw43', () => {
  let q = Q('bw43-2017-atropin');
  q.intro = BW43_INTRO + ' Im ersten Aufgabenteil wird die Synthese von Atropin, dem Gift der Tollkirsche, behandelt.';
  q.name = 'Atropin — BW 2017';
  let s = sec(q, /^Weg 1/);
  s.title = 'Weg 1: über C und D';
  s.hints = ['Substanz E trägt den Namen Ethyl-2-Brom-2-phenylethanoat.', 'A und B sind Stereoisomere.'];
  sec(q, /^Veresterung/).title = 'H + A oder B → I';
  s = sec(q, /Mechanismus F → G/);
  s.title = 'Reaktionstyp F → G (1.2)';
  s.prompt = 'Welcher Reaktionstyp liegt der Reaktion von F zu G zugrunde?';
  s = sec(q, /Bildung von C/);
  s.prompt = 'Welcher Reaktionstyp liegt der Bildung von C zugrunde? (möglichst detailliert)';
  s = sec(q, /A vs B/);
  s.title = 'Stereochemisches Verhältnis von A und B (1.3)';
  s.prompt = 'Geben Sie an, in welchem stereochemischen Verhältnis A und B zueinander stehen.';
  s = sec(q, /^Molekül X/);
  s.title = 'Molekül X (1.1)';
  s.prompt = 'Schreiben Sie die chemische Formel von X auf.';

  q = Q('bw43-2017-ferruginin');
  q.intro = BW43_INTRO + ' Im zweiten Teil geht es um Ferruginin, einen Agonisten nikotinischer Acetylcholinrezeptoren.';
  s = sec(q, /Synthese von Ferruginin/);
  delete s.body;
  s = sec(q, /Baeyer-Villiger/);
  s.title = 'Reaktion A → B';
  s.prompt = 'Was wird bei der Reaktion A → B mit m-CPBA zwischen Carbonyl-C und α-C eingeschoben?';
  // Explains that H/I are the carbonyl cleavage products — not asked on the sheet.
  drop(q, /OsO_4 \+ NaIO_4/);
});

/* ── BW 44 ─────────────────────────────────────────────────────────── */
patch('texts bw44', () => {
  let q = Q('bw44-2018-kaffeesaeure');
  let s = sec(q, /P\(OBn\)_3/);
  s.prompt = 'Nach welchem Reaktionsmechanismus verläuft die Reaktion von P(OBn)_3 + Z nach C (im 1. Schritt)?';
  s = sec(q, /Bildung von D aus A/);
  s.prompt = 'Begründen Sie, warum der Schritt A → D im Reaktionsschema notwendig ist.';
  choices(s, [
    'Damit die Phenol-Gruppen nicht oxidiert werden',
    'Damit die Phenol-Gruppen im Schritt H → I nicht mit dem Säurechlorid reagieren',
    'Um die Wasserlöslichkeit zu erhöhen',
    'Damit die Reaktion D → E stereoselektiv wird'
  ], ['Damit die Phenol-Gruppen nicht oxidiert werden', 'Damit die Phenol-Gruppen im Schritt H → I nicht mit dem Säurechlorid reagieren']);
  s = sec(q, /Isomerisierung F/);
  s.prompt = 'Formulieren Sie einen Mechanismus für die Isomerisierung von F nach F´ und schlagen Sie Reaktionsbedingungen vor.';

  q = Q('bw44-2018-colchicin');
  s = sec(q, /Ringschluss H → I/);
  s.prompt = 'Welche Namensreaktion liegt dem Schritt von H nach I (Cyclisierungsschritt) zugrunde?';
  drop(q, /Disproportionierung/);
});

/* ── BW 45 ─────────────────────────────────────────────────────────── */
patch('texts bw45', () => {
  let q = Q('bw45-2019-abscisinsaeure');
  q.intro = 'Phytohormone sind pflanzeneigene organische Verbindungen, die als primäre Botenstoffe Wachstum und Entwicklung der Pflanzen steuern und koordinieren. Abscisinsäure ist ein Phytohormon mit hemmender Wirkung. International gebräuchlich ist die Abkürzung ABA vom Englischen abscisic acid. Chemisch zählt sie zu den monocyclischen Sesquiterpenen. Diesen liegen drei Isopreneinheiten zugrunde. Mit mehr als 3000 Vertretern stellen die Sesquiterpene die größte Untergruppe der Terpene dar. Im Gegensatz zu vielen anderen Phytohormonen handelt es sich bei Abscisinsäure um einen Einzelstoff und nicht um eine Stoffgruppe. Ausgangssubstanzen der Synthese sind 4-Methylpent-3-en-2-on (Verbindung B) und Verbindung A, deren Struktur aus dem ^1H- und ^{13}C-NMR-Spektrum ermittelt werden kann.';
  let s = sec(q, /^A\.1/);
  s.hints = s.hints.filter(h => !/^Abkürzungen/.test(h));
  s = sec(q, /Ketal-Schutzgruppe/);
  s.title = 'Schutzgruppe E → F (2.6)';
  s.prompt = 'Von E nach F wird eine weitverbreitete Schutzgruppe eingeführt. Welche konkrete Reaktion verhindert diese Schutzgruppe im folgenden Reaktionsverlauf?';
  s = sec(q, /IR-Verschiebung/);
  s.title = 'IR-Daten von E, E´ und E´´ (2.9, 2.10)';
  s.prompt = 'Für E und zwei seiner Isomere (E´ und E´´) sind IR-Banden für C–O–C- und C=O-Valenzschwingungen gegeben: 1050–1250, 1680, 1715 und 1730 cm^{-1}. Ordnen Sie den verursachenden Gruppen die Wellenzahlen zu und erklären Sie, auf welchen Effekten die unterschiedlichen Absorptionen im Bereich von 1700 cm^{-1} beruhen.';
  s = sec(q, /^Stereodeskriptoren von ABA$/);
  s.title = 'Anzahl der Stereoisomere (2.15)';
  s.prompt = 'Wie viele stereoisomere Moleküle mit der Konstitution von Abscisinsäure gibt es?';

  q = Q('bw45-2019-twistan');
  q.intro = 'Twistan gehört zu den polycyclischen Verbindungen, einer Verbindungsklasse, bei der die Kohlenstoffatome in mehreren Ringen angeordnet sind. Der wunderschön verdrillte Kohlenwasserstoff Twistan heißt systematisch Tricyclo[4.4.0.0^{3,8}]decan. Die Teilschritte der Synthese sind in der folgenden Abbildung dargestellt.';
  s = sec(q, /Funktion von NaH/);
  s.prompt = 'Welche Funktion hat NaH im Schritt H → I?';
  choices(s, ['Oxidationsmittel', 'Reduktionsmittel', 'Säure', 'Base', 'Schutzgruppe', 'Katalysator'], ['Base']);
  s.explanation = 'NaH deprotoniert das α-C-Atom zum Keton; das Enolat verdrängt intramolekular die Mesylat-Abgangsgruppe.';
  s = sec(q, /Erster Schritt der Reaktion b/);
  s.prompt = 'Welcher Mechanismus liegt dem ersten Schritt der Namensreaktion von I nach Twistan (Reagenz b) zugrunde?';
  choices(s, ['A_N', 'S_N2', 'Elektrocyclische Reaktion', 'Radikalische Addition'], ['A_N']);
  s.explanation = 'Wolff-Kishner-Reduktion: Hydrazin addiert zuerst nukleophil (A_N) an den Carbonyl-C; unter Wasserabspaltung entsteht das Hydrazon.';
});

/* ── BW 46 ─────────────────────────────────────────────────────────── */
patch('texts bw46', () => {
  let q = Q('bw46-2020-conicein');
  let s = sec(q, /Mesyl/);
  s.prompt = 'Nennen Sie den Grund, warum die Mesylgruppe in die Struktur von A eingeführt wurde.';
  choices(s, [
    'Damit die OH-Gruppe nicht mit dem Säurechlorid verestern kann',
    'Um die Wasserlöslichkeit zu erhöhen',
    'Damit bei der späteren Eliminierung eine bessere Abgangsgruppe als OH^- vorliegt',
    'Um die Stereochemie umzukehren'
  ], ['Damit die OH-Gruppe nicht mit dem Säurechlorid verestern kann', 'Damit bei der späteren Eliminierung eine bessere Abgangsgruppe als OH^- vorliegt']);
  s = sec(q, /Pericyclische Schlüssel/);
  s.title = 'Reaktionstyp E → F (5.3)';
  s.prompt = 'Benennen Sie den Reaktionstyp der Bildung von F aus E möglichst detailliert. Wie heißt diese Namensreaktion?';

  q = Q('bw46-2020-bergamoten');
  s = sec(q, /Lösungsmittel/);
  s.title = 'Lösungsmittel für Reaktion 2 (5.9)';
  s.prompt = 'Schlagen Sie ein geeignetes und ein nicht geeignetes Lösungsmittel für Reaktion 2 vor.';

  q = Q('bw46-2020-aspidospermin');
  drop(q, /Stork-Enamin/);
  drop(q, /Robinson-Annelierung \(Schritt/);
  s = sec(q, /Bildung von K aus J/);
  s.prompt = 'Benennen Sie den Mechanismus, nach dem die Bildung von K aus J erfolgt.';

  q = Q('bw46-2020-prostaglandin-fragment');
  q.intro = 'Prostaglandine sind Derivate des Eicosans und wirken im tierischen und menschlichen Organismus als Gewebshormone. Sie spielen etwa bei einer Entzündungsreaktion, einer Form der unspezifischen Immunabwehr, eine bedeutsame Rolle. In dieser Aufgabe geht es um die Synthese eines speziellen Prostaglandin-Fragments (Corey, E. J.; Ensley, H. E. J. Am. Chem. Soc. 1975, 97, 6908).';
  sec(q, /Prostaglandin-Fragments/).body = 'C wird in mehreren Stufen zum Prostaglandin weiter umgesetzt.';
  s = sec(q, /NaHCO_3/);
  s.prompt = 'Nennen Sie die Funktion von NaHCO_3 in der Reaktion, die zur Bildung von C führt.';
  choices(s, ['Base', 'Reduktionsmittel', 'Oxidationsmittel', 'Lösungsmittel'], ['Base']);
  s.explanation = 'NaHCO_3 deprotoniert die Carbonsäure; das Carboxylat öffnet als Nukleophil das cyclische Iodonium-Ion (Iodlactonisierung).';

  q = Q('bw46-2020-pericyclic-da');
  q.name = 'Zum organischen Abschluss wird es rein pericyclisch — BW 2020';
  sec(q, /^5\.18/).title = '5.18';
  sec(q, /^5\.19/).title = '5.19';
  // The prompt stated the answer (thermal = conrotatory, light = disrotatory).
  drop(q, /kon- vs\. dis-rotatorisch/);
});

/* ── BW 47 ─────────────────────────────────────────────────────────── */
patch('texts bw47', () => {
  let q = Q('bw47-2021-thymol');
  let s = sec(q, /AlCl_3/);
  s.title = 'Funktion von AlCl_3 (2.3)';
  s.prompt = 'Nennen Sie den Grund, warum Aluminiumchlorid für die Reaktion 3 als Katalysator verwendet wird.';

  q = Q('bw47-2021-capsaicin');
  s = sec(q, /Reagenz d/);
  s.title = 'Reagenzien d (2.5)';
  s.prompt = 'Schreiben Sie die beiden Reagenzien für d auf.';

  q = Q('bw47-2021-carvon');
  s = sec(q, /Acideste H/);
  s.title = 'Acideste H-Atome in H (2.9)';
  s.prompt = 'Kennzeichnen Sie in der Struktur von H die acidesten H-Atome.';

  q = Q('bw47-2021-coffein');
  s = q.sections[0];
  s.title = 'D. Synthese von Kaffee';
  s.hints = ['A enthält 6 C-Atome.', 'Bei der Umwandlung von D nach E entsteht ein weiterer Heterocyclus, es findet ein Ringschluss statt.'];
  sec(q, /^Mechanismen$/).title = 'Mechanismen (2.11)';

  q = Q('bw47-2021-yuehchukene');
  delete q.intro;
  q.sections[0].hints = ['Die Cyclisierung verläuft thermisch und daher konrotatorisch.'];
});

/* ── BW 48 ─────────────────────────────────────────────────────────── */
patch('texts bw48', () => {
  let q = Q('bw48-2022-butanon-reaktionen');
  q.intro = 'Organische Chemie bei den alten Römern.';
  q.name = 'Einige Reaktionen aus der organischen Chemie — BW 2022';
  let s = sec(q, /Oxim/);
  s.title = 'Mechanismus von Reaktion 1 (2.3)';
  s.prompt = 'Welcher Reaktionsmechanismus liegt Reaktion 1 zugrunde?';

  q = Q('stork-cantharidin-1951');
  q.intro = 'Cantharidin ist ein Terpenoid, das Käfer je nach Spezies als Wehrsekret oder Sexuallockpheromon absondern. Heute weiß man, dass es ein starkes Gift ist, auch wenn ihm eine Wirkung als Aphrodisiakum nachgesagt wird. Dies soll Kriegsberichten zufolge schon Napoleons Truppen in Ägypten zum Verhängnis geworden sein. In diesem Beispiel wird die von Stork 1951 veröffentlichte Synthese von Cantharidin genauer betrachtet (Stork, G.; van Tamelen, E. E.; Friedman, L. J.; Burgstahler, A. W. J. Am. Chem. Soc. 1951, 73, 4501).';

  q = Q('bw48-2022-self-splicing-thioester');
  q.name = 'Self-Splicing bei Proteinen — BW 2022';
  q.intro = 'Protein „self-splicing" wurde 1990 erstmalig entdeckt. Dabei werden Thioester-Intermediate A gebildet. Es wird heutzutage auch in der Peptidsynthese verwendet.';
  s = q.sections[0];
  s.title = 'Bildung des Thioester-Intermediats A (2.13)';
  s.prompt = 'Schreiben Sie die Struktur von A auf und deuten Sie den Verlauf des Mechanismus an.';
  s.mech_steps[0].prompt = 'Edukt';
  s.mech_steps[1].prompt = 'Zwischenstufe';
  s.mech_steps[2].prompt = 'Produkt A';

  q = Q('bw48-2022-lysergsaeure-myers-allen');
  q.name = 'Lysergsäure — Synthese des Allens G (BW 2022)';
  s = sec(q, /chiralen Allens/);
  s.hints = ['X = Halogen; TsOH = Me-Ph-SO_3H; DEAD = Diethylazodicarboxylat (EtOCO)_2N_2.'];
  // The sheet draws "X" — which halogen it is, is question 4.6.
  const e = node(s, 'Ee');
  e.alias = { 0: 'X' };
  delete e.mol;
});

/* ── BW 49 ─────────────────────────────────────────────────────────── */
patch('texts bw49', () => {
  let q = Q('bw49-2023-ibuprofen');
  let s = sec(q, /Mechanismus A → B/);
  s.title = 'Mechanismus A → B (7.4)';
  s.prompt = 'Schreiben Sie einen detaillierten Reaktionsmechanismus für die Reaktion A → B auf.';
  sec(q, /Wirksames Enantiomer/).prompt = 'Ibuprofen wird als Racemat eingesetzt. Pharmakologisch wirksam ist nur das S-Isomer. Das R-Isomer wird allerdings im Körper durch eine Isomerase in die wirksame Form umgewandelt. Zeichnen Sie die Konfiguration der pharmakologisch wirksamen Form.';

  q = Q('bw49-2023-hirsuten');
  sec(q, /^Weg 1/).body = 'Die hier gezeigte Synthese startet mit einer Di-Oxo-Verbindung.';
  sec(q, /^Weg 2/).title = 'Weg 2';
  s = sec(q, /Radikalkaskade/);
  s.title = 'Mechanismus zu Hirsuten';
  s.prompt = 'Skizzieren Sie den Mechanismus der Umwandlung der gegebenen Iodverbindung mit Bu_3SnH/AIBN in Hirsuten.';

  // No sheet behind this one (Ergänzungsaufgabe): at least don't hand out the answer.
  q = Q('bw49-2023-methylorange');
  q.intro = 'Methylorange ist ein Azofarbstoff.';
  sec(q, /Reaktionstyp/).prompt = 'Welcher Reaktionstyp liegt der Bildung von Methylorange aus D und B zugrunde?';
});

/* ── BW 50 ─────────────────────────────────────────────────────────── */
patch('texts bw50', () => {
  let q = Q('bw50-2024-merrilacton');
  q.intro = 'Von natürlichen Wirkstoffen gegen neurodegenerative Erkrankungen: Merrilacton.';
  const s0 = sec(q, /Merrilacton/);
  // As printed on the sheet (the drawn structures come to one O more).
  const note = f => 'Die Angabe nennt ' + f + '; aus der Struktur ergibt sich ein O-Atom mehr.';
  for (const [id, f] of [['B', 'C_17H_30O_4Si'], ['B2', 'C_17H_30O_4Si'], ['C', 'C_19H_32O_6Si'], ['C2', 'C_19H_32O_6Si']]) {
    const n = node(s0, id);
    n.caption = f;
    n.note = note(f);
  }

  q = Q('bw50-2024-vitamin-e');
  q.intro = 'Vitamin E — auch gegen neurodegenerative Erkrankungen.';
  let s = sec(q, /Tosylat/);
  s.title = 'Tosylat (2.8)';
  s.prompt = 'Im Edukt liegt die Alkoholgruppe als Tosylat verestert vor. Welche Aussagen treffen zu?';
  s.choices.forEach(c => { c.label = c.label.replace(' (Nukleophil)', ''); });

  q = Q('bw50-2024-tyr-asp-dipeptid');
  s = sec(q, /Mechanismus B → C/);
  s.title = 'Mechanismus B → C (2.13)';
  s.prompt = 'Benennen Sie den Mechanismus der Reaktion von B nach C.';
  sec(q, /Funktion von DCC/).title = 'Funktion von DCC (2.11)';

  // One box per alkene: how many products there are is part of 2.1.
  q = Q('bw50-2024-warmup-bromierung');
  s = sec(q, /Bromierung von A, B und C/);
  for (const [keep, gone] of [['PB1', 'PB2'], ['PC1', 'PC2']]) {
    const a = node(s, keep), b = node(s, gone);
    a.smiles = a.smiles + '.' + b.smiles;
    if (b.explanation) a.explanation = [a.explanation, b.explanation].filter(Boolean).join(' ');
    delete a.mol;
    s.scheme.nodes = s.scheme.nodes.filter(n => n !== b);
    s.scheme.edges = s.scheme.edges.filter(e => e.to !== gone);
  }
});

/* ── BW 51 ─────────────────────────────────────────────────────────── */
patch('texts bw51', () => {
  let q = Q('bw51-2025-phenylketonurie');
  q.intro = 'Phenylketonurie (PKU) ist eine erbliche Stoffwechselstörung, die die Verarbeitung der Aminosäure Phenylalanin A beeinträchtigt. Ohne Behandlung akkumuliert diese im Körper und kann schwere neurologische Schäden verursachen. Durch frühes Screening und eine gezielte Diät lässt sich die Erkrankung jedoch effektiv kontrollieren, sodass Betroffene ein weitgehend normales Leben führen können. Hier einige Stoffwechselpfade.';

  q = Q('bw51-2025-sapropterin');
  q.intro = 'Sapropterin ist ein synthetisches Analogon von Tetrahydrobiopterin, einem wichtigen Co-Faktor für Enzyme, die Phenylalanin abbauen. Es wird zur Behandlung bestimmter Formen der Phenylketonurie (PKU) eingesetzt, bei denen eine Restaktivität der Phenylalaninhydroxylase vorhanden ist. Durch die Einnahme können der Phenylalaninspiegel im Blut gesenkt und die Diätanforderungen für PKU-Patienten möglicherweise erleichtert werden.';

  q = Q('bw51-2025-fettsaeure-biosynthese');
  let s = sec(q, /Glg\. 1 und 2/);
  s.body = 'Glg. 1: Hydrogencarbonat + ATP → A + B. Glg. 2: Biotin-Enzym + A → C + D; C + D + Acetyl-CoA → Malonyl-CoA + E.';
  edge(s, 'HC', 'A').reagent_below = '+ B';
  edge(s, 'C', 'M').reagent_below = '+ E';
  s = sec(q, /Verlängerungscyclus/);
  s.body = 'Die Kreise ○ stehen für die jeweils nötigen Enzyme (Abkürzungen oben), „± Y" für die Nebenprodukte.';
  delete s.hints;
  s = sec(q, /Funktionelle Gruppen im FS-Schema/);
  s.title = 'Markierte funktionelle Gruppen (5.3)';
  s.prompt = 'Benennen Sie die beiden funktionellen Gruppen, welche im FS-Schema mit einem * gekennzeichnet sind.';
  s.choices.forEach(c => {
    if (c.correct) c.label = 'Thiol (-SH) und Thioester (R-CO-S-R′)';
  });
});

/* ── BW 52 ─────────────────────────────────────────────────────────── */
patch('texts bw52', () => {
  let q = Q('bw52-2026-xylit');
  q.intro = 'Monosaccharide spielen im Stoffwechsel eine bedeutsame Rolle, ob in der Photosynthese (eigentlich die beste „Carbon Capture-Reaktion"), in der Glycolyse, bei der Gluconeogenese oder bei der Speicherung als osmotisch inaktives Glykogen, womit die Leber den Blutzucker regulieren kann. Pflanzen (und auch die süßen Meerschweinchen) nutzen Teile des vorliegenden Stoffwechselweges für die Ascorbinsäure-Biosynthese oder zur Produktion von Xylit.';

  q = Q('bw52-2026-adrenosteron');
  q.intro = 'Totalsynthese von (+)-Adrenosteron. (Info: Adrenosteron isch so ein Hormonzeugsl.)';
  sec(q, /Aussagen zu/).prompt = 'Richtig oder falsch? (a) Das + in „(+)-Adrenosteron" steht für die Konfiguration R. (b) Dieses „+" kann mit einem Polarimeter bestimmt werden. (c) (+)- und (−)-Adrenosteron sind Diastereomere. (d) Eine äquimolare Mischung von (+)- und (−)-Adrenosteron ist ein Racemat. (e) (+)- und (−)-Adrenosteron haben unterschiedliche Siedepunkte. (f) (+)- und (−)-Adrenosteron haben als Steroidhormone die gleiche Wirkung bei der Rückresorption von Wasser aus dem Primärharn. (g) (+) bedeutet eine positive Wirkung auf den menschlichen Körper.';
});

/* ── LW ────────────────────────────────────────────────────────────── */
patch('texts lw', () => {
  let q = Q('lw43-2017-papaverin');
  q.intro = 'Papaverin ist ein Alkaloid des Isochinolin-Typs und besitzt eine direkte krampflösende Wirkung auf die glatte Muskulatur. Es wird z. B. in der Herzchirurgie angewendet. Papaverin ist u. a. im Milchsaft des Schlafmohns enthalten. Nachdem der Österreicher G. Goldschmiedt die Strukturaufklärung durchgeführt hatte, folgte 1908 die erste Totalsynthese durch Pictet und Gams. Wir wollen eine Synthese des Papaverins ausgehend von Vanillin betrachten.';

  q = Q('lw45-2019-phenylacetylen-routen');
  let s = sec(q, /^E\.1/);
  s.hints = ['Er bringt 100 g 1-Brom-2-phenylethen mit 150 g heißer KOH bei 200 °C zur Reaktion. Die entstehende gelbliche Flüssigkeit wird kontinuierlich abdestilliert. Nach Aufarbeitung erhält Justus 37,0 g der Verbindung X, welche laut Elementaranalyse 94,08 % C, aber kein Heteroatom enthält.'];
  s = sec(q, /^E\.3 Als der Ausgangsstoff/);
  s.body = 'Justus möchte die erste Synthese (Teil E.1) optimieren, besitzt aber kein Ausgangsmaterial mehr. Er beschließt also, 1-Brom-2-phenylethen selbst zu synthetisieren, auch weil die Verbindung sehr angenehm nach Hyazinthen riecht. Ausgangsmaterial für seine Synthese ist die Zimtsäure (3-Phenylpropensäure).';
  s.hints = ['Justus stellt fest, dass sein Produkt K ein Gemisch ist. Käufliche Zimtsäure ist (E)-3-Phenylpropensäure (trans-3-Phenylpropensäure). Wird diese mit Br_2 umgesetzt, sind theoretisch 4 Additionsprodukte möglich.'];
  s = sec(q, /Mechanismus Benzol/);
  s.title = 'Mechanismen Benzen → D und Styren → G (f)';
  s.prompt = 'Nach welchen Mechanismen verlaufen die Reaktionen Benzen → D und Styren → G?';

  q = Q('lw48-2022-elemicin');
  q.intro = 'In dieser Aufgabe geht es um Terpene und Phenylpropanoide. Terpene sind aus Isopreneinheiten (Isopren = 2-Methylbuta-1,3-dien) aufgebaut. Sie können in acyclische und cyclische (mit unterschiedlich vielen Ringen) Terpene eingeteilt werden. Manche Terpene sind Kohlenwasserstoffe, andere sind funktionalisiert. Phenylpropanoide sind Verbindungen, die sich vom Phenylpropan (IUPAC: Propylbenzen) ableiten.';

  q = Q('lw49-2023-tazaroten');
  q.intro = 'Gegen Schuppenflechte oder Akne kann Tazaroten (Handelsnamen Zorac® oder Tazorac®) als Creme verschrieben werden. Die Creme enthält üblicherweise 0,05 % (m/m) Tazaroten, der inaktiven Vorstufe des Wirkstoffes. In dieser Aufgabe geht es um die Synthese von Tazaroten ausgehend von 2-Chlor-5-methylpyridin. Im Reaktionsschema sind nicht alle Nebenprodukte (z. B. H_2O, HCl) angegeben.';
  sec(q, /^Tazaroten$/).body = 'Abschließend bildet I mit Butyl-Lithium das Anion J^-, welches in einer palladiumkatalysierten Reaktion mit B zum Zielprodukt reagiert.';
  s = sec(q, /Mechanismus F → G/);
  s.title = 'Mechanismus F → G (c)';
  s.prompt = 'Geben Sie den Reaktionsmechanismus der Reaktion F → G an.';

  q = Q('lw50-2024-rohypnol');
  q.intro = 'K.-o.-Tropfen — Nomenklatur, Isomerie & organische Synthese. Als K.-o.-Tropfen werden sedierend wirkende Substanzen bezeichnet, die, in Getränke oder Drogen gemischt, Menschen betäuben. Einige solcher Substanzen werden besser therapeutisch als Schlaf- oder Beruhigungsmittel benutzt. Das folgende Reaktionsschema zeigt die Synthese von Rohypnol.';
  s = sec(q, /Bildung von A/);
  s.prompt = 'Nach welchem Reaktionsmechanismus läuft die Bildung von A ab?';
  s = sec(q, /von I zu Rohypnol/);
  s.title = 'Von I zu Rohypnol (j)';
  s.prompt = 'Welche Reagenzien sind notwendig, um aus I Rohypnol zu synthetisieren?';

  q = Q('lw51-2025-sildenafil');
  q.intro = 'Der Arzneistoff Sildenafil (ursprünglich gegen Herzbeschwerden entwickelt, aber diesbezüglich wirkungslos) erlangte große Bekanntheit, als er 1998 von Pfizer (USA) unter „Viagra" als Abhilfe bei erektiler Dysfunktion auf den Markt kam. Tipp: Lassen Sie sich bei diesem Reaktionsschema nicht von den großen Strukturen abschrecken. Die Reaktionen sind Ihnen vermutlich wohlbekannt!';

  q = Q('lw52-2026-fentanyl-diphenhydramin');
  q.intro = 'Schon um 4000 v. Chr. nutzten Sumerer und Ägypter das aus Schlafmohn gewonnene Opium zu Rausch- und Betäubungszwecken. Im Lauf der Zeit wurden daraus „Opioide" entwickelt. Sie werden in der Medizin zur Behandlung starker und stärkster Schmerzen eingesetzt. Dazu zwei weitere Wirkstoffsynthesen: das Lokalanästhetikum Benzocain und das Antihistaminikum Diphenhydramin.';
  sec(q, /^F\./).body = 'Diphenhydramin C ist ein antihistaminischer Wirkstoff, der zur Behandlung von Allergien, Schlafstörungen und Übelkeit eingesetzt wird. Chemisch gehört es zur Gruppe der Ethanolamine und wirkt vor allem durch Blockade der Histamin-H-Rezeptoren im Körper. In diesem Beispiel werden zwei Synthesewege des Wirkstoffes beleuchtet.';
});

/* ── LW 42 (Phellandral) ───────────────────────────────────────────── */
/* The original LW 42 task, as reprinted in the Mariazell 2018 practice
   sheet (without its extra "Tipps"). LW 42 was 2016. */
patch('texts lw42 phellandral', () => {
  const q = Q('lw42-2015-phellandral');
  q.name = '(−)-Phellandral — LW 2016';
  q.source = 'ÖChO Landeswettbewerb 2016 (LW 42)';
  q.intro = '(−)-Phellandral ist ein Terpen des Eukalyptusöls. Es wird durch Tollens-Reagenz (ammoniakalische Silbernitratlösung) zur (−)-Phellandrensäure oxidiert, die unter Aufnahme von nur 1 mol Wasserstoff in Dihydrophellandrensäure übergeht. Um die Struktur von Phellandral zu bestimmen, wurde eine Totalsynthese durchgeführt.';
  const s = sec(q, /Synthese-Schema/);
  s.hints = [
    'Die Elementaranalyse von Phellandral liefert folgende Werte: 78,95 % C, 10,50 % H, der Rest ist Sauerstoff. Die Molmasse liegt unter 200 g/mol.',
    'Alle Strukturen sind monocyclisch.',
    'B ist das sterisch weniger gehinderte Produkt (das andere Konstitutionsisomere wird nicht weiter verwendet).',
    'C gibt mit Fe^{3+}-Ionen eine Farbreaktion.',
    'E reagiert mit 2,4-Dinitrophenylhydrazin.',
    'I heißt mit dem Trivialnamen Phellandrensäure.'
  ];
  const set = (from, to, a, b) => {
    const e = edge(s, from, to);
    if (a) e.reagent_above = a; else delete e.reagent_above;
    if (b) e.reagent_below = b; else delete e.reagent_below;
  };
  set('Bz', 'A', 'AlCl_3');
  set('A', 'B', 'H_2SO_4, SO_3');
  set('B', 'C', 'KOH', 'Schmelze');
  set('C', 'D', '3 Äqu. H_2/Ni');
  set('D', 'E', 'K_2Cr_2O_7/H_2SO_4');
  set('E', 'F', 'KCN, H^+');
  set('G', 'H', 'thermische Eliminierung', '- CH_3COOH');
  set('H', 'I', 'H_2SO_4, H_2O');
  set('I', 'J', 'SOCl_2');
  set('J', 'K', 'H_2/Pd/BaSO_4');
  for (const [id, cap] of [['B', 'C_9H_12O_3S'], ['C', 'C_9H_12O'], ['D', 'C_9H_16O'], ['F', 'C_10H_17NO'],
                           ['G', 'C_12H_19NO_2'], ['I', 'C_10H_16O_2'], ['J', 'C_10H_15ClO'], ['K', 'Phellandral']]) {
    node(s, id).caption = cap;
  }
  let t = sec(q, /Erster Stereoschritt/);
  t.title = 'Erstes chirales Zentrum (6)';
  t.prompt = 'In welchem Syntheseschritt tritt die Chiralität zum ersten Mal auf?';
  t = sec(q, /Diastereomere/);
  t.title = 'Hydrierung der Phellandrensäure (9)';
  t.prompt = 'Die katalytische Hydrierung von (−)-Phellandrensäure liefert ein Gemisch aus 2 optisch inaktiven Isomeren. In welchem stereochemischen Verhältnis stehen die beiden Isomeren?';
  t.choices.forEach(c => { c.label = c.label.replace(' (cis/trans-Isomere)', ''); });
});
