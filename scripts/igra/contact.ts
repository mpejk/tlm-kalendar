// Contact sheet of screenshots whose names contain all given parts: npx tsx scripts/igra/contact.ts <dir> <out-name> <per row> <maxH> <part>...
import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';
const [dir, name, per = '6', maxH = '1100', ...parts] = process.argv.slice(2); const d = path.resolve(dir);
const files = fs.readdirSync(d).filter(f => f.endsWith('.png') && !f.startsWith('sheet') && parts.every(p => f.includes(p))).sort();
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 3000, height: 900 } });
for (let i = 0; i < files.length; i += +per) {
  fs.writeFileSync(`${d}/sheet.html`, `<body style="margin:0;background:#777;display:inline-flex;gap:8px;align-items:flex-start;font:12px sans-serif">${files.slice(i, i + +per).map(f => `<div style="flex:none;max-height:${maxH}px;overflow:hidden;background:#fff"><div>${f}</div><img src="${f}" style="display:block"></div>`).join('')}</body>`);
  await page.goto(`file://${d}/sheet.html`); await page.waitForLoadState('load'); const out = `${d}/sheet-${name}-${i / +per}.png`; await page.locator('body').screenshot({ path: out }); console.log(out);
}
await b.close();
