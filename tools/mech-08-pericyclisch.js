/* Mechanisms — Pericyclische Reaktionen & Umlagerungen (lib-rx-08/-09).
   Cyclic transition states are drawn in the orientation of the ring
   that forms (as in the scheme's product); their arrows curl outwards. */
const { scene, polar, DX, DY } = require('./lib-mech.js');

const M = {};
const lab = (S, label, q) => S.frag(() => ({ i: S.L(0, 0, label, q) }));
const H = (S, i, deg) => S.to(i, deg, 'H', { len: 0.85 });
/* the vertices of a regular n-ring (side 1) round (cx,cy), starting at a0 */
const ringPos = (n, a0, cx, cy) => {
  const r = 1 / (2 * Math.sin(Math.PI / n));
  return Array.from({ length: n }, (_, k) => polar([cx || 0, cy || 0], a0 + 360 / n * k, r));
};
/* atoms on given positions; bonds [i, j, order] */
function draw(S, pos, syms, bonds, q) {
  const a = pos.map((p, i) => S.at(p[0], p[1], (syms && syms[i]) || 'C', (q || {})[i]));
  bonds.forEach(([i, j, o]) => S.b(a[i], a[j], o || 1));
  return a;
}
/* push vertex i of `pos` outwards from (cx,cy) by d — the bond that is
   about to form is drawn a little longer than a real one */
const out = (pos, i, d, c) => { const p = pos[i], cc = c || [0, 0]; const ang = Math.atan2(p[1] - cc[1], p[0] - cc[0]) * 180 / Math.PI; pos[i] = polar(p, ang, d); };
const away = (S, ids) => ({ away: S.centre(ids) });

/* ── Diels-Alder ──────────────────────────────────────────────────── */
/* product ring of the scheme (six-ring, vertex 0 at 30°): C=C at v1=v2, Z on v4.
   Diene = v3=v2–v1=v0 (s-cis), dienophile = v4=v5. */
M['diels-alder'] = {
  title: 'Konzertierte [4+2]-Cycloaddition',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const P = ringPos(6, 30); out(P, 0, 0.12); out(P, 3, 0.12);
        const Q = P.map((p, i) => (i === 4 || i === 5) ? [p[0], p[1] - 0.55] : p);
        const v = draw(S, Q, null, [[3, 2, 2], [2, 1], [1, 0, 2], [4, 5, 2]]);
        S.b(v[4], S.L(...polar(Q[4], 270, 1), 'Z'));
        return { v };
      });
      const p = S.frag(() => {
        const P = ringPos(6, 30); const v = draw(S, P, null, [[0, 1], [1, 2, 2], [2, 3], [3, 4], [4, 5], [5, 0]]);
        S.b(v[4], S.L(...polar(P[4], 270, 1), 'Z')); return {};
      });
      return S.step({
        caption: 'Drei Elektronenpaare verschieben sich gleichzeitig in einem cyclischen Übergangszustand — keine Zwischenstufe. Das Dien muss s-cis stehen. Thermisch erlaubt ([π4s+π2s], 6 Elektronen, Hückel-aromatischer ÜZ). Beide neuen σ-Bindungen entstehen auf derselben Seite: Die Geometrie des Dienophils bleibt erhalten (cis → cis), und elektronenziehende Gruppen Z stehen bevorzugt endo (sekundäre Orbitalwechselwirkung).',
        row: [a, '→', p], y: -0.1,
        curly: (() => { const w = away(S, a.v); return [
          S.cv(S.pair(a.v[0], a.v[1]), S.pair(a.v[1], a.v[2]), 0, w),
          S.cv(S.pair(a.v[2], a.v[3]), S.pair(a.v[3], a.v[4]), 0, w),
          S.cv(S.pair(a.v[4], a.v[5]), S.pair(a.v[5], a.v[0]), 0, w)]; })()
      });
    })()
  ]
};

