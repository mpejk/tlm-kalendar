// Build step 1: data files of the site.
//   dist/data/base.js          labels, fixed prayers, prefaces, Gloria and Credo, build information
//   dist/data/cal/<year>.js    the liturgical days of one year (general calendar; Zagreb days that differ)
//   dist/data/f/<id>.js        one Mass formulary: Latin units, variants, and Croatian by block key
// Everything is loaded with script tags (works from file://).
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { CalendarConfig, Day } from '../../src/engine/types';
import { loadSanctoral, popeWithName, withNames } from '../../src/engine/config';
import { getDay } from '../../src/engine/engine';
import { dayNumber } from '../../src/engine/dates';
import { assembleMass, formulariesFor, LABELS, PREFACES, NOTE } from '../../src/assembler/assemble';
import { loadCorpus } from '../../src/assembler/corpus-node';
import { blockCore, hashKey } from '../../src/assembler/norm';
import { Block, Formulary, Section, Unit } from '../../src/assembler/types';
import { makeResolver, resolveLines, nearKey, Hit } from '../croatian/resolve';
import { buildRites } from './rites';
import { makeCorrections } from '../croatian/corrections';
import { reconcileAlleluia, reconcileGradual } from '../croatian/alleluia';
import { insertNameHr } from '../croatian/names';

export const YEARS = { from: 2026, to: 2036 };
export const POPE = { name: 'Lav XIV.', date: '05-18' };
const PRAYER = new Set(['Oratio', 'Secreta', 'Postcommunio', 'SuperPopulum']);
const ANTIPHON = new Set(['Introitus', 'Offertorium', 'Communio']);
export const fileOf = (id: string) => id.replace(/[^A-Za-z0-9]+/g, '_');

export function calendars(): Record<string, CalendarConfig> {
  const sanctoral = loadSanctoral();
  const pope = popeWithName(POPE);
  const general: CalendarConfig = { sanctoral, pope };
  let zagreb: CalendarConfig = general;
  if (fs.existsSync('data/local/zagreb.yaml')) {
    const z = YAML.parse(fs.readFileSync('data/local/zagreb.yaml', 'utf8'));
    zagreb = { sanctoral: z.sanctoral ?? sanctoral, local: withNames(z.feasts ?? []), localNotes: z.notes ?? [], pope };
    if (z.replace) { const drop = new Set<string>(z.replace); zagreb.sanctoral = sanctoral.filter(e => !drop.has(e.date + '|' + e.id)); }
  }
  return { opci: general, zagreb };
}
const clean = (o: any): any => JSON.parse(JSON.stringify(o));

