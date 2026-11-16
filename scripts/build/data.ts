// Build step 1: data files of the site.
//   dist/data/base.js          labels, fixed prayers, prefaces, Gloria and Credo, build information
//   dist/data/cal/<year>.js    the liturgical days of one year (general calendar; Zagreb days that differ)
//   dist/data/f/<id>.js        one Mass formulary: Latin units, variants, and Croatian by block key
// Everything is loaded with script tags (works from file://).
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { CalendarConfig, Day } from '../../src/engine/types';
import { loadSanctoral } from '../../src/engine/config';
import { getDay } from '../../src/engine/engine';
import { dayNumber } from '../../src/engine/dates';
import { assembleMass, formulariesFor, LABELS, PREFACES, NOTE } from '../../src/assembler/assemble';
import { loadCorpus } from '../../src/assembler/corpus-node';
import { blockCore, hashKey } from '../../src/assembler/norm';
import { Block, Formulary, Section, Unit } from '../../src/assembler/types';
import { makeResolver, resolveLines, Hit } from '../croatian/resolve';

export const YEARS = { from: 2026, to: 2036 };
export const POPE = { name: 'Lav XIV.', date: '05-18' };
const PRAYER = new Set(['Oratio', 'Secreta', 'Postcommunio', 'SuperPopulum']);
export const fileOf = (id: string) => id.replace(/[^A-Za-z0-9]+/g, '_');

export function calendars(): Record<string, CalendarConfig> {
  const sanctoral = loadSanctoral();
  const general: CalendarConfig = { sanctoral, pope: POPE };
  let zagreb: CalendarConfig = general;
  if (fs.existsSync('data/local/zagreb.yaml')) {
    const z = YAML.parse(fs.readFileSync('data/local/zagreb.yaml', 'utf8'));
    zagreb = { sanctoral: z.sanctoral ?? sanctoral, local: z.feasts ?? [], localNotes: z.notes ?? [], pope: POPE };
    if (z.replace) { const drop = new Set<string>(z.replace); zagreb.sanctoral = sanctoral.filter(e => !drop.has(e.date + '|' + e.id)); }
  }
  return { opci: general, zagreb };
}
const clean = (o: any): any => JSON.parse(JSON.stringify(o));

