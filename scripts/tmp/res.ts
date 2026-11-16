import { generalConfig } from '../../src/engine/config';
import { getDay } from '../../src/engine/engine';
import { parseIso } from '../../src/engine/dates';
import { assembleMass } from '../../src/assembler/assemble';
import { loadCorpus } from '../../src/assembler/corpus-node';
import { blockCore } from '../../src/assembler/norm';
import { makeResolver, resolveLines } from '../croatian/resolve';
const [date, key, mi] = process.argv.slice(2);
const day = getDay(parseIso(date), generalConfig({ name: 'x', date: '05-18' })); const v = assembleMass(day, +(mi ?? 0), loadCorpus())!;
const resolve = makeResolver();
for (const it of v.items) if (it.kind === 'section' && it.key === key) { const ls = it.blocks.flatMap(b => b.lines); const core = blockCore(ls); console.log('CORE', core); const h = resolveLines(resolve, ls, blockCore); console.log(h ? { via: h.via, diff: h.diff, page: h.page, hr: h.hr.slice(0, 200) } : null); }
