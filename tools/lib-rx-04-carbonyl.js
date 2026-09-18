/* Reaction library — Additionen an die Carbonylgruppe.

   House orientation: the carbonyl C sits at the same spot in reactant and
   product, its O pointing straight UP, R₁ leaving to the lower left and
   the second substituent to the lower right — three bonds 120° apart.
   The nucleophile always arrives at that same C, so entries stack up. */

module.exports = function (ctx) {
const { R, Mol, carbonyl, B, DX, DY } = ctx;

const C_CO = 'Carbonyl — Additionen';

/* A ketone R₁–CO–R₂ (or aldehyde, with zLabel 'H'). */
const keton = (z) => { const m = new Mol(); carbonyl(m, 0, 0, 'R₁', { zLabel: z || 'R₂' }); return m; };

R({
  id: 'nucleophile-addition-carbonyl', category: C_CO, name: 'Nucleophile Addition an C=O — allgemeines Schema',
  difficulty: 'A', reaktionstyp: 'A_N', transformation: 'R₂C=O + Nu⁻ → R₂C(OH)–Nu',
  rx: (() => {
    const a = keton();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁');
      const c = m.add(DX, DY, 'C');
      const o = m.add(DX, DY + B, 'O');          // OH straight up
      const z = m.gen(2 * DX, 0, 'R₂');          // R₂ lower right
      // Nu takes the fourth tetrahedral position, at 150°.
      const nu = m.gen(DX - B * Math.cos(Math.PI / 6),
                       DY + B * Math.sin(Math.PI / 6), 'Nu');
      m.bond(r, c, 1); m.bond(c, o, 1); m.bond(c, z, 1); m.bond(c, nu, 1);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: '1. Nu^-', below: '2. H_3O^+',
  conditions: 'Nucleophil addiert an den partiell positiven Carbonyl-C, das Alkoxid wird anschließend protoniert.',
  stereochemistry: 'Angriff senkrecht zur planaren Carbonylebene, von beiden Seiten gleich wahrscheinlich → Racemat (außer bei chiraler Umgebung).',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · Nu⁻ = H⁻ (NaBH₄/LiAlH₄), R⁻ (RMgX, RLi), CN⁻, R₂N–H, RO–H, Ylide',
  key_points: [
    'Die C=O-Bindung ist stark polarisiert: der C ist elektrophil, der O nucleophil/basisch.',
    'Reaktivität Aldehyd > Keton: zwei Alkylreste schieben mehr Elektronendichte an den C und schirmen ihn sterisch ab.',
    'Aus sp² wird sp³ — die planare Carbonylgruppe wird tetraedrisch, dabei kann ein Stereozentrum entstehen.',
    'Bei Carbonsäure-DERIVATEN folgt auf die Addition die Eliminierung der Abgangsgruppe (Additions-Eliminierungs-Mechanismus).'
  ],
  seen_in: 'Praktisch jede mehrstufige Synthese; explizit BW 2022 (Butanon-Reaktionen)'
});

R({
  id: 'grignard-addition', category: C_CO, name: 'Grignard-Reaktion',
  difficulty: 'A', reaktionstyp: 'A_N', transformation: 'R₂C=O + R₃MgX → R₂C(OH)–R₃',
  rx: (() => {
    const a = keton();
    const a2 = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₃'); const mg = m.add(B, 0, 'Mg'); const x = m.gen(2 * B, 0, 'X');
      m.bond(r, mg, 1); m.bond(mg, x, 1); return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁');
      const c = m.add(DX, DY, 'C');
      const o = m.add(DX, DY + B, 'O');
      const z = m.gen(2 * DX, 0, 'R₂');
      const n = m.gen(DX + B, DY, 'R₃');
      m.bond(r, c, 1); m.bond(c, o, 1); m.bond(c, z, 1); m.bond(c, n, 1);
      return m;
    })();
    return { reactants: [a, a2], products: [b] };
  })(),
  above: '1. R_3-MgX', below: '2. H_3O^+',
  conditions: 'Grignard-Reagenz aus R–X + Mg in wasserfreiem Ether/THF; die Addition läuft kalt, danach wird sauer aufgearbeitet.',
  stereochemistry: 'Racemat, falls am Carbonyl-C ein Stereozentrum entsteht.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · R₃ = Alkyl, Aryl, Vinyl · X = Cl, Br, I',
  key_points: [
    'Das Schlüsselwerkzeug zur C–C-Knüpfung: R₃ ist ein CARBANION-Äquivalent, also ein umgepoltes C-Nucleophil.',
    'Das Substrat bestimmt das Produkt: Methanal → primärer Alkohol, anderer Aldehyd → sekundärer, Keton → tertiärer Alkohol.',
    'Mit CO₂ entsteht die um ein C verlängerte Carbonsäure, mit Estern (2 Äq.) ein tertiärer Alkohol, mit Epoxiden ein um zwei C verlängerter Alkohol, mit Nitrilen ein Keton.',
    'ABSOLUT wasserfrei arbeiten — jedes acide H (OH, NH, SH, COOH, terminales Alkin) zerstört das Reagenz sofort.',
    'Deshalb müssen solche Gruppen im Substrat vorher geschützt werden.'
  ],
  seen_in: 'LW 2025 (1-Cyclohexylethanol), BW 2022 (Butanon), BW 2020 (Bergamoten), LW 2019'
});

R({
  id: 'grignard-co2', category: C_CO, name: 'Carboxylierung eines Grignard-Reagenzes',
  difficulty: 'B', reaktionstyp: 'A_N', transformation: 'R–MgX + CO₂ → R–COOH',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const mg = m.add(B, 0, 'Mg'); const x = m.gen(2 * B, 0, 'X');
      m.bond(r, mg, 1); m.bond(mg, x, 1); return m;
    })();
    const a2 = (() => {
      // CO2 is linear.
      const m = new Mol();
      const o1 = m.add(0, 0, 'O'); const c = m.add(B, 0, 'C'); const o2 = m.add(2 * B, 0, 'O');
      m.bond(o1, c, 2); m.bond(c, o2, 2); return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      const o1 = m.add(DX, DY + B, 'O'); const o2 = m.add(2 * DX, 0, 'O');
      m.bond(r, c, 1); m.bond(c, o1, 2); m.bond(c, o2, 1); return m;
    })();
    return { reactants: [a, a2], products: [b] };
  })(),
  above: '1. CO_2 (fest)', below: '2. H_3O^+',
  conditions: 'Grignard-Lösung auf Trockeneis gießen, dann sauer aufarbeiten.',
  substituents: 'R₁ = Alkyl, Aryl · X = Cl, Br, I',
  key_points: [
    'Verlängert die Kette um genau ein C — die Alternative zum Umweg über das Nitril.',
    'Aus Ar–Br wird so eine Benzoesäure, was durch Seitenkettenoxidation nicht ginge.',
    'Nur ein Äquivalent CO₂ addiert, weil das gebildete Carboxylat nicht weiterreagiert.'
  ],
  seen_in: 'BW 2025 (Fettsäure-Biosynthese, Carboxylierung), BW 2023 (Ibuprofen), BW 2020 (Bergamoten)'
});

