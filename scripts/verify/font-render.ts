// Rendering check for finding W06 (u drawn as v in Latin text on the iPhone), in Playwright WebKit with an iPhone profile.
// The letter u is drawn with the site's own fonts in text marked lang="la" — upright, italic and bold, and with the font's
// language rules left ON (font-feature-settings: normal, which is what iOS Safari in effect did) — and the picture is compared
// with the same letter in text marked lang="en" (must be identical) and with the letter v (must differ).
// Two visits:  (1) a first visit to the new build;
//              (2) a return visit: the browser first visits the build of revision 25a6b7a (taken from git), so that its offline
//                  cache holds the old page and the old fonts; then the server switches to the new build and the same address is
//                  opened again. The new offline worker must replace the old cache and reload the page by itself.
// It also reports, for information, whether the OLD build shows the fault in this WebKit (desktop WebKit honours the CSS switch
// that iOS ignored, so the fault shows only with the font rules left on).
//   npx tsx scripts/verify/font-render.ts       (exits 1 on failure; pictures in .cache/site-shots/w06-*.png)
import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
import { webkit, devices, Page } from 'playwright';
import { serveSwitchable, distDir } from './site-lib';

const OLD_REV = '25a6b7a'; const oldDir = path.resolve('.cache/dist-' + OLD_REV);
const outDir = '.cache/site-shots'; fs.mkdirSync(outDir, { recursive: true });
let haveOld = fs.existsSync(path.join(oldDir, 'dist/index.html'));
if (!haveOld) { try { fs.mkdirSync(oldDir, { recursive: true }); execSync(`git archive ${OLD_REV} dist | tar -x -C "${oldDir}"`, { stdio: 'pipe' }); haveOld = fs.existsSync(path.join(oldDir, 'dist/index.html')); } catch { haveOld = false; } }

const STYLES: [string, string][] = [['upright', 'font-weight:400;font-style:normal'], ['italic', 'font-weight:400;font-style:italic'], ['bold', 'font-weight:600;font-style:normal']];
const WORDS = 'justítiam, Deus, tuus, meum, verbum';