export function buildData(dist: string) {
  const corpus = loadCorpus(); const resolve = makeResolver(); const cals = calendars(); const fix = makeCorrections();
  const hr: Record<string, Record<string, any>> = {}; const used = new Set<string>();
  const nameLog: any[] = [];
  const alleluiaLog: { fid: string; sec: string; date: string; hr: string }[] = [];
  const stats = { masses: 0, blocks: 0, site: 0, siteVariant: 0, kniewald: 0, missing: 0 };
  const uniq = new Map<string, string>(); const gaps = new Map<string, { n: number; where: string; la: string; sec: string; first: string; cal: string; core?: string }>();
  fs.mkdirSync(path.join(dist, 'data/cal'), { recursive: true }); fs.mkdirSync(path.join(dist, 'data/f'), { recursive: true });
  const kn = fs.existsSync('data/tm/kniewald.json') ? JSON.parse(fs.readFileSync('data/tm/kniewald.json', 'utf8')) as Record<string, { hr: string; ref: string }> : {};

  // Kniewald's version of blocks that the old site covers (found by scripts/kniewald/check.ts; uncorrected OCR), kept beside the
  // site's wording so that the primary Croatian can be switched with the one setting in data/site-config.json.
  const alt = fs.existsSync('data/tm/kniewald-alt.json') ? JSON.parse(fs.readFileSync('data/tm/kniewald-alt.json', 'utf8')) as Record<string, { kn: string; ref: string; status?: string }> : {};
  const siteConfig = fs.existsSync('data/site-config.json') ? JSON.parse(fs.readFileSync('data/site-config.json', 'utf8')) : {};
  const visit = (day: Day, cal: string) => {
    day.masses.forEach((m, i) => {
      if (m.kind !== 'mass') { used.add(m.id); return; }
      const v = assembleMass(day, i, corpus); if (!v) throw new Error(`no Mass for ${day.date} #${i} ${m.id}`);
      stats.masses++; for (const id of formulariesFor(day, i)) used.add(id);
      for (const it of v.items) {
        if (it.kind !== 'section') continue;
        const units: { lines: Block['lines']; src: string; nameHr?: Record<string, string>; label?: string }[] = PRAYER.has(it.key) ? it.blocks.map(b => ({ lines: b.lines, src: b.src ?? it.src!, nameHr: b.nameHr, label: b.label })) : [{ lines: it.blocks.flatMap(b => b.lines), src: it.src! }];
        for (const u of units) {
          const core = blockCore(u.lines); if (!core) continue;
          const key = hashKey(core); const fid = u.src.split('|')[0];
          stats.blocks++;
          const table = (hr[fid] ??= {}); if (table[key] !== undefined) { tally(table[key]); continue; }
          // the Croatian is looked up under the wording of the Common ("N."), the key is that of the text as shown
          const generic = u.lines.some(l => l.la0) ? blockCore(u.lines.map(l => ({ k: l.k, la: l.la0 ?? l.la }))) : core;
          const h: Hit | null = PRAYER.has(it.key) ? resolve(generic) : resolveLines(resolve, u.lines, blockCore);
          const kk = nearKey(kn, generic); const k = kk ? kn[kk] : undefined;
          let val: any = null;
          if (h) val = h.via === 'exact' || h.via === 'typo' ? { t: h.hr } : { t: h.hr, v: h.diff || h.via };
          const cor = fix.whole(generic) ?? (generic !== core ? fix.whole(core) : undefined); if (cor) val = { t: cor.hr!, c: cor.id };
          if (k) val = val ? { ...val, kn: k.hr, knRef: k.ref } : { kn: k.hr, knRef: k.ref };
          else if (val && h?.key && alt[h.key] && (alt[h.key].status ?? 'ok') === 'ok') val = { ...val, kn: alt[h.key].kn, knRef: alt[h.key].ref + ' (OCR)' };
          const laText = u.lines.map(l => l.la).join('\n');
          if (val?.t) val.t = fix.edit(val.t, fid, it.key, laText); if (val?.kn) val.kn = fix.edit(val.kn, fid, it.key, laText);
          if (u.nameHr) for (const f of ['t', 'kn']) if (val?.[f]) { const x = insertNameHr(val[f], u.nameHr); if (x !== val[f]) { if (f === (val.t ? 't' : 'kn')) nameLog.push({ date: day.date, cal, feast: (u.label ?? day.title).replace(/^spomen[^:]*: /, ''), sec: it.key, la: laText.split('\n')[0], hrBefore: val[f].split('\n').find((l: string) => /I\./.test(l)) ?? '', hr: x.split('\n').find((l: string, i: number) => l !== val[f].split('\n')[i]) ?? '' }); val[f] = x; } }
          if (ANTIPHON.has(it.key) || it.key === 'Graduale') for (const f of ['t', 'kn']) if (val?.[f]) { const r = it.key === 'Graduale' ? reconcileGradual(u.lines, val[f]) : reconcileAlleluia(u.lines, val[f]); if (r.changed) { val[f] = r.hr; if (f === 't') alleluiaLog.push({ fid, sec: it.key, date: day.date, hr: r.hr.split('\n').pop()!.slice(-60) }); } }
          table[key] = val; tally(val); uniq.set(fid + key, val ? (val.t ? 'site' : 'kniewald') : 'missing');
          if (!val) { const g = gaps.get(fid + key) ?? { n: 0, where: day.title, la: u.lines.filter(l => l.k === 'text').map(l => l.la).join(' '), sec: `${u.src}`, first: day.date, cal, core } as any; g.n++; gaps.set(fid + key, g); }
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
    const f = corpus.formularies[id] as Formulary | undefined; if (!f || (/Quad6-[56]r$/.test(id))) { if (!/:|Quad6-[56]r/.test(id)) missingFormularies.push(id); continue; }
    const out: any = { officium: f.officium, rule: f.rule, ruleInherited: f.ruleInherited, fallback: f.fallback, from: f.from, sections: {}, hr: hr[id] ?? {} };
    for (const [n, u] of Object.entries(f.sections)) out.sections[n] = inline(u);
    if (f.variants) { out.variants = {}; for (const [vn, v] of Object.entries(f.variants)) { out.variants[vn] = {}; for (const [n, u] of Object.entries(v)) out.variants[vn][n] = u ? inline(u) : null; } }
    const js = `TLM.f(${JSON.stringify(id)},${JSON.stringify(out)});\n`; bytes += js.length;
    fs.writeFileSync(path.join(dist, `data/f/${fileOf(id)}.js`), js);
  }
  const rites = buildRites(dist, corpus, fix, cals.opci.pope?.forms);
  fix.check();
  // base: fixed texts
  const g = JSON.parse(fs.readFileSync('data/golden/masses/2017/propers_20161225_2.json', 'utf8'));
  const hidden: Record<string, { la: string; hr: string }> = {};
  for (const it of g.items) if (it.hidden && it.rows?.[0]) hidden[it.id] = { la: it.rows[0].la, hr: it.rows[0].hr };
  const ordoInline = { prayers: Object.fromEntries(Object.entries(corpus.ordo.prayers).map(([k, u]) => [k, inline(u)])), prefaces: Object.fromEntries(Object.entries(corpus.ordo.prefaces).map(([k, u]) => [k, inline(u)])) };
  const coverage = { ...stats, unique: uniq.size, uniqueSite: [...uniq.values()].filter(x => x === 'site').length, uniqueKniewald: [...uniq.values()].filter(x => x === 'kniewald').length, uniqueMissing: [...uniq.values()].filter(x => x === 'missing').length };
  const base = { years: YEARS, pope: POPE, ordo: ordoInline, gloria: hidden.tableGloria, credo: hidden.tableCredo, built: new Date().toISOString().slice(0, 10), coverage, croatianPrimary: siteConfig.croatianPrimary === 'kniewald' ? 'kniewald' : 'site', hasZagreb: cals.zagreb !== cals.opci };
  fs.writeFileSync(path.join(dist, 'data/base.js'), `TLM.base(${JSON.stringify(base)});\n`);
  fs.mkdirSync('data/verify', { recursive: true });
  fs.writeFileSync('data/verify/name-insertions.json', JSON.stringify(nameLog, null, 1));
  fs.writeFileSync('data/verify/alleluia-croatian.json', JSON.stringify(alleluiaLog, null, 1));
  fs.writeFileSync('data/verify/coverage.json', JSON.stringify({ coverage, rites, missingFormularies, gaps: [...gaps.values()].sort((a, b) => b.n - a.n) }, null, 1));
  return { coverage, formularies: used.size, formularyBytes: bytes, missingFormularies };
}
