// Applies data/corpus/overrides.yaml: Latin taken from harvested old-site pages for the listed formulary sections.
import fs from 'node:fs';
import YAML from 'yaml';
// @ts-ignore
import { INLINE_REF, normLa } from '../lib/normalize.mjs';
import { keyOfHead } from '../verify/texts-lib';

const CONCL: [RegExp, string][] = [[/^per eundem dominum|^per eumdem dominum/, 'Per eumdem'], [/^per dominum/, 'Per Dominum'], [/^qui tecum/, 'Qui tecum'], [/^qui vivis/, 'Qui vivis']];
const isRef = (t: string) => t.length < 70 && /\d/.test(t) && /^[\p{L}\d .,;:\-–()]+$/u.test(t) && !/\p{Ll}{9,}/u.test(t);

/** One old-site table cell (Latin) -> units of the corpus format. */
export function rowToUnits(la: string): any[] {
  const units: any[] = [];
  const lines = la.split('\n').map(l => l.trim()).filter(Boolean);
  lines.forEach((line, i) => {
    if (/^<b>/.test(line)) return;                                   // commemoration label
    const whole = line.match(/^<i>([^<]*)<\/i>\.?$/);
    if (whole) {
      const n = normLa(whole[1]);
      if (n === 'oremus') return;
      if (n.startsWith('gloria patri')) { units.push({ k: 'macro', name: 'Gloria' }); return; }
      const c = CONCL.find(([r]) => r.test(n));
      units.push(c ? { k: 'macro', name: c[1] } : { k: 'text', la: whole[1] + '.' });
      return;
    }
    const plain = line.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (i === 0 && isRef(plain)) { if (!lines.slice(1).some(l => INLINE_REF.test(l) && (INLINE_REF.lastIndex = 0, true))) units.push({ k: 'ref', la: plain }); INLINE_REF.lastIndex = 0; return; }
    // inline references and bracketed rubrics split the line
    let rest = plain;
    const re = /\((?:[1-4I]{1,3}\.? )?\p{Lu}[\p{L}]*\.? ?\d+[^()]*\)|\[[^\]]*\]/gu;
    let last = 0, m: RegExpExecArray | null;
    while ((m = re.exec(rest))) {
      const before = rest.slice(last, m.index).trim(); if (before) units.push({ k: 'text', la: before });
      units.push(m[0][0] === '[' ? { k: 'rubric', la: m[0].slice(1, -1) } : { k: 'ref', la: m[0].slice(1, -1) });
      last = m.index + m[0].length;
    }
    const tail = rest.slice(last).trim(); if (tail) units.push({ k: 'text', la: tail });
  });
  return units;
}

export function applyOverrides(out: Record<string, any>, pack: (u: any[]) => any[]): string[] {
  const log: string[] = [];
  const list = YAML.parse(fs.readFileSync('data/corpus/overrides.yaml', 'utf8')) as any[];
  for (const o of list) {
    const g = JSON.parse(fs.readFileSync(`data/golden/masses/${o.page}.json`, 'utf8'));
    const secs = g.items.filter((it: any) => it.kind === 'section' && !it.hidden && keyOfHead(it.la) === o.key);
    const sec = secs[o.nth ?? 0]; const f = out[o.formulary];
    if (!sec || !f) { log.push(`override not applied: ${o.formulary} ${o.section}`); continue; }
    const rows = sec.rows.filter((r: any) => r.la !== undefined && !r.head);
    const prayer = ['Oratio', 'Secreta', 'Postcommunio'].includes(o.key);
    const chosen = prayer ? [rows[o.row ?? 0]] : rows;
    const units: any[] = [];
    chosen.forEach((r: any, i: number) => { if (i) units.push({ k: 'sep' }); units.push(...rowToUnits(r.la)); });
    const packed = pack(units);
    if (o.variant) { f.variants ??= {}; f.variants[o.variant] ??= {}; f.variants[o.variant][o.section] = packed; }
    else { f.sections[o.section] = packed; if (f.from) delete f.from[o.section]; for (const v of Object.values<any>(f.variants ?? {})) delete v[o.section]; }
    f.overrides = [...(f.overrides ?? []), o.section];
    log.push(`${o.formulary} ${o.variant ? '(' + o.variant + ') ' : ''}${o.section} <- old site ${o.page}: ${o.reason}`);
  }
  return log;
}
