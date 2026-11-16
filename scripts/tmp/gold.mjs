import fs from 'node:fs';
const [,, file, full] = process.argv;
for (const y of [2017, 2018]) { const p = `data/golden/masses/${y}/${file}.json`; if (!fs.existsSync(p)) continue;
  const g = JSON.parse(fs.readFileSync(p)); console.log('#', g.heading, '|', g.title, '|', g.rank, '|', g.colour, '|', g.commemorations.join(' ; '));
  for (const it of g.items) { if (it.kind === 'note') console.log('  NOTE', it.text.slice(0, 100)); else { console.log('  [' + it.la + (it.hidden ? ' hidden' : '') + ']'); if (!it.hidden) for (const r of it.rows) console.log('     ', (r.la ?? r.span ?? '').replace(/\n/g, ' ⏎ ').slice(0, full ? 5000 : 150)); } }
  break; }
