// Text corrections after the review of revision 25a6b7a (finding IDs as in ODGOVOR-NA-PROVJERU.md), checked on the built site
// data in dist/ exactly as the browser composes it. `npm test` builds first. Each test fails on the revision reviewed.
import { describe, expect, it } from 'vitest';
import { allViews } from '../scripts/verify/snapshot';

const views = allViews('dist');
const byKey = new Map(views.map(v => [v.key, v]));
const NFC = (s: string) => s.normalize('NFC');
/** [Latin, Croatian] of a section of one view; cal|date|massIndex */
const sec = (key: string, name: string, n = 0): [string, string] => { const v = byKey.get(key); if (!v) throw new Error('no view ' + key); const r = v.rows.filter(x => x[0].startsWith(name))[n]; if (!r) throw new Error(`no ${name} in ${key}`); return [NFC(r[1]), NFC(r[2])]; };
const massRows = views.flatMap(v => v.rows.filter(r => /^(Introitus|Oratio|Lectio|Graduale|Evangelium|Offertorium|Secreta|Communio|Postcommunio)/.test(r[0])).map(r => ({ key: v.key, day: v.day, label: r[0], la: NFC(r[1]), hr: NFC(r[2]) })));
const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

describe('T01 secret Accepta tibi sit has its own translation', () => {
  it('nowhere beside this Latin stands the Croatian of Hostias, Domine, tuae plebis intende', () => {
    const rows = massRows.filter(r => r.la.startsWith('Accépta tibi sit, Dómine, sacrátæ plebis oblátio'));
    expect(rows.length).toBeGreaterThan(150);
    for (const r of rows) { expect(r.hr, r.key).toMatch(/^Neka ti bude, Gospodine, drag ovaj prinos/); expect(r.hr).not.toMatch(/Pogledaj, Gospodine, na darove/); }
  });
  it('Hostias, Domine, tuae plebis keeps its own', () => { for (const r of massRows.filter(x => x.la.startsWith('Hóstias, Dómine, tuæ plebis inténde'))) expect(r.hr).toMatch(/^Pogledaj, Gospodine, na darove svoga naroda/); });
});

describe('St Gertrude, 16 November (Missal 1962, p. 719)', () => {
  it('T02 collect: ipsius meritis et intercessione is translated', () => { const [la, hr] = sec('opci|2027-11-16|0', 'Oratio'); expect(la).toMatch(/ipsíus méritis et intercessióne/); expect(hr).toMatch(/prebivalište, njezinim zaslugama i zagovorom blago očisti/); });
  it('T14 epistle: Korinćanima, Božjom revnošću', () => { const [, hr] = sec('opci|2027-11-16|0', 'Lectio'); expect(hr).toMatch(/Korinćanima/); expect(hr).toMatch(/Božjom revnošću/); });
  it('T14 no displayed text has the two typos', () => { for (const r of massRows) { expect(r.hr, r.key).not.toMatch(/Korinćamima/); expect(r.hr, r.key).not.toMatch(/Božjom ravnošću/); } });
});

describe('T03 Assumption, gradual (Missal 1962, p. 628)', () => {
  for (const y of [2026, 2027, 2036]) it(`${y}`, () => {
    const [la, hr] = sec(`opci|${y}-08-15|0`, 'Graduale');
    expect(la).toMatch(/Audi, fília, et vide, et inclína aurem tuam, et concupíscet Rex pulchritúdinem tuam\.\nV\. Tota decóra ingréditur fília Regis, textúræ áureæ sunt amíctus ejus\.\nAllelúja, allelúja\.\nV\. Assúmpta est María in cælum: gaudet exércitus Angelórum\. Allelúja\./);
    expect(la).not.toMatch(/decórem tuum|Omnis glória/);
    expect(hr).toMatch(/kralj će zavoljeti tvoju ljepotu\. Kraljeva kći ulazi sva krasna, njezino je odijelo izvezeno zlatom\./);
  });
});

describe('T04 All Souls, tract (Missal 1962, pp. 706, 708)', () => {
  for (const i of [0, 1, 2]) it(`Mass ${i + 1}`, () => { for (const y of [2026, 2031, 2036]) { const key = views.find(v => v.day.celebration.key === 'S:11-02' && v.day.date.startsWith(String(y)) && v.key.startsWith('opci') && v.key.endsWith('|' + i))!.key; expect(sec(key, 'Graduale')[0]).toMatch(/Absólve, Dómine, ánimas ómnium fidélium defunctórum ab omni vínculo delictórum/); } });
});

