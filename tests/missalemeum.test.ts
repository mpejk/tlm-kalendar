// Calendar against Missale Meum (missalemeum.com, API v5 calendar, fetched once into data/raw/mm/api) for 2026–2036.
// Every difference must fall into an explained category with a rubric citation; the list is written to MM-DIFFS.md.
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generalConfig } from '../src/engine/config';
import { getDay } from '../src/engine/engine';
import { parseIso } from '../src/engine/dates';

const MM = 'data/raw/mm/repo/backend/api/constants/';
const haveSource = fs.existsSync(MM + 'common.py');

const CATEGORIES: { name: string; why: string; test: (x: Ctx) => boolean }[] = [
  { name: 'Commemoration of the Sunday or of the Advent/Lent feria on a feast', why: 'Missale Meum lists no commemoration; n. 109 (a, e) makes these privileged commemorations, allowed even on I class days (n. 111a). The old site prints them (e.g. 8 Dec 2017, 24 Jun 2018).', test: x => x.kind === 'comm' && x.theirs.length === 0 && x.mine.length === 1 && x.mine[0].startsWith('T:') },
  { name: 'Second ordinary commemoration on a III or IV class day', why: 'Missale Meum keeps one; n. 111d allows two. The old site prints two (e.g. 4 Dec 2017, 1 Sep 2018).', test: x => x.kind === 'comm' && x.mine.length === x.theirs.length + 1 && x.cls >= 3 && x.mine.slice(0, x.theirs.length).join() === x.theirs.join() },
  { name: 'Seven Sorrows on the Friday of Passion week, with a saint of the day', why: 'Both show the commemoration of the Seven Sorrows (different id); the engine adds the III class feast of the day as the second commemoration (n. 111d).', test: x => x.kind === 'comm' && x.tid === 'Quad5-5' },
  { name: 'Days II–IV in the octave of Christmas', why: 'Same commemoration of the octave day, named by a different id (n. 109c).', test: x => x.kind === 'comm' && /^12-2[678]$/.test(x.md) },
  { name: 'St Anastasia at the second Mass of Christmas', why: 'Commemoration proper to the Mass at dawn (Missal, 25 December); printed by the old site as "samo zornica".', test: x => x.kind === 'comm' && x.md === '12-25' },
  { name: 'St Peter on the Commemoration of St Paul (30 June)', why: 'Inseparable commemoration, n. 110; shown by the old site.', test: x => x.kind === 'comm' && x.md === '06-30' },
  { name: 'Greater Litanies in the Easter octave', why: 'n. 80 keeps the Litanies on 25 April unless it is Easter Sunday or Monday; n. 109f makes the commemoration privileged at Mass. The old site shows it (25 Apr 2019).', test: x => x.kind === 'comm' && x.md === '04-25' },
  { name: 'Saint commemorated on a I class Sunday in Missale Meum', why: 'n. 111a: on days of I class only a privileged commemoration is allowed.', test: x => x.kind === 'comm' && x.cls === 1 && x.weekday === 0 && x.mine.length === 0 },
  { name: 'Colour of the Rogation Monday and Tuesday', why: 'Missale Meum gives violet (the Rogation Mass); the engine gives the colour of the day (white), as the old site does, and offers the Rogation Mass as the second Mass.', test: x => x.kind === 'colour' && x.rogation },
  { name: 'Colour of the ferias of 14–19 January in the week of the Holy Family', why: 'Green from 14 January (n. 117d/119 a: white until 13 January inclusive); the old site has green (18 Jan 2019).', test: x => x.kind === 'colour' && /^01-1[4-9]$/.test(x.md) },
  { name: 'Vigil of St Lawrence on a Saturday', why: 'Missale Meum gives the Saturday Mass of Our Lady; in the table of precedence (n. 91) a III class vigil (26) stands above the Saturday Office of Our Lady (27).', test: x => x.md === '08-09' && x.weekday === 6 },
  { name: 'Our Lady of Mount Carmel on a Saturday of Our Lady', why: 'Missale Meum adds the commemoration to the Saturday Mass of Our Lady; n. 112d excludes a second prayer in which the intercession of Our Lady is sought.', test: x => x.kind === 'comm' && x.md === '07-16' && x.weekday === 6 && x.mine.length === 0 },
  { name: 'Vigil of St John the Baptist, 23 June 2033', why: 'The feast is transferred to 25 June because 24 June is the Sacred Heart; n. 33 then omits the vigil entirely. Missale Meum keeps it.', test: x => x.date === '2033-06-23' },
  { name: 'St Joseph and the Annunciation after Easter 2035', why: 'n. 96a gives the Annunciation its proper place on the Monday after Low Sunday; St Joseph then takes the next free day (n. 96). Missale Meum has them the other way round; Divinum Officium agrees with the engine.', test: x => x.kind === 'id' && (x.date === '2035-04-02' || x.date === '2035-04-03') },
];
interface Ctx { date: string; md: string; weekday: number; cls: number; kind: string; tid: string; rogation: boolean; theirs: string[]; mine: string[] }

