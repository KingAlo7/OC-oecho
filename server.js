const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Quizzes carry inline base64 images, so allow a generous body size.
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

const dataPath = f => path.join(__dirname, 'data', f);
const read     = f => JSON.parse(fs.readFileSync(dataPath(f), 'utf8'));
const write    = (f, d) => fs.writeFileSync(dataPath(f), JSON.stringify(d, null, 2));

// Reactions API
app.get('/api/reactions',  (_, res) => res.json(read('reactions.json')));
app.post('/api/reactions', (req, res) => { write('reactions.json', req.body); res.json({ ok: true }); });

// Questions API
app.get('/api/questions',  (_, res) => res.json(read('questions.json')));
app.post('/api/questions', (req, res) => { write('questions.json', req.body); res.json({ ok: true }); });

// Chemical structure OCR — spawns tools/ocr.py which tries DECIMER/MolScribe/OSRA.
// Body: { data_base64 }. Writes to a temp file, runs the script, returns MOL on stdout.
const os = require('os');
const { spawn } = require('child_process');

app.post('/api/ocr', (req, res) => {
  try {
    const { data_base64 } = req.body || {};
    if (!data_base64) return res.status(400).json({ error: 'data_base64 required' });
    const b64 = data_base64.replace(/^data:[^;]+;base64,/, '');
    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, 'ocr-' + Date.now() + '.png');
    fs.writeFileSync(tmpFile, Buffer.from(b64, 'base64'));

    const pyScript = path.join(__dirname, 'tools', 'ocr.py');
    if (!fs.existsSync(pyScript)) {
      try { fs.unlinkSync(tmpFile); } catch {}
      return res.status(500).json({ error: 'tools/ocr.py fehlt' });
    }
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const proc = spawn(pythonCmd, [pyScript, tmpFile], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', errOut = '';
    proc.stdout.on('data', d => out += d.toString());
    proc.stderr.on('data', d => errOut += d.toString());
    proc.on('error', (e) => {
      try { fs.unlinkSync(tmpFile); } catch {}
      res.status(500).json({
        error: 'Python nicht gefunden oder Skript nicht ausführbar: ' + e.message,
        hint: 'Installiere Python 3 und DECIMER: `pip install decimer rdkit`'
      });
    });
    proc.on('close', code => {
      try { fs.unlinkSync(tmpFile); } catch {}
      if (code !== 0) {
        try {
          const j = JSON.parse(out || '{}');
          return res.status(400).json(j);
        } catch {
          return res.status(500).json({ error: 'OCR fehlgeschlagen (exit ' + code + ')', stderr: errOut.slice(0, 500) });
        }
      }
      // Success — either MOL text or {smiles: "..."} JSON fallback
      const trimmed = (out || '').trim();
      if (trimmed.startsWith('{')) {
        try {
          const j = JSON.parse(trimmed);
          if (j.smiles) return res.json({ ok: true, smiles: j.smiles });
          if (j.mol)    return res.json({ ok: true, mol: j.mol });
        } catch {}
      }
      res.json({ ok: true, mol: out });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// OCR diagnose endpoint — reports which Python backends are importable.
app.get('/api/ocr/diagnose', (_, res) => {
  const pyScript = path.join(__dirname, 'tools', 'ocr.py');
  if (!fs.existsSync(pyScript)) {
    return res.status(500).json({ error: 'tools/ocr.py fehlt' });
  }
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const proc = spawn(pythonCmd, [pyScript, '--diagnose'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '', errOut = '';
  proc.stdout.on('data', d => out += d.toString());
  proc.stderr.on('data', d => errOut += d.toString());
  proc.on('error', (e) => {
    res.status(500).json({
      error: 'Python nicht gefunden: ' + e.message,
      hint: 'Installiere Python 3.10 oder 3.11 und stelle sicher, dass es im PATH ist.'
    });
  });
  proc.on('close', code => {
    try {
      res.json(JSON.parse(out));
    } catch (e) {
      res.status(500).json({ error: 'Diagnose-Skript-Fehler', stdout: out.slice(0,800), stderr: errOut.slice(0,500), exit: code });
    }
  });
});


app.listen(PORT, () => {
  console.log(`\n  OC Referenz   →  http://localhost:${PORT}`);
  console.log(`  Quiz          →  http://localhost:${PORT}/quiz.html`);
  console.log(`  Admin         →  http://localhost:${PORT}/admin.html`);
  console.log(`  Export        →  http://localhost:${PORT}/export.html`);
  console.log(`  GitHub Pages  →  https://kingalo7.github.io/OC-oecho/\n`);
});
