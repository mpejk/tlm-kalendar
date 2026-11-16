// word diff of one section between golden page and assembled Mass:  npx tsx scripts/tmp/wdiff.ts 2016-11-27_0 Postcommunio
import fs from 'node:fs';
import { generalConfig, POPE_OLD_SITE } from '../../src/engine/config';
import { getDay } from '../../src/engine/engine';
import { parseIso } from '../../src/engine/dates';
import { assembleMass } from '../../src/assembler/assemble';
import { loadCorpus } from '../../src/assembler/corpus-node';
import { goldenCore, mineCore, keyOfHead } from '../verify/texts-lib';
const [id, key, nth] = process.argv.slice(2); const [date, n] = id.split('_');
const f = ['2017', '2018'].map(y => `data/golden/masses/${y}/propers_${date.replace(/-/g, '')}_${n}.json`).find(x => fs.existsSync(x))!;
const g = JSON.parse(fs.readFileSync(f, 'utf8'));
const day = getDay(parseIso(date), generalConfig(POPE_OLD_SITE));
const v = assembleMass(day, +n, loadCorpus())!;
console.log('formulary', v.formulary, day.title, '| comm:', day.commemorations.map(c => c.id).join(','));
const gs = g.items.filter((it: any) => it.kind === 'section' && !it.hidden && keyOfHead(it.la) === key)[+(nth ?? 0)];
const ms = v.items.filter((it: any) => it.kind === 'section' && it.key === key)[+(nth ?? 0)] as any;
const a = gs ? gs.rows.filter((r: any) => r.la !== undefined && !r.head).map((r: any) => goldenCore(r)).join(' ').split(' ') : [];
const b = ms ? mineCore(ms).split(' ') : [];
// LCS diff
const L = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
let i = 0, j = 0; const out: string[] = []; let run = 0;
while (i < a.length || j < b.length) {
  if (i < a.length && j < b.length && a[i] === b[j]) { run++; if (run <= 3) out.push(a[i]); else if (run === 4) out.push('…'); i++; j++; }
  else { run = 0; if (j < b.length && (i >= a.length || L[i][j + 1] >= L[i + 1][j])) out.push('+[' + b[j++] + ']'); else out.push('-[' + a[i++] + ']'); }
}
console.log(out.join(' ').slice(0, 3000));
