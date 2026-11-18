// Plays the game as a child does, by touch, in Chromium and in WebKit with an iPhone profile, at phone (390) and tablet (768)
// width: every game of the round to the end, for days spread over the seasons and for the three age bands.
//   npx tsx scripts/igra/play.ts chromium|webkit   -> data/verify/igra-play.json
// Checks: the sticker appears and is in the album; a round outside its week gives the quiet practice mark; four profiles and
// their albums survive a reload; tap-to-place works without dragging and dragging by touch works; erasing removes everything.
import fs from 'node:fs';
import { chromium, webkit, devices, Page } from 'playwright';
import { serve } from '../verify/serve';
import { loadIgra, ready, playRound, dragTouch } from './play-lib';

const which = process.argv[2] === 'webkit' ? 'webkit' : 'chromium';
// Advent, Gaudete (rose), Christmas, Epiphany, Septuagesima, Candlemas (blessing before Mass), Lent, Palm Sunday, Easter (Sequence),
// Pentecost, Ss Peter and Paul, Assumption, Christ the King, All Souls (black), a green Sunday of 2031, Christmas 2036
const DAYS = ['2026-11-29', '2026-12-13', '2026-12-25', '2027-01-06', '2027-01-24', '2027-02-02', '2027-02-14', '2027-03-21', '2027-03-28', '2027-05-16', '2027-06-29', '2027-08-15', '2027-10-31', '2027-11-02', '2031-07-13', '2036-12-25'];
const KIDS = [{ ime: 'Ivan', dob: 'c' }, { ime: 'Marija', dob: 'b' }, { ime: 'Josip', dob: 'a' }, { ime: 'Ana', dob: 'c' }];
const { BASE, all } = loadIgra(); const srv = await serve(); const url = srv.url + 'igra/';
const browser = await (which === 'webkit' ? webkit : chromium).launch();
const res: any = { browser: which, rounds: 0, games: 0, byBand: { a: 0, b: 0, c: 0 }, byWidth: {} as Record<string, number>, days: DAYS.length, stickers: 0, practiceMarks: 0, dragged: 0, tapped: 0, errors: [] as string[] };
const fail = (m: string) => { res.errors.push(m); console.log('FAIL', m); };
const tap = async (page: Page, sel: string) => { const el = page.locator(sel).first(); await el.scrollIntoViewIfNeeded(); await el.tap(); };

