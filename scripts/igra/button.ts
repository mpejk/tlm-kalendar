// The "Igra" button in the calendar's header: shown at 340 and 1280 px in both themes, named for screen readers, reachable by
// keyboard, leading to the game, absent in print.   npx tsx scripts/igra/button.ts -> data/verify/igra-button.json, .cache/igra-shots/gumb-*.png
import fs from 'node:fs'; import { chromium } from 'playwright'; import { serve } from '../verify/serve';
const srv = await serve(); const b = await chromium.launch(); const res: any[] = []; const fails: string[] = []; fs.mkdirSync('.cache/igra-shots', { recursive: true });
const lum = (c: string) => { const [r, g, bl] = c.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * bl; };
const ratio = (a: string, c: string) => { const [x, y] = [lum(a), lum(c)].sort((p, q) => q - p); return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100; };
for (const width of [340, 1280]) for (const scheme of ['light', 'dark'] as const) {
  const ctx = await b.newContext({ viewport: { width, height: 800 }, colorScheme: scheme, serviceWorkers: 'block' }); const page = await ctx.newPage();
  await page.goto(srv.url + '?d=2027-03-28'); await page.waitForFunction(() => !!document.getElementById('main')?.dataset.ready);
  const a = page.locator('header a.igra'); const box = await a.boundingBox();
  const m: any = await page.evaluate(`(() => { const e = document.querySelector('header a.igra'); const s = getComputedStyle(e), o = getComputedStyle(document.querySelector('header .btn[data-act="today"]')); return { bg: s.backgroundColor, fg: s.color, other: o.backgroundColor, name: e.getAttribute('aria-label'), text: e.textContent.trim(), href: e.getAttribute('href'), doc: document.documentElement.scrollWidth, W: document.documentElement.clientWidth }; })()`);
  // keyboard: Tab reaches it, Enter opens the game
  let reached = false; for (let i = 0; i < 25 && !reached; i++) { await page.keyboard.press('Tab'); reached = await page.evaluate(() => document.activeElement?.classList.contains('igra') ?? false); }
  await page.screenshot({ path: `.cache/igra-shots/gumb-${width}-${scheme}.png`, clip: { x: 0, y: 0, width, height: 260 } });
  await page.emulateMedia({ media: 'print' }); const inPrint = await a.isVisible(); await page.emulateMedia({ media: 'screen' });
  await a.focus(); await page.keyboard.press('Enter'); await page.waitForFunction(() => location.pathname.includes('/igra/') && !!document.getElementById('main')?.dataset.ready); const back = await page.locator('.views a.kal').count();
  const row = { width, scheme, visible: !!box && box.x >= 0 && box.x + box.width <= width, height: box ? Math.round(box.height) : 0, text: m.text, name: m.name, contrastOfLabel: ratio(m.bg, m.fg), differsFromOtherButtons: m.bg !== m.other, keyboard: reached, opensGame: true, gameLinksBack: back === 1, inPrint, noSideScroll: m.doc <= m.W };
  res.push(row); if (!row.visible || row.text !== 'Igra' || !/Nedjeljni izazov/.test(row.name) || row.contrastOfLabel < 4.5 || !row.differsFromOtherButtons || !row.keyboard || !row.gameLinksBack || row.inPrint || !row.noSideScroll) fails.push(JSON.stringify(row));
  await ctx.close();
}
await b.close(); await srv.close(); fs.writeFileSync('data/verify/igra-button.json', JSON.stringify({ cases: res, failed: fails.length }, null, 1) + '\n'); console.log(JSON.stringify(res, null, 0)); if (fails.length) { console.log('FAILED', fails.join('\n')); process.exit(1); }
