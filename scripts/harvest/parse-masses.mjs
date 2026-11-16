// Parses every harvested Mass page (propers) and rite page (actions) into data/golden/masses/<year>/<kind>_<file>.json.
// A page becomes an ordered list of items: notes (h3 lines such as the Gloria/Credo lines) and two-column sections.
// Cell text keeps only <i>, <b> and newlines (from <BR>).
import fs from 'node:fs';
import path from 'node:path';
import { decodeEntities, decodeHtml, clean, repairHr } from './util.mjs';

export function lite(s, hr) {
  let t = decodeEntities(s)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(\/?)(i|b)\b[^>]*>/gi, (_, c, t) => `<${c}${t.toLowerCase()}>`)
    .replace(/<(?!\/?[ib]>)[^>]*>/g, ' ')
    .replace(/[ \t\r ]+/g, ' ')
    .split('\n').map(l => l.trim()).join('\n')
    .replace(/\n+/g, '\n').replace(/^\n|\n$/g, '');
  return hr ? repairHr(t) : t;
}

export function parsePage(buf) {
  const html = decodeHtml(buf);
  const body = html.slice(html.search(/<body/i));
  const page = { heading: '', title: '', rank: '', colour: '', commemorations: [], items: [], odd: [] };
  const re = /<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>|<table\b([^>]*)>([\s\S]*?)<\/table>|<p\b((?:[^>\/]|\/(?!>))*)>([\s\S]*?)<\/p>|<h([1-4])\b[^>]*\/>/gi;
  let m, h1 = 0, last = 0;
  while ((m = re.exec(body))) {
    const between = clean(body.slice(last, m.index));
    if (between && !/^<body/i.test(between)) page.odd.push('text: ' + between.slice(0, 200));
    last = re.lastIndex;
    if (m[1]) {
      const t = repairHr(clean(m[2]));
      if (!t) continue;
      if (m[1] === '1') { if (h1++ === 0) page.heading = t; else page.title = page.title ? page.title + ' / ' + t : t; }
      else if (m[1] === '2' && !page.items.length) { if (!page.rank && !/^spomen|^samo/.test(t)) page.rank = t; else page.commemorations.push(t); }
      else page.items.push({ kind: 'note', level: +m[1], text: t });
    } else if (m[3] !== undefined) {
      const attr = m[3];
      const col = attr.match(/id="propColor(\w+)"/);
      if (col) { page.colour = page.colour ? page.colour + '+' + col[1] : col[1]; continue; }
      const id = (attr.match(/id="(\w+)"/) || [])[1];
      const hidden = /display:\s*none/.test(attr);
      const rows = [...m[4].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(r => [...r[1].matchAll(/<(t[hd])\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(c => ({ th: c[1].toLowerCase() === 'th', html: c[2] })));
      const sec = { kind: 'section', id, hidden: hidden || undefined, la: '', hr: '', rows: [] };
      for (const cells of rows) {
        if (cells.length !== 2) { page.odd.push(`row with ${cells.length} cells: ` + clean(cells.map(c => c.html).join(' | ')).slice(0, 200)); if (cells.length === 1) sec.rows.push({ span: lite(cells[0].html, true) }); continue; }
        if (cells[0].th) { if (sec.la) { sec.rows.push({ head: true, la: lite(cells[0].html), hr: lite(cells[1].html, true) }); } else { sec.la = lite(cells[0].html); sec.hr = lite(cells[1].html, true); } }
        else sec.rows.push({ la: lite(cells[0].html), hr: lite(cells[1].html, true) });
      }
      page.items.push(sec);
    } else if (m[6] !== undefined) {
      const t = repairHr(clean(m[6]));
      if (/<input/i.test(m[6])) continue; // the "Prikaz teksta" button of an expander
      if (t) page.items.push({ kind: 'note', level: 0, text: t });
    }
  }
  if (!page.odd.length) delete page.odd;
  return page;
}

if (process.argv[1].endsWith('parse-masses.mjs')) {
  let n = 0, odd = 0;
  const oddLog = [];
  for (const y of [2017, 2018, 2019]) for (const kind of ['propers', 'actions']) {
    const dir = `data/raw/site/${y}/${kind}`;
    if (!fs.existsSync(dir)) continue;
    fs.mkdirSync(`data/golden/masses/${y}`, { recursive: true });
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort()) {
      const page = parsePage(fs.readFileSync(path.join(dir, f)));
      const m = f.match(/^(\d\d)(\d\d)(\d{4})_(\d+)/);
      const outp = { page: y, kind, date: `${m[3]}-${m[2]}-${m[1]}`, n: +m[4], ...page };
      fs.writeFileSync(`data/golden/masses/${y}/${kind}_${m[3]}${m[2]}${m[1]}_${m[4]}.json`, JSON.stringify(outp, null, 1));
      n++; if (page.odd) { odd++; oddLog.push(`${y}/${kind}/${f}: ${page.odd.join(' || ')}`); }
    }
  }
  fs.writeFileSync('data/golden/parse-odd.txt', oddLog.join('\n'));
  console.log(n, 'pages parsed;', odd, 'with oddities (data/golden/parse-odd.txt)');
}