/* ── Retro-Diels-Alder ────────────────────────────────────────────── */
M['retro-diels-alder'] = {
  title: 'Diels-Alder rückwärts — bei hoher Temperatur',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const P = ringPos(6, 30); return { v: draw(S, P, null, [[0, 1], [1, 2, 2], [2, 3], [3, 4], [4, 5], [5, 0]]) }; });
      const p = S.frag(() => {
        const P = ringPos(6, 30); out(P, 0, 0.12); out(P, 3, 0.12);
        const Q = P.map((q, i) => (i === 4 || i === 5) ? [q[0], q[1] - 0.6] : q);
        draw(S, Q, null, [[3, 2, 2], [2, 1], [1, 0, 2], [4, 5, 2]]); return {};
      });
      return S.step({
        caption: 'Dieselben drei Elektronenpaare wie bei der Diels-Alder-Reaktion, in umgekehrter Richtung: Das Cyclohexen zerfällt in Dien und Dienophil. Bei hoher Temperatur gewinnt die Entropie (aus einem Molekül werden zwei); besonders leicht, wenn ein Bruchstück sehr stabil ist (N₂, CO₂, ein Aromat) oder flüchtig entweicht. Klassisch: Dicyclopentadien → Cyclopentadien.',
        row: [a, { arrow: '→', above: 'Δ' }, p], y: -0.1,
        curly: (() => { const w = away(S, a.v); return [
          S.cv(S.pair(a.v[1], a.v[2]), S.pair(a.v[2], a.v[3]), 0, w),
          S.cv(S.pair(a.v[3], a.v[4]), S.pair(a.v[4], a.v[5]), 0, w),
          S.cv(S.pair(a.v[5], a.v[0]), S.pair(a.v[0], a.v[1]), 0, w)]; })()
      });
    })()
  ]
};

/* ── 1,3-Dipolare Cycloaddition ───────────────────────────────────── */
/* product ring of the scheme (five-ring, node at the bottom): v0 CH₂,
   v1 C–R₃, v2 O, v3 N–R₂, v4 C–R₁. Nitrone = v4=N⁺(v3)–O⁻(v2), alkene v0=v1. */
M['dipolare-cycloaddition'] = {
  title: 'Konzertierte [3+2]-Cycloaddition',
  steps: [
    (() => {
      const S = scene();
      const P = ringPos(5, 270);
      const a = S.frag(() => {
        const Q = P.map((p, i) => (i === 0 || i === 1) ? [p[0] + 0.25, p[1] - 0.55] : [p[0] - 0.1, p[1] + 0.15]);
        const v = draw(S, Q, [0, 0, 'O', 'N', 0], [[4, 3, 2], [3, 2], [0, 1, 2]], { 2: -1, 3: 1 });
        S.b(v[3], S.L(...polar(Q[3], 126, 1), 'R₂')).b(v[4], S.L(...polar(Q[4], 198, 1), 'R₁')).b(v[1], S.L(...polar(Q[1], 342, 1), 'R₃'));
        return { v };
      });
      const p = S.frag(() => {
        const v = draw(S, P, [0, 0, 'O', 'N', 0], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]);
        S.b(v[3], S.L(...polar(P[3], 126, 1), 'R₂')).b(v[4], S.L(...polar(P[4], 198, 1), 'R₁')).b(v[1], S.L(...polar(P[1], 342, 1), 'R₃'));
        return {};
      });
      return S.step({
        caption: 'Das Nitron ist ein 1,3-Dipol (vier π-Elektronen über C, N, O). Mit dem Alken (Dipolarophil) verschieben sich drei Elektronenpaare in einem Schritt — wie bei der Diels-Alder-Reaktion ein thermisch erlaubter 6-Elektronen-Prozess. Es entsteht der Fünfring Isoxazolidin; die Stereochemie des Alkens bleibt erhalten. Analog: Azide + Alkine → Triazole, Ozon + Alkene (Ozonolyse).',
        row: [a, { arrow: '→', above: 'Δ' }, p], y: 0,
        curly: (() => { const w = away(S, a.v); return [
          S.cv(S.atom(a.v[2]), S.pair(a.v[2], a.v[1]), 0, w),
          S.cv(S.pair(a.v[1], a.v[0]), S.pair(a.v[0], a.v[4]), 0, w),
          S.cv(S.pair(a.v[4], a.v[3]), S.atom(a.v[3]), 0, w)]; })()
      });
    })()
  ]
};

