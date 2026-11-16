// Screenshots of the views other than the day's Mass (top of the day view, month grid, year list, search) -> data/verify/shots/view-*.png
//   npx tsx scripts/verify/views.ts
import { chromium } from 'playwright'; import path from 'node:path';
const base = 'file://' + path.resolve('dist/index.html');
const views: [string, string][] = [['dan', '?d=2027-03-28'], ['mjesec', '?d=2027-03-01&v=mjesec'], ['godina', '?d=2027-01-01&v=godina'], ['trazi', '?v=trazi&q=josip'], ['lokalni', '?d=2026-05-04']];
const b = await chromium.launch();
for (const [w, h] of [[1280, 900], [390, 844]] as const) for (const scheme of ['light', 'dark'] as const) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, deviceScaleFactor: w === 390 ? 2 : 1 }); const p = await ctx.newPage();
  for (const [name, q] of views) { if (scheme === 'dark' && name !== 'mjesec' && name !== 'dan') continue;
    await p.goto(base + q); await p.waitForFunction(() => !!document.getElementById('main')?.dataset.ready); await p.evaluate(() => (document as any).fonts.ready); await p.waitForTimeout(150);
    await p.screenshot({ path: `data/verify/shots/view-${name}-${w}-${scheme}.png` }); }
  await ctx.close();
}
await b.close(); console.log('ok');
