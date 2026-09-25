# OC Reaktionen + Quiz

Interaktives Nachschlagewerk für organische Chemie auf IChO-Niveau, mit Quiz-Modus für mehrstufige Synthesen, Mechanismen und Regioselektivität. Schwerpunkt sind die Organik-Aufgaben der ÖChO-Bundeswettbewerbe. Gerendert wird durchgehend mit OpenChemLib, gezeichnet mit Ketcher, Layout-Optimierung über RDKit-JS.

> **Reaktionsbibliothek:** `data/reactions.json` wird von `tools/build-reaction-library.js` erzeugt und enthält 88 Reaktionen in 11 Kategorien — alle Namensreaktionen und alle klar unterscheidbaren unbenannten Reaktionstypen, die in den Quizzes (ÖChO LW/BW 2013–2026) vorkommen. Jeder Eintrag zeigt die **allgemeinste Form** mit R₁, R₂, Ar, X, Nu, E; `substituents` sagt, wofür die Platzhalter stehen (`seen_in` nennt die Angaben, in denen die Reaktion auftaucht — wird nicht angezeigt). Neu bauen mit:
>
> ```bash
> node tools/build-reaction-library.js
> ```

**Live:** https://kingalo7.github.io/OC-oecho/

---

## Funktionen

### Reaktionen (`index.html`)
- Kategorisierte Seitenleiste mit aufklappbaren Gruppen und Volltextsuche
- Reaktionsstrukturen via OpenChemLib; der Pfeil samt Reagenz-Beschriftung wird von `mol-renderer.js` gesetzt
- Schwierigkeits-Filter (A — Einsteiger / B — JÖChO / C — BW / D — Spezial)
- Hash-basierte Direktlinks (`#reaktions-id`), mobil-responsiv
- Druck-/PDF-Export via `export.html`

### Quiz (`quiz.html`)
Jede Frage ist eine **Aufgabe aus Abschnitten** (`type: "composed"`) — so wie eine BW-Angabe aus A., B., C. besteht. Es gibt keinen Fragen-Typ mehr zu wählen; gewählt wird pro Abschnitt:

| Abschnitts-Typ | Beschreibung |
|---|---|
| `synthesis` | Mehrstufiges Schema aus Strukturen + beschrifteten Pfeilen, angeordnet wie in den BW-Angaben (siehe *Schema-Layout*). Strukturen stehen ohne Rahmen auf dem Blatt; vorgegebene sind sofort sichtbar, gesuchte zeigen ihren Buchstaben und werden per Klick aufgedeckt (der Buchstabe steht dann mittig unter der Struktur). Beschriftungen weichen Strukturen, anderen Beschriftungen und fremden Pfeilen aus, bleiben aber immer am eigenen Pfeil. |
| `multiple_choice` | 2–4 Antwortmöglichkeiten mit Strukturen, Klick-Grading. Z. B. Markownikow vs. Anti-Markownikow. |
| `short_answer` | Freitext-Frage mit Musterlösung. Z. B. SN1- vs. SN2-Faktoren. |
| `mechanism` | Schrittweise Mechanismus-Aufdeckung. Z. B. basenkatalysierte Aldol-Addition: Enolat → Alkoxid → Aldol. |
| `intro` | Reiner Fließtext zwischen zwei Schema-Teilen. |

Die ganze Aufgabe steht auf **einem Blatt**: eine Fortschrittsleiste oben (Aufdecken/Zurücksetzen für alle Schemata), Zoom-Knöpfe rechts neben jedem Schema, Hinweise aus der Angabe direkt über dem jeweiligen Abschnitt.

