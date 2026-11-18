// Offline cache of the game (only when served over http or https)
const V = 'igra-9be405f8fc1e';
const CORE = ["./","index.html","app.js","style.css","data/base.js","../icon.svg","../fonts/ebg-latin-400-italic.woff2","../fonts/ebg-latin-400-normal.woff2","../fonts/ebg-latin-600-normal.woff2","../fonts/ebg-latin-ext-400-italic.woff2","../fonts/ebg-latin-ext-400-normal.woff2","../fonts/ebg-latin-ext-600-normal.woff2"];
const REST = ["data/r/2025.js","data/r/2026.js","data/r/2027.js","data/r/2028.js","data/r/2029.js","data/r/2030.js","data/r/2031.js","data/r/2032.js","data/r/2033.js","data/r/2034.js","data/r/2035.js","data/r/2036.js"];
const fresh = u => new Request(u, { cache: 'no-cache' });
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE.map(fresh))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('igra-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())
    .then(() => caches.open(V)).then(c => Promise.all(REST.map(u => c.match(u).then(hit => hit || c.add(fresh(u)).catch(() => {}))))));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    try { return await fetch(e.request); }
    catch (err) { const shell = await c.match('./'); if (shell && e.request.mode === 'navigate' && u.pathname.startsWith(new URL('./', location.href).pathname)) return shell; throw err; }
  }));
});
