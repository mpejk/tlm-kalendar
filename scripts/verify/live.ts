// Checks the published site: the start page and a deep link render a day.   npx tsx scripts/verify/live.ts <base url>
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'https://mpejk.github.io/tlm-kalendar/';
const browser = await chromium.launch(); const out: any[] = [];
try { for (const q of ['', '?d=2027-03-28', '?d=2026-06-27', '?d=2030-12-08&k=opci', '?d=2027-03-01&v=mjesec']) {
  const page = await browser.newPage(); const errors: string[] = []; page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); }); page.on('pageerror', e => errors.push(String(e).slice(0, 120)));
  await page.goto(base + q); await page.waitForFunction(() => !!document.getElementById('main')?.dataset.ready, null, { timeout: 30000 });
  out.push({ url: base + q, title: await page.evaluate(() => document.querySelector('#main h1, #main .when')?.textContent), sections: await page.evaluate(() => document.querySelectorAll('#main .sec, #main a.cell').length), errors });
  await page.close(); } } finally { await browser.close(); }
console.log(JSON.stringify(out, null, 1));
