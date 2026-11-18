// Lists the distinct Croatian Gospels of the rounds: npx tsx scripts/igra/gospels.ts [show n]
import { loadDist, zagrebDays, isRound, principal, massOf, sectionOf, hrOf } from './lib';
const D = loadDist('dist'); const seen = new Map<string, { n: number; date: string; title: string; src: string }>();
for (const d of zagrebDays(D).filter(isRound)) { const v = massOf(D, d, principal(d)); const g = sectionOf(v, 'Evangelium')!; const t = hrOf(D, g)!; const e = seen.get(t) ?? { n: 0, date: d.date, title: d.title, src: g.src ?? '' }; e.n++; seen.set(t, e); }
console.log(seen.size, 'distinct Gospels');
const n = +(process.argv[2] ?? 3); let i = 0; for (const [t, e] of seen) { if (i++ >= n) break; console.log('==', e.date, e.title, e.src, e.n); console.log(t); }
