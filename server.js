const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app      = express();
const PORT     = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Data helpers ───────────────────────────────────────────────────────────────
const read  = file => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
const write = (file, data) => fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));

// ── Questions ──────────────────────────────────────────────────────────────────
app.get('/api/questions',       (_, res) => res.json(read('questions.json')));
app.post('/api/questions', (req, res) => { write('questions.json', req.body); res.json({ ok: true }); });

// ── Tables ─────────────────────────────────────────────────────────────────────
app.get('/api/tables',          (_, res) => res.json(read('tables.json')));
app.post('/api/tables',    (req, res) => { write('tables.json', req.body); res.json({ ok: true }); });

// ── Export page ────────────────────────────────────────────────────────────────
app.get('/export', (_, res) => res.sendFile(path.join(__dirname, 'export', 'index.html')));

app.listen(PORT, () => console.log(`OC-Quiz running → http://localhost:${PORT}`));
