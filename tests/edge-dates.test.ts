// Named edge dates of 2026–2036. Each test cites the paragraph of the Code of Rubrics (1960) that decides it.
import { describe, expect, it } from 'vitest';
import { generalConfig } from '../src/engine/config';
import { getDay } from '../src/engine/engine';
import { easter, iso, parseIso } from '../src/engine/dates';

const cfg = generalConfig({ name: 'Leo XIV', date: '05-18' });
const T: Record<string, string> = { privileged: 'P', ordinary: 'O', same: 'S' };
function day(date: string) {
  const d = getDay(parseIso(date), cfg);
  return { key: d.celebration.key, cls: d.cls, colour: d.colour, title: d.title, from: d.celebration.transferredFrom, comm: d.commemorations.map(c => `${T[c.type]}:${c.key}`), masses: d.masses.length, omitted: d.omitted.map(o => o.key), d };
}

describe('Easter', () => {
  it('earliest in range: 25 March 2035; latest: 21 April 2030', () => { expect(iso(easter(2035))).toBe('2035-03-25'); expect(iso(easter(2030))).toBe('2030-04-21'); });
  it('Advent I is the Sunday nearest 30 November', () => { expect(day('2026-11-29').key).toBe('T:Adv1-0'); expect(day('2027-11-28').key).toBe('T:Adv1-0'); expect(day('2028-12-03').key).toBe('T:Adv1-0'); expect(day('2033-11-27').key).toBe('T:Adv1-0'); });
});

describe('Annunciation impeded (n. 96, 96a)', () => {
  for (const y of [2027, 2032]) it(`${y}: 25 March is Holy Thursday (table n. 91: Triduum 2 over I class feasts 11); the feast goes to the Monday after Low Sunday (n. 96a)`, () => {
    expect(day(`${y}-03-25`).key).toBe('T:Quad6-4');
    const target = iso(easter(y) + 8);
    expect(target).toBe(`${y}-04-05`);
    expect(day(target)).toMatchObject({ key: 'S:03-25', cls: 1, from: `${y}-03-25` });
    expect(day(target).comm).toEqual([]); // St Vincent Ferrer (III class) is not commemorated on a I class day, n. 111a
  });
  it('2029: 25 March is Palm Sunday (n. 15); the feast goes to Monday 9 April (n. 96a)', () => {
    expect(day('2029-03-25').key).toBe('T:Quad6-0');
    expect(day('2029-04-09')).toMatchObject({ key: 'S:03-25', from: '2029-03-25' });
  });
  it('2035: 25 March is Easter Sunday; the feast goes to Monday 2 April (n. 96a)', () => {
    expect(day('2035-03-25').key).toBe('T:Pasc0-0');
    expect(day('2035-04-02')).toMatchObject({ key: 'S:03-25', from: '2035-03-25' });
  });
});

describe('St Joseph impeded (n. 15, n. 96)', () => {
  for (const [y, sunday] of [[2028, 'T:Quad3-0'], [2034, 'T:Quad4-0']] as const) it(`${y}: 19 March is a Sunday of Lent, I class (n. 15); the feast is kept on Monday 20 March with a privileged commemoration of the feria (n. 96, n. 109e)`, () => {
    expect(day(`${y}-03-19`).key).toBe(sunday);
    const d = day(`${y}-03-20`);
    expect(d).toMatchObject({ key: 'S:03-19', cls: 1, from: `${y}-03-19` });
    expect(d.comm).toEqual([`P:T:Quad${sunday[6]}-1`]);
  });
  it('2035: 19 March is Monday of Holy Week (n. 91: 7 over 11); after Easter the Annunciation has its proper place on 2 April (n. 96a), so St Joseph takes Tuesday 3 April (n. 96)', () => {
    expect(day('2035-03-19').key).toBe('T:Quad6-1');
    expect(day('2035-04-03')).toMatchObject({ key: 'S:03-19', from: '2035-03-19' });
    expect(day('2035-04-04').key).toBe('S:04-04');
  });
});

