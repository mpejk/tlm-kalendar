// Finds prayer blocks where the assembled Latin still has an unfilled "N." while the old site prints the name, and prints
// override entries (old-site Latin for that formulary section).  npx tsx scripts/verify/suggest-overrides.ts >> data/corpus/overrides.yaml
import fs from 'node:fs';
import { generalConfig, POPE_OLD_SITE } from '../../src/engine/config';
import { getDay } from '../../src/engine/engine';
import { parseIso } from '../../src/engine/dates';
import { assembleMass } from '../../src/assembler/assemble';
import { loadCorpus } from '../../src/assembler/corpus-node';
import { keyOfHead, massIndex } from './texts-lib';
const cfg = generalConfig(POPE_OLD_SITE); const corpus = loadCorpus(); const done = new Set<string>();
for (const y of ['2017', '2018']) for (const f of fs.readdirSync('data/golden/masses/' + y).sort()) {
  if (!f.startsWith('propers_')) continue;
  const g = JSON.parse(fs.readFileSync(`data/golden/masses/${y}/${f}`, 'utf8'));
  const day = getDay(parseIso(g.date), cfg); const v = assembleMass(day, massIndex(day, g.n), corpus); if (!v) continue;
  const comms = day.commemorations.filter(c => c.onlyMass === undefined || c.onlyMass === g.n);
  for (const key of ['Oratio', 'Secreta', 'Postcommunio']) {
    const mine = v.items.filter((i: any) => i.kind === 'section' && i.key === key).pop() as any;
    const old = g.items.filter((i: any) => i.kind === 'section' && !i.hidden && keyOfHead(i.la) === key).pop();
    if (!mine || !old) continue;
    const rows = old.rows.filter((r: any) => r.la !== undefined && !r.head);
    mine.blocks.forEach((b: any, bi: number) => {
      const la = b.lines.filter((l: any) => l.k === 'text').map((l: any) => l.la).join(' ');
      if (!/\bN\.(\s|,|:|;|$)/.test(la) || !rows[bi] || /\bN\./.test(rows[bi].la)) return;
      const c = bi === 0 ? null : comms[bi - 1];
      if (c && (c.key.endsWith('+with') || c.kind === 'oration')) return;
      const formulary = bi === 0 ? v.formulary : c!.id; const id = formulary + ':' + key; if (done.has(id)) return; done.add(id);
      console.log(`- { formulary: ${formulary}, section: ${key}, page: ${y}/${f.replace('.json', '')}, key: ${key}, row: ${bi}, nth: -1, reason: "saint's name filled in as printed on the old site (the DO text has N.)" }`);
    });
  }
}