/* ── [2+2]-Photocycloaddition ─────────────────────────────────────── */
/* product of the scheme: four-ring (vertex 0 at 45°) with R₂, R₁, R₃, R₄ */
function four(S, lift, labels, opts) {
  const P = ringPos(4, 45).map((p, i) => i < 2 ? [p[0], p[1] + lift] : [p[0], p[1] - lift]);
  const bonds = opts.open ? [[0, 1, 2], [2, 3, 2]] : [[0, 1], [1, 2], [2, 3], [3, 0]];
  const v = draw(S, P, opts.syms, bonds);
  labels.forEach((l, i) => { if (!l) return; const d = 45 + 90 * i; if (Array.isArray(l)) l.forEach((x, k) => S.b(v[i], S.L(...polar(P[i], x[1], 1), x[0]))); else if (l === '=O') S.b(v[i], S.at(...polar(P[i], d, 1), 'O'), 2); else S.b(v[i], S.L(...polar(P[i], d, 1), l)); });
  return v;
}
M['photo-2plus2'] = {
  title: 'Photochemisch erlaubt, thermisch verboten',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => ({ v: four(S, 0.45, ['R₂', 'R₁', 'R₃', 'R₄'], { open: true }) }));
      const p = S.frag(() => ({ v: four(S, 0, ['R₂', 'R₁', 'R₃', 'R₄'], {}) }));
      return S.step({
        caption: 'Thermisch ist die suprafaciale [2+2]-Cycloaddition verboten (4 Elektronen, die HOMO/LUMO-Phasen passen nicht). Nach Anregung mit Licht steht ein Elektron im π*-Orbital, dessen Symmetrie zum LUMO des Partners passt: [π2s+π2s] wird erlaubt — es entsteht der Cyclobutanring. Enone reagieren meist schrittweise über ein Triplett-1,4-Diradikal (Sensibilisator z. B. Benzophenon); dann kann die Alkengeometrie verloren gehen.',
        row: [a, { arrow: '→', above: 'hν' }, p], y: 0,
        curly: (() => { const w = away(S, a.v); return [
          S.cv(S.pair(a.v[0], a.v[1]), S.pair(a.v[1], a.v[2]), 0, w),
          S.cv(S.pair(a.v[2], a.v[3]), S.pair(a.v[3], a.v[0]), 0, w)]; })()
      });
    })()
  ]
};

/* ── Keten-[2+2] ──────────────────────────────────────────────────── */
/* product of the scheme: four-ring, v0 C=O, v1 CR₁R₂, v2 CH₂, v3 CH–R₃ */
M['keten-cycloaddition'] = {
  title: 'Thermische [2+2] — dank des Ketens erlaubt',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const v = four(S, 0.45, ['=O', [['R₁', 105], ['R₂', 165]], null, 'R₃'], { open: true });
        return { v };
      });
      const p = S.frag(() => ({ v: four(S, 0, ['=O', [['R₁', 105], ['R₂', 165]], null, 'R₃'], {}) }));
      return S.step({
        caption: 'Ketene (R₁R₂C=C=O, z. B. aus Säurechlorid + NEt₃) reagieren schon thermisch mit Alkenen: Das zentrale sp-C hat ein leeres, senkrecht stehendes π*(C=O)-Orbital, an das das Alken angreifen kann. Das erlaubt eine [π2s+π2a]-Geometrie, in der das Keten antarafacial reagiert. Die Alkengeometrie bleibt erhalten; das Produkt ist ein Cyclobutanon.',
        row: [a, { arrow: '→', above: 'Δ' }, p], y: 0,
        curly: (() => { const w = away(S, a.v); return [
          S.cv(S.pair(a.v[2], a.v[3]), S.pair(a.v[3], a.v[0]), 0, w),
          S.cv(S.pair(a.v[0], a.v[1]), S.pair(a.v[1], a.v[2]), 0, w)]; })()
      });
    })()
  ]
};

/* ── Claisen-Umlagerung ───────────────────────────────────────────── */
/* drawn as the six-membered chair-like ring of the transition state:
   v5 O, v0 C2, v1 C3 (vinyl); v4 C1′, v3 C2′, v2 C3′ (allyl) */
M['claisen-umlagerung'] = {
  title: '[3,3]-sigmatrope Umlagerung',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const P = ringPos(6, 30); out(P, 1, 0.12); out(P, 2, 0.12);
        return { v: draw(S, P, [0, 0, 0, 0, 0, 'O'], [[5, 0], [0, 1, 2], [5, 4], [4, 3], [3, 2, 2]]) };
      });
      const p = S.frag(() => {
        const P = ringPos(6, 30); out(P, 4, 0.12); out(P, 5, 0.12);
        return { v: draw(S, P, [0, 0, 0, 0, 0, 'O'], [[5, 0, 2], [0, 1], [1, 2], [2, 3], [3, 4, 2]]) };
      });
      return S.step({
        caption: 'Beim Erhitzen wandert die σ-Bindung O–C1′ in einem Schritt über sechs Atome: Die neue C–C-Bindung entsteht zwischen den beiden Enden, die alte C–O-Bindung bricht, beide π-Bindungen verschieben sich. Hier in der sesselartigen Anordnung des Übergangszustands gezeichnet (das Produkt ist der γ,δ-ungesättigte Aldehyd des Schemas). Triebkraft: die starke C=O-Bindung. Aryl-allylether lagern zu o-Allylphenolen um.',
        row: [a, { arrow: '→', above: 'Δ' }, p], y: 0,
        curly: (() => { const w = away(S, a.v); return [
          S.cv(S.pair(a.v[0], a.v[1]), S.pair(a.v[1], a.v[2]), 0, w),
          S.cv(S.pair(a.v[2], a.v[3]), S.pair(a.v[3], a.v[4]), 0, w),
          S.cv(S.pair(a.v[4], a.v[5]), S.pair(a.v[5], a.v[0]), 0, w)]; })()
      });
    })()
  ]
};

