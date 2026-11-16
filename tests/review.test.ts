// Corrections after the review of revision 25a6b7a against the 1962 Missal and the Code of Rubrics (finding IDs as in
// ODGOVOR-NA-PROVJERU.md). Each test fails on the revision reviewed.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import YAML from 'yaml';
import { generalConfig } from '../src/engine/config';
import { getDay } from '../src/engine/engine';
import { dayNumber, parseIso } from '../src/engine/dates';
import { assembleMass, hasCredo, NOTE } from '../src/assembler/assemble';
import { loadCorpus } from '../src/assembler/corpus-node';
import { CalendarConfig } from '../src/engine/types';

const POPE = { name: 'Lav XIV.', date: '05-18' };
const cfg = generalConfig(POPE);
const z = YAML.parse(fs.readFileSync('data/local/zagreb.yaml', 'utf8'));
const drop = new Set<string>(z.replace ?? []);
const zagreb: CalendarConfig = { sanctoral: cfg.sanctoral.filter(e => !drop.has(e.date + '|' + e.id)), local: z.feasts, localNotes: z.notes, pope: POPE };
const corpus = loadCorpus();
const day = (date: string, c = cfg) => getDay(parseIso(date), c);
const mass = (date: string, i = 0, c = cfg) => assembleMass(day(date, c), i, corpus)!;
const text = (date: string, key: string, i = 0, c = cfg) => mass(date, i, c).items.filter(it => it.kind === 'section' && it.key === key).flatMap((it: any) => it.blocks.flatMap((b: any) => b.lines.map((l: any) => l.la))).join(' ');
const hasPope = (date: string, c = cfg) => day(date, c).commemorations.some(x => x.key === 'X:Papa');
const eachDay = (fn: (d: ReturnType<typeof day>, cal: string) => void) => { for (const [cal, c] of [['opci', cfg], ['zagreb', zagreb]] as const) for (let n = dayNumber(2026, 1, 1); n <= dayNumber(2036, 12, 31); n++) fn(getDay(n, c), cal); };

describe('R04 Rogation Mass and the Creed (Code of Rubrics n. 343a, 475a)', () => {
  for (const d of ['2027-04-25', '2032-04-25']) it(`${d} is a Sunday: the Creed is said in the Rogation Mass`, () => {
    const dd = day(d); const i = dd.masses.findIndex(m => m.variant === 'rogation');
    expect(dd.weekday).toBe(0); expect(i).toBeGreaterThan(0);
    const v = assembleMass(dd, i, corpus)!; expect(v.credo).toBe(true); expect(v.gloria).toBe(false);
    expect(v.items.some(it => it.kind === 'note' && it.text === NOTE.credo)).toBe(true);
  });
  it('on weekdays the Rogation Mass has no Creed (n. 476c)', () => { const dd = day('2026-05-11'); const i = dd.masses.findIndex(m => m.variant === 'rogation'); expect(assembleMass(dd, i, corpus)!.credo).toBe(false); });
  it('no Rogation Mass on a day of I class (n. 341): Easter Thursday 25 April 2030, St Joseph the Worker 1 May 2035; the Greater Litanies stay a privileged commemoration (n. 109f)', () => {
    for (const d of ['2030-04-25', '2035-05-01']) { const dd = day(d); expect(dd.cls).toBe(1); expect(dd.masses.some(m => m.variant === 'rogation')).toBe(false); expect(dd.flags.rogation).toBe(true); expect(dd.rubricNotes?.join()).toMatch(/n\. 341/); }
    expect(day('2030-04-25').commemorations.map(c => c.key)).toContain('X:LitMaj');
    eachDay(d => { if (d.masses.some(m => m.variant === 'rogation')) expect(d.cls).toBeGreaterThan(1); });
  });
});

