// The game on a narrow screen and at enlarged type: every game screen of the three age bands, the start page, the album, the
// page for parents and the sheet, at 340 px width, at 100 %, 130 % and 160 % type, light and dark, in Chromium and WebKit.
// Checks: no horizontal scrolling, nothing visible past the screen edge, every touch target at least 44 x 44 px, no script error.
//   npx tsx scripts/igra/layout.ts   -> data/verify/igra-layout.json   (exits 1 on failure)
import fs from 'node:fs'; import path from 'node:path';
import { chromium, webkit, Page } from 'playwright';
import { loadIgra, ready, setProfiles, playRound } from './play-lib';

const { BASE, all } = loadIgra(); const base = 'file://' + path.resolve('dist/igra/index.html');
const fails: string[] = []; let cases = 0; let targets = 0; let smallest = 999;
async function measure(page: Page, where: string) {
  cases++;
  const m: any = await page.evaluate(`(() => {
    const W = document.documentElement.clientWidth; const over = []; const small = []; let n = 0, min = 999;
    const hidden = e => { const s = getComputedStyle(e); return s.display === 'none' || s.visibility === 'hidden' || (s.position === 'absolute' && s.clip !== 'auto'); };
    for (const e of document.querySelectorAll('body *')) {
      if (e.closest('.vh, .skip, svg') || hidden(e)) continue; const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
      if (r.right > W + 0.5 || r.left < -0.5) over.push(e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0] + ' ' + Math.round(r.left) + '…' + Math.round(r.right));
    }
    for (const e of document.querySelectorAll('button, a[href], select, input')) {
      if (e.closest('.vh, .skip') || hidden(e) || e.disabled) continue; const t = e.closest('label.radio') || e; const r = t.getBoundingClientRect(); if (!r.width || !r.height) continue;
      n++; min = Math.min(min, r.width, r.height);
      if (r.width < 43.5 || r.height < 43.5) small.push(e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0] + ' "' + (e.textContent || '').trim().slice(0, 20) + '" ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
    return { W, doc: document.documentElement.scrollWidth, over: over.slice(0, 4), nOver: over.length, small: small.slice(0, 6), n, min };
  })()`);
  targets += m.n; smallest = Math.min(smallest, m.min);
  if (m.doc > m.W) fails.push(`${where}: document ${m.doc} px wide on a ${m.W} px screen`);
  if (m.nOver) fails.push(`${where}: past the edge: ${m.over.join('; ')}`);
  if (m.small.length) fails.push(`${where}: touch target under 44 px: ${m.small.join('; ')}`);
}
const date = '2027-03-28';   // Easter Sunday: the longest list of parts (Sequence), long names
const r = all.find(x => x.d === date)!;
for (const [name, type] of [['chromium', chromium], ['webkit', webkit]] as const) {
  const browser = await type.launch();
  for (const scheme of ['light', 'dark'] as const) for (const fs_ of [100, 130, 160]) {
    if (scheme === 'dark' && fs_ === 130) continue;
    const ctx = await browser.newContext({ viewport: { width: 340, height: 700 }, colorScheme: scheme, hasTouch: true });
    const page = await ctx.newPage(); page.on('pageerror', e => fails.push(`${name}: script error ${String(e).slice(0, 120)}`));
    const enlarge = () => page.addStyleTag({ content: `html { font-size: ${fs_}% !important; }` });
    await page.goto(base + '?danas=' + date); await ready(page);
    await setProfiles(page, [{ ime: 'Bartolomej', dob: 'a', vel: true }, { ime: 'Katarina', dob: 'b' }, { ime: 'Maksimilijan', dob: 'c' }, { ime: 'Ana', dob: 'c' }]);
    for (const [i, dob] of ['a', 'b', 'c'].entries()) {
      await page.evaluate(n => { const s = JSON.parse(localStorage.getItem('igra.v1')!); s.tko = 'p' + n; localStorage.setItem('igra.v1', JSON.stringify(s)); }, i);
      const tag = `${name} ${scheme} ${fs_}% band ${dob}`;
      await page.goto(base + `?d=${date}&danas=${date}`); await ready(page); await enlarge();
      await playRound(page, r, BASE, dob, { touch: true, wrongFirst: true, onGame: async (g, ph) => { await measure(page, `${tag} ${g} ${ph}`); } });
      await measure(page, `${tag} kraj`);
      for (const v of ['', 'v=album', 'v=roditelji', `d=${date}&ispis=1`]) { await page.goto(base + `?${v}${v ? '&' : ''}danas=${date}`); await ready(page); await enlarge(); await measure(page, `${tag} ${v || 'pocetak'}`); }
    }
    // the form for a new child and the question before erasing
    await page.goto(base + '?v=roditelji'); await ready(page); await enlarge(); await page.locator('[data-act="novi"]').tap(); await measure(page, `${name} ${scheme} ${fs_}% novi`);
    await page.locator('[data-act="brisi-sve"]').tap(); await measure(page, `${name} ${scheme} ${fs_}% brisanje`);
    await ctx.close();
  }
  await browser.close();
}
const out = { check: 'igra-layout', width: 340, type: [100, 130, 160], cases, touchTargets: targets, smallestTarget: Math.round(smallest * 10) / 10, failed: fails.length, failures: Object.entries(fails.reduce<Record<string, string[]>>((a, f) => { const i = f.indexOf(': '); (a[f.slice(i + 2)] ??= []).push(f.slice(0, i)); return a; }, {})).slice(0, 25).map(([what, where]) => `${what}  [${where.length}x, e.g. ${where[0]}]`) };
fs.writeFileSync('data/verify/igra-layout.json', JSON.stringify(out, null, 1) + '\n'); console.log(JSON.stringify(out, null, 1)); process.exit(fails.length ? 1 : 0);
