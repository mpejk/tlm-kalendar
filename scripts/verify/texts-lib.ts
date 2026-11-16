// Compares assembled Masses with the harvested old-site pages, section by section (Latin).
import fs from 'node:fs';
import { generalConfig, POPE_OLD_SITE } from '../../src/engine/config';
import { getDay } from '../../src/engine/engine';
import { parseIso } from '../../src/engine/dates';
import { assembleMass } from '../../src/assembler/assemble';
import { loadCorpus } from '../../src/assembler/corpus-node';
import { Item, Section } from '../../src/assembler/types';
// @ts-ignore
import { normLa, INLINE_REF } from '../lib/normalize.mjs';

const HEAD_KEY: [RegExp, string][] = [[/^Antíphona ad intróitum/, 'Introitus'], [/^Orátio super/, 'SuperPopulum'], [/^Orátio/, 'Oratio'], [/^Epístola|^Léctio/, 'Lectio'], [/^Graduále|^Allelúia|^Tractus/, 'Graduale'], [/^Sequéntia/, 'Sequentia'],
  [/^Evangélium/, 'Evangelium'], [/^Antíphona ad offertórium/, 'Offertorium'], [/^Secréta/, 'Secreta'], [/^Praefátio/, 'Prefatio'], [/^Antíphona ad communiónem/, 'Communio'], [/^Postcommúnio/, 'Postcommunio']];
export const keyOfHead = (la: string) => (HEAD_KEY.find(([r]) => r.test(la)) ?? [null, 'Other:' + la])[1];

const FORMULAS = [
  /gloria patri et filio et spiritui sancto sicut erat in principio et nunc et semper et in secula seculorum amen/g,
  /per (dominum nostrum|eumdem dominum nostrum|eundem dominum nostrum) iesum cristum filium tum qui tecum vivit et regnat in unitate (eiusdem )?spiritus sancti deus per omnia secula seculorum( amen)?/g,
  /qui tecum vivit et regnat in unitate (eiusdem )?spiritus sancti deus per omnia secula seculorum( amen)?/g,
  /qui vivis et regnas cum deo patre in unitate (eiusdem )?spiritus sancti deus per omnia secula seculorum( amen)?/g,
  /qui vivis et regnas (cum deo patre )?in secula seculorum( amen)?/g, /qui vivit et regnat in secula seculorum( amen)?/g,
  /per cristum dominum nostrum( amen)?$/g, /per eumdem cristum dominum nostrum( amen)?$/g,
  /\boremus\b/g, /flectamus genua( levate)?/g, /humiliate capita vestra deo/g,
];
export function core(s: string): string {
  let t = normLa(s.replace(/<b>[\s\S]*?<\/b>/g, ' ').replace(INLINE_REF, ' ').replace(/\[[^\]]*\]/g, ' '));
  for (const f of FORMULAS) t = t.replace(f, ' ');
  return t.replace(/\s+/g, ' ').trim();
}
const isRefLine = (x: string) => { const t = x.replace(/<[^>]+>/g, '').trim(); if (t.replace(INLINE_REF, '').trim() !== t && t.replace(INLINE_REF, '').trim().length > 3) return false; return t.length < 70 && /\d/.test(t) && /^[\p{L}\d .,;:\-–()]+$/u.test(t) && !/\p{Ll}{9,}/u.test(t); };
export function goldenCore(row: { la: string }): string { return core(row.la.split('\n').filter(l => !isRefLine(l)).join(' ')); }
export function mineCore(sec: Section, blockIndex?: number): string {
  const bs = blockIndex === undefined ? sec.blocks : [sec.blocks[blockIndex]].filter(Boolean);
  return core(bs.map(b => b.lines.filter(l => l.k === 'text').map(l => l.la).join(' ')).join(' '));
}
/** Word-level similarity (1 = identical). */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const A = a.split(' '), B = b.split(' ');
  if (!A.length || !B.length) return 0;
  if (A.length * B.length > 4_000_000) return A.length === B.length ? 0.5 : 0;
  let prev = new Uint16Array(B.length + 1), cur = new Uint16Array(B.length + 1);
  for (let i = 1; i <= A.length; i++) { for (let j = 1; j <= B.length; j++) cur[j] = A[i - 1] === B[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]); [prev, cur] = [cur, prev]; }
  return (2 * prev[B.length]) / (A.length + B.length);
}