describe('Immaculate Conception and All Souls', () => {
  it('8 December 2030 on the Second Sunday of Advent: the feast prevails (n. 15) with a privileged commemoration of the Sunday (n. 109a)', () => {
    expect(day('2030-12-08')).toMatchObject({ key: 'S:12-08', cls: 1, comm: ['P:T:Adv2-0'] });
  });
  for (const y of [2031, 2036]) it(`${y}: All Souls on a Sunday is kept on Monday 3 November (n. 16b, n. 96b) with its three Masses`, () => {
    expect(day(`${y}-11-02`)).toMatchObject({ key: 'T:Pent22-0', cls: 2 });
    expect(day(`${y}-11-03`)).toMatchObject({ key: 'S:11-02', cls: 1, colour: 'b', masses: 3, from: `${y}-11-02` });
  });
});

describe('Nativity of St John the Baptist', () => {
  it('24 June 2033 is the feast of the Sacred Heart (n. 91: 3 over 11); St John is transferred to Saturday 25 June (n. 96); the vigil on 23 June is omitted entirely because its feast is transferred (n. 33)', () => {
    expect(day('2033-06-24')).toMatchObject({ key: 'T:Pent02-5', cls: 1, comm: [] });
    expect(day('2033-06-25')).toMatchObject({ key: 'S:06-24', cls: 1, from: '2033-06-24', comm: [] });
    expect(day('2033-06-23')).toMatchObject({ key: 'T:Pent02-4', cls: 4 });
    expect(day('2033-06-23').omitted).toContain('S:06-23');
  });
  for (const y of [2029, 2035]) it(`${y}: on a II class Sunday the I class feast prevails (n. 91: 11 over 15) with a privileged commemoration of the Sunday (n. 109a, n. 111a)`, () => {
    const d = day(`${y}-06-24`);
    expect(d).toMatchObject({ key: 'S:06-24', cls: 1 });
    expect(d.comm).toHaveLength(1); expect(d.comm[0]).toMatch(/^P:T:Pent0[56]-0$/);
  });
});

describe('Feasts on Sundays', () => {
  for (const y of [2031, 2036]) it(`Sts Peter and Paul ${y}: I class feast over the II class Sunday, Sunday commemorated (n. 91, n. 109a); the vigil on Saturday 28 June is kept`, () => {
    expect(day(`${y}-06-29`)).toMatchObject({ key: 'S:06-29', comm: ['P:T:Pent04-0'] });
    expect(day(`${y}-06-28`).key).toBe('S:06-28r');
  });
  for (const y of [2027, 2032]) it(`Assumption ${y}: I class feast, Sunday commemorated (n. 91: 4 over 15; n. 109a)`, () => {
    expect(day(`${y}-08-15`)).toMatchObject({ key: 'S:08-15', comm: ['P:T:Pent13-0'] });
  });
  it('Christmas 2033 on a Sunday: three Masses; 1 January 2034 (Sunday) is the octave day; the Holy Name is on Monday 2 January', () => {
    expect(day('2033-12-25')).toMatchObject({ key: 'S:12-25', masses: 3 });
    expect(day('2033-12-26')).toMatchObject({ key: 'S:12-26', comm: ['P:T:Nat26'] }); // n. 109c
    expect(day('2034-01-01')).toMatchObject({ key: 'S:01-01', cls: 1, comm: [] });
    expect(day('2034-01-02').key).toBe('T:Nat2-0');
  });
  for (const y of [2030, 2036]) it(`Epiphany ${y} on a Sunday; the Holy Family on 13 January replaces the Commemoration of the Baptism without a commemoration (n. 112a)`, () => {
    expect(day(`${y}-01-06`)).toMatchObject({ key: 'S:01-06', cls: 1 });
    expect(day(`${y}-01-13`)).toMatchObject({ key: 'T:Epi1-0', cls: 2, comm: [] });
    expect(day(`${y}-01-13`).omitted).toContain('S:01-13');
  });
  it('Purification 2031: a II class feast of the Lord takes the place of the II class Sunday, which is not commemorated (n. 16a, n. 112b)', () => {
    expect(day('2031-02-02')).toMatchObject({ key: 'S:02-02', cls: 2, comm: [] });
  });
  for (const [name, md, key, years] of [['Transfiguration', '08-06', 'S:08-06', [2028, 2034]], ['Exaltation of the Cross', '09-14', 'S:09-14', [2031, 2036]], ['Dedication of the Lateran basilica', '11-09', 'S:11-09', [2031, 2036]]] as const)
    for (const y of years) it(`${name} ${y}: II class feast of the Lord in place of the Sunday, no commemoration of the Sunday (n. 16a) nor of a lesser saint (n. 111b)`, () => {
      expect(day(`${y}-${md}`)).toMatchObject({ key, cls: 2, comm: [] });
    });
  for (const y of [2029, 2035]) it(`Precious Blood ${y}: I class feast of the Lord, Sunday not commemorated (n. 16a, n. 112b)`, () => {
    expect(day(`${y}-07-01`)).toMatchObject({ key: 'S:07-01', cls: 1, comm: [] });
  });
  it('St Michael 2030: I class feast over the II class Sunday with its commemoration (n. 91, n. 109a)', () => {
    expect(day('2030-09-29')).toMatchObject({ key: 'S:09-29', comm: ['P:T:Pent16-0'] });
  });
});

