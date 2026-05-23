# OC Reference

An interactive organic chemistry reaction reference for IChO-level study. Browse 49+ named reactions with structures (rendered from SMILES), conditions, scope, and mechanistic notes. Fully static — deployable to GitHub Pages with zero configuration.

**Live site:** https://kingalo7.github.io/OC-oecho/

---

## Features

- Categorised sidebar with collapsible groups and full-text search
- Reaction structures rendered via [smiles-drawer v2](https://github.com/reymond-group/smilesDrawer) (CDN, no build step)
- Print/PDF export via `export.html`
- Local admin panel for editing quiz questions and reference tables
- Hash-based deep links (`#reaction-id`)
- Mobile-responsive

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Deployment | GitHub Pages | Automatic on push to `main` |
| Local server | Node.js + Express | Only needed for admin writes |
| Frontend | Vanilla JS + HTML | No build step, no framework |
| Data | JSON files | Human-readable, git-friendly |
| Structure drawing | smiles-drawer v2 (CDN) | Loaded from unpkg |

---

## Repository structure

```
OC-oecho/
├── index.html              ← Reaction browser (GitHub Pages entry point)
├── export.html             ← Print/PDF export view
├── admin.html              ← Admin panel — questions & tables editor (local only)
├── reaction-drawer.js      ← smiles-drawer v2 wrapper (ReactionRenderer)
├── logo.svg
├── server.js               ← Local Express server (admin API)
├── package.json
├── .gitignore
├── .nojekyll               ← Prevents Jekyll processing on GitHub Pages
│
├── data/
│   ├── reactions.json      ← Reaction entries for the reference browser
│   ├── questions.json      ← Quiz questions (admin panel)
│   └── tables.json         ← Reference tables (admin panel)
│
└── .github/workflows/
    └── pages.yml           ← Auto-deploy to GitHub Pages on push to main
```

> **Note:** `public/` and `export/` subdirectories contain deprecated files with redirect stubs. Do not edit them — they exist only to avoid dead links from old references.

---

## Getting started

### Prerequisites

- Node.js ≥ 18 (only needed for local admin writes; not needed for static browsing)

### Run locally

```bash
git clone https://github.com/KingAlo7/OC-oecho.git
cd OC-oecho
npm install
node server.js
```

Then open:

| URL | What it is |
|---|---|
| `http://localhost:3000` | Reaction browser |
| `http://localhost:3000/admin.html` | Admin panel |
| `http://localhost:3000/export.html` | Export/print view |

> `index.html` and `export.html` also work when opened directly from the filesystem (`file:///...`), but CORS will block the `fetch('./data/reactions.json')` call in some browsers. Use the server if that happens.

---

## Data schema

### `data/reactions.json`

Array of reaction objects. Minimum required fields:

```json
{
  "id": "sn2-alkyl-halide",
  "category": "Nucleophilic Substitution",
  "name": "SN2 — Bimolecular Substitution",
  "reaction_smiles": "CCBr.[OH-]>>CCO.[Br-]",
  "reagent_label": "NaOH / H₂O",
  "tags": ["SN2", "inversion", "primary"],
  "conditions": "Primary substrate; polar aprotic or protic solvent",
  "key_points": [
    "Concerted — no carbocation intermediate",
    "Walden inversion (backside attack)",
    "Rate = k[RX][Nu] — second order"
  ],
  "notes": "Preferred over SN1 for primary and unhindered secondary substrates."
}
```

Full field reference:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | ✅ | Unique slug; used as URL hash (`#sn2-alkyl-halide`) |
| `category` | `string` | ✅ | Sidebar group (e.g. `"Nucleophilic Substitution"`) |
| `name` | `string` | ✅ | Display name |
| `subtitle` | `string` | | One-line italic description under the name |
| `reaktionstyp` | `string` | | Mechanism type abbreviation (`SN1`, `E2`, `AN`, …) |
| `transformation` | `string` | | Short substrate → product summary |
| `reaction_smiles` | `string` | | Reaction SMILES (`reactants>reagents>products`) |
| `reagent_label` | `string` | | Text above the reaction arrow (overrides SMILES reagent field) |
| `general_scheme` | `string` | | Plaintext fallback when no SMILES is available |
| `tags` | `string[]` | | Searchable tags |
| `conditions` | `string` | | Reaction conditions |
| `key_points` | `string[]` | | Bullet-point mechanistic notes |
| `notes` | `string` | | Extended context / synth relevance |
| `substrate_scope` | `string` | | |
| `stereochemistry` | `string` | | |
| `kinetics` | `string` | | |
| `solvent` | `string` | | |

**Validating SMILES:** Test reaction SMILES at the [smiles-drawer demo](https://reymond-group.github.io/smilesDrawer/) before committing.

### `data/questions.json`

Quiz question objects, edited via the admin panel:

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique ID |
| `topic` | `string` | Category label |
| `difficulty` | `"easy"` \| `"medium"` \| `"hard"` | |
| `type` | `"mcq"` \| `"true_false"` \| `"short_answer"` \| `"mechanism_svg"` | |
| `question` | `string` | Question text |
| `smiles` | `string` | Single-molecule SMILES (optional) |
| `reaction_smiles` | `string` | Reaction SMILES (optional) |
| `options` | `string[]` | Answer choices |
| `answer` | `string` | Correct answer — must match one option exactly |
| `explanation` | `string` | Post-answer explanation |
| `tags` | `string[]` | |
| `flagged` | `boolean` | Marks items for review |

### `data/tables.json`

Array of reference table objects:

```json
[
  {
    "id": "fg-table",
    "title": "Functional Groups",
    "headers": ["Group", "Suffix", "Example"],
    "rows": [
      ["Alcohol", "-ol", "ethanol"]
    ]
  }
]
```

---

## `reaction-drawer.js` API

A thin wrapper around smiles-drawer's `ReactionDrawer`. Requires smiles-drawer ≥ 2.x on the page.

```js
// Draw into an existing <svg> element or by id
ReactionRenderer.draw(reactionSmiles, svgElementOrId, theme, textAbove, textBelow);

// Append a new <svg> into a container and draw
ReactionRenderer.drawInto(reactionSmiles, containerElementOrId, theme, textAbove, textBelow);
```

- `theme`: `'dark'` (default) or `'light'`
- `textAbove`: label above the arrow; defaults to `'{reagents}'` which uses the SMILES reagent field
- Returns the `<svg>` element, or `null` on error (error rendered inline in the SVG)

---

## Admin panel

`/admin.html` makes `POST /api/*` requests to the Express server and writes JSON to disk directly. **It does not work on GitHub Pages** — the server must be running locally.

Features:
- Add / edit / delete quiz questions with SMILES input fields
- Add / edit reference tables as editable JSON
- Raw JSON editor tab for bulk changes
- 🚩 Flag questions for review

After editing, persist to the repo:

```bash
git add data/
git commit -m "data: update questions"
git push
```

GitHub Actions will re-deploy Pages automatically.

---

## GitHub Pages deployment

Configured in `.github/workflows/pages.yml`. Triggers on every push to `main`. Uploads the entire repo root as the Pages artifact — no build step required.

The `/api/*` routes and admin writes are **not** available on Pages; they require the local Node.js server.

---

## Contributing

### Adding or editing reactions

1. Edit `data/reactions.json` directly in a text editor or via `PATCH /api/reactions` when running the local server.
2. Follow the schema above. `id` must be unique across all entries.
3. Validate reaction SMILES before committing.
4. Keep `category` values consistent with existing ones to avoid sidebar fragmentation.

### Code style

- Vanilla ES6+, no modules, no bundler — keep it that way.
- CSS custom properties for theming (all defined in `:root` in `index.html`).
- Data in `data/`, rendering logic in `.js`, UI in `.html` — maintain the separation.
- No dependencies beyond Express (local server) and smiles-drawer (CDN).

### Pull requests

- One concern per PR.
- If adding reactions, include the literature source or reference in the PR description.
- Test locally before pushing: verify both `http://localhost:3000` and `http://localhost:3000/export.html`.
- The GitHub Actions deploy is automatic — no manual step needed after merge to `main`.