/* ── Cope-Umlagerung ──────────────────────────────────────────────── */
/* C1 v1, C2 v0, C3 v5 (R₁), C4 v4, C5 v3, C6 v2 */
M['cope-umlagerung'] = {
  title: '[3,3]-sigmatrope Umlagerung eines 1,5-Diens',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const P = ringPos(6, 30); out(P, 1, 0.12); out(P, 2, 0.12);
        const v = draw(S, P, null, [[1, 0, 2], [0, 5], [5, 4], [4, 3], [3, 2, 2]]);
        S.b(v[5], S.L(...polar(P[5], 330, 1), 'R₁')); return { v };
      });
      const p = S.frag(() => {
        const P = ringPos(6, 30); out(P, 4, 0.12); out(P, 5, 0.12);
        const v = draw(S, P, null, [[1, 0], [0, 5, 2], [4, 3, 2], [3, 2], [2, 1]]);
        S.b(v[5], S.L(...polar(P[5], 330, 1), 'R₁')); return { v };
      });
      return S.step({
        caption: 'Die σ-Bindung C3–C4 bricht, C1–C6 bildet sich, beide Doppelbindungen wandern nach innen — über einen sesselförmigen Sechsring-ÜZ (deshalb hoch stereospezifisch). Das unsubstituierte Hexa-1,5-dien lagert in sich selbst um; R₁ zeigt die Verschiebung. Das Gleichgewicht liegt beim stabileren Dien (höher substituierte Doppelbindungen); bei der Oxy-Cope-Variante treibt die Tautomerie Enol → Keton.',
        row: [a, { arrow: '⇌', above: 'Δ' }, p], y: 0,
        curly: (() => { const w = away(S, a.v); return [
          S.cv(S.pair(a.v[3], a.v[2]), S.pair(a.v[2], a.v[1]), 0, w),
          S.cv(S.pair(a.v[1], a.v[0]), S.pair(a.v[0], a.v[5]), 0, w),
          S.cv(S.pair(a.v[5], a.v[4]), S.pair(a.v[4], a.v[3]), 0, w)]; })()
      });
    })()
  ]
};

/* ── Elektrocyclisierung ──────────────────────────────────────────── */
/* product ring of the scheme: C=C at v0=v1 and v2=v3; the new σ bond v4–v5.
   The triene: v5=v0, v1=v2, v3=v4 (C1 = v5 … C6 = v4). */
M['elektrocyclisierung'] = {
  title: 'Ringschluss eines Polyens — Woodward-Hoffmann',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const P = ringPos(6, 30); out(P, 4, 0.15); out(P, 5, 0.15);
        return { v: draw(S, P, null, [[5, 0, 2], [0, 1], [1, 2, 2], [2, 3], [3, 4, 2]]) };
      });
      const p = S.frag(() => {
        const P = ringPos(6, 30); return { v: draw(S, P, null, [[0, 1, 2], [1, 2], [2, 3, 2], [3, 4], [4, 5], [5, 0]]) };
      });
      return S.step({
        caption: 'Hexatrien → Cyclohexa-1,3-dien: Die Enden des π-Systems schließen eine σ-Bindung, die Doppelbindungen wandern. Ob sich die Enden dabei gleichsinnig (konrotatorisch) oder gegensinnig (disrotatorisch) drehen, bestimmt die Symmetrie des HOMO: 6π-Elektronen thermisch disrotatorisch, photochemisch konrotatorisch; bei 4π (Butadien ⇌ Cyclobuten) genau umgekehrt. Das legt die relative Konfiguration der Substituenten an den Enden fest (E,Z,E-Trien → cis-Produkt thermisch).',
        row: [a, { arrow: '⇌', above: 'Δ bzw. hν' }, p], y: 0,
        curly: (() => { const w = away(S, a.v); return [
          S.cv(S.pair(a.v[3], a.v[4]), S.pair(a.v[4], a.v[5]), 0, w),
          S.cv(S.pair(a.v[5], a.v[0]), S.pair(a.v[0], a.v[1]), 0, w),
          S.cv(S.pair(a.v[1], a.v[2]), S.pair(a.v[2], a.v[3]), 0, w)]; })()
      });
    })()
  ]
};

