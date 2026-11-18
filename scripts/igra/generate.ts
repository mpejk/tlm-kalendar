// Round generator of the game "Nedjeljni izazov": for every Sunday and every feast of I or II class of the Zagreb calendar
// (22 Nov 2026 – 31 Dec 2036) the content of the round, from the calendar's built data (dist/data) and the sourced files in
// data/igra. Deterministic: the same data give the same rounds.
import fs from 'node:fs';
import YAML from 'yaml';
import { Day } from '../../src/engine/types';
import { loadDist, zagrebDays, isRound, principal, massOf, sectionOf, hrOf, Dist } from './lib';
import { massWords, plain } from './words';
import { gospelBody, sentences } from './gospel-cand';
import { extend, Extra, MAXLEVEL } from './rounds2';

export interface Word { k: string; n: string; hr: string; str: number; tiskano?: string; nacrt?: boolean }
export interface Round {
  d: string; t: string; c: number; k: string; wd: number; s: string; f: string; ml?: string;
  g: 0 | 1; cr: 0 | 1;
  dan: string[];                       // three other days (wrong choices of game 1)
  o: string[][]; ol: string[][];       // game 3, 11+ and 8–10: [line, wrong line, wrong line, …] (ids; the wrong answers are those lines' answers)
  p: string[]; pl: Record<string, [string, string]>;   // parts of the Mass of this day (ids) and the day's own labels
  w: [string, string][];               // six words: lemma key, the form found in this Mass
  e: { s: string; a: string; x: string[]; ref: string } | null;   // Gospel sentence with ____ , the word, three wrong words
}
export type Round2 = Round & Extra;
const BLANK = '_____';
export const read = (f: string) => YAML.parse(fs.readFileSync(f, 'utf8'));
/** small seeded generator (mulberry32) so that choices do not change between builds */
export function rng(seed: string) { let h = 1779033703 ^ seed.length; for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } let a = h >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function shuffled<T>(a: T[], r: () => number): T[] { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
export const cleanTitle = (t: string) => t.replace(/\s*\[[^\]]*\]/g, '').trim();
/** Liturgical year of a date: the year in which its First Sunday of Advent falls. */
export function adventOf(y: number): string { const x = new Date(Date.UTC(y, 11, 25)); const wd = x.getUTCDay(); const d = new Date(x.getTime() - ((wd === 0 ? 7 : wd) + 21) * 86400000); return d.toISOString().slice(0, 10); }
export const litYear = (iso: string) => { const y = +iso.slice(0, 4); return iso >= adventOf(y) ? y : y - 1; };

export function loadFixed() {
  const ordo = read('data/igra/red-mise.yaml'); const vest = read('data/igra/odijevanje.yaml'); const gos = read('data/igra/evandjelje.yaml') as Record<string, [string, string, string[]]>;
  const dict = read('data/igra/rjecnik.yaml') as { izvor: string; rijeci: (Word & { oblici: string[] })[] };
  const po = fs.existsSync('data/igra/poredaj.yaml') ? read('data/igra/poredaj.yaml') as Record<string, [string, number] | null> : null;
  const kalez = read('data/igra/kalez.yaml'); const oltar = read('data/igra/oltar.yaml');
  return { ordo, vest, gos, dict, po, kalez, oltar };
}

