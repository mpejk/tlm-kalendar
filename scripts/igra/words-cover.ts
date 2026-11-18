// How many candidate lemmas each round Mass contains: npx tsx scripts/igra/words-cover.ts [lemmas.json]
import fs from 'node:fs';
import { loadDist, zagrebDays, isRound, principal, massOf } from './lib';
import { massWords, plain } from './words';
const L: Record<string, string[]> = JSON.parse(fs.readFileSync(process.argv[2] ?? 'scripts/igra/lemmas.json', 'utf8'));
const byForm = new Map<string, string[]>(); for (const [k, fs_] of Object.entries(L)) for (const f of fs_) byForm.set(f, [...(byForm.get(f) ?? []), k]);
const amb = [...byForm].filter(x => x[1].length > 1); if (amb.length) console.log('AMBIGUOUS', amb.map(x => x.join('=')).join(' '));
const D = loadDist('dist'); const seen = new Map<string, number>(); const used = new Map<string, number>();
for (const d of zagrebDays(D).filter(isRound)) {
  const v = massOf(D, d, principal(d)); const key = v.formulary + '|' + d.season; if (seen.has(key)) continue;
  const ls = new Set<string>(); for (const w of massWords(v)) for (const k of byForm.get(plain(w)) ?? []) ls.add(k);
  seen.set(key, ls.size); for (const k of ls) used.set(k, (used.get(k) ?? 0) + 1);
}
const c = [...seen].sort((a, b) => a[1] - b[1]); console.log('views', c.length, 'min', c.slice(0, 8).join(' '), 'median', c[c.length >> 1][1]);
console.log('unused', Object.keys(L).filter(k => !used.has(k)).join(' '));
console.log([...used].sort((a, b) => b[1] - a[1]).map(x => x.join(':')).join(' '));
