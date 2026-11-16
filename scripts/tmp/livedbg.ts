import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage();
p.on('console', m => console.log('console', m.type(), m.text().slice(0, 300))); p.on('pageerror', e => console.log('pageerror', String(e).slice(0, 400)));
p.on('requestfailed', r => console.log('failed', r.url(), r.failure()?.errorText)); p.on('response', r => { if (r.status() >= 400) console.log('status', r.status(), r.url()); });
try { await p.goto(process.argv[2], { timeout: 20000 }); console.log('loaded'); await p.waitForFunction(() => !!document.getElementById('main')?.dataset.ready, null, { timeout: 15000 }); console.log('ready', await p.evaluate(() => document.querySelector('#main h1')?.textContent)); } catch (e) { console.log('ERR', String(e).slice(0, 300)); }
await b.close();
