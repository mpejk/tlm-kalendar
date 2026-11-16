import fs from 'node:fs';
import { makeResolver, typoOnly } from '../croatian/resolve';
import { similarity } from '../verify/texts-lib';
const miss = JSON.parse(fs.readFileSync('data/tm/missing.json', 'utf8')); const tm = JSON.parse(fs.readFileSync('data/tm/blocks.json', 'utf8'));
const R: any = makeResolver();
for (const pat of process.argv.slice(2)) { const m = miss.find((x: any) => (x.formulary + ' ' + x.sec).includes(pat)); if (!m) continue;
  let best = 0, bk = ''; for (const k of Object.keys(tm)) { if (Math.abs(k.length - m.core.length) > 0.2 * m.core.length) continue; if (k.slice(0, 12) !== m.core.slice(0, 12)) continue; const s = similarity(k, m.core); if (s > best) { best = s; bk = k; } }
  console.log(pat, 'best', best.toFixed(3), 'typo', typoOnly(bk, m.core), 'variant', R.variantOnly(bk, m.core), 'lenA', bk.split(' ').length, 'resolve', !!R(m.core)); }