describe('T05 names in the right case', () => {
  it('St Anthony, abbot: sanctus Antonius, beatus Antonius; the collect keeps the genitive', () => {
    expect(sec('opci|2028-01-17|0', 'Secreta')[0]).toMatch(/sanctus Antónius Abbas/); expect(sec('opci|2028-01-17|0', 'Postcommunio')[0]).toMatch(/beátus Antónius Abbas/); expect(sec('opci|2028-01-17|0', 'Oratio')[0]).toMatch(/beáti Antónii Abbátis/);
  });
  it('no prayer joins beatus/sanctus with a genitive name, or beata with one, anywhere', () => {
    for (const r of massRows) if (/^(Oratio|Secreta|Postcommunio)/.test(r.label)) { expect(r.la, r.key).not.toMatch(/\b(beátus|sanctus) \p{Lu}\p{L}+ii\b/u); expect(r.la, r.key).not.toMatch(/intercedénte beáta \p{Lu}\p{L}+æ\b/u); expect(r.la, r.key).not.toMatch(/beátæ \p{Lu}\p{L}+a Vírginis/u); }
  });
});

describe('T06 misprints of the Latin', () => {
  it('none of the three is left anywhere', () => { for (const r of massRows) expect(r.la, r.key).not.toMatch(/pax sin per illos|niitti|operátus est ei mihi/); });
  it('the right readings stand', () => { expect(sec('opci|2027-10-04|0', 'Lectio')[0]).toMatch(/pax super illos/); expect(sec('opci|2026-09-29|0', 'Evangelium')[0]).toMatch(/habéntem mitti in ignem/); expect(sec('opci|2028-01-25|0', 'Graduale')[0]).toMatch(/operátus est et mihi inter gentes/); });
  it('the corrected texts kept their Croatian', () => { for (const k of ['opci|2027-10-04|0', 'opci|2026-09-29|0']) for (const s of ['Lectio', 'Evangelium']) expect(sec(k, s)[1]).not.toBe('∅'); expect(sec('opci|2028-01-25|0', 'Graduale')[1]).not.toBe('∅'); expect(sec('opci|2035-01-25|0', 'Graduale')[1]).not.toBe('∅'); });
});

describe('T07 Chair of St Peter, offertory', () => {
  it('the Croatian ends where the Latin ends', () => { const [la, hr] = sec('opci|2027-02-22|0', 'Offertorium'); expect(la).toMatch(/et tibi dabo claves regni cœlórum\.$/); expect(hr).toMatch(/A tebi ću dati ključeve kraljevstva nebeskoga\.$/); expect(hr).not.toMatch(/svežeš|razriješiš/); });
});

describe('T08–T10 Alleluia (Code of Rubrics nn. 429, 478, 504)', () => {
  it('T08 St Cecilia: the Croatian has the opening and the closing Alleluia', () => { const [la, hr] = sec('opci|2027-11-22|0', 'Graduale'); expect(count(la, /allel[úu][ij]a/gi)).toBe(3); expect(count(hr, /aleluja/gi)).toBe(3); expect(hr).toMatch(/<i>Aleluja<\/i>, <i>aleluja<\/i>\.\nPet je mudrih djevica[^\n]*Kristu Gospodinu, <i>aleluja<\/i>\.$/); });
  it('T09 Annunciation transferred into Paschaltide, 5 April 2027: Alleluia at the offertory and communion, both languages', () => {
    for (const s of ['Offertorium', 'Communio']) { const [la, hr] = sec('opci|2027-04-05|0', s); expect(la).toMatch(/, allelúja\.$/); expect(hr).toMatch(/aleluja<\/i>\.$/i); }
  });
  it('T09 every offertory and communion antiphon of Paschaltide ends with Alleluia in both languages', () => {
    let n = 0;
    for (const r of massRows) if (/^(Offertorium|Communio)/.test(r.label) && r.day.season === 'easter' && r.day.celebration.key !== 'S:11-02') { n++; expect(r.la, r.key + ' ' + r.label).toMatch(/allel[úu][ij]a\.?\)?$/i); if (r.hr !== '∅') expect(r.hr.split('\n').filter(l => l.trim() && !/^\[.*\]$/.test(l.trim())).pop(), r.key + ' ' + r.label).toMatch(/alelu[jy]a(<\/i>)?\s*[.!]?$/i); }
    expect(n).toBeGreaterThan(1000);
  });
  it('T10 Sts Vincent and Anastasius after Septuagesima, 22 January 2035: no Alleluia at the offertory; kept in other years', () => {
    expect(sec('opci|2035-01-22|0', 'Offertorium')[0]).toMatch(/benedíctus Deus\.$/); expect(sec('opci|2035-01-22|0', 'Offertorium')[1]).not.toMatch(/aleluja/i);
    expect(sec('opci|2026-01-22|0', 'Offertorium')[0]).toMatch(/benedíctus Deus, allelúja\.$/); expect(sec('opci|2026-01-22|0', 'Offertorium')[1]).toMatch(/aleluja/i);
  });
  it('T10 from Septuagesima to Easter no chant has an Alleluia, in either language', () => {
    for (const r of massRows) if (['septuagesima', 'lent', 'passion'].includes(r.day.season) && /^(Introitus|Graduale|Offertorium|Communio)/.test(r.label) && r.day.temporalId !== 'Quad6-6') { expect(r.la.replace(/\n[A-Z][^\n]*Allelúja cum[^\n]*/g, ''), r.key + ' ' + r.label).not.toMatch(/allel[úu][ij]a/i); expect(r.hr, r.key + ' ' + r.label).not.toMatch(/alelu[jy]a/i); }
  });
  it('in every chant the two columns have the same number of Alleluias', () => {
    for (const r of massRows) if (/^(Introitus|Graduale|Offertorium|Communio)/.test(r.label) && r.hr !== '∅') expect(count(r.hr, /alelu[jy]a/gi), r.key + ' ' + r.label).toBe(count(r.la.split('\n').filter(l => !/Allelúja cum/.test(l)).join('\n'), /allel[úu][ij]a/gi));
  });
  it('Easter Sunday: the gradual begins Haec dies (Missal 1962, p. 329)', () => { expect(sec('opci|2027-03-28|0', 'Graduale')[0]).toMatch(/^Ps\. 117:24; 117:1\nHæc dies/); });
});

