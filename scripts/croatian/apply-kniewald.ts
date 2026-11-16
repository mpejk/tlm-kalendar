// Turns the Kniewald search result (data/tm/kniewald-found.json, ids from data/tm/gaps-for-kniewald.json and data/tm/rite-gaps.json)
// into the files the build reads: data/tm/kniewald.json { core: { hr, ref } } and data/tm/kniewald-rites.json { key: { hr, ref } }.
//   npx tsx scripts/croatian/apply-kniewald.ts   (then rebuild)
import fs from 'node:fs';
const read = (f: string, d: any) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);
const found = read('data/tm/kniewald-found.json', []) as { id: string; hr: string; ref: string; checked?: string; note?: string }[];
const gaps = read('data/tm/gaps-for-kniewald.json', []) as { id: string; core: string }[];
const blocks = read('data/tm/kniewald.json', {}) as Record<string, any>; const rites = read('data/tm/kniewald-rites.json', {}) as Record<string, any>;
let nb = 0, nr = 0;
for (const f of found) {
  if (!f.hr || !f.hr.trim()) continue;
  const g = gaps.find(x => x.id === f.id);
  const val = { hr: f.hr.trim(), ref: f.ref + (f.checked === 'ocr' ? ' (OCR, nije provjereno na slici)' : ''), checked: f.checked ?? 'ocr', note: f.note };
  if (g) { blocks[g.core] = val; nb++; } else if (/#\d+\.\d+$/.test(f.id)) { rites[f.id] = val; nr++; }
}
fs.writeFileSync('data/tm/kniewald.json', JSON.stringify(blocks, null, 1)); fs.writeFileSync('data/tm/kniewald-rites.json', JSON.stringify(rites, null, 1));
console.log({ blocks: nb, rites: nr, totalBlocks: Object.keys(blocks).length, totalRites: Object.keys(rites).length });
