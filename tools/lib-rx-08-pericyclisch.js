/* Reaction library — Pericyclische Reaktionen und Umlagerungen.

   These are the entries the ÖChO Bundeswettbewerb leans on hardest
   (BW 2020 Aufgabe 5 is pericyclic end to end), so each one names the
   orbital argument that predicts the outcome, not just the product. */

module.exports = function (ctx) {
const { R, Mol, B, DX, DY } = ctx;

const C_PC = 'Pericyclische Reaktionen';
const C_UM = 'Umlagerungen';

R({
  id: 'diels-alder', category: C_PC, name: 'Diels-Alder-Reaktion',
  difficulty: 'B', reaktionstyp: '[4+2]-Cycloaddition', transformation: 'Dien + Dienophil → Cyclohexen',
  rx: (() => {
    const a = (() => {
      // s-cis butadiene: the only conformation that can react.
      const m = new Mol();
      const c1 = m.add(0, 0, 'C');
      const c2 = m.add(DX, DY, 'C');
      const c3 = m.add(2 * DX, 0, 'C');
      const c4 = m.add(3 * DX, DY, 'C');
      m.bond(c1, c2, 2); m.bond(c2, c3, 1); m.bond(c3, c4, 2);
      return m;
    })();
    const a2 = (() => {
      const m = new Mol();
      const c1 = m.add(0, 0, 'C');
      const c2 = m.add(B, 0, 'C');
      const z = m.gen(B + DX, DY, 'Z');
      m.bond(c1, c2, 2); m.bond(c2, z, 1);
      return m;
    })();
    const b = (() => {
      const m = new Mol();
      const v = m.ring(6, 0, 0);
      // One double bond left in the new ring.
      const bo = m.bonds.find(x => (x.a === v[1] && x.b === v[2]) || (x.a === v[2] && x.b === v[1]));
      bo.order = 2;
      const zp = m.radial(0, 0, v[4], B);
      const z = m.gen(zp[0], zp[1], 'Z');
      m.bond(v[4], z, 1);
      return m;
    })();
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'Δ', below: '',
  stereochemistry: 'Streng SUPRAFACIAL an beiden Komponenten → die Konfiguration beider Partner bleibt vollständig erhalten (syn-Addition). Es gilt die ENDO-Regel: der ÜZ mit maximaler Sekundärorbital-Wechselwirkung ist kinetisch bevorzugt.',
  substituents: 'Dien = elektronenREICH (Donoren am Dien), muss s-cis einnehmbar sein · Z = elektronenziehend: –CHO, –COR, –CO₂R, –CN, –NO₂',
  key_points: [
    'Thermisch erlaubt, weil 4+2 = 6 Elektronen ein Hückel-System mit (4n+2) bilden — photochemisch ist [4+2] dagegen verboten.',
    'Normaler Elektronenbedarf: HOMO(Dien) trifft LUMO(Dienophil); je kleiner der Abstand, desto schneller.',
    'Ein Dien, das s-cis nicht erreichen kann (z. B. in einem trans-fixierten Ring), reagiert gar nicht.',
    'In EINEM Schritt entstehen zwei C–C-Bindungen, ein Ring und bis zu vier Stereozentren — deshalb so beliebt in Totalsynthesen.',
    'Die Umkehrung (Retro-Diels-Alder) läuft bei hoher Temperatur und wird gezielt zur Freisetzung von Dienen genutzt.'
  ],
  seen_in: 'BW 2022 (Cantharidin), BW 2020 (Aufgabe 5 E), BW 2023 (Hirsuten), BW 2024 (Merrilacton A)'
});

R({
  id: 'dipolare-cycloaddition', category: C_PC, name: '1,3-Dipolare Cycloaddition',
  difficulty: 'C', reaktionstyp: '[3+2]-Cycloaddition', transformation: 'Nitron + Alken → Isoxazolidin',
  rx: (() => {
    const a = new Mol();
    const r1 = a.gen(0, 0, 'R₁'); const c = a.add(DX, DY, 'C'); const n = a.add(2 * DX, 0, 'N');
    const o = a.add(3 * DX, DY, 'O'); const r2 = a.gen(2 * DX, -B, 'R₂');
    a.bond(r1, c, 1); a.bond(c, n, 2); a.bond(n, o, 1); a.bond(n, r2, 1);
    a.charge(n, 1); a.charge(o, -1);
    const a2 = new Mol();
    const d1 = a2.add(0, 0, 'C'); const d2 = a2.add(B, 0, 'C'); const r3 = a2.gen(B + DX, DY, 'R₃');
    a2.bond(d1, d2, 2); a2.bond(d2, r3, 1);
    const b = new Mol();
    // v2 = O, v3 = N (N–O oben), v4 = C–R₁, v0 = CH₂, v1 = C–R₃
    const v = b.ring(5, 0, 0);
    b.atoms[v[2]].sym = 'O'; b.atoms[v[3]].sym = 'N';
    [[v[3], 'R₂'], [v[4], 'R₁'], [v[1], 'R₃']].forEach(([vi, lab]) => {
      const p = b.radial(0, 0, vi, B); b.bond(vi, b.gen(p[0], p[1], lab), 1);
    });
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'Δ', below: '',
  stereochemistry: 'Konzertiert und suprafacial — die Geometrie des Alkens bleibt im Produkt erhalten.',
  substituents: '1,3-Dipol: Nitron (→ Isoxazolidin), Nitriloxid (→ Isoxazolin), Azid (→ Triazol), Ozon · Dipolarophil: Alken, Alkin · R₁–R₃ = Alkyl, Aryl, H',
  key_points: [
    '4 π-Elektronen des Dipols + 2 π-Elektronen des Dipolarophils = 6 Elektronen: thermisch erlaubt wie die Diels-Alder-Reaktion.',
    'Liefert in EINEM Schritt Fünfring-Heterocyclen; Azid + Alkin → 1,2,3-Triazol ist die bekannteste „Click“-Reaktion.',
    'Die N–O-Bindung des Isoxazolidins lässt sich reduktiv spalten (Zn/HOAc, H₂/Pd, LiAlH₄) → 1,3-Aminoalkohol.',
    'Auch der erste Schritt der Ozonolyse (O₃ + Alken → Primärozonid) ist eine 1,3-dipolare Cycloaddition.'
  ],
  seen_in: 'BW 2017 (Atropin)'
});

R({
  id: 'photo-2plus2', category: C_PC, name: '[2+2]-Photocycloaddition',
  difficulty: 'D', reaktionstyp: '[2+2]-Cycloaddition', transformation: '2 Alkene → Cyclobutan',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const c1 = m.add(0, 0, 'C'); const c2 = m.add(B, 0, 'C');
      const r1 = m.gen(-DX, DY, 'R₁'); const r2 = m.gen(B + DX, DY, 'R₂');
      m.bond(c1, c2, 2); m.bond(c1, r1, 1); m.bond(c2, r2, 1); return m;
    })();
    const a2 = (() => {
      const m = new Mol();
      const c1 = m.add(0, 0, 'C'); const c2 = m.add(B, 0, 'C');
      const r3 = m.gen(-DX, -DY, 'R₃'); const r4 = m.gen(B + DX, -DY, 'R₄');
      m.bond(c1, c2, 2); m.bond(c1, r3, 1); m.bond(c2, r4, 1); return m;
    })();
    const b = (() => {
      const m = new Mol();
      const v = m.ring(4, 0, 0, { a0: 45 });
      const labels = ['R₂', 'R₁', 'R₃', 'R₄'];
      v.forEach((vi, i) => {
        const p = m.radial(0, 0, vi, B);
        m.bond(vi, m.gen(p[0], p[1], labels[i]), 1);
      });
      return m;
    })();
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'hν', below: 'ggf. Sensibilisator',
  stereochemistry: 'Thermisch wäre supra/supra verboten — photochemisch ist genau dieser Weg erlaubt, deshalb bleibt die Alkengeometrie erhalten.',
  substituents: 'R₁–R₄ = Alkyl, Aryl, H, Carbonyl · Enone reagieren besonders gut',
  key_points: [
    'Der Musterfall der Woodward-Hoffmann-Regeln: [2+2] ist THERMISCH verboten und PHOTOCHEMISCH erlaubt — genau umgekehrt zur Diels-Alder-Reaktion.',
    'Grund ist die Anregung eines Elektrons ins LUMO, wodurch sich die Orbitalsymmetrie der Grenzorbitale umkehrt.',
    'Der einzige bequeme Zugang zu Cyclobutanen, die sonst wegen der Ringspannung schwer zu bauen sind.',
    'Biologisch relevant als Thymin-Dimer — der UV-Schaden in der DNA entsteht über genau diese Reaktion.'
  ],
  seen_in: 'BW 2013 (Grandisol, hν), BW 2020 (Bergamoten), BW 2023 (Hirsuten, Licht)'
});

R({
  id: 'keten-cycloaddition', category: C_PC, name: '[2+2]-Cycloaddition von Ketenen',
  difficulty: 'D', reaktionstyp: '[2+2]-Cycloaddition (thermisch)', transformation: 'Keten + Alken → Cyclobutanon',
  rx: (() => {
    const a = new Mol();
    const c1 = a.add(0, 0, 'C'); const c2 = a.add(B, 0, 'C'); const o = a.add(2 * B, 0, 'O');
    const r1 = a.gen(-DX, DY, 'R₁'); const r2 = a.gen(-DX, -DY, 'R₂');
    a.bond(c1, c2, 2); a.bond(c2, o, 2); a.bond(c1, r1, 1); a.bond(c1, r2, 1);
    const a2 = new Mol();
    const d1 = a2.add(0, 0, 'C'); const d2 = a2.add(B, 0, 'C'); const r3 = a2.gen(B + DX, -DY, 'R₃');
    a2.bond(d1, d2, 2); a2.bond(d2, r3, 1);
    const b = new Mol();
    // v0 = C=O, v1 = CR₁R₂, v2 = CH₂, v3 = CH–R₃
    const v = b.ring(4, 0, 0, { a0: 45 });
    const po = b.radial(0, 0, v[0], B); b.bond(v[0], b.add(po[0], po[1], 'O'), 2);
    const p3 = b.radial(0, 0, v[3], B); b.bond(v[3], b.gen(p3[0], p3[1], 'R₃'), 1);
    const q = b.atoms[v[1]];
    [105, 165].forEach((deg, k) => {
      const t = deg * Math.PI / 180;
      b.bond(v[1], b.gen(q.x + B * Math.cos(t), q.y + B * Math.sin(t), k ? 'R₂' : 'R₁'), 1);
    });
    return { reactants: [a, a2], products: [b] };
  })(),
  above: 'Δ', below: 'aus R_1R_2CH-COCl + NEt_3',
  substituents: 'R₁, R₂ = Alkyl, Aryl, Cl (Dichlorketen) · Alken: elektronenreiche reagieren am besten, auch intramolekular',
  key_points: [
    'Die Ausnahme von „[2+2] nur photochemisch“: Ketene reagieren THERMISCH, weil ihr zweites, orthogonales π-System einen antarafacialen Angriff ([π2s + π2a]) erlaubt.',
    'Ketene sind zu reaktiv zum Lagern; man erzeugt sie in situ aus Säurechloriden mit einer Aminbase (−HCl).',
    'Produkt sind Cyclobutanone; intramolekular entstehen bicyclische Gerüste (Bergamoten).'
  ],
  seen_in: 'BW 2020 (Bergamoten)'
});

R({
  id: 'claisen-umlagerung', category: C_PC, name: 'Claisen-Umlagerung',
  difficulty: 'C', reaktionstyp: '[3,3]-sigmatrop', transformation: 'Allylvinylether → γ,δ-ungesättigtes Carbonyl',
  rx: (() => {
    /* Allyl vinyl ether. The six atoms of the [3,3] system are
       C3=C2–O1 (vinyl) and O1–C1′–C2′=C3′ (allyl); the σ bond O1–C1′
       breaks and a new C3–C3′ bond forms. */
    const a = (() => {
      const m = new Mol();
      const o   = m.add(2 * DX, 0, 'O');
      const c2  = m.add(3 * DX, DY, 'C');
      const c3  = m.add(4 * DX, 0, 'C');
      const c1b = m.add(DX, DY, 'C');
      const c2b = m.add(0, 0, 'C');
      const c3b = m.add(-DX, DY, 'C');
      m.bond(o, c2, 1); m.bond(c2, c3, 2);
      m.bond(o, c1b, 1); m.bond(c1b, c2b, 1); m.bond(c2b, c3b, 2);
      return m;
    })();
    /* Product: O1=C2 is now the carbonyl, C1′=C2′ the shifted alkene,
       and C3–C3′ the new C–C bond — a γ,δ-unsaturated aldehyde. */
    const b = (() => {
      const m = new Mol();
      const c2  = m.add(DX, DY, 'C');
      const o   = m.add(DX, DY + B, 'O');
      const c3  = m.add(2 * DX, 0, 'C');
      const c3b = m.add(3 * DX, DY, 'C');
      const c2b = m.add(4 * DX, 0, 'C');
      const c1b = m.add(5 * DX, DY, 'C');
      m.bond(c2, o, 2); m.bond(c2, c3, 1); m.bond(c3, c3b, 1);
      m.bond(c3b, c2b, 1); m.bond(c2b, c1b, 2);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'Δ (150–250 °C)', below: '',
  stereochemistry: 'Sechsgliedriger, sesselartiger Übergangszustand → die Stereochemie überträgt sich vorhersagbar von der alten auf die neue Doppelbindung (Chiralitätstransfer).',
  substituents: 'Substituenten an beiden Allylsystemen sind erlaubt · aromatische Variante: Allylphenylether → o-Allylphenol',
  key_points: [
    'Sechs Elektronen wandern im Ring → thermisch erlaubt (Hückel, 4n+2).',
    'Die Triebkraft ist der Tausch einer C–O- gegen eine C–C-σ-Bindung plus die Bildung der starken C=O.',
    'Die Cope-Umlagerung ist die reine Kohlenstoff-Variante (1,5-Dien → 1,5-Dien) — dort fehlt diese Triebkraft, sie ist ein echtes Gleichgewicht.',
    'Die aromatische Claisen-Umlagerung erzeugt zunächst ein Dienon, das zum o-Allylphenol tautomerisiert.',
    'Chiralitätstransfer über den geordneten ÜZ macht sie in Totalsynthesen wertvoll.',
    'Den Allylvinylether erzeugt man oft in situ: aus dem Allylalkohol mit Ethylvinylether/Hg(OAc)₂, mit Orthoessigester (Johnson-Claisen → γ,δ-ungesättigter Ester) oder über ein Silylketenacetal (Ireland-Claisen).'
  ],
  seen_in: 'BW 2024 (Vitamin E, Claisen-Johnson), BW 2020 (Conicein, Bergamoten), BW 2025 (Farnesol)'
});

R({
  id: 'cope-umlagerung', category: C_PC, name: 'Cope-Umlagerung',
  difficulty: 'D', reaktionstyp: '[3,3]-sigmatrop', transformation: '1,5-Dien ⇌ isomeres 1,5-Dien',
  rx: (() => {
    /* The parent 1,5-hexadiene rearranges into itself, so a substituent
       is drawn in to make the shift visible: R₁ sits on C3 before and on
       the terminal alkene carbon afterwards. */
    const a = (() => {
      const m = new Mol();
      const c1 = m.add(0, 0, 'C');
      const c2 = m.add(DX, DY, 'C');
      const c3 = m.add(2 * DX, 0, 'C');
      const r1 = m.gen(2 * DX, -B, 'R₁');
      const c4 = m.add(3 * DX, DY, 'C');
      const c5 = m.add(4 * DX, 0, 'C');
      const c6 = m.add(5 * DX, DY, 'C');
      m.bond(c1, c2, 2); m.bond(c2, c3, 1); m.bond(c3, r1, 1);
      m.bond(c3, c4, 1); m.bond(c4, c5, 1); m.bond(c5, c6, 2);
      return m;
    })();
    /* σ(C3–C4) breaks, σ(C1–C6) forms, both double bonds move inwards. */
    const b = (() => {
      const m = new Mol();
      const r1 = m.gen(0, 0, 'R₁');
      const c3 = m.add(DX, DY, 'C');
      const c2 = m.add(2 * DX, 0, 'C');
      const c1 = m.add(3 * DX, DY, 'C');
      const c6 = m.add(4 * DX, 0, 'C');
      const c5 = m.add(5 * DX, DY, 'C');
      const c4 = m.add(6 * DX, 0, 'C');
      m.bond(r1, c3, 1); m.bond(c3, c2, 2); m.bond(c2, c1, 1);
      m.bond(c1, c6, 1); m.bond(c6, c5, 1); m.bond(c5, c4, 2);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'Δ', below: '',
  stereochemistry: 'Sesselartiger sechsgliedriger ÜZ, damit stereospezifisch.',
  substituents: 'Beliebige Substituenten am 1,5-Dien-Gerüst',
  key_points: [
    'Reines Kohlenstoff-Analogon der Claisen-Umlagerung: eine σ-Bindung wandert über sechs Zentren.',
    'Weil Edukt und Produkt beide 1,5-Diene sind, ist es ein echtes GLEICHGEWICHT — die Lage bestimmt die Substitution der Doppelbindungen.',
    'Die Oxy-Cope-Variante verschiebt das Gleichgewicht vollständig, weil das entstehende Enol zum Keton tautomerisiert.',
    'Beim Anionen-Oxy-Cope schwächt das Alkoxid die brechende σ-Bindung — daher die enorme Beschleunigung.'
  ],
  seen_in: 'BW 2020 (Conicein, pericyclische Synthese), BW 2023 (Hirsuten)'
});

R({
  id: 'elektrocyclisierung', category: C_PC, name: 'Elektrocyclische Reaktionen',
  difficulty: 'D', reaktionstyp: 'elektrocyclisch', transformation: 'Polyen ⇌ Cycloalken',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const c = [];
      for (let k = 0; k < 6; k++) c.push(m.add(k * DX, (k % 2) * DY, 'C'));
      m.bond(c[0], c[1], 2); m.bond(c[1], c[2], 1); m.bond(c[2], c[3], 2);
      m.bond(c[3], c[4], 1); m.bond(c[4], c[5], 2);
      return m;
    })();
    const b = (() => {
      const m = new Mol();
      const v = m.ring(6, 0, 0);
      for (const [i, j] of [[0, 1], [2, 3]]) {
        const bo = m.bonds.find(x => (x.a === v[i] && x.b === v[j]) || (x.a === v[j] && x.b === v[i]));
        bo.order = 2;
      }
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'Δ  bzw. hν', below: '',
  stereochemistry: 'Woodward-Hoffmann: 4n π-Elektronen → thermisch CONrotatorisch, photochemisch DISrotatorisch. 4n+2 π-Elektronen → thermisch DISrotatorisch, photochemisch CONrotatorisch.',
  substituents: 'Substituenten an den Enden des Polyens machen die Rotationsrichtung sichtbar (cis/trans am Ring)',
  key_points: [
    'Die σ-Bindung entsteht zwischen den ENDEN des konjugierten Systems; die Termini müssen sich dabei drehen.',
    'Drehen sie gleichsinnig, heißt das conrotatorisch, gegensinnig disrotatorisch — und welches gilt, sagt allein die Elektronenzahl plus die Anregungsart.',
    'Ein Hexatrien (6 e⁻) cyclisiert thermisch disrotatorisch zum Cyclohexadien.',
    'Das Lehrbuchbeispiel aus der Natur ist die Bildung von Vitamin D: Ringöffnung von 7-Dehydrocholesterin durch UV, dann [1,7]-H-Verschiebung.'
  ],
  seen_in: 'BW 2020 (Conicein, Aufgabe 5), BW 2023 (Porphyrin-Cyclisierung, Hirsuten)'
});

R({
  id: 'nazarov-cyclisierung', category: C_PC, name: 'Nazarov-Cyclisierung',
  difficulty: 'D', reaktionstyp: '4π-elektrocyclisch (kationisch)', transformation: 'Divinylketon → Cyclopentenon',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const c = m.add(0, 0, 'C');
      const o = m.add(0, B, 'O');
      const c1 = m.add(-DX, -DY, 'C'); const c2 = m.add(-2 * DX, 0, 'C');
      const c3 = m.add(DX, -DY, 'C'); const c4 = m.add(2 * DX, 0, 'C');
      m.bond(c, o, 2); m.bond(c, c1, 1); m.bond(c1, c2, 2); m.bond(c, c3, 1); m.bond(c3, c4, 2);
      return m;
    })();
    const b = (() => {
      const m = new Mol();
      const v = m.ring(5, 0, 0);
      // cyclopent-2-enone: the C=C conjugated with the C=O (v0 carbonyl, v1=v2)
      const bo = m.bonds.find(x => (x.a === v[1] && x.b === v[2]) || (x.a === v[2] && x.b === v[1]));
      bo.order = 2;
      const op = m.radial(0, 0, v[0], B);
      const o = m.add(op[0], op[1], 'O');
      m.bond(v[0], o, 2);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'Lewis- oder Brønsted-Säure', below: 'BF_3, TiCl_4, H_2SO_4',
  stereochemistry: 'Vier π-Elektronen im Kation → thermisch CONrotatorischer Ringschluss, daher definierte relative Konfiguration an den beiden neuen Stereozentren.',
  substituents: 'Substituenten an beiden Vinylgruppen sind erlaubt und steuern die Position der Enol-Doppelbindung nach der Eliminierung',
  key_points: [
    'Der zuverlässigste Weg zum CYCLOPENTENON-Gerüst, das in vielen Terpenen und Prostaglandinen steckt.',
    'Kationische 4π-Elektrocyclisierung — die Woodward-Hoffmann-Regeln gelten auch für geladene Systeme.',
    'Nach dem Ringschluss wird ein Proton eliminiert und zum konjugierten Enon tautomerisiert.',
    'In der Angabe erkennbar am Divinylketon-Motiv plus Lewis-Säure.'
  ],
  seen_in: 'BW 2021 (Yuehchukene — Nazarov-Cyclisierung), BW 2023 (Hirsuten)'
});

R({
  id: 'beckmann-umlagerung', category: C_UM, name: 'Beckmann-Umlagerung',
  difficulty: 'C', reaktionstyp: 'Umlagerung', transformation: 'Oxim → Amid / Lactam',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const r1 = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      // OH anti to R₂ — the anti group migrates, giving the N–R₂ amide
      const n = m.add(DX, DY + B, 'N'); const o = m.add(0, DY + B + DY, 'O');
      const r2 = m.gen(2 * DX, 0, 'R₂');
      m.bond(r1, c, 1); m.bond(c, n, 2); m.bond(n, o, 1); m.bond(c, r2, 1);
      return m;
    })();
    const b = (() => {
      const m = new Mol();
      const r1 = m.gen(0, 0, 'R₁'); const c = m.add(DX, DY, 'C');
      const o = m.add(DX, DY + B, 'O'); const n = m.add(2 * DX, 0, 'N');
      const r2 = m.gen(3 * DX, DY, 'R₂');
      m.bond(r1, c, 1); m.bond(c, o, 2); m.bond(c, n, 1); m.bond(n, r2, 1);
      return m;
    })();
    return { reactants: [a], products: [b] };
  })(),
  above: 'H_2SO_4 (konz.)', below: 'bzw. PCl_5 , Δ',
  stereochemistry: 'Es wandert IMMER der Rest, der ANTI zur Abgangsgruppe (also anti zum OH) steht — die Oxim-Geometrie legt das Produkt eindeutig fest.',
  substituents: 'R₁, R₂ = Alkyl, Aryl · cyclische Ketoxime liefern Lactame mit einem Ringglied mehr',
  key_points: [
    'Das ist die exakte Analogie zur Baeyer-Villiger-Oxidation, nur wandert der Rest hier an ein N statt an ein O.',
    'Die anti-Selektivität macht die Reaktion zur Stereochemie-Prüfungsfrage schlechthin: erst die Oxim-Konfiguration bestimmen, dann das Produkt ablesen.',
    'Cyclohexanonoxim → ε-Caprolactam ist der industrielle Nylon-6-Prozess.',
    'Mechanistisch über ein Nitrilium-Ion, das von Wasser abgefangen wird.'
  ],
  seen_in: 'BW 2018 (Colchicin), BW 2021 (Carvon-Vorstufen, Hydroxylamin)'
});

R({
  id: 'rupe-umlagerung', category: C_UM, name: 'Rupe-Umlagerung',
  difficulty: 'D', reaktionstyp: 'säurekatalysierte Umlagerung', transformation: 'tert. Propargylalkohol → α,β-ungesättigtes Methylketon',
  rx: (() => {
    const a = new Mol();
    const r1 = a.gen(0, 0, 'R₁'); const ca = a.add(DX, DY, 'C'); const cb = a.add(2 * DX, 0, 'C');
    a.bond(r1, ca, 1); a.bond(ca, cb, 1);
    const k1 = a.add(3 * DX, DY, 'C'); const k2 = a.add(4 * DX, 2 * DY, 'C');
    a.bond(cb, k1, 1); a.bond(k1, k2, 3);
    const t1 = 240 * Math.PI / 180, t2 = 300 * Math.PI / 180;
    a.bond(cb, a.add(2 * DX + B * Math.cos(t1), B * Math.sin(t1), 'O'), 1);
    a.bond(cb, a.gen(2 * DX + B * Math.cos(t2), B * Math.sin(t2), 'R₂'), 1);
    const b = new Mol();
    const s1 = b.gen(0, 0, 'R₁'); const da = b.add(DX, DY, 'C'); const db = b.add(2 * DX, 0, 'C');
    const ck = b.add(3 * DX, DY, 'C'); const me = b.add(4 * DX, 0, 'C');
    b.bond(s1, da, 1); b.bond(da, db, 2); b.bond(db, ck, 1); b.bond(ck, me, 1);
    b.oxo(ck);
    b.bond(db, b.gen(2 * DX, -B, 'R₂'), 1);
    return { reactants: [a], products: [b] };
  })(),
  above: 'H^+ (HCOOH)', below: 'Δ',
  substituents: 'R₁, R₂ = Alkyl · tertiärer Propargylalkohol mit H am Nachbar-C · der Acetatester reagiert ebenso',
  key_points: [
    'Säurekatalysiert: Wasserabspaltung → Enin, dann Markownikow-Hydratisierung der Dreifachbindung → α,β-ungesättigtes Methylketon.',
    'Konkurrenz ist die Meyer-Schuster-Umlagerung (1,3-Verschiebung der OH-Gruppe), die den α,β-ungesättigten Aldehyd bzw. das Keton ohne neue Methylgruppe liefert.',
    'Mit der Acetylid-Addition an ein Keton davor ein kurzer Weg vom Keton zum Enon.'
  ],
  seen_in: 'BW 2026 (Adrenosteron)'
});

R({
  id: 'retro-diels-alder', category: C_PC, name: 'Retro-Diels-Alder',
  difficulty: 'C', reaktionstyp: 'Retro-[4+2]', transformation: 'Cyclohexen → Dien + Dienophil',
  rx: (() => {
    const a = (() => {
      const m = new Mol();
      const v = m.ring(6, 0, 0);
      const bo = m.bonds.find(x => (x.a === v[1] && x.b === v[2]) || (x.a === v[2] && x.b === v[1]));
      bo.order = 2;
      return m;
    })();
    const b = (() => {
      const m = new Mol();
      const c1 = m.add(0, 0, 'C'); const c2 = m.add(DX, DY, 'C');
      const c3 = m.add(2 * DX, 0, 'C'); const c4 = m.add(3 * DX, DY, 'C');
      m.bond(c1, c2, 2); m.bond(c2, c3, 1); m.bond(c3, c4, 2);
      return m;
    })();
    const b2 = (() => {
      const m = new Mol();
      const c1 = m.add(0, 0, 'C'); const c2 = m.add(B, 0, 'C');
      m.bond(c1, c2, 2); return m;
    })();
    return { reactants: [a], products: [b, b2] };
  })(),
  above: 'Δ (hohe Temperatur)', below: '',
  stereochemistry: 'Derselbe suprafaciale ÜZ wie die Hinreaktion, nur rückwärts durchlaufen.',
  substituents: 'Beliebig — die Triebkraft liegt in der Entropie und in der Stabilität der Fragmente',
  key_points: [
    'Aus einem Molekül werden zwei — der Entropiegewinn treibt sie bei hoher Temperatur.',
    'Wird gezielt eingesetzt, um instabile Diene erst im Reaktionsgemisch freizusetzen (Cyclopentadien aus Dicyclopentadien).',
    'Wenn ein aromatisches Fragment entsteht, läuft sie schon sehr milde ab — das nutzt man zum Entschützen.',
    'In der Massenspektrometrie ein charakteristischer Fragmentierungsweg für Cyclohexene.'
  ],
  seen_in: 'BW 2020 (Aufgabe 5 E — rein pericyclisch), BW 2022 (Cantharidin)'
});

};
