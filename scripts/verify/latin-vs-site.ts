// Prayer blocks (collect, secret, postcommunion and their commemorations) whose Latin differs from the old site's beyond
// typos and small variants. Unless the case is a listed old-site error, the old site's Latin is adopted (it is the model):
//   npx tsx scripts/verify/latin-vs-site.ts          -> report
//   npx tsx scripts/verify/latin-vs-site.ts --write  -> appends override entries to data/corpus/overrides.yaml
import fs from 'node:fs';
import YAML from 'yaml';
import { generalConfig, POPE_OLD_SITE } from '../../src/engine/config';
import { getDay } from '../../src/engine/engine';
import { parseIso } from '../../src/engine/dates';
import { assembleMass } from '../../src/assembler/assemble';
import { loadCorpus } from '../../src/assembler/corpus-node';
import { blockCore } from '../../src/assembler/norm';
import { goldenCore, keyOfHead, similarity, massIndex } from './texts-lib';
import { makeResolver, typoOnly } from '../croatian/resolve';
const cfg = generalConfig(POPE_OLD_SITE); const corpus = loadCorpus(); const R: any = makeResolver();
const exc = (YAML.parse(fs.readFileSync('data/verify/text-exceptions.yaml', 'utf8')) as any[]).map(e => new RegExp(e.match));
const done = new Map<string, string>(); const out: string[] = []; const report: string[] = [];
for (const y of ['2017', '2018']) for (const f of fs.readdirSync('data/golden/masses/' + y).sort()) {
  if (!f.startsWith('propers_')) continue;
  const g = JSON.parse(fs.readFileSync(`data/golden/masses/${y}/${f}`, 'utf8'));
  const dd = getDay(parseIso(g.date), cfg); const v = assembleMass(dd, massIndex(dd, g.n), corpus); if (!v) continue;
  for (const key of ['Oratio', 'Secreta', 'Postcommunio', 'SuperPopulum']) {
    const mine = v.items.filter((i: any) => i.kind === 'section' && i.key === key) as any[];
    const old = g.items.filter((i: any) => i.kind === 'section' && !i.hidden && keyOfHead(i.la) === key);
    if (mine.length !== old.length) continue;
    mine.forEach((ms, si) => {
      const rows = old[si].rows.filter((r: any) => r.la !== undefined && !r.head);
      if (rows.length !== ms.blocks.length) { report.push(`BLOCKS ${g.date}_${g.n} ${key}: old ${rows.length} mine ${ms.blocks.length}`); return; }
      ms.blocks.forEach((b: any, bi: number) => {
        const a = goldenCore(rows[bi], key), m = blockCore(b.lines);
        if (a === m || !a || !m || typoOnly(a, m) || R.variantOnly(a, m) !== null) return;
        const tag = `${g.date}_${g.n} text ${key}`;
        if (exc.some(r => r.test(tag) || r.test(`${g.date}_${g.n} text ${key} old «${a}`))) return;
        const src = b.src as string; if (!src || done.has(src)) return; done.set(src, f);
        const [formulary, section] = src.split('|');
        report.push(`${similarity(a, m).toFixed(2)} ${src} <- ${f.slice(8, 18)} r${bi}\n     old: ${a.slice(0, 170)}\n    mine: ${m.slice(0, 170)}`);
        out.push(`- { formulary: ${formulary}, section: "${section}", page: ${y}/${f.replace('.json', '')}, key: ${key}, nth: ${si}, row: ${bi}, reason: "prayer as printed on the old site (differs from the DO file)" }`);
      });
    });
  }
}
console.log(report.join('\n')); console.log(out.length, 'override candidates');
if (process.argv.includes('--write')) fs.appendFileSync('data/corpus/overrides.yaml', out.join('\n') + '\n');
