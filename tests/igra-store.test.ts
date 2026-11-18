// The game's stored data: profiles and albums saved by the version that is live now (igra.v1) load after the update with nothing
// lost, and the new levels are kept across a reload.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { readStore, writeStore, eraseStore, migrate, recordLevel, levelOf, KEY, KEY_V1, STEP } from '../src/igra/store';

const fixture = JSON.parse(fs.readFileSync('tests/fixtures/igra-v1.json', 'utf8')).value;
function mem(init: Record<string, string> = {}) { const m = new Map(Object.entries(init)); return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }; }

describe('game storage: migration from the live format', () => {
  it('a v1 profile and album load with nothing lost', () => {
    const st = mem({ [KEY_V1]: JSON.stringify(fixture) });
    const s = readStore(st);
    expect(s.v).toBe(2);
    expect(s.profili).toEqual(fixture.profili);
    expect(s.tko).toBe(fixture.tko);
    expect(s.gotovo).toEqual(fixture.gotovo);
    expect(s.razine).toEqual({});
  });
  it('the first save writes v2 and leaves the v1 entry untouched', () => {
    const raw = JSON.stringify(fixture); const st = mem({ [KEY_V1]: raw });
    const s = readStore(st); s.gotovo[s.profili[1].id]['2026-12-06'] = 'n'; writeStore(st, s);
    expect(st.m.get(KEY_V1)).toBe(raw);
    const again = readStore(st);
    expect(again.gotovo[fixture.profili[1].id]).toEqual({ ...fixture.gotovo[fixture.profili[1].id], '2026-12-06': 'n' });
    expect(again.profili).toEqual(fixture.profili);
  });
  it('v2 is preferred over v1 once it exists', () => {
    const st = mem({ [KEY_V1]: JSON.stringify(fixture), [KEY]: JSON.stringify({ v: 2, profili: [{ id: 'x', ime: 'Novi', dob: 'a' }], tko: 'x', gotovo: {}, razine: {} }) });
    expect(readStore(st).profili.map(p => p.ime)).toEqual(['Novi']);
  });
  it('a broken v2 entry falls back to v1 instead of an empty album', () => {
    const st = mem({ [KEY_V1]: JSON.stringify(fixture), [KEY]: '{not json' });
    expect(readStore(st).gotovo).toEqual(fixture.gotovo);
  });
  it('unknown fields of a later version are kept', () => {
    const s = migrate({ ...fixture, v: 3, nesto: { a: 1 } }); expect((s as any).nesto).toEqual({ a: 1 });
  });
  it('no storage or nothing stored gives an empty start', () => {
    expect(readStore(null).profili).toEqual([]); expect(readStore(mem()).profili).toEqual([]);
  });
  it('erasing removes both versions', () => {
    const st = mem({ [KEY_V1]: '{}', [KEY]: '{}', 'tlm.theme': 'dark' }); eraseStore(st);
    expect([...st.m.keys()]).toEqual(['tlm.theme']);
  });
});

describe('game storage: levels', () => {
  it(`a level rises after ${STEP} different rounds finished correctly, and survives a reload`, () => {
    const st = mem({ [KEY_V1]: JSON.stringify(fixture) }); const s = readStore(st); const pid = s.profili[0].id;
    expect(levelOf(s, pid, 'ruho')).toBe(1);
    expect(recordLevel(s, pid, 'ruho', '2026-11-29', true, 4)).toBe(false);
    expect(recordLevel(s, pid, 'ruho', '2026-11-29', true, 4)).toBe(false);   // the same round twice counts once
    expect(recordLevel(s, pid, 'ruho', '2026-12-06', false, 4)).toBe(false);  // with a wrong try: not counted
    expect(recordLevel(s, pid, 'ruho', '2026-12-06', true, 4)).toBe(false);
    expect(recordLevel(s, pid, 'ruho', '2026-12-08', true, 4)).toBe(true);
    expect(levelOf(s, pid, 'ruho')).toBe(2);
    writeStore(st, s); expect(levelOf(readStore(st), pid, 'ruho')).toBe(2);
    expect(readStore(st).gotovo).toEqual(fixture.gotovo);
  });
  it('a level does not rise beyond the highest', () => {
    const s = migrate(fixture); const pid = s.profili[0].id;
    for (const d of ['2027-01-03', '2027-01-06', '2027-01-10', '2027-01-17', '2027-01-24', '2027-01-31']) recordLevel(s, pid, 'misa', d, true, 3);
    expect(levelOf(s, pid, 'misa')).toBe(3);
  });
});
