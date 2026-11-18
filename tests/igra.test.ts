// The game "Nedjeljni izazov": fixed content against its printed sources, and every round of the whole range.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import YAML from 'yaml';
import { verifyData } from '../scripts/igra/verify-data';
import { loadIgra } from '../scripts/igra/play-lib';
import { adventOf, litYear } from '../scripts/igra/generate';

const read = (f: string) => YAML.parse(fs.readFileSync(f, 'utf8'));

describe('game: fixed content equals its sources', () => {
  it('vesting order: Missale Romanum 1962, Praeparatio ad Missam, p. LXXIII (PDF p. 75): Ad amictum, Ad albam, Ad cingulum, Ad manipulum, Ad stolam, Ad casulam', () => {
    const v = read('data/igra/odijevanje.yaml');
    expect(v.ruho.map((x: any) => x.la)).toEqual(['amictus', 'alba', 'cingulum', 'manipulus', 'stola', 'casula']);
    expect(v.ruho.map((x: any) => x.rubrika.split(',')[0])).toEqual(['Ad amictum', 'Ad albam', 'Ad cingulum', 'Ad manipulum', 'Ad stolam', 'Ad casulam']);
    expect(v.ruho.map((x: any) => x.hr)).toEqual(['naglavnik', 'alba', 'pojas', 'naručnik', 'štola', 'misnica']);
    expect(v.izvor).toMatch(/LXXIII/);
  });
  it('order of the parts of the Mass: Missal 1962, Ordo Missae pp. 216–322; Kniewald 1942, pp. 8–30', () => {
    const o = read('data/igra/red-mise.yaml');
    expect(o.dijelovi.map((x: any) => x.id)).toEqual(['pristupne', 'Introitus', 'kyrie', 'gloria', 'Oratio', 'Lectio', 'Graduale', 'Sequentia', 'Evangelium', 'credo', 'Offertorium', 'Secreta', 'praefatio', 'sanctus', 'canon', 'paternoster', 'agnus', 'Communio', 'Postcommunio']);
    // the pages rise with the order, in the Missal and in Kniewald
    const la = o.dijelovi.map((x: any) => x.strLa); expect(la).toEqual([...la].sort((a, b) => a - b)); expect(la[0]).toBe(216);   // Introibo, p. 216
    const hr = o.dijelovi.filter((x: any) => x.strHr).map((x: any) => x.strHr); expect(hr).toEqual([...hr].sort((a: number, b: number) => a - b)); expect(hr[0]).toBe(8);
    const by = Object.fromEntries(o.dijelovi.map((x: any) => [x.id, x]));
    expect([by.kyrie.strLa, by.gloria.strLa, by.credo.strLa, by.canon.strLa, by.paternoster.strLa, by.agnus.strLa]).toEqual([217, 217, 219, 299, 313, 318]);
    expect([by.kyrie.hr, by.gloria.hr, by.credo.hr, by.sanctus.hr, by.canon.hr, by.paternoster.hr, by.agnus.hr]).toEqual(['Gospodine smiluj se', 'Slava', 'Vjerovanje', 'Svet, svet, svet', 'Čin mise', 'Oče naš', 'Jaganjče Božji']);
  });
  it('answers: Latin of the Missal (pp. 216–326), Croatian of Kniewald (pp. 8–30)', () => {
    const o = read('data/igra/red-mise.yaml'); const by = Object.fromEntries(o.odgovori.map((x: any) => [x.id, x]));
    expect(by.dominus).toMatchObject({ la: 'Dóminus vobíscum.', laOdg: 'Et cum spíritu tuo.', hr: 'Gospodin s vama!', hrOdg: 'I s duhom tvojim!', strLa: 217, strHr: 11 });
    expect(by.sursum).toMatchObject({ la: 'Sursum corda.', laOdg: 'Habémus ad Dóminum.', hr: 'Gore srca.', hrOdg: 'Imamo kod Gospodina.', strLa: 260, strHr: 19 });
    expect(by.ite).toMatchObject({ la: 'Ite, missa est.', laOdg: 'Deo grátias.', hrOdg: 'Bogu hvala.', strLa: 323, strHr: 30 });
    expect(by.introibo).toMatchObject({ laOdg: 'Ad Deum qui lætíficat iuventútem meam.', hrOdg: 'K Bogu, koji razveseljuje moju mladost.', strLa: 216, strHr: 8 });
    expect(o.odgovori.length).toBe(15);
    // the answers follow the order of the Mass
    const p = o.odgovori.map((x: any) => x.strLa); expect(p).toEqual([...p].sort((a, b) => a - b));
  });
  it('vocabulary: every word has a printed entry, a page and forms; draft meanings are marked', () => {
    const d = read('data/igra/rjecnik.yaml');
    expect(d.izvor).toMatch(/Žepić.*1881/); expect(d.rijeci.length).toBeGreaterThan(150);
    for (const w of d.rijeci) { expect(w.n, w.k).toBeTruthy(); expect(w.hr, w.k).toBeTruthy(); expect(w.str, w.k).toBeGreaterThan(0); expect(w.oblici.length, w.k).toBeGreaterThan(0); }
    expect(d.rijeci.filter((w: any) => w.nacrt).length).toBe(0);
    const by = Object.fromEntries(d.rijeci.map((w: any) => [w.k, w]));
    expect(by.dominus).toMatchObject({ n: 'dominus, i, m.', hr: 'gospodin', str: 318 });   // read on the page image, p. 318
    expect(by.altare).toMatchObject({ hr: 'žrtvenik', str: 67 }); expect(by.verbum).toMatchObject({ hr: 'riječ', tiskano: 'rieč' });
  });
});

