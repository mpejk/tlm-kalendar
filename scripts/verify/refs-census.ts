// Census for review finding T13: readings whose Croatian reference label does not agree with the Latin one (chapter and verses).
//   npx tsx scripts/verify/refs-census.ts <snapshot>
import fs from 'node:fs';
const s = JSON.parse(fs.readFileSync(`.cache/snap/${process.argv[2] ?? 'base'}.json`, 'utf8'));
/** "Acts 10:34; 10:42-48" or "Dj 10, 34 i 42-48" -> "10:34-34 10:42-48" */
export function canon(ref: string, latin: boolean): string {
  let t = ref.replace(/^\(|\)$/g, '').trim().replace(/^[1-4I]{1,3}\*?\.? (?=\p{L})/u, '').replace(/^\p{L}[\p{L}.*]*\s*/u, '');
  const out: string[] = []; let ch = '';
  if (latin) { for (const part of t.split(/[;,]\s*/)) { const m = part.trim().match(/^(?:(\d+):)?(\d+)(?:-(\d+))?$/); if (!m) return '?' + ref; if (m[1]) ch = m[1]; out.push(`${ch}:${m[2]}-${m[3] ?? m[2]}`); } }
  else { for (const seg of t.split(/;\s*/)) { const m = seg.trim().match(/^(\d+),\s*(.*)$/); if (!m) return '?' + ref; ch = m[1]; for (const v of m[2].split(/\s*(?:,| i | et )\s*/)) { const w = v.trim().match(/^(\d+)(?:-(\d+))?$/); if (!w) return '?' + ref; out.push(`${ch}:${w[1]}-${w[2] ?? w[1]}`); } } }
  return out.join(' ');
}
if (process.argv[1]?.endsWith('refs-census.ts')) {
  const g = new Map<string, Set<string>>();
  for (const [key, v] of Object.entries<any>(s.views)) for (const r of v.rows) {
    if (!/^(Lectio|Evangelium)/.test(r[0])) continue;
    const la = s.texts[r[1]].split('\n'), hr = s.texts[r[2]].split('\n'); if (hr[0] === '∅') continue;
    const lref = la.find((l: string) => /\d+[:,]\s?\d/.test(l) && l.length < 40) ?? ''; const href = hr[0].trim();
    const a = canon(lref, true), b = canon(href.replace(/\*/g, ''), false);
    if (a === b) continue;
    const k = `${r[0].split(' ')[0]} | LA ${lref} | HR ${href.slice(0, 60)}`; const e = g.get(k) ?? new Set(); e.add(key); g.set(k, e);
  }
  for (const [k, e] of [...g].sort()) console.log(`${k} | ${e.size} views e.g. ${[...e][0]}`);
  console.log(g.size, 'distinct');
}