describe('R06 prayer for the Pope on the anniversary (Code of Rubrics n. 449–450, 363b, 364)', () => {
  it('2034: 18 May is the Ascension (table of precedence n. 3): the prayer is transferred to 19 May', () => {
    expect(day('2034-05-18').celebration.key).toBe('T:Pasc5-4');
    expect(hasPope('2034-05-18')).toBe(false); expect(hasPope('2034-05-19')).toBe(true);
    expect(hasPope('2034-05-18', zagreb)).toBe(false); expect(hasPope('2034-05-19', zagreb)).toBe(true);
  });
  it('I class days not listed under nn. 1, 2, 3, 8 keep it: Whit Tuesday 2027 and 2032, Ember Friday of Pentecost 2035', () => {
    for (const d of ['2027-05-18', '2032-05-18', '2035-05-18']) { expect(day(d).cls).toBe(1); expect(hasPope(d)).toBe(true); }
  });
  it('exactly one day a year carries it, and never a day of nn. 1, 2, 3, 8', () => {
    for (const c of [cfg, zagreb]) for (let y = 2026; y <= 2036; y++) {
      const days = []; for (let n = dayNumber(y, 1, 1); n <= dayNumber(y, 12, 31); n++) { const d = getDay(n, c); if (d.commemorations.some(x => x.key === 'X:Papa')) days.push(d); }
      expect(days.length).toBe(1); expect([1, 2, 3, 8]).not.toContain(days[0].celebration.ord);
      expect(days[0].date).toBe(y === 2034 ? '2034-05-19' : `${y}-05-18`);
    }
  });
  it('other anniversaries: Pentecost and Trinity Sunday impede it; it goes to the first day that is not of I class', () => {
    const c = (date: string) => generalConfig({ name: 'N.', date });
    // 2026: Pentecost 24 May, its octave is of I class; the first day not of I class is Trinity Sunday eve? No: Saturday is still the octave; Trinity (n. 3) is I class; Monday 1 June
    const on = (y: number, date: string) => { const cc = c(date); const out = []; for (let n = dayNumber(y, 1, 1); n <= dayNumber(y, 12, 31); n++) if (getDay(n, cc).commemorations.some(x => x.key === 'X:Papa')) out.push(getDay(n, cc).date); return out; };
    expect(on(2026, '05-24')).toEqual(['2026-06-01']);
    expect(on(2026, '05-31')).toEqual(['2026-06-01']);       // Trinity Sunday
    expect(on(2026, '04-03')).toEqual(['2026-04-13']);       // Good Friday -> Monday after Low Sunday
    expect(on(2026, '11-02')).toEqual(['2026-11-03']);       // All Souls (n. 8)
    expect(on(2026, '03-19')).toEqual(['2026-03-19']);       // St Joseph (n. 11) keeps it
  });
});

describe('R08 a second commemoration of Our Lady is omitted (Code of Rubrics n. 112d)', () => {
  it('Saturday 16 July 2033: Saturday Mass of Our Lady without the commemoration of Our Lady of Mount Carmel', () => {
    for (const c of [cfg, zagreb]) { const d = day('2033-07-16', c); expect(d.celebration.key).toBe('T:BVMSat'); expect(d.commemorations).toEqual([]); expect(d.omitted.find(o => o.key === 'S:07-16')?.reason).toMatch(/112d/); }
  });
  it('every feast and commemoration of Our Lady in the sanctoral is marked', () => {
    for (const e of cfg.sanctoral) if (/B\.? ?M\.? ?V|Mari[aæ]e? Virg|Beat[aæ]e? Mari|Mariae ad Nives/i.test((e as any).la ?? '') && !/Joseph|Joachim|Annæ|Servorum|Fundat/.test((e as any).la)) expect(e.bvm || e.lord, e.id).toBeTruthy();
  });
  it('no day of 2026–2036 joins two Marian prayers, or two of the Lord, in one Mass', () => {
    eachDay(d => { const marian = (d.celebration.bvm ? 1 : 0) + d.commemorations.filter(c => /^S:(02-11|03-25|05-31|07-02|07-16|08-05|08-14|08-15|08-22|09-08|09-12|09-15|09-24|10-07|10-11|11-21|12-08|Quad5-5)$|^L:zg-07-13$/.test(c.key)).length; expect(marian, d.date).toBeLessThan(2); });
  });
});
