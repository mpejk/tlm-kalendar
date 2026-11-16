import { generalConfig } from '../../src/engine/config';
import { getDay } from '../../src/engine/engine';
import { parseIso, iso } from '../../src/engine/dates';
const cfg = generalConfig({ name: 'Leo XIV', date: '05-18' });
const T: Record<string, string> = { privileged: 'ALL', ordinary: 'low', same: 'SAME' };
for (const a of process.argv.slice(2)) {
  const [s, e] = a.split('..'); 
  for (let n = parseIso(s); n <= parseIso(e || s); n++) { const d = getDay(n, cfg);
    console.log(d.date, 'NPUSČPS'[d.weekday], d.cls, d.colour, d.title, d.commemorations.map(c => `[${T[c.type]}: ${c.title}]`).join(''), d.masses.length > 1 ? 'x' + d.masses.length : '', d.celebration.transferredFrom ? '<-' + d.celebration.transferredFrom : '', d.omitted.length ? ' {omitted: ' + d.omitted.map(o => o.title.slice(0, 30) + ' – ' + o.reason).join('; ') + '}' : ''); }
  console.log('');
}
