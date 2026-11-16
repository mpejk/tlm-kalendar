// Finds Latin blocks of the old-site memory whose Croatian is also printed beside a different Latin text (a crossed translation,
// as in review finding T01).  npx tsx scripts/verify/tm-crossed.ts
import fs from 'node:fs';
import { similarity } from './texts-lib';
// @ts-ignore
import { normText } from '../lib/normalize.mjs';
const tm = JSON.parse(fs.readFileSync('data/tm/blocks.json', 'utf8')) as Record<string, { hr: string; n: number; src: string; sec: string; alts?: { hr: string; n: number; src: string }[] }>;
const strip = (hr: string) => normText(hr.split('\n').filter(l => !/^<i>.*<\/i>\.?$/.test(l.trim())).join(' ').replace(/alelu[jy]a/gi, ' '));
const byHr = new Map<string, string[]>();
for (const [core, e] of Object.entries(tm)) { const full = strip(e.hr); const k = process.argv[2] === 'loose' ? full.split(' ').slice(0, 6).join(' ') : full; if (k.length < 25) continue; const a = byHr.get(k) ?? []; a.push(core); byHr.set(k, a); }
const out: string[] = [];
for (const [k, cores] of byHr) {
  if (cores.length < 2) continue;
  for (let i = 0; i < cores.length; i++) for (let j = i + 1; j < cores.length; j++) {
    const a = cores[i], b = cores[j]; const s = similarity(a, b);
    if (s > 0.55 || a.includes(b) || b.includes(a)) continue;
    if (process.argv[2] === 'loose' && similarity(strip(tm[a].hr), strip(tm[b].hr)) < 0.8) continue;
    out.push(`sim ${s.toFixed(2)} | ${tm[a].sec} n=${tm[a].n} alts=${tm[a].alts?.length ?? 0} ${tm[a].src} | ${a.slice(0, 110)}\n         | ${tm[b].sec} n=${tm[b].n} alts=${tm[b].alts?.length ?? 0} ${tm[b].src} | ${b.slice(0, 110)}\n         HR ${tm[a].hr.replace(/\n/g, ' / ').slice(0, 150)}`);
  }
}
console.log(out.join('\n')); console.log(out.length, 'crossed pairs');
