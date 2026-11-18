// Plays the game as a child does, by touch, in Chromium and in WebKit with an iPhone profile, at phone (390) and tablet (768)
// width: every game of the round to the end, for days spread over the seasons, the three age bands and every level.
//   npx tsx scripts/igra/play.ts chromium|webkit   -> data/verify/igra-play.json
// Checks: the profiles and albums of the live version (igra.v1, tests/fixtures/igra-v1.json) load after the update with nothing
// lost; the sticker appears and is in the album; a round outside its week gives the quiet practice mark; a level rises after
// three rounds finished without a wrong try and survives a reload; every new game and every level is played; dragging by touch
// works; erasing removes everything.
import fs from 'node:fs';
import { chromium, webkit, devices, Page } from 'playwright';
import { serve } from '../verify/serve';
import { loadIgra, ready, playRound, coverage } from './play-lib';
import { FIXED, maxLevel } from '../../src/igra/pitanja';

const which = process.argv[2] === 'webkit' ? 'webkit' : 'chromium';
// Advent, Gaudete (rose), Christmas, Epiphany, Septuagesima, Candlemas (blessing before Mass), Lent, Palm Sunday, Easter (Sequence),
// Pentecost, Ss Peter and Paul, Assumption, Christ the King, All Souls (black), a green Sunday of 2031, Christmas 2036
const DAYS = ['2026-11-29', '2026-12-13', '2026-12-25', '2027-01-06', '2027-01-24', '2027-02-02', '2027-02-14', '2027-03-21', '2027-03-28', '2027-05-16', '2027-06-29', '2027-08-15', '2027-10-31', '2027-11-02', '2031-07-13', '2036-12-25'];
const fixture = JSON.parse(fs.readFileSync('tests/fixtures/igra-v1.json', 'utf8')).value;
const KIDS = fixture.profili as { id: string; ime: string; dob: string }[];   // Ivan c, Marija b, Josip a (capital letters), Ana c
const { BASE, all } = loadIgra(); const srv = await serve(); const url = srv.url + 'igra/';
const browser = await (which === 'webkit' ? webkit : chromium).launch();
const res: any = { browser: which, rounds: 0, games: 0, byBand: { a: 0, b: 0, c: 0 }, byWidth: {} as Record<string, number>, seasonDays: DAYS.length, played: {} as Record<string, number>, stickers: 0, practiceMarks: 0, dragged: 0, levelRises: 0, errors: [] as string[] };
const fail = (m: string) => { res.errors.push(m); console.log('FAIL', m); };
const tap = async (page: Page, sel: string) => { const el = page.locator(sel).first(); await el.scrollIntoViewIfNeeded(); await el.tap(); };
const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('igra.v2') ?? 'null'));

