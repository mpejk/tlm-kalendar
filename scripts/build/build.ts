// Builds the static site into dist/:  npx tsx scripts/build/build.ts
import fs from 'node:fs';
import path from 'node:path';
import { buildData } from './data';
const dist = 'dist';
fs.rmSync(path.join(dist, 'data'), { recursive: true, force: true });
const r = buildData(dist);
console.log(JSON.stringify(r));
const steps = ['./ics', './site'];
for (const s of steps) { const f = path.join('scripts/build', s + '.ts'); if (fs.existsSync(f)) { const m = await import(s); await m.default(dist); } }
