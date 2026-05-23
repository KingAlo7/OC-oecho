# OC Referenz

Interaktives Nachschlagewerk für organische Chemie auf IChO-Niveau. Über 49 benannte Reaktionen mit Strukturen (aus SMILES gerendert), Bedingungen, Substratumfang und mechanistischen Hinweisen. Vollständig statisch — auf GitHub Pages deploybar.

**Live:** https://kingalo7.github.io/OC-oecho/

---

## Funktionen

- Kategorisierte Seitenleiste mit aufklappbaren Gruppen und Volltextsuche
- Reaktionsstrukturen via [smiles-drawer v2](https://github.com/reymond-group/smilesDrawer) (CDN, kein Build-Schritt)
- Druck-/PDF-Export via `export.html`
- Lokaler Admin-Bereich zum Bearbeiten und direkt Committen von Reaktionen
- Hash-basierte Direktlinks (`#reaktions-id`)
- Mobil-responsiv
- UI vollständig auf **Deutsch**

---

## Tech-Stack

| Schicht | Wahl | Anmerkung |
|---|---|---|
| Deployment | GitHub Pages | Automatisch bei Push nach `main` |
| Lokaler Server | Node.js + Express | Nur für Admin-Schreibzugriff nötig |
| Frontend | Vanilla JS + HTML | Kein Build-Schritt, kein Framework |
| Daten | JSON-Dateien | Menschenlesbar, git-freundlich |
| Strukturzeichnung | smiles-drawer v2 (CDN) | Von unpkg geladen |

---

## Repository-Struktur

```
OC-oecho/
├── index.html              ← Reaktionsbrowser (GitHub Pages Einstiegspunkt)
├── export.html             ← Druck-/PDF-Exportansicht
├── admin.html              ← Admin-Bereich — Reaktionseditor + GitHub Commit (nur lokal)
├── reaction-drawer.js      ← smiles-drawer v2 Wrapper (ReactionRenderer)
├── logo.svg
├── server.js               ← Lokaler Express-Server (Admin-API)
├── package.json
├── .gitignore
├── .nojekyll
│
├── data/
│   └── reactions.json      ← Alle Reaktionseinträge — die einzige Datei, die Redakteure bearbeiten
│
└── .github/workflows/
    └── pages.yml           ← Auto-Deploy nach GitHub Pages bei Push auf main
```

> **Hinweis:** `public/` und `export/` enthalten veraltete Redirect-Stubs. Nicht bearbeiten.

---

## Lokale Einrichtung

### Voraussetzungen

- Node.js ≥ 18 (nur für Admin-Schreibzugriff; für statisches Browsing nicht erforderlich)

### Starten

```bash
git clone https://github.com/KingAlo7/OC-oecho.git
cd OC-oecho
npm install
node server.js
```

| URL | Inhalt |
|---|---|
| `http://localhost:3000` | Reaktionsbrowser |
| `http://localhost:3000/admin.html` | Admin-Bereich |
| `http://localhost:3000/export.html` | Export-/Druckansicht |

---

## Datenschema — `data/reactions.json`

Array von Reaktionsobjekten. Mindestpflichtfelder:

```json
{
  "id": "sn2-alkylhalogenid",
  "category": "Nukleophile Substitution",
  "name": "SN2 — Bimolekulare Substitution",
  "reaction_smiles": "CCBr.[OH-]>>CCO.[Br-]",
  "reagent_label": "NaOH / H₂O",
  "tags": ["SN2", "Inversion", "primär"],
  "conditions": "Primäres Substrat; polar aprotisches oder protisches Lösungsmittel",
  "key_points": [
    "Konzertiert — kein Carbenium-Intermediat",
    "Walden-Inversion (Rückseitenangriff)",
    "Geschwindigkeit = k[RX][Nu] — zweite Ordnung"
  ],
  "notes": "Bevorzugt gegenüber SN1 bei primären und ungehinderten sekundären Substraten."
}
```

Vollständige Feldreferenz:

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | `string` | ✅ | Eindeutiger Slug; als URL-Hash verwendet (`#sn2-alkylhalogenid`) |
| `category` | `string` | ✅ | Seitenleistengruppe |
| `name` | `string` | ✅ | Anzeigename |
| `subtitle` | `string` | | Kursive Kurzbeschreibung unter dem Namen |
| `reaktionstyp` | `string` | | Mechanismustyp-Kürzel (`SN1`, `E2`, `AN`, …) |
| `transformation` | `string` | | Kurzdarstellung Substrat → Produkt |
| `reaction_smiles` | `string` | | Reaktions-SMILES (`Reaktanten>Reagenz>Produkte`) |
| `reagent_label` | `string` | | Text über dem Reaktionspfeil |
| `general_scheme` | `string` | | Textfallback wenn kein SMILES vorhanden |
| `tags` | `string[]` | | Suchbare Tags |
| `conditions` | `string` | | Reaktionsbedingungen |
| `key_points` | `string[]` | | Mechanistische Stichpunkte |
| `notes` | `string` | | Erweiterter Kontext / Syntheserelevanz |
| `substrate_scope` | `string` | | |
| `stereochemistry` | `string` | | |
| `kinetics` | `string` | | |
| `solvent` | `string` | | |

---

## Admin-Bereich (`admin.html`)

Zwei Tabs:

### ⚗ Reaktionen

- Linkes Panel: durchsuchbare Liste aller Reaktionen, nach Kategorie gruppiert
- Rechtes Panel: vollständiger Editor für alle Felder inkl. Live-SMILES-Vorschau
- **Kategorie-Auswahl**: Dropdown mit allen vorhandenen Kategorien + Option „— Neue Kategorie —“ zum Erstellen neuer Kategorien
- Aktionen: Lokal speichern / Duplizieren / Löschen / JSON-Import

### ↑ Commit

1. **GitHub Konfiguration**: Owner, Repository, Personal Access Token (im Browser-`localStorage` gespeichert, wird nie woanders übertragen)
2. **Dateistatus**: Vergleich lokal vs. remote (Eintragszähler)
3. **Commit & Push**: Überträgt `reactions.json` direkt per GitHub REST API nach `main`; GitHub Actions redeployt Pages automatisch
4. **Letzte Commits**: Zeigt die letzten 15 Commits am `data/`-Pfad mit SHA-Link, Nachricht, Autor und Datum

**Wichtig:** Admin-Schreibzugriff (lokales Speichern via `/api/reactions`) erfordert den laufenden Node.js-Server. GitHub Commit/Push funktioniert auch ohne Server direkt über die GitHub API.

### PAT einrichten

1. Unter `github.com/settings/tokens` einen Token mit `repo`-Scope erstellen
2. Im Admin-Bereich unter dem Commit-Tab eingeben und „Konfiguration speichern“ klicken
3. „Verbindung testen“ drücken zur Bestätigung

---

## GitHub Pages Deployment

Konfiguriert in `.github/workflows/pages.yml`. Wird bei jedem Push nach `main` ausgelöst. Lädt das gesamte Repository-Root als Pages-Artefakt hoch — kein Build-Schritt erforderlich.

Die `/api/*`-Routen sind auf Pages nicht verfügbar (kein Server). GitHub Commit aus dem Admin funktioniert weiterhin (direkte API-Aufrufe).

---

## Beitragen

### Reaktionen hinzufügen oder bearbeiten

1. `admin.html` lokal öffnen (Server starten), Reaktion bearbeiten, „Lokal speichern“ klicken
2. Im Commit-Tab Nachricht eingeben und „Commit & Push“ klicken
3. GitHub Actions deployt Pages automatisch neu

Alternativ: `data/reactions.json` direkt im Texteditor bearbeiten und `git push`.

### Code-Stil

- Vanilla ES6+, kein Build-System, keine Module
- CSS Custom Properties für Theming (alle in `:root` in `index.html`)
- Daten in `data/`, Logik in `.js`, UI in `.html`
- Keine neuen Abhängigkeiten außer Express (lokaler Server)

### Pull Requests

- Ein Anliegen pro PR
- Bei neuen Reaktionen Quellenangabe in der PR-Beschreibung
- Lokal testen bevor pushen: `node server.js` und beide `http://localhost:3000` und `http://localhost:3000/export.html` prüfen
