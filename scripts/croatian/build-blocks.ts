// Block-level translation memory from the harvested old-site pages: the proper words of a Latin block (normalised, formulas
// removed) -> the Croatian cell(s) printed beside it. Prayers are keyed per block (the Mass prayer and each commemoration),
// other sections as a whole. Output: data/tm/blocks.json { core: { hr, n, src, sec, alts? } } (build-time only).
import fs from 'node:fs';
import { goldenCore, keyOfHead } from '../verify/texts-lib';
// @ts-ignore
import { normText } from '../lib/normalize.mjs';

const PRAYER = new Set(['Oratio', 'Secreta', 'Postcommunio', 'SuperPopulum']);
const tm = new Map<string, { sec: string; variants: Map<string, { n: number; srcs: string[] }> }>();
const cleanHr = (hr: string) => hr.split('\n').filter((l, i) => !(i === 0 && /^<b>/.test(l.trim()))).join('\n').trim();
const add = (core: string, hr: string, src: string, sec: string) => {
  if (!core || !hr.replace(/<[^>]+>/g, '').trim()) return;
  let e = tm.get(core); if (!e) tm.set(core, e = { sec, variants: new Map() });
  const v = e.variants.get(hr) ?? { n: 0, srcs: [] }; v.n++; v.srcs.push(src); e.variants.set(hr, v);
};
const seen = new Set<string>(); let pages = 0;
for (const y of ['2017', '2018']) for (const f of fs.readdirSync('data/golden/masses/' + y).sort()) {
  if (seen.has(f)) continue; seen.add(f);
  const g = JSON.parse(fs.readFileSync(`data/golden/masses/${y}/${f}`, 'utf8')); pages++;
  const src = f.replace('.json', '');
  for (const it of g.items) {
    if (it.kind !== 'section') continue;
    const key = keyOfHead(it.la);
    const rows = it.rows.filter((r: any) => r.la !== undefined && !r.head && r.hr !== undefined);
    if (PRAYER.has(key) || key.startsWith('Other:') || f.startsWith('actions_')) for (const r of rows) add(goldenCore(r, key), cleanHr(r.hr), src, key);
    if (!PRAYER.has(key) && rows.length) add(rows.map((r: any) => goldenCore(r, key)).join(' ').replace(/\s+/g, ' ').trim(), rows.map((r: any) => cleanHr(r.hr)).join('\n\n'), src, key);
  }
}
const out: Record<string, any> = {}; let conflicts = 0;
for (const [core, e] of tm) {
  const distinct = new Map<string, { hr: string; n: number; srcs: string[] }>();
  for (const [hr, v] of e.variants) { const k = normText(hr); const d = distinct.get(k) ?? { hr, n: 0, srcs: [] }; d.n += v.n; d.srcs.push(...v.srcs); distinct.set(k, d); }
  const vs = [...distinct.values()].sort((a, b) => b.n - a.n);
  out[core] = { hr: vs[0].hr, n: vs[0].n, src: vs[0].srcs[0], sec: e.sec, ...(vs.length > 1 ? { alts: vs.slice(1).map(v => ({ hr: v.hr, n: v.n, src: v.srcs[0] })) } : {}) };
  if (vs.length > 1) conflicts++;
}
fs.writeFileSync('data/tm/blocks.json', JSON.stringify(out, null, 0).replace(/\},"/g, '},\n"'));
console.log({ pages, blocks: tm.size, conflicts });
