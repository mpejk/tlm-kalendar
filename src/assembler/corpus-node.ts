// Loads the corpus from disk (Node only).
import fs from 'node:fs';
import YAML from 'yaml';
import { Corpus } from './types';
let cached: Corpus | null = null;
export function loadCorpus(fresh = false): Corpus {
  if (cached && !fresh) return cached;
  const dir = 'data/corpus/la/';
  cached = { formularies: JSON.parse(fs.readFileSync(dir + 'formularies.json', 'utf8')), texts: JSON.parse(fs.readFileSync(dir + 'texts.json', 'utf8')), ordo: JSON.parse(fs.readFileSync(dir + 'ordo.json', 'utf8')) };
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
  return cached;
}
