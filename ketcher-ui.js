/**
 * KetcherUI — how the admin's embedded Ketcher looks.
 *
 * Ketcher only ever edits ONE structure here (a quiz compound, a
 * reactant, a reagent above an arrow), and the admin stores it. So its
 * tools for files, reactions and mapping, queries, Markush structures,
 * shapes, text, images and the macromolecule mode are switched off —
 * as far as possible through Ketcher's own ?hiddenControls= option
 * (src), the rest by a few CSS rules (install).
 *
 * In their place comes a picker for group abbreviations: a button next
 * to the periodic table opens a searchable list — OMe, CO2Me, NHBoc,
 * OTBDMS, MgBr, placeholders such as R1 or "Enzym" — and any other
 * label can be typed in.
 *
 * Picking a group arms Ketcher's own template tool with it, exactly as
 * Ketcher's Functional-Groups library does: a click on an atom replaces
 * that atom by the group, dragging away from an atom attaches it with a
 * new bond, a click on empty canvas drops it free. The group goes in as
 * a Superatom S-group named by its label, which Ketcher shows contracted
 * and the quiz renderer (mol-renderer.js) draws as that label — on
 * whichever side of its atom is free, unless the label is spelled
 * mirrored ("MeO2C"), which the ⇄ switch does and which pins it left.
 * Each group is written as SMILES with the attachment atom first;
 * OpenChemLib (loaded by admin.html) lays it out.
 *
 * Usage: iframe.src = KetcherUI.src(page), then KetcherUI.install(iframe)
 * once Ketcher runs in the iframe.
 */
