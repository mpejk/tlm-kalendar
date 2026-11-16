// Calendar against the old site: every day from 27 Nov 2016 to 31 Dec 2019 must match on weekday, class, colour,
// title, commemorations (type and order) and number of Masses. Exceptions go to DIFFS.md.
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generalConfig, POPE_OLD_SITE } from '../src/engine/config';
import { getDay } from '../src/engine/engine';
import { parseIso } from '../src/engine/dates';

const WD = ['NED', 'PON', 'UTO', 'SRI', 'ČET', 'PET', 'SUB'];
export const TYPE: Record<string, string> = { privileged: 'spomen i na tihim i na pjevanim misama', ordinary: 'spomen na tihim misama', same: 'spomen pod istim završetkom na svim misama' };
const COL: Record<string, string> = { w: 'White', r: 'Red', v: 'Violet', g: 'Green', b: 'Black', p: 'Rose' };

describe('calendar against the old site (tradicionalnamisa.com/kalendar 2017–2019)', () => {
  const golden = JSON.parse(fs.readFileSync('data/golden/calendar.json', 'utf8'));
  const cfg = generalConfig(POPE_OLD_SITE);
  const seen = new Set<string>(); const diffs: string[] = []; let n = 0;
  for (const r of golden) {
    if (seen.has(r.date)) continue; seen.add(r.date); n++;
    const d = getDay(parseIso(r.date), cfg);
    const mine: Record<string, unknown> = {
      weekday: WD[d.weekday], class: ['', 'I', 'II', 'III', 'IV'][d.cls], colour: COL[d.colour], colours: (d.colours ?? []).map(c => COL[c]).join('+'), title: d.title,
      commemorations: d.commemorations.map(c => (c.onlyMass !== undefined ? 'samo zornica: ' : '') + TYPE[c.type] + ': ' + c.title).join(' | '),
      masses: d.flags.noMass ? 0 : d.masses.filter(m => !m.extra).length,
    };
    const theirs: Record<string, unknown> = { weekday: r.weekday, class: r.class, colour: r.colour, colours: (r.colours ?? []).join('+'), title: r.title, commemorations: r.notes.map((x: any) => x.type + ': ' + x.title).join(' | '), masses: r.masses.length };
    for (const k of Object.keys(mine)) if (mine[k] !== theirs[k]) diffs.push(`- ${r.date} ${k}: old site «${theirs[k]}», engine «${mine[k]}»`);
  }
  fs.writeFileSync('DIFFS.md', `# Calendar differences from the old site\n\nDays compared: ${n} (27 Nov 2016 – 31 Dec 2019). Fields: weekday, class, colour(s), title, commemorations (type and order), number of Masses.\n\n` + (diffs.length ? diffs.join('\n') : 'No differences.') + '\n');
  it('covers 27 Nov 2016 – 31 Dec 2019', () => { expect(n).toBe(1130); });
  it('matches every row', () => { expect(diffs).toEqual([]); });
});
