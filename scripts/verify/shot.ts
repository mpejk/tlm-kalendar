// One screenshot of the built site:  npx tsx scripts/verify/shot.ts '<query>' <out.png> [width] [scrollToText]
import { chromium } from 'playwright'; import path from 'node:path';
const [q, out, w, find] = process.argv.slice(2);
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: Number(w ?? 1280), height: 1100 }, deviceScaleFactor: 1 })).newPage();
await p.goto('file://' + path.resolve('dist/index.html') + '?' + q); await p.waitForFunction(() => !!document.getElementById('main')?.dataset.ready);
if (find) await p.evaluate(t => { const el = [...document.querySelectorAll('h2, p, .row')].find(e => (e.textContent ?? '').includes(t)); el?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -60); }, find);
await p.waitForTimeout(300); await p.screenshot({ path: out }); await b.close();
