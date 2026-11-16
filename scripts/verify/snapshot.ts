// Snapshot of everything the published site shows, composed the way the browser composes it (from dist/data), and a diff of
// two snapshots. Used to count the Mass views a correction touches.
//   npx tsx scripts/verify/snapshot.ts save <name> [dist]       -> .cache/snap/<name>.json
//   npx tsx scripts/verify/snapshot.ts diff <a> <b> [maxGroups] -> changed views grouped by the change
//   npx tsx scripts/verify/snapshot.ts show <name> <cal|date|massIndex> [sectionKey]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Day } from '../../src/engine/types';
import { assembleMass } from '../../src/assembler/assemble';
import { blockCore, hashKey } from '../../src/assembler/norm';
import { Line } from '../../src/assembler/types';

const PRAYER = new Set(['Oratio', 'Secreta', 'Postcommunio', 'SuperPopulum']);
const fileOf = (id: string) => id.replace(/[^A-Za-z0-9]+/g, '_');
const h = (s: string) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);

export interface Snap { texts: Record<string, string>; views: Record<string, { title: string; rows: [string, string, string][] }> }

export function loadDist(dist: string) {
  const F: Record<string, any> = {}; const CAL: Record<number, { opci: Day[]; zagreb: Record<string, Day> }> = {}; let BASE: any;
  const TLM = { base: (b: any) => { BASE = b; }, cal: (y: number, d: any) => { CAL[y] = d; }, f: (id: string, d: any) => { F[id] = d; } };
  const run = (f: string) => new Function('TLM', fs.readFileSync(f, 'utf8'))(TLM);
  run(path.join(dist, 'data/base.js'));
  for (const f of fs.readdirSync(path.join(dist, 'data/cal'))) run(path.join(dist, 'data/cal', f));
  for (const f of fs.readdirSync(path.join(dist, 'data/f'))) run(path.join(dist, 'data/f', f));
  return { F, CAL, BASE };
}

/** Every view of the site: key "cal|date|massIndex" -> rows [label, Latin, Croatian]. */
export function allViews(dist: string) {
  const { F, CAL, BASE } = loadDist(dist);
  const corpus: any = { formularies: F, texts: {}, ordo: BASE.ordo };
  const laOf = (ls: Line[]) => ls.map(l => (l.mark ? l.mark + '. ' : '') + l.la).join('\n');
  const hrOf = (ls: Line[], src?: string) => { const core = blockCore(ls); if (!core) return ''; const v = F[(src ?? '').split('|')[0]]?.hr?.[hashKey(core)]; return (BASE.croatianPrimary === 'kniewald' ? v?.kn ?? v?.t : v?.t ?? v?.kn) ?? '∅'; };
  const out: { key: string; day: Day; rows: [string, string, string][] }[] = [];
  for (const y of Object.keys(CAL).map(Number).sort()) for (const cal of ['opci', 'zagreb'] as const) {
    const days = cal === 'opci' ? CAL[y].opci : Object.values(CAL[y].zagreb);
    for (const day of days) day.masses.forEach((m, i) => {
      const rows: [string, string, string][] = [];
      rows.push(['day', `${day.title} | ${day.cls} | ${day.colour} | ${m.label ?? ''}`, day.commemorations.map(c => `${c.type}: ${c.title}`).concat(day.rubricNotes ?? []).join(' ; ')]);
      if (m.kind === 'mass') {
        const v = assembleMass(day, i, corpus); if (!v) rows.push(['ERROR', 'no mass', '']);
        else for (const it of v.items) {
          if (it.kind === 'note') { rows.push(['note:' + it.key, it.text, '']); continue; }
          const units = PRAYER.has(it.key) ? it.blocks.map(b => ({ label: b.label, lines: b.lines, src: b.src ?? it.src })) : [{ label: undefined as string | undefined, lines: it.blocks.flatMap(b => b.lines), src: it.src }];
          units.forEach((u, n) => { if (u.lines.length || u.label) rows.push([`${it.key}${n ? '#' + n : ''} [${it.la}]${u.label ? ' {' + u.label + '}' : ''}`, laOf(u.lines), hrOf(u.lines, u.src)]); });
        }
      } else {
        const f = F[m.id];
        (f?.items ?? []).forEach((it: any, si: number) => { if (it.kind === 'note') rows.push([`rite ${si}`, it.text, '']); else (it.rows ?? []).forEach((r: any, ri: number) => rows.push([`rite ${si}.${ri} [${it.la ?? ''}]`, r.la ?? r.text ?? '', r.hr || '∅'])); });
      }
      out.push({ key: `${cal}|${day.date}|${i}`, day, rows });
    });
  }
  return out;
}

