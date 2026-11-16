// Loads the calendar tables (Node only; the site build serialises the result).
import fs from 'node:fs';
import YAML from 'yaml';
import { CalendarConfig, SanctoralEntry } from './types';

export function loadSanctoral(file = 'data/calendar/sanctoral.yaml'): SanctoralEntry[] {
  return YAML.parse(fs.readFileSync(file, 'utf8')) as SanctoralEntry[];
}
export const POPE_OLD_SITE = { name: 'Franjo', date: '03-19' };
export function generalConfig(pope = POPE_OLD_SITE): CalendarConfig { return { sanctoral: loadSanctoral(), pope }; }
