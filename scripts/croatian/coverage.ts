// Croatian coverage of every Mass of 2026–2036: which blocks have the old site's Croatian, which do not.
// Output: data/tm/missing.json (unique missing blocks with where they occur) and a summary on stdout.
import fs from 'node:fs';
import { generalConfig } from '../../src/engine/config';
import { getDay } from '../../src/engine/engine';
import { dayNumber } from '../../src/engine/dates';
import { assembleMass } from '../../src/assembler/assemble';
import { loadCorpus } from '../../src/assembler/corpus-node';
import { blockCore } from '../../src/assembler/norm';
import { makeResolver, resolveLines } from './resolve';

const PRAYER = new Set(['Oratio', 'Secreta', 'Postcommunio', 'SuperPopulum']);
const cfg = generalConfig({ name: 'Leo XIV.', date: '05-18' }); const corpus = loadCorpus(); const resolve = makeResolver();
const stat: Record<string, number> = { exact: 0, typo: 0, variant: 0, manual: 0, missing: 0 }; const variants = new Map<string, string>(); const uniq = new Map<string, { n: number; sec: string; where: string; formulary: string; la: string; first: string }>();
const uniqAll = new Set<string>(); const uniqHit = new Set<string>(); let masses = 0, noMass = 0;
for (let n = dayNumber(2026, 1, 1); n <= dayNumber(2036, 12, 31); n++) {
  const day = getDay(n, cfg);
  day.masses.forEach((m, i) => {
    if (m.kind !== 'mass') return;
    const v = assembleMass(day, i, corpus); if (!v) { noMass++; return; } masses++;
    for (const it of v.items) {
      if (it.kind !== 'section') continue;
      const units = PRAYER.has(it.key) ? it.blocks.map(b => b.lines) : [it.blocks.flatMap(b => b.lines)];
      units.forEach((ls, bi) => {
        const core = blockCore(ls); if (!core) return;
        uniqAll.add(core);
        const h = PRAYER.has(it.key) ? resolve(core) : resolveLines(resolve, ls, blockCore);
        if (h) { stat[h.via]++; uniqHit.add(core); if (h.via === 'variant') variants.set(core, `${v.formulary} ${it.key} (old site ${h.page}): ${h.diff}`); return; }
        stat.missing++;
        const comm = PRAYER.has(it.key) && bi > 0 ? it.blocks[bi].label ?? '' : '';
        const e = uniq.get(core) ?? { n: 0, sec: it.key, where: comm ? 'comm: ' + comm : day.title, formulary: v.formulary, la: ls.filter(l => l.k === 'text').map(l => l.la).join(' ').slice(0, 200), first: day.date };
        e.n++; uniq.set(core, e);
      });
    }
  });
}
const miss = [...uniq.entries()].map(([core, e]) => ({ ...e, words: core.split(' ').length, core })).sort((a, b) => b.n - a.n);
fs.writeFileSync('data/tm/missing.json', JSON.stringify(miss, null, 1));
const bySec: Record<string, number> = {}; for (const m of miss) bySec[m.sec] = (bySec[m.sec] || 0) + 1;
fs.writeFileSync('data/tm/variants.txt', [...variants.values()].sort().join('\n'));
console.log({ variantBlocks: variants.size, masses, noMass, occurrences: stat, uniqueBlocks: uniqAll.size, uniqueWithCroatian: uniqHit.size, uniqueMissing: miss.length, bySec });
