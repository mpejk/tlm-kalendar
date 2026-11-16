// aggregate token differences over all non-exact sections
import fs from 'node:fs';
import { generalConfig, POPE_OLD_SITE } from '../../src/engine/config';
import { getDay } from '../../src/engine/engine';
import { parseIso } from '../../src/engine/dates';
import { assembleMass } from '../../src/assembler/assemble';
import { loadCorpus } from '../../src/assembler/corpus-node';
import { goldenCore, mineCore, keyOfHead } from '../verify/texts-lib';
const cfg = generalConfig(POPE_OLD_SITE); const corpus = loadCorpus();
const agg: Record<string, number> = {}; const ex: Record<string, string> = {}; const seen = new Set<string>(); let nsec = 0;
const big: string[] = [];
for (const y of ['2017', '2018']) for (const f of fs.readdirSync('data/golden/masses/' + y).sort()) {
  if (!f.startsWith('propers_') || seen.has(f)) continue; seen.add(f);
  const g = JSON.parse(fs.readFileSync(`data/golden/masses/${y}/${f}`, 'utf8'));
  const v = assembleMass(getDay(parseIso(g.date), cfg), g.n, corpus); if (!v) continue;
  const mine = v.items.filter((i: any) => i.kind === 'section') as any[]; const used = new Set<number>();
  for (const it of g.items) { if (it.kind !== 'section' || it.hidden) continue; const key = keyOfHead(it.la);
    const idx = mine.findIndex((s, i) => !used.has(i) && s.key === key); if (idx < 0) continue; used.add(idx);
    const a = it.rows.filter((r: any) => r.la !== undefined && !r.head).map((r: any) => goldenCore(r, key)).join(' ').replace(/\s+/g, ' ').trim().split(' ');
    const b = mineCore(mine[idx]).split(' '); if (a.join(' ') === b.join(' ')) continue;
    if (a.length * b.length > 3_000_000) { big.push(`${g.date}_${g.n} ${key} ${a.length}/${b.length}`); continue; }
    nsec++;
    const L = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    let i = 0, j = 0; let del: string[] = [], ins: string[] = [];
    const flush = () => { if (del.length || ins.length) { const k = `${del.join(' ')} => ${ins.join(' ')}`; agg[k] = (agg[k] || 0) + 1; ex[k] ??= `${g.date}_${g.n} ${key}`; } del = []; ins = []; };
    while (i < a.length || j < b.length) { if (i < a.length && j < b.length && a[i] === b[j]) { flush(); i++; j++; } else if (j < b.length && (i >= a.length || L[i][j + 1] >= L[i + 1][j])) ins.push(b[j++]); else del.push(a[i++]); }
    flush();
  }
}
const rows = Object.entries(agg).sort((x, y) => y[1] - x[1]);
fs.writeFileSync('scripts/tmp/near-diffs.txt', rows.map(([k, v]) => `${v}\t${k.slice(0, 300)}\t${ex[k]}`).join('\n'));
console.log({ sections: nsec, kinds: rows.length, big });