describe('Other rubrics', () => {
  it('Greater Litanies stay on 25 April in the Easter octave of 2030 (n. 80) as a privileged commemoration at Mass (n. 109f); St Mark is omitted (n. 111a)', () => {
    const d = day('2030-04-25');
    expect(d).toMatchObject({ key: 'T:Pasc0-4', cls: 1, comm: ['P:X:LitMaj'], masses: 2 });
    expect(d.omitted).toContain('S:04-25');
  });
  it('Greater Litanies move to Tuesday when 25 April is Easter Sunday or Monday (n. 80): 2038, Easter on 25 April', () => {
    expect(iso(easter(2038))).toBe('2038-04-25');
    expect(day('2038-04-25').comm).toEqual([]);
    expect(day('2038-04-27').comm).toContain('P:X:LitMaj');
  });
  it('Ember days of September follow the third Sunday of September (first Sunday = first in the month): 2026 (1 September is a Tuesday, third Sunday 20 September) → 23, 25, 26 September', () => {
    for (const x of ['2026-09-23', '2026-09-25', '2026-09-26']) expect(day(x).d.flags.ember).toBe(true);
    expect(day('2026-09-16').d.flags.ember).toBeUndefined();
    expect(day('2026-09-26').masses).toBe(2);
  });
  it('a III class vigil outranks the Saturday Office of Our Lady (n. 91: 26 over 27): St Lawrence, Saturday 9 August 2031', () => {
    expect(day('2031-08-09')).toMatchObject({ key: 'S:08-09t', cls: 3, colour: 'v' });
  });
  it('a vigil falling on a Sunday is omitted (n. 30 final clause for II and III class vigils): 23 June 2030', () => {
    expect(day('2030-06-23').key).toBe('T:Pent02-0'); expect(day('2030-06-23').omitted).toContain('S:06-23');
  });
  it('Sunday within the octave of Christmas outranks a II class feast, which is commemorated (n. 16, n. 111b): 27 December 2026', () => {
    expect(day('2026-12-27')).toMatchObject({ key: 'T:Nat1-0', comm: ['O:S:12-27'] });
  });
  it('resumed Sundays after Epiphany before the last Sunday after Pentecost: 2027 has 27 Sundays (Epiphany IV, V, VI resumed)', () => {
    expect(day('2027-10-31').key).toBe('S:10-DU');
    expect(day('2027-11-07').key).toBe('T:PentEpi5-0'); expect(day('2027-11-14').key).toBe('T:PentEpi6-0'); expect(day('2027-11-21').key).toBe('T:Pent24-0');
  });
  it('papal anniversary oration on 18 May (Leo XIV) and Mission Sunday on the penultimate Sunday of October', () => {
    expect(day('2026-05-18').comm).toContain('S:X:Papa');
    expect(day('2026-10-18').comm[0]).toBe('S:X:Missio');
  });
  it('leap year: St Matthias on 25 February 2028 (bissextile day after 23 February)', () => { expect(day('2028-02-25').key).toBe('S:02-24'); expect(day('2028-02-24').key).not.toBe('S:02-24'); });
});
