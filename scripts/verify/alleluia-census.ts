// Census for review findings T08-T10: chants whose number of Alleluias differs between the Latin and the Croatian column.
//   npx tsx scripts/verify/alleluia-census.ts <snapshot> [detail]
import fs from 'node:fs';
const s = JSON.parse(fs.readFileSync(`.cache/snap/${process.argv[2] ?? 'base'}.json`, 'utf8'));
const g = new Map<string, { views: Set<string>; la: string; hr: string; rows: number }>(); let rows = 0;
for (const [key, v] of Object.entries<any>(s.views)) for (const r of v.rows) {
  if (!/^(Introitus|Graduale|Offertorium|Communio)/.test(r[0])) continue;
  const la = s.texts[r[1]].normalize('NFC'), hr = s.texts[r[2]].normalize('NFC'); if (hr === '∅') continue;
  const nLa = (la.match(/allel[uú][ij]a/gi) ?? []).length, nHr = (hr.match(/alelu[jy]a/gi) ?? []).length;
  if (nLa === nHr) continue; rows++;
  const k = `${r[0].split(' ')[0]} la=${nLa} hr=${nHr} | ${la.replace(/\n/g, ' ').slice(0, 70)}`;
  const e = g.get(k) ?? { views: new Set(), la, hr, rows: 0 }; e.views.add(key); e.rows++; g.set(k, e);
}
const all = new Set<string>();
for (const [k, e] of [...g].sort()) { for (const x of e.views) all.add(x); console.log(`${k} | ${e.views.size} views e.g. ${[...e.views].slice(0, 2).join(' ')}`); if (process.argv[3]) console.log(`    LA: ${e.la.replace(/\n/g, ' / ')}\n    HR: ${e.hr.replace(/\n/g, ' / ')}`); }
console.log(`${g.size} distinct chants, ${rows} occurrences, ${all.size} views`);
