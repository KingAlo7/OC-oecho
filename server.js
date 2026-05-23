const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({limit:'5mb'}));
app.use(express.static(__dirname));   // serve everything from root

// API (for local admin editing only — not needed for GitHub Pages)
const data = f => path.join(__dirname,'data',f);
app.get('/api/reactions',  (_, res) => res.json(JSON.parse(fs.readFileSync(data('reactions.json'),'utf8'))));
app.post('/api/reactions', (req, res) => {
  fs.writeFileSync(data('reactions.json'), JSON.stringify(req.body,null,2));
  res.json({ok:true});
});

app.listen(PORT, () => {
  console.log(`OC Reference running → http://localhost:${PORT}`);
  console.log(`GitHub Pages URL     → https://kingalo7.github.io/OC-Quiz/`);
});
