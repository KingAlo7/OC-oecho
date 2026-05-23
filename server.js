const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname));

const dataPath = f => path.join(__dirname, 'data', f);
const read     = f => JSON.parse(fs.readFileSync(dataPath(f), 'utf8'));
const write    = (f, d) => fs.writeFileSync(dataPath(f), JSON.stringify(d, null, 2));

// Reactions API
app.get('/api/reactions',  (_, res) => res.json(read('reactions.json')));
app.post('/api/reactions', (req, res) => { write('reactions.json', req.body); res.json({ ok: true }); });

app.listen(PORT, () => {
  console.log(`\n  OC Referenz   →  http://localhost:${PORT}`);
  console.log(`  Admin         →  http://localhost:${PORT}/admin.html`);
  console.log(`  Export        →  http://localhost:${PORT}/export.html`);
  console.log(`  GitHub Pages  →  https://kingalo7.github.io/OC-oecho/\n`);
});