### Admin (`admin.html`)
- Tab **Reaktionen** — Editor für `data/reactions.json`. Das Reaktionsschema wird **WYSIWYG** bearbeitet: Reaktanten-Boxen links, Produkt-Boxen rechts, dazwischen ein Pfeil, dessen beide Textfelder direkt `reagent_label` / `reagent_label_below` sind. Klick auf eine Box öffnet Ketcher für genau diese Komponente; „＋“ fügt eine weitere hinzu; „＋ Struktur“ über dem Pfeil setzt Reagenz-Strukturen (`reagent_mols`) zusätzlich zum Text. Gespeichert wird als RXN-Datei, die Geometrie bleibt 1:1 erhalten
- Tab **Quiz** — Editor für `data/questions.json`:
  - Abschnitts-Reiter (`＋ Abschnitt` → Typ aus der Liste wählen)
  - Graph-Editor mit Ketcher pro Struktur und OCL-Live-Preview
  - Kanten-Editor mit `from[]`, `to`, Reagenz-Beschriftung über/unter dem Pfeil
  - **Vorgegeben / Gesucht** je Knoten — Schalter im Detailpanel oder Taste <kbd>G</kbd>; **✓ Ausgangsstoffe vorgeben** markiert alle Strukturen ohne eingehenden Pfeil
  - Pro Knoten: Beschriftung (leer = keine), Name (erst nach dem Aufdecken sichtbar) und **Angabe-Text unter der Struktur** (`caption`, immer sichtbar, z. B. Summenformel)
  - Pro Abschnitt: **Angabe-Text & Hinweise** (`body`, `hints`)
  - **Auto-Layout** ordnet das Schema nach Reaktionen an (siehe *Schema-Layout*)
  - „Layout neu" pro Knoten (RDKit-CoordGen für textbuchgenaue 2D-Koordinaten)
- Tab **Commit** — Push-to-`main` via GitHub REST API mit PAT (im Browser-`localStorage`)

---

## Tech-Stack

| Schicht | Wahl | Anmerkung |
|---|---|---|
| Deployment | GitHub Pages | Statisch, kein Build, automatisch bei Push nach `main` |
| Lokaler Server | Node.js + Express | Nur für Admin-Schreibzugriff (Reactions/Questions) |
| Frontend | Vanilla JS + HTML | Kein Build, kein Bundler, kein Framework |
| Daten | JSON in `data/` | Menschenlesbar, git-freundlich |
| Renderer (überall) | OpenChemLib v8 (CDN, ~500 KB) | MOL/SMILES → SVG, läuft auch auf Pages; `mol-renderer.js` setzt Pfeil + Beschriftung |
| Layout-Optimierung | RDKit-JS (CDN, ~4 MB, lazy) | CoordGen-2D-Layout, nur Admin |
| Struktur-Editor | Ketcher 3.12 (vendor/, ~26 MB committed) | EPAM, eingebettet via iframe, lädt auf Lokal + Pages |

**Pages-Bundle** = OCL (500 KB) + HTML/CSS/JS — keine WASM. Ketcher liegt im Repo und wird nur im Admin geladen.

---

## Repository-Struktur

```
OC-oecho/
├── index.html              ← Reaktionsbrowser
├── quiz.html               ← Quiz-Viewer (Multi-Typ)
├── export.html             ← Druckansicht
├── admin.html              ← Admin-Bereich (Reaktionen + Quiz + Commit)
├── mol-renderer.js         ← OpenChemLib-Wrapper (MOL/SMILES/Reaktion → SVG)
├── scheme-graph-editor.js  ← SVG-Schema-Editor + Quiz-Viewer (Reaktions-Layout, Pfeil-Routing)
├── rdkit-helper.js         ← Lazy-Loader für RDKit-JS (Admin-Layout-Optimierung)
├── server.js               ← Express-Server + /api/reactions + /api/questions
├── package.json
├── .gitignore              ← schließt vendor/ aus
│
├── data/
│   ├── reactions.json      ← Reaktionseinträge
│   └── questions.json      ← Quizfragen
│
├── tools/
│   └── source-audit-2026*.js ← Abgleich aller Aufgaben mit den Original-Angaben (BW 39–52, LW 43–52)
│
├── vendor/
│   └── ketcher/standalone/ ← Ketcher 3.12 Build (committed, ~26 MB)
│
└── .github/workflows/
    └── pages.yml
```

