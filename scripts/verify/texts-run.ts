import fs from 'node:fs';
import { comparePage } from './texts-lib';
const filter = process.argv[2] ?? '';
const files: string[] = []; const seen = new Set<string>();
for (const y of ['2017', '2018']) for (const f of fs.readdirSync('data/golden/masses/' + y).sort()) { if (!f.startsWith('propers_') || seen.has(f) || !f.includes(filter)) continue; seen.add(f); files.push(`data/golden/masses/${y}/${f}`); }
let ok = 0, secs = 0, exact = 0, near = 0; const cats: Record<string, number> = {}; const lines: string[] = [];
for (const f of files) {
  const r = comparePage(f); secs += r.sections; exact += r.exact; near += r.near;
  if (!r.problems.length) ok++;
  for (const p of r.problems) { const c = p.split(/[ :]/)[0] + (p.startsWith('text') ? ' ' + p.split(' ')[1] : ''); cats[c] = (cats[c] || 0) + 1; lines.push(`${r.date}_${r.n} ${p}`); }
}
fs.writeFileSync('scripts/tmp/text-problems.txt', lines.join('\n'));
console.log({ pages: files.length, pagesOk: ok, sections: secs, exact, near, problems: lines.length });
console.log(Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v} ${k}`).join(' | '));