describe('T13 Scripture reference labels (labels of the Missal 1962)', () => {
  const label = (key: string, name: string, n = 0) => { const [la, hr] = sec(key, name, n); return [la.split('\n').find(l => /\d+[:,]\s?\d/.test(l) && l.length < 40) ?? '', hr.split('\n')[0].trim()]; };
  const cases: [string, string, string, 'LA' | 'HR', string][] = [
    ['Peter Nolasco', 'opci|2027-01-28|0', 'Lectio', 'HR', '1 Kor 4, 9-14'], ['Ash Wednesday', 'opci|2026-02-18|1', 'Evangelium', 'HR', 'Mt 6, 16-21'], ['Thursday after Ash Wednesday', 'opci|2026-02-19|0', 'Evangelium', 'HR', 'Mt 8, 5-13'],
    ['Saturday of the 2nd week of Lent', 'opci|2026-03-07|0', 'Lectio', 'LA', 'Gen 27:6-39'], ['Tuesday of the 3rd week of Lent', 'opci|2026-03-10|0', 'Lectio', 'HR', '2* Kr 4, 1-7'], ['Tuesday of Passion week', 'opci|2026-03-24|0', 'Evangelium', 'HR', 'Iv 7, 1-13'],
    ['Friday of Passion week', 'opci|2026-03-27|0', 'Lectio', 'HR', 'Jr 17, 13-18'], ['Wednesday of Holy Week, first reading', 'opci|2026-04-01|0', 'Lectio', 'LA', 'Isa 62:11; 63:1-7'], ['Easter Friday', 'opci|2026-04-10|0', 'Lectio', 'HR', '1 Pt 3, 18-22'],
    ['Vigil of Pentecost', 'opci|2026-05-23|0', 'Lectio', 'HR', 'Dj 19, 1-8'], ['Whit Monday', 'opci|2026-05-25|0', 'Lectio', 'HR', 'Dj 10, 34 i 42-48'], ['19th Sunday after Pentecost', 'opci|2026-10-04|0', 'Lectio', 'HR', 'Ef 4, 23-28'],
    ['Aloysius Gonzaga', 'opci|2027-06-21|0', 'Evangelium', 'HR', 'Mt 22, 29-40'], ['Vigil of Sts Peter and Paul', 'opci|2027-06-28|0', 'Evangelium', 'LA', 'Joannes 21:15-19'], ['7th Sunday after Pentecost (beyond the list)', 'opci|2026-07-12|0', 'Lectio', 'HR', 'Rim 6, 19-23'],
  ];
  for (const [name, key, s, col, want] of cases) it(`${name}: ${col} ${want}`, () => { expect(label(key, s)[col === 'LA' ? 0 : 1]).toBe(want); });
  it('Common Mass Statuit (Kniewald): Jak 1, 12-18', () => { expect(sec('zagreb|2026-02-10|0', 'Lectio')[1]).toMatch(/\(1, 12-18\)/); });
  it('the 3rd Sunday after Epiphany and Monday of Passion week keep their own (correct) labels', () => { expect(label('opci|2028-01-23|0', 'Evangelium')[1]).toBe('Mt 8, 1-13'); expect(label('opci|2026-03-23|0', 'Evangelium')[1]).toBe('Iv 7, 32-39'); });
});
