// Screenshots of every game at every level, for each age band, light and dark (for the review by eye):
//   npx tsx scripts/igra/shots2.ts [light|dark|both] [390] [filter]  -> .cache/igra-shots/v2/<band>-<game>-L<level>-<theme>-<phase>.png
// For each band, game and level the first round of the range that has that game is played to the end of that game.
import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';
import { loadIgra, ready, setProfiles, playRound } from './play-lib';
import { maxLevel, FIXED } from '../../src/igra/pitanja';
const [which = 'both', width = '390', filter = ''] = process.argv.slice(2);
const { BASE, all } = loadIgra(); const out = '.cache/igra-shots/v2'; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const base = 'file://' + path.resolve('dist/igra/index.html'); let n = 0; const errors: string[] = [];
for (const theme of which === 'both' ? ['light', 'dark'] : [which]) {
  const ctx = await b.newContext({ viewport: { width: +width, height: 800 }, hasTouch: true, isMobile: true, colorScheme: theme as any, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
  for (const dob of ['a', 'b', 'c']) {
    const games = [...new Set(all.flatMap(r => r.x[dob]))] as string[];
    for (const g of games) for (let L = 1; L <= (FIXED.includes(g) ? maxLevel(BASE, dob as any, g, true) : 1); L++) {
      const tag = `${dob}-${g}-L${L}-${theme}`; if (filter && !tag.includes(filter)) continue;
      const r = all.find(x => x.x[dob].includes(g) && x.d >= '2026-11-29')!;
      await page.goto(base + '?danas=' + r.d); await ready(page);
      await setProfiles(page, [{ ime: 'Ana', dob, vel: false, ...(dob === 'b' && L === 3 && g === 'odgovori' ? { min: true } : {}) } as any], 0, { p0: Object.fromEntries(FIXED.map(f => [f, { l: L, ok: [] }])) });
      await page.goto(base + `?d=${r.d}&danas=${r.d}&brzo=1`); await ready(page);
      try {
        await playRound(page, { ...r, x: { ...r.x, [dob]: r.x[dob].slice(0, r.x[dob].indexOf(g) + 1) } }, BASE, dob, { wrongFirst: true, onGame: async (gg, ph) => { if (gg === g && ph !== 'end' || gg === g && ph === 'end') { await page.screenshot({ path: `${out}/${tag}-${ph}.png`, fullPage: true }); n++; } } }).catch(e => { if (!String(e).includes('.kraj')) throw e; });
      } catch (e) { errors.push(`${tag} ${r.d}: ${String(e).slice(0, 200)}`); }
    }
  }
  await ctx.close();
}
await b.close(); console.log(n, 'screenshots;', errors.length, 'errors'); console.log(errors.join('\n'));
