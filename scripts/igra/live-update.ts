// A returning visitor of the published game gets the new version, with the album kept.
//   npx tsx scripts/igra/live-update.ts before   — before publishing: a browser profile (.cache/live-profile) opens the live game
//                                                 (old version, its offline worker installed) and stores a child's album in the live format
//   npx tsx scripts/igra/live-update.ts after    — after publishing: the same profile opens the game again (twice at most, as a
//                                                 returning visitor does) and must get the new build with the album migrated
//   -> data/verify/igra-live-update.json
import fs from 'node:fs'; import { chromium } from 'playwright';
const site = 'https://mpejk.github.io/tlm-kalendar/igra/'; const mode = process.argv[2]; const dir = '.cache/live-profile'; const file = 'data/verify/igra-live-update.json';
const fixture = JSON.parse(fs.readFileSync('tests/fixtures/igra-v1.json', 'utf8')).value;
const ready = (p: any) => p.waitForFunction(() => !!document.getElementById('main')?.dataset.ready, null, { timeout: 20000 });
if (mode === 'before') fs.rmSync(dir, { recursive: true, force: true });
const ctx = await chromium.launchPersistentContext(dir, { viewport: { width: 390, height: 844 } }); const page = ctx.pages()[0] ?? await ctx.newPage();
const out: any = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const local = fs.readFileSync('dist/igra/data/base.js', 'utf8');
const liveBase = () => page.evaluate(() => fetch('data/base.js').then(r => r.text()));
const shown = () => page.evaluate(() => [...document.querySelectorAll('script[src]')].map(s => (s as HTMLScriptElement).src).join(' ') + ' | ' + (document.querySelector('.views a.kal') ? 'ok' : ''));
if (mode === 'before') {
  await page.goto(site); await ready(page); await page.evaluate(() => navigator.serviceWorker.ready);
  await page.evaluate(v => { localStorage.setItem('igra.v1', JSON.stringify(v)); }, fixture);
  out.before = { date: new Date().toISOString(), workerActive: await page.evaluate(() => !!navigator.serviceWorker.controller || navigator.serviceWorker.ready.then(() => true)), liveEqualsLocal: (await liveBase()) === local, hasV2Code: await page.evaluate(() => typeof (window as any).IGRA === 'object') };
} else {
  const visits: any[] = []; let ok = false;
  for (let i = 0; i < 3 && !ok; i++) {
    await page.goto(site); await ready(page); await page.waitForTimeout(4000); await ready(page).catch(() => {});
    // what the page runs: the round data of the new version carry the games per band (x)
    const isNew = await page.evaluate(() => fetch('data/base.js', { cache: 'no-store' }).then(r => r.text()).then(t => t.includes('maxLevel')));
    const running = await page.evaluate(() => { const app = [...document.scripts].some(s => s.src.endsWith('app.js')); return app && !!document.querySelector('.tko') && typeof localStorage.getItem('igra.v2') === 'string'; });
    visits.push({ visit: i + 1, newBuildOnServer: isNew, migratedAndRunning: running }); ok = running;
  }
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem('igra.v2') ?? 'null'));
  out.after = { date: new Date().toISOString(), visits, liveEqualsLocal: (await liveBase()) === local, profiles: s?.profili?.map((p: any) => p.ime), albumKept: JSON.stringify(s?.gotovo) === JSON.stringify(fixture.gotovo), ok: ok && (await liveBase()) === local && JSON.stringify(s?.gotovo) === JSON.stringify(fixture.gotovo) };
}
await ctx.close(); fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n'); console.log(JSON.stringify(out)); process.exit(mode === 'after' && !out.after.ok ? 1 : 0);
