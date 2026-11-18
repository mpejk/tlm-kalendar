// Contact sheets of the screenshots in .cache/igra-shots, for the review by eye: npx tsx scripts/igra/sheet.ts <prefix> [perSheet] [maxHeight]
import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';
const [prefix, per = '7', maxH = '1000'] = process.argv.slice(2); const dir = path.resolve('.cache/igra-shots');
const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix) && f.endsWith('.png') && !f.includes('sheet')).sort((a, b) => +a.slice(prefix.length + 1).split('-')[0] - +b.slice(prefix.length + 1).split('-')[0]);
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 3400, height: 900 } });
for (let i = 0; i < files.length; i += +per) {
  fs.writeFileSync(`${dir}/sheet.html`, `<body style="margin:0;background:#777;display:inline-flex;gap:8px;align-items:flex-start">${files.slice(i, i + +per).map(f => `<div style="flex:none;max-height:${maxH}px;overflow:hidden"><img src="${f}" style="display:block"></div>`).join('')}</body>`);
  await page.goto(`file://${dir}/sheet.html`);
  await page.waitForLoadState('load'); const out = `${dir}/sheet-${prefix}-${i / +per}.png`; await page.locator('body').screenshot({ path: out }); console.log(out);
}
await b.close();
