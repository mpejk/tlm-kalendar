import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync('data/golden/calendar.json'));
const ab = t => t.replace('spomen i na tihim i na pjevanim misama', 'ALL').replace('spomen na tihim misama', 'low').replace('spomen pod istim završetkom na svim misama', 'SAME');
const seen = new Set();
for (const range of process.argv.slice(2)) { const [a, b] = range.split('..');
  for (const r of c) { if (r.date < a || r.date > (b || a) || seen.has(r.date)) continue; seen.add(r.date);
    console.log(r.date.slice(2), r.weekday, r.class, r.colour[0], r.title, r.notes.map(n => '[' + ab(n.type) + ': ' + n.title + ']').join(''), r.masses.length > 1 ? 'x' + r.masses.length : ''); } }
