// Imports the Latin once from the Divinum Officium data files into data/corpus/la/ (this project's own format).
//   formularies.json : { id: { officium, rule, fallback, sections: { name: Unit[] }, variants? } }   units reference texts by id
//   texts.json       : { textId: Latin }   (each text stored once)
//   ordo.json        : conclusions and other fixed prayers, prefaces, Gloria, Credo
// Run: npx tsx scripts/import/import-do.ts
import fs from 'node:fs';
import crypto from 'node:crypto';
import { generalConfig } from '../../src/engine/config';
import { getDay } from '../../src/engine/engine';
import { dayNumber } from '../../src/engine/dates';
// @ts-ignore
import { importFormulary, toUnits } from './formulary.mjs';
// @ts-ignore
import { getSection, parseFile } from './dofile.mjs';
// @ts-ignore
import { normLa } from '../lib/normalize.mjs';

const ids = new Set<string>();
const extraFile = 'data/corpus/extra-ids.json';
if (fs.existsSync(extraFile)) for (const x of JSON.parse(fs.readFileSync(extraFile, 'utf8'))) ids.add(x);
const cfg = generalConfig({ name: '', date: '99-99' });
for (let n = dayNumber(1961, 1, 1); n <= dayNumber(2100, 12, 31); n++) {
  const d = getDay(n, cfg);
  ids.add(d.celebration.id);
  for (const c of d.commemorations) ids.add(c.id);
  for (const m of d.masses) ids.add(m.id.split(':')[0]);
}
for (const x of ['Commune/C10', 'Commune/C10a', 'Commune/C10b', 'Commune/C10c', 'Commune/C10Pasc', 'Commune/Coronatio', 'Commune/Propaganda']) ids.add(x);
// Commons, for the local layer
for (const f of fs.readdirSync('data/raw/do/repo/web/www/horas/Latin/Commune')) if (/^C\d/.test(f)) ids.add('Commune/' + f.replace('.txt', ''));

const texts: Record<string, string> = {};
const tid = (la: string) => { const k = crypto.createHash('sha1').update(la).digest('hex').slice(0, 10); texts[k] = la; return k; };
const pack = (units: any[]) => units.map(u => (u.k === 'text' ? { k: 'text', x: tid(u.la), ...(u.mark ? { mark: u.mark } : {}) } : u));
const out: Record<string, any> = {};
const missing: string[] = [];
for (const id of [...ids].sort()) {
  const f = importFormulary(id, {});
  if (!f) { missing.push(id); continue; }
  const sections: Record<string, any> = {};
  for (const [n, u] of Object.entries<any[]>(f.sections)) sections[n] = pack(u);
  const entry: any = { officium: f.officium, rank: f.rank, rule: f.rule, ruleInherited: f.ruleInherited, fallback: f.fallback ?? undefined, sections, from: Object.keys(f.from).length ? f.from : undefined };
  // shorter form of the Mass (Ember Saturdays, Palm Sunday): store the sections that differ
  const b = importFormulary(id, { missa: 2 });
  const diff: Record<string, any> = {}; let any = false;
  for (const n of new Set([...Object.keys(f.sections), ...Object.keys(b.sections)])) {
    if (JSON.stringify(f.sections[n]) !== JSON.stringify(b.sections[n])) { diff[n] = b.sections[n] ? pack(b.sections[n]) : null; any = true; }
  }
  if (any) entry.variants = { brevior: diff };
  out[id] = entry;
}
// fixed texts
const ordo: any = { prayers: {}, prefaces: {} };
const prayers = parseFile('Ordo/Prayers', {});
for (const [n, lines] of Object.entries<string[]>(prayers.sections)) ordo.prayers[n] = pack(toUnits(lines));
const pref = parseFile('Ordo/Prefationes', {});
for (const [n, lines] of Object.entries<string[]>(pref.sections)) ordo.prefaces[n] = pack(toUnits(lines));
fs.mkdirSync('data/corpus/la', { recursive: true });
fs.writeFileSync('data/corpus/la/formularies.json', JSON.stringify(out, null, 0).replace(/\},"(Sancti|Tempora|Commune|Votive)\//g, '},\n"$1/'));
fs.writeFileSync('data/corpus/la/texts.json', JSON.stringify(texts, null, 0).replace(/","/g, '",\n"'));
fs.writeFileSync('data/corpus/la/ordo.json', JSON.stringify(ordo, null, 1));
fs.writeFileSync('data/corpus/la/SOURCE.md', `Imported from Divinum Officium (github.com/DivinumOfficium/divinum-officium, MIT), commit d6c806624c9dcff6c715ef2d4abc3c9dee25d412, files under web/www/missa/Latin and web/www/horas/Latin/Commune, evaluated for "Rubrics 1960 - 1960". Import script: scripts/import/import-do.ts.\n`);
console.log({ formularies: Object.keys(out).length, texts: Object.keys(texts).length, missing });
