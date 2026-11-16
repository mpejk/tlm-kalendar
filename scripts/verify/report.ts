// Collects the verification results into DIFFS.md.   npx tsx scripts/verify/report.ts   (after the tests and the build)
import fs from 'node:fs';
const read = (f: string, d: any = null) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);
const cal = fs.existsSync('data/verify/diffs-calendar.md') ? fs.readFileSync('data/verify/diffs-calendar.md', 'utf8').trim() : '# Calendar differences from the old site\n\n(run the tests)';
const t = read('data/verify/texts-result.json'), h = read('data/verify/croatian-result.json');
const md: string[] = ['# Differences from the old site (tradicionalnamisa.com)', '', '## Calendar', '', cal.replace(/^# .*\n+/, ''), ''];
if (t) {
  md.push('## Mass texts, Latin', '', `Mass pages compared: ${t.pages} (every harvested Mass page of the 2017 and 2018 year pages; the December pages that appear twice are counted once). Sections compared: ${t.sections}.`, '',
    `- identical after normalising accents, case, punctuation, spacing and spelling (æ/ae, j/i …): **${t.sectionsExact}**`,
    `- differing only in spelling or by an old-site typo (the Divinum Officium spelling is shown): **${t.sectionsSpellingOnly}**`,
    `- listed exceptions: **${t.sectionsExcepted}** sections on ${new Set(t.exceptions.flatMap((e: any) => e.pages)).size} pages`, '', `Pages identical in every section: ${t.pagesIdentical} of ${t.pages}.`, '', '### Exceptions and their causes', '');
  for (const e of t.exceptions) if (e.pages.length) md.push(`- ${e.cause} — pages: ${e.pages.join(', ')}`);
  md.push('', 'Latin taken from the old site instead of Divinum Officium (where the old site has the text of the 1962 Missal): see `data/corpus/la/OVERRIDES.md`.', '');
}
if (h) md.push('## Mass texts, Croatian', '', `Text units compared (prayers block by block, other sections as a whole): ${h.units}.`, '',
  `- identical to the page: **${h.identical}**`, `- the old site renders the same Latin in more than one way; the most frequent rendering is shown (see TM-CONFLICTS.md): **${h.otherRendering}**`,
  `- on pages with a Latin exception listed above: **${h.latinException}**`, `- no Croatian shown although the page has one: **${h.missing}**`, `- different text: **${h.different}**`, '');
fs.writeFileSync('DIFFS.md', md.join('\n'));

const cov = read('data/verify/coverage.json'); const rg = read('data/tm/rite-gaps.json', []);
if (cov) {
  const c = cov.coverage; const g: string[] = ['# Gaps: Latin shown alone with the note "hrvatski prijevod nedostaje"', '',
    `Croatian coverage of the Masses of 2026–2036 (both calendars), distinct text blocks: ${c.unique}; from the old site ${c.uniqueSite}; from Kniewald ${c.uniqueKniewald}; missing ${c.uniqueMissing}.`,
    `Counting every occurrence over the eleven years: ${c.blocks} blocks; old site ${c.site}; Kniewald ${c.kniewald}; missing ${c.missing}.`, '', '## Mass texts without Croatian', ''];
  for (const x of cov.gaps) g.push(`- ${x.sec.replace('|', ' — ')} (${x.where}; first on ${x.first}, ${x.n}× in 2026–2036${x.cal === 'zagreb' ? ', Zagreb calendar' : ''}): ${x.la.slice(0, 110)}${x.la.length > 110 ? '…' : ''}`);
  g.push('', '## Rites without Croatian (rows)', '');
  const by: Record<string, number> = {}; for (const r of rg) { const k = r.key.split('#')[0]; by[k] = (by[k] || 0) + 1; }
  for (const [k, n] of Object.entries(by)) g.push(`- ${k}: ${n} rows (Latin from Divinum Officium; the old site has no page for this rite)`);
  g.push('', 'To fill a gap: add the Croatian to `data/tm/kniewald-found.json` (ids in `data/tm/gaps-for-kniewald.json` and `data/tm/rite-gaps.json`), run `npx tsx scripts/croatian/apply-kniewald.ts`, then `npm run build`.', '');
  // GAPS.md is written by the build (scripts/build/za-prijevod.ts)
}
console.log('DIFFS.md written');
