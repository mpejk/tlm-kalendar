// The printed sheet of a round as PDF, with its page count: npx tsx scripts/igra/pdf.ts <date>... -> .cache/igra-shots/list-<date>.pdf/.png
import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';
import { ready } from './play-lib';
export async function sheetPages(dates: string[], out = '.cache/igra-shots'): Promise<Record<string, number>> {
  fs.mkdirSync(out, { recursive: true }); const b = await chromium.launch(); const res: Record<string, number> = {};
  for (const d of dates) {
    const page = await b.newPage({ viewport: { width: 794, height: 1123 } }); await page.goto('file://' + path.resolve('dist/igra/index.html') + `?d=${d}&ispis=1`); await ready(page);
    const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true }); fs.writeFileSync(`${out}/list-${d}.pdf`, pdf);
    res[d] = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    await page.emulateMedia({ media: 'print' }); await page.screenshot({ path: `${out}/list-${d}.png`, fullPage: true }); await page.close();
  }
  await b.close(); return res;
}
if (process.argv[1]?.endsWith('pdf.ts')) console.log(JSON.stringify(await sheetPages(process.argv.slice(2))));
