import fs from 'node:fs';
import { similarity } from '../verify/texts-lib';
import { coreLa } from '../../src/assembler/norm';
const miss = JSON.parse(fs.readFileSync('data/tm/missing.json', 'utf8')); const tm = JSON.parse(fs.readFileSync('data/tm/blocks.json', 'utf8'));
const keys = Object.keys(tm); const out: string[] = []; const agg: Record<string, number> = {};
for (const m of miss) {
  const core = m.core as string; const A0 = core.split(' ');
  const w = new Set(A0.slice(0, 14)); let best = 0, bk = '';
  for (const k of keys) { if (Math.abs(k.length - core.length) > 0.2 * core.length) continue; const kw = k.split(' ').slice(0, 16); let sh = 0; for (const x of kw) if (w.has(x)) sh++; if (sh < Math.min(5, A0.length - 2)) continue; const s = similarity(k, core); if (s > best) { best = s; bk = k; } }
  if (best < 0.8) { out.push(`MISS ${m.n}x ${m.sec} ${m.formulary} [${m.where.slice(0, 28)}] ${core.slice(0, 90)}`); continue; }
  const A = bk.split(' '), B = A0; const L = Array.from({ length: A.length + 1 }, () => new Uint16Array(B.length + 1));
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  let i = 0, j = 0; let da: string[] = [], db: string[] = []; const ds: string[] = [];
  const flush = () => { if (da.length || db.length) ds.push(`[${da.join(' ')}→${db.join(' ')}]`); da = []; db = []; };
  while (i < A.length || j < B.length) { if (i < A.length && j < B.length && A[i] === B[j]) { flush(); i++; j++; } else if (j < B.length && (i >= A.length || L[i][j + 1] >= L[i + 1][j])) db.push(B[j++]); else da.push(A[i++]); }
  flush();
  for (const d of ds) agg[d] = (agg[d] || 0) + 1;
  out.push(`near ${best.toFixed(2)} ${m.n}x ${m.sec} ${m.formulary} [${m.where.slice(0, 22)}] ${ds.join(' ').slice(0, 150)}`);
}
fs.writeFileSync('scripts/tmp/miss2.txt', out.join('\n'));
console.log(Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, v]) => v + k).join('  '));
console.log(out.filter(x => x.startsWith('MISS')).length, 'true misses');
