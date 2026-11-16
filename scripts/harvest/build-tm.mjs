// Builds the translation memory from the golden Mass fixtures.
// Units: every table row is split into lines (the <BR> structure) and lines into parts at inline scripture references,
// when Latin and Croatian have the same shape; otherwise the whole cell stays one unit.
// Output: data/tm/tm.json  { key(normalised Latin): { la, hr, n, alts?: [{hr,n}] } }  and TM-CONFLICTS.md.
import fs from 'node:fs';
import { normLa, normText, INLINE_REF, stripTags } from '../lib/normalize.mjs';

export function splitCell(la, hr) {
  const L = la.split('\n'), H = hr.split('\n');
  const units = [];
  if (L.length !== H.length) {
    // Croatian sometimes carries an extra trailing translator's note in [brackets]
    if (H.length === L.length + 1 && /^\[.*\]?$/.test(H[H.length - 1])) { const note = H.pop(); const u = splitCell(la, H.join('\n')); u.note = note; return u; }
    units.push({ la, hr, whole: true }); return units;
  }
  for (let i = 0; i < L.length; i++) {
    const lr = [...L[i].matchAll(INLINE_REF)], hrr = [...H[i].matchAll(INLINE_REF)];
    if (lr.length && lr.length === hrr.length) {
      const lp = L[i].split(INLINE_REF), hp = H[i].split(INLINE_REF);
      if (lp[0].trim() || hp[0].trim()) units.push({ la: lp[0].trim(), hr: hp[0].trim() });
      for (let k = 0; k < lr.length; k++) units.push({ la: lp[k + 1].trim(), hr: hp[k + 1].trim(), ref: lr[k][0], refHr: hrr[k][0] });
    } else units.push({ la: L[i], hr: H[i] });
  }
  return units;
}

if (process.argv[1].endsWith('build-tm.mjs')) {
  const tm = new Map();
  const refs = new Map();
  const isRef = t => { const x = stripTags(t); return x.length < 70 && /\d/.test(x) && /^[\p{L}\d .,;:\-–()]+$/u.test(x) && !/\p{Ll}{9,}/u.test(x); };
  const add = (la, hr, src, level) => {
    if (level !== 'head' && isRef(la)) { const k = stripTags(la); const m = refs.get(k) || new Map(); m.set(stripTags(hr), (m.get(stripTags(hr)) || 0) + 1); refs.set(k, m); return; }
    const key = normLa(la); if (!key || !stripTags(hr)) return;
    let e = tm.get(key); if (!e) tm.set(key, e = { la: stripTags(la), level, variants: new Map() });
    const h = hr.trim();
    const v = e.variants.get(h) || { n: 0, src, srcs: [] }; v.n++; v.srcs.push(src.replace('.json', '')); e.variants.set(h, v);
  };
  const seenPage = new Set();
  let pages = 0, rows = 0, wholes = 0;
  for (const y of [2017, 2018]) for (const f of fs.readdirSync(`data/golden/masses/${y}`).sort()) {
    if (seenPage.has(f)) continue; seenPage.add(f); // December pages appear under both years
    const p = JSON.parse(fs.readFileSync(`data/golden/masses/${y}/${f}`)); pages++;
    for (const it of p.items) {
      if (it.kind !== 'section') continue;
      add(it.la, it.hr, f, 'head');
      for (const r of it.rows) {
        if (r.la === undefined) continue; rows++;
        if (r.head) { add(r.la, r.hr, f, 'head'); continue; }
        const units = splitCell(r.la, r.hr);
        if (units.length === 1 && units[0].whole) wholes++;
        for (const u of units) add(u.la, u.hr, f, u.whole ? 'cell' : 'unit');
        if (units.length > 1) add(r.la.replace(INLINE_REF, ' '), r.hr, f, 'cell');
      }
    }
  }
  const out = {}; const conflicts = [];
  for (const [key, e] of tm) {
    const vs = [...e.variants.entries()].sort((a, b) => b[1].n - a[1].n);
    out[key] = { la: e.la, hr: vs[0][0], n: vs[0][1].n, level: e.level };
    // a conflict is a real difference in wording, not in spacing or typography
    const distinct = new Map(); for (const [h, v] of vs) { const k = normText(h); if (!distinct.has(k)) distinct.set(k, { h, n: 0, src: v.src, srcs: [] }); distinct.get(k).n += v.n; distinct.get(k).srcs.push(...v.srcs); }
    if (distinct.size > 1) { out[key].alts = [...distinct.values()].slice(1).map(d => ({ hr: d.h, n: d.n, srcs: d.srcs })); conflicts.push({ la: e.la, vs: [...distinct.values()] }); }
  }
  const refOut = {}; for (const [k, m] of refs) refOut[k] = [...m.entries()].sort((a, b) => b[1] - a[1])[0][0];
  fs.writeFileSync('data/tm/refs.json', JSON.stringify(refOut, null, 0).replace(/","/g, '",\n"'));
  // book abbreviations: Latin -> Croatian, learnt from reference lines of identical shape
  const books = {};
  for (const [k, v] of Object.entries(refOut)) { const a = k.match(/^((?:[1-4I]{1,3}\.? )?\p{L}+)\.? \d/u), b = v.match(/^((?:[1-4I]{1,3}\.? )?\p{L}+)\.? \d/u); if (a && b) { (books[a[1]] ??= {})[b[1]] = ((books[a[1]] ??= {})[b[1]] || 0) + 1; } }
  const bookOut = {}; for (const k in books) bookOut[k] = Object.entries(books[k]).sort((a, b) => b[1] - a[1])[0][0];
  fs.writeFileSync('data/tm/books.json', JSON.stringify(bookOut, null, 1));
  fs.writeFileSync('data/tm/tm.json', JSON.stringify(out, null, 0).replace(/"},"/g, '"},\n"'));
  conflicts.sort((a, b) => b.vs.length - a.vs.length);
  const md = ['# Translation-memory conflicts', '', `Latin units with more than one Croatian rendering on the old site: **${conflicts.length}** of ${tm.size} units. The most frequent rendering is kept (first listed); the others are stored as alternatives in \`data/tm/tm.json\`.`, ''];
  for (const c of conflicts) { md.push(`- **${c.la.slice(0, 160)}${c.la.length > 160 ? '…' : ''}**`); for (const v of c.vs) md.push(`  - (${v.n}×, e.g. ${v.src}) ${stripTags(v.h).slice(0, 300)}${v.h.length > 300 ? '…' : ''}`); }
  fs.writeFileSync('TM-CONFLICTS.md', md.join('\n') + '\n');
  console.log({ pages, rows, wholeCellRows: wholes, units: tm.size, conflicts: conflicts.length });
}
