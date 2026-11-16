import fs from 'node:fs';
import { getSection } from '../import/dofile.mjs';
const K = 'data/raw/do/repo/web/www/Tabulae/Kalendaria/';
const kal = {};
for (const layer of ['1570', '1888', '1906', '1939', '1954', '1955', '1960']) {
  for (const line of fs.readFileSync(K + layer + '.txt', 'utf8').split(/\r?\n/)) {
    if (!/^\d\d-\d\d=/.test(line)) continue;
    const [date, files, ...rest] = line.split('=');
    if (files === 'XXXXX') { delete kal[date]; continue; }
    kal[date] = files.split('~').map((f, i) => ({ file: f, title: rest[i * 2], krank: rest[i * 2 + 1] }));
  }
}
const cal = JSON.parse(fs.readFileSync('data/golden/calendar.json'));
const seen = {}; // mmdd -> name -> {asTitle:[class..], asComm:[type..], years:Set}
const dedup = new Set();
for (const r of cal) {
  if (dedup.has(r.date)) continue; dedup.add(r.date);
  const md = r.date.slice(5);
  const add = (name, how, v) => { const o = ((seen[md] ??= {})[name] ??= { title: [], comm: [], colour: [] }); o[how].push(v); if (how === 'title') o.colour.push(r.colour); };
  add(r.title.replace(/ \(prosni dan\)$/, ''), 'title', r.class + r.weekday);
  for (const n of r.notes) add(n.title, 'comm', n.type.replace('spomen ', '').replace('i na tihim i na pjevanim misama', 'ALL').replace('na tihim misama', 'low').replace('pod istim završetkom na svim misama', 'SAME'));
}
const temporal = /^Feria|NEDJELJ|nedjelj|tjednu|kvatr|^Bdijenje uoči (dana )?(Duhova|Uzašašća)|^Subota BDM|^Subotnja služba|^VELIK|USKRS|DUHOV|PEPELNICA|Pepelnica|^Dan u osmini|po Pepelnici|OBITELJ|TROJSTV|TIJELOVO|SRCE ISUSOVO|Presvetog Srca|KRIST KRALJ|KRALJA|Velike litanije|UZAŠAŠĆE|Uzašašć|nakon Pepelnice|IME ISUSOVO|Ime Isusovo|Spomen sv. Oca|misij|BIJELA/;
const out = [];
const dates = new Set([...Object.keys(kal), ...Object.keys(seen)]);
for (const md of [...dates].sort()) {
  const d = (kal[md] || []).map(e => { const rk = (getSection('Sancti/' + e.file, 'Rank') || ['?']).filter(l => l.trim())[0]; const p = rk.split(';;'); return `${e.file} [${p[2]}|${p[1]}] ${e.title}`; });
  const s = Object.entries(seen[md] || {}).filter(([n]) => !temporal.test(n)).map(([n, o]) => `${n} {T:${o.title.join(',')} C:${o.comm.join(',')} ${[...new Set(o.colour)].join('/')}}`);
  out.push(`${md}\n   DO: ${d.join(' ~ ')}\n   HR: ${s.join(' ~ ')}`);
}
fs.writeFileSync('scripts/tmp/sanct-draft.txt', out.join('\n'));
// automatic pairing
const cls = r => { const n = parseFloat(r); return n >= 6 ? 1 : n >= 5 ? 2 : n >= 1.9 ? 3 : 4; };
const auto = [], flagged = [];
for (const md of [...dates].sort()) {
  const d = (kal[md] || []).map(e => { const rk = (getSection('Sancti/' + e.file, 'Rank') || ['?']).filter(l => l.trim())[0]; const p = rk.split(';;'); return { file: e.file, cls: cls(p[2]), la: (getSection('Sancti/' + e.file, 'Officium') || [e.title])[0] }; });
  const s = Object.entries(seen[md] || {}).filter(([n]) => !temporal.test(n)).map(([n, o]) => ({ n, o })).sort((a, b) => (b.o.title.length ? 1 : 0) - (a.o.title.length ? 1 : 0));
  if (!d.length && !s.length) continue;
  const okCount = d.length === s.length;
  const okClass = okCount && d.every((e, i) => !s[i].o.title.length || s[i].o.title.some(t => t.startsWith('I'.repeat(e.cls)) && !t.startsWith('I'.repeat(e.cls) + 'I') || (e.cls === 4 && t.startsWith('IV'))));
  if (okCount && okClass) d.forEach((e, i) => auto.push({ md, ...e, hr: s[i].n, colour: [...new Set(s[i].o.colour)].join('/'), comm: [...new Set(s[i].o.comm)].join('/') }));
  else flagged.push(`${md}\n   DO: ${d.map(e => `${e.file}[${e.cls}] ${e.la}`).join(' ~ ')}\n   HR: ${s.map(x => `${x.n} {T:${x.o.title.join(',')} C:${x.o.comm.join(',')} ${[...new Set(x.o.colour)].join('/')}}`).join(' ~ ')}`);
}
fs.writeFileSync('scripts/tmp/sanct-auto.json', JSON.stringify(auto, null, 1));
fs.writeFileSync('scripts/tmp/sanct-flagged.txt', flagged.join('\n'));
console.log('auto', auto.length, 'flagged dates', flagged.length);
console.log(out.length);
