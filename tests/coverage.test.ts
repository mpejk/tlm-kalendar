// Stage 7, coverage: every day of 2026–2036, in both calendars, has every required section of the Mass in Latin.
import { describe, it, expect } from 'vitest';
import { getDay } from '../src/engine/engine';
import { dayNumber } from '../src/engine/dates';
import { assembleMass } from '../src/assembler/assemble';
import { loadCorpus } from '../src/assembler/corpus-node';
import { calendars } from '../scripts/build/data';

const REQUIRED = ['Introitus', 'Oratio', 'Lectio', 'Graduale', 'Evangelium', 'Offertorium', 'Secreta', 'Prefatio', 'Communio', 'Postcommunio'];
describe('Latin coverage 2026–2036', () => {
  const corpus = loadCorpus(); const cals = calendars();
  for (const [name, cfg] of Object.entries(cals)) it(`every Mass of the ${name} calendar has all sections`, () => {
    const problems: string[] = []; let masses = 0, days = 0;
    for (let n = dayNumber(2026, 1, 1); n <= dayNumber(2036, 12, 31); n++) {
      const d = getDay(n, cfg); days++;
      if (!d.masses.length) problems.push(`${d.date}: no Mass or rite`);
      d.masses.forEach((m, i) => {
        if (m.kind !== 'mass') return;
        const v = assembleMass(d, i, corpus); if (!v) { problems.push(`${d.date} #${i}: ${m.id} not assembled`); return; }
        masses++;
        for (const key of REQUIRED) {
          const secs = v.items.filter(it => it.kind === 'section' && it.key === key) as any[];
          if (!secs.length) { problems.push(`${d.date} #${i} ${m.id}: no ${key}`); continue; }
          for (const s of secs) { if (!s.blocks[0]?.lines.some((l: any) => l.k === 'text' && l.la.trim().length > 3)) problems.push(`${d.date} #${i} ${m.id}: empty ${key}`);
            for (const b of s.blocks) if (b.label && !b.lines.some((l: any) => l.k === 'text')) problems.push(`${d.date} #${i} ${m.id}: ${key} commemoration without text (${b.label})`);
            for (const b of s.blocks) for (const l of b.lines) if (/\[missing |undefined|@[A-Z]/.test(l.la)) problems.push(`${d.date} #${i} ${m.id}: ${key} unresolved text «${l.la.slice(0, 60)}»`); }
        }
      });
    }
    expect(days).toBe(4018); expect(masses).toBeGreaterThan(4000);
    expect([...new Set(problems.map(p => p.replace(/^\S+ /, '')))].slice(0, 40)).toEqual([]);
  }, 180_000);
});
