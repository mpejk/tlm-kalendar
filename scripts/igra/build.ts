// Builds the game "Nedjeljni izazov" into dist/igra (after the calendar's own build, whose data it reads):
//   data/base.js          fixed content with its sources, vocabulary, labels
//   data/r/<year>.js      the rounds of one liturgical year (named by the year in which it begins)
//   app.js, style.css, index.html, sw.js   — classic scripts and script-tag data, relative links, works from file://
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { build } from 'esbuild';
import { LABELS } from '../../src/assembler/assemble';
import { loadDist } from './lib';
import { generate, litYear, Round } from './generate';

export default async function buildIgra(dist = 'dist') {
  const out = path.join(dist, 'igra');
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(path.join(out, 'data/r'), { recursive: true });
  const D = loadDist(dist); const { rounds, base, problems } = generate(D);
  if (problems.length) { console.error(problems.join('\n')); throw new Error(`game: ${problems.length} problems in the round data`); }
  // labels of the proper parts: the calendar's own; a round stores a label only where its day differs (Lesson, Gradual + Tract …)
  const oznake: Record<string, [string, string]> = { Introitus: LABELS.Introitus, Oratio: LABELS.Oratio, Lectio: LABELS.Epistola, Graduale: LABELS.G, Sequentia: LABELS.Sequentia, Evangelium: LABELS.Evangelium, Offertorium: LABELS.Offertorium, Secreta: LABELS.Secreta, Communio: LABELS.Communio, Postcommunio: LABELS.Postcommunio };
  const slim = (r: Round) => { const pl: Round['pl'] = {}; for (const [k, v] of Object.entries(r.pl)) if (!oznake[k] || oznake[k][0] !== v[0] || oznake[k][1] !== v[1]) pl[k] = v; const { pl: _, ...rest } = r; return Object.keys(pl).length ? { ...rest, pl } : rest; };
  fs.writeFileSync(path.join(out, 'data/base.js'), `IGRA.base(${JSON.stringify({ ...base, oznake, built: D.BASE.built })});\n`);
  const byYear = new Map<number, Round[]>(); for (const r of rounds) byYear.set(litYear(r.d), [...(byYear.get(litYear(r.d)) ?? []), r]);
  let bytes = 0; for (const [y, rs] of byYear) { const js = `IGRA.r(${y},${JSON.stringify(rs.map(slim))});\n`; bytes += js.length; fs.writeFileSync(path.join(out, `data/r/${y}.js`), js); }
  await build({ entryPoints: ['src/igra/main.ts'], bundle: true, format: 'iife', target: 'es2019', minify: true, outfile: path.join(out, 'app.js'), legalComments: 'none' });
  fs.copyFileSync('src/igra/index.html', path.join(out, 'index.html'));
  fs.copyFileSync('src/igra/style.css', path.join(out, 'style.css'));
  // offline worker of the game (scope igra/): everything is small, so all of it is cached at the first visit, with the fonts and the icon of the calendar
  const files = ['index.html', 'app.js', 'style.css', 'data/base.js', ...[...byYear.keys()].map(y => `data/r/${y}.js`)];
  const shared = ['../icon.svg', ...fs.readdirSync(path.join(dist, 'fonts')).filter(f => f.endsWith('.woff2')).map(f => '../fonts/' + f)];
  const hash = crypto.createHash('sha1'); for (const f of files) hash.update(f).update(fs.readFileSync(path.join(out, f))); const version = hash.digest('hex').slice(0, 12);
  fs.writeFileSync(path.join(out, 'sw.js'), `// Offline cache of the game (only when served over http or https)
const V = 'igra-${version}';
const CORE = ${JSON.stringify(['./', ...files.slice(0, 4), ...shared])};
const REST = ${JSON.stringify(files.slice(4))};
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
`);
  const r = { igra: { rounds: rounds.length, years: byYear.size, words: Object.keys(base.rijeci).length, roundBytes: bytes, version } };
  console.log(JSON.stringify(r)); return r;
}
if (process.argv[1]?.endsWith('build.ts') && process.argv[1].includes('igra')) await buildIgra(process.argv[2] ?? 'dist');
