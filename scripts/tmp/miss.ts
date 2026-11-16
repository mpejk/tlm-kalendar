// show a missing block beside its closest block-memory entries: npx tsx scripts/tmp/miss.ts <index|formulary filter>
import fs from 'node:fs';
import { similarity } from '../verify/texts-lib';
import { coreLa } from '../../src/assembler/norm';
const miss = JSON.parse(fs.readFileSync('data/tm/missing.json', 'utf8')); const tm = JSON.parse(fs.readFileSync('data/tm/blocks.json', 'utf8'));
const keys = Object.keys(tm);
for (const m of miss) {
  const core = coreLa(m.la); const w = new Set(core.split(' ').slice(0, 12));
  let best = 0, bk = '';
  for (const k of keys) { const kw = k.split(' ').slice(0, 14); let sh = 0; for (const x of kw) if (w.has(x)) sh++; if (sh < 5) continue; const s = similarity(k.split(' ').slice(0, 40).join(' '), core.split(' ').slice(0, 40).join(' ')); if (s > best) { best = s; bk = k; } }
  console.log(`${m.n}x ${m.sec} ${m.formulary} [${m.where.slice(0, 30)}] words=${m.words}\n   mine: ${core.slice(0, 150)}\n   best(${best.toFixed(2)}, ${bk ? tm[bk].src : '-'}, words=${bk.split(' ').length}): ${bk.slice(0, 150)}`);
}
