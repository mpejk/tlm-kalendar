// The printed sheet of a round as PDF, for each age band (the sheet follows the band and levels of the chosen child), with its page
// count: npx tsx scripts/igra/pdf.ts <date>... -> .cache/igra-shots/list-<date>-<band>.pdf/.png ; {date-band: pages}
import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';
import { ready, setProfiles } from './play-lib';
export async function sheetPages(dates: string[], out = '.cache/igra-shots', bands = ['a', 'b', 'c'], level = 1): Promise<Record<string, number>> {
  fs.mkdirSync(out, { recursive: true }); const b = await chromium.launch(); const res: Record<string, number> = {};
  const base = 'file://' + path.resolve('dist/igra/index.html');
  for (const d of dates) for (const dob of bands) {
    const page = await b.newPage({ viewport: { width: 794, height: 1123 } }); await page.goto(base + '?danas=' + d); await ready(page);
    await setProfiles(page, [{ ime: 'Ana', dob, ...(dob === 'b' ? { min: true } : {}) } as any], 0, { p0: Object.fromEntries(['ruho', 'kalez', 'oltar', 'misa', 'odgovori'].map(g => [g, { l: level, ok: [] }])) });
    await page.goto(base + `?d=${d}&ispis=1`); await ready(page);
    const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true }); fs.writeFileSync(`${out}/list-${d}-${dob}-L${level}.pdf`, pdf);
    res[`${d} ${dob} L${level}`] = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    await page.emulateMedia({ media: 'print' }); await page.screenshot({ path: `${out}/list-${d}-${dob}-L${level}.png`, fullPage: true }); await page.close();
  }
  await b.close(); return res;
}
if (process.argv[1]?.endsWith('pdf.ts')) { const lv = +(process.env.LEVEL ?? 1); console.log(JSON.stringify(await sheetPages(process.argv.slice(2), undefined, undefined, lv))); }
