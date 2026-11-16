// Corrections of the Croatian shown on the site (data/tm/corrections.yaml), applied by the build after the translation memory.
// Two kinds of entry:
//   { id, la, hr, source, why }              the Croatian of the Latin block `la` (matched on its normalised proper words) is `hr`
//   { id, find, replace, where?, section?, why }   in every Croatian cell that contains `find` (only in formularies whose id
//                                            starts with `where`, and only in the section `section`, if given) it becomes `replace`
// An entry that matches nothing fails the build, so the file cannot go stale unnoticed.
import fs from 'node:fs';
import YAML from 'yaml';
import { coreLa } from '../../src/assembler/norm';

export interface Correction { id: string; la?: string; hr?: string; find?: string; replace?: string; where?: string | string[]; section?: string; /** only where the Latin beside it contains this text */ ifLatin?: string; source?: string; why?: string }

export function makeCorrections(file = 'data/tm/corrections.yaml') {
  const list = (fs.existsSync(file) ? YAML.parse(fs.readFileSync(file, 'utf8')) ?? [] : []) as Correction[];
  const whole = new Map<string, Correction>(); const edits: Correction[] = []; const hits = new Map<Correction, number>();
  for (const c of list) {
    if (c.la && c.hr !== undefined) whole.set(coreLa(c.la), c);
    else if (c.find !== undefined && c.replace !== undefined) edits.push(c);
    else throw new Error(`${file}: entry ${c.id} needs la+hr or find+replace`);
    hits.set(c, 0);
  }
  const inScope = (c: Correction, fid: string) => !c.where || (Array.isArray(c.where) ? c.where : [c.where]).some(w => fid === w || fid.startsWith(w));
  return {
    /** Croatian that replaces whatever the memory gives for this Latin block, or undefined. */
    whole(core: string): Correction | undefined { const c = whole.get(core); if (c) hits.set(c, hits.get(c)! + 1); return c; },
    /** Applies the find/replace entries to one Croatian cell of formulary `fid`. */
    edit(hr: string, fid: string, section?: string, latin?: string): string {
      for (const c of edits) if (hr.includes(c.find!) && inScope(c, fid) && (!c.section || c.section === section) && (!c.ifLatin || (latin ?? '').includes(c.ifLatin))) { hr = hr.split(c.find!).join(c.replace!); hits.set(c, hits.get(c)! + 1); }
      return hr;
    },
    /** Fails if an entry was never used. */
    check(): void { const dead = [...hits].filter(([, n]) => !n).map(([c]) => c.id); if (dead.length) throw new Error(`${file}: entries that matched nothing: ${dead.join(', ')}`); },
    report(): { id: string; n: number }[] { return [...hits].map(([c, n]) => ({ id: c.id, n })); },
  };
}
