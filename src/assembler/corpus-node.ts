// Loads the corpus from disk (Node only).
import fs from 'node:fs';
import { Corpus } from './types';
let cached: Corpus | null = null;
export function loadCorpus(fresh = false): Corpus {
  if (cached && !fresh) return cached;
  const dir = 'data/corpus/la/';
  cached = { formularies: JSON.parse(fs.readFileSync(dir + 'formularies.json', 'utf8')), texts: JSON.parse(fs.readFileSync(dir + 'texts.json', 'utf8')), ordo: JSON.parse(fs.readFileSync(dir + 'ordo.json', 'utf8')) };
  return cached;
}
