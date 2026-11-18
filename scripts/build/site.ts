// Build step 2: the application bundle (classic script, no modules), page, styles, fonts, offline worker.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { build } from 'esbuild';

export default async function buildSite(dist: string) {
  await build({ entryPoints: ['src/site/main.ts'], bundle: true, format: 'iife', target: 'es2019', minify: true, outfile: path.join(dist, 'app.js'), legalComments: 'none' });
  fs.copyFileSync('src/site/index.html', path.join(dist, 'index.html'));
  fs.copyFileSync('src/site/style.css', path.join(dist, 'style.css'));
  // Fonts: the files in src/site/fonts (EB Garamond with the Latin-language u→v rule removed, made by scripts/fonts/make-fonts.py).
  // The folder is rebuilt so that no file of an earlier build (the unmodified typeface) is published again.
  fs.rmSync(path.join(dist, 'fonts'), { recursive: true, force: true });
  fs.mkdirSync(path.join(dist, 'fonts'), { recursive: true });
  for (const f of fs.readdirSync('src/site/fonts')) fs.copyFileSync(path.join('src/site/fonts', f), path.join(dist, 'fonts', f));
  fs.writeFileSync(path.join(dist, 'icon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="14" fill="#7a1f1f"/><path fill="#f6efe0" d="M50 45 34 14h32L50 45Zm5 5 31-16v32L55 50Zm-5 5 16 31H34l16-31Zm-5-5L14 66V34l31 16Z"/></svg>\n`);
  fs.writeFileSync(path.join(dist, 'manifest.webmanifest'), JSON.stringify({ name: 'Kalendar tradicionalne latinske mise — Zagreb', short_name: 'TLM kalendar', lang: 'hr', start_url: './index.html', scope: './', display: 'standalone', background_color: '#fbf8f1', theme_color: '#7a1f1f', icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }] }));
  fs.writeFileSync(path.join(dist, '.nojekyll'), '');
  // offline worker: the shell and the calendar files are cached at install, the formulary files in the background
  const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const all = walk(dist).map(f => path.relative(dist, f).split(path.sep).join('/')).filter(f => f !== 'sw.js' && !f.startsWith('.') && !f.endsWith('.txt') && !f.startsWith('igra/'))   // the game (dist/igra) has its own worker;
  const hash = crypto.createHash('sha1'); for (const f of all.sort()) hash.update(f).update(fs.readFileSync(path.join(dist, f)));
  const version = hash.digest('hex').slice(0, 12);
  const core = all.filter(f => !f.startsWith('data/f/') && !f.startsWith('ics/'));
  const rest = all.filter(f => f.startsWith('data/f/'));
  fs.writeFileSync(path.join(dist, 'sw.js'), `// Offline cache (only when the site is served over http or https)
const V = 'tlm-${version}';
const CORE = ${JSON.stringify(['./', ...core])};
const REST = ${JSON.stringify(rest)};
// every file of a new version is asked from the server again (revalidated), never taken from the browser's own HTTP cache,
// so that a new version cannot store a stale stylesheet or font list
const fresh = u => new Request(u, { cache: 'no-cache' });
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE.map(fresh))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  const replaced = caches.keys().then(async ks => {
    const old = ks.filter(k => k.startsWith('tlm-') && k !== V);
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    return old.length > 0;
  });
  e.waitUntil(replaced);
  // A page that was opened from the previous version's cache is reloaded once, so that a returning visitor sees this version
  // (texts, styles, fonts) on the same visit and not only on the next one. Done after activation has finished: a reload
  // requested earlier would wait for this worker, which would be waiting for the reload.
  replaced.then(was => { if (was) setTimeout(() => self.clients.matchAll({ type: 'window' }).then(cs => cs.forEach(c => { try { c.navigate(c.url).catch(() => {}); } catch (err) { /* shown on the next load */ } })), 50); });
  // fetch the Mass formularies in the background so that every day works offline
  caches.open(V).then(async c => { for (let i = 0; i < REST.length; i += 20) { await Promise.all(REST.slice(i, i + 20).map(u => c.match(u).then(hit => hit || c.add(fresh(u)).catch(() => {})))); } });
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.startsWith(new URL('igra/', location.href).pathname)) return;   // the children's game keeps its own cache
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    try { const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; }
    catch (err) { const shell = await c.match('./'); if (shell && e.request.mode === 'navigate') return shell; throw err; }
  }));
});
`);
  let bytes = 0; for (const f of walk(dist)) if (!path.relative(dist, f).startsWith('igra')) bytes += fs.statSync(f).size;
  console.log(JSON.stringify({ files: all.length + 1, megabytes: +(bytes / 1048576).toFixed(1), version }));
}