describe('game: every round of the range', () => {
  const r = verifyData('dist');
  it('has no problem in any round, for the three age bands', () => { expect(r.problems.slice(0, 20)).toEqual([]); });
  it('covers every Sunday and every feast of I or II class from 22 Nov 2026 to the end of 2036', () => {
    expect(r.counts.from).toBe('2026-11-22'); expect(r.counts.to >= '2036-12-25').toBe(true);
    expect(r.counts.rounds).toBe(979); expect(r.counts.sundays).toBe(528); expect(r.counts.byBand).toEqual({ a: 979, b: 979, c: 979 }); expect(r.counts.withoutGospel).toBe(0);
  });
  it('specific days reflect the rubrics', () => {
    const { all } = loadIgra('dist'); const day = (d: string) => all.find(x => x.d === d)!;
    expect(day('2026-11-29')).toMatchObject({ t: '1. NEDJELJA DOŠAŠĆA', k: 'v', g: 0, cr: 1 });           // Advent: violet, no Gloria
    expect(day('2026-11-29').p).not.toContain('gloria'); expect(day('2026-12-25').p).toContain('gloria');
    expect(day('2026-12-25').ml).toBe('Danja misa');                                                     // principal Mass of Christmas Day
    expect(day('2027-03-21').p).not.toContain('pristupne');                                             // Palm Sunday: Code of Rubrics n. 424c
    expect(day('2027-02-02').p).not.toContain('pristupne');                                             // Candlemas: n. 424a
    expect(day('2027-11-02').k).toBe('b');                                                              // All Souls
    expect(day('2027-03-28').p).toContain('Sequentia');                                                 // Easter: Victimae paschali
    expect(day('2027-12-12').k).toBe('p');                                                              // Gaudete: rose
  });
  it('liturgical years begin on the First Sunday of Advent', () => { expect(adventOf(2026)).toBe('2026-11-29'); expect(adventOf(2027)).toBe('2027-11-28'); expect(litYear('2026-11-22')).toBe(2025); expect(litYear('2027-11-27')).toBe(2026); });
});
