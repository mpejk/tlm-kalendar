// The "Djeca" item in the calendar's header (link to the game): last item of the navigation, a quiet outline (not a solid
// block), the same type size as its neighbours, readable in both themes, named for screen readers, reachable by keyboard,
// leading to the game, absent in print; at 340, 390, 768 and 1280 px, light and dark, and at the largest type size (160 %).
//   npx tsx scripts/igra/button.ts -> data/verify/igra-button.json, .cache/igra-shots/gumb-<width>-<theme>[-160].png
import fs from 'node:fs'; import { chromium } from 'playwright'; import { serve } from '../verify/serve';
const srv = await serve(); const b = await chromium.launch(); const res: any[] = []; const fails: string[] = []; fs.mkdirSync('.cache/igra-shots', { recursive: true });
const rgb = (c: string) => c.match(/[\d.]+/g)!.map(Number);
const lum = (c: number[]) => { const [r, g, bl] = c.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * bl; };
const over = (fg: number[], bg: number[]) => { const a = fg[3] ?? 1; return [0, 1, 2].map(i => fg[i] * a + bg[i] * (1 - a)); };
const ratio = (a: number[], c: number[]) => { const [x, y] = [lum(a), lum(c)].sort((p, q) => q - p); return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100; };
for (const width of [340, 390, 768, 1280]) for (const scheme of ['light', 'dark'] as const) for (const big of [false, true]) {
  const ctx = await b.newContext({ viewport: { width, height: 800 }, colorScheme: scheme, serviceWorkers: 'block' }); const page = await ctx.newPage();
  await page.goto(srv.url + '?d=2027-03-28'); await page.waitForFunction(() => !!document.getElementById('main')?.dataset.ready);
  if (big) { for (let i = 0; i < 8; i++) await page.locator('header [data-act="bigger"]').click(); await page.waitForTimeout(200); }
  const a = page.locator('header .views a.djeca'); const box = await a.boundingBox();
  const m: any = await page.evaluate(`(() => { const e = document.querySelector('header .views a.djeca'); const nav = e.parentElement; const items = [...nav.querySelectorAll('a')]; const prev = items[items.length - 2]; const s = getComputedStyle(e), p = getComputedStyle(prev);
    const page = getComputedStyle(document.body).backgroundColor; const r = e.getBoundingClientRect(), pr = prev.getBoundingClientRect(), nr = nav.getBoundingClientRect();
    return { fg: s.color, bg: s.backgroundColor, page, border: s.borderTopWidth, fs: s.fontSize, prevFs: p.fontSize, name: e.getAttribute('aria-label'), text: e.textContent.trim(), href: e.getAttribute('href'), last: items[items.length - 1] === e, inNav: nav.matches('nav.views'),
      rightEnd: Math.round(nr.right - r.right), sameLine: Math.abs(r.top - pr.top) < 4, heightRatio: r.height / pr.height, doc: document.documentElement.scrollWidth, W: document.documentElement.clientWidth, fontPct: getComputedStyle(document.documentElement).fontSize }; })()`);
  await page.screenshot({ path: `.cache/igra-shots/gumb-${width}-${scheme}${big ? '-160' : ''}.png`, clip: { x: 0, y: 0, width, height: big ? 420 : 300 } });
  let reached = false; for (let i = 0; i < 30 && !reached; i++) { await page.keyboard.press('Tab'); reached = await page.evaluate(() => document.activeElement?.classList.contains('djeca') ?? false); }
  await page.emulateMedia({ media: 'print' }); const inPrint = await a.isVisible(); await page.emulateMedia({ media: 'screen' });
  await a.focus(); await page.keyboard.press('Enter'); await page.waitForFunction(() => location.pathname.includes('/igra/') && !!document.getElementById('main')?.dataset.ready); const back = await page.locator('.views a.kal').count();
  const page_ = rgb(m.page); const fg = over(rgb(m.fg), page_); const bg = over(rgb(m.bg), page_);
  const row = { width, scheme, bigType: big, visible: !!box && box.x >= 0 && box.x + box.width <= width, text: m.text, name: m.name, lastInNav: m.last && m.inNav, atRightEnd: m.rightEnd <= 1, sameSizeAsNeighbour: m.fs === m.prevFs, notSolid: (rgb(m.bg)[3] ?? 1) < 0.2, outline: m.border !== '0px', contrast: ratio(fg, bg), keyboard: reached, gameLinksBack: back === 1, inPrint, noSideScroll: m.doc <= m.W, fontSize: m.fontPct };
  res.push(row); if (!row.visible || row.text !== 'Djeca' || !/^Djeca/.test(row.name) || !/Nedjeljni izazov/.test(row.name) || !row.lastInNav || !row.atRightEnd || !row.sameSizeAsNeighbour || !row.notSolid || !row.outline || row.contrast < 4.5 || !row.keyboard || !row.gameLinksBack || row.inPrint || !row.noSideScroll) fails.push(JSON.stringify(row));
  await ctx.close();
}
await b.close(); await srv.close(); fs.writeFileSync('data/verify/igra-button.json', JSON.stringify({ cases: res, failed: fails.length }, null, 1) + '\n'); console.log(res.map(r => `${r.width} ${r.scheme} ${r.bigType ? 'A+' : ''} contrast ${r.contrast} font ${r.fontSize}`).join('\n')); if (fails.length) { console.log('FAILED', fails.join('\n')); process.exit(1); }
