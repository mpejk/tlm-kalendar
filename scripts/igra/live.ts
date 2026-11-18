// The published game: its address loads, the button is on the live calendar and leads to it, a direct link to a round opens
// and the round can be played to its sticker.   npx tsx scripts/igra/live.ts [https://mpejk.github.io/tlm-kalendar/]  -> data/verify/igra-live.json
import fs from 'node:fs'; import { chromium, webkit, devices } from 'playwright';
import { loadIgra, ready, setProfiles, playRound } from './play-lib';
const site = (process.argv[2] ?? 'https://mpejk.github.io/tlm-kalendar/').replace(/\/?$/, '/'); const { BASE, all } = loadIgra(); const d = '2026-11-29'; const r = all.find(x => x.d === d)!;
const out: any = { site, checked: new Date().toISOString().slice(0, 10), engines: {} }; let bad = false;
for (const [name, type] of [['chromium', chromium], ['webkit', webkit]] as const) {
  const b = await type.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } }); const page = await ctx.newPage();
  const errors: string[] = []; page.on('pageerror', e => errors.push(String(e).slice(0, 150))); const other = new Set<string>(); page.on('request', q => { if (!q.url().startsWith(site) && !q.url().startsWith('data:')) other.add(q.url()); });
  const res: any = {};
  try {
    const resp = await page.goto(site + 'igra/'); await ready(page); res.gameLoads = resp?.status() === 200 && (await page.locator('h1').innerText()) === 'Nedjeljni izazov';
    res.sameBuildAsLocal = (await page.evaluate(() => fetch('data/base.js').then(x => x.text()))) === fs.readFileSync('dist/igra/data/base.js', 'utf8');
    await page.goto(site); await page.waitForFunction(() => !!document.getElementById('main')?.dataset.ready); const a = page.locator('header a.igra'); res.buttonOnCalendar = (await a.count()) === 1 && (await a.getAttribute('aria-label')) === 'Nedjeljni izazov, igra za djecu';
    await a.tap(); await page.waitForURL(u => u.pathname.includes('/igra/'), { timeout: 15000 }); await ready(page); res.buttonOpensGame = page.url().startsWith(site + 'igra/') && (await page.locator('h1').innerText()) === 'Nedjeljni izazov';
    await setProfiles(page, [{ ime: 'Proba', dob: 'c' }]);
    await page.goto(site + `igra/?d=${d}&danas=${d}`); await ready(page); res.directRoundLink = (await page.locator('.igra-boja').count()) === 1;
    const played = await playRound(page, r, BASE, 'c', { touch: true, wrongFirst: true }); res.gamesPlayed = played.length; res.sticker = (await page.locator('.kraj .slicica:not(.vjezba)').count()) === 1;
    await page.goto(site + `igra/?d=${d}&ispis=1`); await ready(page); res.sheet = (await page.locator('.list .bojanka').count()) === 1;
    await page.locator('.views a.kal').tap(); await page.waitForFunction(() => !location.pathname.includes('/igra/')); res.linkBack = true;
  } catch (e) { errors.push(String(e).slice(0, 300)); }
  res.requestsToOtherSites = [...other]; res.errors = errors; out.engines[name] = res;
  if (errors.length || other.size || !res.gameLoads || !res.sameBuildAsLocal || !res.buttonOnCalendar || !res.buttonOpensGame || !res.directRoundLink || res.gamesPlayed !== 6 || !res.sticker || !res.sheet || !res.linkBack) bad = true;
  await b.close();
}
fs.writeFileSync('data/verify/igra-live.json', JSON.stringify(out, null, 1) + '\n'); console.log(JSON.stringify(out, null, 1)); process.exit(bad ? 1 : 0);
