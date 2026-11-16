// Loads the corpus from disk (Node only).
import fs from 'node:fs';
import YAML from 'yaml';
import { Corpus } from './types';
let cached: Corpus | null = null;
export function loadCorpus(fresh = false): Corpus {
  if (cached && !fresh) return cached;
  const dir = 'data/corpus/la/';
  cached = { formularies: JSON.parse(fs.readFileSync(dir + 'formularies.json', 'utf8')), texts: JSON.parse(fs.readFileSync(dir + 'texts.json', 'utf8')), ordo: JSON.parse(fs.readFileSync(dir + 'ordo.json', 'utf8')) };
  // Unicode: some source files hold accented letters as letter + combining accent; one composed form throughout, so that
  // the patterns of the assembler (Allelúja ...) and exact comparisons see the same text everywhere.
  // "~" is a line-joining mark of the source files, not text
  for (const k of Object.keys(cached.texts)) cached.texts[k] = cached.texts[k].normalize('NFC').replace(/\s*~\s*/g, ' ').trim();
  const nfc = (units: any[] | null | undefined) => { for (const u of units ?? []) if (typeof u.la === 'string') u.la = u.la.normalize('NFC'); };
  for (const f of Object.values(cached.formularies)) { for (const u of Object.values(f.sections)) nfc(u); for (const v of Object.values(f.variants ?? {})) for (const u of Object.values(v)) nfc(u); }
  for (const g of [cached.ordo.prayers, cached.ordo.prefaces]) for (const u of Object.values(g)) nfc(u);
  // local composite formularies (data/local/formularies.yaml): a base formulary with single sections taken from another one
  if (fs.existsSync('data/local/formularies.yaml')) {
    const loc = YAML.parse(fs.readFileSync('data/local/formularies.yaml', 'utf8')) as Record<string, { base: string; officium?: string; sections?: Record<string, string> }>;
    for (const [id, def] of Object.entries(loc ?? {})) {
      const base = cached.formularies[def.base]; if (!base) throw new Error(`local formulary ${id}: no base ${def.base}`);
      const f: any = JSON.parse(JSON.stringify(base)); if (def.officium) f.officium = def.officium;
      for (const [sec, from] of Object.entries(def.sections ?? {})) { const src = cached.formularies[from]?.sections[sec]; if (!src) throw new Error(`local formulary ${id}: no ${sec} in ${from}`); f.sections[sec] = JSON.parse(JSON.stringify(src)); }
      cached.formularies[id] = f;
    }
  }
  applyPatches(cached);
  return cached;
}

export interface Patch { id?: string; formulary: string; section: string; find: string; replace: string; source: string; why?: string; /** the whole text unit must equal `find` */ whole?: boolean }
/** Corrections of the Latin corpus (data/corpus/patches.yaml), applied every time the corpus is loaded: in the named formulary
 *  ("*" = every formulary) and section ("*" = every section) the text `find` becomes `replace`. A patch that matches nothing is
 *  an error, so that the file cannot go stale unnoticed. */
export function applyPatches(c: Corpus, file = 'data/corpus/patches.yaml'): void {
  if (!fs.existsSync(file)) return;
  const patches = (YAML.parse(fs.readFileSync(file, 'utf8')) ?? []) as Patch[];
  for (const p of patches) {
    let hits = 0;
    const fix = (units: any[] | null | undefined) => {
      for (let i = 0; i < (units ?? []).length; i++) {
        const u = units![i];
        if (u.k !== 'text' && u.k !== 'ref') continue;
        const t: string = u.k === 'text' && u.x ? c.texts[u.x] ?? '' : u.la ?? '';
        if (p.whole ? t.trim() !== p.find : !t.includes(p.find)) continue;
        if (u.k === 'text') { delete u.x; }
        u.la = p.whole ? p.replace : t.split(p.find).join(p.replace); hits++;
        if (!u.la.trim()) { units!.splice(i, 1); i--; }      // an empty replacement removes the unit
      }
    };
    for (const [id, f] of Object.entries(c.formularies)) {
      if (p.formulary !== '*' && p.formulary !== id) continue;
      for (const [name, units] of Object.entries(f.sections)) if (p.section === '*' || p.section === name) fix(units);
      for (const v of Object.values(f.variants ?? {})) for (const [name, units] of Object.entries(v)) if (p.section === '*' || p.section === name) fix(units);
    }
    if (p.formulary === 'Ordo' || p.formulary === '*') for (const group of [c.ordo.prayers, c.ordo.prefaces]) for (const [name, units] of Object.entries(group)) if (p.section === '*' || p.section === name) fix(units);
    if (!hits) throw new Error(`data/corpus/patches.yaml: patch ${p.id ?? ''} (${p.formulary} ${p.section}) matched nothing: «${p.find}»`);
  }
}
