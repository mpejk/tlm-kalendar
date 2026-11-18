// Shared by the game's browser checks: the round data as the browser gets them, a profile in localStorage, and a player that
// plays every game of a round to the end by touch (tap), with one wrong try first in each game, as a child would.
import fs from 'node:fs'; import path from 'node:path';
import type { Page } from 'playwright';

export function loadIgra(dist = 'dist') {
  let BASE: any; const R: Record<number, any[]> = {};
  const IGRA = { base: (b: any) => { BASE = b; }, r: (y: number, rs: any[]) => { R[y] = rs; } };
  const run = (f: string) => new Function('IGRA', fs.readFileSync(f, 'utf8'))(IGRA);
  run(path.join(dist, 'igra/data/base.js')); for (const f of fs.readdirSync(path.join(dist, 'igra/data/r'))) run(path.join(dist, 'igra/data/r', f));
  const all = Object.keys(R).map(Number).sort().flatMap(y => R[y]);
  return { BASE, R, all };
}
export const ready = (page: Page) => page.waitForFunction(() => !!document.getElementById('main')?.dataset.ready, null, { timeout: 10000 });
export const GAMES: Record<string, string[]> = { a: ['boja', 'ruho'], b: ['boja', 'ruho', 'odgovori', 'dijelovi'], c: ['boja', 'ruho', 'odgovori', 'dijelovi', 'rijeci', 'evandjelje'] };
export async function setProfiles(page: Page, profs: { ime: string; dob: string; vel?: boolean }[], cur = 0) {
  await page.evaluate(([ps, c]) => { const profili = (ps as any[]).map((p, i) => ({ id: 'p' + i, ...p })); const old = JSON.parse(localStorage.getItem('igra.v1') ?? '{}'); localStorage.setItem('igra.v1', JSON.stringify({ profili, tko: 'p' + c, gotovo: old.gotovo ?? {} })); }, [profs, cur] as any);
}
const tap = async (page: Page, sel: string, touch: boolean) => { const el = page.locator(sel).first(); await el.scrollIntoViewIfNeeded(); if (touch) await el.tap(); else await el.click(); };
const title = (page: Page) => page.locator('#naslov').innerText();
/** Plays the round that is open on the page. `onGame(name, phase)` is called at the start and at the end of each game (for screenshots). Returns the names of the games played. */
export async function playRound(page: Page, r: any, BASE: any, dob: string, opt: { touch?: boolean; wrongFirst?: boolean; drag?: boolean; onGame?: (g: string, phase: 'start' | 'mid' | 'end') => Promise<void> } = {}): Promise<string[]> {
  const touch = opt.touch ?? true; const games = GAMES[dob].filter(g => g !== 'evandjelje' || r.e); const played: string[] = [];
  const act = (a: string, v: string) => tap(page, `#main [data-act="${a}"][data-v="${v.replace(/"/g, '\\"')}"]`, touch);
  const next = async () => { await page.locator('[data-act="dalje"]').waitFor({ timeout: 5000 }); await tap(page, '[data-act="dalje"]', touch); };
  for (const g of games) {
    await page.locator(`.igra-${g}`).waitFor({ timeout: 5000 }); await opt.onGame?.(g, 'start');
    if (g === 'boja') {
      if (opt.wrongFirst) { await act('boja', Object.keys(BASE.boje).find(k => k !== r.k)!); if (!(await page.locator('.poruka.ima').count())) throw new Error('no gentle correction after a wrong colour'); }
      await act('boja', r.k);
      if (dob !== 'a') { if (opt.wrongFirst) await act('dan', r.dan[0]); await act('dan', r.t); }
    } else if (g === 'ruho') {
      const ids: string[] = BASE.ruho.map((x: any) => x.id);
      if (opt.wrongFirst) { await act('ruho', ids[3]); if ((await page.locator('.obuceno li').count()) !== 0) throw new Error('a vestment out of order was accepted'); }
      for (let i = 0; i < ids.length; i++) {
        if (opt.drag && i % 2 === 0) { const from = await page.locator(`[data-act="ruho"][data-v="${ids[i]}"]`).boundingBox(); const to = await page.locator('.lik').boundingBox(); if (!from || !to) throw new Error('no box'); await dragTouch(page, from.x + from.width / 2, from.y + from.height / 2, to.x + to.width / 2, to.y + to.height / 2); }
        else await act('ruho', ids[i]);
        await page.waitForFunction(n => document.querySelectorAll('.obuceno li').length === n, i + 1, { timeout: 3000 });
        if (i === 2) await opt.onGame?.(g, 'mid');
      }
    } else if (g === 'odgovori') {
      const qs: string[][] = dob === 'b' ? r.ol : r.o;
      for (let q = 0; q < qs.length; q++) {
        await page.waitForFunction(n => document.querySelector('.korak2')?.textContent?.includes(`Pitanje ${n} `), q + 1, { timeout: 5000 });
        if (opt.wrongFirst && q === 0) await act('odgovor', qs[q][1]);
        await act('odgovor', qs[q][0]);
      }
    } else if (g === 'dijelovi') {
      const ids: string[] = r.p.filter((id: string) => dob === 'c' || BASE.dijelovi.find((x: any) => x.id === id)?.kratko);
      if (opt.wrongFirst) await act('dio', ids[ids.length - 1]);
      for (let i = 0; i < ids.length; i++) { await act('dio', ids[i]); if (i === 3) await opt.onGame?.(g, 'mid'); }
    } else if (g === 'rijeci') {
      // open the cards two by two to learn them, as a child does, then pair what is known
      const n = await page.locator('.karta').count(); const seen: { k: string; la: boolean }[] = [];
      const pairOf = (label: string) => { const m = /: (.*?)( \(latinski\))?$/.exec(label)!; const la = !!m[2]; const k = la ? m[1] : Object.keys(BASE.rijeci).find(x => r.w.some((w: any) => w[0] === x) && BASE.rijeci[x].hr.toLowerCase() === m[1].toLowerCase())!; return { k, la }; };
      for (let i = 0; i < n; i++) { const c = page.locator('.karta').nth(i); if (await c.isDisabled()) { seen[i] = { k: '', la: false }; continue; } await c.scrollIntoViewIfNeeded(); if (touch) await c.tap(); else await c.click(); seen[i] = pairOf((await page.locator('.karta').nth(i).getAttribute('aria-label'))!); if (i === 5) await opt.onGame?.(g, 'mid'); }
      for (let i = 0; i < n; i++) { if (await page.locator('.karta').nth(i).isDisabled()) continue; const j = seen.findIndex((s, x) => x !== i && s.k === seen[i].k && s.la !== seen[i].la); if (j < 0) throw new Error('memory: no partner for card ' + i); for (const x of [i, j]) { const c = page.locator('.karta').nth(x); await c.scrollIntoViewIfNeeded(); if (touch) await c.tap(); else await c.click(); } }
    } else if (g === 'evandjelje') {
      if (opt.wrongFirst) await act('rijec', r.e.x[0]);
      await act('rijec', r.e.a);
    }
    await page.locator('[data-act="dalje"]').waitFor({ timeout: 5000 }); await opt.onGame?.(g, 'end'); played.push(g); await next();
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
