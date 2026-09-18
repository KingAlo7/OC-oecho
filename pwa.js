/* PWA glue: registers the service worker and shows an "App installieren"
   button in the header once Chrome/Edge report the site as installable.
   Load with <script src="./pwa.js" defer></script> — no other wiring needed. */
(() => {
  const SECURE = location.protocol === 'https:' ||
                 ['localhost', '127.0.0.1'].includes(location.hostname);
  if (!SECURE) return;

  /* ---------- service worker ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('./sw.js');
        reg.update();
        // A newly deployed worker takes over right away instead of waiting
        // for every tab to close; reload once so the page matches it.
        let reloaded = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (reloaded) return;
          reloaded = true;
          location.reload();
        });
      } catch (e) {
        console.warn('SW registration failed', e);
      }
    });
  }

  /* ---------- install button ---------- */
  let deferred = null;

  const style = document.createElement('style');
  style.textContent = `
    #pwa-install{
      display:none;align-items:center;gap:0.35rem;cursor:pointer;
      font:inherit;font-size:0.78rem;font-weight:600;line-height:1;
      color:var(--accent,#e2001a);background:var(--surface,#fff);
      border:1px solid var(--accent,#e2001a);border-radius:8px;
      padding:0.4rem 0.6rem;white-space:nowrap;
      -webkit-tap-highlight-color:transparent;transition:background .12s,color .12s;
    }
    #pwa-install:hover{background:var(--accent,#e2001a);color:#fff;}
    #pwa-install:active{opacity:0.8;}
    #pwa-install.show{display:inline-flex;}
    #pwa-install.floating{position:fixed;right:1rem;bottom:1rem;z-index:9999;
      box-shadow:0 2px 10px rgba(60,55,40,0.18);}
    /* The phone header already wraps to two rows — keep the button icon-only
       there so it fits beside the brand instead of adding a third row. */
    @media (max-width:560px){
      #pwa-install{padding:0.4rem 0.55rem;font-size:0.95rem;}
      #pwa-install .pwa-label{display:none;}
    }
  `;

  function makeButton() {
    if (document.getElementById('pwa-install')) return document.getElementById('pwa-install');
    document.head.appendChild(style);
    const btn = document.createElement('button');
    btn.id = 'pwa-install';
    btn.type = 'button';
    btn.title = 'Als App auf dem Gerät installieren';
    btn.setAttribute('aria-label', 'App installieren');
    btn.innerHTML = '<span aria-hidden="true">⤓</span><span class="pwa-label">App installieren</span>';
    const slot = document.querySelector('header .header-right') || document.querySelector('header');
    if (slot) slot.appendChild(btn);
    else { btn.classList.add('floating'); document.body.appendChild(btn); }

    btn.addEventListener('click', async () => {
      if (!deferred) return;
      btn.classList.remove('show');
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferred = null;
      // Declined: offer it again later in the session.
      if (outcome !== 'accepted') btn.classList.add('show');
    });
    return btn;
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();          // suppress the mini-infobar, use our own button
    deferred = e;
    const run = () => makeButton().classList.add('show');
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
  });

  window.addEventListener('appinstalled', () => {
    deferred = null;
    document.getElementById('pwa-install')?.classList.remove('show');
  });
})();
