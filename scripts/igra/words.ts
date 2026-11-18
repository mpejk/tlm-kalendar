// Word census of the Latin of the round Masses: npx tsx scripts/igra/words.ts [min]
import { loadDist, zagrebDays, isRound, principal, massOf } from './lib';
export const plain = (w: string) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/j/g, 'i');
export function massWords(v: any): string[] {
  const out: string[] = [];
  for (const it of v.items) if (it.kind === 'section') for (const b of it.blocks) for (const l of b.lines) if (l.k === 'text') for (const w of l.la.split(/[^\p{L}]+/u)) if (w.length > 2) out.push(w);
  return out;
}
if (process.argv[1]?.endsWith('words.ts')) {
  const D = loadDist('dist'); const seen = new Map<string, any>();
  for (const d of zagrebDays(D).filter(isRound)) { const v = massOf(D, d, principal(d)); if (!seen.has(v.formulary + '|' + d.season)) seen.set(v.formulary + '|' + d.season, v); }
  const cnt = new Map<string, number>();
  for (const v of seen.values()) for (const w of new Set(massWords(v).map(plain))) cnt.set(w, (cnt.get(w) ?? 0) + 1);
  const min = +(process.argv[2] ?? 12);
  console.log(seen.size, 'views;', [...cnt].filter(x => x[1] >= min).sort((a, b) => b[1] - a[1]).map(x => x[0] + ':' + x[1]).join(' '));
}
