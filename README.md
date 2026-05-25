# OC Referenz + Quiz

Interaktives Nachschlagewerk für organische Chemie auf IChO-Niveau, mit zusätzlichem Quiz-Modus für mehrstufige Synthesen, Mechanismen und Regioselektivität. Über 80 benannte Reaktionen mit Strukturen, Bedingungen und mechanistischen Hinweisen — plus ein Quiz-Modus mit verbrückten Polycyclen, der OpenChemLib zum Rendern, RDKit-JS für Layout-Optimierung und Ketcher als Editor verwendet.

**Live:** https://kingalo7.github.io/OC-oecho/

---

## Funktionen

### Reaktionsreferenz (`index.html`)
- Kategorisierte Seitenleiste mit aufklappbaren Gruppen und Volltextsuche
- Reaktionsstrukturen via [smiles-drawer v2](https://github.com/reymond-group/smilesDrawer)
- Schwierigkeits-Filter (A — Einsteiger / B — JÖChO / C — BW / D — Spezial)
- Hash-basierte Direktlinks (`#reaktions-id`), mobil-responsiv
- Druck-/PDF-Export via `export.html`

### Quiz (`quiz.html`)
Vier Fragentypen, alle mit Klick-zum-Aufdecken und Link zur passenden Referenzreaktion:

| Typ | Beschreibung |
|---|---|
| `synthesis` | Mehrstufige Synthese als Flowchart aus Strukturen + beschrifteten Pfeilen. Knoten werden einzeln aufgedeckt. Beispiel: Stork's Cantharidin-Synthese (1951) — 15 Strukturen, 13 Pfeile, von Furan + DMAD bis Cantharidin. |
| `multiple_choice` | 2–4 Antwortmöglichkeiten mit Strukturen, Klick-Grading. Z. B. Markownikow vs. Anti-Markownikow. |
| `short_answer` | Freitext-Frage mit Musterlösung. Z. B. SN1- vs. SN2-Faktoren. |
| `mechanism` | Schrittweise Mechanismus-Aufdeckung. Z. B. basenkatalysierte Aldol-Addition: Enolat → Alkoxid → Aldol. |

### Admin (`admin.html`)
- Tab **Reaktionen** — Editor für `data/reactions.json` mit Live-SMILES-Vorschau
- Tab **Quiz** — Editor für `data/questions.json`:
  - Knoten-Karten mit OCL-Live-Preview, Ketcher-Editor pro Struktur, OCR-Button
  - Kanten-Editor mit `from[]`, `to`, Reagenz-Beschriftung über/unter dem Pfeil
  - „Layout neu" pro Knoten (RDKit-CoordGen für textbuchgenaue 2D-Koordinaten)
  - „Alle Layouts neu berechnen" für Batch-Import-Bereinigung
- Tab **Commit** — Push-to-`main` via GitHub REST API mit PAT (im Browser-`localStorage`)

---

## Tech-Stack

| Schicht | Wahl | Anmerkung |
|---|---|---|
| Deployment | GitHub Pages | Statisch, kein Build, automatisch bei Push nach `main` |
| Lokaler Server | Node.js + Express | Nur für Admin-Schreibzugriff (Reactions/Questions/OCR-Sidecar) |
| Frontend | Vanilla JS + HTML | Kein Build, kein Bundler, kein Framework |
| Daten | JSON in `data/` | Menschenlesbar, git-freundlich |
| Reaktionsrenderer | smiles-drawer v2 (CDN) | Lightweight für die Referenz (SMILES → SVG) |
| Quiz-Renderer | OpenChemLib v8 (CDN, ~500 KB) | MOL/SMILES → SVG, läuft auch auf Pages |
| Layout-Optimierung | RDKit-JS (CDN, ~4 MB, lazy) | CoordGen-2D-Layout, nur Admin |
| Struktur-Editor | Ketcher 3.12 (vendor/, ~26 MB) | EPAM, eingebettet via iframe, nur Admin |
| OCR (optional) | DECIMER + RDKit (Python) | Lokaler Sidecar, nur Admin |

**Pages-Bundle** = OCL (500 KB) + Smiles-Drawer (150 KB) + HTML/CSS/JS — keine WASM, kein Ketcher.

---

## Repository-Struktur

```
OC-oecho/
├── index.html              ← Reaktionsbrowser
├── quiz.html               ← Quiz-Viewer (Multi-Typ)
├── export.html             ← Druckansicht
├── admin.html              ← Admin-Bereich (Reaktionen + Quiz + Commit)
├── reaction-drawer.js      ← smiles-drawer v2 Wrapper
├── mol-renderer.js         ← OpenChemLib-Wrapper (MOL/SMILES → SVG)
├── rdkit-helper.js         ← Lazy-Loader für RDKit-JS (Admin-Layout-Optimierung)
├── server.js               ← Express-Server + /api/questions + /api/ocr
├── package.json
├── .gitignore              ← schließt vendor/ aus
│
├── data/
│   ├── reactions.json      ← Reaktionseinträge
│   └── questions.json      ← Quizfragen
│
├── tools/
│   └── ocr.py              ← Python-Sidecar: Bild → MOL via DECIMER/OSRA/MolScribe
│
├── vendor/                 ← NICHT im Git — lokal von Releases beziehen
│   └── ketcher/standalone/ ← Ketcher 3.12 Build (s. Setup unten)
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

### Ketcher-Editor bereitstellen (für Admin)

Ketcher ist nicht im Repo (~26 MB Build-Artefakte). Einmaliger Download:

```bash
mkdir -p vendor
curl -L https://github.com/epam/ketcher/releases/download/v3.12.0/ketcher-standalone-3.12.0.zip -o vendor/ketcher.zip
cd vendor && unzip -q ketcher.zip -d ketcher && rm ketcher.zip && cd ..
# Optional: nur den main-Bundle behalten (spart ~70 MB):
cd vendor/ketcher/standalone/static/js
rm -f closable.* duo.* popup.*
cd ../../../../..
rm vendor/ketcher/standalone/closable.html vendor/ketcher/standalone/duo.html vendor/ketcher/standalone/popup.html vendor/ketcher/standalone/iframe.html
```

Ohne diesen Schritt funktionieren `index.html`, `quiz.html` und die Referenz im Admin trotzdem — nur der „Bearbeiten"-Button pro Quiz-Knoten meldet einen Fehler.

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

### Optional: Strukturerkennung (OCR)

Der „OCR…"-Button pro Quiz-Knoten ruft einen lokalen Python-Sidecar auf. **Optional** — ohne OCR funktioniert alles andere; Strukturen werden im Ketcher-Editor gezeichnet oder per SMILES eingegeben.

DECIMER benötigt TensorFlow und unterstützt **nur Python 3.10 oder 3.11** (nicht 3.12+, nicht 3.14):

```powershell
# Python 3.10 von python.org installieren (PATH ankreuzen)
py -3.10 -m pip install --upgrade pip
py -3.10 -m pip install decimer rdkit
```

Beim ersten Aufruf lädt DECIMER ein Modell (~250 MB) nach `%USERPROFILE%\.data\DECIMER-V2\`.

**Diagnose:** Im Admin auf der „Quiz"-Liste den **OCR?**-Button klicken — meldet Python-Version und Modul-Status. Oder per CLI:

```bash
python tools/ocr.py --diagnose
```

Alternativ-Backends: `molscribe` (~500 MB), `osra` (klassische CV, leichter).

---

## Datenschemas

### `data/reactions.json` — Reaktionsreferenz

Array von Reaktionsobjekten, gerendert via smiles-drawer. Pflichtfelder: `id`, `category`, `name`. Häufige Felder:

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | `string` | Eindeutiger Slug; URL-Hash (`#sn2-alkylhalogenid`) |
| `category` | `string` | Seitenleistengruppe |
| `name` | `string` | Anzeigename |
| `difficulty` | `'A'\|'B'\|'C'\|'D'` | Schwierigkeitsstufe (Filter) |
| `reaction_smiles` | `string` | `Reaktanten>Reagenz>Produkte`-SMILES |
| `reagent_label` | `string` | LaTeX-Syntax über Pfeil (`H_2SO_4`, `[Ag(NH_3)_2]^{1+}`) |
| `reagent_label_below` | `string` | LaTeX-Syntax unter Pfeil |
| `conditions` | `string` | Reaktionsbedingungen |
| `key_points` | `string[]` | Mechanismusstichpunkte |
| `notes` | `string` | Erweiterter Kontext |
| `tags` | `string[]` | Suche |

### `data/questions.json` — Quizfragen

Array von Fragenobjekten. Gemeinsame Felder: `id`, `category`, `name`, `type`, optional `difficulty`, `intro`, `hints`, `related_reaction_id`. Typ-spezifisch:

**`type: "synthesis"`** — Composed-Modus mit Knoten + Kanten:

```json
{
  "id": "stork-cantharidin-1951",
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

- `given: true` → Struktur ist von Anfang an sichtbar
- `given: false` → Struktur ist mit „?" überdeckt, Klick deckt auf
- `mol` (bevorzugt) wird vor `smiles` gerendert — enthält die optimierten Koordinaten

**`type: "multiple_choice"`** — Strukturen oder Text-Antworten:

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

**`type: "short_answer"`** — Freitext mit Musterlösung:

```json
{
  "type": "short_answer",
  "prompt": "Nennen Sie die drei Faktoren…",
  "expected_answer": "1) Substratstruktur: primär → SN2…"
}
```

**`type: "mechanism"`** — Schrittweise Aufdeckung:

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

Auf Pages **nicht verfügbar**: `/api/*` (kein Node-Server), Ketcher-Editor (vendor/ ist in `.gitignore`), DECIMER-OCR (kein Python). Pages zeigt also Reaktionen + Quiz als reines Browse-Erlebnis; Bearbeiten passiert lokal.

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