/** Draws one sample in a fixed box with the page's fonts and returns the picture. */
async function draw(page: Page, text: string, lang: string, style: string, features: string): Promise<Buffer> {
  await page.evaluate(([t, l, s, f]) => {
    let box = document.getElementById('w06') as HTMLElement | null;
    if (!box) { box = document.createElement('div'); box.id = 'w06'; document.body.appendChild(box); }
    box.setAttribute('style', `position:fixed;left:0;top:0;z-index:99999;background:#fff;color:#000;width:330px;height:70px;padding:6px 8px;overflow:hidden;white-space:nowrap;font-family:"EB Garamond";font-size:44px;line-height:58px;${s};font-feature-settings:${f}`);
    box.setAttribute('lang', l); box.textContent = t;
  }, [text, lang, style, features]);
  for (const [, s] of STYLES) await page.evaluate(([s2]) => (document as any).fonts.load(`${/italic/.test(s2) ? 'italic ' : ''}${/600/.test(s2) ? '600' : '400'} 44px "EB Garamond"`, 'uvU'), [s]);
  await page.evaluate(() => (document as any).fonts.ready);
  return page.locator('#w06').screenshot();
}
/** u in Latin text against u in English text and against v, for the three cuts. `features` = the CSS value on the sample. */
async function measure(page: Page, features: string, tag: string) {
  const out: Record<string, { uSameAsEnglish: boolean; uDiffersFromV: boolean; capitalSame: boolean }> = {};
  for (const [name, style] of STYLES) {
    const uLa = await draw(page, 'u', 'la', style, features), uEn = await draw(page, 'u', 'en', style, features), vLa = await draw(page, 'v', 'en', style, features);
    const ULa = await draw(page, 'U', 'la', style, features), UEn = await draw(page, 'U', 'en', style, features);
    out[name] = { uSameAsEnglish: uLa.equals(uEn), uDiffersFromV: !uLa.equals(vLa), capitalSame: ULa.equals(UEn) };
    fs.writeFileSync(`${outDir}/w06-${tag}-${name}.png`, await draw(page, WORDS, 'la', style, features));
  }
  return out;
}
const allGood = (m: Awaited<ReturnType<typeof measure>>) => Object.values(m).every(x => x.uSameAsEnglish && x.uDiffersFromV && x.capitalSame);
const fontFiles = (page: Page) => page.evaluate(() => [...new Set(performance.getEntriesByType('resource').map(e => e.name).filter(n => /\/fonts\//.test(n)).map(n => n.split('/').pop()!))].sort());
const ready = (page: Page) => page.waitForFunction(() => !!document.getElementById('main')?.dataset.ready, null, { timeout: 15000 });

const problems: string[] = []; const report: any = {};
const server = await serveSwitchable(distDir());
const browser = await webkit.launch();
try {
  const q = '?d=2027-03-28';
  // ---- (1) first visit to the new build
  {
    const ctx = await browser.newContext({ ...devices['iPhone 14'] }); const page = await ctx.newPage();
    await page.goto(server.url + q); await ready(page);
    const m = await measure(page, 'normal', 'first-visit'); const files = await fontFiles(page);
    report.firstVisit = { device: 'iPhone 14 (WebKit ' + browser.version() + ')', fontFiles: files, fontRulesOn: m };
    if (!allGood(m)) problems.push('first visit: u in Latin text is not drawn as u');
    if (files.some(f => /^eb-garamond-|EBGaramond/.test(f)) || !files.some(f => /^ebg-latin-400-normal/.test(f))) problems.push('first visit: wrong font files ' + files.join(','));
    // the Latin of the Mass itself: marked lang="la" and drawn with u
    const la = await page.evaluate(() => { const e = document.querySelector('.sec .la .tx'); return e ? { lang: e.closest('[lang]')?.getAttribute('lang'), family: getComputedStyle(e).fontFamily } : null; });
    report.firstVisit.massText = la; if (la?.lang !== 'la') problems.push('the Latin text is not marked lang="la"');
    await page.evaluate(() => document.getElementById('w06')?.remove()); await page.locator('.sec-Introitus').first().screenshot({ path: `${outDir}/w06-first-visit-introit.png` });
    await ctx.close();
  }
  // ---- (2) return visit with the old cache
  if (!haveOld) { report.returnVisit = 'SKIPPED: the old build could not be taken from git (revision ' + OLD_REV + ')'; console.log('RETURN VISIT SKIPPED — git revision ' + OLD_REV + ' not available'); }
  else {
    server.use(path.join(oldDir, 'dist'));
    const ctx = await browser.newContext({ ...devices['iPhone 14'] }); const page = await ctx.newPage();
    await page.goto(server.url + q); await ready(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 }).catch(() => {});
    await page.reload(); await ready(page);      // second load of the old site: now served from its offline cache
    const oldFiles = await fontFiles(page);
    const oldCss = await measure(page, '"locl" 0', 'old-build-css-switch'), oldPlain = await measure(page, 'normal', 'old-build');
    report.oldBuild = { fontFiles: oldFiles, controlledByOfflineWorker: await page.evaluate(() => !!navigator.serviceWorker.controller), cachesBefore: await page.evaluate(() => caches.keys()),
      faultShowsWithTheSiteCssSwitch: !allGood(oldCss), faultShowsWithFontRulesOn: !allGood(oldPlain), fontRulesOn: oldPlain };
    // the site is updated; the visitor comes back
    server.use(distDir());
    await page.goto(server.url + q);
    const t0 = Date.now(); let switched = false; let files: string[] = [];
    while (Date.now() - t0 < 30000) {
      try { await ready(page); files = await fontFiles(page); const css = await page.evaluate(() => [...document.styleSheets].some(s => { try { return [...s.cssRules].some(r => /ebg-latin/.test(r.cssText)); } catch { return false; } }));
        if (css && files.some(f => /^ebg-latin/.test(f)) && !files.some(f => /^eb-garamond-/.test(f))) { switched = true; break; } } catch { /* the page is being reloaded by the new worker */ }
      await page.waitForTimeout(400);
    }
    const seconds = Math.round((Date.now() - t0) / 100) / 10;
    if (!switched) problems.push('return visit: the page still uses the old fonts after 30 s (' + files.join(',') + ')');
    else {
      const m = await measure(page, 'normal', 'return-visit');
      report.returnVisit = { reloadedByItselfAfterSeconds: seconds, fontFiles: await fontFiles(page), cachesAfter: await page.evaluate(() => caches.keys()), fontRulesOn: m };
      if (!allGood(m)) problems.push('return visit: u in Latin text is not drawn as u');
      const keys: string[] = report.returnVisit.cachesAfter; if (keys.length !== 1 || report.oldBuild.cachesBefore.includes(keys[0])) problems.push('return visit: the old offline cache was not replaced (' + keys.join(',') + ')');
      // and once more, as the next visit would be
      await page.reload(); await ready(page); const again = await fontFiles(page); if (again.some(f => /^eb-garamond-|EBGaramond/.test(f))) problems.push('return visit: old font files requested again');
    }
    await ctx.close();
  }
} finally { await browser.close(); await server.close(); }
console.log(JSON.stringify({ check: 'font-render', ...report, failed: problems.length, problems }, null, 1));
process.exit(problems.length ? 1 : 0);
