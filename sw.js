/* Service worker for the OC Reaktionen PWA.
   Bump CACHE when the shell changes — activate drops every other cache. */
const CACHE = 'oc-oecho-v6';

/* App shell. Paths are relative to the SW scope, so the same file works on
   GitHub Pages (/OC-oecho/) and on localhost. Ketcher (vendor/, ~26 MB) and
   admin.html stay out on purpose — they are cached at runtime if visited. */
const SHELL = [
  './',
  './index.html',
  './quiz.html',
  './export.html',
  './404.html',
  './pwa.js',
  './chem-text.js',
  './mol-renderer.js',
  './scheme-graph-editor.js',
  './manifest.webmanifest',
  './assets/logo.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
  './data/reactions.json',
  './data/questions.json'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // One miss must not fail the whole install, so each entry is added on its own.
    await Promise.all(SHELL.map(u => cache.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // The local express API must never be served from cache.
  if (url.origin === self.location.origin && url.pathname.includes('/api/')) return;

  // Pages: network first, so a deployed update shows up immediately.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
        return res;
      } catch {
        return (await caches.match(req)) ||
               (await caches.match('./index.html')) ||
               new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
    return;
  }

  // CDN libraries (openchemlib, jszip): cache first — they are versioned URLs.
  if (url.origin !== self.location.origin) {
    e.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    })());
    return;
  }

  // Data (reactions, quiz): network first, so edited content shows at once;
  // the cached copy is only the offline fallback.
  if (url.origin === self.location.origin && /\/data\/[^/]+\.json$/.test(url.pathname)) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
        return res;
      } catch {
        return (await caches.match(req)) || new Response('[]', { headers: { 'Content-Type': 'application/json' } });
      }
    })());
    return;
  }

  // Own assets: serve from cache, refresh in the background.
  e.respondWith((async () => {
    const hit = await caches.match(req);
    const net = fetch(req).then(res => {
      if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
      return res;
    }).catch(() => hit);
    return hit || net;
  })());
});
