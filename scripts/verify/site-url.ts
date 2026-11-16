// Links with odd parameters (finding W01): every one must render a view, never stay on "Učitavanje…".
//   npx tsx scripts/verify/site-url.ts          (DIST=<folder> to test another build; exits 1 on failure)
import { engines, fileBase, ready, skipped } from './site-lib';

// [query, what must be shown]
const CASES: [string, (s: any) => string | null][] = [
  ['?d=2027-04-25&m=0.5', s => (s.h1 && s.tabs === 2 && s.selected === 0 && s.sections > 5 ? null : 'expected the day with its first Mass')],
  ['?d=2027-04-25&m=1', s => (s.selected === 1 && s.sections > 5 ? null : 'expected the second Mass (Rogation Mass)')],
  ['?d=2027-04-25&m=-1', s => (s.selected === 0 && s.sections > 5 ? null : 'expected the default Mass')],
  ['?d=2027-04-25&m=99', s => (s.selected === 0 && s.sections > 5 ? null : 'expected the default Mass')],
  ['?d=2027-04-25&m=abc', s => (s.selected === 0 && s.sections > 5 ? null : 'expected the default Mass')],
  ['?d=2027-04-25&m=', s => (s.selected === 0 && s.sections > 5 ? null : 'expected the default Mass')],
  ['?d=2027-04-25&m=1e0', s => (s.selected === 0 && s.sections > 5 ? null : 'expected the default Mass')],
  ['?d=2027-04-25&m=01', s => (s.selected === 1 ? null : 'expected the second Mass')],
  ['?d=2027-02-02', s => (s.tabs === 2 && s.selected === 1 && s.sections > 5 ? null : 'Candlemas opens on the Mass')],
  ['?d=2027-02-02&m=0', s => (s.tabs === 2 && s.selected === 0 && s.sections > 0 ? null : 'Candlemas, m=0 opens the blessing of candles')],
  ['?d=2027-03-28&m=3', s => (s.h1 && s.sections > 5 ? null : 'a day with one Mass ignores m')],
  ['?d=2027-02-30', s => (s.h1 && s.sections > 5 ? null : 'a date that does not exist opens today')],
  ['?d=2027-13-01', s => (s.h1 && s.sections > 5 ? null : 'a date that does not exist opens today')],
  ['?d=abc', s => (s.h1 && s.sections > 5 ? null : 'opens today')],
  ['?d=1999-01-01', s => (/Kalendar obuhvaća godine/.test(s.text) ? null : 'outside the published years: the notice')],
  ['?d=2040-06-01&v=mjesec', s => (!s.failed ? null : 'month outside the range')],
  ['?d=2040-06-01&v=godina', s => (/Kalendar obuhvaća godine/.test(s.text) ? null : 'year outside the range: the notice')],
  ['?d=2027-04-25&v=xyz', s => (s.h1 && s.sections > 5 ? null : 'unknown view: the day')],
  ['?d=2027-04-25&k=xyz', s => (s.h1 && s.sections > 5 ? null : 'unknown calendar: Zagreb')],
  ['?d=2027-04-25&k=opci&m=0.5', s => (s.h1 && s.sections > 5 ? null : 'general calendar')],
  ['?v=trazi&q=%E0%A4%A', s => (!s.failed ? null : 'search with a damaged query')],
  ['#d=2027-04-25&m=0.5', s => (s.h1 && s.sections > 5 ? null : 'hash form')],
];
let bad = 0; const fails: string[] = [];
for (const { name, type } of await engines()) {
  const browser = await type.launch();
  try {
    for (const [q, check] of CASES) {
      const page = await browser.newPage({ viewport: { width: 1000, height: 800 } }); const errors: string[] = [];
      page.on('pageerror', e => errors.push(String(e).slice(0, 120)));
      await page.goto(fileBase() + q);
      let problem: string | null = null;
      try { await ready(page, 6000); } catch { problem = 'stays on "Učitavanje…"'; }
      if (!problem) {
        const s = await page.evaluate(() => { const m = document.getElementById('main')!; const tabs = [...m.querySelectorAll('[role=tab]')]; return { h1: !!m.querySelector('h1'), tabs: tabs.length, selected: tabs.length ? tabs.findIndex(t => t.getAttribute('aria-selected') === 'true') : 0, sections: m.querySelectorAll('.sec').length, text: m.textContent ?? '', failed: !!m.dataset.failed }; });
        problem = s.failed ? 'the view failed' : check(s);
      }
      if (errors.length) problem = (problem ? problem + '; ' : '') + 'script error: ' + errors[0];
      if (problem) { bad++; fails.push(`${name} ${q}: ${problem}`); }
      await page.close();
    }
  } finally { await browser.close(); }
}
console.log(JSON.stringify({ check: 'site-url', cases: CASES.length, failed: bad, failures: fails, enginesSkipped: skipped }, null, 1));
process.exit(bad ? 1 : 0);
