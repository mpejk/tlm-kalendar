// Fetches every Mass/rite page linked from the old site's year pages into data/raw/site/<year>/...
// Polite: ~1 request per second, never refetches an existing file. Usage: node fetch.mjs [maxSeconds]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const ROOT = 'data/raw/site';
const BASE = 'https://tradicionalnamisa.com/kalendar';
const budget = (Number(process.argv[2]) || 480) * 1000;
const t0 = Date.now();
const todo = [];
for (const y of [2017, 2018]) {
  const html = fs.readFileSync(`${ROOT}/${y}/${y}.html`, 'latin1');
  for (const m of html.matchAll(/href="\.\/((?:propers|actions)\/\d{8}_\d+\.html)"/g)) todo.push([y, m[1]]);
}
// 2019: links point at localhost; try the same static pattern.
{
  const html = fs.readFileSync(`${ROOT}/2019/2019.html`, 'latin1');
  for (const m of html.matchAll(/catcal\/(propers|actions)\.jsp\?d=(\d{8})&(?:amp;)?m=(\d+)/g)) todo.push([2019, `${m[1]}/${m[2]}_${m[3]}.html`]);
}
const seen = new Set();
const list = todo.filter(([y, p]) => { const k = y + '/' + p; if (seen.has(k)) return false; seen.add(k); return true; });
const missLog = `${ROOT}/missing.txt`;
const missing = new Set(fs.existsSync(missLog) ? fs.readFileSync(missLog, 'utf8').split('\n').filter(Boolean) : []);
let fetched = 0, pending = 0, miss2019 = [...missing].filter(k => k.startsWith('2019/')).length;
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (const [y, p] of list) {
  const k = `${y}/${p}`;
  const file = path.join(ROOT, String(y), p);
  if (fs.existsSync(file) || missing.has(k)) continue;
  // If the first 15 probes of 2019 all fail, stop probing 2019.
  if (y === 2019 && miss2019 >= 15 && ![...seen].some(s => s.startsWith('2019/') && fs.existsSync(path.join(ROOT, s)))) { continue; }
  if (Date.now() - t0 > budget) { pending++; continue; }
  let ok = false;
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {
    try {
      // The server sends an incomplete certificate chain that Node rejects; the system curl validates it.
      const tmp = file + '.part';
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const code = execFileSync('curl', ['-sS', '--max-time', '40', '-A', 'Mozilla/5.0 (calendar-archiver; one request per second)', '-o', tmp, '-w', '%{http_code}', `${BASE}/${y}/${p}`]).toString().trim();
      if (code === '200') { fs.renameSync(tmp, file); fetched++; ok = true; }
      else if (code === '404' || code === '410') {
        fs.rmSync(tmp, { force: true });
        missing.add(k); fs.appendFileSync(missLog, k + '\n'); if (y === 2019) miss2019++; ok = true;
      } else { fs.rmSync(tmp, { force: true }); console.log('status', code, k); await sleep(5000); }
    } catch (e) { console.log('error', k, e.message); await sleep(5000); }
  }
  await sleep(900);
}
const have = list.filter(([y, p]) => fs.existsSync(path.join(ROOT, String(y), p))).length;
console.log(JSON.stringify({ linked: list.length, have, fetchedNow: fetched, missing: missing.size, pendingAfterBudget: pending }));
