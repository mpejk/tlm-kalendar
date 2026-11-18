// Sentences of each round Gospel, numbered, for choosing the passage of "Poredaj evanđelje" by hand (data/igra/poredaj.yaml):
//   npx tsx scripts/igra/poredaj-cand.ts [from] [count]   — prints "## <formulary key>" then "  <n>. <sentence>" (only sentences of 25-170 chars are usable)
import { loadDist, zagrebDays, isRound, principal, massOf, sectionOf, hrOf } from './lib';
import { gospelBody, sentences } from './gospel-cand';
const D = loadDist('dist'); const seen = new Map<string, string>();
for (const d of zagrebDays(D).filter(isRound)) { const v = massOf(D, d, principal(d)); const g = sectionOf(v, 'Evangelium'); const t = g ? hrOf(D, g) : null; if (g && t && !seen.has((g.src ?? '').split('|')[0])) seen.set((g.src ?? '').split('|')[0], t); }
const [from = '0', count = '999'] = process.argv.slice(2);
let i = 0;
for (const [k, t] of seen) { if (i++ < +from || i > +from + +count) continue; console.log('## ' + k); sentences(gospelBody(t)).forEach((s, j) => console.log(`  ${j}. ${s.length > 170 ? '[long] ' : ''}${s}`)); }
console.error(seen.size, 'formularies');
