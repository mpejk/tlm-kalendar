import { calendars } from '../build/data';
import { getDay } from '../../src/engine/engine';
import { parseIso } from '../../src/engine/dates';
import { assembleMass } from '../../src/assembler/assemble';
import { loadCorpus } from '../../src/assembler/corpus-node';
const c = calendars(); const corpus = loadCorpus();
for (const d of process.argv.slice(2)) { const z = getDay(parseIso(d), c.zagreb), g = getDay(parseIso(d), c.opci);
  const v = assembleMass(z, z.masses.findIndex(m => m.kind === 'mass'), corpus);
  console.log(d, ['N','P','U','S','Č','P','S'][z.weekday], `| ZG: ${z.title} (${z.cls}, ${z.colour}) [${z.commemorations.map(x => x.type[0] + ':' + x.title).join('; ')}] notes=${z.notes.join('/')} local=${z.flags.local} | OPĆI: ${g.title} (${g.cls}) | mass ${v?.formulary} secs=${v?.items.filter(i => i.kind === 'section').length} pref=${v?.preface} G=${v?.gloria} C=${v?.credo}`); }
