import fs from 'node:fs';
const s = JSON.parse(fs.readFileSync(`.cache/snap/${process.argv[2]}.json`, 'utf8'));
for (const spec of process.argv.slice(3)) { const [key, sec, n] = spec.split('#'); const v = s.views[key]; if (!v) { console.log('NO VIEW', key); continue; }
  const rows = v.rows.filter((r: any) => r[0].startsWith(sec)); const r = rows[+(n ?? 0)]; if (!r) { console.log('NO', spec); continue; }
  const la = s.texts[r[1]].split('\n'), hr = s.texts[r[2]].split('\n');
  console.log(`${spec} ${v.title}\n   LA: ${la.slice(0, 3).join(' | ').slice(0, 150)} … ${la.join(' ').slice(-70)}\n   HR: ${hr.slice(0, 2).join(' | ').slice(0, 150)} … ${hr.join(' ').slice(-90)}`); }
