// Parses the three old-site year pages into data/golden/calendar.json (one row per date and source page).
import fs from 'node:fs';
import { decodeHtml, clean, repairHr } from './util.mjs';
const out = [];
const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
for (const y of [2017, 2018, 2019]) {
  // Days with two colours carry a nested table in the colour cell; flatten it to a marker first.
  const html = decodeHtml(fs.readFileSync(`data/raw/site/${y}/${y}.html`))
    .replace(/<table id="noborder">([\s\S]*?)<\/table>/gi, (_, t) => '[[' + [...t.matchAll(/id="back(\w+?)Gen"/g)].map(m => m[1]).join('+') + ']]');
  const rows = html.split(/<tr\b/i).slice(1);
  for (const r of rows) {
    const rowId = (r.match(/^\s*id="(\w+)"/) || [])[1] || '';
    const tds = [...r.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi)].map(m => ({ attr: m[1], body: m[2] }));
    if (tds.length < 6) continue;
    const dm = clean(tds[0].body).match(/^(\d+)\.([IVX]+)\.(\d{4})\.$/);
    if (!dm) continue;
    const date = `${dm[3]}-${String(ROMAN[dm[2]]).padStart(2, '0')}-${dm[1].padStart(2, '0')}`;
    const colour = (tds[3].attr.match(/id="back(\w+?)50"/) || [])[1];
    const colours = (tds[3].body.match(/\[\[(.*?)\]\]/) || [])[1]?.split('+');
    const parts = tds[4].body.split(/<br\s*\/?>/i).map(clean).filter(Boolean);
    const title = repairHr(parts[0]);
    const notes = parts.slice(1).map(p => {
      const m = p.match(/^([^:]+):\s*(.*)$/);
      return m ? { type: m[1].trim(), title: repairHr(m[2].trim()) } : { type: '', title: repairHr(p) };
    });
    const masses = [...tds[5].body.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map(m => {
      const h = m[1].replace(/&amp;/g, '&');
      let k = h.match(/(propers|actions)\/(\d{8})_(\d+)\.html/) || h.match(/(propers|actions|actiones)\.jsp\?d=(\d{8})&m=(\d+)/);
      if (k && k[1] === 'actiones') k[1] = 'actions';
      if (!k) { console.log('odd link', date, h); return { label: clean(m[2]), kind: 'other', file: h }; }
      return { label: clean(m[2]), kind: k[1], file: `${k[2]}_${k[3]}` };
    });
    const extra = clean(tds[5].body.replace(/<a\b[\s\S]*?<\/a>/gi, ' '));
    out.push({ page: y, date, weekday: clean(tds[1].body), class: clean(tds[2].body), colour, colours, rowStyle: rowId, title, notes, masses, extra: extra || undefined });
  }
}
fs.writeFileSync('data/golden/calendar.json', JSON.stringify(out, null, 1));
console.log(out.length, 'rows');