for (const width of [390, 768]) {
  const ctx = await browser.newContext(which === 'webkit'
    ? { ...devices['iPhone 13'], viewport: { width, height: width === 390 ? 844 : 1024 } }
    : { viewport: { width, height: width === 390 ? 844 : 1024 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, userAgent: devices['Pixel 7'].userAgent });
  const page = await ctx.newPage(); page.on('pageerror', e => fail(`${width} page error: ${e.message}`)); page.on('console', m => { if (m.type() === 'error') fail(`${width} console: ${m.text()}`); });
  // 1. the data of the live version: four children and their albums, as the live game stored them
  await page.goto(url + '?danas=2026-11-23'); await ready(page);
  await page.evaluate(v => { localStorage.clear(); localStorage.setItem('igra.v1', JSON.stringify(v)); }, fixture); await page.reload(); await ready(page);
  const names = await page.locator('.tko .ime').allInnerTexts(); if (names.join() !== KIDS.map(k => k.ime).join()) fail(`${width}: profiles after the update: ${names.join()}`);
  await page.goto(url + '?v=album&g=2026&danas=2026-12-01'); await ready(page);
  if ((await page.locator('.polje.ima').count()) !== 1) fail(`${width}: Marija's album (the current child) does not show her sticker after the update`);
  await page.goto(url + '?v=album&g=2025&danas=2026-12-01'); await ready(page).catch(() => {});
  res.migration = { profiles: names.length, ok: names.length === 4 };
  const expected: Record<string, Record<string, string>> = JSON.parse(JSON.stringify(fixture.gotovo));
  const playAs = async (kid: typeof KIDS[number], d: string, opt: { practice?: boolean; drag?: boolean; wrongFirst?: boolean; level?: number } = {}) => {
    const r = all.find(x => x.d === d); if (!r) { fail('no round ' + d); return null; }
    const danas = opt.practice ? new Date(Date.parse(d) + 30 * 86400000).toISOString().slice(0, 10) : d;
    await page.evaluate(id => { const s = JSON.parse(localStorage.getItem('igra.v2')!); s.tko = id; localStorage.setItem('igra.v2', JSON.stringify(s)); }, kid.id);
    if (opt.level) await page.evaluate(([id, L]) => { const s = JSON.parse(localStorage.getItem('igra.v2')!); s.razine[id as string] = Object.fromEntries(['ruho', 'kalez', 'oltar', 'misa', 'odgovori'].map(g => [g, { l: L, ok: [] }])); localStorage.setItem('igra.v2', JSON.stringify(s)); }, [kid.id, opt.level] as any);
    await page.goto(url + `?danas=${danas}&brzo=1`); await ready(page);
    if (!opt.practice && !(await page.locator(`a[data-go*='"igra"'][data-go*="${d}"]`).count())) fail(`${d}: the open round is not on the start page`);
    if (!opt.practice) await tap(page, `a[data-go*='"igra"'][data-go*="${d}"]`); else await page.goto(url + `?d=${d}&danas=${danas}&brzo=1`);
    await ready(page);
    const played = await playRound(page, r, BASE, kid.dob, { touch: true, wrongFirst: opt.wrongFirst, drag: opt.drag, realTouch: which === 'chromium' });
    res.rounds++; res.games += played.length; res.byBand[kid.dob]++; res.byWidth[width] = (res.byWidth[width] ?? 0) + 1; if (opt.drag) res.dragged++;
    for (const g of played) res.played[`${kid.dob} ${g.includes(':') ? g : g + ':1'}`] = (res.played[`${kid.dob} ${g.includes(':') ? g : g + ':1'}`] ?? 0) + 1;
    if (played.length !== r.x[kid.dob].length) fail(`${d} ${kid.dob}: ${played.length} games of ${r.x[kid.dob].length}`);
    const quiet = await page.locator('.kraj .slicica.vjezba').count(), full = await page.locator('.kraj .slicica:not(.vjezba)').count();
    if (opt.practice ? !quiet : !full) fail(`${d}: wrong mark at the end (practice=${!!opt.practice})`); else opt.practice ? res.practiceMarks++ : res.stickers++;
    const ex = (expected[kid.id] ??= {}); if (!opt.practice) ex[d] = 'n'; else if (!ex[d]) ex[d] = 'v';
    return { r, played, rose: await page.locator('.razina-gore').count() };
  };
  try {
    // 2. the days of the seasons, children taking turns; every fifth a month late (practice); vestments dragged on odd days
    for (const [i, d] of DAYS.entries()) { const kid = KIDS[(i + (width === 390 ? 0 : 1)) % 4]; await playAs(kid, d, { practice: i % 5 === 4, drag: i % 2 === 1, wrongFirst: i % 3 === 0 }); }
    // 3. every game and every level of each band (Ivan c, Marija b — learns to serve, Josip a)
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('igra.v2')!); s.profili[1].min = true; localStorage.setItem('igra.v2', JSON.stringify(s)); });
    for (const kid of KIDS.slice(0, 3)) for (const { r, level } of coverage(all, BASE, kid.dob, kid.dob === 'b')) await playAs(kid, r.d, { practice: true, level, drag: level === 1 && r.x[kid.dob].includes('kalez') });
    // 4. a level rises after three rounds without a wrong try, and survives a reload (Ana, band c, Složi kalež)
    const ana = KIDS[3]; await page.evaluate(id => { const s = JSON.parse(localStorage.getItem('igra.v2')!); delete s.razine[id]; localStorage.setItem('igra.v2', JSON.stringify(s)); }, ana.id);
    const kz = all.filter(x => x.x.c.includes('kalez') && x.d >= '2028-01-01').slice(0, 4);
    for (const [j, r] of kz.slice(0, 3).entries()) { const o = await playAs(ana, r.d, { practice: true }); const lv = (await stored(page)).razine[ana.id]?.kalez?.l ?? 1; if (j < 2 && (lv !== 1 || o?.rose)) fail(`level rose too early (${j + 1} rounds)`); if (j === 2) { if (lv !== 2 || !o?.rose) fail(`level did not rise after three correct rounds (level ${lv})`); else res.levelRises++; } }
    await page.reload(); await ready(page); if ((await stored(page)).razine[ana.id]?.kalez?.l !== 2) fail('level lost after reload');
    await page.goto(url + '?v=roditelji'); await ready(page); if (!(await page.locator('.dijete').nth(3).innerText()).includes('Složi kalež: 2/3')) fail("the parents' page does not show the new level");
    // the next round with the chalice is at level 2; a wrong try there keeps the round from counting
    const before = (await stored(page)).razine[ana.id].kalez.ok.length; const o = await playAs(ana, kz[3].d, { practice: true, wrongFirst: true });
    if (!o?.played.includes('kalez:2')) fail(`the next round with Složi kalež is not at level 2: ${o?.played}`); else res.levelShownNextRound = 2;
    if ((await stored(page)).razine[ana.id].kalez.ok.length !== before) fail('a round with a wrong try counted for the level');
  } catch (e) { fail(`${which} ${width}: ${String(e).slice(0, 400)}`); }
  // 5. reload: four profiles and each album as played
  await page.goto(url + '?v=roditelji'); await ready(page); await page.reload(); await ready(page);
  const s = await stored(page);
  if (s?.profili?.length !== 4) fail(`${width}: ${s?.profili?.length} profiles after reload`);
  for (const k of KIDS) { const got = s.gotovo[k.id] ?? {}; const want = expected[k.id] ?? {}; for (const [d, m] of Object.entries(want)) if (got[d] !== m) fail(`${width}: album of ${k.ime}: ${d} is ${got[d]}, expected ${m}`); }
  res.profilesAfterReload = s?.profili?.length;
  // 6. erase everything (both versions)
  await tap(page, '[data-act="brisi-sve"]'); await tap(page, '[data-act="brisi-sve-da"]'); await ready(page);
  const after = await page.evaluate(() => (localStorage.getItem('igra.v2') ?? '') + (localStorage.getItem('igra.v1') ?? '')); if (after) fail(`${width}: data left after erasing`);
  res.erased = !after;
  await ctx.close();
}
await browser.close(); await srv.close();
// every new game and every level was played in each band
for (const dob of ['a', 'b', 'c']) for (const g of [...new Set(all.flatMap(r => r.x[dob]))] as string[]) for (let L = 1; L <= (FIXED.includes(g) ? maxLevel(BASE, dob as any, g, dob === 'b') : 1); L++) if (!res.played[`${dob} ${g}:${L}`]) fail(`never played: band ${dob} ${g} level ${L}`);
const file = 'data/verify/igra-play.json'; const prev = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
prev[which] = res; fs.writeFileSync(file, JSON.stringify(prev, null, 1) + '\n');
console.log(JSON.stringify({ ...res, played: Object.keys(res.played).length })); process.exit(res.errors.length ? 1 : 0);
