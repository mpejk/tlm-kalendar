import fs from 'node:fs';
const [an, bn, sec, nmax, seed] = process.argv.slice(2);
const A = JSON.parse(fs.readFileSync(`.cache/snap/${an}.json`, 'utf8')), B = JSON.parse(fs.readFileSync(`.cache/snap/${bn}.json`, 'utf8'));
const seen = new Set<string>(); const out: string[] = [];
for (const [k, v] of Object.entries<any>(B.views)) { const a = A.views[k]; if (!a) continue;
  for (const r of v.rows) { if (!r[0].startsWith(sec)) continue; const ra = a.rows.find((x: any) => x[0] === r[0] && A.texts[x[1]].slice(0, 30) === B.texts[r[1]].slice(0, 30)); if (!ra || ra[2] === r[2]) continue; const key = ra[2] + r[2]; if (seen.has(key)) continue; seen.add(key);
    out.push(`${k}\n  LA: ${B.texts[r[1]].replace(/\n/g, ' / ')}\n  −: ${A.texts[ra[2]].replace(/\n/g, ' / ')}\n  +: ${B.texts[r[2]].replace(/\n/g, ' / ')}`); } }
console.log(out.length, 'distinct changes'); const step = Math.max(1, Math.floor(out.length / Number(nmax ?? 10)));
for (let i = Number(seed ?? 0); i < out.length; i += step) console.log(out[i]);
