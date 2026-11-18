// Second version of the rounds (November 2026): which games each age band plays on a round day, decided by the date (not by
// chance), and the content of the games that change with the day. Called by generate.ts; deterministic.
//
// Rotation (DECISIONS.md, the game): every round has exactly one fixed-knowledge game and fills the other places with games that
// change with the day. Both are chosen "least recently used" over the sequence of round days of the range, per age band:
//   - the fixed game is never the one of the previous round, and on a Sunday never the one of the previous Sunday;
//   - the changing games are the available ones used longest ago (ties: the order of CHG).
import { Day } from '../../src/engine/types';
import { LABELS } from '../../src/assembler/assemble';
import { Dist, massOf, principal, sectionOf, hrOf } from './lib';
import { gospelBody, sentences } from './gospel-cand';
import { rng, shuffled, cleanTitle } from './generate';

export type Dob = 'a' | 'b' | 'c';
export const SIZE: Record<Dob, number> = { a: 3, b: 4, c: 5 };
export const FIX: Record<Dob, string[]> = { a: ['ruho', 'kalez', 'oltar', 'misa'], b: ['ruho', 'misa', 'kalez', 'oltar', 'odgovori'], c: ['ruho', 'misa', 'kalez', 'oltar', 'odgovori'] };
export const CHG: Record<Dob, string[]> = {
  a: ['boja', 'tjedan', 'koliko'],
  b: ['boja', 'tjedan', 'dio', 'negovori', 'poredaj', 'sveci', 'koliko'],
  c: ['boja', 'tjedan', 'dio', 'negovori', 'poredaj', 'sveci', 'rijeci', 'evandjelje'],
};
/** Highest level of each fixed game by band (ministrant: the boy or girl who learns to serve gets the longer answers in band b). */
export const MAXLEVEL: Record<Dob, Record<string, number>> = {
  a: { ruho: 3, kalez: 3, oltar: 2, misa: 2 },
  b: { ruho: 3, kalez: 3, oltar: 3, misa: 3, odgovori: 2 },
  c: { ruho: 4, kalez: 3, oltar: 3, misa: 3, odgovori: 3 },
};

export interface Extra {
  x: Record<Dob, string[]>;                                  // the games of the round, per band, in playing order
  tj: [string, string, string][] | null;                     // Boje tjedna: seven days [date, title, colour]
  sv: [string, string][] | null;                             // Sveci tjedna: three days [date, title]
  kn: { c: 'bozic' | 'uskrs' | 'duhovi'; d: string; n: number; s: [string, string][] } | null;   // Koliko još nedjelja?
  di: { p: string; la: string; hr: string }[] | null;        // Koji je ovo dio?: three openings (part id, Latin, Croatian)
  dl: Record<string, [string, string]>;                      // labels of the parts used by "dio" (Latin, Croatian)
  ng: { a: string; y: string[] }[] | null;                   // Što se danas ne govori?: absent item, three that are said
  po: string[] | null;                                       // Poredaj evanđelje: the sentences in their order
  od: string[][];                                            // longer answers (odgovori level 3): [line, wrong, wrong, wrong]
  mz: string;                                                // id of the vestment missing at level 3 of Obuci svećenika
  kz: string;                                                // id of the piece missing at level 3 of Složi kalež
}

const words = (s: string, n: number) => { const w = s.split(/\s+/).filter(Boolean); return w.slice(0, n).join(' ').replace(/[,;:.!?]+$/, '') + (w.length > n ? ' …' : ''); };
/** The Croatian text of a section as shown, without the reference line, headings, "Pomolimo se" and markup. */
function hrBody(t: string, key: string): string {
  let s = t.split('\n').filter(l => !(l.length < 70 && /\d/.test(l) && !/\p{Ll}{9,}/u.test(l))).join(' ');
  s = s.replace(/<i>Pomolimo se<\/i>\.?/g, '').replace(/<\/?[ib]>/g, '').replace(/\((?:\d\s)?\p{Lu}\p{Ll}*\.? \d[^)]*\)/gu, '').replace(/\s+/g, ' ').trim();
  if (key === 'Lectio' || key === 'Evangelium') s = s.replace(/^(Čitanje|Slijedi|Muka|Početak|Nastavak)\b.*?(?<!\b(?:bl|sv|br|sv\. \p{Lu}\p{Ll}*))\.\s+(?=\p{Lu})/u, '');
  return s;
}
function laBody(v: any, key: string): string {
  const lines = v.blocks.flatMap((b: any) => b.lines).filter((l: any) => l.k === 'text');
  const ls = key === 'Lectio' || key === 'Evangelium' ? lines.slice(1) : lines;
  return (ls[0]?.la ?? '').replace(/^v\.\s*/, '').replace(/\s+/g, ' ').trim();
}

