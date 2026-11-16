import fs from 'node:fs';
import { generalConfig } from '../../src/engine/config';
import { getDay } from '../../src/engine/engine';
import { parseIso } from '../../src/engine/dates';
const golden = JSON.parse(fs.readFileSync('data/golden/calendar.json', 'utf8'));
const cfg = generalConfig();
const WD = ['NED', 'PON', 'UTO', 'SRI', 'ČET', 'PET', 'SUB'];
const TYPE: Record<string, string> = { privileged: 'spomen i na tihim i na pjevanim misama', ordinary: 'spomen na tihim misama', same: 'spomen pod istim završetkom na svim misama' };
const COL: Record<string, string> = { w: 'White', r: 'Red', v: 'Violet', g: 'Green', b: 'Black', p: 'Rose' };
let bad = 0, n = 0; const seen = new Set<string>();
const only = process.argv[2];
for (const r of golden) {
  if (seen.has(r.date)) continue; seen.add(r.date); n++;
  const d = getDay(parseIso(r.date), cfg);
  const mine = { wd: WD[d.weekday], cls: ['', 'I', 'II', 'III', 'IV'][d.cls], col: COL[d.colour], title: d.title,
    notes: d.commemorations.map(c => (c.onlyMass !== undefined ? 'samo zornica: ' : '') + TYPE[c.type] + ': ' + c.title).join(' | '), nm: d.masses.filter(m => !(d.flags.noMass)).length };
  const theirs = { wd: r.weekday, cls: r.class, col: r.colour, title: r.title, notes: r.notes.map((x: any) => x.type + ': ' + x.title).join(' | '), nm: r.masses.length };
  const diffs = Object.keys(mine).filter(k => (mine as any)[k] !== (theirs as any)[k]);
  if (diffs.length) { bad++; if (!only || diffs.includes(only)) if (bad <= 80) console.log(r.date, diffs.map(k => `${k}: «${(theirs as any)[k]}» ≠ «${(mine as any)[k]}»`).join('; ')); }
}
console.log({ days: n, bad });
