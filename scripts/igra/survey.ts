import { loadDist, zagrebDays, isRound, principal, massOf, sectionOf, hrOf } from './lib';
const D = loadDist('dist'); const days = zagrebDays(D); const R = days.filter(isRound);
console.log('days', days.length, 'rounds', R.length, 'sundays', R.filter(d => d.weekday === 0).length);
const multi = new Map<string, string>(); const kinds = new Map<string, number>(); const forms = new Set<string>(); let noHr = 0;
for (const d of R) {
  if (d.masses.length > 1) multi.set(d.title + ' | ' + d.masses.map(m => `${m.kind}${m.extra ? '+' : ''}:${m.label ?? m.id}`).join(' ; '), d.date + ' p=' + principal(d));
  kinds.set(d.celebration.kind + d.cls + d.colour, (kinds.get(d.celebration.kind + d.cls + d.colour) ?? 0) + 1);
  const v = massOf(D, d, principal(d)); forms.add(v.formulary);
  const g = sectionOf(v, 'Evangelium'); if (!g || !hrOf(D, g)) { noHr++; console.log('no hr gospel', d.date, d.title); }
  if (v.colour !== d.colour) console.log('colour differs', d.date, d.title, d.colour, v.colour, d.colours);
}
for (const [k, v] of multi) console.log(v, k);
console.log([...kinds].join(' '), 'formularies', forms.size, 'noHr', noHr);
// days of I class that are not rounds
const not = new Map<string, string>(); for (const d of days) if (!isRound(d) && d.cls <= 2) not.set(d.title + ' ' + d.celebration.kind + d.cls, d.date); console.log([...not].map(x => x.join(' ')).join('\n'));
