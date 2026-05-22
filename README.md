# OC-Quiz

A self-hosted organic chemistry quiz app with admin panel and print-ready export.

## Quick start

```bash
npm install
node server.js
# -> http://localhost:3000
```

## Pages

| URL | Purpose |
|-----|---------|
| `/` | Quiz — topic/difficulty filter, SMILES rendering, scoring |
| `/admin.html` | Add / edit / delete questions and reference tables |
| `/export` | Print-ready document — filter by topic, toggle answers |

## Question schema

```json
{
  "id": "q1",
  "topic": "Substitution",
  "difficulty": "medium",
  "type": "mcq",
  "question": "Which mechanism applies?",
  "smiles": "CC(C)(C)Br",
  "options": ["SN1", "SN2", "E1", "E2"],
  "answer": "SN1",
  "explanation": "Tertiary substrate."
}
```

**Types:** `mcq` · `true_false` · `short_answer` · `mechanism_svg`

## Roadmap
- [ ] Mechanism drawing (Ketcher)
- [ ] Score history
- [ ] CSV bulk import
