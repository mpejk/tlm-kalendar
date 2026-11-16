// Look and behaviour: screenshots of 40 representative days at 390 px and 1280 px, light and dark; contact sheets for review;
// five days printed to PDF (A4) plus a print-layout preview image of each.
//   npx tsx scripts/verify/shots.ts        -> data/verify/shots/*.png (sheets), data/verify/pdf/*.pdf, .cache/shots/full/*.png
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

export const DAYS: [string, string][] = [
  ['2026-11-29', 'Advent I (I class Sunday)'], ['2026-12-08', 'Immaculate Conception'], ['2026-12-16', 'Ember Wednesday of Advent'], ['2026-12-19&m=0', 'Ember Saturday, longer form'], ['2026-12-25&m=1', 'Christmas, Mass at dawn'],
  ['2026-12-26', 'St Stephen in the octave'], ['2027-01-06', 'Epiphany'], ['2027-01-10', 'Holy Family'], ['2027-01-23', 'Saturday of Our Lady / III class'], ['2027-01-24', 'Septuagesima'],
  ['2027-02-02&m=0', 'Candlemas: blessing of candles'], ['2027-02-10', 'Ash Wednesday (Mass)'], ['2027-02-10&m=0', 'Ash Wednesday: ashes'], ['2027-02-24', 'Lenten feria with prayer over the people'], ['2027-03-19', 'St Joseph'],
  ['2027-03-21&m=0', 'Palm Sunday: blessing of palms'], ['2027-03-21&m=1', 'Palm Sunday: Mass with the Passion'], ['2027-03-25&m=1', 'Holy Thursday evening Mass'], ['2027-03-26', 'Good Friday'], ['2027-03-27', 'Easter Vigil'],
  ['2027-03-28', 'Easter Sunday'], ['2027-04-05', 'Annunciation transferred'], ['2027-04-25&m=1', 'Greater Litanies: Rogation Mass'], ['2027-05-06', 'Ascension'], ['2027-05-16', 'Pentecost'],
  ['2027-05-22&m=1', 'Ember Saturday of Pentecost, shorter form'], ['2027-05-27', 'Corpus Christi'], ['2027-06-04', 'Sacred Heart'], ['2027-06-29', 'Sts Peter and Paul'], ['2027-07-25', 'Sunday after Pentecost with commemoration'],
  ['2027-08-15', 'Assumption on a Sunday'], ['2027-09-18', 'Ember Saturday of September'], ['2027-10-31', 'Christ the King'], ['2027-11-02&m=1', 'All Souls, second Mass'], ['2027-11-16', 'IV class feria'],
  ['2026-02-10', 'Zagreb: Bl. Alojzije Stepinac'], ['2027-06-27', 'Zagreb: St Ladislaus on a Sunday'], ['2026-08-25', 'Zagreb: dedication of the cathedral'], ['2026-07-13', 'Zagreb: Our Lady of Bistrica'], ['2026-08-25&k=opci', 'general calendar on a local feast day'],
];
const PDF_DAYS = ['2027-03-28', '2026-12-25&m=0', '2027-02-24', '2027-06-27', '2027-03-26'];
const base = 'file://' + path.resolve('dist/index.html');
const full = '.cache/shots/full', sheets = 'data/verify/shots', pdfs = 'data/verify/pdf';
for (const d of [full, sheets, pdfs]) fs.mkdirSync(d, { recursive: true });
const browser = await chromium.launch(); const report: string[] = [];
const combos = [[1280, 900, 'light'], [1280, 900, 'dark'], [390, 844, 'light'], [390, 844, 'dark']] as const;
for (const [w, hgt, scheme] of combos) {
  const ctx = await browser.newContext({ viewport: { width: w, height: hgt }, colorScheme: scheme }); const page = await ctx.newPage();
  const errors: string[] = []; page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('pageerror', e => errors.push(String(e)));
  for (let i = 0; i < DAYS.length; i++) {
    await page.goto(`${base}?d=${DAYS[i][0]}`);
    try { await page.waitForFunction(() => !!document.getElementById('main')?.dataset.ready, null, { timeout: 10000 }); }
    catch { const diag = await Promise.race([page.evaluate(() => ({ rs: document.readyState, main: document.getElementById('main')?.innerHTML.slice(0, 150), n: document.scripts.length })), new Promise(r => setTimeout(() => r('page unresponsive'), 5000))]);
      console.log('TIMEOUT', DAYS[i][0], w, scheme, JSON.stringify(diag), errors.slice(-3)); report.push(`${DAYS[i][0]} ${w}px ${scheme}: did not render within 10 s (${JSON.stringify(diag).slice(0, 200)})`);
      await page.goto(`${base}?d=${DAYS[i][0]}`); await page.waitForFunction(() => !!document.getElementById('main')?.dataset.ready); } await page.evaluate(() => (document as any).fonts.ready); await page.waitForTimeout(120);
    // scroll past the page header so that the day itself fills the screenshot
    await page.evaluate(() => document.querySelector('.daynav')?.scrollIntoView());
    await page.screenshot({ path: `${full}/${String(i + 1).padStart(2, '0')}-${w}-${scheme}.png` });
    const m = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > window.innerWidth + 1, missing: document.querySelectorAll('.missing').length, tiny: [...document.querySelectorAll('#main *')].filter(e => { const s = getComputedStyle(e); return e.childElementCount === 0 && (e.textContent ?? '').trim().length > 3 && parseFloat(s.fontSize) < 11; }).length }));
    if (m.overflow) report.push(`${DAYS[i][0]} ${w}px ${scheme}: horizontal overflow`); if (m.tiny) report.push(`${DAYS[i][0]} ${w}px ${scheme}: ${m.tiny} text nodes under 11px`);
  }
  if (errors.length) report.push(`${w}px ${scheme}: console errors ${[...new Set(errors)].join(' | ').slice(0, 300)}`);
  await ctx.close();
}
// contact sheets: 8 days per sheet, the four variants of a day in one row
const ctx = await browser.newContext({ viewport: { width: 1800, height: 1200 } }); const page = await ctx.newPage();
for (let s = 0; s < DAYS.length / 5; s++) {
  const rows = DAYS.slice(s * 5, s * 5 + 5).map((d, k) => { const n = String(s * 5 + k + 1).padStart(2, '0');
    return `<div class="r"><div class="cap">${n}. ${d[0]} — ${d[1]}</div><img src="${path.resolve(full)}/${n}-1280-light.png" style="height:330px"><img src="${path.resolve(full)}/${n}-1280-dark.png" style="height:330px"><img src="${path.resolve(full)}/${n}-390-light.png" style="height:330px"><img src="${path.resolve(full)}/${n}-390-dark.png" style="height:330px"></div>`; }).join('');
  const html = `<html><body style="margin:6px;background:#888;font:13px sans-serif"><style>.r{margin-bottom:6px;white-space:nowrap}.cap{color:#fff;background:#222;padding:2px 6px}img{margin-right:6px;vertical-align:top}</style>${rows}</body></html>`;
  const f = path.resolve(`.cache/shots/sheet-${s + 1}.html`); fs.writeFileSync(f, html); await page.goto('file://' + f); await page.waitForLoadState('load');
  await page.screenshot({ path: `${sheets}/sheet-${String(s + 1).padStart(2, '0')}.png`, fullPage: true });
}
await ctx.close();
// print: PDF and preview
const pctx = await browser.newContext({ viewport: { width: 794, height: 1123 } }); const pp = await pctx.newPage(); const pdfInfo: any[] = [];
for (const d of PDF_DAYS) {
  await pp.goto(`${base}?d=${d}`); await pp.waitForFunction(() => !!document.getElementById('main')?.dataset.ready); await pp.evaluate(() => (document as any).fonts.ready);
  const name = d.replace(/[^0-9a-z-]/gi, '_');
  const buf = await pp.pdf({ path: `${pdfs}/${name}.pdf`, format: 'A4', printBackground: false, preferCSSPageSize: true });
  await pp.emulateMedia({ media: 'print' }); await pp.screenshot({ path: `${pdfs}/${name}-preview.png` }); await pp.emulateMedia({ media: 'screen' });
  pdfInfo.push({ day: d, bytes: buf.length, pages: (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length });
}
await pctx.close(); await browser.close();
fs.writeFileSync('data/verify/shots/report.json', JSON.stringify({ days: DAYS.length, screenshots: DAYS.length * combos.length, problems: report, pdf: pdfInfo }, null, 1));
console.log(JSON.stringify({ screenshots: DAYS.length * combos.length, problems: report.slice(0, 10), pdf: pdfInfo }));
