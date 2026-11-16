// npx tsx scripts/tmp/dump.ts '<query e.g. d=2026-10-08>' [maxChars] [width]
import { chromium } from 'playwright'; import path from 'node:path';
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: Number(process.argv[4] ?? 1280), height: 900 } })).newPage();
p.on('pageerror', e => console.log('pageerror', String(e)));
await p.goto('file://' + path.resolve('dist/index.html') + '?' + process.argv[2]); await p.waitForFunction(() => !!document.getElementById('main')?.dataset.ready);
console.log((await p.evaluate(() => (document.getElementById('main') as HTMLElement).innerText)).slice(0, Number(process.argv[3] ?? 3000)));
await b.close();
