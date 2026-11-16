// Narrow screen and large type (findings W04, W05 and the cross-browser run): the day, month, year, search and information
// views at 340 px width, at 100 %, 130 % and 160 % type, light and dark, in every engine available.
// Checks: the document is not wider than the screen, nothing visible reaches past the screen edge, no script error.
// Screenshots (first screen of each view) go to .cache/site-shots/ for a look by eye.
//   npx tsx scripts/verify/site-layout.ts       (DIST=<folder> to test another build; SHOTS=0 without pictures; exits 1 on failure)
import fs from 'node:fs';
import { engines, fileBase, ready, skipped } from './site-lib';

const WIDTH = 340;
const VIEWS: [string, string][] = [
  ['dan', '?d=2027-03-28'], ['dan-tabovi', '?d=2026-03-29&m=1'], ['dan-spomeni', '?d=2033-07-16'], ['dan-obred', '?d=2027-03-27'], ['dan-mjesni', '?d=2026-05-04'],
  ['mjesec', '?d=2027-03-01&v=mjesec'], ['godina', '?d=2027-01-01&v=godina'], ['trazi', '?v=trazi&q=marij'], ['trazi-prazno', '?v=trazi'], ['info', '?v=info'],
];
const shots = process.env.SHOTS !== '0'; const outDir = '.cache/site-shots'; if (shots) fs.mkdirSync(outDir, { recursive: true });
let bad = 0; const fails: string[] = []; let cases = 0; const widest: Record<string, number> = {};
for (const { name, type } of await engines()) {
  const browser = await type.launch();
  try {
    for (const scheme of ['light', 'dark'] as const) for (const fs_ of [100, 130, 160]) for (const lang of ['oba', 'la']) {
      if (lang === 'la' && !(scheme === 'light' && fs_ === 160)) continue;      // the one-language layout once, at the largest type
      const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 700 }, colorScheme: scheme });
      await ctx.addInitScript(([f, l]) => { try { localStorage.setItem('tlm.fs', String(f)); localStorage.setItem('tlm.lang', String(l)); } catch { /* */ } }, [fs_, lang]);
      await ctx.addInitScript('window.__name = function (f) { return f; }');   // helper that the TypeScript runner injects into evaluated functions
      const page = await ctx.newPage(); const errors: string[] = [];
      page.on('pageerror', e => errors.push(String(e).slice(0, 120))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
      for (const [view, q] of VIEWS) {
        cases++; const where = `${name} ${view} ${fs_}% ${scheme}${lang === 'la' ? ' (samo latinski)' : ''}`;
        await page.goto(fileBase() + q);
        try { await ready(page); } catch { bad++; fails.push(`${where}: did not render`); continue; }
        await page.evaluate(() => (document as any).fonts.ready); await page.waitForTimeout(80);
        const m = await page.evaluate(() => {
          const W = document.documentElement.clientWidth; const out: string[] = [];
          const hidden = (e: Element) => { const s = getComputedStyle(e); return s.display === 'none' || s.visibility === 'hidden' || s.position === 'absolute' && s.clip !== 'auto'; };
          for (const e of document.querySelectorAll('body *')) {
            if ((e as HTMLElement).closest('.vh, .skip, thead') || hidden(e)) continue;
            const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
            if (r.right > W + 0.5 || r.left < -0.5) out.push(`${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''} ${Math.round(r.left * 10) / 10}…${Math.round(r.right * 10) / 10}`);
          }
          const q = document.querySelector('.search input') as HTMLElement | null;
          return { W, doc: document.documentElement.scrollWidth, body: document.body.scrollWidth, over: out.slice(0, 4), nOver: out.length, search: q ? Math.round(q.getBoundingClientRect().width * 10) / 10 : null, fs: getComputedStyle(document.documentElement).fontSize };
        });
        widest[`${view} ${fs_}%`] = Math.max(widest[`${view} ${fs_}%`] ?? 0, m.doc);
        const problems: string[] = [];
        if (m.doc > m.W) problems.push(`document ${m.doc} px wide on a ${m.W} px screen`);
        if (m.nOver) problems.push(`${m.nOver} element(s) past the edge: ${m.over.join('; ')}`);
        if (m.search !== null && m.search > m.W - 16) problems.push(`search field ${m.search} px`);
        if (errors.length) problems.push('script error: ' + errors.splice(0).join(' | '));
        if (problems.length) { bad++; fails.push(`${where}: ${problems.join('; ')}`); }
        if (shots) await page.evaluate(() => document.getElementById('main')!.scrollIntoView());     // the picture starts at the content, below the header
        if (shots) await page.screenshot({ path: `${outDir}/${name}-${view}-${fs_}-${scheme}-${lang}.png` });
      }
      await ctx.close();
    }
  } finally { await browser.close(); }
}
console.log(JSON.stringify({ check: 'site-layout', width: WIDTH, cases, failed: bad, widestDocument: widest, failures: fails.slice(0, 40), enginesSkipped: skipped }, null, 1));
process.exit(bad ? 1 : 0);
