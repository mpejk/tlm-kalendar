// Shared by the game's browser checks: the round data as the browser gets them, a profile in localStorage, and a player that
// plays every game of a round to the end by touch (tap), with one wrong try first in each game, as a child would.
import fs from 'node:fs'; import path from 'node:path';
import type { Page } from 'playwright';
import { expand, igra } from '../../src/igra/pitanja';

export function loadIgra(dist = 'dist') {
  let BASE: any; const R: Record<number, any[]> = {};
  const IGRA = { base: (b: any) => { BASE = b; }, r: (y: number, rs: any[]) => { R[y] = rs; } };
  const run = (f: string) => new Function('IGRA', fs.readFileSync(f, 'utf8'))(IGRA);
  run(path.join(dist, 'igra/data/base.js')); for (const f of fs.readdirSync(path.join(dist, 'igra/data/r'))) run(path.join(dist, 'igra/data/r', f));
  const all = Object.keys(R).map(Number).sort().flatMap(y => R[y]).map(r => expand(r, BASE));
  return { BASE, R, all };
}
export const ready = (page: Page) => page.waitForFunction(() => !!document.getElementById('main')?.dataset.ready, null, { timeout: 10000 });
export async function setProfiles(page: Page, profs: { ime: string; dob: string; vel?: boolean }[], cur = 0, razine: Record<string, Record<string, { l: number; ok: string[] }>> = {}) {
  await page.evaluate(([ps, c, rz]) => { const profili = (ps as any[]).map((p, i) => ({ id: 'p' + i, ...p })); const old = JSON.parse(localStorage.getItem('igra.v2') ?? '{}'); localStorage.setItem('igra.v2', JSON.stringify({ v: 2, profili, tko: 'p' + c, gotovo: old.gotovo ?? {}, razine: { ...(old.razine ?? {}), ...(rz as any) } })); }, [profs, cur, razine] as any);
}
const tap = async (page: Page, sel: string, touch: boolean) => { const el = page.locator(sel).first(); await el.scrollIntoViewIfNeeded(); if (touch) await el.tap(); else await el.click(); };
const title = (page: Page) => page.locator('#naslov').innerText();
/** Plays the round that is open on the page, every game by its steps from pitanja.ts (the level is read from the page).
 *  `onGame(name, phase)` is called at the start, in the middle and at the end of each game (for screenshots). Returns the names and levels played. */