---

## Lokale Einrichtung

### Voraussetzungen

- Node.js ≥ 18

### Erste Einrichtung

```bash
git clone https://github.com/KingAlo7/OC-oecho.git
cd OC-oecho
npm install
```

Der Ketcher-Strukturzeichner (~26 MB, `vendor/ketcher/standalone/`) ist im Repository enthalten — kein zusätzlicher Download nötig. Funktioniert sowohl lokal als auch auf GitHub Pages.

### Starten

```bash
node server.js
```

| URL | Inhalt |
|---|---|
| `http://localhost:3000` | Reaktionsbrowser |
| `http://localhost:3000/quiz.html` | Quiz / Aufgaben |
| `http://localhost:3000/admin.html` | Admin (Reaktionen + Quiz + Commit) |
| `http://localhost:3000/export.html` | Druckansicht |

---

## Datenschemas

### `data/reactions.json` — Reaktionen

Array von Reaktionsobjekten, gerendert via OpenChemLib. Pflichtfelder: `id`, `category`, `name`. Häufige Felder:

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | `string` | Eindeutiger Slug; URL-Hash (`#sn2-alkylhalogenid`) |
| `category` | `string` | Seitenleistengruppe |
| `name` | `string` | Anzeigename |
| `difficulty` | `'A'\|'B'\|'C'\|'D'` | Schwierigkeitsstufe (Filter) |
| `reaktionstyp` | `string` | `SN1`, `E2`, `AN`… |
| `transformation` | `string` | Kurzformel der Umsetzung (`R-X → R-OH`) |
| `reaction_rxn` | `string` | **Zeichnung.** RXN-V2000-Datei aus Ketcher — ein `$MOL`-Block je Komponente, mit den exakt gezeichneten Koordinaten |
| `reaction_smiles` | `string` | Abgeleiteter Such-/Dedup-Schlüssel. Koordinatenfrei, wird **nicht** gerendert, solange `reaction_rxn` vorhanden ist |
| `reagent_label` | `string` | LaTeX-Syntax über Pfeil (`H_2SO_4`, `C_12H_22O_11`, `Fe^3+`, `[Ag(NH_3)_2]^{+}`) — gilt überall, siehe `chem-text.js` |
| `reagent_label_below` | `string` | LaTeX-Syntax unter Pfeil |
| `reagent_mols` | `string[]` | Optional: MOL-Blöcke, die (verkleinert) über dem Pfeil gezeichnet werden, über `reagent_label` |
| `conditions` | `string` | Reaktionsbedingungen |
| `stereochemistry` | `string` | Stereochemischer Ausgang |
| `key_points` | `string[]` | Mechanismusstichpunkte |

#### Zeichenkonvention der Bibliothek

Damit sich Einträge vergleichen lassen, ist die Orientierung überall dieselbe:

| Regel | |
|---|---|
| Hauptkette | waagrecht, Zickzack, links → rechts, erster Schritt nach oben |
| Generischer Rest (R₁, Ar) | am **linken** Ende |
| Reagierendes Zentrum | am **rechten** Ende |
| C=O | zeigt **nach oben** |
| Sechsringe | **Knoten oben und unten**, senkrechte Bindungen an den Flanken |
| Substituent am Ring | verlässt den Ring **radial** (auf dem Strahl Mittelpunkt → Ecke) |
| C≡C, C≡N, Diazonium | **180°**, kollinear mit dem Nachbaratom |
| Drei-Ringe (Epoxid) | Winkel 60° **relativ zur C–C-Bindung**, nicht zur Seite |
| Produkt | übernimmt die Koordinaten des Edukts, wo sich das Gerüst nicht ändert |

