// Shared by the game's generator and checks: the calendar's built data (dist/data), the list of round days, the Mass of a round.
import { Day } from '../../src/engine/types';
import { assembleMass } from '../../src/assembler/assemble';
import { blockCore, hashKey } from '../../src/assembler/norm';
import { Line, MassView, Section } from '../../src/assembler/types';
import { loadDist } from '../verify/snapshot';

export const FROM = '2026-11-22', TO = '2036-12-31';
export type Dist = ReturnType<typeof loadDist>;
export { loadDist };

/** The Zagreb day for every date of the range. */
export function zagrebDays(D: Dist): Day[] {
  const out: Day[] = [];
  for (const y of Object.keys(D.CAL).map(Number).sort()) for (const d of D.CAL[y].opci) {
    const z = D.CAL[y].zagreb[d.date.slice(5)] ?? d;
    if (z.date >= FROM && z.date <= TO) out.push(z);
  }
  return out;
}
/** A round: every Sunday and every feast of I or II class. */
export const isRound = (d: Day) => d.weekday === 0 || (d.celebration.kind === 'feast' && d.cls <= 2);
/** Index of the principal Mass: the first Mass of the day (not a rite before it); on Christmas Day the Mass of the day (the third). */
export function principal(d: Day): number {
  const idx = d.masses.map((m, i) => (m.kind === 'mass' ? i : -1)).filter(i => i >= 0);
  return d.date.slice(5) === '12-25' ? idx[idx.length - 1] : idx[0];
}
export function massOf(D: Dist, d: Day, i: number): MassView {
  const corpus: any = { formularies: D.F, texts: {}, ordo: D.BASE.ordo };
  const v = assembleMass(d, i, corpus); if (!v) throw new Error('no Mass ' + d.date); return v;
}
export const sectionOf = (v: MassView, key: string) => v.items.find(it => it.kind === 'section' && it.key === key) as Section | undefined;
/** Croatian of a section as the site shows it (null when it has none). */
export function hrOf(D: Dist, s: Section): string | null {
  const lines: Line[] = s.blocks.flatMap(b => b.lines); const core = blockCore(lines); if (!core) return null;
  const v = D.F[(s.src ?? '').split('|')[0]]?.hr?.[hashKey(core)];
  return (D.BASE.croatianPrimary === 'kniewald' ? v?.kn ?? v?.t : v?.t ?? v?.kn) ?? null;
}