export function extend(D: Dist, all: Day[], days: Day[], rounds: any[], poredaj: Record<string, [string, number] | null>, ordo: any, problems: string[]): Extra[] {
  const byDate = new Map(all.map(d => [d.date, d]));
  const addDays = (iso: string, n: number) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
  const colourCache = new Map<string, string | null>();
  const colourOf = (d: Day) => { if (!colourCache.has(d.date)) { const cs = new Set(d.colours ?? []); colourCache.set(d.date, cs.size > 1 ? null : massOf(D, d, principal(d)).colour); } return colourCache.get(d.date)!; };
  const usedPo = new Set<string>();
  const out: Extra[] = days.map((d, idx) => {
    const r = rng('v2' + d.date); const v = massOf(D, d, principal(d));
    // Boje tjedna: seven days from the round's day
    let tj: Extra['tj'] = []; for (let i = 0; i < 7; i++) { const x = byDate.get(addDays(d.date, i)); const c = x ? colourOf(x) : null; if (!x || !c) { tj = null; break; } tj.push([x.date, cleanTitle(x.title), c]); }
    // Sveci tjedna: feasts of saints or of the Lord on the six days after the round's day, three distinct ones
    const fe: [string, string][] = []; for (let i = 1; i <= 6; i++) { const x = byDate.get(addDays(d.date, i)); if (x && x.weekday !== 0 && x.celebration.kind === 'feast') { const t = cleanTitle(x.title); if (!fe.some(f => f[1] === t)) fe.push([x.date, t]); } }
    const sv = fe.length >= 3 ? shuffled(fe, r).slice(0, 3).sort((a, b) => (a[0] < b[0] ? -1 : 1)) : null;
    // Koliko još nedjelja?: the next of Christmas, Easter, Pentecost; Sundays after the day up to it (it counts when it is a Sunday)
    let kn: Extra['kn'] = null;
    for (let i = 1; i < 400; i++) { const iso = addDays(d.date, i); const x = byDate.get(iso); if (!x) break; const c = iso.endsWith('-12-25') ? 'bozic' : x.temporalId === 'Pasc0-0' ? 'uskrs' : x.temporalId === 'Pasc7-0' ? 'duhovi' : null;
      if (c) { const s: [string, string][] = []; for (let j = 1; j <= i; j++) { const y = byDate.get(addDays(d.date, j))!; if (y.weekday === 0) s.push([y.date, cleanTitle(y.title)]); } if (s.length >= 1 && s.length <= 9) kn = { c, d: iso, n: s.length, s }; break; } }
    // Koji je ovo dio?: openings of three proper texts that have Croatian and do not begin like another part of the day
    const dl: Extra['dl'] = {}; const cand: { p: string; la: string; hr: string }[] = [];
    for (const k of ['Introitus', 'Oratio', 'Lectio', 'Evangelium', 'Offertorium', 'Communio', 'Postcommunio']) {
      const s = sectionOf(v, k); if (!s) continue; const h = hrOf(D, s); if (!h) continue; dl[k] = [s.la, s.hr];
      const hr = hrBody(h, k), la = laBody(s, k); if (hr.length < 20 || la.length < 10) continue;
      cand.push({ p: k, la: words(la, 6), hr: words(hr, 8) });
    }
    const key4 = (s: string) => s.toLowerCase().replace(/[^\p{L} ]/gu, '').split(' ').slice(0, 4).join(' ');
    const uniq = cand.filter(c => !cand.some(o => o !== c && (key4(o.hr) === key4(c.hr) || key4(o.la) === key4(c.la))));
    const di = Object.keys(dl).length >= 4 && uniq.length >= 3 ? shuffled(uniq, r).slice(0, 3) : null;
    // Što se danas ne govori?
    const g = sectionOf(v, 'Graduale'); const alle = g ? /Aleluja/.test(g.hr) : null;
    const said = ['kyrie', 'sanctus', 'paternoster', ...(v.gloria ? ['gloria'] : []), ...(v.credo ? ['credo'] : []), ...(alle ? ['aleluja'] : [])];
    const absent = [...(!v.gloria ? ['gloria'] : []), ...(!v.credo ? ['credo'] : []), ...(alle === false ? ['aleluja'] : [])];
    const ng = absent.length ? absent.slice(0, 2).map(a => ({ a, y: shuffled(said, r).slice(0, 3) })) : null;
    // Poredaj evanđelje
    let po: Extra['po'] = null; const gs = sectionOf(v, 'Evangelium'); const ghr = gs ? hrOf(D, gs) : null;
    if (gs && ghr) {
      const fid = (gs.src ?? '').split('|')[0];
      if (!(fid in poredaj)) problems.push(`${d.date}: no entry in poredaj.yaml for ${fid}`);
      else if (poredaj[fid]) {
        usedPo.add(fid); const [start, n] = poredaj[fid]!; const ss = sentences(gospelBody(ghr)); const at = ss.map((s, i) => (s.startsWith(start) ? i : -1)).filter(i => i >= 0);
        if (at.length !== 1) problems.push(`${d.date}: poredaj ${fid}: ${at.length} sentences start with "${start}"`);
        else { po = ss.slice(at[0], at[0] + n).map(s => s.replace(/^–\s*/, '')); if (po.length !== n || po.some(s => s.length > 170 || s.length < 20) || new Set(po).size !== n) { problems.push(`${d.date}: poredaj ${fid}: unusable passage`); po = null; } }
      } else usedPo.add(fid);
    }
    // longer answers for this day (Psalm 42 and the Misereatur; not where the day omits them)
    const rite = d.masses.some(m => m.kind === 'rite'); const passion = /^(Quad5|Quad6)-/.test(d.temporalId) && d.celebration.id.startsWith('Tempora');
    const cond: Record<string, boolean> = { bezPristupnih: rite, bezPsalma: v.colour === 'b' || passion, bezRekvijema: v.colour === 'b' };
    const dugo = (ordo.odgovori as any[]).filter(o => o.dugo && !(o.uvjet ?? []).some((u: string) => cond[u]));
    const od = shuffled(dugo, r).slice(0, 2).sort((a, b) => ordo.odgovori.indexOf(a) - ordo.odgovori.indexOf(b)).map(o => { const ws = shuffled((ordo.odgovori as any[]).filter(x => x.laOdg !== o.laOdg && x.dugo), r).slice(0, 3); return [o.id, ...ws.map(x => x.id)]; });
    const mz = ['amikt', 'alba', 'pojas', 'narucnik', 'stola', 'misnica'][Math.floor(r() * 6)];
    const kz = ['purif', 'patena', 'palla', 'velum', 'bursa'][Math.floor(r() * 5)];
    return { x: { a: [], b: [], c: [] }, tj, sv, kn, di, dl, ng, po, od, mz, kz };
  });
  for (const k of Object.keys(poredaj)) if (!usedPo.has(k)) problems.push(`poredaj.yaml: ${k} is not the Gospel of any round`);
  // rotation
  for (const dob of ['a', 'b', 'c'] as Dob[]) {
    const last: Record<string, number> = {}; let prevFix = '', prevSunFix = '';
    days.forEach((d, i) => {
      const e = out[i]; const rd = rounds[i];
      const avail = (gm: string) => gm === 'boja' ? true : gm === 'tjedan' ? !!e.tj : gm === 'koliko' ? !!e.kn : gm === 'dio' ? !!e.di : gm === 'negovori' ? !!e.ng : gm === 'poredaj' ? !!e.po : gm === 'sveci' ? !!e.sv : gm === 'rijeci' ? rd.w.length === 6 : gm === 'evandjelje' ? !!rd.e : false;
      const lru = (list: string[]) => list.slice().sort((p, q) => (last[p] ?? -1) - (last[q] ?? -1) || list.indexOf(p) - list.indexOf(q));
      const fix = lru(FIX[dob].filter(f => f !== prevFix && !(d.weekday === 0 && f === prevSunFix)))[0];
      const chg = lru(CHG[dob].filter(avail)).slice(0, SIZE[dob] - 1).sort((p, q) => CHG[dob].indexOf(p) - CHG[dob].indexOf(q));
      for (const gm of [fix, ...chg]) last[gm] = i;
      prevFix = fix; if (d.weekday === 0) prevSunFix = fix;
      e.x[dob] = [chg[0], fix, ...chg.slice(1)].filter(Boolean);
      if (e.x[dob].length > SIZE[dob]) problems.push(`${d.date} ${dob}: too many games`);
    });
  }
  return out;
}
export const PART_LABELS = LABELS;
