// Prints five representative days to PDF (data/verify/pdf) from the built site served over http, so that the files carry no
// path of the computer they were made on.   npx tsx scripts/verify/print-pdf.ts
import { chromium } from 'playwright'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const dist = path.resolve('dist'); const TYPES: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => { const u = decodeURIComponent((req.url ?? '/').split('?')[0]); const f = path.join(dist, u === '/' ? 'index.html' : u); if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': TYPES[path.extname(f)] ?? 'application/octet-stream' }); res.end(fs.readFileSync(f)); });
await new Promise<void>(r => server.listen(0, '127.0.0.1', () => r())); const port = (server.address() as any).port;
const DAYS: [string, string][] = [['2026-12-25&m=0', '2026-12-25_m_0'], ['2027-02-24', '2027-02-24'], ['2027-03-26', '2027-03-26'], ['2027-03-28', '2027-03-28'], ['2027-06-27', '2027-06-27']];
const b = await chromium.launch(); const out: any[] = [];
try { const p = await (await b.newContext()).newPage(); fs.mkdirSync('data/verify/pdf', { recursive: true });
  for (const [q, name] of DAYS) { await p.goto(`http://127.0.0.1:${port}/?d=${q}`); await p.waitForFunction(() => !!document.getElementById('main')?.dataset.ready); await p.evaluate(() => (document as any).fonts.ready);
    const buf = await p.pdf({ path: `data/verify/pdf/${name}.pdf`, format: 'A4', printBackground: false, preferCSSPageSize: true, displayHeaderFooter: false }); out.push({ name, kB: Math.round(buf.length / 1024), pages: (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length }); }
} finally { await b.close(); server.close(); }
console.log(JSON.stringify(out));
