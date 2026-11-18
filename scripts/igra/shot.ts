// Quick look while building: npx tsx scripts/igra/shot.ts <date> <band a|b|c> <width> [dark] -> .cache/igra-shots/
import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';
import { loadIgra, ready, setProfiles, playRound } from './play-lib';
const [date = '2026-11-29', dob = 'c', width = '390', theme = 'light'] = process.argv.slice(2);
const { BASE, all } = loadIgra(); const r = all.find(x => x.d === date)!;
const out = '.cache/igra-shots'; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: +width, height: 780 }, hasTouch: true, isMobile: +width < 700, colorScheme: theme as any, deviceScaleFactor: 1 });
const page = await ctx.newPage(); page.on('pageerror', e => console.log('PAGE ERROR', e.message)); page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
const base = 'file://' + path.resolve('dist/igra/index.html');
await page.goto(base + '?danas=' + date); await ready(page); await setProfiles(page, [{ ime: 'Ana', dob, vel: dob === 'a' }, { ime: 'Luka', dob: 'b' }]);
await page.goto(base + '?danas=' + date); await ready(page); const tag = `${date}-${dob}-${width}-${theme}`;
await page.screenshot({ path: `${out}/${tag}-0-pocetak.png`, fullPage: true });
await page.goto(base + `?d=${date}&danas=${date}`); await ready(page);
let n = 1; await playRound(page, r, BASE, dob, { wrongFirst: true, drag: true, onGame: async (g, ph) => { await page.screenshot({ path: `${out}/${tag}-${n++}-${g}-${ph}.png`, fullPage: true }); } });
await page.screenshot({ path: `${out}/${tag}-${n++}-kraj.png`, fullPage: true });
for (const v of ['v=album', 'v=roditelji', `d=${date}&ispis=1`]) { await page.goto(base + `?${v}&danas=${date}`); await ready(page); await page.screenshot({ path: `${out}/${tag}-${n++}-${v.replace(/[^a-z]/g, '').slice(0, 9)}.png`, fullPage: true }); }
await b.close(); console.log(fs.readdirSync(out).filter(f => f.startsWith(tag)).join('\n'));