(function () {
  'use strict';

  /* Controls switched off through Ketcher's own option. Kept: clear,
     open (paste a SMILES or MOL), copy/cut/paste, undo/redo, clean up,
     dearomatize, CIP (check R/S), calculated values (sum formula for a
     caption), zoom; select, erase, bonds, chain, charges; the atoms and
     the periodic table; ring templates and the structure library. */
  const HIDDEN = [
    // files, settings, help: the admin saves the structure
    'save', 'copy-image', 'copy-mol', 'copy-ket', 'recognize', 'miew', 'settings', 'help', 'about', 'fullscreen',
    // the drawing follows the exam sheet ("Layout neu" re-lays a node out)
    'layout', 'arom', 'check', 'explicit-hydrogens',
    // one structure per editor: arrows and "+" come from the scheme
    'reaction-plus', 'arrows', 'reaction-mapping-tools', 'reaction-map', 'reaction-unmap', 'reaction-automap',
    'shapes', 'shape-ellipse', 'shape-rectangle', 'shape-line', 'text', 'images',
    // query and Markush features; abbreviations and R placeholders come from the FG picker
    'enhanced-stereo', 'sgroup', 'rgroup', 'rgroup-label', 'rgroup-fragment', 'rgroup-attpoints',
    'any-atom', 'extended-table', 'functional-groups', 'create-monomer',
  ];

  /* What that option cannot reach: query and special bond types,
     context-menu entries for switched-off features, and the library's
     functional-group and salt tabs. */
  const TRIM_CSS = [
    '[data-testid="bond-any"]', '[data-testid="bond-aromatic"]', '[data-testid="bond-singledouble"]',
    '[data-testid="bond-singlearomatic"]', '[data-testid="bond-doublearomatic"]',
    '[data-testid="bond-dative"]', '[data-testid="bond-hydrogen"]',
    '[data-testid="bond-dative-option"]', '[data-testid="bond-hydrogen-option"]',
    '[data-testid="Query bonds-option"]', '[data-testid="Query properties-option"]',
    '[data-testid="Enhanced stereochemistry...-option"]', '[data-testid="Attach S-Group...-option"]',
    '[data-testid="Highlight-option"]',
    '[data-testid="functional-groups-tab"]', '[data-testid="salts-and-solvents-tab"]',
    '[data-testid="polymer-toggler"]',
  ].join(',') + '{display:none!important}' +
    // the Molecules / Macromolecules switch's wrapper and menu, and the
    // divider it leaves before the zoom (own rule: a browser without
    // :has() would drop the whole rule above)
    '\ndiv:has(> [data-testid="polymer-toggler"]),hr:has(+ * [data-testid="zoom-selector"]){display:none!important}';

  function src(page) {
    return page + (page.indexOf('?') < 0 ? '?' : '&') + 'hiddenControls=' + HIDDEN.join(',');
  }

  /* [label, SMILES with the attachment atom first, name, more search words] */
  const GROUPS = [
    ['Sauerstoff', [
      ['OMe', 'OC', 'Methoxy'],
      ['OEt', 'OCC', 'Ethoxy'],
      ['OiPr', 'OC(C)C', 'Isopropoxy'],
      ['OtBu', 'OC(C)(C)C', 'tert-Butoxy'],
      ['OPh', 'Oc1ccccc1', 'Phenoxy'],
      ['OBn', 'OCc1ccccc1', 'Benzyloxy'],
      ['OAc', 'OC(C)=O', 'Acetoxy', 'acetat'],
      ['OBz', 'OC(=O)c1ccccc1', 'Benzoyloxy', 'benzoat'],
      ['OPiv', 'OC(=O)C(C)(C)C', 'Pivaloyloxy', 'pivalat'],
      ['OTs', 'OS(=O)(=O)c1ccc(C)cc1', 'Tosylat', 'tosyl'],
      ['OMs', 'OS(C)(=O)=O', 'Mesylat', 'mesyl'],
      ['OTf', 'OS(=O)(=O)C(F)(F)F', 'Triflat', 'triflyl'],
      ['OTMS', 'O[Si](C)(C)C', 'Trimethylsilylether', 'silyl'],
      ['OTES', 'O[Si](CC)(CC)CC', 'Triethylsilylether', 'silyl'],
      ['OTBS', 'O[Si](C)(C)C(C)(C)C', 'tert-Butyldimethylsilylether', 'tbdms silyl'],
      ['OTBDMS', 'O[Si](C)(C)C(C)(C)C', 'tert-Butyldimethylsilylether', 'tbs silyl'],
      ['OTIPS', 'O[Si](C(C)C)(C(C)C)C(C)C', 'Triisopropylsilylether', 'silyl'],
      ['OTBDPS', 'O[Si](c1ccccc1)(c1ccccc1)C(C)(C)C', 'tert-Butyldiphenylsilylether', 'silyl'],
      ['OMOM', 'OCOC', 'Methoxymethylether', 'acetal'],
      ['OMEM', 'OCOCCOC', '(2-Methoxyethoxy)methylether', 'acetal'],
      ['OSEM', 'OCOCC[Si](C)(C)C', '(2-Trimethylsilylethoxy)methylether', 'acetal'],
      ['OTHP', 'OC1CCCCO1', 'Tetrahydropyranylether', 'acetal'],
      ['OPMB', 'OCc1ccc(OC)cc1', 'p-Methoxybenzylether'],
      ['OTr', 'OC(c1ccccc1)(c1ccccc1)c1ccccc1', 'Tritylether'],
      ['OCF3', 'OC(F)(F)F', 'Trifluormethoxy'],
      ['ONa', 'O[Na]', 'Natriumalkoholat', 'alkoxid'],
    ]],
    ['Carbonyl · Carboxyl', [
      ['CHO', 'C=O', 'Formyl (Aldehyd)'],
      ['COOH', 'C(=O)O', 'Carboxy (Carbonsäure)', 'säure'],
      ['CO2H', 'C(=O)O', 'Carboxy (Carbonsäure)', 'säure'],
      ['CO2Me', 'C(=O)OC', 'Methylester'],
      ['CO2Et', 'C(=O)OCC', 'Ethylester'],
      ['CO2tBu', 'C(=O)OC(C)(C)C', 'tert-Butylester'],
      ['CO2Bn', 'C(=O)OCc1ccccc1', 'Benzylester'],
      ['COOMe', 'C(=O)OC', 'Methylester'],
      ['COOEt', 'C(=O)OCC', 'Ethylester'],
      ['COOR', 'C(=O)OC', 'Ester (allgemein)'],
      ['COCl', 'C(Cl)=O', 'Säurechlorid', 'acylchlorid'],
      ['CONH2', 'C(N)=O', 'Carbamoyl (Amid)'],
      ['CONMe2', 'C(=O)N(C)C', 'Dimethylamid'],
      ['COMe', 'C(C)=O', 'Acetyl (Methylketon)'],
      ['COPh', 'C(=O)c1ccccc1', 'Benzoyl (Phenylketon)'],
      ['CO2Li', 'C(=O)O[Li]', 'Lithiumcarboxylat'],
      ['CO2Na', 'C(=O)O[Na]', 'Natriumcarboxylat'],
      ['CO2K', 'C(=O)O[K]', 'Kaliumcarboxylat'],
    ]],
    ['Stickstoff', [
      ['NH2', 'N', 'Amino'],
      ['NHMe', 'NC', 'Methylamino'],
      ['NMe2', 'N(C)C', 'Dimethylamino'],
      ['NEt2', 'N(CC)CC', 'Diethylamino'],
      ['NHPh', 'Nc1ccccc1', 'Anilino (Phenylamino)'],
      ['NHAc', 'NC(C)=O', 'Acetamido'],
      ['NHBz', 'NC(=O)c1ccccc1', 'Benzamido'],
      ['NHBoc', 'NC(=O)OC(C)(C)C', 'Boc-geschütztes Amin', 'carbamat'],
      ['NHCbz', 'NC(=O)OCc1ccccc1', 'Cbz-geschütztes Amin', 'carbamat z'],
      ['NHFmoc', 'NC(=O)OCC1c2ccccc2-c2ccccc12', 'Fmoc-geschütztes Amin', 'carbamat'],
      ['NHTs', 'NS(=O)(=O)c1ccc(C)cc1', 'Tosylamid', 'sulfonamid'],
      ['NPhth', 'N1C(=O)c2ccccc2C1=O', 'Phthalimido', 'gabriel'],
      ['NO2', '[N+](=O)[O-]', 'Nitro'],
      ['N3', 'N=[N+]=[N-]', 'Azido'],
      ['CN', 'C#N', 'Cyano (Nitril)'],
      ['NCO', 'N=C=O', 'Isocyanat'],
      ['NCS', 'N=C=S', 'Isothiocyanat'],
      ['NHNH2', 'NN', 'Hydrazino'],
    ]],
    ['Schwefel · Phosphor · Silicium · Bor', [
      ['SMe', 'SC', 'Methylthio', 'thioether'],
      ['SEt', 'SCC', 'Ethylthio', 'thioether'],
      ['SPh', 'Sc1ccccc1', 'Phenylthio', 'thioether'],
      ['SAc', 'SC(C)=O', 'Acetylthio', 'thioester'],
      ['SO2Me', 'S(C)(=O)=O', 'Methylsulfonyl', 'sulfon'],
      ['SO2Ph', 'S(=O)(=O)c1ccccc1', 'Phenylsulfonyl', 'sulfon'],
      ['SO2Ar', 'S(=O)(=O)c1ccccc1', 'Arylsulfonyl', 'sulfon'],
      ['SO3H', 'S(=O)(=O)O', 'Sulfonsäure'],
      ['SO2Cl', 'S(Cl)(=O)=O', 'Sulfonylchlorid'],
      ['SO2NH2', 'S(N)(=O)=O', 'Sulfonamid'],
      ['Ts', 'S(=O)(=O)c1ccc(C)cc1', 'Tosyl (p-Toluolsulfonyl)'],
      ['Ms', 'S(C)(=O)=O', 'Mesyl (Methansulfonyl)'],
      ['Tf', 'S(=O)(=O)C(F)(F)F', 'Triflyl (Trifluormethansulfonyl)'],
      ['TMS', '[Si](C)(C)C', 'Trimethylsilyl', 'silyl'],
      ['SiMe3', '[Si](C)(C)C', 'Trimethylsilyl', 'silyl tms'],
      ['TES', '[Si](CC)(CC)CC', 'Triethylsilyl', 'silyl'],
      ['TBS', '[Si](C)(C)C(C)(C)C', 'tert-Butyldimethylsilyl', 'tbdms silyl'],
      ['TBDMS', '[Si](C)(C)C(C)(C)C', 'tert-Butyldimethylsilyl', 'tbs silyl'],
      ['TIPS', '[Si](C(C)C)(C(C)C)C(C)C', 'Triisopropylsilyl', 'silyl'],
      ['TBDPS', '[Si](c1ccccc1)(c1ccccc1)C(C)(C)C', 'tert-Butyldiphenylsilyl', 'silyl'],
      ['PPh2', 'P(c1ccccc1)c1ccccc1', 'Diphenylphosphino', 'phosphan'],
      ['PO(OEt)2', 'P(=O)(OCC)OCC', 'Diethylphosphonat', 'horner wadsworth emmons'],
      ['B(OH)2', 'B(O)O', 'Boronsäure', 'suzuki'],
      ['Bpin', 'B1OC(C)(C)C(C)(C)O1', 'Pinakolboronat', 'suzuki'],
    ]],
    ['Metalle', [
      ['MgBr', '[Mg]Br', 'Grignard-Reagenz (Bromid)'],
      ['MgCl', '[Mg]Cl', 'Grignard-Reagenz (Chlorid)'],
      ['MgI', '[Mg]I', 'Grignard-Reagenz (Iodid)'],
      ['ZnCl', '[Zn]Cl', 'Organozink', 'negishi'],
      ['ZnBr', '[Zn]Br', 'Organozink', 'negishi reformatsky'],
      ['SnBu3', '[Sn](CCCC)(CCCC)CCCC', 'Tributylstannyl', 'stille'],
    ]],
    ['Kohlenstoff', [
      ['Me', 'C', 'Methyl'],
      ['Et', 'CC', 'Ethyl'],
      ['nPr', 'CCC', 'n-Propyl'],
      ['iPr', 'C(C)C', 'Isopropyl'],
      ['nBu', 'CCCC', 'n-Butyl'],
      ['iBu', 'CC(C)C', 'Isobutyl'],
      ['sBu', 'C(C)CC', 'sec-Butyl'],
      ['tBu', 'C(C)(C)C', 'tert-Butyl'],
      ['Cy', 'C1CCCCC1', 'Cyclohexyl'],
      ['Ph', 'c1ccccc1', 'Phenyl'],
      ['Bn', 'Cc1ccccc1', 'Benzyl'],
      ['Tol', 'c1ccc(C)cc1', 'p-Tolyl'],
      ['Mes', 'c1c(C)cc(C)cc1C', 'Mesityl'],
      ['Ar', 'c1ccccc1', 'Aryl (allgemein)'],
      ['CF3', 'C(F)(F)F', 'Trifluormethyl'],
      ['CCl3', 'C(Cl)(Cl)Cl', 'Trichlormethyl'],
      ['CH3', 'C', 'Methyl'],
      ['CH2OH', 'CO', 'Hydroxymethyl'],
    ]],
    ['Schutz- und Acylgruppen', [
      ['Ac', 'C(C)=O', 'Acetyl'],
      ['Bz', 'C(=O)c1ccccc1', 'Benzoyl'],
      ['Piv', 'C(=O)C(C)(C)C', 'Pivaloyl'],
      ['Boc', 'C(=O)OC(C)(C)C', 'tert-Butyloxycarbonyl'],
      ['Cbz', 'C(=O)OCc1ccccc1', 'Benzyloxycarbonyl', 'z'],
      ['Fmoc', 'C(=O)OCC1c2ccccc2-c2ccccc12', 'Fluorenylmethoxycarbonyl'],
      ['Alloc', 'C(=O)OCC=C', 'Allyloxycarbonyl'],
      ['Troc', 'C(=O)OCC(Cl)(Cl)Cl', '2,2,2-Trichlorethoxycarbonyl'],
      ['PMB', 'Cc1ccc(OC)cc1', 'p-Methoxybenzyl'],
      ['Tr', 'C(c1ccccc1)(c1ccccc1)c1ccccc1', 'Trityl (Triphenylmethyl)'],
      ['MOM', 'COC', 'Methoxymethyl'],
      ['MEM', 'COCCOC', '(2-Methoxyethoxy)methyl'],
      ['SEM', 'COCC[Si](C)(C)C', '(2-Trimethylsilylethoxy)methyl'],
      ['THP', 'C1CCCCO1', 'Tetrahydropyranyl'],
    ]],
    ['Platzhalter', [
      ['R', 'C', 'Rest'],
      ['R1', 'C', 'Rest 1'],
      ['R2', 'C', 'Rest 2'],
      ['R3', 'C', 'Rest 3'],
      ['R4', 'C', 'Rest 4'],
      ['X', 'C', 'Halogen / Abgangsgruppe'],
      ['Y', 'C', 'Platzhalter'],
      ['Nu', 'C', 'Nucleophil'],
      ['E', 'C', 'Elektrophil'],
      ['Enzym', 'C', 'Enzym'],
      ['Träger', 'C', 'Festphasen-Träger', 'harz resin'],
      ['CoA', 'C', 'Coenzym A'],
    ]],
  ].map(function (cat) {
    return { name: cat[0], groups: cat[1].map(function (g) { return { label: g[0], smiles: g[1], name: g[2], words: g[3] || '' }; }) };
  });

  const RECENT_KEY = 'ketcher-ui-recent-groups';
  const RECENT_MAX = 10;
  const HINT = 'Klick auf ein Atom ersetzt es · von einem Atom wegziehen hängt an · Esc beendet';

  function mirror(label) {
    return window.MolRenderer && window.MolRenderer.mirrorLabel ? window.MolRenderer.mirrorLabel(label) : label;
  }

  /* A label from the list, one of them spelled mirrored ("MeO2C": the
     ester, pinned left), or anything else as one placeholder carbon
     under that name, like "R5" or "Harz". */
  function lookup(label) {
    let back = null;
    for (const c of GROUPS) for (const g of c.groups) {
      if (g.label === label) return g;
      if (!back && mirror(g.label) === label) back = g;
    }
    if (back) return { label: label, smiles: back.smiles, name: back.name + ' (gespiegelt)', words: back.words };
    return { label: label, smiles: 'C', name: 'eigenes Kürzel', words: '' };
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  /* "CO2Me" → CO<sub>2</sub>Me */
  function labelHtml(label) {
    return esc(label).replace(/\d+/g, function (d) { return '<sub>' + d + '</sub>'; });
  }

  /* A group as molfile: OpenChemLib lays out the SMILES, then one
     Superatom S-group spans every atom and is attached at atom 1. */
  const _molfiles = new Map();
  function molfile(g) {
    const key = g.label + '\u0000' + g.smiles;
    if (_molfiles.has(key)) return _molfiles.get(key);
    const m = window.OCL.Molecule.fromSmiles(g.smiles);
    const n = m.getAllAtoms();
    const lines = m.toMolfile().split('\n');
    let end = lines.findIndex(function (l) { return l.indexOf('M  END') === 0; });
    if (end < 0) end = lines.length;
    const f3 = function (v) { return String(v).padStart(3); };
    const sg = ['M  STY  1   1 SUP'];
    for (let i = 0; i < n; i += 15) {
      const ids = [];
      for (let a = i; a < Math.min(n, i + 15); a++) ids.push(' ' + f3(a + 1));
      sg.push('M  SAL   1' + f3(ids.length) + ids.join(''));
    }
    sg.push('M  SAP   1  1   1   0', 'M  SMT   1 ' + g.label);
    lines.splice.apply(lines, [end, 0].concat(sg));
    const text = lines.join('\n');
    _molfiles.set(key, text);
    return text;
  }

  function readRecent() {
    try {
      const v = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      return Array.isArray(v) ? v.filter(function (l) { return typeof l === 'string' && l; }) : [];
    } catch (_) { return []; }
  }
  function remember(label) {
    const list = [label].concat(readRecent().filter(function (l) { return l !== label; }));
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX))); } catch (_) {}
  }

  const CSS = [
    '#kg-button svg{display:block}',
    '#kg-button.kg-on{background:#167782;border-radius:4px}',
    '#kg-button.kg-on svg *{fill:#fff}',
    '.kg-panel{position:fixed;z-index:1000;width:340px;display:none;flex-direction:column;background:#fff;border:1px solid #cfd6d8;border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.18);font:13px/1.3 "Segoe UI",system-ui,-apple-system,sans-serif;color:#333}',
    '.kg-panel.open{display:flex}',
    '.kg-head{display:flex;gap:6px;align-items:center;padding:8px 8px 6px;border-bottom:1px solid #e3e8e9}',
    '.kg-title{font-weight:700;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#167782;white-space:nowrap}',
    '.kg-search{flex:1;min-width:0;font:inherit;padding:5px 8px;border:1px solid #cfd6d8;border-radius:6px;outline:none}',
    '.kg-search:focus,.kg-own input:focus{border-color:#167782;box-shadow:0 0 0 2px rgba(22,119,130,.18)}',
    '.kg-flip{font:inherit;font-size:15px;line-height:1;padding:3px 6px;border:1px solid #cfd6d8;border-radius:6px;background:#fff;cursor:pointer;color:#555}',
    '.kg-flip[aria-pressed="true"]{background:#167782;border-color:#167782;color:#fff}',
    '.kg-x{border:none;background:none;font-size:18px;line-height:1;cursor:pointer;color:#666;padding:2px 4px}',
    '.kg-x:hover{color:#000}',
    '.kg-body{overflow-y:auto;padding:4px 8px 8px;flex:1;min-height:0}',
    '.kg-sec h4{margin:8px 0 4px;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.05em}',
    '.kg-chips{display:flex;flex-wrap:wrap;gap:4px}',
    '.kg-chip{font:inherit;font-weight:600;padding:3px 7px;border:1px solid #cfd6d8;border-radius:6px;background:#fff;cursor:pointer;color:#222;line-height:1.25}',
    '.kg-chip sub,.kg-armed sub{font-size:72%;line-height:0}',
    '.kg-chip:hover,.kg-chip:focus-visible{border-color:#167782;background:#e8f3f4;outline:none}',
    '.kg-chip.kg-first{border-color:#167782}',
    '.kg-empty{color:#888;font-style:italic;padding:8px 0}',
    '.kg-own{display:flex;gap:6px;padding:6px 8px;border-top:1px solid #e3e8e9;margin:0}',
    '.kg-own input{flex:1;min-width:0;font:inherit;padding:5px 8px;border:1px solid #cfd6d8;border-radius:6px;outline:none}',
    '.kg-own button{font:inherit;font-weight:600;padding:5px 10px;border:none;border-radius:6px;background:#167782;color:#fff;cursor:pointer}',
    '.kg-own button:hover{background:#0f5e67}',
    '.kg-foot{padding:5px 8px 7px;font-size:11px;color:#666;border-top:1px solid #e3e8e9}',
    '.kg-armed{position:fixed;z-index:999;left:50%;top:52px;transform:translateX(-50%);display:none;padding:4px 10px;border-radius:12px;background:#167782;color:#fff;font:600 12px "Segoe UI",system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.2);pointer-events:none;white-space:nowrap}',
    '.kg-armed span{font-weight:400;opacity:.9}',
  ].join('\n');

  /* In the style of Ketcher's own "PT" and "ET" buttons: two letters over a dotted rule. */
  const ICON = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<text x="12" y="13.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="10" font-weight="700" fill="#333">FG</text>' +
    '<circle cx="7" cy="17.5" r="1" fill="#333"/><circle cx="10.3" cy="17.5" r="1" fill="#333"/>' +
    '<circle cx="13.7" cy="17.5" r="1" fill="#333"/><circle cx="17" cy="17.5" r="1" fill="#333"/></svg>';

  function setup(win, doc) {
    const style = doc.createElement('style');
    style.id = 'kg-style';
    style.textContent = TRIM_CSS + '\n' + CSS;
    doc.head.appendChild(style);

    const button = doc.createElement('button');
    button.id = 'kg-button';
    button.type = 'button';
    button.title = 'Kürzel und Schutzgruppen (OMe, CO₂Me, OTBDMS …)';
    button.setAttribute('data-testid', 'group-abbreviations');
    button.innerHTML = ICON;

    const panel = doc.createElement('div');
    panel.className = 'kg-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Kürzel');
    panel.innerHTML =
      '<div class="kg-head"><span class="kg-title">Kürzel</span>' +
      '<input class="kg-search" type="search" placeholder="Suchen: OTBS, Ester, Boc …" aria-label="Kürzel suchen">' +
      '<button class="kg-flip" type="button" aria-pressed="false" title="Gespiegelt einfügen (MeO₂C statt CO₂Me): ' +
      'im Quiz steht das Kürzel dann immer links vom Atom">⇄</button>' +
      '<button class="kg-x" type="button" title="Schließen" aria-label="Schließen">×</button></div>' +
      '<div class="kg-body"></div>' +
      '<form class="kg-own"><input placeholder="Eigenes Kürzel, z. B. R5, Harz" aria-label="Eigenes Kürzel">' +
      '<button type="submit">Setzen</button></form>' +
      '<div class="kg-foot">' + HINT + '.<br>Im Quiz steht das Kürzel von selbst auf der freien Seite (CO₂Me / MeO₂C); ' +
      'mit ⇄ gespiegelt eingefügt steht es immer links vom Atom.</div>';
    doc.body.appendChild(panel);

    const armed = doc.createElement('div');
    armed.className = 'kg-armed';
    doc.body.appendChild(armed);

    const search = panel.querySelector('.kg-search');
    const flip = panel.querySelector('.kg-flip');
    const body = panel.querySelector('.kg-body');
    const own = panel.querySelector('.kg-own');
    const ownInput = own.querySelector('input');

    /* Ketcher reads the keyboard at document level (hotkeys, typing an
       atom label); typing in the panel must not reach it. */
    ['keydown', 'keyup', 'keypress'].forEach(function (t) {
      panel.addEventListener(t, function (e) { e.stopPropagation(); });
    });

    const flipped = function () { return flip.getAttribute('aria-pressed') === 'true'; };
    const shown = function (g) { return flipped() ? mirror(g.label) : g.label; };
    function chip(label, name) {
      return '<button type="button" class="kg-chip" data-label="' + esc(label) + '" title="' + esc(name) + '">' +
        labelHtml(label) + '</button>';
    }

    let first = null;
    function render() {
      const q = search.value.trim().toLowerCase();
      const hit = function (g) {
        return !q || (g.label + ' ' + shown(g) + ' ' + g.name + ' ' + g.words).toLowerCase().indexOf(q) >= 0;
      };
      const sections = [];
      const recent = q ? [] : readRecent();
      if (recent.length) sections.push(['Zuletzt', recent.map(function (l) { return [l, lookup(l).name]; })]);
      GROUPS.forEach(function (c) {
        const gs = c.groups.filter(hit);
        if (gs.length) sections.push([c.name, gs.map(function (g) { return [shown(g), g.name]; })]);
      });
      // Enter while searching takes the first match
      first = q && sections.length ? sections[0][1][0][0] : null;
      body.innerHTML = sections.map(function (s) {
        return '<section class="kg-sec"><h4>' + esc(s[0]) + '</h4><div class="kg-chips">' +
          s[1].map(function (e) { return chip(e[0], e[1]); }).join('') + '</div></section>';
      }).join('') || '<div class="kg-empty">Nichts gefunden — unten als eigenes Kürzel setzen.</div>';
      if (first) body.querySelector('.kg-chip').classList.add('kg-first');
    }

    function place() {
      const r = button.getBoundingClientRect();
      const bar = button.closest('[class*="RightToolbar"]') || button.parentElement;
      const left = Math.min(r.left, bar ? bar.getBoundingClientRect().left : r.left);
      panel.style.right = Math.max(8, win.innerWidth - left + 6) + 'px';
      const top = Math.max(8, Math.min(r.top - 60, win.innerHeight - 320));
      panel.style.top = top + 'px';
      panel.style.maxHeight = (win.innerHeight - top - 8) + 'px';
    }

    function open() {
      render();
      place();
      panel.classList.add('open');
      search.focus();
      search.select();
    }
    function close() { panel.classList.remove('open'); }

    let watch = 0;
    function disarm() {
      if (watch) win.clearInterval(watch);
      watch = 0;
      button.classList.remove('kg-on');
      armed.style.display = 'none';
    }

    async function pick(label) {
      close();
      const k = win.ketcher;
      if (!k || !window.OCL || !label) return;
      const g = lookup(label);
      let struct;
      try {
        struct = await k.formatterFactory.create('mol').getStructureFromStringAsync(molfile(g));
      } catch (e) {
        console.error('KetcherUI: ' + g.label, e);
        return;
      }
      remember(g.label);
      disarm();
      const tool = k.editor.tool('template', { struct: struct, props: { group: 'Functional Groups' } });
      if (!tool) return;
      button.classList.add('kg-on');
      armed.innerHTML = labelHtml(g.label) + ' <span>— ' + HINT + '</span>';
      armed.style.display = 'block';
      // until another tool takes over (toolbar, hotkey, Esc)
      watch = win.setInterval(function () { if (k.editor.tool() !== tool) disarm(); }, 300);
    }

    button.addEventListener('click', function () { if (panel.classList.contains('open')) close(); else open(); });
    panel.querySelector('.kg-x').addEventListener('click', close);
    flip.addEventListener('click', function () {
      flip.setAttribute('aria-pressed', flipped() ? 'false' : 'true');
      render();
      search.focus();
    });
    search.addEventListener('input', render);
    search.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); if (first) pick(first); }
      else if (e.key === 'Escape') close();
    });
    ownInput.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    body.addEventListener('click', function (e) {
      const c = e.target.closest('.kg-chip');
      if (c) pick(c.getAttribute('data-label'));
    });
    own.addEventListener('submit', function (e) {
      e.preventDefault();
      const label = ownInput.value.trim();
      ownInput.value = '';
      pick(label);
    });
    // a click anywhere else closes the panel (and still reaches Ketcher)
    doc.addEventListener('mousedown', function (e) {
      if (panel.classList.contains('open') && !panel.contains(e.target) && !button.contains(e.target)) close();
    }, true);
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); }, true);
    win.addEventListener('resize', function () { if (panel.classList.contains('open')) place(); });

    /* Ketcher re-renders its toolbar now and then (resize, mode switch):
       keep the button right after the periodic table. */
    function attach() {
      const pt = doc.querySelector('[data-testid="period-table"]');
      if (!pt || (button.isConnected && button.previousElementSibling === pt)) return;
      button.className = pt.className;
      pt.insertAdjacentElement('afterend', button);
    }
    attach();
    new win.MutationObserver(attach).observe(doc.body, { childList: true, subtree: true });
  }

  function install(iframe) {
    const win = iframe && iframe.contentWindow;
    if (!win) return;
    let tries = 0;
    (function attempt() {
      let doc;
      try { doc = win.document; } catch (_) { return; }
      if (!doc || doc.getElementById('kg-style')) return;
      if (!win.ketcher || !doc.querySelector('[data-testid="period-table"]')) {
        if (++tries < 150) win.setTimeout(attempt, 100);
        return;
      }
      setup(win, doc);
    })();
  }

  window.KetcherUI = { src: src, install: install, HIDDEN: HIDDEN, GROUPS: GROUPS, lookup: lookup, molfile: molfile };
})();
