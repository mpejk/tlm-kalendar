// Quality bars: axe (no serious violations), offline use after one visit, Lighthouse performance and accessibility >= 90.
//   npx tsx scripts/verify/quality.ts [axe] [offline] [lighthouse]     -> data/verify/quality.json
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import { serve } from './serve';

const want = (s: string) => process.argv.length <= 2 || process.argv.includes(s);
const out: any = fs.existsSync('data/verify/quality.json') ? JSON.parse(fs.readFileSync('data/verify/quality.json', 'utf8')) : {};
const srv = await serve();
const browser = await chromium.launch({ args: ['--remote-debugging-port=9333'] });
try {
  if (want('axe')) {
    const res: any[] = [];
    for (const [w, hgt, scheme] of [[1280, 900, 'light'], [1280, 900, 'dark'], [390, 844, 'light'], [390, 844, 'dark']] as const) {
      const ctx = await browser.newContext({ viewport: { width: w, height: hgt }, colorScheme: scheme, serviceWorkers: 'block' }); const page = await ctx.newPage();
      for (const q of ['?d=2027-03-28', '?d=2026-12-08', '?d=2027-03-26', '?d=2026-11-01&v=mjesec', '?d=2026-01-01&v=godina', '?v=trazi&q=josip', '?v=info']) {
        await page.goto(srv.url + q); await page.waitForFunction(() => !!document.getElementById('main')?.dataset.ready);
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        for (const v of r.violations) if (v.impact === 'serious' || v.impact === 'critical') res.push({ view: q, width: w, scheme, id: v.id, impact: v.impact, nodes: v.nodes.length, example: v.nodes[0]?.html.slice(0, 160), help: v.help });
      }
      await ctx.close();
    }
    out.axe = { seriousViolations: res.length, list: res };
    console.log('axe serious/critical violations:', res.length, [...new Set(res.map(r => `${r.id} (${r.scheme} ${r.width}) ${r.example}`))].slice(0, 8).join('\n  '));
  }
  if (want('offline')) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } }); const page = await ctx.newPage();
    await page.goto(srv.url + '?d=2026-11-16'); await page.waitForFunction(() => !!document.getElementById('main')?.dataset.ready);
    // wait until the worker controls the page and has fetched the formulary files in the background
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null || navigator.serviceWorker.ready.then(() => true), null, { timeout: 30000 });
    const total = (fs.readFileSync('dist/sw.js', 'utf8').match(/"data\/f\//g) ?? []).length;
    let cached = 0; const t0 = Date.now();
    while (Date.now() - t0 < 240000) { cached = await page.evaluate(async () => { let n = 0; for (const k of await caches.keys()) n += (await (await caches.open(k)).keys()).length; return n; }); if (cached >= total + 20) break; await page.waitForTimeout(1500); }
    await ctx.setOffline(true);
    const results: any[] = [];
    for (const q of ['?d=2027-03-28', '?d=2031-06-29', '?d=2033-12-25&m=2', '?d=2036-08-15', '?d=2029-05-10&k=opci', '?d=2030-04-19', '?d=2028-02-02&v=mjesec', '?d=2034-01-01&v=godina']) {
      const errors: string[] = []; const p2 = await ctx.newPage(); p2.on('pageerror', e => errors.push(String(e)));
      let ok = false; try { await p2.goto(srv.url + q, { timeout: 15000 }); await p2.waitForFunction(() => !!document.getElementById('main')?.dataset.ready, null, { timeout: 15000 }); ok = await p2.evaluate(() => !document.querySelector('#main .empty') && (document.querySelectorAll('#main .sec, #main .cell, #main table.year tr').length > 5)); } catch (e) { errors.push(String(e).slice(0, 120)); }
      results.push({ view: q, ok, errors }); await p2.close();
    }
    await ctx.setOffline(false); await ctx.close();
    out.offline = { cachedFiles: cached, formularyFiles: total, views: results, ok: results.every(r => r.ok) };
    console.log('offline:', JSON.stringify({ cached, total, ok: out.offline.ok, failed: results.filter(r => !r.ok) }));
  }
  if (want('lighthouse')) {
    const lighthouse = (await import('lighthouse')).default;
    const runs: any[] = [];
    for (const [name, q, form] of [['day view, mobile', '?d=2027-03-28', 'mobile'], ['day view, desktop', '?d=2027-03-28', 'desktop'], ['month view, mobile', '?d=2027-03-01&v=mjesec', 'mobile']] as const) {
      const cfg: any = form === 'desktop' ? { extends: 'lighthouse:default', settings: { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } } : undefined;
      const r: any = await lighthouse(srv.url + q, { port: 9333, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices'] }, cfg);
      const c = r.lhr.categories; const failing = Object.values<any>(r.lhr.audits).filter(a => a.score !== null && a.score < 0.9 && c.accessibility.auditRefs.some((x: any) => x.id === a.id)).map(a => a.id);
      runs.push({ name, performance: Math.round(c.performance.score * 100), accessibility: Math.round(c.accessibility.score * 100), bestPractices: Math.round(c['best-practices'].score * 100), lcp: r.lhr.audits['largest-contentful-paint'].displayValue, tbt: r.lhr.audits['total-blocking-time'].displayValue, failingAccessibility: failing });
    }
    out.lighthouse = runs; console.log('lighthouse:', JSON.stringify(runs));
  }
} finally { await browser.close(); await srv.close(); }
fs.writeFileSync('data/verify/quality.json', JSON.stringify(out, null, 1));
