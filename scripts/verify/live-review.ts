// Checks on the published site that the corrections of the review are live.   npx tsx scripts/verify/live-review.ts [base url]
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'https://mpejk.github.io/tlm-kalendar/';
const cases: { q: string; has?: string[]; hasNot?: string[] }[] = [
  { q: '', has: [] },
  { q: '?d=2034-05-18', hasNot: ['Spomen sv. Oca'] },                                                    // R06
  { q: '?d=2034-05-19', has: ['Spomen sv. Oca', 'fámulum tuum Leónem', 'slugu svoga Lava'] },             // R06, T12
  { q: '?d=2027-08-15', has: ['concupíscet Rex pulchritúdinem tuam', 'Tota decóra ingréditur fília Regis'], hasNot: ['decórem tuum'] },   // T03
  { q: '?d=2027-03-27', has: ['Deus, qui hanc sacratíssimam noctem', 'Col 3:1-4', 'Matt 28:1-7', 'Spíritum nobis, Dómine, tuæ caritátis infúnde', 'Ite, Missa est, allelúia, allelúia', 'Bože, koji ovu presvetu noć'] },   // R01
  { q: '?d=2027-04-25&m=1', has: ['Na ovoj misi govori se Nicejsko-carigradsko vjerovanje'] },             // R04
  { q: '?d=2033-07-16', hasNot: ['Gospa Karmelska'] },                                                    // R08
  { q: '?d=2027-11-16', has: ['njezinim zaslugama i zagovorom', 'Korinćanima', 'Božjom revnošću', 'Neka ti bude, Gospodine, drag ovaj prinos'] },   // T01, T02, T14
  { q: '?d=2027-04-25&m=0.5', has: ['4. nedjelja po Uskrsu'] },                                            // W01
];
const browser = await chromium.launch(); const out: any[] = []; let failed = 0;
try { for (const c of cases) {
  const page = await browser.newPage(); const errors: string[] = []; page.on('pageerror', e => errors.push(String(e).slice(0, 120)));
  await page.goto(base + c.q + (c.q ? '&' : '?') + 'nocache=' + Date.now()); await page.waitForFunction(() => !!document.getElementById('main')?.dataset.ready, null, { timeout: 30000 });
  const text = (await page.evaluate(() => (document.getElementById('main') as HTMLElement).innerText)).normalize('NFC');
  const missing = (c.has ?? []).filter(s => !text.includes(s)), present = (c.hasNot ?? []).filter(s => text.includes(s));
  const ok = !missing.length && !present.length && !errors.length && text.length > 200; if (!ok) failed++;
  out.push({ url: base + c.q, ok, missing, present, errors, chars: text.length }); await page.close(); } } finally { await browser.close(); }
console.log(JSON.stringify({ failed, out }, null, 1)); process.exit(failed ? 1 : 0);