/* ── Nazarov ──────────────────────────────────────────────────────── */
/* five-ring with the carbonyl C on top (u0, O up as in the scheme's
   divinyl ketone); the vinyl ends u2 and u3 join at the bottom. */
function naz(S, o) {
  o = o || {};
  const P = ringPos(5, 90);
  if (o.open) { out(P, 2, 0.15); out(P, 3, 0.15); }
  const b = [[0, 1, o.b01 || 1], [1, 2, o.b12 || 1], [3, 4, o.b34 || 1], [4, 0, o.b40 || 1]];
  if (!o.open) b.push([2, 3]);
  const u = draw(S, P, null, b, o.q);
  const k = { u };
  k.o = S.at(...polar(P[0], 90, 1), 'O', o.oq); S.b(u[0], k.o, o.co || 1);
  if (o.oh) k.oh = H(S, k.o, 30);
  if (o.h2) k.h2 = H(S, u[2], 234);
  return k;
}
M['nazarov-cyclisierung'] = {
  title: 'Kationische 4π-Elektrocyclisierung',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = naz(S, { open: true, b12: 2, b34: 2, co: 2 }); k.h = S.at(...polar(S.xy(k.o), 30, 1.15), 'H'); k.ha = S.to(k.h, 30, null, { label: 'A' }); return k; });
      const p = S.frag(() => naz(S, { open: true, b12: 2, b34: 2, q: { 0: 1 }, oh: true }));
      return S.step({
        caption: '1. Die Säure (H⁺ oder eine Lewis-Säure wie BF₃) aktiviert die Carbonylgruppe: Es entsteht ein Pentadienyl-Kation, über fünf C-Atome delokalisiert (4 π-Elektronen).',
        row: [a, '→', p, '+', lab(S, 'A', -1)], y: 0.2,
        curly: [S.cv(S.atom(a.o), S.atom(a.h), 1), S.cv(S.pair(a.h, a.ha), S.atom(a.ha), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => naz(S, { open: true, b12: 2, b34: 2, q: { 0: 1 }, oh: true }));
      const p = S.frag(() => naz(S, { b40: 2, q: { 1: 1 }, oh: true, h2: true }));
      return S.step({
        caption: '2. Elektrocyclischer Ringschluss: 4π-Elektronen, thermisch → konrotatorisch. Die neue C–C-Bindung schließt den Fünfring; es bleibt ein Oxyallyl-Kation.',
        row: [a, '→', p], y: 0.2,
        curly: (() => { const w = away(S, a.u); return [S.cv(S.pair(a.u[1], a.u[2]), S.pair(a.u[2], a.u[3]), 0, w), S.cv(S.pair(a.u[3], a.u[4]), S.pair(a.u[4], a.u[0]), 0, w)]; })()
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = naz(S, { b40: 2, q: { 1: 1 }, oh: true, h2: true }); k.b = S.L(...polar(S.xy(k.h2), 234, 1.1), 'A', -1); return k; });
      const p = S.frag(() => naz(S, { b40: 2, b12: 2, oh: true }));
      return S.step({
        caption: '3. Eliminierung eines Protons neben dem Kation: Dienol.',
        row: [a, '→', p, '+', lab(S, 'H–A')], y: 0.2,
        curly: [S.cv(S.atom(a.b), S.atom(a.h2), -1), S.cv(S.pair(a.u[2], a.h2), S.pair(a.u[1], a.u[2]), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => naz(S, { b40: 2, b12: 2, oh: true }));
      const p = S.frag(() => naz(S, { b12: 2, co: 2 }));
      return S.step({
        caption: '4. Keto-Enol-Tautomerie: Cyclopent-2-enon — die C=C-Bindung konjugiert zur C=O-Gruppe, an der Stelle, an der das Proton abgegeben wurde. Mit Substituenten bildet sich bevorzugt die höher substituierte Doppelbindung.',
        row: [a, { arrow: '→', above: 'Tautomerie' }, p], y: 0.2
      });
    })()
  ]
};

/* ── Beckmann ─────────────────────────────────────────────────────── */
/* oxime frame of the scheme (C=N up). The group ANTI to the OH migrates —
   for the product of the scheme (N–R₂) that is R₂, so the OH is drawn on
   the left. */
function oxime(S, o) {
  o = o || {};
  const r1 = S.L(0, 0, 'R₁'), c = S.at(DX, DY), r2 = S.L(2 * DX, 0, 'R₂'), n = S.at(DX, DY + 1, 'N');
  S.b(r1, c).b(c, r2).b(c, n, 2);
  const ox = S.at(0, DY + 1 + DY, 'O', o.oq); S.b(n, ox);
  const k = { c, n, o: ox, r2 };
  k.h = H(S, ox, 90); if (o.oq) k.h2 = H(S, ox, 210);
  return k;
}
M['beckmann-umlagerung'] = {
  title: 'Anti-Wanderung zum Nitrilium-Ion',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = oxime(S); k.hh = S.at(...polar(S.xy(k.o), 210, 1.15), 'H'); k.ha = S.to(k.hh, 210, null, { label: 'OSO₃H' }); S.m.atoms[k.ha].alias = 'HO₃SO'; return k; });
      const p = S.frag(() => oxime(S, { oq: 1 }));
      return S.step({
        caption: '1. Konzentrierte Schwefelsäure protoniert die OH-Gruppe (mit PCl₅ oder TsCl wird sie stattdessen verestert) — eine gute Abgangsgruppe entsteht.',
        row: [a, '→', p, '+', lab(S, 'HSO₄', -1)], y: DY + 0.5,
        curly: [S.cv(S.atom(a.o), S.atom(a.hh), 1), S.cv(S.pair(a.hh, a.ha), S.atom(a.ha), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => oxime(S, { oq: 1 }));
      const p = S.frag(() => {
        const c = S.at(DX, DY), n = S.at(2 * DX, 0, 'N', 1); S.b(c, n, 3);
        S.b(c, S.L(...polar([DX, DY], 150, 1), 'R₁')); S.b(n, S.L(3 * DX, -DY, 'R₂')); return {};
      });
      return S.step({
        caption: '2. Konzertiert: Der Rest, der anti-periplanar zur Abgangsgruppe steht (hier R₂), wandert mit seinem Bindungselektronenpaar vom C zum N, während Wasser das N verlässt. Es entsteht ein lineares Nitrilium-Ion. Die Konfiguration des wandernden Restes bleibt erhalten.',
        row: [a, '→', p, '+', lab(S, 'H₂O')], y: DY + 0.3,
        curly: [S.cv(S.pair(a.c, a.r2), S.pair(a.r2, a.n), -1), S.cv(S.pair(a.n, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const c = S.at(DX, DY), n = S.at(2 * DX, 0, 'N', 1); S.b(c, n, 3);
        S.b(c, S.L(...polar([DX, DY], 150, 1), 'R₁')); S.b(n, S.L(3 * DX, -DY, 'R₂'));
        const w = S.at(DX + 0.35, DY + 1.4, 'O'); H(S, w, 150); H(S, w, 30); return { c, n, w };
      });
      const p = S.frag(() => {
        const r1 = S.L(0, 0, 'R₁'), c = S.at(DX, DY), o = S.at(DX, DY + 1, 'O'), n = S.at(2 * DX, 0, 'N');
        S.b(r1, c).b(c, o).b(c, n, 2).b(n, S.L(3 * DX, DY, 'R₂')); H(S, o, 150); return {};
      });
      return S.step({
        caption: '3. Wasser greift das Nitrilium-C an; nach Abgabe eines Protons liegt die Imidsäure vor.',
        row: [a, { arrow: '→', below: '−H⁺' }, p], y: DY,
        curly: [S.cv(S.atom(a.w), S.atom(a.c), -1), S.cv(S.pair(a.c, a.n), S.atom(a.n), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const r1 = S.L(0, 0, 'R₁'), c = S.at(DX, DY), o = S.at(DX, DY + 1, 'O'), n = S.at(2 * DX, 0, 'N');
        S.b(r1, c).b(c, o).b(c, n, 2).b(n, S.L(3 * DX, DY, 'R₂')); H(S, o, 150); return {};
      });
      const p = S.frag(() => {
        const r1 = S.L(0, 0, 'R₁'), c = S.at(DX, DY), o = S.at(DX, DY + 1, 'O'), n = S.at(2 * DX, 0, 'N');
        S.b(r1, c).b(c, o, 2).b(c, n).b(n, S.L(3 * DX, DY, 'R₂')); H(S, n, 270); return {};
      });
      return S.step({
        caption: '4. Tautomerie zum Amid. Aus cyclischen Ketoximen entstehen Lactame — technisch: Cyclohexanonoxim → ε-Caprolactam → Nylon-6.',
        row: [a, { arrow: '→', above: 'Tautomerie' }, p], y: DY
      });
    })()
  ]
};

/* ── Rupe ─────────────────────────────────────────────────────────── */
/* scheme frame: R₁ (0,0) – Ca (DX,DY) – Cb (2DX,0), OH and R₂ below Cb,
   the alkyne leaving Cb at 30° (k1, k2). */
function propargyl(S, o) {
  o = o || {};
  const r = S.L(0, 0, 'R₁'), ca = S.at(DX, DY), cb = S.at(2 * DX, 0, 'C', o.cbq); S.b(r, ca).b(ca, cb, o.ene ? 2 : 1);
  const k = { ca, cb };
  if (o.ha) k.ha = H(S, ca, 90);
  const k1 = S.to(cb, 30, 'C', { charge: o.k1q }); const k2 = S.to(k1, 30, 'C', { order: o.vinyl ? 2 : 3 });
  Object.assign(k, { k1, k2 });
  if (o.oh) { k.o = S.to(cb, 240, 'O', { charge: o.ohq }); H(S, k.o, 180); if (o.ohq) H(S, k.o, 300); }
  S.b(cb, S.L(...polar([2 * DX, 0], o.oh ? 300 : 270, 1), 'R₂'));
  return k;
}
M['rupe-umlagerung'] = {
  title: 'Dehydratisierung zum Enin, dann Hydratisierung der Dreifachbindung',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => propargyl(S, { oh: true, ohq: 1, ha: true }));
      const p = S.frag(() => propargyl(S, { cbq: 1, ha: true }));
      return S.step({
        caption: '1. Die Säure protoniert die OH-Gruppe, Wasser geht: ein tertiäres, propargylisch stabilisiertes Carbenium-Ion.',
        row: [a, { arrow: '→', below: '−H₂O' }, p], y: 0.2,
        curly: [S.cv(S.pair(a.cb, a.o), S.atom(a.o), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = propargyl(S, { cbq: 1, ha: true }); k.w = S.at(...polar(S.xy(k.ha), 150, 1.1), 'O'); H(S, k.w, 90); H(S, k.w, 210); return k; });
      const p = S.frag(() => propargyl(S, { ene: true }));
      return S.step({
        caption: '2. Abgabe des benachbarten Protons (E1): konjugiertes Enin. (Tertiäre Propargylalkohole ohne α-H gehen stattdessen die Meyer-Schuster-Umlagerung zum Enal ein.)',
        row: [a, '→', p, '+', lab(S, 'H₃O', 1)], y: 0.2,
        curly: [S.cv(S.atom(a.w), S.atom(a.ha), 1), S.cv(S.pair(a.ca, a.ha), S.pair(a.ca, a.cb), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => {
        const k = propargyl(S, { ene: true }); k.h = S.at(...polar(S.xy(k.k2), -60, 1.15), 'H'); k.ho = S.to(k.h, -60, 'O', { charge: 1 }); H(S, k.ho, 0); H(S, k.ho, 240); return k;
      });
      const p = S.frag(() => {
        const k = propargyl(S, { ene: true, k1q: 1, vinyl: true }); return k;
      });
      return S.step({
        caption: '3. Die Dreifachbindung wird am endständigen C protoniert (Markownikow): Das Vinyl-Kation am inneren C ist durch die konjugierte Doppelbindung stabilisiert.',
        row: [a, '→', p, '+', lab(S, 'H₂O')], y: 0.2,
        curly: [S.cv(S.pair(a.k1, a.k2), S.atom(a.h), -1), S.cv(S.pair(a.h, a.ho), S.atom(a.ho), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = propargyl(S, { ene: true, k1q: 1, vinyl: true }); k.w = S.at(...polar(S.xy(k.k1), 90, 1.35), 'O'); H(S, k.w, 30); H(S, k.w, 150); return k; });
      const p = S.frag(() => {
        const s1 = S.L(0, 0, 'R₁'), da = S.at(DX, DY), db = S.at(2 * DX, 0), ck = S.at(3 * DX, DY), me = S.at(4 * DX, 0);
        S.b(s1, da).b(da, db, 2).b(db, ck).b(ck, me).b(ck, S.at(3 * DX, DY + 1, 'O'), 2).b(db, S.L(2 * DX, -1, 'R₂')); return {};
      });
      return S.step({
        caption: '4. Wasser addiert an das Kation; nach Abgabe des Protons entsteht ein Enol, das zum Keton tautomerisiert: das α,β-ungesättigte Methylketon.',
        row: [a, { arrow: '→', below: '−H⁺, Tautomerie' }, p], y: 0.2,
        curly: [S.cv(S.atom(a.w), S.atom(a.k1), 1)]
      });
    })()
  ]
};

/* ── Pinakol ──────────────────────────────────────────────────────── */
/* scheme frame: C1 (0,0) – C2 (1,0); O1, O2 up; R₁ left, R₂ below C1,
   R₃ right, R₄ below C2. R₂ migrates to C2, which loses its OH. */
function pin(S, o) {
  o = o || {};
  const c1 = S.at(0, 0, 'C', o.c1q), c2 = S.at(1, 0, 'C', o.c2q); S.b(c1, c2);
  const k = { c1, c2 };
  k.o1 = S.at(0, 1, 'O', o.o1q); S.b(c1, k.o1, o.co ? 2 : 1); if (!o.co || o.o1q) k.h1 = H(S, k.o1, 150);
  if (o.o2 !== false) { k.o2 = S.at(1, 1, 'O', o.o2q); S.b(c2, k.o2); H(S, k.o2, 30); if (o.o2q) H(S, k.o2, 90); }
  S.b(c1, S.L(-1, 0, 'R₁'));
  if (o.r2up) { k.r2 = S.L(1, 1, 'R₂'); S.b(c2, k.r2); } else { k.r2 = S.L(0, -1, 'R₂'); S.b(c1, k.r2); }
  S.b(c2, S.L(2, 0, 'R₃')).b(c2, S.L(1, -1, 'R₄'));
  return k;
}
M['pinakol-umlagerung'] = {
  title: 'Carbenium-Ion und 1,2-Verschiebung',
  steps: [
    (() => {
      const S = scene();
      const a = S.frag(() => { const k = pin(S); k.h = S.at(1, 2.2, 'H'); k.ha = S.to(k.h, 30, null, { label: 'OSO₃H' }); return k; });
      const p = S.frag(() => pin(S, { o2q: 1 }));
      return S.step({
        caption: '1. Protoniert wird bevorzugt die OH-Gruppe, deren Abgang das stabilere Carbenium-Ion liefert.',
        row: [a, '→', p, '+', lab(S, 'HSO₄', -1)], y: 0.2,
        curly: [S.cv(S.atom(a.o2), S.atom(a.h), -1), S.cv(S.pair(a.h, a.ha), S.atom(a.ha), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => pin(S, { o2q: 1 }));
      const p = S.frag(() => pin(S, { o2: false, c2q: 1 }));
      return S.step({
        caption: '2. Wasser geht ab: tertiäres Carbenium-Ion.',
        row: [a, '→', p, '+', lab(S, 'H₂O')], y: 0.2,
        curly: [S.cv(S.pair(a.c2, a.o2), S.atom(a.o2), -1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => pin(S, { o2: false, c2q: 1 }));
      const p = S.frag(() => pin(S, { o2: false, co: true, o1q: 1, r2up: true }));
      return S.step({
        caption: '3. 1,2-Verschiebung: R₂ wandert mit seinem Bindungselektronenpaar zum kationischen Nachbar-C; das freie Elektronenpaar des O stabilisiert das neue Kation sofort als protoniertes Keton (Oxocarbenium-Ion) — das ist die Triebkraft. Wanderungsfreudigkeit: H > Aryl > Alkyl.',
        row: [a, '→', p], y: 0.2,
        curly: [S.cv(S.pair(a.c1, a.r2), S.atom(a.c2), -1), S.cv(S.atom(a.o1), S.pair(a.c1, a.o1), 1)]
      });
    })(),
    (() => {
      const S = scene();
      const a = S.frag(() => pin(S, { o2: false, co: true, o1q: 1, r2up: true }));
      const p = S.frag(() => pin(S, { o2: false, co: true, r2up: true }));
      return S.step({
        caption: '4. Abgabe des Protons: Keton (aus Pinakol: Pinakolon, tBu–CO–CH₃).',
        row: [a, { arrow: '→', above: '−H⁺' }, p], y: 0.2
      });
    })()
  ]
};

module.exports = M;