export async function playRound(page: Page, r: any, BASE: any, dob: string, opt: { touch?: boolean; wrongFirst?: boolean; drag?: boolean; realTouch?: boolean; onGame?: (g: string, phase: 'start' | 'mid' | 'end', level: number) => Promise<void> } = {}): Promise<string[]> {
  const touch = opt.touch ?? true; const games: string[] = r.x[dob]; const played: string[] = [];
  const act = (a: string, v: string) => tap(page, `#main [data-act="${a}"][data-v="${v.replace(/"/g, '\\"')}"]`, touch);
  const next = async () => { await page.locator('[data-act="dalje"]').waitFor({ timeout: 5000 }); await tap(page, '[data-act="dalje"]', touch); };
  for (const g of games) {
    await page.locator(`.igra-${g}`).waitFor({ timeout: 5000 });
    const level = +((await page.locator(`.igra-${g}`).getAttribute('data-razina')) || 1); await opt.onGame?.(g, 'start', level);
    if (g === 'rijeci') {
      const n = await page.locator('.karta').count(); const seen: { k: string; la: boolean }[] = [];
      const pairOf = (label: string) => { const m = /: (.*?)( \(latinski\))?$/.exec(label)!; const la = !!m[2]; const k = la ? m[1] : Object.keys(BASE.rijeci).find(x => r.w.some((w: any) => w[0] === x) && BASE.rijeci[x].hr.toLowerCase() === m[1].toLowerCase())!; return { k, la }; };
      for (let i = 0; i < n; i++) { const c = page.locator('.karta').nth(i); if (await c.isDisabled()) { seen[i] = { k: '', la: false }; continue; } await c.scrollIntoViewIfNeeded(); if (touch) await c.tap(); else await c.click(); seen[i] = pairOf((await page.locator('.karta').nth(i).getAttribute('aria-label'))!); if (i === 5) await opt.onGame?.(g, 'mid', level); }
      for (let i = 0; i < n; i++) { if (await page.locator('.karta').nth(i).isDisabled()) continue; const j = seen.findIndex((s, x) => x !== i && s.k === seen[i].k && s.la !== seen[i].la); if (j < 0) throw new Error('memory: no partner for card ' + i); for (const x of [i, j]) { const c = page.locator('.karta').nth(x); await c.scrollIntoViewIfNeeded(); if (touch) await c.tap(); else await c.click(); } }
    } else {
      const steps = igra(BASE, r, dob as any, g, level).koraci;
      for (const [si, k] of steps.entries()) {
        if (steps.length > 1) await page.waitForFunction(n => document.querySelector('.korak2')?.textContent?.includes(`Pitanje ${n} `), si + 1, { timeout: 5000 });
        if (k.t === 'izbor') {
          if (opt.wrongFirst && si === 0) { const w = k.izbori.find(x => x.v !== k.tocno)!; await act('izbor', w.v); if (!(await page.locator('.poruka.ima').count())) throw new Error(`${g}: no gentle correction after a wrong choice`); }
          await act('izbor', k.tocno);
          if (si === Math.floor(steps.length / 2) && steps.length > 1) await opt.onGame?.(g, 'mid', level);
        } else {
          if (opt.wrongFirst) { await act('red', k.stavke[k.stavke.length - 1].v); if (!(await page.locator('.poruka.ima').count())) throw new Error(`${g}: an item out of order was accepted`); }
          for (let i = 0; i < k.stavke.length; i++) {
            const v = k.stavke[i].v;
            if (opt.drag && k.slika) { const sel = `[data-act="red"][data-v="${v}"]`; await page.locator(sel).scrollIntoViewIfNeeded(); const from = await page.locator(sel).boundingBox(); const to = await page.locator('.lik').boundingBox(); if (!from || !to) throw new Error('no box'); await (opt.realTouch ? dragCdp : dragTouch)(page, from.x + from.width / 2, from.y + from.height / 2, to.x + to.width / 2, to.y + to.height / 2); }
            else await act('red', v);
            await page.waitForFunction(n => document.querySelectorAll('#main ol.obuceno li, #main ol.slozeno li').length === n, i + 1, { timeout: 3000 });
            if (i === 2) await opt.onGame?.(g, 'mid', level);
          }
        }
      }
    }
    await page.locator('[data-act="dalje"]').waitFor({ timeout: 5000 }); await opt.onGame?.(g, 'end', level); played.push(`${g}${level > 1 ? ':' + level : ''}`); await next();
  }
  await page.locator('.kraj').waitFor({ timeout: 5000 });
  return played;
}
/** A drag by touch through the pointer events the page listens to (CDP touch in Chromium; synthetic pointer events elsewhere). */
export async function dragTouch(page: Page, x1: number, y1: number, x2: number, y2: number) {
  // passed as text: the TypeScript runner would otherwise add a helper that does not exist in the page
  await page.evaluate(`(() => { const [a, b, c, d] = ${JSON.stringify([x1, y1, x2, y2])};
    const ev = (type, x, y, target) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerType: 'touch', pointerId: 7, isPrimary: true, clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1 }));
    ev('pointerdown', a, b, document.elementFromPoint(a, b));
    for (let i = 1; i <= 8; i++) ev('pointermove', a + ((c - a) * i) / 8, b + ((d - b) * i) / 8, document);
    ev('pointerup', c, d, document); })()`);
}
/** A real touch drag (Chromium only): touch points sent through the browser's input pipeline, so that touch-action and scrolling behave as on a phone. */
export async function dragCdp(page: Page, x1: number, y1: number, x2: number, y2: number) {
  const c = await page.context().newCDPSession(page); const pt = (x: number, y: number) => [{ x: Math.round(x), y: Math.round(y), id: 1 }];
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x1, y1) });
  for (let i = 1; i <= 8; i++) { await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x1 + ((x2 - x1) * i) / 8, y1 + ((y2 - y1) * i) / 8) }); await page.waitForTimeout(16); }
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await c.detach();
}