`tools/build-reaction-library.js` **prüft das beim Bauen** und bricht ab, wenn eine Bindungslänge abweicht, ein sp-Zentrum nicht linear ist, ein Dreiring nicht gleichseitig ist, ein Atom keine Bindung hat oder zwei Atome übereinanderliegen.

> **Warum RXN und nicht SMILES?** SMILES ist koordinatenfrei — beim Rendern muss
> OpenChemLib ein Layout *erfinden*, und das ist immer der ideale 120°-Zickzack.
> Die RXN-Datei trägt pro Atom ein (x,y), also bleibt ein bewusst schräg
> gezeichneter Winkel schräg. Jede Komponente wird mit `autoCrop` gerendert;
> OCL deckelt die Bindungslänge bei 24 px, sodass alle Komponenten einer
> Reaktion automatisch im selben Maßstab stehen.

### `data/questions.json` — Quizfragen

Array von Fragenobjekten. Jede Frage hat `type: "composed"` und ein Array `sections`; die Felder `id`, `category`, `name` sind Pflicht, `difficulty`, `source`, `intro`, `hints` optional.

```json
{
  "id": "bw43-2017-atropin",
  "type": "composed",
  "name": "Atropin — Tropin + Tropasäure (BW 2017)",
  "sections": [ { "type": "synthesis", "title": "Strang 1", "scheme": { } } ]
}
```

**Abschnitt `type: "synthesis"`** — Knoten + Kanten:

```json
{
  "type": "synthesis",
  "scheme": {
    "nodes": [
      { "id": "A", "label": "A", "given": true, "name": "Furan", "smiles": "c1ccoc1" },
      { "id": "C", "label": "C", "given": false, "name": "Diels-Alder-Addukt",
        "smiles": "O1C2C=CC1C(=C2C(=O)OC)C(=O)OC",
        "mol": "...MOL V2000 mit baked coords...",
        "explanation": "Diels-Alder-Cycloaddition [4+2]...",
        "related_reaction_id": "diels-alder" }
    ],
    "edges": [
      { "from": ["A", "B"], "to": "C", "reagent_above": "Δ, in Benzol" }
    ]
  }
}
```

- `given: true` → Struktur ist von Anfang an sichtbar (wie in der BW-Angabe gezeichnet)
- `label` → Buchstabe unter der Struktur; `""` blendet ihn aus (z. B. für ungelabelte Edukte)
- `name` → wird erst nach dem Aufdecken gezeigt (bei vorgegebenen sofort)
- `caption` → Text, den die Angabe unter die Verbindung schreibt (Summenformel, „R-Form“, Name); immer sichtbar, LaTeX-Syntax erlaubt
- `alias` → `{ "0": "X" }` zeigt am Atom 0 (Reihenfolge im SMILES) „X“ statt des Elementsymbols, wenn die Angabe ein allgemeines Symbol zeichnet
- Abschnitt-Felder `body` (Angabe-Text) und `hints` (Array, „Hinweise“ der Angabe) werden über dem Abschnitt angezeigt
- `given: false` → an Stelle der Struktur steht ihr Buchstabe (bzw. „?“ bei leerem `label`), Klick deckt auf
- `mol` (bevorzugt) wird vor `smiles` gerendert — enthält die optimierten Koordinaten
- `x`/`y` sind Layout-Hinweise. Fehlt `"layout": "manual"` am Schema, rechnet der Viewer das
  Layout für die Bildschirmbreite des Lesers neu (so viele Spalten, wie ohne starkes Verkleinern passen; 2 am Handy).
  Sobald jemand im Admin einen Knoten zieht, wird `"layout": "manual"` gesetzt und die
  Positionen bleiben unangetastet.

**Schema-Layout.** Pfeile mit denselben Edukten und derselben Beschriftung bilden eine Reaktion
(„A + W → B + X“); gleich beschriftete Pfeile von einem Edukt ebenso („C → E + d“). Pro Reaktion gibt es ein
Haupt-Edukt (längster Weg davor) und ein Haupt-Produkt (längster Weg danach):