R({
  id: 'cyanhydrin', category: C_CO, name: 'Cyanhydrin-Bildung',
  difficulty: 'B', reaktionstyp: 'A_N', transformation: 'R₂C=O + HCN → R₂C(OH)–C≡N',
  rx: (() => {
    const a = keton();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁');
      const c = m.add(DX, DY, 'C');
      const o = m.add(DX, DY + B, 'O');
      const z = m.gen(2 * DX, 0, 'R₂');
      // C≡N is linear with the bond that carries it.
      const cn = m.add(DX + B * Math.cos(Math.PI / 6), DY + B * Math.sin(Math.PI / 6), 'C');
      const n  = m.add(DX + 2 * B * Math.cos(Math.PI / 6), DY + 2 * B * Math.sin(Math.PI / 6), 'N');
      m.bond(r, c, 1); m.bond(c, o, 1); m.bond(c, z, 1); m.bond(c, cn, 1); m.bond(cn, n, 3);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'NaCN / KCN', below: 'H^+ (kat.)',
  conditions: 'Cyanid-Salz mit etwas Säure — HCN selbst ist zu wenig dissoziiert und hochgiftig, daher in situ.',
  stereochemistry: 'Racemat; enzymatisch (Oxynitrilasen) oder mit chiralem Katalysator auch enantioselektiv.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H — Ketone reagieren träger als Aldehyde',
  key_points: [
    'Reversibel: unter basischen Bedingungen zerfällt das Cyanhydrin wieder.',
    'Ein sehr nützliches Zwischenprodukt: Hydrolyse gibt die α-Hydroxycarbonsäure, Reduktion das 1,2-Aminoalkohol.',
    'Damit wird die Kette um ein C verlängert UND eine OH-Gruppe eingeführt.',
    'In der Natur als cyanogene Glykoside (Amygdalin) — daher der Bittermandelgeruch.'
  ],
  seen_in: 'BW 2022 (Butanon-Reaktionen), BW 2016 (Chloramphenicol), BW 2026 (Zuckerchemie)'
});

R({
  id: 'carbonyl-reduktion', category: C_CO, name: 'Reduktion zum Alkohol (NaBH₄ / LiAlH₄)',
  difficulty: 'A', reaktionstyp: 'A_N (Hydrid)', transformation: 'R₂C=O → R₂CH–OH',
  rx: (() => {
    const a = keton();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      const o = m.add(DX, DY + B, 'O'); const z = m.gen(2 * DX, 0, 'R₂');
      m.bond(r, c, 1); m.bond(c, o, 1); m.bond(c, z, 1); return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: '1. NaBH_4  bzw. LiAlH_4', below: '2. H_3O^+',
  conditions: 'NaBH₄ in MeOH/EtOH (mild, protische Solventien erlaubt); LiAlH₄ in wasserfreiem Ether/THF (heftig).',
  stereochemistry: 'Racemat am neuen Stereozentrum; mit CBS-Katalysator oder enzymatisch (NADH) enantioselektiv.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H',
  key_points: [
    'Der entscheidende Unterschied ist die Selektivität: NaBH₄ reduziert NUR Aldehyde und Ketone.',
    'LiAlH₄ reduziert zusätzlich Ester, Carbonsäuren, Amide und Nitrile — es macht alles nieder.',
    'Deshalb: soll ein Keton neben einem Ester überleben, nimmt man NaBH₄.',
    'Biochemisches Gegenstück ist NADH/NADPH, das ebenfalls ein Hydrid überträgt.'
  ],
  seen_in: 'BW 2021 (Carvon, Capsaicin), BW 2019 (Abscisinsäure), BW 2024 (Merrilacton A), BW 2026 (Xylit)'
});

R({
  id: 'acetal-schutz', category: C_CO, name: 'Acetal-Schutzgruppe',
  difficulty: 'B', reaktionstyp: 'A_N + Substitution', transformation: 'R₂C=O → cyclisches Acetal',
  rx: (() => {
    const a = keton();
    const p = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁');
      const c = m.add(DX, DY, 'C');
      const z = m.gen(2 * DX, 0, 'R₂');
      m.bond(r, c, 1); m.bond(c, z, 1);
      // Five-ring sitting on top of the acetal C: centre directly above it.
      const rr = B / (2 * Math.sin(Math.PI / 5));
      const cx = DX, cy = DY + rr;
      const v = [];
      for (let k = 0; k < 5; k++) {
        const ang = (270 + k * 72) * Math.PI / 180;
        v.push([cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)]);
      }
      // v[0] is the bottom vertex = the acetal carbon we already placed.
      const o1 = m.add(v[1][0], v[1][1], 'O');
      const c1 = m.add(v[2][0], v[2][1], 'C');
      const c2 = m.add(v[3][0], v[3][1], 'C');
      const o2 = m.add(v[4][0], v[4][1], 'O');
      m.bond(c, o1, 1); m.bond(o1, c1, 1); m.bond(c1, c2, 1); m.bond(c2, o2, 1); m.bond(o2, c, 1);
      return m;
    })();
    return { reactants: [a], products: [p] };
  })(),
  above: 'HO-CH_2CH_2-OH', below: 'H^+ (kat.), -H_2O',
  conditions: 'Ethylenglykol mit kat. TsOH/H₂SO₄, Wasser wird azeotrop ausgekreist (Wasserabscheider).',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · statt Glykol auch 2 × MeOH (offenkettiges Dimethylacetal)',
  key_points: [
    'Die wichtigste Schutzgruppe für Aldehyde und Ketone: das Acetal ist gegen Basen, Nucleophile, Grignard und LiAlH₄ völlig inert.',
    'Freisetzung durch wässrige Säure (H₃O⁺) — die ganze Sequenz ist eine Gleichgewichtsreaktion, gesteuert über die Wasserkonzentration.',
    'Aldehyde lassen sich neben Ketonen selektiv schützen, weil sie schneller reagieren.',
    'Derselbe Mechanismus liegt der Halbacetal-/Vollacetalbildung bei Zuckern zugrunde (Pyranose/Furanose, Glykoside).'
  ],
  seen_in: 'BW 2021 (Carvon), BW 2026 (Adrenosteron), BW 2019 (Abscisinsäure), BW 2026 (Zucker)'
});

R({
  id: 'iminbildung', category: C_CO, name: 'Imin- (Schiff-Base-) Bildung',
  difficulty: 'B', reaktionstyp: 'A_N + Kondensation', transformation: 'R₂C=O + R₃NH₂ → R₂C=N–R₃',
  rx: (() => {
    const a = keton();
    const a2 = (() => { const m = new Mol();
      const r = m.gen(0, 0, 'R₃'); const n = m.add(DX, DY, 'N'); m.bond(r, n, 1); return m; })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      const n = m.add(DX, DY + B, 'N');
      const r3 = m.gen(DX + DX, DY + B + DY, 'R₃');
      const z = m.gen(2 * DX, 0, 'R₂');
      m.bond(r, c, 1); m.bond(c, n, 2); m.bond(n, r3, 1); m.bond(c, z, 1);
      return m;
    })();
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'R_3-NH_2', below: 'pH ≈ 4–5, -H_2O',
  conditions: 'Primäres Amin, schwach sauer (pH 4–5), Wasserabscheidung.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · R₃ = Alkyl, Aryl · mit H₂N–OH entsteht das Oxim, mit H₂N–NH₂ das Hydrazon',
  key_points: [
    'Der pH ist ein Kompromiss: Säure braucht es, um das Halbaminal-OH zu protonieren, aber zu viel Säure protoniert das Amin und nimmt ihm die Nucleophilie.',
    'Mit SEKUNDÄREN Aminen ist am N kein H mehr übrig → es entsteht stattdessen ein ENAMIN.',
    'Reversibel; Imine hydrolysieren in Wasser zurück, was die reduktive Aminierung nutzt.',
    'Biochemisch zentral: PLP (Pyridoxalphosphat) arbeitet über genau diese Schiff-Base bei Transaminierungen.'
  ],
  seen_in: 'BW 2025 (Phenylketonurie, PLP), BW 2017 (Atropin, Ferruginin), BW 2026 (Maillard-Reaktion)'
});

R({
  id: 'enaminbildung', category: C_CO, name: 'Enamin-Bildung',
  difficulty: 'C', reaktionstyp: 'A_N + Kondensation', transformation: 'Keton + R₂NH → Enamin',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const ca = m.add(DX, DY, 'C');
      const c = m.add(2 * DX, 0, 'C'); const o = m.add(2 * DX, -B, 'O');
      const z = m.gen(3 * DX, DY, 'R₂');
      m.bond(r, ca, 1); m.bond(ca, c, 1); m.bond(c, o, 2); m.bond(c, z, 1);
      return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const ca = m.add(DX, DY, 'C');
      const c = m.add(2 * DX, 0, 'C'); const n = m.add(2 * DX, -B, 'N');
      const z = m.gen(3 * DX, DY, 'R₂');
      const n1 = m.gen(2 * DX - DX, -B - DY, 'R₃');
      const n2 = m.gen(2 * DX + DX, -B - DY, 'R₄');
      m.bond(r, ca, 1); m.bond(ca, c, 2); m.bond(c, n, 1); m.bond(c, z, 1);
      m.bond(n, n1, 1); m.bond(n, n2, 1);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'R_3R_4NH (Pyrrolidin, Morpholin)', below: 'H^+ (kat.), -H_2O',
  conditions: 'Sekundäres Amin — meist Pyrrolidin oder Morpholin — mit kat. Säure und Wasserabscheider.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · R₃, R₄ = Alkyl, im Ring verbunden (Pyrrolidin, Piperidin, Morpholin)',
  key_points: [
    'Weil dem sekundären Amin das zweite N–H fehlt, wird statt zum Imin zum ENAMIN eliminiert.',
    'Das Enamin ist am β-C nucleophil — es ist ein neutrales Enolat-Äquivalent.',
    'Genau das nutzt die Stork-Enamin-Alkylierung: alkylieren/acylieren, dann hydrolysieren zurück zum Keton.',
    'Vorteil gegenüber dem echten Enolat: keine starke Base nötig, keine Mehrfachalkylierung.'
  ],
  seen_in: 'BW 2022 (Cantharidin, Pyrrolidin), BW 2020 (Aspidospermin — Stork-Synthese)'
});

R({
  id: 'reduktive-aminierung', category: C_CO, name: 'Reduktive Aminierung',
  difficulty: 'B', reaktionstyp: 'A_N + Reduktion', transformation: 'R₂C=O + R₃NH₂ → R₂CH–NH–R₃',
  rx: (() => {
    const a = keton();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      const n = m.add(DX, DY + B, 'N');
      const r3 = m.gen(DX + DX, DY + B + DY, 'R₃');
      const z = m.gen(2 * DX, 0, 'R₂');
      m.bond(r, c, 1); m.bond(c, n, 1); m.bond(n, r3, 1); m.bond(c, z, 1);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'R_3-NH_2, NaBH_3CN', below: 'pH ≈ 6, MeOH',
  conditions: 'Amin und Carbonyl in Gegenwart von NaBH₃CN (oder NaBH(OAc)₃); das Imin wird reduziert, sobald es entsteht.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · R₃–NH₂ = primäres oder sekundäres Amin, auch NH₃',
  key_points: [
    'Die saubere Alternative zur N-Alkylierung mit R–X: sie bleibt auf der gewünschten Stufe stehen, ohne Überalkylierung.',
    'NaBH₃CN ist der Trick — es ist so milde, dass es bei pH 6 das Keton NICHT angreift, wohl aber das protonierte Imin.',
    'Mit NaBH₄ funktioniert es nicht, weil das Keton sofort zum Alkohol reduziert würde.',
    'Biochemisch die Umkehr der Transaminierung.'
  ],
  seen_in: 'BW 2017 (Ferruginin), BW 2023 (Lidocain-Analoga), LW 2026 (Fentanyl)'
});

R({
  id: 'wittig', category: C_CO, name: 'Wittig-Reaktion',
  difficulty: 'B', reaktionstyp: 'A_N + Olefinierung', transformation: 'R₂C=O + Ph₃P=CR₃R₄ → R₂C=CR₃R₄',
  rx: (() => {
    const a = keton();
    const a2 = (() => {
      const m = new Mol();
      const p = m.gen(0, 0, 'Ph₃P'); const c = m.add(B, 0, 'C');
      const r3 = m.gen(B + DX, DY, 'R₃'); const r4 = m.gen(B + DX, -DY, 'R₄');
      m.bond(p, c, 2); m.bond(c, r3, 1); m.bond(c, r4, 1); return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c1 = m.add(DX, DY, 'C');
      const z = m.gen(2 * DX, 0, 'R₂');
      const c2 = m.add(DX, DY + B, 'C');
      const r3 = m.gen(DX - DX, DY + B + DY, 'R₃');
      const r4 = m.gen(DX + DX, DY + B + DY, 'R₄');
      m.bond(r, c1, 1); m.bond(c1, z, 1); m.bond(c1, c2, 2); m.bond(c2, r3, 1); m.bond(c2, r4, 1);
      return m;
    })();
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'Ph_3P=CR_3R_4', below: 'THF  ·  -Ph_3P=O',
  conditions: 'Das Ylid entsteht aus Ph₃P + R–X (S_N2) und anschließender Deprotonierung mit starker Base (BuLi, NaH, NaOEt).',
  stereochemistry: 'Nicht stabilisierte Ylide (R = Alkyl) geben überwiegend das (Z)-Alken; stabilisierte Ylide (R = Ester, Keton) überwiegend das (E)-Alken. Die HWE-Variante mit Phosphonaten liefert sehr sauber (E).',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H · R₃, R₄ = H, Alkyl, Aryl, CO₂R',
  key_points: [
    'Der große Vorteil: die Lage der neuen Doppelbindung ist EINDEUTIG — genau dort, wo vorher das O saß. Eine Eliminierung könnte das nicht garantieren.',
    'Triebkraft ist die sehr starke P=O-Bindung im Triphenylphosphinoxid.',
    'Über das viergliedrige Oxaphosphetan als Zwischenstufe.',
    'Horner-Wadsworth-Emmons (HWE) nutzt Phosphonate (EtO)₂P(O)CHR⁻: wasserlösliches Nebenprodukt und hohe E-Selektivität.'
  ],
  seen_in: 'BW 2019 (Abscisinsäure), BW 2022 (Z-Jasmon), BW 2020 (Prostaglandin), BW 2024 (Vitamin E)'
});

R({
  id: 'oxim-hydrazon', category: C_CO, name: 'Oxim- und Hydrazon-Bildung',
  difficulty: 'B', reaktionstyp: 'A_N + Kondensation', transformation: 'R₂C=O → R₂C=N–OH bzw. R₂C=N–NH₂',
  rx: (() => {
    const a = keton();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      const n = m.add(DX, DY + B, 'N');
      const o = m.add(DX + DX, DY + B + DY, 'O');
      const z = m.gen(2 * DX, 0, 'R₂');
      m.bond(r, c, 1); m.bond(c, n, 2); m.bond(n, o, 1); m.bond(c, z, 1);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'H_2N-OH  bzw. H_2N-NH_2', below: 'H^+ (kat.), -H_2O',
  conditions: 'Hydroxylamin (→ Oxim), Hydrazin (→ Hydrazon) oder ein Sulfonylhydrazid ArSO₂NHNH₂ (→ Tosylhydrazon), jeweils schwach sauer.',
  stereochemistry: 'Oxime treten als E/Z-Isomere auf — bei der Beckmann-Umlagerung wandert der zum OH ANTI stehende Rest.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H',
  key_points: [
    'Klassisch als kristalline Derivate zur Identifizierung von Aldehyden/Ketonen (scharfe Schmelzpunkte).',
    'Das Oxim ist die Vorstufe der Beckmann-Umlagerung zum Amid/Lactam (Caprolactam → Nylon-6).',
    'Das Hydrazon ist die Vorstufe der Wolff-Kishner-Reduktion (C=O → CH₂).',
    'Das Tosylhydrazon führt mit Base zur Shapiro-Reaktion (→ Vinyllithium/Alken).'
  ],
  seen_in: 'BW 2021 (Carvon, Hydroxylamin), BW 2022 (Cantharidin, ArSO₂NHNH₂), BW 2018 (Colchicin)'
});

R({
  id: 'wolff-kishner-clemmensen', category: C_CO, name: 'C=O → CH₂ — Wolff-Kishner und Clemmensen',
  difficulty: 'C', reaktionstyp: 'Reduktion', transformation: 'R₂C=O → R₂CH₂',
  rx: (() => {
    const a = keton();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C'); const z = m.gen(2 * DX, 0, 'R₂');
      m.bond(r, c, 1); m.bond(c, z, 1); return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'N_2H_4 / KOH, Δ', below: 'bzw. Zn(Hg) / konz. HCl',
  conditions: 'Wolff-Kishner: Hydrazin + starke Base (KOH, KO^tBu) in hochsiedendem Solvens, 150–200 °C — für BASENstabile Substrate. Clemmensen: Zinkamalgam in konz. HCl — für SÄUREstabile Substrate.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H',
  key_points: [
    'Zwei Methoden für dieselbe Umwandlung, mit komplementären Bedingungen — man wählt nach dem, was der Rest des Moleküls verträgt.',
    'Wolff-Kishner läuft über das Hydrazon, das unter N₂-Abspaltung zum Carbanion zerfällt.',
    'Zusammen mit der Friedel-Crafts-Acylierung ergibt das den unverzweigten Alkylaromaten, den die direkte Alkylierung wegen Umlagerung nicht liefert.',
    'Milde Alternative: Thioacetal bilden und mit Raney-Nickel desulfurieren — neutral, für empfindliche Substrate.'
  ],
  seen_in: 'BW 2021 (Thymol), BW 2022 (Cantharidin, RaNi), BW 2019 (Twistan, N₂H₄), BW 2018 (Colchicin)'
});

R({
  id: 'thioacetal-raney', category: C_CO, name: 'Thioacetal + Raney-Nickel (neutrale C=O → CH₂)',
  difficulty: 'C', reaktionstyp: 'Schutz + Reduktion', transformation: 'R₂C=O → Dithiolan → R₂CH₂',
  rx: (() => {
    const a = keton();
    const b = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C'); const z = m.gen(2 * DX, 0, 'R₂');
      m.bond(r, c, 1); m.bond(c, z, 1);
      const rr = B / (2 * Math.sin(Math.PI / 5));
      const cx = DX, cy = DY + rr;
      const v = [];
      for (let k = 0; k < 5; k++) {
        const ang = (270 + k * 72) * Math.PI / 180;
        v.push([cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)]);
      }
      const s1 = m.add(v[1][0], v[1][1], 'S');
      const c1 = m.add(v[2][0], v[2][1], 'C');
      const c2 = m.add(v[3][0], v[3][1], 'C');
      const s2 = m.add(v[4][0], v[4][1], 'S');
      m.bond(c, s1, 1); m.bond(s1, c1, 1); m.bond(c1, c2, 1); m.bond(c2, s2, 1); m.bond(s2, c, 1);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'HS-CH_2CH_2-SH', below: 'BF_3 · Et_2O   (dann Raney-Ni)',
  conditions: '1,2-Ethandithiol mit BF₃·Et₂O oder Lewis-Säure; anschließend Raney-Nickel in Ethanol.',
  substituents: 'R₁, R₂ = Alkyl, Aryl, H',
  key_points: [
    'Die neutrale dritte Möglichkeit neben Wolff-Kishner (basisch) und Clemmensen (sauer).',
    'Das Dithiolan ist außerdem eine Schutzgruppe, die gegen wässrige Säure stabil ist — im Gegensatz zum O-Acetal.',
    'Umpolung nach Corey-Seebach: das Dithian-C lässt sich mit BuLi deprotonieren und wird so vom Elektrophil zum NUCLEOPHIL.',
    'Raney-Ni entfernt den Schwefel reduktiv und hinterlässt die CH₂-Gruppe.'
  ],
  seen_in: 'BW 2022 (Cantharidin, RaNi), BW 2026 (Adrenosteron, HSCH₂CH₂SH)'
});

};
