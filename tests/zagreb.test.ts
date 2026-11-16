// Zagreb local layer: ranks, occurrence and commemorations follow the same table of precedence as every other feast.
import { describe, it, expect } from 'vitest';
import { getDay } from '../src/engine/engine';
import { parseIso } from '../src/engine/dates';
import { calendars } from '../scripts/build/data';

const c = calendars();
const z = (d: string) => getDay(parseIso(d), c.zagreb), g = (d: string) => getDay(parseIso(d), c.opci);
describe('Zagreb local layer', () => {
  it('Bl. Alojzije Stepinac, 10 February: III class, St Scholastica commemorated (n. 91, 23 before 24)', () => {
    const d = z('2026-02-10'); expect(d.title).toMatch(/Stepinac/); expect(d.cls).toBe(3); expect(d.colour).toBe('r');
    expect(d.commemorations.map(x => x.title).join()).toMatch(/Skolastika/); expect(d.flags.local).toBe(true); expect(g('2026-02-10').title).toMatch(/Skolastika/);
  });
  it('St Ladislaus, principal patron, I class (n. 43a): replaces a II class Sunday, which is commemorated (27 June 2027)', () => {
    const d = z('2027-06-27'); expect(d.cls).toBe(1); expect(d.title).toMatch(/LADISLAV/); expect(d.commemorations[0].type).toBe('privileged'); expect(d.commemorations[0].title).toMatch(/nedjelja po Duhovima/);
  });
  it('St Ladislaus yields to the Sacred Heart and is transferred (27 June 2025 pattern: n. 95) — checked for every year of the range', () => {
    for (let y = 2026; y <= 2036; y++) { const d = z(`${y}-06-27`); if (!/LADISLAV/.test(d.title)) { expect(d.cls).toBe(1); const next = [1, 2, 3, 4, 5].map(k => z(`${y}-06-${27 + k > 30 ? 30 : 27 + k}`)); expect(next.some(x => /LADISLAV/.test(x.title)) || [1, 2, 3, 4, 5, 6, 7].some(k => /LADISLAV/.test(getDay(parseIso(`${y}-06-27`) + k, c.zagreb).title))).toBe(true); } }
  });
  it('Dedication of the cathedral, 25 August: I class in the whole diocese (n. 43b), a feast of the Lord: no commemoration of St Louis nor of a Sunday', () => {
    const d = z('2026-08-25'); expect(d.cls).toBe(1); expect(d.commemorations).toEqual([]);
    const s = z('2030-08-25'); expect(s.weekday).toBe(0); expect(s.title).toMatch(/POSVETE/); expect(s.commemorations).toEqual([]);
  });
  it('St Florian, secondary patron, II class (n. 43c), St Monica commemorated; Sts Cyril and Methodius II class on the 1962 date', () => {
    const f = z('2027-05-04'); expect(f.cls).toBe(2); expect(f.commemorations.map(x => x.title).join()).toMatch(/Monika/);
    const k = z('2026-07-07'); expect(k.cls).toBe(2); expect(g('2026-07-07').cls).toBe(3); expect(z('2026-07-05').title).not.toMatch(/Ćiril/);
  });
  it('III class local feasts give way to days of higher rank: St Quirinus on Corpus Christi 2026 is omitted (n. 111a)', () => {
    const d = z('2026-06-04'); expect(d.title).toMatch(/TIJELOVO/); expect(d.commemorations.map(x => x.title).join()).not.toMatch(/Kvirin/);
    expect(z('2027-06-04').title).toMatch(/SRCE|Kvirin/);
  });
  it('neobvezatni spomendan is a note only: the Mass of the day is that of the general calendar', () => {
    const d = z('2026-04-27'), o = g('2026-04-27'); expect(d.notes.join()).toMatch(/Ozana/); expect(d.title).toBe(o.title); expect(d.masses).toEqual(o.masses);
  });
  it('Masses follow Kniewald 1942 where he has the feast: St Florian Protexisti, Bl. Marko and Bl. Nikola Laetabitur, St Demetrius a Common of martyrs who were not bishops', () => {
    expect(z('2026-05-04').celebration.id).toBe('Local/zg-05-04'); expect(z('2026-09-07').celebration.id).toBe('Commune/C2a');
    expect(z('2026-11-14').celebration.id).toBe('Commune/C2a'); expect(z('2026-10-08').celebration.id).toBe('Commune/C3b');
  });
  it('St Quirinus, 4 June: the Paschaltide Common (Protexisti) up to the Saturday after Pentecost, Statuit after it', () => {
    expect(z('2030-06-04').celebration.id).toBe('Local/zg-06-04p'); // Easter 21 April 2030, Pentecost 9 June
    expect(z('2029-06-04').celebration.id).toBe('Commune/C2c');     // Easter 1 April 2029, Pentecost 20 May
  });
  it('a local III class feast that is impeded leaves the day exactly as in the general calendar (no local flag): Ash Wednesday 2027, Sacred Heart 2027', () => {
    for (const x of ['2027-02-10', '2027-06-04']) { expect(z(x).flags.local).toBeFalsy(); expect(z(x).title).toBe(g(x).title); }
  });
  it('the general calendar is untouched by the local layer', () => { for (const x of ['2026-02-10', '2026-06-27', '2026-08-25', '2026-07-13', '2026-11-05']) expect(g(x).flags.local).toBeFalsy(); });
});
