// Whole-site crawl: every date of the given years, both calendars, every tab, in a headless browser.
//   npx tsx scripts/verify/crawl.ts file 2026 2028      (from file://)
//   npx tsx scripts/verify/crawl.ts http 2026 2028      (served over http by a server started and stopped here)
// Checks: no console error, a title, no empty section or cell, no mojibake, Croatian diacritics present, internal links resolvable.
// Results: data/verify/crawl/<mode>-<year>.json
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const [mode, y0, y1] = [process.argv[2] ?? 'file', +(process.argv[3] ?? 2026), +(process.argv[4] ?? process.argv[3] ?? 2026)];
const dist = path.resolve('dist');
let server: http.Server | null = null; let base = 'file://' + path.join(dist, 'index.html');
if (mode === 'http') {
  const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.ics': 'text/calendar; charset=utf-8', '.webmanifest': 'application/manifest+json' };
  server = http.createServer((req, res) => { const u = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/sub\/path/, ''); const f = path.join(dist, u === '/' ? 'index.html' : u);
    if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
  await new Promise<void>(r => server!.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as any).port}/sub/path/index.html`;   // served under a sub-path
}
fs.mkdirSync('data/verify/crawl', { recursive: true });
const browser = await chromium.launch();
try {
  for (let y = y0; y <= y1; y++) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, serviceWorkers: 'block' });
    const errors: string[] = []; page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); }); page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
    page.on('requestfailed', r => errors.push('request failed ' + r.url().slice(-60)));
    await page.addInitScript('window.__name = function (f) { return f; }');   // helper that the TypeScript runner injects into evaluated functions
    await page.goto(`${base}?d=${y}-01-01`); await page.waitForFunction(() => !!document.getElementById('main')?.dataset.ready);
    const res = await page.evaluate(async (year: number) => {
      const T = (window as any).TLM; const out = { days: 0, views: 0, sections: 0, missingHr: 0, problems: [] as string[] };
      const pad = (n: number) => String(n).padStart(2, '0');
      for (const k of ['zagreb', 'opci']) for (let t = Date.UTC(year, 0, 1); t <= Date.UTC(year, 11, 31); t += 86400000) {
        const dt = new Date(t); const d = `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`; out.days++;
        let tabs = 1;
        for (let m = 0; m < tabs; m++) {
          await T.nav({ d, k, v: 'dan', m: m === 0 && tabs === 1 ? -1 : m }); out.views++;
          const main = document.getElementById('main')!; const where = `${d} ${k} #${m}`;
          if (m === 0) { tabs = Math.max(1, main.querySelectorAll('.tab').length); if (tabs > 1) { await T.nav({ d, k, v: 'dan', m: 0 }); } }
          const h1 = main.querySelector('h1')?.textContent?.trim(); if (!h1) out.problems.push(`${where}: no title`);
          const secs = main.querySelectorAll('.sec'); out.sections += secs.length;
          if (!secs.length) out.problems.push(`${where}: no section`);
          if (main.querySelector('.empty')) out.problems.push(`${where}: empty view`);
          secs.forEach(s => { const rows = s.querySelectorAll('.row:not(.head)'); if (!rows.length) out.problems.push(`${where}: section without rows (${s.querySelector('h2')?.textContent})`);
            rows.forEach(r => { const la = r.querySelector('.la')?.textContent?.trim() ?? '', hr = r.querySelector('.hr')?.textContent?.trim() ?? ''; if (!la) out.problems.push(`${where}: empty Latin cell (${s.querySelector('h2')?.textContent})`); if (!hr && !r.classList.contains('sub')) out.problems.push(`${where}: empty Croatian cell (${s.querySelector('h2')?.textContent})`); }); });
          out.missingHr += main.querySelectorAll('.missing').length;
          const text = main.textContent ?? ''; const hrText = [...main.querySelectorAll('.hr')].map(e => e.textContent).join(' ');
          if (/�|Ã[\u0080-¿¡-¿]|Ä[\u0080-¿]|Å[\u0080-¿¡-¿]/.test(text)) out.problems.push(`${where}: mojibake`);
          if (/[æðÐþøÆ]/.test(hrText.replace(/hrvatski prijevod nedostaje/g, ''))) out.problems.push(`${where}: suspicious character in Croatian «${(hrText.match(/.{0,15}[æðÐþøÆ].{0,15}/) ?? [''])[0]}»`);
          if (hrText.replace(/hrvatski prijevod nedostaje/g, '').length > 400 && !/[čćžšđ]/.test(hrText)) out.problems.push(`${where}: no Croatian diacritics`);
          if (/undefined|\[missing|NaN/.test(text)) out.problems.push(`${where}: placeholder text «${(text.match(/.{0,20}(undefined|\[missing|NaN).{0,20}/) ?? [''])[0]}»`);
          for (const a of main.querySelectorAll('a[href]')) { const h = a.getAttribute('href')!; if (!a.hasAttribute('data-nav') && !/^(\?|https?:|.*\.ics$)/.test(h)) out.problems.push(`${where}: odd link ${h}`); }
        }
      }
      // other views of this year: month grids and the year table
      for (let mo = 1; mo <= 12; mo++) { await T.nav({ d: `${year}-${pad(mo)}-01`, k: 'zagreb', v: 'mjesec', m: 0 }); if (document.querySelectorAll('#main a.cell').length < 28) out.problems.push(`${year}-${mo}: month grid incomplete`); }
      await T.nav({ d: `${year}-01-01`, k: 'zagreb', v: 'godina', m: 0 }); if (document.querySelectorAll('#main table.year tbody tr').length < 365) out.problems.push(`${year}: year table incomplete`);
      const ics = [...document.querySelectorAll('#main a[href$=".ics"]')].map(a => (a as HTMLAnchorElement).href);
      return { ...out, ics };
    }, y);
    for (const u of res.ics) { const f = mode === 'http' ? null : decodeURIComponent(u.replace('file://', '')); if (f && !fs.existsSync(f)) res.problems.push(`${y}: missing ${u}`); if (!f) { const r = await page.request.get(u); if (!r.ok()) res.problems.push(`${y}: ${u} -> ${r.status()}`); } }
    const result = { mode, year: y, ...res, consoleErrors: [...new Set(errors)] };
    fs.writeFileSync(`data/verify/crawl/${mode}-${y}.json`, JSON.stringify(result, null, 1));
    console.log(mode, y, JSON.stringify({ days: res.days, views: res.views, sections: res.sections, missingHr: res.missingHr, problems: res.problems.length, consoleErrors: result.consoleErrors.length }), res.problems.slice(0, 4).join(' | ').slice(0, 400), result.consoleErrors.slice(0, 2).join(' | '));
    await page.close();
  }
} finally { await browser.close(); if (server) await new Promise(r => server!.close(r)); }
