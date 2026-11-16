import fs from 'node:fs';
import { generalConfig } from '../../src/engine/config';
import { getDay } from '../../src/engine/engine';
import { parseIso } from '../../src/engine/dates';
const MM = 'data/raw/mm/repo/backend/api/constants/';
const consts: Record<string, string> = {};
for (const m of fs.readFileSync(MM + 'common.py', 'utf8').matchAll(/^([A-Z0-9_]+) = '([a-z]+:[^']+)'/gm)) consts[m[1]] = m[2];
const titleToIds: Record<string, string[]> = {};
const src = fs.readFileSync(MM + 'en/translation.py', 'utf8') ;
for (const m of src.matchAll(/constants\.([A-Z0-9_]+):\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g)) { const id = consts[m[1]]; const t = (m[2] ?? m[3]).replace(/\\'/g, "'"); if (id) (titleToIds[t] ??= []).push(id); }
const cfg = generalConfig({ name: '', date: '99-99' });
const years = process.argv.slice(2).map(Number);
let n = 0, bad = 0; const kinds: Record<string, number> = {};
for (const y of years) {
  const cal = JSON.parse(fs.readFileSync(`data/raw/mm/api/cal-${y}.json`, 'utf8'));
  for (const it of cal) {
    n++;
    const d = getDay(parseIso(it.id), cfg);
    const ids = titleToIds[it.title] ?? [];
    const normT = (x: string) => x.replace(/^PentEpi/, 'Epi').replace(/Feria$/, '').replace(/(\d)[a-z]+\d?$/, '$1');
    const normS = (x: string) => x.replace(/^(\d\d-\d\d)[a-z]+\d?$/, '$1');
    const canon = (id: string) => { const [k, v] = id.split(':'); return k === 'tempora' ? 'T:' + normT(v) : k === 'sancti' ? 'S:' + normS(v) : 'C:' + v.replace(/^C10.*/, 'C10'); };
    let mine = d.celebration.id.replace('Tempora/', 'tempora:').replace('Sancti/', 'sancti:').replace('Commune/', 'commune:');
    if (d.flags.ember && d.celebration.key.startsWith('T:Pent')) mine = 'tempora:093-' + d.weekday;
    const myId = canon(mine);
    const diffs: string[] = [];
    if (it.rank !== d.cls) diffs.push(`rank ${it.rank}≠${d.cls}`);
    if (it.colors.join() !== (d.colours ?? [d.colour]).slice().sort().join() && it.colors.join() !== (d.colours ?? [d.colour]).join()) diffs.push(`colour ${it.colors}≠${d.colours ?? d.colour}`);
    const feriaOk = it.title === 'Feria' && d.celebration.kind === 'feria' && d.cls === 4;
    if (!feriaOk && !ids.some(i => canon(i) === myId)) diffs.push(`id ${ids.map(canon).join('/') || '?' + it.title}≠${myId}`);
    const slot = (c: string) => c.startsWith('T:') ? (c.startsWith('T:093') ? 'T:ember' : c) : 'S';
    const theirC = it.commemorations.map((c: any) => slot(canon(c.id))).join(',');
    const myC = d.commemorations.filter(c => c.kind !== 'oration' || c.key === 'X:LitMaj').map(c => c.key === 'X:LitMaj' ? 'S' : c.id.startsWith('Tempora/') && c.key.startsWith('T:') ? (d.flags.ember && /^T:Pent/.test(c.key) ? 'T:ember' : 'T:' + normT(c.id.slice(8))) : 'S').join(',');
    if (theirC !== myC) diffs.push(`comm [${theirC}]≠[${myC}]`);
    if (diffs.length) { bad++; for (const x of diffs) { const k = x.split(' ')[0]; kinds[k] = (kinds[k] || 0) + 1; } console.log(it.id, it.title, '|', d.title, '|', diffs.join('; ')); }
  }
}
console.log({ n, bad, kinds });
