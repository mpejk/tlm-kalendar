// data/tm/manual.json: Croatian for Latin blocks that the automatic matching rejects although the old site prints the same Mass
// section — the Latin differs by more than a typo (another psalter version, a clause more or less, Passion markers), or the old
// site's Latin cell is damaged. The Croatian is taken from the same place on the old site's page.
//   npx tsx scripts/croatian/build-manual.ts   (after build-blocks.ts; then rebuild)
import fs from 'node:fs';
import { generalConfig, POPE_OLD_SITE } from '../../src/engine/config';
import { getDay } from '../../src/engine/engine';
import { parseIso } from '../../src/engine/dates';
import { assembleMass } from '../../src/assembler/assemble';
import { loadCorpus } from '../../src/assembler/corpus-node';
import { blockCore } from '../../src/assembler/norm';
import { goldenCore, keyOfHead, massIndex, similarity } from '../verify/texts-lib';
import { makeResolver, resolveLines } from './resolve';

const PRAYER = new Set(['Oratio', 'Secreta', 'Postcommunio', 'SuperPopulum']);
const DAMAGED = [/-05-01_0 Postcommunio/];   // old-site Latin cell holds the Croatian text
const cleanHr = (hr: string) => hr.split('\n').filter((l, i) => !(i === 0 && /^<b>/.test(l.trim()))).join('\n').trim();
if (fs.existsSync('data/tm/manual.json')) fs.rmSync('data/tm/manual.json');
const cfg = generalConfig(POPE_OLD_SITE); const corpus = loadCorpus(); const resolve = makeResolver();
const out: Record<string, { hr: string; page: string; why: string }> = {}; const skipped: string[] = [];
for (const y of ['2017', '2018']) for (const f of fs.readdirSync('data/golden/masses/' + y).sort()) {
  if (!f.startsWith('propers_')) continue;
  const g = JSON.parse(fs.readFileSync(`data/golden/masses/${y}/${f}`, 'utf8'));
  const day = getDay(parseIso(g.date), cfg); const v = assembleMass(day, massIndex(day, g.n), corpus); if (!v) continue;
  const mine = v.items.filter(i => i.kind === 'section') as any[]; const used = new Set<number>();
  for (const it of g.items) {
    if (it.kind !== 'section' || it.hidden) continue; const key = keyOfHead(it.la);
    const idx = mine.findIndex((s, i) => !used.has(i) && s.key === key); if (idx < 0) continue; used.add(idx);
    const rows = it.rows.filter((r: any) => r.la !== undefined && !r.head && r.hr !== undefined);
    const units: { lines: any[]; old: string; oldCore: string }[] = PRAYER.has(key)
      ? mine[idx].blocks.map((b: any, bi: number) => ({ lines: b.lines, old: rows[bi] ? cleanHr(rows[bi].hr) : '', oldCore: rows[bi] ? goldenCore(rows[bi], key) : '' })).filter((u: any) => u.old)
      : [{ lines: mine[idx].blocks.flatMap((b: any) => b.lines), old: rows.map((r: any) => cleanHr(r.hr)).join('\n\n'), oldCore: rows.map((r: any) => goldenCore(r, key)).join(' ') }];
    for (const u of units) {
      const core = blockCore(u.lines); if (!core || out[core]) continue;
      const h = PRAYER.has(key) ? resolve(core) : resolveLines(resolve, u.lines, blockCore); if (h) continue;
      const tag = `${g.date}_${g.n} ${key}`; const sim = similarity(u.oldCore, core);
      if (sim >= 0.6 || DAMAGED.some(r => r.test(tag))) out[core] = { hr: u.old, page: f.replace('.json', ''), why: sim >= 0.6 ? `ista misa na staroj stranici, latinski tekst odstupa (sličnost ${sim.toFixed(2)})` : 'ista misa na staroj stranici, latinska ćelija oštećena' };
      else skipped.push(`${tag} sim=${sim.toFixed(2)}`);
    }
  }
}
fs.writeFileSync('data/tm/manual.json', JSON.stringify(out, null, 1));
console.log({ manual: Object.keys(out).length, skipped });
