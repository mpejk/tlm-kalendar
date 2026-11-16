// Start-up order: the page must render whichever of its files arrives late (regression test for the race between app.js and data/base.js).
//   npx tsx scripts/verify/startup.ts      (starts and stops its own static server)
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const dist = path.resolve('dist');
const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => { let p = decodeURIComponent(new URL(req.url!, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'; const f = path.join(dist, p);
  if (!f.startsWith(dist) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream' }); res.end(fs.readFileSync(f)); });
await new Promise<void>(r => server.listen(0, '127.0.0.1', r)); const port = (server.address() as any).port;
const browser = await chromium.launch(); const out: any[] = []; let bad = 0;
try {
  for (const slow of ['data/base.js', 'app.js', 'data/cal/2027.js', 'style.css', '(none)']) for (const q of ['?d=2027-03-28', '?d=2027-03-01&v=mjesec', '']) {
    const ctx = await browser.newContext({ serviceWorkers: 'block' }); const page = await ctx.newPage(); const errors: string[] = [];
    page.on('pageerror', e => errors.push(String(e).slice(0, 150)));
    await page.route('**/' + slow, async r => { await new Promise(x => setTimeout(x, 700)); await r.continue(); });
    await page.goto(`http://127.0.0.1:${port}/${q}`);
    let ok = true; try { await page.waitForFunction(() => !!document.getElementById('main')?.dataset.ready, null, { timeout: 10000 }); } catch { ok = false; }
    if (!ok || errors.length) bad++; out.push({ slow, q, ok, errors }); await ctx.close();
  }
} finally { await browser.close(); server.close(); }
console.log(JSON.stringify({ cases: out.length, failed: bad, failures: out.filter(o => !o.ok || o.errors.length) }));
process.exit(bad ? 1 : 0);
