const ReactionRenderer = (() => {
  const REACTION_OPTS = { scale:1, spacing:14, fontSize:12, fontFamily:'Arial,Helvetica,sans-serif',
    plus:{size:8,thickness:1.5}, arrow:{length:70,headSize:7,thickness:1.5,margin:4} };
  const MOLECULE_OPTS = { width:200, height:200, scale:1, compactDrawing:false, explicitHydrogens:false };

  function draw(reactionSmiles, target, theme='dark', textAbove='{reagents}', textBelow='') {
    const SD = window.SmilesDrawer;
    if (!SD || !SD.ReactionDrawer || !SD.ReactionParser) return null;
    let svgEl = (typeof target==='string') ? document.getElementById(target) : target;
    if (!svgEl) return null;
    try {
      const reaction = SD.ReactionParser.parse(reactionSmiles);
      const rd = new SD.ReactionDrawer(REACTION_OPTS, Object.assign({},MOLECULE_OPTS));
      rd.draw(reaction, svgEl, theme, null, textAbove, textBelow);
      const vb = svgEl.getAttribute('viewBox');
      if (vb) { const p=vb.trim().split(/\s+/).map(Number);
        if(p.length>=4&&p[2]>0&&p[3]>0){svgEl.setAttribute('width',p[2]);svgEl.setAttribute('height',p[3]);} }
      return svgEl;
    } catch(e) {
      svgEl.setAttribute('width',300);svgEl.setAttribute('height',40);svgEl.setAttribute('viewBox','0 0 300 40');
      const t=document.createElementNS('http://www.w3.org/2000/svg','text');
      t.setAttribute('x','10');t.setAttribute('y','25');t.setAttribute('fill','#f87171');
      t.setAttribute('font-size','13');t.textContent='⚠ '+e.message;svgEl.appendChild(t);
      return null;
    }
  }
  return { draw };
})();