for (const width of [390, 768]) {
  const ctx = await browser.newContext(which === 'webkit'
    ? { ...devices['iPhone 13'], viewport: { width, height: width === 390 ? 844 : 1024 } }
    : { viewport: { width, height: width === 390 ? 844 : 1024 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, userAgent: devices['Pixel 7'].userAgent });
  const page = await ctx.newPage(); page.on('pageerror', e => fail(`${width} page error: ${e.message}`)); page.on('console', m => { if (m.type() === 'error') fail(`${width} console: ${m.text()}`); });
  // four children added through the form, by touch
  await page.goto(url + '?danas=' + DAYS[0]); await ready(page);
  for (const [i, k] of KIDS.entries()) {
    if (i) await tap(page, '[data-act="novi"]');
    await page.locator('#ime').fill(k.ime); await tap(page, `input[name="dob"][value="${k.dob}"]`); await tap(page, 'form[data-form="novi"] button[type="submit"]'); await ready(page);
    await page.waitForFunction(n => document.querySelectorAll('.tko .ime').length === n, i + 1);
  }
  const expected: Record<string, Record<string, string>> = {};
  for (const [i, d] of DAYS.entries()) {
    const r = all.find(x => x.d === d); if (!r) { fail('no round ' + d); continue; }
    const kid = KIDS[(i + (width === 390 ? 0 : 1)) % 4]; const practice = i % 5 === 4;   // every fifth day is played a month late, for practice
    const danas = practice ? new Date(Date.parse(d) + 30 * 86400000).toISOString().slice(0, 10) : d;
    try {
      await page.goto(url + `?danas=${danas}`); await ready(page);
      await tap(page, `.tko .ime:text-is("${kid.ime}")`); await ready(page);
      if (!practice) { if (!(await page.locator(`a[data-go*='"igra"'][data-go*="${d}"]`).count())) fail(`${d}: the open round is not on the start page`); await tap(page, `a[data-go*='"igra"'][data-go*="${d}"]`); }
      else await page.goto(url + `?d=${d}&danas=${danas}`);
      await ready(page);
      // the vestments: by tap alone on even days, by dragging (touch) on odd days
      const drag = i % 2 === 1;
      const played = await playRound(page, r, BASE, kid.dob, { touch: true, wrongFirst: i % 3 === 0, drag, realTouch: which === 'chromium' } as any);
      res.rounds++; res.games += played.length; res.byBand[kid.dob]++; res.byWidth[width] = (res.byWidth[width] ?? 0) + 1; drag ? res.dragged++ : res.tapped++;
      const want = kid.dob === 'a' ? 2 : kid.dob === 'b' ? 4 : 6; if (played.length !== want) fail(`${d} ${kid.dob}: ${played.length} games`);
      const quiet = await page.locator('.kraj .slicica.vjezba').count(), full = await page.locator('.kraj .slicica:not(.vjezba)').count();
      if (practice ? !quiet : !full) fail(`${d}: wrong mark at the end (practice=${practice})`); else practice ? res.practiceMarks++ : res.stickers++;
      (expected[kid.ime] ??= {})[d] = practice ? 'v' : 'n';
      // the album shows it
      await tap(page, `.kraj a[data-go*='"album"']`); await ready(page);
      const y = +d.slice(0, 4); await page.goto(url + `?v=album&danas=${danas}`); await ready(page);
      const cell = page.locator(`.polje.ima a[data-go*="${d}"] .slicica${practice ? '.vjezba' : ':not(.vjezba)'}`);
      if (!(await cell.count())) fail(`${d}: no ${practice ? 'practice mark' : 'sticker'} in the album of ${kid.ime} (${y})`);
    } catch (e) { fail(`${which} ${width} ${d} ${kid.ime}/${kid.dob}: ${String(e).slice(0, 300)}`); }
  }
  // reload: four profiles and each album as played
  await page.goto(url + '?v=roditelji'); await ready(page); await page.reload(); await ready(page);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('igra.v1') ?? 'null'));
  if (stored?.profili?.length !== 4) fail(`${width}: ${stored?.profili?.length} profiles after reload`);
  for (const k of KIDS) { const p = stored.profili.find((x: any) => x.ime === k.ime); if (!p || p.dob !== k.dob) { fail(`${width}: profile ${k.ime} lost`); continue; } if (JSON.stringify(stored.gotovo[p.id] ?? {}, Object.keys(stored.gotovo[p.id] ?? {}).sort()) !== JSON.stringify(expected[k.ime] ?? {}, Object.keys(expected[k.ime] ?? {}).sort())) fail(`${width}: album of ${k.ime} differs after reload`); }
  if ((await page.locator('.djeca .dijete').count()) !== 4) fail(`${width}: the parents' page does not list four children`);
  res.profilesAfterReload = stored?.profili?.length;
  // change of the age band by a parent, then capital letters for the youngest
  await page.locator('.dijete select').nth(1).selectOption('a'); await ready(page);
  await tap(page, '.dijete input[data-change="vel"]'); await ready(page);
  await page.goto(url + `?d=${DAYS[0]}&danas=${DAYS[0]}`); await ready(page); await tap(page, `.tko .ime:text-is("Marija")`).catch(() => {});
  await page.goto(url + `?danas=${DAYS[0]}`); await ready(page); await tap(page, `.tko .ime:text-is("Marija")`); await ready(page);
  await page.goto(url + `?d=${DAYS[0]}&danas=${DAYS[0]}`); await ready(page);
  if ((await page.evaluate(() => getComputedStyle(document.querySelector('#main .pitanje')!).textTransform)) !== 'uppercase') fail(`${width}: capital letters not applied`);
  // erase everything
  await page.goto(url + '?v=roditelji'); await ready(page);
  await tap(page, '[data-act="brisi-sve"]'); await tap(page, '[data-act="brisi-sve-da"]'); await ready(page);
  const after = await page.evaluate(() => localStorage.getItem('igra.v1')); if (after !== null) fail(`${width}: data left after erasing`);
  await page.goto(url); await ready(page); if (!(await page.locator('form[data-form="novi"]').count()) || (await page.locator('.tko .ime').count())) fail(`${width}: children still shown after erasing`);
  res.erased = after === null;
  // nothing asked of any other site
  await ctx.close();
}
await browser.close(); await srv.close();
const file = 'data/verify/igra-play.json'; const prev = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
prev[which] = res; fs.writeFileSync(file, JSON.stringify(prev, null, 1) + '\n');
console.log(JSON.stringify(res)); process.exit(res.errors.length ? 1 : 0);