- Die Hauptkette läuft geradeaus; am Rand der Bildschirmbreite biegt sie nach unten ab und läuft zurück.
- Ein Co-Edukt steht über dem Pfeil und mündet in ihn, ein Co-Produkt steht darunter und zweigt ab.
  Drei oder mehr Edukte stehen untereinander und laufen in einer Klammer zusammen; an senkrechten
  Pfeilen stehen Co-Edukte/-Produkte links und rechts.
- Nebenreaktionen zweigen als Gabel ab (gemeinsames Pfeilstück, eigene Spitze) oder gehen nach unten,
  oben oder zurück — je nachdem, was frei ist und näher an den Folgeverbindungen liegt.
- Eine Verbindung, die über mehrere Wege entsteht, sitzt am längsten Weg; kürzere Wege münden als
  eigene Pfeile ein. Pfeile, die nicht in dieses Raster passen, werden um Strukturen herum geführt
  und meiden bestehende Pfeile.

**Abschnitt `type: "multiple_choice"`** — Strukturen oder Text-Antworten:

```json
{
  "type": "multiple_choice",
  "prompt": "Welches Produkt …?",
  "givens": { "smiles": "CC=C", "reagent_label": "HBr" },
  "choices": [
    { "id": "a", "smiles": "CCCBr",  "label": "1-Brompropan", "correct": false },
    { "id": "b", "smiles": "CC(C)Br", "label": "2-Brompropan", "correct": true }
  ],
  "explanation": "Markownikow-Addition…"
}
```

**Abschnitt `type: "short_answer"`** — Freitext mit Musterlösung:

```json
{
  "type": "short_answer",
  "prompt": "Nennen Sie die drei Faktoren…",
  "expected_answer": "1) Substratstruktur: primär → SN2…"
}
```

**Abschnitt `type: "mechanism"`** — Schrittweise Aufdeckung:

```json
{
  "type": "mechanism",
  "prompt": "Aldol-Addition von zwei Acetaldehyd…",
  "givens": { "smiles": "CC=O.CC=O", "reagent_label": "OH^-" },
  "mech_steps": [
    { "name": "Enolat", "smiles": "[CH2-]C=O", "explanation": "…" },
    { "name": "Alkoxid", "smiles": "CC([O-])CC=O", "explanation": "…" },
    { "name": "Aldol", "smiles": "CC(O)CC=O", "explanation": "…" }
  ]
}
```

---

## Renderer-Architektur

Drei Bibliotheken arbeiten zusammen, um sowohl gute Layouts als auch ein leichtgewichtiges Pages-Bundle zu garantieren:

```
                  ┌────────────────────────────────────┐
                  │ Admin (admin.html)                 │
                  │                                    │
   Benutzer       │  ┌──────────────┐  ┌────────────┐  │
   zeichnet ──────┼─►│  Ketcher     │  │ RDKit-JS   │  │
                  │  │  (Editor)    │  │ (CoordGen) │  │
                  │  │   ~26 MB     │  │  ~4 MB     │  │
                  │  └──────┬───────┘  └─────┬──────┘  │
                  │         │                 │        │
                  │         │ MOL             │ baked  │
                  │         ▼                 ▼ MOL    │
                  │  ┌──────────────────────────────┐  │
                  │  │ data/questions.json (Server) │  │
                  │  └─────────────┬────────────────┘  │
                  └────────────────┼───────────────────┘
                                   │
                  ┌────────────────┼───────────────────┐
                  │ Quiz / Pages   │                   │
                  │                ▼                   │
                  │  ┌──────────────────────────────┐  │
                  │  │  OpenChemLib (Renderer)      │  │
                  │  │  ~500 KB, kein WASM          │  │
                  │  └──────────────────────────────┘  │
                  └────────────────────────────────────┘
```

