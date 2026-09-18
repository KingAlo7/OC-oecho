/* Reaction library — Aromatenchemie.

   House orientation: the benzene ring is drawn with a NODE at the top and
   at the bottom (vertical bonds on the left and right flanks). The
   substituent leaves the ring at vertex 0 — upper right, 30° — and it
   leaves RADIALLY: every substituent atom lies on the ray from the ring
   centre through that vertex, so the first bond continues the C–C vector
   outwards instead of meeting the ring at a kink. */

module.exports = function (ctx) {
const { R, Mol, B, DX, DY } = ctx;

const C_AR = 'Aromatische Substitution';

/* Outward unit vector at vertex 0 (30°). */
const OX = Math.cos(Math.PI / 6), OY = Math.sin(Math.PI / 6);

/* The point `step` bond lengths out from the ring centre along that ray. */
const out = step => [(B + B * step) * OX, (B + B * step) * OY];

/* A point `len` from p in direction `deg` — for hanging the second and
   third atom off a substituent at proper 120° angles to the Ar–X bond
   (which itself runs at 30°). */
const from = (p, deg, len) => [
  p[0] + (len == null ? B : len) * Math.cos(deg * Math.PI / 180),
  p[1] + (len == null ? B : len) * Math.sin(deg * Math.PI / 180)
];

/* Benzene on the origin; `build(m, v0, v)` hangs the substituent on. */
function arylWith(build) {
  const m = new Mol();
  const v = m.benzene(0, 0, B);
  if (build) build(m, v[0], v);
  return m;
}

R({
  id: 'se-aromat-allgemein', category: C_AR, name: 'S_E am Aromaten — allgemeines Schema',
  difficulty: 'A', reaktionstyp: 'S_E(Ar)', transformation: 'Ar–H → Ar–E',
  rx: (() => {
    const a = arylWith();
    const b = arylWith((m, v0) => { const p = out(1); const e = m.gen(p[0], p[1], 'E'); m.bond(v0, e, 1); });
    return { reactants: [a], products: [b] };
  })(),
  above: 'E^+', below: 'Katalysator',
  conditions: 'Elektrophil wird meist erst durch eine Lewis- oder Brønsted-Säure erzeugt (AlCl₃, FeBr₃, H₂SO₄).',
  substituents: 'E⁺ = NO₂⁺, SO₃/SO₃H⁺, Br⁺, R⁺ (Carbenium), RCO⁺ (Acylium), ArN₂⁺',
  key_points: [
    'Immer zweistufig: Angriff des Elektrophils → σ-Komplex (Arenium-Ion, Wheland) → Rückgewinnung der Aromatizität durch H⁺-Abgabe.',
    'Geschwindigkeitsbestimmend ist der ERSTE Schritt, weil dabei die Aromatizität verloren geht.',
    'Substitution statt Addition, weil nur so der Aromat erhalten bleibt (Energiegewinn).',
    'Dirigierung: +M/+I-Gruppen (–OH, –OR, –NR₂, –R) aktivieren und lenken ortho/para; –M/–I-Gruppen (–NO₂, –CN, –COR, –SO₃H) desaktivieren und lenken meta. Halogene sind die Ausnahme: desaktivierend, aber ortho/para-dirigierend.'
  ],
  seen_in: 'BW 2021 (Thymol), BW 2016 (Prontosil), LW 2019, BW 2026 (Thymol)'
});

R({
  id: 'nitrierung', category: C_AR, name: 'Nitrierung',
  difficulty: 'A', reaktionstyp: 'S_E(Ar)', transformation: 'Ar–H → Ar–NO₂',
  rx: (() => {
    const a = arylWith();
    const b = arylWith((m, v0) => {
      const p = out(1);
      const n = m.add(p[0], p[1], 'N');
      // 120° either side of the Ar–N bond, which runs at 30°.
      const a1 = from(p, 90), a2 = from(p, -30);
      const o1 = m.add(a1[0], a1[1], 'O');
      const o2 = m.add(a2[0], a2[1], 'O');
      m.bond(v0, n, 1); m.bond(n, o1, 2); m.bond(n, o2, 1);
      m.charge(n, 1); m.charge(o2, -1);
    });
    return { reactants: [a], products: [b] };
  })(),
  above: 'HNO_3', below: 'konz. H_2SO_4, < 50 °C',
  conditions: 'Nitriersäure = HNO₃ + konz. H₂SO₄; die Schwefelsäure erzeugt das Nitronium-Ion NO₂⁺.',
  substituents: 'Ar = Benzol und Derivate. Aktivierte Ringe (Phenol, Anilin) nitrieren schon mit verd. HNO₃.',
  key_points: [
    'Das eigentliche Elektrophil ist NO₂⁺, gebildet aus HNO₃ + 2 H₂SO₄ → NO₂⁺ + H₃O⁺ + 2 HSO₄⁻.',
    'Die eingeführte NO₂-Gruppe desaktiviert stark und lenkt meta — eine Zweitnitrierung braucht drastischere Bedingungen.',
    'Fast immer der Einstieg in aromatische Amine: nitrieren, dann reduzieren.',
    'Bei Anilin muss das N erst acetyliert werden, sonst protoniert die Säure es zum meta-dirigierenden Anilinium-Ion.'
  ],
  seen_in: 'BW 2023 (Benzocain), BW 2016 (Prontosil), LW 2024 (Rohypnol), BW 2026 (Adrenosteron-Vorstufen)'
});

R({
  id: 'sulfonierung', category: C_AR, name: 'Sulfonierung',
  difficulty: 'B', reaktionstyp: 'S_E(Ar)', transformation: 'Ar–H → Ar–SO₃H',
  rx: (() => {
    const a = arylWith();
    const b = arylWith((m, v0) => {
      const p = out(1);
      const s = m.add(p[0], p[1], 'S');
      const a1 = from(p, 90), a2 = from(p, -30), a3 = out(2);
      const o1 = m.add(a1[0], a1[1], 'O');
      const o2 = m.add(a2[0], a2[1], 'O');
      const o3 = m.add(a3[0], a3[1], 'O');
      m.bond(v0, s, 1); m.bond(s, o1, 2); m.bond(s, o2, 2); m.bond(s, o3, 1);
    });
    return { reactants: [a], products: [b] };
  })(),
  above: 'SO_3 / konz. H_2SO_4', below: 'bzw. ClSO_3H',
  conditions: 'Oleum (SO₃ in H₂SO₄) oder Chlorsulfonsäure ClSO₃H (liefert direkt das Sulfonylchlorid).',
  substituents: 'Ar = Benzol und Derivate',
  key_points: [
    'Die einzige S_E am Aromaten, die REVERSIBEL ist — mit heißem verdünntem H₂SO₄/H₂O geht sie wieder weg.',
    'Genau deshalb als abnehmbare Schutz-/Blockiergruppe einsetzbar: para blockieren, ortho substituieren, SO₃H wieder abkochen.',
    'ClSO₃H liefert direkt Ar–SO₂Cl, den Einstieg in Sulfonamide (Sulfonamid-Antibiotika!).'
  ],
  seen_in: 'BW 2016 (Prontosil, Sulfonamide), BW 2021 (p-Cymol/Thymol)'
});

R({
  id: 'halogenierung-aromat', category: C_AR, name: 'Kernhalogenierung',
  difficulty: 'A', reaktionstyp: 'S_E(Ar)', transformation: 'Ar–H → Ar–Br',
  rx: (() => {
    const a = arylWith();
    const b = arylWith((m, v0) => { const p = out(1); const br = m.add(p[0], p[1], 'Br'); m.bond(v0, br, 1); });
    return { reactants: [a], products: [b] };
  })(),
  above: 'Br_2', below: 'FeBr_3 (kat.)',
  conditions: 'Br₂ mit FeBr₃ oder Fe; Cl₂ mit AlCl₃/FeCl₃. Die Lewis-Säure polarisiert das Halogen zu „Br⁺".',
  substituents: 'Ar = Benzol und Derivate · X = Cl, Br (I braucht ein Oxidationsmittel, F ist zu heftig)',
  key_points: [
    'OHNE Lewis-Säure und MIT Licht läuft stattdessen die radikalische Seitenkettenhalogenierung — die Bedingungen entscheiden, nicht das Substrat.',
    'Phenole und Aniline sind so aktiviert, dass sie ohne Katalysator sofort dreifach bromieren (2,4,6-Tribromphenol).',
    'Halogene sind der Sonderfall: −I desaktiviert den Ring, +M dirigiert trotzdem ortho/para.'
  ],
  seen_in: 'BW 2024 (Warm-up), LW 2023 (Tazaroten), BW 2023 (Ibuprofen)'
});

R({
  id: 'friedel-crafts-alkylierung', category: C_AR, name: 'Friedel-Crafts-Alkylierung',
  difficulty: 'B', reaktionstyp: 'S_E(Ar)', transformation: 'Ar–H + R–X → Ar–R',
  rx: (() => {
    const a = arylWith();
    const a2 = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const x = m.gen(DX, DY, 'X'); m.bond(r, x, 1); return m;
    })();
    const b = arylWith((m, v0) => { const p = out(1); const r = m.gen(p[0], p[1], 'R₁'); m.bond(v0, r, 1); });
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'AlCl_3 (kat.)', below: 'wasserfrei',
  conditions: 'R–X mit AlCl₃/FeCl₃; ebenso aus Alkenen + H⁺ oder Alkoholen + Lewis-Säure (jeweils über dasselbe Carbenium-Ion).',
  substituents: 'R₁ = Alkyl (kein Aryl/Vinyl — deren Kationen sind zu instabil) · X = Cl, Br',
  key_points: [
    'Zwei bekannte Schwächen: (1) das Carbenium-Ion LAGERT UM, aus n-Propylchlorid wird Isopropylbenzol; (2) das Produkt ist aktivierter als das Edukt → MEHRFACHALKYLIERUNG.',
    'Beide Probleme umgeht die Friedel-Crafts-Acylierung mit anschließender Reduktion.',
    'Funktioniert nicht an stark desaktivierten Ringen (Nitrobenzol) und nicht an freien Aminen (das N bindet die Lewis-Säure).'
  ],
  seen_in: 'BW 2021 (Thymol aus p-Cymol), BW 2023 (Ibuprofen), LW 2017 (Papaverin)'
});

R({
  id: 'friedel-crafts-acylierung', category: C_AR, name: 'Friedel-Crafts-Acylierung',
  difficulty: 'B', reaktionstyp: 'S_E(Ar)', transformation: 'Ar–H + R–COCl → Ar–CO–R',
  rx: (() => {
    const a = arylWith();
    const a2 = (() => {
      const m = new Mol();
      const r = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      const o = m.add(DX, DY + B, 'O'); const cl = m.add(2 * DX, 0, 'Cl');
      m.bond(r, c, 1); m.bond(c, o, 2); m.bond(c, cl, 1); return m;
    })();
    const b = arylWith((m, v0) => {
      const p = out(1);
      const c = m.add(p[0], p[1], 'C');
      const po = from(p, 90), pr = from(p, -30);
      const o = m.add(po[0], po[1], 'O');
      const r = m.gen(pr[0], pr[1], 'R₁');
      m.bond(v0, c, 1); m.bond(c, o, 2); m.bond(c, r, 1);
    });
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'AlCl_3 (stöchiom.)', below: 'wasserfrei',
  conditions: 'Säurechlorid oder -anhydrid mit AlCl₃; die Lewis-Säure wird vom Produktketon komplexiert, daher STÖCHIOMETRISCH nötig.',
  substituents: 'R₁ = Alkyl, Aryl · statt R–COCl auch (R–CO)₂O',
  key_points: [
    'Das Acylium-Ion R–C≡O⁺ ist mesomeriestabilisiert — es lagert NICHT um.',
    'Das Produktketon desaktiviert den Ring, deshalb gibt es keine Mehrfachacylierung.',
    'Acylierung + Clemmensen/Wolff-Kishner ist der saubere Weg zu unverzweigten Alkylaromaten, den die Alkylierung nicht liefert.',
    'Intramolekular ist es die Standardmethode für anellierte Ringsysteme (Tetralone).'
  ],
  seen_in: 'BW 2023 (Ibuprofen), LW 2023 (Tazaroten), BW 2018 (Colchicin), BW 2020 (Aspidospermin)'
});

R({
  id: 'nitro-reduktion', category: C_AR, name: 'Reduktion Ar–NO₂ → Ar–NH₂',
  difficulty: 'A', reaktionstyp: 'Reduktion', transformation: 'Ar–NO₂ → Ar–NH₂',
  rx: (() => {
    const a = arylWith((m, v0) => {
      const p = out(1);
      const n = m.add(p[0], p[1], 'N');
      const a1 = from(p, 90), a2 = from(p, -30);
      const o1 = m.add(a1[0], a1[1], 'O');
      const o2 = m.add(a2[0], a2[1], 'O');
      m.bond(v0, n, 1); m.bond(n, o1, 2); m.bond(n, o2, 1);
      m.charge(n, 1); m.charge(o2, -1);
    });
    const b = arylWith((m, v0) => { const p = out(1); const n = m.add(p[0], p[1], 'N'); m.bond(v0, n, 1); });
    return { reactants: [a], products: [b] };
  })(),
  above: 'Fe / HCl', below: 'bzw. H_2, Pd/C  ·  SnCl_2  ·  Zn',
  conditions: 'Fe oder Zn in HCl/Essigsäure, SnCl₂, oder katalytische Hydrierung H₂/Pd-C.',
  substituents: 'Ar = beliebiger Aromat · in Gegenwart empfindlicher Gruppen ist SnCl₂ oder Na₂S selektiver',
  key_points: [
    'Der Standardweg zu aromatischen Aminen, weil eine direkte Aminierung des Rings nicht geht.',
    'Verläuft über Nitroso- und Hydroxylamin-Stufen.',
    'Kehrt die Dirigierung völlig um: aus der meta-dirigierenden, desaktivierenden NO₂ wird die stark aktivierende, ortho/para-dirigierende NH₂.',
    'H₂/Pd reduziert unselektiv mit — sind C=C im Molekül, nimmt man Fe/HCl oder SnCl₂.'
  ],
  seen_in: 'BW 2023 (Benzocain, Lidocain), BW 2016 (Prontosil, Chloramphenicol), LW 2024 (Rohypnol)'
});

R({
  id: 'diazotierung', category: C_AR, name: 'Diazotierung',
  difficulty: 'B', reaktionstyp: 'Substitution am N', transformation: 'Ar–NH₂ → Ar–N₂⁺',
  rx: (() => {
    const a = arylWith((m, v0) => { const p = out(1); const n = m.add(p[0], p[1], 'N'); m.bond(v0, n, 1); });
    const b = arylWith((m, v0) => {
      // Ar–N≡N⁺ is linear, so both N sit on the ring's outward ray.
      const p1 = out(1), p2 = out(2);
      const n1 = m.add(p1[0], p1[1], 'N');
      const n2 = m.add(p2[0], p2[1], 'N');
      m.bond(v0, n1, 1); m.bond(n1, n2, 3); m.charge(n1, 1);
    });
    return { reactants: [a], products: [b] };
  })(),
  above: 'NaNO_2 / HCl', below: '0–5 °C',
  conditions: 'NaNO₂ + verd. HCl bei 0–5 °C — die Temperatur ist kritisch, oberhalb ~10 °C zerfällt das Diazoniumsalz zu Phenol + N₂.',
  substituents: 'Ar = aromatischer Rest. ALIPHATISCHE Diazoniumsalze sind nicht fassbar — sie verlieren sofort N₂.',
  key_points: [
    'In situ entsteht salpetrige Säure HNO₂ und daraus das Nitrosyl-Kation NO⁺.',
    'Das Diazoniumsalz ist mesomeriestabilisiert und deshalb kurzzeitig haltbar — daher der Unterschied zur aliphatischen Reihe.',
    'N₂ ist die beste Abgangsgruppe überhaupt: Sandmeyer (CuCl/CuBr/CuCN), Hydrolyse zu Phenol, Reduktion mit H₃PO₂ zu Ar–H.',
    'Oder eben Azokupplung — dann wirkt es als Elektrophil.'
  ],
  seen_in: 'BW 2023 (Methylorange), BW 2016 (Prontosil), BW 2021 (Coffein-Vorstufen)'
});

R({
  id: 'azokupplung', category: C_AR, name: 'Azokupplung',
  difficulty: 'B', reaktionstyp: 'S_E(Ar)', transformation: 'Ar–N₂⁺ + Ar′–H → Ar–N=N–Ar′',
  rx: (() => {
    const a = arylWith((m, v0) => {
      const p1 = out(1), p2 = out(2);
      const n1 = m.add(p1[0], p1[1], 'N');
      const n2 = m.add(p2[0], p2[1], 'N');
      m.bond(v0, n1, 1); m.bond(n1, n2, 3); m.charge(n1, 1);
    });
    /* Coupling partner: the donor sits para to the position that reacts,
       so it hangs off vertex 3 (lower left) pointing away from the ring. */
    const a2 = (() => {
      const m = new Mol();
      const v = m.benzene(0, 0, B);
      const d = m.radial(0, 0, v[3], B);
      m.bond(v[3], m.gen(d[0], d[1], 'D'), 1);
      return m;
    })();
    const b = (() => {
      const m = new Mol();
      const v = m.benzene(0, 0, B);
      // N=N is bent (~120° at each N) — unlike the linear diazonium.
      const p1 = out(1);
      const n1 = m.add(p1[0], p1[1], 'N');
      const p2 = from(p1, -30);
      const n2 = m.add(p2[0], p2[1], 'N');
      // Second ring meets N2 at its vertex 3, the bond running at 30°.
      const cx = p2[0] + 2 * B * OX, cy = p2[1] + 2 * B * OY;
      const v2 = m.benzene(cx, cy, B);
      const dp = m.radial(cx, cy, v2[0], B);
      const d = m.gen(dp[0], dp[1], 'D');
      m.bond(v[0], n1, 1); m.bond(n1, n2, 2); m.bond(n2, v2[3], 1); m.bond(v2[0], d, 1);
      return m;
    })();
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'pH 8–10 (Phenol)', below: 'bzw. pH 4–6 (Amin), 0–5 °C',
  conditions: 'Diazoniumsalz + elektronenreicher Aromat, 0–5 °C. Phenole kuppeln schwach alkalisch (als Phenolat), Amine schwach sauer.',
  substituents: 'Ar = Aryl aus dem Diazoniumsalz · D = starker Donor: –OH, –O⁻, –NR₂, –NH₂ · Kupplung fast immer in PARA-Stellung zum Donor',
  key_points: [
    'Das Diazonium-Ion ist ein SCHWACHES Elektrophil — es braucht einen stark aktivierten Partner (Phenol, Anilin).',
    'Der pH ist die Gratwanderung: zu alkalisch zerstört das Diazoniumsalz (→ Diazotat), zu sauer protoniert das Amin.',
    'Das durchkonjugierte Azo-System –N=N– ist das Chromophor: daher sind Azoverbindungen die größte Farbstoffklasse.',
    'Methylorange ist zugleich Indikator, weil Protonierung die Konjugation und damit die Farbe ändert.'
  ],
  seen_in: 'BW 2023 (Methylorange), BW 2016 (Prontosil)'
});

R({
  id: 'seitenketten-oxidation', category: C_AR, name: 'Oxidation der Seitenkette zur Benzoesäure',
  difficulty: 'B', reaktionstyp: 'Oxidation', transformation: 'Ar–CH₂–R → Ar–COOH',
  rx: (() => {
    const a = arylWith((m, v0) => {
      const p = out(1);
      const c = m.add(p[0], p[1], 'C');
      const pr = from(p, -30);
      const r = m.gen(pr[0], pr[1], 'R₁');
      m.bond(v0, c, 1); m.bond(c, r, 1);
    });
    const b = arylWith((m, v0) => {
      const p = out(1);
      const c = m.add(p[0], p[1], 'C');
      const po = from(p, 90), ph = from(p, -30);
      const o1 = m.add(po[0], po[1], 'O');
      const o2 = m.add(ph[0], ph[1], 'O');
      m.bond(v0, c, 1); m.bond(c, o1, 2); m.bond(c, o2, 1);
    });
    return { reactants: [a], products: [b] };
  })(),
  above: 'KMnO_4 / H^+, Δ', below: 'bzw. K_2Cr_2O_7 / H_2SO_4',
  conditions: 'Heißes KMnO₄ oder K₂Cr₂O₇ in Säure, oder verdünnte HNO₃; drastische Bedingungen.',
  substituents: 'R₁ = beliebiger Alkylrest — die ganze Kette wird bis auf das benzylische C abgebaut',
  key_points: [
    'Egal wie lang die Seitenkette ist: es bleibt immer genau ein C übrig, die Benzoesäure.',
    'Voraussetzung ist ein benzylisches H — tert-Butylbenzol ist deshalb inert.',
    'Der aromatische Ring selbst überlebt; er ist gegen diese Oxidationsmittel stabil.',
    'Bei p-Xylol entsteht Terephthalsäure — der PET-Baustein.'
  ],
  seen_in: 'BW 2021 (p-Cymol → Thymol-Route), BW 2022 (Butanon-Reaktionen)'
});

R({
  id: 'benzylische-halogenierung', category: C_AR, name: 'Radikalische Seitenkettenhalogenierung',
  difficulty: 'B', reaktionstyp: 'S_R', transformation: 'Ar–CH₃ → Ar–CH₂Br',
  rx: (() => {
    const a = arylWith((m, v0) => { const p = out(1); const c = m.add(p[0], p[1], 'C'); m.bond(v0, c, 1); });
    const b = arylWith((m, v0) => {
      const p = out(1);
      const c = m.add(p[0], p[1], 'C');
      const pb = from(p, -30);
      const br = m.add(pb[0], pb[1], 'Br');
      m.bond(v0, c, 1); m.bond(c, br, 1);
    });
    return { reactants: [a], products: [b] };
  })(),
  above: 'NBS  bzw. Br_2', below: 'hν / CCl_4, kein AlCl_3',
  conditions: 'N-Bromsuccinimid (NBS) in CCl₄ mit Licht oder Radikalstarter (AIBN); oder Br₂ mit hν. KEINE Lewis-Säure.',
  substituents: 'Ar = Aromat · greift ausschließlich das BENZYLISCHE C an',
  key_points: [
    'Die Selektivität kommt von der Stabilität des benzylischen Radikals (Delokalisierung in den Ring).',
    'Direkter Gegensatz zur Kernhalogenierung: hν + kein Katalysator → Seitenkette; Lewis-Säure + dunkel → Ring.',
    'NBS hält die Br₂-Konzentration niedrig und unterdrückt so die konkurrierende ionische Addition an C=C.',
    'Dieselben Bedingungen halogenieren allylische Positionen.'
  ],
  seen_in: 'BW 2021 (Capsaicin), LW 2023 (Tazaroten), BW 2018 (Kaffeesäure)'
});

};