function save(name: string, dist: string) {
  const snap: Snap = { texts: {}, views: {} };
  const put = (s: string) => { const k = h(s); snap.texts[k] = s; return k; };
  for (const v of allViews(dist)) snap.views[v.key] = { title: v.day.title, rows: v.rows.map(r => [r[0], put(r[1]), put(r[2])]) };
  fs.mkdirSync('.cache/snap', { recursive: true });
  fs.writeFileSync(`.cache/snap/${name}.json`, JSON.stringify(snap));
  console.log(`${Object.keys(snap.views).length} views saved to .cache/snap/${name}.json`);
}
const load = (name: string): Snap => JSON.parse(fs.readFileSync(`.cache/snap/${name}.json`, 'utf8'));

function diff(an: string, bn: string, max: number) {
  const A = load(an), B = load(bn);
  const groups = new Map<string, { keys: string[]; label: string; a: [string, string]; b: [string, string] }>();
  const touched = new Set<string>(); let added = 0, removed = 0;
  for (const k of new Set([...Object.keys(A.views), ...Object.keys(B.views)])) {
    const a = A.views[k], b = B.views[k];
    if (!a) { added++; touched.add(k); const g = groups.get('+view') ?? { keys: [], label: 'view added', a: ['', ''], b: ['', ''] }; g.keys.push(k); groups.set('+view', g); continue; }
    if (!b) { removed++; touched.add(k); const g = groups.get('-view') ?? { keys: [], label: 'view removed', a: ['', ''], b: ['', ''] }; g.keys.push(k); groups.set('-view', g); continue; }
    const am = new Map<string, [string, string][]>(), bm = new Map<string, [string, string][]>();
    for (const r of a.rows) { const x = am.get(r[0]) ?? []; x.push([r[1], r[2]]); am.set(r[0], x); }
    for (const r of b.rows) { const x = bm.get(r[0]) ?? []; x.push([r[1], r[2]]); bm.set(r[0], x); }
    for (const lab of new Set([...am.keys(), ...bm.keys()])) {
      const x = JSON.stringify(am.get(lab) ?? null), y = JSON.stringify(bm.get(lab) ?? null); if (x === y) continue;
      touched.add(k);
      const gk = lab.replace(/\{.*\}/, '{}') + x + y; const ax = (am.get(lab) ?? [['', '']])[0], bx = (bm.get(lab) ?? [['', '']])[0];
      const g = groups.get(gk) ?? { keys: [], label: lab + (am.has(lab) ? '' : ' (ADDED)') + (bm.has(lab) ? '' : ' (REMOVED)'), a: [A.texts[ax[0]] ?? '', A.texts[ax[1]] ?? ''], b: [B.texts[bx[0]] ?? '', B.texts[bx[1]] ?? ''] };
      g.keys.push(k); groups.set(gk, g);
    }
  }
  console.log(`views touched: ${touched.size} (added ${added}, removed ${removed}); change groups: ${groups.size}`);
  const cut = (s: string) => (s.length > 260 ? s.slice(0, 130) + ' […] ' + s.slice(-120) : s);
  const firstDiff = (x: string, y: string) => { let i = 0; while (i < x.length && x[i] === y[i]) i++; let j = 0; while (j < x.length - i && j < y.length - i && x[x.length - 1 - j] === y[y.length - 1 - j]) j++; const s = Math.max(0, i - 40); return [`…${x.slice(s, x.length - j + 40)}`, `…${y.slice(s, y.length - j + 40)}`].map(cut); };
  let n = 0;
  for (const g of [...groups.values()].sort((p, q) => q.keys.length - p.keys.length)) {
    if (n++ >= max) { console.log(`… ${groups.size - max} more groups`); break; }
    console.log(`\n## ${g.label} — ${g.keys.length} views, e.g. ${g.keys.slice(0, 4).join(', ')}`);
    if (g.a[0] !== g.b[0]) { const [x, y] = firstDiff(g.a[0], g.b[0]); console.log(`  LA − ${x.replace(/\n/g, ' / ')}\n  LA + ${y.replace(/\n/g, ' / ')}`); }
    if (g.a[1] !== g.b[1]) { const [x, y] = firstDiff(g.a[1], g.b[1]); console.log(`  HR − ${x.replace(/\n/g, ' / ')}\n  HR + ${y.replace(/\n/g, ' / ')}`); }
  }
}

if (process.argv[1]?.endsWith('snapshot.ts')) {
  const [cmd, a, b, c] = process.argv.slice(2);
  if (cmd === 'save') save(a, b ?? 'dist');
  else if (cmd === 'diff') diff(a, b, Number(c ?? 40));
  else if (cmd === 'show') { const s = load(a); const v = s.views[b]; if (!v) console.log('no such view'); else for (const r of v.rows) if (!c || r[0].startsWith(c)) console.log(`## ${r[0]}\n${s.texts[r[1]]}\n--\n${s.texts[r[2]]}\n`); }
  else console.log('usage: save <name> [dist] | diff <a> <b> [maxGroups] | show <name> <cal|date|i> [section]');
}
