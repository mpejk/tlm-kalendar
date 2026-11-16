// Stage 3/7: every harvested Mass page of the old site is reproduced section by section (Latin), after normalising
// accents, case, punctuation, spacing and spelling variants. Exceptions are listed with their cause.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import YAML from 'yaml';
import { comparePage } from '../scripts/verify/texts-lib';

describe('Mass texts against the old site (Latin)', () => {
  it('reproduces every harvested Mass page, apart from the listed exceptions', () => {
    const exceptions = (YAML.parse(fs.readFileSync('data/verify/text-exceptions.yaml', 'utf8')) as { match: string; cause: string }[]).map(e => ({ ...e, re: new RegExp(e.match), hits: [] as string[] }));
    const files: string[] = []; const seen = new Set<string>();
    for (const y of ['2017', '2018']) for (const f of fs.readdirSync('data/golden/masses/' + y).sort()) { if (!f.startsWith('propers_') || seen.has(f)) continue; seen.add(f); files.push(`data/golden/masses/${y}/${f}`); }
    let sections = 0, exact = 0, near = 0, pagesOk = 0; const unexplained: string[] = [];
    for (const f of files) {
      const r = comparePage(f); sections += r.sections; exact += r.exact; near += r.near;
      if (!r.problems.length) pagesOk++;
      for (const p of r.problems) { const line = `${r.date}_${r.n} ${p}`; const e = exceptions.find(x => x.re.test(line)); if (e) e.hits.push(`${r.date}_${r.n}`); else unexplained.push(line.slice(0, 300)); }
    }
    const result = { pages: files.length, pagesIdentical: pagesOk, sections, sectionsExact: exact, sectionsSpellingOnly: near, sectionsExcepted: sections - exact - near,
      exceptions: exceptions.map(e => ({ cause: e.cause, pages: [...new Set(e.hits)] })) };
    fs.writeFileSync('data/verify/texts-result.json', JSON.stringify(result, null, 1));
    expect(unexplained).toEqual([]);
    expect(files.length).toBeGreaterThan(780);
  }, 120_000);
});