// The table "English title -> Missale Meum ids" is derived from two files of the Missale Meum source (its constants and English
// titles). Where a clone of that repository is present (data/raw/mm/repo, git-ignored) the table is derived afresh and saved;
// elsewhere the saved copy data/raw/mm/title-ids.json is used, so the comparison runs from a fresh clone of this project.
const IDS = 'data/raw/mm/title-ids.json';
function loadTitleIds(): Record<string, string[]> {
  if (!haveSource) return JSON.parse(fs.readFileSync(IDS, 'utf8'));
  const consts: Record<string, string> = {};
  for (const m of fs.readFileSync(MM + 'common.py', 'utf8').matchAll(/^([A-Z0-9_]+) = '([a-z]+:[^']+)'/gm)) consts[m[1]] = m[2];
  const titleToIds: Record<string, string[]> = {};
  for (const m of fs.readFileSync(MM + 'en/translation.py', 'utf8').matchAll(/constants\.([A-Z0-9_]+):\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g)) {
    const id = consts[m[1]]; const t = (m[2] ?? m[3]).replace(/\\'/g, "'"); if (id) (titleToIds[t] ??= []).push(id);
  }
  fs.writeFileSync(IDS, JSON.stringify(titleToIds, null, 0).replace(/\],"/g, '],\n"'));
  return titleToIds;
}
describe.skipIf(!haveSource && !fs.existsSync(IDS))('calendar against Missale Meum 2026–2036 (general calendar)', () => {
  const titleToIds = loadTitleIds();
  const cfg = generalConfig({ name: '', date: '99-99' });
  const normT = (x: string) => x.replace(/^PentEpi/, 'Epi').replace(/Feria$/, '').replace(/(\d)[a-z]+\d?$/, '$1').replace(/^Nat(29|30|31)$/, 'Nat1-1');
  const normS = (x: string) => x.replace(/^(\d\d-\d\d)[a-z]+\d?$/, '$1');
  const canon = (id: string) => { const [k, v] = id.split(':'); return k === 'tempora' ? 'T:' + normT(v) : k === 'sancti' ? 'S:' + normS(v) : 'C:' + v.replace(/^C10.*/, 'C10'); };
  let n = 0; const unexplained: string[] = []; const byCat = new Map<string, string[]>();
  for (let y = 2026; y <= 2036; y++) {
    const cal = JSON.parse(fs.readFileSync(`data/raw/mm/api/cal-${y}.json`, 'utf8'));
    for (const it of cal) {
      n++;
      const d = getDay(parseIso(it.id), cfg);
      let mineId = (/^T:Nat(29|31)$/.test(d.celebration.key) ? 'Tempora/' + d.temporalId : d.celebration.id).replace('Tempora/', 'tempora:').replace('Sancti/', 'sancti:').replace('Commune/', 'commune:');
            const myId = d.celebration.key === 'S:08-09' ? 'S:08-08' : canon(mineId); // DO keeps St John Vianney's Mass in the file 08-09
      const ids = (titleToIds[it.title] ?? []).map(canon);
      const found: { kind: string; text: string; theirs: string[]; mine: string[] }[] = [];
      if (it.rank !== d.cls) found.push({ kind: 'rank', text: `class ${it.rank} / ${d.cls}`, theirs: [], mine: [] });
      const myCols = d.colours ?? [d.colour];
      const theirCols: string[] = it.colors;
      const roseOk = theirCols.join() === 'p,v' && myCols.join() === 'p';
      if (!roseOk && theirCols.slice().sort().join() !== myCols.slice().sort().join()) found.push({ kind: 'colour', text: `colour ${theirCols} / ${myCols}`, theirs: [], mine: [] });
      const feriaOk = it.title === 'Feria' && d.celebration.kind === 'feria' && d.cls === 4;
      if (!feriaOk && !ids.includes(myId)) found.push({ kind: 'id', text: `celebration «${it.title}» / «${d.title}»`, theirs: [], mine: [] });
      const slot = (c: string) => (c.startsWith('T:') ? (c.startsWith('T:093') ? 'T:ember' : c) : 'S');
      const theirs = it.commemorations.map((c: any) => slot(canon(c.id)));
      const mine = d.commemorations.filter(c => c.kind !== 'oration' || c.key === 'X:LitMaj').map(c => c.key === 'X:LitMaj' ? 'S' : c.key.startsWith('T:') ? (c.id.startsWith('Tempora/093') ? 'T:ember' : 'T:' + normT(c.id.slice(8))) : 'S');
      if (theirs.join() !== mine.join()) found.push({ kind: 'comm', text: `commemorations MM [${it.commemorations.map((c: any) => c.title).join('; ')}] / engine [${d.commemorations.map(c => c.title).join('; ')}]`, theirs, mine });
      for (const f of found) {
        const ctx: Ctx = { date: it.id, md: it.id.slice(5), weekday: d.weekday, cls: d.cls, kind: f.kind, tid: d.temporalId, rogation: !!d.flags.rogation, theirs: f.theirs, mine: f.mine };
        const cat = CATEGORIES.find(c => c.test(ctx));
        const line = `${it.id} ${d.title}: ${f.text}`;
        if (cat) { const a = byCat.get(cat.name) ?? []; a.push(line); byCat.set(cat.name, a); } else unexplained.push(line);
      }
    }
  }
  const md = ['# Differences from Missale Meum, 2026–2036 (general calendar)', '', `Days compared: ${n}. Compared: class, colour, the celebration, and the commemorations (kind and order). The celebration of the day agrees on every day except those listed.`, ''];
  for (const c of CATEGORIES) { const a = byCat.get(c.name); if (!a) continue; md.push(`## ${c.name} (${a.length})`, '', c.why, '', ...a.map(x => '- ' + x), ''); }
  md.push(`## Unexplained (${unexplained.length})`, '', ...(unexplained.length ? unexplained.map(x => '- ' + x) : ['None.']), '');
  fs.writeFileSync('MM-DIFFS.md', md.join('\n'));
  it('covers every day of 2026–2036', () => { expect(n).toBe(4018); });
  it('has no unexplained difference', () => { expect(unexplained).toEqual([]); });
});