- **Ketcher** — Professionelles Zeichenwerkzeug. Liefert MOL mit hand-positionierten Koordinaten. Nur Admin (iframe).
- **RDKit-JS** — Wird auf Knopfdruck pro Knoten geladen. Optimiert vorhandene Strukturen mit CoordGen (gleiche Engine wie ChemDraw für gespannte/verbrückte Systeme). Nur Admin.
- **OpenChemLib** — Reine JS-Bibliothek. Rendert das gespeicherte MOL exakt wie geschrieben. Auf Quiz und Admin geladen.

**Stereochemie-Anzeige:** OCL würde standardmäßig Annotationen wie „unknown chirality", „abs", „rac" auf den Rendern einblenden. Wir setzen `suppressChiralText`, `suppressCIPParity`, `suppressESR`, `noStereoProblem` alle auf `true` in `mol-renderer.js`, damit die Anzeige textbuchsauber bleibt.

**Ketcher-Einstellungen:** Beim Öffnen des Editors werden `hideTerminalLabels: true`, `hideImplicitHydrogen: true`, `showStereoFlags: false` gesetzt, damit terminale Methylgruppen als Skelettendpunkte erscheinen und keine Stereo-Flags überlagert werden.

---

## Admin-Workflow

### Neue Quizfrage anlegen

1. `admin.html` lokal öffnen → Tab **Quiz** → **＋ Neu**
2. Typ wählen (`synthesis` / `multiple_choice` / `short_answer` / `mechanism`)
3. Für `synthesis`:
   - **＋ Struktur** pro Knoten — ID, Name, Status (vorgegeben/versteckt) eintragen
   - Pro Knoten **Bearbeiten** → Ketcher öffnet sich → Struktur zeichnen → **Übernehmen**
   - Optional: **Layout neu** → RDKit-CoordGen-Bereinigung der Koordinaten
   - **＋ Pfeil** pro Kante — `from[]` (Quell-IDs), `to` (Ziel-ID), Reagenz oben/unten
4. **Übernehmen** speichert lokal in `data/questions.json` (Server-Modus)
5. **Commit-Tab** → Nachricht eingeben → **Commit & Push** überträgt auf GitHub

### Bestehende Quizfrage bearbeiten

- Knoten in der Liste anklicken → Editor füllt sich
- Strukturen können in Ketcher oder durch direktes SMILES/MOL-Editing modifiziert werden (`SMILES / MOL direkt bearbeiten`-Toggle in der Knoten-Karte)
- **Alle Layouts neu berechnen** ist nützlich nach JSON-Import oder größerer Umstellung

### PAT für GitHub-Commits

1. `github.com/settings/tokens` → Fine-grained token mit `Contents: Read and write` auf das Repo
2. Im Admin → Commit-Tab eingeben + **Konfiguration speichern**
3. **Verbindung testen** zur Bestätigung

---

## GitHub Pages Deployment

`.github/workflows/pages.yml` deployt automatisch bei Push nach `main`. Kein Build-Schritt — alle Frontend-Dateien sind statisch.

Auf Pages **nicht verfügbar**: `/api/*` (kein Node-Server). Der **Ketcher-Editor funktioniert auf Pages** (das vendor-Bundle ist committet). Lokal speichern (`POST /api/questions`) geht nur mit laufendem `node server.js`; das Direct-Push aus dem Commit-Tab funktioniert auch auf Pages über die GitHub-API.

---

## Code-Stil

- Vanilla ES6+, kein Build, keine Module
- CSS Custom Properties für Theming
- Daten in `data/`, Logik in `.js`, UI in `.html`
- Renderer-Wrapper als Singletons (`ReactionRenderer`, `MolRenderer`, `RDKitHelper`)
- Express ist die einzige Runtime-Dependency

### Pull Requests

- Ein Anliegen pro PR
- Bei neuen Reaktionen Quellenangabe in der PR-Beschreibung
- Lokal testen vor dem Push: `node server.js`, dann mindestens `/`, `/quiz.html`, `/export.html` prüfen
