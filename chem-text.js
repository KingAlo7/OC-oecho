/* ChemText — one parser for LaTeX-lite sub/superscripts, shared by every
   page and both SVG renderers.

     H_2SO_4, C_12H_22O_11   bare digits after _ are one subscript run
     Fe^3+, SO_4^2-, ^13C    digits (+ optional charge sign) after ^
     _{...} / ^{...}         anything in braces, e.g. [Ag(NH_3)_2]^{+}
     _n, ^+, ^-, ^•          otherwise a single letter / sign
     \_  \^                  literal underscore / caret
*/
(function (root) {
  'use strict';

  const RE = /\\([_^])|_(?:\{([^}]*)\}|([0-9]+|[A-Za-z+\-−]))|\^(?:\{([^}]*)\}|([0-9]*[+\-−]|[0-9]+|[A-Za-z•·*]))/g;

  /* → [{ t: 'text' | 'sub' | 'sup', v: string }] */
  function tokenize(str) {
    const s = String(str == null ? '' : str);
    const out = [];
    const text = (v) => {
      if (!v) return;
      const last = out[out.length - 1];
      if (last && last.t === 'text') last.v += v; else out.push({ t: 'text', v });
    };
    let last = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(s)) !== null) {
      text(s.slice(last, m.index));
      if (m[1]) text(m[1]);
      else if (m[2] != null || m[3] != null) out.push({ t: 'sub', v: m[2] != null ? m[2] : m[3] });
      else out.push({ t: 'sup', v: m[4] != null ? m[4] : m[5] });
      last = RE.lastIndex;
    }
    text(s.slice(last));
    return out;
  }

  function esc(t) {
    return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* Escaped HTML with <sub>/<sup>. */
  function html(str) {
    return tokenize(str).map(k =>
      k.t === 'text' ? esc(k.v) : '<' + k.t + '>' + esc(k.v) + '</' + k.t + '>').join('');
  }

  /* What the reader sees, without markup — for width measurement. */
  function plain(str) {
    return tokenize(str).map(k => k.v).join('');
  }

  function flags(str) {
    const toks = tokenize(str);
    return { sub: toks.some(k => k.t === 'sub'), sup: toks.some(k => k.t === 'sup') };
  }

  root.ChemText = { tokenize, html, plain, flags, esc };
})(typeof window !== 'undefined' ? window : globalThis);
