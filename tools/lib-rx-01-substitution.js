/* Reaction library — Nucleophile Substitution & Eliminierung.
   Loaded by build-reaction-library.js, which supplies R() and the
   fragment builders. */

module.exports = function (ctx) {
const { R, Mol, prim, tert, carbonyl, aryl, B, DX, DY } = ctx;

/* ══════════════════════════════════════════════════════════════════
 * 1 — Nucleophile Substitution
 * ══════════════════════════════════════════════════════════════════ */
const C_SN = 'Nucleophile Substitution';

R({
  id: 'sn2', category: C_SN, name: 'S_N2 — bimolekulare nucleophile Substitution',
  difficulty: 'A', reaktionstyp: 'S_N2', transformation: 'R–CH₂–X → R–CH₂–Nu',
  rx: (() => {
    const a = new Mol(); prim(a, 0, 0, 'R₁', null, 'X');
    const b = new Mol(); prim(b, 0, 0, 'R₁', null, 'Nu');
    return { reactants: [a], products: [b] };
  })(),
  above: 'Nu^-', below: 'aprotisch-polar',
  conditions: 'Starkes Nucleophil, aprotisch-polares Lösungsmittel (DMSO, DMF, Aceton); primäres oder methylisches C-Atom.',
  stereochemistry: 'Rückseitenangriff → Walden-Umkehr, vollständige Inversion am Stereozentrum.',
  substituents: 'R₁ = Alkyl (primär bevorzugt) · X = Cl, Br, I, OTs, OMs · Nu⁻ = OH⁻, RO⁻, CN⁻, N₃⁻, RS⁻, I⁻, R₂NH',
  key_points: [
    'Einstufig, konzertiert: Bindungsbruch und -bildung im selben Übergangszustand.',
    'v = k·[R–X]·[Nu⁻] — zweiter Ordnung, daher „bimolekular".',
    'Reaktivität CH₃ > primär > sekundär ≫ tertiär (sterische Hinderung des Rückseitenangriffs).',
    'Abgangsgruppengüte: I⁻ > Br⁻ > Cl⁻ ≫ F⁻; OTs⁻/OMs⁻ sind exzellent, weil mesomeriestabilisiert.'
  ],
  seen_in: 'LW 2019 (Phenylacetylen-Routen), BW 2016 (Chloramphenicol), BW 2024 (Merrilacton A)'
});

R({
  id: 'sn1', category: C_SN, name: 'S_N1 — monomolekulare nucleophile Substitution',
  difficulty: 'A', reaktionstyp: 'S_N1', transformation: 'R₃C–X → R₃C–Nu',
  rx: (() => {
    const a = new Mol(); tert(a, 0, 0, null, 'X');
    const b = new Mol(); tert(b, 0, 0, null, 'Nu');
    return { reactants: [a], products: [b] };
  })(),
  above: 'Nu-H', below: 'protisch, Δ',
  conditions: 'Schwaches Nucleophil (oft das Solvens selbst), protisch-polares Lösungsmittel (H₂O, EtOH), Wärme.',
  stereochemistry: 'Planares Carbenium-Ion → Angriff von beiden Seiten → Racemisierung (meist mit leichtem Inversionsüberschuss).',
  substituents: 'R₁, R₂, R₃ = Alkyl/Aryl · X = Cl, Br, I, OTs · Nu–H = H₂O, ROH, RCOOH',
  key_points: [
    'Zweistufig über ein planares Carbenium-Ion; der Zerfall zum Kation ist geschwindigkeitsbestimmend.',
    'v = k·[R–X] — erster Ordnung, unabhängig von der Nucleophil-Konzentration.',
    'Reaktivität tertiär > sekundär ≫ primär — genau umgekehrt zur S_N2.',
    'Allyl- und Benzylhalogenide reagieren trotz primärer Struktur schnell (mesomeriestabilisiertes Kation).',
    'Umlagerung (Hydrid-/Alkyl-Shift) zum stabileren Kation ist möglich.'
  ],
  seen_in: 'Theoriefrage „Faktoren S_N1 vs S_N2", BW 2022 (Butanon-Reaktionen)'
});

R({
  id: 'williamson-ethersynthese', category: C_SN, name: 'Williamson-Ethersynthese',
  difficulty: 'B', reaktionstyp: 'S_N2', transformation: 'R₁–O⁻ + R₂–CH₂–X → R₁–O–CH₂–R₂',
  rx: (() => {
    const a = new Mol();
    const r1 = a.gen(0, 0, 'R₁'); const o = a.add(DX, DY, 'O');
    a.bond(r1, o, 1);
    const a2 = new Mol(); prim(a2, 0, 0, 'R₂', null, 'X');
    const b = new Mol();
    const br = b.gen(0, 0, 'R₁'); const bo = b.add(DX, DY, 'O');
    const bc = b.add(2 * DX, 0, 'C'); const br2 = b.gen(3 * DX, DY, 'R₂');
    b.bond(br, bo, 1); b.bond(bo, bc, 1); b.bond(bc, br2, 1);
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'Base (NaH, K_2CO_3)', below: 'DMF / Aceton',
  conditions: 'Alkohol/Phenol wird zuerst deprotoniert (NaH, K₂CO₃, NaOH), dann S_N2 mit dem Halogenid.',
  stereochemistry: 'Inversion am Halogenid-C, falls dort ein Stereozentrum liegt.',
  substituents: 'R₁ = Alkyl, Aryl (Phenolat!) · R₂ = Alkyl · X = Cl, Br, I, OTs; auch (CH₃)₂SO₄ als Methylierungsmittel',
  key_points: [
    'Das Halogenid muss primär sein — bei tertiärem R–X gewinnt die E2-Eliminierung.',
    'Phenolate sind wegen der Mesomeriestabilisierung leicht zugänglich; deshalb ist die Arylether-Bildung Standard.',
    'Dimethylsulfat (CH₃)₂SO₄ und CH₃I sind die üblichen Methylierungsmittel für Phenole.'
  ],
  seen_in: 'BW 2021 (Capsaicin), LW 2022 (Elemicin), BW 2016 (Trimethoprim)'
});

R({
  id: 'alkohol-zu-halogenid', category: C_SN, name: 'Alkohol → Alkylhalogenid (SOCl₂ / PBr₃)',
  difficulty: 'A', reaktionstyp: 'S_N2', transformation: 'R–OH → R–Cl bzw. R–Br',
  rx: (() => {
    const a = new Mol(); prim(a, 0, 0, 'R₁', 'O', null);
    const b = new Mol(); prim(b, 0, 0, 'R₁', 'Cl', null);
    return { reactants: [a], products: [b] };
  })(),
  above: 'SOCl_2  bzw. PBr_3', below: 'Pyridin',
  conditions: 'SOCl₂ (→ Chlorid, Nebenprodukte SO₂ + HCl gasförmig) oder PBr₃ (→ Bromid); Pyridin fängt die Säure ab.',
  stereochemistry: 'Inversion am Stereozentrum (S_N2 am aktivierten Ester).',
  substituents: 'R₁ = primäres oder sekundäres Alkyl. Für tertiäre Alkohole genügt konz. HX.',
  key_points: [
    'Die OH-Gruppe ist eine miserable Abgangsgruppe — sie wird erst in einen Chlorsulfit- bzw. Phosphitester überführt.',
    'Vorteil gegenüber HX: keine Carbenium-Ionen, also keine Umlagerung.',
    'Beide Nebenprodukte des SOCl₂-Wegs sind Gase und treiben das Gleichgewicht.'
  ],
  seen_in: 'BW 2023 (Ibuprofen, Lidocain), BW 2016 (Penicillin V), LW 2017 (Papaverin)'
});

R({
  id: 'tosylierung', category: C_SN, name: 'Tosylierung / Mesylierung (OH → Abgangsgruppe)',
  difficulty: 'B', reaktionstyp: 'S_N2 (am S)', transformation: 'R–OH → R–OTs',
  rx: (() => {
    const a = new Mol(); prim(a, 0, 0, 'R₁', 'O', null);
    const b = new Mol();
    const r = b.gen(0, 0, 'R₁'); const c = b.add(DX, DY, 'C'); const o = b.add(2 * DX, 0, 'O');
    const ts = b.gen(3 * DX, DY, 'Ts');
    b.bond(r, c, 1); b.bond(c, o, 1); b.bond(o, ts, 1);
    return { reactants: [a], products: [b] };
  })(),
  above: 'TsCl  bzw. MsCl', below: 'Pyridin, 0 °C',
  conditions: 'p-Toluolsulfonylchlorid (TsCl) oder Methansulfonylchlorid (MsCl / MeSO₂Cl) in Pyridin.',
  stereochemistry: 'Die C–O-Bindung wird nicht angetastet → Konfiguration am C bleibt erhalten. Erst die nachfolgende S_N2 invertiert.',
  substituents: 'R₁ = primäres/sekundäres Alkyl · Ts = p-CH₃–C₆H₄–SO₂– · Ms = CH₃–SO₂–',
  key_points: [
    'Verwandelt die schlechte Abgangsgruppe OH⁻ in die exzellente TsO⁻/MsO⁻, ohne das Stereozentrum anzutasten.',
    'TsO⁻ ist so gut, weil die negative Ladung über drei O-Atome mesomeriestabilisiert ist.',
    'Klassische Klausurfrage: „Warum tosylieren statt direkt mit OH⁻ arbeiten?" — genau deshalb.'
  ],
  seen_in: 'BW 2022 (Cantharidin, MeSO₂Cl in Py), BW 2024 (Merrilacton A), BW 2019 (Twistan)'
});

R({
  id: 'nitril-aus-halogenid', category: C_SN, name: 'Nitrilsynthese aus Alkylhalogenid (C₁-Verlängerung)',
  difficulty: 'B', reaktionstyp: 'S_N2', transformation: 'R–CH₂–X → R–CH₂–C≡N',
  rx: (() => {
    const a = new Mol(); prim(a, 0, 0, 'R₁', null, 'X');
    const b = new Mol();
    const r = b.gen(0, 0, 'R₁'); const c1 = b.add(DX, DY, 'C'); const c2 = b.add(2 * DX, 0, 'C');
    const n = b.add(3 * DX, -DY, 'N');
    b.bond(r, c1, 1); b.bond(c1, c2, 1); b.bond(c2, n, 3);
    return { reactants: [a], products: [b] };
  })(),
  above: 'NaCN / KCN', below: 'DMSO',
  conditions: 'Cyanid in aprotisch-polarem Lösungsmittel; primäres Halogenid.',
  substituents: 'R₁ = Alkyl, Benzyl · X = Cl, Br, I, OTs',
  key_points: [
    'Eine der wenigen Methoden, die Kohlenstoffkette um genau ein C-Atom zu verlängern.',
    'Das Nitril ist ein Synthon für –COOH (H₃O⁺), –CH₂NH₂ (LiAlH₄) oder –CHO (DIBAL).',
    'CN⁻ ist ambident — Angriff über C liefert das Nitril, über N das Isonitril.'
  ],
  seen_in: 'BW 2022 (Butanon-Reaktionen), BW 2016 (Trimethoprim), LW 2019'
});

R({
  id: 'amin-alkylierung', category: C_SN, name: 'N-Alkylierung eines Amins',
  difficulty: 'B', reaktionstyp: 'S_N2', transformation: 'R₁–NH₂ + R₂–X → R₁–NH–R₂',
  rx: (() => {
    const a = new Mol();
    const r1 = a.gen(0, 0, 'R₁'); const n = a.add(DX, DY, 'N'); a.bond(r1, n, 1);
    const a2 = new Mol(); prim(a2, 0, 0, 'R₂', null, 'X');
    const b = new Mol();
    const s1 = b.gen(0, 0, 'R₁'); const bn = b.add(DX, DY, 'N');
    const bc = b.add(2 * DX, 0, 'C'); const s2 = b.gen(3 * DX, DY, 'R₂');
    b.bond(s1, bn, 1); b.bond(bn, bc, 1); b.bond(bc, s2, 1);
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'Base (K_2CO_3, NEt_3)', below: '- HX',
  conditions: 'Halogenid + Amin-Überschuss, Hilfsbase bindet das freiwerdende HX.',
  substituents: 'R₁ = Alkyl, Aryl · R₂ = primäres Alkyl · X = Cl, Br, I, OTs',
  key_points: [
    'Problem der Überalkylierung: das gebildete sekundäre Amin ist nucleophiler als das Edukt und reagiert weiter bis zum quartären Ammoniumsalz.',
    'Deshalb arbeitet man mit Amin-Überschuss — oder weicht auf die reduktive Aminierung aus, die auf der Stufe stehen bleibt.',
    'Bei Anilinen ist die Reaktion langsamer (freies Elektronenpaar ist in den Ring delokalisiert).'
  ],
  seen_in: 'BW 2023 (Lidocain), LW 2026 (Fentanyl, Diphenhydramin), BW 2016 (Chloramphenicol)'
});

/* ══════════════════════════════════════════════════════════════════
 * 2 — Eliminierung
 * ══════════════════════════════════════════════════════════════════ */
const C_EL = 'Eliminierung';

R({
  id: 'e2', category: C_EL, name: 'E2 — bimolekulare Eliminierung',
  difficulty: 'A', reaktionstyp: 'E2', transformation: 'R₁–CH₂–CHX–R₂ → R₁–CH=CH–R₂',
  rx: (() => {
    const a = new Mol();
    const r1 = a.gen(0, 0, 'R₁'); const c1 = a.add(DX, DY, 'C'); const c2 = a.add(2 * DX, 0, 'C');
    const r2 = a.gen(3 * DX, DY, 'R₂'); const x = a.gen(2 * DX, -B, 'X');
    a.bond(r1, c1, 1); a.bond(c1, c2, 1); a.bond(c2, r2, 1); a.bond(c2, x, 1);
    const b = new Mol();
    const s1 = b.gen(0, 0, 'R₁'); const d1 = b.add(DX, DY, 'C'); const d2 = b.add(2 * DX, 0, 'C');
    const s2 = b.gen(3 * DX, DY, 'R₂');
    b.bond(s1, d1, 1); b.bond(d1, d2, 2); b.bond(d2, s2, 1);
    return { reactants: [a], products: [b] };
  })(),
  above: 'starke Base', below: 'KOH/EtOH, Δ',
  conditions: 'Starke, oft sperrige Base (KOH/EtOH, NaOEt, KO^tBu, LDA, NaNH₂), Wärme.',
  stereochemistry: 'Anti-periplanare Anordnung von H und X zwingend → aus einem Diastereomer entsteht gezielt das E- oder das Z-Alken.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · X = Cl, Br, I, OTs, ⁺NR₃',
  key_points: [
    'Einstufig konzertiert: die Base greift das β-H an, während X⁻ abgeht.',
    'Saytzeff/Zaitsev: es entsteht bevorzugt das höher substituierte (stabilere) Alken.',
    'Das Hofmann-Produkt (weniger substituiert) dominiert bei sperriger Base (KO^tBu) oder ⁺NR₃ als Abgangsgruppe.',
    'E2 und S_N2 konkurrieren immer — Hitze und starke Basen begünstigen die Eliminierung.'
  ],
  seen_in: 'BW 2022 (Cantharidin), BW 2021 (Carvon), LW 2019, BW 2019 (Twistan)'
});

R({
  id: 'e1', category: C_EL, name: 'E1 — monomolekulare Eliminierung',
  difficulty: 'B', reaktionstyp: 'E1', transformation: 'R₃C–X → Alken + HX',
  rx: (() => {
    const a = new Mol();
    const c1 = a.add(DX, DY, 'C'); const c2 = a.add(2 * DX, 0, 'C');
    const r1 = a.gen(0, 0, 'R₁'); const r2 = a.gen(DX, DY + B, 'R₂');
    const r3 = a.gen(3 * DX, DY, 'R₃'); const x = a.gen(2 * DX, -B, 'X');
    a.bond(r1, c1, 1); a.bond(c1, c2, 1); a.bond(c1, r2, 1); a.bond(c2, r3, 1); a.bond(c2, x, 1);
    const b = new Mol();
    const d1 = b.add(DX, DY, 'C'); const d2 = b.add(2 * DX, 0, 'C');
    const s1 = b.gen(0, 0, 'R₁'); const s2 = b.gen(DX, DY + B, 'R₂'); const s3 = b.gen(3 * DX, DY, 'R₃');
    b.bond(s1, d1, 1); b.bond(d1, d2, 2); b.bond(d1, s2, 1); b.bond(d2, s3, 1);
    return { reactants: [a], products: [b] };
  })(),
  above: 'schwache Base', below: 'protisch, Δ',
  conditions: 'Schwache Base/Nucleophil, protisches Solvens, Hitze — dieselben Bedingungen wie die S_N1.',
  stereochemistry: 'Über das planare Carbenium-Ion; keine anti-periplanare Vorgabe, daher meist E/Z-Gemisch mit E-Überschuss.',
  substituents: 'R₁, R₂, R₃ = Alkyl/Aryl · X = Cl, Br, I, ⁺OH₂',
  key_points: [
    'Gleiches Carbenium-Ion wie die S_N1 — beide laufen immer nebeneinander ab.',
    'v = k·[R–X], unabhängig von der Base.',
    'Hitze verschiebt das Verhältnis E1 : S_N1 zugunsten der Eliminierung (Entropiegewinn).'
  ],
  seen_in: 'Theoriefrage S_N1/S_N2, BW 2022 (Butanon-Reaktionen)'
});

R({
  id: 'dehydratisierung-alkohol', category: C_EL, name: 'Dehydratisierung eines Alkohols',
  difficulty: 'A', reaktionstyp: 'E1', transformation: 'R₁–CH₂–CH(OH)–R₂ → R₁–CH=CH–R₂ + H₂O',
  rx: (() => {
    const a = new Mol();
    const r1 = a.gen(0, 0, 'R₁'); const c1 = a.add(DX, DY, 'C'); const c2 = a.add(2 * DX, 0, 'C');
    const r2 = a.gen(3 * DX, DY, 'R₂'); const o = a.add(2 * DX, -B, 'O');
    a.bond(r1, c1, 1); a.bond(c1, c2, 1); a.bond(c2, r2, 1); a.bond(c2, o, 1);
    const b = new Mol();
    const s1 = b.gen(0, 0, 'R₁'); const d1 = b.add(DX, DY, 'C'); const d2 = b.add(2 * DX, 0, 'C');
    const s2 = b.gen(3 * DX, DY, 'R₂');
    b.bond(s1, d1, 1); b.bond(d1, d2, 2); b.bond(d2, s2, 1);
    return { reactants: [a], products: [b] };
  })(),
  above: 'konz. H_2SO_4', below: 'Δ, -H_2O',
  conditions: 'Konz. H₂SO₄ oder H₃PO₄, 140–180 °C; alternativ P₂O₅ / POCl₃ in Pyridin (schonend).',
  stereochemistry: 'Saytzeff-Produkt, überwiegend E-konfiguriert.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H',
  key_points: [
    'Die Säure protoniert die OH-Gruppe und macht daraus die gute Abgangsgruppe H₂O.',
    'Reaktivität tertiär > sekundär > primär (Stabilität des Carbenium-Ions).',
    'Umlagerungen sind häufig — ein primäres Kation lagert sofort zum sekundären/tertiären um.',
    'Bei β-Hydroxycarbonylen läuft die Wasserabspaltung schon unter viel milderen Bedingungen ab (Aldolkondensation).'
  ],
  seen_in: 'BW 2021 (Thymol, Carvon), LW 2016 (Phellandral), BW 2026 (Thymol aus Benzaldehyd)'
});

R({
  id: 'alkin-aus-dihalogenid', category: C_EL, name: 'Doppelte Dehydrohalogenierung → Alkin',
  difficulty: 'C', reaktionstyp: 'E2 (2×)', transformation: 'R₁–CHX–CH₂X → R₁–C≡CH',
  rx: (() => {
    const a = new Mol();
    const r1 = a.gen(0, 0, 'R₁'); const c1 = a.add(DX, DY, 'C'); const c2 = a.add(2 * DX, 0, 'C');
    const x1 = a.gen(DX, DY + B, 'X'); const x2 = a.gen(2 * DX, -B, 'X');
    a.bond(r1, c1, 1); a.bond(c1, c2, 1); a.bond(c1, x1, 1); a.bond(c2, x2, 1);
    // sp-C is linear: R₁, C and C share one 180° axis.
    const b = new Mol();
    const s1 = b.gen(0, 0, 'R₁'); const d1 = b.add(B, 0, 'C'); const d2 = b.add(2 * B, 0, 'C');
    b.bond(s1, d1, 1); b.bond(d1, d2, 3);
    return { reactants: [a], products: [b] };
  })(),
  above: '2 NaNH_2', below: 'NH_3(l), dann H_3O^+',
  conditions: 'Zwei Äquivalente sehr starker Base (NaNH₂ in flüssigem NH₃, KO^tBu/DMSO); das vicinale Dihalogenid stammt meist aus der Br₂-Addition an ein Alken.',
  substituents: 'R₁ = Alkyl, Aryl · X = Br, Cl',
  key_points: [
    'Zwei aufeinanderfolgende E2-Schritte über das Vinylhalogenid als Zwischenstufe.',
    'Das zweite Äquivalent ist nötig, weil die Vinyl-C–X-Bindung deutlich träger ist.',
    'Bei terminalen Alkinen deprotoniert NaNH₂ anschließend zum Acetylid — erst die wässrige Aufarbeitung liefert das Alkin.',
    'Die Acetylid-Stufe ist der Einstieg in die C–C-Knüpfung mit Alkylhalogeniden.'
  ],
  seen_in: 'LW 2019 (Phenylacetylen-Routen), BW 2022 (Lysergsäure-Allen)'
});

};
