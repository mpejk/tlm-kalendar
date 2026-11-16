// Survey for review findings T05/T12: prayers shown with a placeholder (Latin "N.", Croatian "I."), by formulary.
import fs from 'node:fs';
const s = JSON.parse(fs.readFileSync(`.cache/snap/${process.argv[2] ?? 'base'}.json`, 'utf8'));
const g = new Map<string, { n: number; views: Set<string>; la: string; hr: string; title: Set<string> }>();
for (const [key, v] of Object.entries<any>(s.views)) for (const r of v.rows) {
  const la = s.texts[r[1]], hr = s.texts[r[2]];
  const laN = /(^|[\s(])N\.(?=p?([\s,;:.)]|$))/.test(la), hrI = /(^|[\s(])(I|N)\.(?=[\s,;:.)]|$)/.test(hr.replace(/<[^>]+>/g, ''));
  if (!laN && !hrI) continue;
  if (!/^(Oratio|Secreta|Postcommunio|SuperPopulum|rite)/.test(r[0])) continue;
  const sec = r[0].replace(/#\d+/, '').replace(/ \[.*/, ''); const lab = (r[0].match(/\{(.*)\}/)?.[1] ?? v.title).replace(/^spomen[^:]*: /, '');
  const k = `${laN ? 'LA' : '  '}${hrI ? 'HR' : '  '} | ${sec} | ${la.slice(0, 60)}`;
  const e = g.get(k) ?? { n: 0, views: new Set(), la, hr, title: new Set() }; e.n++; e.views.add(key); e.title.add(lab); g.set(k, e);
}
let tot = new Set<string>();
for (const [k, e] of [...g].sort()) { for (const x of e.views) tot.add(x); console.log(`${k} | ${e.views.size} views | ${[...e.title].slice(0, 6).join(' ; ')}${e.title.size > 6 ? ` … (${e.title.size})` : ''}`); if (process.argv[3]) console.log('     HR: ' + e.hr.replace(/\n/g, ' / ').slice(0, 200)); }
console.log(g.size, 'distinct blocks;', tot.size, 'views');
