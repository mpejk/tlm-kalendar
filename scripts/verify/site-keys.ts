// Keyboard (finding W07): while a tab of the day has the focus, the arrow keys move between the tabs of that day (W3C APG
// Tabs pattern) and do not change the date; elsewhere in the day view the arrows open the previous / next day, except in form
// fields, in button groups and with modifier keys.
//   npx tsx scripts/verify/site-keys.ts         (DIST=<folder> to test another build; exits 1 on failure)
import { engines, fileBase, ready, skipped } from './site-lib';

let bad = 0; const fails: string[] = []; let checks = 0;
for (const { name, type } of await engines()) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    const state = () => page.evaluate(() => { const m = document.getElementById('main')!; const tabs = [...m.querySelectorAll('[role=tab]')] as HTMLElement[]; const a = document.activeElement as HTMLElement | null;
      return { d: (m.dataset.ready ?? '').split('|')[0], selected: tabs.findIndex(t => t.getAttribute('aria-selected') === 'true'), focused: tabs.indexOf(a as HTMLElement), tabindex: tabs.map(t => t.getAttribute('tabindex')).join(','), panel: m.querySelector('[role=tabpanel]')?.getAttribute('aria-labelledby') ?? '', controls: tabs.map(t => t.getAttribute('aria-controls')).join(','), label: tabs.map(t => t.textContent).join('|'), sections: m.querySelectorAll('.sec').length, first: m.querySelector('.sec h2')?.textContent ?? '' }; });
    const expect = async (what: string, test: (s: Awaited<ReturnType<typeof state>>) => boolean) => { await page.waitForTimeout(250); const s = await state(); checks++; if (!test(s)) { bad++; fails.push(`${name}: ${what} — ${JSON.stringify(s).slice(0, 260)}`); } };
    const open = async (q: string) => { await page.goto(fileBase() + q); await ready(page); };

    // Palm Sunday 2026: three tabs (blessing of palms, Mass, Mass with the shorter Passion); opened on the tab "Misa"
    await open('?d=2026-03-29&m=1');
    await expect('tabs follow the APG pattern (roving tabindex, panel wiring)', s => s.selected === 1 && s.tabindex === '-1,0,-1' && s.panel === 'tab-1' && s.controls === 'panel,panel,panel');
    await page.focus('#main [role=tab][aria-selected=true]');
    await page.keyboard.press('ArrowRight');
    await expect('Right arrow on the tab "Misa": next tab of the same day, focus on it', s => s.d === '2026-03-29' && s.selected === 2 && s.focused === 2);
    await page.keyboard.press('ArrowRight');
    await expect('Right arrow on the last tab wraps to the first', s => s.d === '2026-03-29' && s.selected === 0 && s.focused === 0 && s.sections > 0);
    await page.keyboard.press('ArrowLeft');
    await expect('Left arrow on the first tab wraps to the last', s => s.d === '2026-03-29' && s.selected === 2 && s.focused === 2);
    await page.keyboard.press('Home');
    await expect('Home: first tab', s => s.d === '2026-03-29' && s.selected === 0 && s.focused === 0);
    await page.keyboard.press('End');
    await expect('End: last tab', s => s.d === '2026-03-29' && s.selected === 2 && s.focused === 2 && s.tabindex === '-1,-1,0');
    await page.keyboard.press('Shift+ArrowRight');
    await expect('Shift+arrow does nothing', s => s.d === '2026-03-29' && s.selected === 2);
    // outside the tabs: the date shortcut
    await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); });
    await page.keyboard.press('ArrowRight');
    await expect('Right arrow with no control focused: next day', s => s.d === '2026-03-30');
    await page.keyboard.press('ArrowLeft');
    await expect('Left arrow: previous day, on its default tab', s => s.d === '2026-03-29' && s.selected === 0);
    await page.focus('#date'); await page.keyboard.press('ArrowRight');
    await expect('arrow inside the date field does not change the day', s => s.d === '2026-03-29');
    await page.focus('[data-act="bigger"]'); await page.keyboard.press('ArrowRight');
    await expect('arrow on a button of a group does not change the day', s => s.d === '2026-03-29');
    await page.focus('[data-act="today"]'); await page.keyboard.press('Shift+ArrowRight'); await page.keyboard.press('Alt+ArrowRight');
    await expect('arrows with Shift or Alt do not change the day', s => s.d === '2026-03-29');
    // clicking the first tab of a day whose first tab is a rite before the Mass (Candlemas)
    await open('?d=2027-02-02');
    await expect('Candlemas opens on the Mass', s => s.selected === 1);
    await page.click('#main [role=tab] >> nth=0');
    await expect('click on the first tab opens the blessing of candles and keeps the focus on the tab', s => s.d === '2027-02-02' && s.selected === 0 && s.focused === 0 && s.sections > 0);
    await page.keyboard.press('ArrowRight');
    await expect('and the arrow leads back to the Mass', s => s.d === '2027-02-02' && s.selected === 1 && s.focused === 1);
    await page.close();
  } finally { await browser.close(); }
}
console.log(JSON.stringify({ check: 'site-keys', checks, failed: bad, failures: fails, enginesSkipped: skipped }, null, 1));
process.exit(bad ? 1 : 0);