export function generate(D: Dist) {
  const { ordo, vest, gos, dict, po, kalez, oltar } = loadFixed();
  const allDays = zagrebDays(D); const days = allDays.filter(isRound);
  let prevO = '', prevOl = '';
  const byForm = new Map<string, string[]>(); for (const w of dict.rijeci) for (const f of w.oblici) byForm.set(f, [...(byForm.get(f) ?? []), w.k]);
  const W = new Map(dict.rijeci.map(w => [w.k, w]));
  const titles = days.map(d => cleanTitle(d.title));
  const problems: string[] = []; const usedGospel = new Set<string>();
  const rounds: Round[] = days.map((d: Day, idx) => {
    const mi = principal(d); const v = massOf(D, d, mi); const r = rng(d.date);
    const t = titles[idx];
    // game 1: three other days, near in the year, each with a different name
    const pool: string[] = []; for (let off = 1; off < 40 && pool.length < 12; off++) for (const j of [idx - off, idx + off]) { const x = titles[j]; if (x && x !== t && !pool.includes(x)) pool.push(x); }
    const dan = shuffled(pool, r).slice(0, 3);
    // game 3
    const rite = d.masses.some(m => m.kind === 'rite'); const palm = d.temporalId === 'Quad6-0'; const req = v.colour === 'b'; const easter = d.temporalId === 'Pasc0-0';
    const cond: Record<string, boolean> = { bezPristupnih: rite, bezMuke: palm, bezRekvijema: req, bezUskrsa: easter };
    const ok = (ordo.odgovori as any[]).filter(o => !o.dugo && !(o.uvjet ?? []).some((u: string) => cond[u]));
    // each question: the line, then wrong answers taken from the other lines (texts that differ from the right one and from each other)
    const all = (ordo.odgovori as any[]).filter(o => !o.dugo);
    const pick = (list: any[], n: number, wrongN: number) => {
      const out: any[] = []; for (const o of shuffled(list, r)) if (out.length < n && !out.some(x => x.laOdg === o.laOdg)) out.push(o);
      return all.filter(o => out.includes(o)).map(o => { const ws: any[] = []; for (const x of shuffled(all, r)) if (ws.length < wrongN && x.laOdg !== o.laOdg && !ws.some(y => y.laOdg === x.laOdg)) ws.push(x); return [o.id, ...ws.map(x => x.id)] as string[]; });
    };
    // never the same set of answers two rounds running
    const setOf = (q: string[][]) => q.map(x => x[0]).sort().join(',');
    let o = pick(ok, 5, 3); for (let n = 0; n < 20 && setOf(o) === prevO; n++) o = pick(ok, 5, 3);
    let ol = pick(ok.filter(x => x.lako), 4, 2); for (let n = 0; n < 20 && setOf(ol) === prevOl; n++) ol = pick(ok.filter(x => x.lako), 4, 2);
    prevO = setOf(o); prevOl = setOf(ol);
    // game 4
    const has: Record<string, boolean> = { gloria: v.gloria, credo: v.credo, sequentia: !!sectionOf(v, 'Sequentia'), bezPristupnih: !rite };
    const p: string[] = []; const pl: Round['pl'] = {};
    for (const x of ordo.dijelovi as any[]) {
      if (x.uvjet && !has[x.uvjet]) continue;
      if (x.vrsta === 'vlastito') { const s = sectionOf(v, x.id); if (!s) { problems.push(`${d.date}: no section ${x.id}`); continue; } pl[x.id] = [s.la, s.hr]; }
      p.push(x.id);
    }
    // game 5: six words of this Mass, each with a different Croatian meaning
    const found = new Map<string, string>(); for (const w of massWords(v)) for (const k of byForm.get(plain(w)) ?? []) if (!found.has(k)) found.set(k, w);
    const w: [string, string][] = []; const seenHr = new Set<string>();
    for (const k of shuffled([...found.keys()].sort(), r)) { const e = W.get(k)!; if (w.length < 6 && !seenHr.has(e.hr)) { seenHr.add(e.hr); w.push([k, found.get(k)!]); } }
    if (w.length < 6) problems.push(`${d.date}: only ${w.length} words`);
    // game 6
    let e: Round['e'] = null; const gs = sectionOf(v, 'Evangelium'); const ghr = gs ? hrOf(D, gs) : null;
    if (gs && ghr) {
      const fid = (gs.src ?? '').split('|')[0]; const spec = gos[fid]; usedGospel.add(fid);
      if (!spec) problems.push(`${d.date}: no entry in evandjelje.yaml for ${fid}`);
      else {
        const [start, word, wrong] = spec; const body = gospelBody(ghr); const ss = sentences(body).filter(s => s.startsWith(start));
        const ref = ghr.split('\n')[0].trim();
        if (ss.length !== 1) problems.push(`${d.date}: ${fid}: ${ss.length} sentences start with "${start}"`);
        else {
          const sent = ss[0].replace(/^–\s*/, ''); const re = new RegExp(`(?<![\\p{L}])${word}(?![\\p{L}])`, 'gu'); const n = (sent.match(re) ?? []).length;
          if (n !== 1) problems.push(`${d.date}: ${fid}: "${word}" occurs ${n} times in the sentence`);
          else if (new Set([word, ...wrong].map(x => x.toLowerCase())).size !== 4) problems.push(`${d.date}: ${fid}: choices not distinct`);
          else if (wrong.some(x => new RegExp(`(?<![\\p{L}])${x}(?![\\p{L}])`, 'u').test(sent))) problems.push(`${d.date}: ${fid}: a wrong choice occurs in the sentence`);
          else e = { s: sent.replace(re, BLANK), a: word, x: wrong, ref: /\d/.test(ref) && ref.length < 40 ? ref : '' };
        }
      }
    }
    const ml = d.masses.filter(m => m.kind === 'mass').length > 1 ? d.masses[mi].label : undefined;
    return { d: d.date, t, c: d.cls, k: v.colour, wd: d.weekday, s: d.season, f: v.formulary, ...(ml ? { ml } : {}), g: v.gloria ? 1 : 0, cr: v.credo ? 1 : 0, dan, o, ol, p, pl, w, e };
  });
  for (const k of Object.keys(gos)) if (!usedGospel.has(k)) problems.push(`evandjelje.yaml: ${k} is not the Gospel of any round`);
  const ext = extend(D, allDays, days, rounds, po ?? {}, ordo, po ? problems : []);
  const rounds2: Round2[] = rounds.map((x, i) => ({ ...x, ...ext[i] }));
  const base = {
    from: days[0].date, to: days[days.length - 1].date, firstAlbum: 2026,
    boje: { w: 'bijela', r: 'crvena', v: 'ljubičasta', g: 'zelena', b: 'crna', p: 'ružičasta' },
    ruho: vest.ruho, ruhoIzvor: vest.izvor, ruhoHrIzvor: vest.hrIzvor,
    odgovori: ordo.odgovori, dijelovi: ordo.dijelovi, izvorLa: ordo.izvorLa, izvorHr: ordo.izvorHr,
    rijeci: Object.fromEntries(dict.rijeci.map(w => [w.k, { n: w.n, hr: w.hr, str: w.str, ...(w.nacrt ? { nacrt: true } : {}) }])), rjecnikIzvor: dict.izvor,
    godine: [...new Set(rounds.map(r => litYear(r.d)))],
    kalez: kalez.kalez, kalezIzvor: kalez.izvor, tjelesnik: kalez.tjelesnik, oltar: oltar.predmeti, mjesta: oltar.mjesta, oltarIzvor: oltar.izvor,
    molitvaIzvor: vest.molitvaIzvor, maxLevel: MAXLEVEL,
  };
  return { rounds: rounds2, base, problems };
}
if (process.argv[1]?.endsWith('generate.ts')) { const g = generate(loadDist('dist')); console.log(g.rounds.length, 'rounds;', g.problems.length, 'problems'); console.log(g.problems.slice(0, 40).join('\n')); console.log(JSON.stringify(g.rounds[1]).length, JSON.stringify(g.rounds[1])); }
