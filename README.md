# OC Reference

A static organic chemistry reaction reference — mechanisms, conditions, scope, and key insights for 21 core reactions across 8 categories.

## Local development

```bash
npm install
node server.js          # → http://localhost:3000
```

## Deployment

### GitHub Pages (recommended — free, no domain needed)

1. Push the repo to GitHub
2. Go to **Settings → Pages**
3. Source: **Deploy from branch** → branch: `main`, folder: `/ (root)`
4. Save → your site is live at `https://kingalo7.github.io/OC-Quiz/`

Everything is static — `index.html` + `data/reactions.json` + CDN scripts. No server needed.

To **update content**: edit `data/reactions.json` and push. GitHub Pages rebuilds in ~60 seconds.

---

### Railway (free tier — adds editing API)

1. Create account at [railway.app](https://railway.app)
2. New Project → **Deploy from GitHub repo**
3. Select this repo → Railway auto-detects Node.js
4. Done — get a free URL like `oc-reference.up.railway.app`

Add `PORT` env variable if needed (Railway sets it automatically).

---

### Render (free tier)

1. [render.com](https://render.com) → New → **Web Service**
2. Connect GitHub repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Free URL: `oc-reference.onrender.com`

> Note: free Render instances spin down after 15 min of inactivity (cold start ~30s).

---

### Fly.io (free tier, no cold starts)

```bash
brew install flyctl
fly auth login
fly launch       # follow prompts, auto-detects Node.js
fly deploy
```

Gets you a free `oc-reference.fly.dev` URL.

---

## Data format

Each reaction in `data/reactions.json`:

```json
{
  "id": "sn2",
  "category": "Nucleophilic Substitution",
  "name": "SN2 Reaction",
  "subtitle": "Bimolecular Nucleophilic Substitution",
  "reaction_smiles": "CBr.[OH-]>>CO.[Br-]",
  "reagent_label": "Nu:⁻",
  "tags": ["SN2", "concerted", "inversion"],
  "conditions": "Polar aprotic solvent...",
  "substrate_scope": "Methyl ≈ 1°...",
  "nucleophile": "...",
  "leaving_group": "...",
  "stereochemistry": "...",
  "kinetics": "...",
  "mechanism": "...",
  "key_points": ["...", "..."],
  "notes": "..."
}
```

`reaction_smiles` uses the format `reactants>reagents>products`.  
`general_scheme` (text string) is shown instead when `reaction_smiles` is absent.

All fields except `id`, `category`, `name` are optional.

## Deep linking

Each reaction is URL-addressable via hash: `https://your-url/#sn2`
