// Loads the calendar tables (Node only; the site build serialises the result).
import fs from 'node:fs';
import YAML from 'yaml';
import { CalendarConfig, NameForms, SanctoralEntry } from './types';

/** Names for the prayers of the Commons (data/calendar/names.yaml), keyed by sanctoral id or local id; "pope" for the Pope. */
export function loadNames(file = 'data/calendar/names.yaml'): Record<string, NameForms> {
  return fs.existsSync(file) ? (YAML.parse(fs.readFileSync(file, 'utf8')) ?? {}) as Record<string, NameForms> : {};
}
export function withNames<T extends SanctoralEntry>(entries: T[]): T[] {
  const names = loadNames();
  return entries.map(e => (names[e.id] ? { ...e, name: { la: names[e.id].la, hr: names[e.id].hr } } : e));
}
export function loadSanctoral(file = 'data/calendar/sanctoral.yaml'): SanctoralEntry[] {
  return withNames(YAML.parse(fs.readFileSync(file, 'utf8')) as SanctoralEntry[]);
}
/** The Pope of the configuration with the forms of his name from names.yaml. */
export function popeWithName<P extends { name: string; date: string }>(pope: P): P & { forms?: NameForms } { const n = loadNames().pope; return n ? { ...pope, forms: { la: n.la, hr: n.hr } } : pope; }
export const POPE_OLD_SITE = { name: 'Franjo', date: '03-19' };
export function generalConfig(pope: { name: string; date: string } = POPE_OLD_SITE): CalendarConfig { return { sanctoral: loadSanctoral(), pope: pope === POPE_OLD_SITE ? pope : popeWithName(pope) }; }
