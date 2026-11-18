// Quality bars of the game: axe (no serious violations) on every screen of the three age bands in both themes, no request to any
// other site, use offline after one visit, opening from file://, Lighthouse (mobile) performance and accessibility >= 90 on the
// start page.     npx tsx scripts/igra/quality.ts [axe] [offline] [file] [lighthouse]   -> data/verify/igra-quality.json
import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { serve } from '../verify/serve';
import { loadIgra, ready, setProfiles, playRound } from './play-lib';

const want = (s: string) => process.argv.length <= 2 || process.argv.includes(s);
const file = 'data/verify/igra-quality.json'; const out: any = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const { BASE, all } = loadIgra(); const srv = await serve(); const url = srv.url + 'igra/'; const date = '2027-03-28'; const r = all.find(x => x.d === date)!;
const KIDS = [{ ime: 'Josip', dob: 'a', vel: true }, { ime: 'Marija', dob: 'b' }, { ime: 'Ivan', dob: 'c' }];
const browser = await chromium.launch({ args: ['--remote-debugging-port=9334'] }); let failed = false;
try {
  if (want('axe')) {
    const res: any[] = []; let screens = 0; const foreign = new Set<string>();
    for (const scheme of ['light', 'dark'] as const) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme, hasTouch: true, serviceWorkers: 'block' }); const page = await ctx.newPage();
      page.on('request', q => { if (!q.url().startsWith(srv.url) && !q.url().startsWith('data:')) foreign.add(q.url()); });
      const axe = async (view: string) => { screens++; const a = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze(); for (const v of a.violations) if (v.impact === 'serious' || v.impact === 'critical') res.push({ view, scheme, id: v.id, impact: v.impact, nodes: v.nodes.length, example: v.nodes[0]?.html.slice(0, 160), help: v.help }); };
      await page.goto(url); await ready(page); await axe('first visit (form)');
      await setProfiles(page, KIDS);
      for (const [i, k] of KIDS.entries()) {
        await page.evaluate(n => { const s = JSON.parse(localStorage.getItem('igra.v1')!); s.tko = 'p' + n; localStorage.setItem('igra.v1', JSON.stringify(s)); }, i);
        await page.goto(url + `?d=${date}&danas=${date}`); await ready(page);
        await playRound(page, r, BASE, k.dob, { touch: true, wrongFirst: true, onGame: async (g, ph) => { await axe(`${k.dob} ${g} ${ph}`); } });
        await axe(`${k.dob} kraj`);
        for (const v of ['', 'v=album', 'v=roditelji', `d=${date}&ispis=1`]) { await page.goto(url + `?${v}${v ? '&' : ''}danas=${date}`); await ready(page); await axe(`${k.dob} ${v || 'pocetak'}`); }
      }
      await page.locator('[data-act="brisi-sve"]').scrollIntoViewIfNeeded().catch(() => {}); await page.goto(url + '?v=roditelji'); await ready(page); await page.locator('[data-act="novi"]').tap(); await page.locator('[data-act="brisi-sve"]').tap(); await axe('roditelji: form and erase question');
      await ctx.close();
    }
    out.axe = { screens, seriousViolations: res.length, list: res.slice(0, 30), requestsToOtherSites: [...foreign] };
    console.log('axe:', screens, 'screens; serious/critical:', res.length, [...new Set(res.map(x => `${x.id} (${x.scheme}, ${x.view}) ${x.example}`))].slice(0, 10).join('\n  ')); console.log('requests to other sites:', foreign.size);
    if (res.length || foreign.size) failed = true;
  }
  if (want('offline')) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); const page = await ctx.newPage();
    await page.goto(url + '?danas=' + date); await ready(page);
    await page.evaluate(() => navigator.serviceWorker.ready); const total = (fs.readFileSync('dist/igra/sw.js', 'utf8').match(/"data\/r\//g) ?? []).length;
    let cached = 0; const t0 = Date.now(); while (Date.now() - t0 < 60000) { cached = await page.evaluate(async () => { let n = 0; for (const k of await caches.keys()) if (k.startsWith('igra-')) n += (await (await caches.open(k)).keys()).length; return n; }); if (cached >= total + 6) break; await page.waitForTimeout(500); }
    await setProfiles(page, KIDS, 2); await ctx.setOffline(true); const results: any[] = [];
    for (const q of ['', `?d=${date}&danas=${date}`, '?d=2031-07-13', '?d=2036-12-25', '?v=album&g=2030', '?v=roditelji', '?d=2029-06-29&ispis=1']) {
      const errors: string[] = []; const p2 = await ctx.newPage(); p2.on('pageerror', e => errors.push(String(e))); let ok = false;
      try { await p2.goto(url + q, { timeout: 15000 }); await ready(p2); ok = await p2.evaluate(() => !document.querySelector('#main .empty') && document.querySelectorAll('#main h1').length > 0 && !/nema izazova/.test(document.getElementById('main')!.textContent ?? '')); if (ok && q.includes('danas')) { await playRound(p2, r, BASE, 'c', { touch: true }); } } catch (e) { errors.push(String(e).slice(0, 200)); ok = false; }
      results.push({ view: q || '(start)', ok, errors }); await p2.close();
    }
    await ctx.setOffline(false); await ctx.close();
    out.offline = { cachedFiles: cached, views: results, ok: results.every(x => x.ok) }; console.log('offline:', JSON.stringify(out.offline)); if (!out.offline.ok) failed = true;
  }
  if (want('file')) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); const page = await ctx.newPage(); const errors: string[] = []; page.on('pageerror', e => errors.push(String(e))); const net = new Set<string>(); page.on('request', q => { if (!/^(file|data):/.test(q.url())) net.add(q.url()); });
    const base = 'file://' + path.resolve('dist/igra/index.html');
    await page.goto(base + '?danas=' + date); await ready(page); await setProfiles(page, KIDS, 2); await page.goto(base + `?d=${date}&danas=${date}`); await ready(page);
    let ok = true; try { await playRound(page, r, BASE, 'c', { touch: true }); await page.reload(); await ready(page); await page.goto(base + '?v=album&danas=' + date); await ready(page); ok = (await page.locator('.polje.ima').count()) === 1; } catch (e) { errors.push(String(e).slice(0, 200)); ok = false; }
    // the calendar's button leads here and the game's link leads back, from disk too
    const cal = await ctx.newPage(); await cal.goto('file://' + path.resolve('dist/index.html')); await cal.waitForFunction(() => !!document.getElementById('main')?.dataset.ready); await cal.locator('a.igra').click(); await ready(cal); const there = cal.url().includes('/igra/index.html'); await cal.locator('.views a.kal').click(); await cal.waitForFunction(() => !location.pathname.includes('/igra/') && !!document.getElementById('main')?.dataset.ready); const back = !cal.url().includes('/igra/');
    out.file = { ok: ok && !errors.length && !net.size && there && back, roundPlayedAndKept: ok, buttonLeadsToGame: there, linkLeadsBack: back, networkRequests: [...net], errors }; console.log('file://:', JSON.stringify(out.file)); if (!out.file.ok) failed = true; await ctx.close();
  }
  if (want('lighthouse')) {
    const lighthouse = (await import('lighthouse')).default; const runs: any[] = [];
    for (const [name, q] of [['start page, mobile', ''], ['a round, mobile', `?d=${date}`]] as const) {
      const x: any = await lighthouse(url + q, { port: 9334, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices'] });
      const c = x.lhr.categories; const failing = Object.values<any>(x.lhr.audits).filter(a => a.score !== null && a.score < 0.9 && c.accessibility.auditRefs.some((y: any) => y.id === a.id)).map(a => a.id);
      runs.push({ name, performance: Math.round(c.performance.score * 100), accessibility: Math.round(c.accessibility.score * 100), bestPractices: Math.round(c['best-practices'].score * 100), lcp: x.lhr.audits['largest-contentful-paint'].displayValue, tbt: x.lhr.audits['total-blocking-time'].displayValue, failingAccessibility: failing });
    }
    out.lighthouse = runs; console.log('lighthouse:', JSON.stringify(runs)); if (runs.some(x => x.performance < 90 || x.accessibility < 90)) failed = true;
  }
} finally { await browser.close(); await srv.close(); }
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n'); process.exit(failed ? 1 : 0);
