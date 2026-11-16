// Build step: one .ics file per year and calendar (all-day events: the title of the day, class and commemorations).
import fs from 'node:fs';
import path from 'node:path';
import { getDay } from '../../src/engine/engine';
import { dayNumber, iso } from '../../src/engine/dates';
import { calendars, YEARS } from './data';

const ROMAN = ['', 'I', 'II', 'III', 'IV'];
const COMM: Record<string, string> = { privileged: 'spomen i na tihim i na pjevanim misama', ordinary: 'spomen na tihim misama', same: 'spomen pod istim završetkom na svim misama' };
const escText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
function fold(line: string): string { const out: string[] = []; let cur = ''; let bytes = 0; for (const ch of line) { const b = Buffer.byteLength(ch); if (bytes + b > 73) { out.push(cur); cur = ' '; bytes = 1; } cur += ch; bytes += b; } out.push(cur); return out.join('\r\n'); }
export default async function buildIcs(dist: string) {
  fs.mkdirSync(path.join(dist, 'ics'), { recursive: true });
  for (const [name, cfg] of Object.entries(calendars())) for (let y = YEARS.from; y <= YEARS.to; y++) {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//tlm-kalendar//Zagreb 1962//HR', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:Tradicionalna latinska misa ${y}. (${name === 'zagreb' ? 'Zagreb' : 'opći kalendar'})`];
    for (let n = dayNumber(y, 1, 1); n <= dayNumber(y, 12, 31); n++) {
      const d = getDay(n, cfg); const ds = d.date.replace(/-/g, ''); const next = iso(n + 1).replace(/-/g, '');
      const desc = [`${ROMAN[d.cls]}. razred`, ...d.commemorations.map(c => `${COMM[c.type]}: ${c.title}`), ...(d.notes ?? []), ...(d.rubricNotes ?? [])].join('\n');
      lines.push('BEGIN:VEVENT', `UID:${d.date}-${name}@tlm-kalendar`, `DTSTAMP:${y}0101T000000Z`, `DTSTART;VALUE=DATE:${ds}`, `DTEND;VALUE=DATE:${next}`, `SUMMARY:${escText(d.title)}`, `DESCRIPTION:${escText(desc)}`, 'TRANSP:TRANSPARENT', 'END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    fs.writeFileSync(path.join(dist, `ics/tlm-${y}-${name}.ics`), lines.map(fold).join('\r\n') + '\r\n');
  }
}