export interface PageResult { nearList: string[]; file: string; date: string; n: number; problems: string[]; sections: number; exact: number; near: number }
export function comparePage(file: string, cfg = generalConfig(POPE_OLD_SITE)): PageResult {
  const g = JSON.parse(fs.readFileSync(file, 'utf8'));
  const corpus = loadCorpus();
  const day = getDay(parseIso(g.date), cfg);
  const res: PageResult = { file, date: g.date, n: g.n, problems: [], nearList: [], sections: 0, exact: 0, near: 0 };
  const view = assembleMass(day, g.n, corpus);
  if (!view) { res.problems.push('no Mass assembled for index ' + g.n + ' (' + JSON.stringify(day.masses[g.n] ?? null) + ')'); return res; }
  const gItems = g.items.filter((it: any) => !it.hidden);
  const gSeq = gItems.map((it: any) => (it.kind === 'note' ? 'note:' + it.text : keyOfHead(it.la)));
  const mSeq = view.items.map((it: Item) => (it.kind === 'note' ? 'note:' + it.text : it.key));
  if (gSeq.join('|') !== mSeq.join('|')) res.problems.push(`order: old [${short(gSeq)}] mine [${short(mSeq)}]`);
  if (g.rank !== view.rankLine) res.problems.push(`rank line: old «${g.rank}» mine «${view.rankLine}»`);
  // align sections by key in order of appearance
  const mineSecs = view.items.filter((it): it is Section => it.kind === 'section');
  const used = new Set<number>();
  for (const it of gItems) {
    if (it.kind !== 'section') continue;
    const key = keyOfHead(it.la);
    const idx = mineSecs.findIndex((s, i) => !used.has(i) && s.key === key);
    res.sections++;
    if (idx < 0) { res.problems.push(`missing section ${key} (${it.la})`); continue; }
    used.add(idx);
    const m = mineSecs[idx];
    if (it.la !== m.la && key !== 'Prefatio') res.problems.push(`heading ${key}: old «${it.la}» mine «${m.la}»`);
    if (key === 'Prefatio' && core(it.la) !== core(m.la)) res.problems.push(`preface: old «${it.la}» mine «${m.la}»`);
    const rows = it.rows.filter((r: any) => r.la !== undefined && !r.head);
    const a = rows.map((r: any) => goldenCore(r)).join(' ').replace(/\s+/g, ' ').trim();
    const b = mineCore(m);
    if (a === b) { res.exact++; continue; }
    const sim = similarity(a, b);
    if (sim >= 0.85 && Math.abs(a.length - b.length) < 0.12 * a.length) { res.near++; res.nearList.push(`${key} sim=${sim.toFixed(3)}`); continue; }
    // which blocks differ
    let detail = '';
    if (rows.length !== m.blocks.length && ['Oratio', 'Secreta', 'Postcommunio'].includes(key)) detail = ` blocks old ${rows.length} mine ${m.blocks.length};`;
    res.problems.push(`text ${key} sim=${sim.toFixed(2)}${detail} old «${a.slice(0, 90)}…${a.slice(-40)}» mine «${b.slice(0, 90)}…${b.slice(-40)}»`);
  }
  return res;
}
const short = (a: string[]) => a.map(x => x.replace('note:Na ovoj misi ', 'n:').replace('govori se ', '').replace('Nicejsko-carigradsko vjerovanje', 'Credo').replace('note:Na misama ferija u vremenu korizme i muke molitva nad narodom:', 'n:SP')).join(',');
