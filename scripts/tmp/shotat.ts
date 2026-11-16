// npx tsx scripts/tmp/shotat.ts '<query>' '<text to scroll to>' out.png [width]
import { chromium } from 'playwright'; import path from 'node:path';
const [q, needle, out, w] = process.argv.slice(2);
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: Number(w ?? 1280), height: 900 } })).newPage();
await p.goto('file://' + path.resolve('dist/index.html') + '?' + q); await p.waitForFunction(() => !!document.getElementById('main')?.dataset.ready); await p.evaluate(() => (document as any).fonts.ready);
await p.evaluate((n) => { const w = document.createTreeWalker(document.getElementById('main')!, NodeFilter.SHOW_TEXT); let x; while ((x = w.nextNode())) if (x.textContent!.includes(n)) { (x.parentElement as HTMLElement).scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); break; } }, needle);
await p.waitForTimeout(150); await p.screenshot({ path: out }); await b.close();