export function buildData(dist: string) {
  const corpus = loadCorpus(); const resolve = makeResolver(); const cals = calendars();
  const hr: Record<string, Record<string, any>> = {}; const used = new Set<string>();
  const stats = { masses: 0, blocks: 0, site: 0, siteVariant: 0, kniewald: 0, missing: 0 };
  const uniq = new Map<string, string>(); const gaps = new Map<string, { n: number; where: string; la: string; sec: string; first: string; cal: string }>();
  fs.mkdirSync(path.join(dist, 'data/cal'), { recursive: true }); fs.mkdirSync(path.join(dist, 'data/f'), { recursive: true });
  const kn = fs.existsSync('data/tm/kniewald.json') ? JSON.parse(fs.readFileSync('data/tm/kniewald.json', 'utf8')) as Record<string, { hr: string; ref: string }> : {};

  const visit = (day: Day, cal: string) => {
    day.masses.forEach((m, i) => {
      if (m.kind !== 'mass') { used.add(m.id); return; }
      const v = assembleMass(day, i, corpus); if (!v) throw new Error(`no Mass for ${day.date} #${i} ${m.id}`);
      stats.masses++; for (const id of formulariesFor(day, i)) used.add(id);
      for (const it of v.items) {
        if (it.kind !== 'section') continue;
        const units: { lines: Block['lines']; src: string }[] = PRAYER.has(it.key) ? it.blocks.map(b => ({ lines: b.lines, src: b.src ?? it.src! })) : [{ lines: it.blocks.flatMap(b => b.lines), src: it.src! }];
        for (const u of units) {
          const core = blockCore(u.lines); if (!core) continue;
          const key = hashKey(core); const fid = u.src.split('|')[0];
          stats.blocks++;
          const table = (hr[fid] ??= {}); if (table[key] !== undefined) { tally(table[key]); continue; }
          const h: Hit | null = PRAYER.has(it.key) ? resolve(core) : resolveLines(resolve, u.lines, blockCore);
          const k = kn[core];
          let val: any = null;
          if (h) val = h.via === 'exact' || h.via === 'typo' ? { t: h.hr } : { t: h.hr, v: h.diff || h.via };
          if (k) val = val ? { ...val, kn: k.hr, knRef: k.ref } : { kn: k.hr, knRef: k.ref };
          table[key] = val; tally(val); uniq.set(fid + key, val ? (val.t ? 'site' : 'kniewald') : 'missing');
          if (!val) { const g = gaps.get(fid + key) ?? { n: 0, where: day.title, la: u.lines.filter(l => l.k === 'text').map(l => l.la).join(' ').slice(0, 160), sec: `${u.src}`, first: day.date, cal }; g.n++; gaps.set(fid + key, g); }
        }
      }
    });
  };
  function tally(val: any) { if (!val) stats.missing++; else if (val.t) { stats.site++; if (val.v) stats.siteVariant++; } else stats.kniewald++; }

  for (let y = YEARS.from; y <= YEARS.to; y++) {
    const gen: Day[] = []; const zag: Record<string, Day> = {};
    for (let n = dayNumber(y, 1, 1); n <= dayNumber(y, 12, 31); n++) {
      const d = getDay(n, cals.opci); gen.push(d); visit(d, 'opci');
      if (cals.zagreb !== cals.opci) { const z = getDay(n, cals.zagreb); if (JSON.stringify(clean(z)) !== JSON.stringify(clean(d))) { zag[z.date.slice(5)] = z; visit(z, 'zagreb'); } }
    }
    fs.writeFileSync(path.join(dist, `data/cal/${y}.js`), `TLM.cal(${y},${JSON.stringify(clean({ opci: gen, zagreb: zag }))});\n`);
  }
  // formulary files
  const inline = (u: Unit[]): Unit[] => u.map(x => (x.k === 'text' && x.x ? { k: 'text', la: corpus.texts[x.x], ...(x.mark ? { mark: x.mark } : {}) } : x)) as Unit[];
  let bytes = 0; const missingFormularies: string[] = [];
  for (const id of [...used].sort()) {
    const f = corpus.formularies[id] as Formulary | undefined; if (!f) { if (!/:|Quad6-[56]r/.test(id)) missingFormularies.push(id); continue; }
    const out: any = { officium: f.officium, rule: f.rule, ruleInherited: f.ruleInherited, fallback: f.fallback, from: f.from, sections: {}, hr: hr[id] ?? {} };
    for (const [n, u] of Object.entries(f.sections)) out.sections[n] = inline(u);
    if (f.variants) { out.variants = {}; for (const [vn, v] of Object.entries(f.variants)) { out.variants[vn] = {}; for (const [n, u] of Object.entries(v)) out.variants[vn][n] = u ? inline(u) : null; } }
    const js = `TLM.f(${JSON.stringify(id)},${JSON.stringify(out)});\n`; bytes += js.length;
    fs.writeFileSync(path.join(dist, `data/f/${fileOf(id)}.js`), js);
  }
  // base: fixed texts
  const g = JSON.parse(fs.readFileSync('data/golden/masses/2017/propers_20161225_2.json', 'utf8'));
  const hidden: Record<string, { la: string; hr: string }> = {};
  for (const it of g.items) if (it.hidden && it.rows?.[0]) hidden[it.id] = { la: it.rows[0].la, hr: it.rows[0].hr };
  const ordoInline = { prayers: Object.fromEntries(Object.entries(corpus.ordo.prayers).map(([k, u]) => [k, inline(u)])), prefaces: Object.fromEntries(Object.entries(corpus.ordo.prefaces).map(([k, u]) => [k, inline(u)])) };
  const coverage = { ...stats, unique: uniq.size, uniqueSite: [...uniq.values()].filter(x => x === 'site').length, uniqueKniewald: [...uniq.values()].filter(x => x === 'kniewald').length, uniqueMissing: [...uniq.values()].filter(x => x === 'missing').length };
  const base = { years: YEARS, pope: POPE, ordo: ordoInline, gloria: hidden.tableGloria, credo: hidden.tableCredo, built: new Date().toISOString().slice(0, 10), coverage, hasZagreb: cals.zagreb !== cals.opci };
  fs.writeFileSync(path.join(dist, 'data/base.js'), `TLM.base(${JSON.stringify(base)});\n`);
  fs.mkdirSync('data/verify', { recursive: true });
  fs.writeFileSync('data/verify/coverage.json', JSON.stringify({ coverage, missingFormularies, gaps: [...gaps.values()].sort((a, b) => b.n - a.n) }, null, 1));
  return { coverage, formularies: used.size, formularyBytes: bytes, missingFormularies };
}
