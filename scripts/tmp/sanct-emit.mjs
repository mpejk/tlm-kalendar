// One-off: emits the first version of data/calendar/sanctoral.yaml from the automatic pairing plus manual entries.
// After this the YAML file is authoritative and edited by hand.
import fs from 'node:fs';
const auto = JSON.parse(fs.readFileSync('scripts/tmp/sanct-auto.json'));
const col = c => ({ White: 'w', Red: 'r', Violet: 'v', Green: 'g', Black: 'b', Rose: 'p' })[c] || '';
const rows = auto.map(a => ({ date: a.md, id: a.file, class: a.cls, colour: col(a.colour.split('/')[0]) || (/mučeni/i.test(a.hr) ? 'r' : 'w'), title: a.hr, la: a.la }));
const manual = [
  ['01-06', '01-06', 1, 'w', 'BOGOJAVLJENJE (TRI KRALJA)', 'In Epiphania Domini'],
  ['01-11', '01-11cc', 4, 'r', 'sv. Higin, papa i mučenik', 'S. Hygini Papæ et Martyris'],
  ['01-13', '01-13', 2, 'w', 'Krštenje Gospodina našega Isusa Krista', 'In Commemoratione Baptismatis Domini Nostri Jesu Christi'],
  ['01-25', '01-25r', 3, 'w', 'Obraćenje sv. Pavla', 'In Conversione S. Pauli Apostoli'],
  ['01-28', '01-28', 3, 'w', 'sv. Petar Nolasco, priznavalac', 'S. Petri Nolasci Confessoris'],
  ['01-28', '01-28t', 4, 'r', 'sv. Agneza (Janja, Ines), djevica, mučenica [na osminu njenog blagdana]', 'S. Agnetis Virginis et Martyris secundo'],
  ['02-04', '02-04', 3, 'w', 'sv. Andrija Corsini, biskup, priznavalac', 'S. Andreæ Corsini Episcopi et Confessoris'],
  ['02-11', '02-11', 3, 'w', 'Ukazanje BDM bezgrešno začete u Lourdesu (Gospa Lurdska)', 'In Apparitione Beatæ Mariæ Virginis Immaculatæ'],
  ['02-12', '02-12', 3, 'w', 'sedam osnivača Reda slugu BDM (Ordo Servorum Beatae Mariae Virginis), priznavaoci', 'Ss. Septem Fundatorum Ordinis Servorum B. M. V.'],
  ['02-22', '02-22', 2, 'w', 'Katedra sv. Petra', 'In Cathedra S. Petri Apostoli'],
  ['02-24', '02-24', 2, 'r', 'sv. Matija, apostol', 'S. Matthiæ Apostoli'],
  ['04-22', '04-22', 3, 'r', 'sv. Soter i sv. Kajo, pape, mučenici', 'Ss. Soteris et Caji Summorum Pontificum et Martyrum'],
  ['06-10', '06-10', 3, 'w', 'sv. Margareta Škotska, kraljica, udovica', 'S. Margaritæ Reginæ Viduæ'],
  ['06-30', '06-30', 3, 'r', 'Spomen sv. Pavla, apostola', 'In Commemoratione S. Pauli Apostoli'],
  ['09-22', '09-22', 3, 'w', 'sv. Toma iz Villanove, biskup, priznavalac', 'S. Thomæ de Villanova Episcopi et Confessoris'],
  ['09-22', '09-22o', 4, 'r', 'sv. Mauricije i drugovi, mučenici', 'Ss. Mauritii et Sociorum Martyrum'],
  ['12-25', '12-25', 1, 'w', 'BOŽIĆ (ROĐENJE GOSPODINA NAŠEGA ISUSA KRISTA)', 'In Nativitate Domini'],
  ['12-26', '12-26', 2, 'r', 'sv. Stjepan, prvomučenik', 'S. Stephani Protomartyris'],
  ['12-27', '12-27', 2, 'w', 'sv. Ivan, apostol i evanđelist', 'S. Joannis Apostoli et Evangelistæ'],
  ['12-28', '12-28r', 2, 'r', 'Nevina dječica', 'Ss. Innocentium'],
  ['12-29', '12-29r', 4, 'r', 'sv. Toma Becket, biskup, mučenik', 'S. Thomæ Cantuariensis Episcopi et Martyris'],
  ['12-31', '12-31r', 4, 'w', 'sv. Silvestar I., papa, priznavalac', 'S. Silvestri Papæ et Confessoris'],
];
for (const m of manual) rows.push({ date: m[0], id: m[1], class: m[2], colour: m[3], title: m[4], la: m[5] });
rows.sort((a, b) => a.date.localeCompare(b.date) || a.class - b.class);
const extra = {
  '01-01': { lord: true }, '01-06': { lord: true }, '01-13': { lord: true }, '02-02': { lord: true }, '07-01': { lord: true }, '08-06': { lord: true }, '09-14': { lord: true }, '11-09': { lord: true }, '12-25': { lord: true },
  '01-25r': { with: { title: 'sv. Petar, apostol' } }, '02-22': { with: { title: 'sv. Pavao, apostol' } }, '06-30': { with: { title: 'sv. Petar, apostol' } },
};
const q = s => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
const out = ['# 1962 general calendar, fixed dates. One entry per celebration.',
  '# date: MM-DD (in leap years the entries of 24-28 February are kept one day later)',
  '# id: Divinum Officium Sancti file holding the Mass; class: 1-3, or 4 = commemoration only',
  '# colour: w r v g b p; title: Croatian title in the old site\'s wording (capitals for I class are applied by the old site itself)',
  '# lord: feast of the Lord; vigil: a vigil; with: inseparable commemoration under one conclusion',
  '# Titles come from the old site\'s year pages 2017-2019; the few it never showed are worded in the same style (marked own: true).', ''];
const own = new Set(['04-22', '06-10', '09-22o']);
for (const r of rows) {
  const e = extra[r.id] || {};
  let line = `- { date: ${q(r.date)}, id: ${q(r.id)}, class: ${r.class}, colour: ${r.colour}, title: ${q(r.title)}`;
  if (e.lord) line += ', lord: true';
  if (/^bdijenje|^BADNJAK/i.test(r.title)) line += ', vigil: true';
  if (e.with) line += `, with: ${q(e.with.title)}`;
  if (own.has(r.id)) line += ', own: true';
  line += `, la: ${q(r.la)} }`;
  out.push(line);
}
fs.writeFileSync('data/calendar/sanctoral.yaml', out.join('\n') + '\n');
console.log(rows.length);
