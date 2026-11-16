// Counts, per finding of the review, the views (calendar | date | Mass or rite) whose published content changed between the
// revision reviewed (snapshot "base") and the current build (snapshot "final").   npx tsx scripts/verify/review-counts.ts
import fs from 'node:fs';
const A = JSON.parse(fs.readFileSync('.cache/snap/base.json', 'utf8')), B = JSON.parse(fs.readFileSync('.cache/snap/final.json', 'utf8'));
const N = (s: string) => (s ?? '').normalize('NFC');
const ids: Record<string, Set<string>> = {}; const hit = (id: string, key: string) => (ids[id] ??= new Set()).add(key);
const other = new Map<string, number>(); const samples = new Map<string, number>();
const al = (s: string, re = /al+el[uú][ijy]a/gi) => (s.match(re) ?? []).length;
for (const key of new Set([...Object.keys(A.views), ...Object.keys(B.views)])) {
  const a = A.views[key], b = B.views[key];
  if (!a || !b) { hit(/-04-25|-05-01/.test(key) ? 'R04+' : 'other-view', key); continue; }
  const rowsA = new Map<string, [string, string]>(), rowsB = new Map<string, [string, string]>(); const k2 = (r: any, T: any, seen: Map<string, number>) => { const base = r[0].replace(/\{.*\}/, '{}') + '|' + N(T[r[1]]).slice(0, 25); const n = seen.get(base) ?? 0; seen.set(base, n + 1); return base + '#' + n; };
  let s1 = new Map<string, number>(); for (const r of a.rows) rowsA.set(k2(r, A.texts, s1), [N(A.texts[r[1]]), N(A.texts[r[2]])]);
  s1 = new Map(); for (const r of b.rows) rowsB.set(k2(r, B.texts, s1), [N(B.texts[r[1]]), N(B.texts[r[2]])]);
  const laA = a.rows.map((r: any) => N(A.texts[r[1]])).join('\n'), laB = b.rows.map((r: any) => N(B.texts[r[1]])).join('\n'), hrA = a.rows.map((r: any) => N(A.texts[r[2]])).join('\n'), hrB = b.rows.map((r: any) => N(B.texts[r[2]])).join('\n');
  if (laA === laB && hrA === hrB) continue;
  const rite = b.rows.some((r: any) => r[0].startsWith('rite')); let any = false; const mark = (id: string) => { hit(id, key); any = true; };
  if (/Vazmeno bdijenje/.test(laB) && /Kýrie, eléison/.test(laB)) { mark('R01'); if (/Réspice étiam/.test(laB)) mark('H01'); mark('T12'); }
  if (rite && /smrt grijeha/.test(hrA) && !/smrt grijeha/.test(hrB)) { mark('H03'); if (/Papa nostro N\./.test(laA)) mark('T12'); }
  if (/NE govori se Nicejsko/.test(laA) && !/NE govori se Nicejsko/.test(laB) && /Prosna misa/.test(laB.split('\n')[0])) mark('R04');
  if (/Spomen sv\. Oca/.test(hrA.split('\n')[0]) !== /Spomen sv\. Oca/.test(hrB.split('\n')[0])) mark('R06');
  if (/Gospa Karmelska/.test(hrA.split('\n')[0]) && !/Gospa Karmelska/.test(hrB.split('\n')[0])) mark('R08');
  if (/Accépta tibi sit[^\n]*\n[^\n]*\n?/.test(laA) && /Pogledaj, Gospodine, na darove svoga naroda/.test(hrA) && al(hrA, /Pogledaj, Gospodine, na darove svoga naroda/g) !== al(hrB, /Pogledaj, Gospodine, na darove svoga naroda/g)) mark('T01');
  if (/njezinim zaslugama i zagovorom/.test(hrB) && !/njezinim zaslugama i zagovorom/.test(hrA)) mark('T02');
  if (/Tota decóra ingréditur/.test(laB) && !/Tota decóra ingréditur/.test(laA)) mark('T03');
  if (/fidélium defunctórum ab omni vínculo/.test(laB) && !/fidélium defunctórum ab omni vínculo/.test(laA)) mark('T04');
  if (/(sanctus|beátus) Antónii Abbas/.test(laA)) mark('T05');
  if (/beáta (Appollóniæ|Bibiánæ|Dorótheæ|Emerentiánæ|Margarítæ)|beátæ Christína /.test(laA)) mark('T05+');
  if (/pax sin per illos|niitti|operátus est ei mihi/.test(laA)) mark('T06');
  { const offA = a.rows.find((r: any) => r[0].startsWith('Offertorium')), offB = b.rows.find((r: any) => r[0].startsWith('Offertorium')); if (offA && offB && /svežeš/.test(A.texts[offA[2]]) && !/svežeš/.test(B.texts[offB[2]])) mark('T07'); }
  if (/Quinque prudéntes vírgines/.test(laB) && /-11-22\|/.test(key)) mark('T08');
  if (/Korinćamima|Božjom ravnošću/.test(hrA)) mark('T14');
  if (/I\. \[Benedikta\]|N\.p\b/.test(hrA + laA) || /blažen(oga|og|e) I\.|svetoga I\./.test(hrA) && !/blažen(oga|og|e) I\.|svetoga I\./.test(hrB) || /beát[io] N\. /.test(laA) && !/beát[io] N\. /.test(laB)) mark('T12');
  // chants
  let t9 = false, t10 = false, chant = false, lab = false, gap = false;
  for (const [rk, [la2, hr2]] of rowsB) { const o = rowsA.get(rk); const sec = rk.split(' ')[0].replace(/#.*/, '');
    if (!o) continue; const [la1, hr1] = o;
    if (/^(Offertorium|Communio)/.test(sec) && al(la2) > al(la1) && b.rows[0] && /easter/.test(JSON.stringify(b.rows[0])) === false && al(la2) >= 1 && la1 !== la2) t9 = true;
    if (/^(Offertorium|Communio|Introitus|Graduale)/.test(sec) && (al(la1) !== al(la2) || al(hr1, /alelu[jy]a/gi) !== al(hr2, /alelu[jy]a/gi))) { chant = true; if (/^(Offertorium|Communio)/.test(sec) && al(la2) < al(la1)) t10 = true; if (/^(Offertorium|Communio)/.test(sec) && al(la2) > al(la1)) t9 = true; }
    if (/^(Lectio|Evangelium)/.test(sec)) { const ref = (x: string) => x.split('\n').find(l => /\d+[:,]\s?\d/.test(l) && l.length < 40) ?? ''; const h0 = (x: string) => (x.split('\n')[0].length < 70 ? x.split('\n')[0] : (x.match(/\(\d+, \d+-\d+\)/)?.[0] ?? '')); if (ref(la1) !== ref(la2) || (hr1 !== '∅' && hr2 !== '∅' && h0(hr1) !== h0(hr2))) lab = true; }
    if (hr1 === '∅' && hr2 !== '∅') gap = true; }
  if (t9) mark('T09'); if (t10) mark('T10'); if (chant && !t9 && !t10) mark('Alleluia-other'); if (lab) mark('T13'); if (gap) mark('T11');
  if (!any && !t9 && !t10 && !chant && !lab && !gap) { hit('other', key); const d = [...rowsB].find(([rk, v]) => JSON.stringify(rowsA.get(rk)) !== JSON.stringify(v)); const k = d ? d[0].split('|')[0] : '?'; other.set(k, (other.get(k) ?? 0) + 1); if (d) { const o = rowsA.get(d[0]) ?? ['', '']; const f = (x: string, y: string) => { let i = 0; while (i < x.length && x[i] === y[i]) i++; return `«${x.slice(Math.max(0, i - 25), i + 40)}» → «${y.slice(Math.max(0, i - 25), i + 40)}»`.replace(/\n/g, ' / '); }; const sig = o[0] !== d[1][0] ? 'LA ' + f(o[0], d[1][0]) : 'HR ' + f(o[1], d[1][1]); samples.set(sig, (samples.get(sig) ?? 0) + 1); } }
}
const total = new Set<string>(); for (const s of Object.values(ids)) for (const k of s) total.add(k);
const out = Object.fromEntries(Object.entries(ids).sort().map(([k, v]) => [k, { views: v.size, example: [...v].sort()[0] }]));
console.log(JSON.stringify(out, null, 1)); console.log('views changed in all:', total.size, 'of', Object.keys(B.views).length); for (const [k, n] of [...samples].sort((a, b) => b[1] - a[1])) console.log(n, k);
fs.writeFileSync('data/verify/review-counts.json', JSON.stringify({ basis: 'views = calendar | date | Mass or rite; the general calendar has every day, the Zagreb calendar the days on which it differs', total: total.size, of: Object.keys(B.views).length, ids: out }, null, 1));
