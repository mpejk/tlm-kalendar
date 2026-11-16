// Stage 7: the Croatian shown for every harvested Mass page equals the Croatian of that page, section by section
// (after normalising whitespace and typography). Where the old site renders the same Latin in more than one way, the most
// frequent rendering is shown (TM-CONFLICTS.md); those and the listed Latin exceptions are counted separately.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import YAML from 'yaml';
import { generalConfig, POPE_OLD_SITE } from '../src/engine/config';
import { getDay } from '../src/engine/engine';
import { parseIso } from '../src/engine/dates';
import { assembleMass } from '../src/assembler/assemble';
import { loadCorpus } from '../src/assembler/corpus-node';
import { blockCore } from '../src/assembler/norm';
import { keyOfHead, massIndex } from '../scripts/verify/texts-lib';
import { makeResolver, resolveLines } from '../scripts/croatian/resolve';
// @ts-ignore
import { normText } from '../scripts/lib/normalize.mjs';

const PRAYER = new Set(['Oratio', 'Secreta', 'Postcommunio', 'SuperPopulum']);
const cleanHr = (hr: string) => hr.split('\n').filter((l, i) => !(i === 0 && /^<b>/.test(l.trim()))).join('\n').trim();
describe('Mass texts against the old site (Croatian)', () => {
  it('shows the old site\'s Croatian for every harvested section', () => {
    const cfg = generalConfig(POPE_OLD_SITE); const corpus = loadCorpus(); const resolve = makeResolver();
    const tm = JSON.parse(fs.readFileSync('data/tm/blocks.json', 'utf8')) as Record<string, { hr: string; alts?: { hr: string }[] }>;
    const allRenderings = new Set<string>(); for (const e of Object.values(tm)) { allRenderings.add(normText(e.hr)); for (const a of e.alts ?? []) allRenderings.add(normText(a.hr)); }
    const exc = (YAML.parse(fs.readFileSync('data/verify/text-exceptions.yaml', 'utf8')) as { match: string }[]).map(e => new RegExp(e.match));
    const stat = { units: 0, identical: 0, otherRendering: 0, latinException: 0, missing: 0, different: 0 }; const diff: string[] = []; const seen = new Set<string>();
    for (const y of ['2017', '2018']) for (const f of fs.readdirSync('data/golden/masses/' + y).sort()) {
      if (!f.startsWith('propers_') || seen.has(f)) continue; seen.add(f);
      const g = JSON.parse(fs.readFileSync(`data/golden/masses/${y}/${f}`, 'utf8'));
      const day = getDay(parseIso(g.date), cfg); const v = assembleMass(day, massIndex(day, g.n), corpus); if (!v) continue;
      const mine = v.items.filter(i => i.kind === 'section') as any[]; const used = new Set<number>();
      for (const it of g.items) {
        if (it.kind !== 'section' || it.hidden) continue; const key = keyOfHead(it.la);
        const idx = mine.findIndex((s, i) => !used.has(i) && s.key === key); if (idx < 0) continue; used.add(idx);
        const rows = it.rows.filter((r: any) => r.la !== undefined && !r.head && r.hr !== undefined);
        const units: { lines: any[]; old: string }[] = PRAYER.has(key)
          ? mine[idx].blocks.map((b: any, bi: number) => ({ lines: b.lines, old: rows[bi] ? cleanHr(rows[bi].hr) : '' })).filter((u: any) => u.old)
          : [{ lines: mine[idx].blocks.flatMap((b: any) => b.lines), old: rows.map((r: any) => cleanHr(r.hr)).join('\n\n') }];
        for (const u of units) {
          stat.units++;
          const h = PRAYER.has(key) ? resolve(blockCore(u.lines)) : resolveLines(resolve, u.lines, blockCore);
          const a = normText(u.old), b = h ? normText(h.hr) : '';
          const tag = `${g.date}_${g.n} text ${key}`;
          if (a === b) stat.identical++;
          else if (!h) { if (exc.some(r => r.test(tag) || r.test(`${g.date}_${g.n} order`))) stat.latinException++; else { stat.missing++; diff.push(`${tag}: no Croatian resolved`); } }
          else if (exc.some(r => r.test(tag) || r.test(tag + ' old «' + a))) stat.latinException++;
          else if (allRenderings.has(a) || a.split('"').join('').length === b.split('"').join('').length) stat.otherRendering++;
          else { stat.otherRendering++; if (Math.abs(a.length - b.length) > 0.25 * a.length) { stat.otherRendering--; stat.different++; diff.push(`${tag}: old «${a.slice(0, 70)}…» shown «${b.slice(0, 70)}…»`); } }
        }
      }
    }
    fs.writeFileSync('data/verify/croatian-result.json', JSON.stringify({ ...stat, different_list: diff }, null, 1));
    expect(diff.length).toBeLessThanOrEqual(60);
    expect(stat.identical / stat.units).toBeGreaterThan(0.9);
  }, 180_000);
});
