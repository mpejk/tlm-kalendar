// npx tsx scripts/tmp/view.ts 2016-12-13 [n] [sectionKey]
import { generalConfig, POPE_OLD_SITE } from '../../src/engine/config';
import { getDay } from '../../src/engine/engine';
import { parseIso } from '../../src/engine/dates';
import { assembleMass } from '../../src/assembler/assemble';
import { loadCorpus } from '../../src/assembler/corpus-node';
const [date, n, key] = process.argv.slice(2);
const day = getDay(parseIso(date), generalConfig(POPE_OLD_SITE));
console.log(day.title, '| cls', day.cls, day.celebration.kind, day.celebration.id, day.temporalId, day.season, '| masses', JSON.stringify(day.masses), '| comm', day.commemorations.map(c => c.type + ':' + c.id + ':' + c.key).join(', '));
const v = assembleMass(day, +(n ?? 0), loadCorpus());
if (!v) { console.log('no mass'); process.exit(); }
console.log(v.rankLine, 'pref', v.preface);
for (const it of v.items) { if (it.kind === 'note') { console.log('  NOTE', it.text); continue; } if (key && it.key !== key) continue;
  console.log('##', it.key, it.la); for (const b of it.blocks) { if (b.label) console.log('  [' + b.label + ']'); for (const l of b.lines) console.log('   ', l.k, (l.mark ?? ''), l.la.slice(0, key ? 2000 : 110)); } }
