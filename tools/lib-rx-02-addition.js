/* Reaction library — Additionen an C=C und C≡C. */

module.exports = function (ctx) {
const { R, Mol, alken, alkin, B, DX, DY } = ctx;

const C_AD = 'Addition an C=C / C≡C';

R({
  id: 'elektrophile-addition-hx', category: C_AD, name: 'Elektrophile Addition von HX (Markownikow)',
  difficulty: 'A', reaktionstyp: 'A_E', transformation: 'R₁–CH=CH₂ → R₁–CHX–CH₃',
  rx: (() => {
    const a = new Mol(); alken(a, 0, 0, 'R₁', null);
    const b = new Mol();
    const r = b.gen(0, 0, 'R₁'); const c1 = b.add(DX, DY, 'C'); const c2 = b.add(2 * DX, 0, 'C');
    const x = b.gen(DX, DY + B, 'X');
    b.bond(r, c1, 1); b.bond(c1, c2, 1); b.bond(c1, x, 1);
    return { reactants: [a], products: [b] };
  })(),
  above: 'H-X', below: 'CH_2Cl_2',
  conditions: 'HCl, HBr oder HI ohne Peroxide, im Dunkeln; auch H₂SO₄ oder H₃O⁺ als Protonenquelle.',
  stereochemistry: 'Über das planare Carbenium-Ion → an einem neu gebildeten Stereozentrum entsteht ein Racemat.',
  substituents: 'R₁ = Alkyl, Aryl · X = Cl, Br, I',
  key_points: [
    'Markownikow-Regel: das H geht an das C-Atom mit den MEHR Wasserstoffen, weil so das stabilere Carbenium-Ion entsteht.',
    'Die Stabilität der Zwischenstufe entscheidet: tertiär > sekundär > primär.',
    'Umlagerungen des Kations sind möglich und liefern „unerwartete" Produkte.',
    'Gegenstück ist die radikalische HBr-Addition — dort kehrt sich die Regioselektivität um.'
  ],
  seen_in: 'Regioselektivitäts-Aufgabe „HBr-Addition an Propen", BW 2024 (Warm-up), BW 2021 (Thymol)'
});

R({
  id: 'radikalische-hbr-addition', category: C_AD, name: 'Radikalische HBr-Addition (Anti-Markownikow)',
  difficulty: 'B', reaktionstyp: 'A_R', transformation: 'R₁–CH=CH₂ → R₁–CH₂–CH₂Br',
  rx: (() => {
    const a = new Mol(); alken(a, 0, 0, 'R₁', null);
    const b = new Mol();
    const r = b.gen(0, 0, 'R₁'); const c1 = b.add(DX, DY, 'C'); const c2 = b.add(2 * DX, 0, 'C');
    const br = b.add(3 * DX, DY, 'Br');
    b.bond(r, c1, 1); b.bond(c1, c2, 1); b.bond(c2, br, 1);
    return { reactants: [a], products: [b] };
  })(),
  above: 'HBr', below: 'ROOR / hν',
  conditions: 'HBr mit Peroxiden (ROOR) oder unter UV-Licht. Funktioniert NUR mit HBr, nicht mit HCl oder HI (Energiebilanz der Kettenschritte).',
  stereochemistry: 'Radikalische Zwischenstufe, praktisch planar → Racemat.',
  substituents: 'R₁ = Alkyl, Aryl',
  key_points: [
    'Radikalkettenmechanismus: Start (ROOR → 2 RO·), Kettenfortpflanzung (Br· addiert, dann H-Abstraktion), Abbruch.',
    'Br· addiert so, dass das STABILERE C-Radikal entsteht — dieses sitzt am höher substituierten C, folglich landet Br am weniger substituierten.',
    'Ergebnis ist das Anti-Markownikow-Produkt, obwohl dasselbe Prinzip (stabilere Zwischenstufe) gilt wie bei der ionischen Addition.',
    'Klassische Gegenüberstellung in Regioselektivitäts-Aufgaben.'
  ],
  seen_in: 'Regioselektivitäts-Aufgabe, BW 2024 (Warm-up: zwei Reaktionen)'
});

R({
  id: 'bromierung-alken', category: C_AD, name: 'Bromaddition an Alkene (anti)',
  difficulty: 'A', reaktionstyp: 'A_E', transformation: 'R₁–CH=CH–R₂ → R₁–CHBr–CHBr–R₂',
  rx: (() => {
    const a = new Mol(); alken(a, 0, 0, 'R₁', 'R₂');
    const b = new Mol();
    const r1 = b.gen(0, 0, 'R₁'); const c1 = b.add(DX, DY, 'C'); const c2 = b.add(2 * DX, 0, 'C');
    const r2 = b.gen(3 * DX, DY, 'R₂');
    const br1 = b.add(DX, DY + B, 'Br'); const br2 = b.add(2 * DX, -B, 'Br');
    b.bond(r1, c1, 1); b.bond(c1, c2, 1); b.bond(c2, r2, 1);
    b.bond(c1, br1, 1, 1); b.bond(c2, br2, 1, 6);
    return { reactants: [a], products: [b] };
  })(),
  above: 'Br_2', below: 'CCl_4, dunkel',
  conditions: 'Br₂ in CCl₄ oder CH₂Cl₂ im Dunkeln. Das Entfärben der braunen Lösung ist der klassische Alken-Nachweis.',
  stereochemistry: 'Cyclisches Bromonium-Ion → Rückseitenangriff des Br⁻ → strikte ANTI-Addition. Aus einem cis-Alken wird das Racemat, aus trans die meso-Verbindung (oder umgekehrt).',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · analog mit Cl₂; mit Br₂/H₂O entsteht das Bromhydrin',
  key_points: [
    'Das Brückenkopf-Bromonium-Ion verhindert freie Drehung — daher die strenge Stereospezifität.',
    'In Wasser greift H₂O statt Br⁻ an und liefert das Bromhydrin, und zwar Markownikow-orientiert (OH an das höher substituierte C).',
    'Das vicinale Dibromid ist der übliche Einstieg in die Alkinsynthese (2× E2).'
  ],
  seen_in: 'BW 2024 (Warm-up Bromierung von Alkenen), BW 2022 (Butanon-Reaktionen)'
});

R({
  id: 'hydratisierung-alken', category: C_AD, name: 'Säurekatalysierte Hydratisierung (Markownikow)',
  difficulty: 'A', reaktionstyp: 'A_E', transformation: 'R₁–CH=CH₂ → R₁–CH(OH)–CH₃',
  rx: (() => {
    const a = new Mol(); alken(a, 0, 0, 'R₁', null);
    const b = new Mol();
    const r = b.gen(0, 0, 'R₁'); const c1 = b.add(DX, DY, 'C'); const c2 = b.add(2 * DX, 0, 'C');
    const o = b.add(DX, DY + B, 'O');
    b.bond(r, c1, 1); b.bond(c1, c2, 1); b.bond(c1, o, 1);
    return { reactants: [a], products: [b] };
  })(),
  above: 'H_2O / H^+', below: 'bzw. 1. Hg(OAc)_2, 2. NaBH_4',
  conditions: 'Verd. H₂SO₄ in Wasser; schonender die Oxymercurierung–Demercurierung (Hg(OAc)₂/H₂O, dann NaBH₄), die ohne Umlagerung auskommt.',
  stereochemistry: 'Racemat am neuen Stereozentrum (planares Kation bzw. symmetrisches Mercurinium-Ion).',
  substituents: 'R₁ = Alkyl, Aryl',
  key_points: [
    'Umkehrung der Dehydratisierung — dasselbe Gleichgewicht, nur von der anderen Seite; Wasserüberschuss verschiebt es zum Alkohol.',
    'Markownikow: OH landet am höher substituierten C.',
    'Die säurekatalysierte Variante lagert um; die Oxymercurierung tut das nicht, weil kein freies Carbenium-Ion auftritt.',
    'Für das Anti-Markownikow-Produkt nimmt man Hydroborierung/Oxidation (BH₃, dann H₂O₂/OH⁻).'
  ],
  seen_in: 'BW 2021 (Thymol), BW 2013 (Grandisol), BW 2023 (Hirsuten, Hg(OAc)₂)'
});

R({
  id: 'katalytische-hydrierung', category: C_AD, name: 'Katalytische Hydrierung (syn)',
  difficulty: 'A', reaktionstyp: 'Addition', transformation: 'R₁–CH=CH–R₂ → R₁–CH₂–CH₂–R₂',
  rx: (() => {
    const a = new Mol(); alken(a, 0, 0, 'R₁', 'R₂');
    const b = new Mol();
    const r1 = b.gen(0, 0, 'R₁'); const c1 = b.add(DX, DY, 'C'); const c2 = b.add(2 * DX, 0, 'C');
    const r2 = b.gen(3 * DX, DY, 'R₂');
    b.bond(r1, c1, 1); b.bond(c1, c2, 1); b.bond(c2, r2, 1);
    return { reactants: [a], products: [b] };
  })(),
  above: 'H_2', below: 'Pd/C, Pt oder Raney-Ni',
  conditions: 'H₂ (1–5 bar) an Pd/C, PtO₂ oder Raney-Nickel in EtOH/EtOAc.',
  stereochemistry: 'Beide H-Atome werden von derselben Katalysatorseite übertragen → SYN-Addition.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H',
  key_points: [
    'Reduziert außerdem C≡C, NO₂ → NH₂, C≡N → CH₂NH₂ und spaltet Benzylether/Cbz-Gruppen (Hydrogenolyse).',
    'Aromatische Ringe bleiben unter milden Bedingungen stehen — dafür braucht es hohen Druck und Pt/Rh.',
    'Chemoselektivität ist die eigentliche Kunst: „3 Äq. H₂" in einer Angabe heißt, dass genau drei Doppelbindungen fallen.'
  ],
  seen_in: 'BW 2022 (Cantharidin), BW 2024 (Vitamin E), BW 2021 (Carvon), LW 2023 (Tazaroten)'
});

R({
  id: 'lindlar-hydrierung', category: C_AD, name: 'Partielle Alkinhydrierung — Lindlar vs. Na/NH₃',
  difficulty: 'C', reaktionstyp: 'Addition', transformation: 'R₁–C≡C–R₂ → cis- bzw. trans-Alken',
  rx: (() => {
    const a = new Mol(); alkin(a, 0, 0, 'R₁', 'R₂');
    // (Z)-Alken: C=C waagrecht, beide Reste auf DERSELBEN Seite nach
    // unten weg (je 120° zur Doppelbindung).
    const b = new Mol();
    const c1 = b.add(B, 0, 'C'); const c2 = b.add(2 * B, 0, 'C');
    const r1 = b.gen(B - DX, -DY, 'R₁'); const r2 = b.gen(2 * B + DX, -DY, 'R₂');
    b.bond(r1, c1, 1); b.bond(c1, c2, 2); b.bond(c2, r2, 1);
    return { reactants: [a], products: [b] };
  })(),
  above: 'H_2 / Lindlar  →  (Z)', below: 'Na / NH_3(l)  →  (E)',
  conditions: 'Lindlar-Katalysator = Pd auf CaCO₃, mit Pb(OAc)₂/Chinolin vergiftet — stoppt auf der Alkenstufe. Alternativ H₂/Pd-BaSO₄.',
  stereochemistry: 'Lindlar: syn-Addition → (Z)-Alken. Na oder Li in flüssigem NH₃: Radikalanion-Mechanismus über das stabilere trans-Vinylradikal → (E)-Alken.',
  substituents: 'R₁, R₂ = Alkyl, Aryl',
  key_points: [
    'Das komplementäre Paar, mit dem sich beide Alken-Konfigurationen gezielt einstellen lassen.',
    'Ohne Vergiftung hydriert Pd bis zum Alkan durch.',
    'Die Na/NH₃-Variante ist mit der Birch-Reduktion verwandt (solvatisierte Elektronen).'
  ],
  seen_in: 'BW 2022 (Cantharidin, Lysergsäure), BW 2020 (Bergamoten), BW 2019 (Abscisinsäure)'
});

R({
  id: 'epoxidierung-mcpba', category: C_AD, name: 'Epoxidierung mit Persäure (Prilezhaev)',
  difficulty: 'B', reaktionstyp: 'Addition', transformation: 'R₁–CH=CH–R₂ → Epoxid',
  rx: (() => {
    const a = new Mol(); alken(a, 0, 0, 'R₁', 'R₂');
    const b = new Mol();
    const r1 = b.gen(0, 0, 'R₁'); const c1 = b.add(DX, DY, 'C'); const c2 = b.add(2 * DX, 0, 'C');
    const r2 = b.gen(3 * DX, DY, 'R₂');
    b.bond(r1, c1, 1); b.bond(c1, c2, 1); b.bond(c2, r2, 1);
    // The 60° angles of the three-ring are relative to the C–C bond, so
    // the O has to be found from that bond — not by going straight up.
    const ap = b.apex(c1, c2, +1);
    const o = b.add(ap[0], ap[1], 'O');
    b.bond(c1, o, 1); b.bond(c2, o, 1);
    return { reactants: [a], products: [b] };
  })(),
  above: 'm-CPBA', below: 'CH_2Cl_2, 0 °C',
  conditions: 'meta-Chlorperbenzoesäure (m-CPBA/MCPBA) oder CF₃CO₃H in CH₂Cl₂.',
  stereochemistry: 'Konzertierte „Schmetterlings"-Übertragung von einer Seite → SYN, die Alkengeometrie bleibt vollständig erhalten.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · elektronenreiche Alkene reagieren am schnellsten',
  key_points: [
    'Das Epoxid ist ein gespanntes, hochreaktives Elektrophil und der Standard-Baustein für 1,2-difunktionalisierte Produkte.',
    'Saure Öffnung: Angriff am höher substituierten C (Markownikow-artig). Basische Öffnung mit Nu⁻: Angriff am weniger gehinderten C.',
    'Die Öffnung verläuft in beiden Fällen ANTI — daraus wird ein trans-Diol.',
    'Dasselbe Reagenz macht aus Ketonen Ester (Baeyer-Villiger) — die Angabe verrät über das Substrat, welche Reaktion gemeint ist.'
  ],
  seen_in: 'BW 2020 (Bergamoten), BW 2024 (Merrilacton A), BW 2026 (Adrenosteron)'
});

R({
  id: 'syn-dihydroxylierung', category: C_AD, name: 'syn-Dihydroxylierung (OsO₄ / KMnO₄ kalt)',
  difficulty: 'B', reaktionstyp: 'Oxidation', transformation: 'R₁–CH=CH–R₂ → vicinales cis-Diol',
  rx: (() => {
    const a = new Mol(); alken(a, 0, 0, 'R₁', 'R₂');
    const b = new Mol();
    const r1 = b.gen(0, 0, 'R₁'); const c1 = b.add(DX, DY, 'C'); const c2 = b.add(2 * DX, 0, 'C');
    const r2 = b.gen(3 * DX, DY, 'R₂');
    const o1 = b.add(DX, DY + B, 'O'); const o2 = b.add(2 * DX, -B, 'O');
    b.bond(r1, c1, 1); b.bond(c1, c2, 1); b.bond(c2, r2, 1);
    b.bond(c1, o1, 1, 1); b.bond(c2, o2, 1, 1);
    return { reactants: [a], products: [b] };
  })(),
  above: 'OsO_4', below: 'NMO  bzw. kaltes verd. KMnO_4/OH^-',
  conditions: 'Kat. OsO₄ mit NMO als Reoxidans (Upjohn), oder kalte, verdünnte, alkalische KMnO₄-Lösung.',
  stereochemistry: 'Cyclischer Osmat- bzw. Manganat-Ester → beide O von derselben Seite → SYN-Diol (cis).',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H',
  key_points: [
    'Komplementär zur Epoxidierung + saurer Öffnung, die das ANTI-Diol liefert.',
    'Kaltes, verdünntes KMnO₄ bleibt beim Diol stehen; heiß und konzentriert spaltet es die Bindung ganz (→ Carbonsäuren).',
    'Das Diol lässt sich anschließend mit HIO₄/NaIO₄ spalten — zusammen ist das eine Ozonolyse-Alternative.'
  ],
  seen_in: 'BW 2024 (Merrilacton A, OsO₄/THF), BW 2026 (Adrenosteron)'
});

R({
  id: 'ozonolyse', category: C_AD, name: 'Ozonolyse',
  difficulty: 'B', reaktionstyp: 'Oxidative Spaltung', transformation: 'R₁–CH=CH–R₂ → R₁–CHO + R₂–CHO',
  rx: (() => {
    const a = new Mol(); alken(a, 0, 0, 'R₁', 'R₂');
    const p1 = new Mol();
    const q1 = p1.gen(0, 0, 'R₁'); const d1 = p1.add(DX, DY, 'C'); const w1 = p1.add(DX, DY + B, 'O');
    p1.bond(q1, d1, 1); p1.bond(d1, w1, 2);
    const p2 = new Mol();
    const q2 = p2.gen(0, 0, 'R₂'); const d2 = p2.add(DX, DY, 'C'); const w2 = p2.add(DX, DY + B, 'O');
    p2.bond(q2, d2, 1); p2.bond(d2, w2, 2);
    return { reactants: [a], products: [p1, p2] };
  })(),
  above: '1. O_3', below: '2. Zn/HOAc  bzw. (CH_3)_2S',
  conditions: 'O₃ bei −78 °C, dann REDUKTIVE Aufarbeitung (Zn/HOAc, Me₂S, PPh₃) → Aldehyde; oder OXIDATIVE Aufarbeitung (H₂O₂) → Carbonsäuren.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · trisubstituierte C-Atome liefern Ketone statt Aldehyden',
  key_points: [
    'Die C=C-Bindung wird komplett durchtrennt — beide C-Atome werden zu Carbonyl-C.',
    'Die Aufarbeitung entscheidet über die Oxidationsstufe: Zn/Me₂S → Aldehyd, H₂O₂ → Carbonsäure.',
    'Klassisches Strukturaufklärungs-Werkzeug: aus den Spaltstücken liest man die Lage der Doppelbindung zurück.',
    'Bei cyclischen Alkenen entsteht EIN Dicarbonyl-Produkt, der Ring wird geöffnet.'
  ],
  seen_in: 'BW 2019 (Abscisinsäure), BW 2022 (Z-Jasmon), BW 2013 (Grandisol), BW 2020 (Prostaglandin)'
});

R({
  id: 'diolspaltung-periodat', category: C_AD, name: 'Glykolspaltung mit Periodat (Malaprade)',
  difficulty: 'C', reaktionstyp: 'Oxidative Spaltung', transformation: 'vicinales Diol → 2 Carbonylverbindungen',
  rx: (() => {
    const a = new Mol();
    const r1 = a.gen(0, 0, 'R₁'); const c1 = a.add(DX, DY, 'C'); const c2 = a.add(2 * DX, 0, 'C');
    const r2 = a.gen(3 * DX, DY, 'R₂');
    const o1 = a.add(DX, DY + B, 'O'); const o2 = a.add(2 * DX, -B, 'O');
    a.bond(r1, c1, 1); a.bond(c1, c2, 1); a.bond(c2, r2, 1); a.bond(c1, o1, 1); a.bond(c2, o2, 1);
    const p1 = new Mol();
    const q1 = p1.gen(0, 0, 'R₁'); const d1 = p1.add(DX, DY, 'C'); const w1 = p1.add(DX, DY + B, 'O');
    p1.bond(q1, d1, 1); p1.bond(d1, w1, 2);
    const p2 = new Mol();
    const q2 = p2.gen(0, 0, 'R₂'); const d2 = p2.add(DX, DY, 'C'); const w2 = p2.add(DX, DY + B, 'O');
    p2.bond(q2, d2, 1); p2.bond(d2, w2, 2);
    return { reactants: [a], products: [p1, p2] };
  })(),
  above: 'NaIO_4  bzw. HIO_4', below: 'H_2O / THF',
  conditions: 'Natriumperiodat oder Periodsäure in wässrigem THF, Raumtemperatur.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · nur VICINALE Diole (und α-Hydroxyketone, α-Diketone) reagieren',
  key_points: [
    'Über einen cyclischen Periodatester — deshalb müssen die beiden OH-Gruppen benachbart und cis-fähig sein.',
    'OsO₄ gefolgt von NaIO₄ leistet dasselbe wie eine Ozonolyse, ohne Ozon erzeugen zu müssen.',
    'In der Zuckerchemie das Standardwerkzeug zur Ringgrößenbestimmung.'
  ],
  seen_in: 'BW 2022 (Cantharidin, HIO₄), BW 2024 (Merrilacton A, NaIO₄)'
});

R({
  id: 'epoxid-oeffnung', category: C_AD, name: 'Nucleophile Epoxidöffnung',
  difficulty: 'B', reaktionstyp: 'S_N2', transformation: 'Epoxid + Nu⁻ → trans-1,2-difunktionalisiert',
  rx: (() => {
    const a = new Mol();
    const r1 = a.gen(0, 0, 'R₁'); const c1 = a.add(DX, DY, 'C'); const c2 = a.add(2 * DX, 0, 'C');
    const r2 = a.gen(3 * DX, DY, 'R₂');
    a.bond(r1, c1, 1); a.bond(c1, c2, 1); a.bond(c2, r2, 1);
    const ap = a.apex(c1, c2, +1);
    const o = a.add(ap[0], ap[1], 'O');
    a.bond(c1, o, 1); a.bond(c2, o, 1);
    const b = new Mol();
    const s1 = b.gen(0, 0, 'R₁'); const d1 = b.add(DX, DY, 'C'); const d2 = b.add(2 * DX, 0, 'C');
    const s2 = b.gen(3 * DX, DY, 'R₂');
    const bo = b.add(DX, DY + B, 'O'); const nu = b.gen(2 * DX, -B, 'Nu');
    b.bond(s1, d1, 1); b.bond(d1, d2, 1); b.bond(d2, s2, 1);
    b.bond(d1, bo, 1, 1); b.bond(d2, nu, 1, 6);
    return { reactants: [a], products: [b] };
  })(),
  above: 'Nu^-', below: 'bzw. Nu-H / H^+',
  conditions: 'Basisch: starkes Nucleophil (RO⁻, RMgX, LiAlH₄, CN⁻, R₂NH). Sauer: schwaches Nucleophil nach Protonierung des Epoxid-O.',
  stereochemistry: 'Rückseitenangriff → ANTI-Öffnung → trans-Produkt.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · Nu⁻ = OH⁻, RO⁻, RMgX, H⁻, CN⁻, N₃⁻, R₂NH',
  key_points: [
    'Die Ringspannung macht das Epoxid auch ohne Aktivierung zum guten Elektrophil.',
    'BASISCH greift Nu⁻ das WENIGER substituierte C an (sterische Kontrolle).',
    'SAUER greift Nu das HÖHER substituierte C an (das protonierte Epoxid hat schon Carbenium-Charakter).',
    'Diese Regioselektivitäts-Umkehr ist eine Standard-Prüfungsfrage.'
  ],
  seen_in: 'BW 2020 (Bergamoten), BW 2024 (Merrilacton A), BW 2013 (Grandisol)'
});

};
