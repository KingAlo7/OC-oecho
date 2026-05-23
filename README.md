# OC-Quiz

A self-hosted organic chemistry quiz app with a live admin panel and print-ready export.

## Quick start

```bash
npm install
node server.js
# → http://localhost:3000
```

## Pages

| URL | Purpose |
|-----|---------|
| `/` | Quiz — topic/difficulty filter, SMILES rendering, scoring |
| `/admin.html` | Add / edit / delete questions and reference tables |
| `/export` | Print-ready document — filter by topic, toggle answers |

## Data

All questions live in `data/questions.json`, reference tables in `data/tables.json`.  
Both files are edited live through the admin panel and persist to disk.

### Question schema

```json
{
  "id": "q1",
  "topic": "Substitution",
  "difficulty": "medium",
  "type": "mcq",
  "question": "Which mechanism applies to (CH₃)₃CBr + OH⁻ in water?",
  "smiles": "CC(C)(C)Br",
  "options": ["SN1", "SN2", "E1", "E2"],
  "answer": "SN1",
  "explanation": "Tertiary substrate — stable carbocation, solvolysis conditions."
}
```

**Types:** `mcq` · `true_false` · `short_answer` · `mechanism_svg` (SVG field for future Ketcher integration)

## Roadmap

- [ ] Mechanism drawing with Ketcher
- [ ] Score history / local storage
- [ ] CSV import for bulk question upload
- [ ] Tag-based filtering
