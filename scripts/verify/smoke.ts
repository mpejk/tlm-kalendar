// Opens a few days from file:// and takes screenshots:  npx tsx scripts/verify/smoke.ts [date ...]
import { chromium } from 'playwright';
import path from 'node:path';
const dates = process.argv.slice(2).length ? process.argv.slice(2) : ['2027-03-28', '2026-12-25&m=1', '2026-11-16'];
const base = 'file://' + path.resolve('dist/index.html');
const browser = await chromium.launch();
for (const [w, hgt] of [[1280, 900], [390, 844]] as const) {
  const page = await browser.newPage({ viewport: { width: w, height: hgt } });
  const errors: string[] = []; page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('pageerror', e => errors.push(String(e)));
  for (const d of dates) {
    await page.goto(`${base}?d=${d}`); await page.waitForFunction(() => !!document.getElementById('main')?.dataset.ready, null, { timeout: 8000 }).catch(() => console.log('TIMEOUT', errors.join(' | ').slice(0, 500)));
    await page.waitForTimeout(300);
    const name = `.cache/shots/${d.replace(/[^0-9a-z-]/gi, '_')}-${w}.png`;
    await page.screenshot({ path: name, fullPage: false });
    const info = await page.evaluate(() => ({ title: document.querySelector('h1')?.textContent, secs: document.querySelectorAll('.sec').length, missing: document.querySelectorAll('.missing').length, font: [...(document as any).fonts].filter((f: any) => f.status === 'loaded').length }));
    console.log(w, d, JSON.stringify(info), errors.length ? 'ERRORS ' + errors.join(' | ').slice(0, 300) : '');
  }
  await page.close();
}
await browser.close();
