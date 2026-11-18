// Checks every round of the game as built (dist/igra/data), for the three age bands, against the calendar's data:
//   npx tsx scripts/igra/verify-data.ts  -> data/verify/igra-data.json (counts) ; used by tests/igra.test.ts
import fs from 'node:fs';
import { loadDist, zagrebDays, isRound, principal, massOf, sectionOf, hrOf } from './lib';
import { loadIgra } from './play-lib';
import { igra, maxLevel, FIXED } from '../../src/igra/pitanja';
import { SIZE, FIX, CHG } from './rounds2';
import { litYear } from './generate';
import { massWords, plain } from './words';
import { gospelBody } from './gospel-cand';
import { read } from './generate';

const HR_ONLY = /[čćžšđČĆŽŠĐ]/; const LA_ONLY = /[æœǽÆŒ]|[áéíóúý]/;
export function verifyData(dist = 'dist') {
  const D = loadDist(dist); const { BASE, all } = loadIgra(dist); const problems: string[] = []; const bad = (d: string, m: string) => problems.push(`${d}: ${m}`);
  const zd = zagrebDays(D); const days = new Map(zd.filter(isRound).map(d => [d.date, d])); const allDays = new Map(zd.map(d => [d.date, d])); const cleanT = (t: string) => t.replace(/\s*\[[^\]]*\]/g, '').trim();
  const counts: Record<string, any> = { rounds: all.length, sundays: 0, feasts: 0, byBand: { a: 0, b: 0, c: 0 }, games: {} as Record<string, number>, variants: 0, questions: 0, choices: 0, withGospel: 0, withoutGospel: 0, distinctGospelSentences: 0, wordsUsed: 0, from: all[0]?.d, to: all[all.length - 1]?.d };
  const sent = new Set<string>(); const usedWords = new Set<string>(); const forms = read('data/igra/rjecnik.yaml').rijeci as { k: string; oblici: string[] }[]; const formsOf = new Map(forms.map(w => [w.k, new Set(w.oblici)]));
  const text = (d: string, what: string, s: any) => { if (typeof s !== 'string' || !s.trim()) bad(d, `empty text: ${what}`); else if (/(?<!\p{Lu}\p{Ll}+)(^|[\s(])[NI]\.(\s|$|[,)])/u.test(s)) bad(d, `placeholder in ${what}: ${s}`); else if (/\bundefined\b|\bnull\b|\[object/.test(s)) bad(d, `broken text in ${what}: ${s}`); };
  const one = (d: string, what: string, right: string, wrong: string[], n: number) => { counts.questions++; counts.choices += 1 + wrong.length; if (wrong.length !== n) bad(d, `${what}: ${wrong.length} wrong choices, expected ${n}`); if (wrong.includes(right)) bad(d, `${what}: the right answer is among the wrong ones`); if (new Set(wrong).size !== wrong.length) bad(d, `${what}: wrong choices repeat`); [right, ...wrong].forEach(x => text(d, what, x)); };
  // fixed content
  for (const o of BASE.odgovori) { for (const f of ['la', 'laOdg', 'hr', 'hrOdg']) text('base', `odgovor ${o.id}.${f}`, o[f]); if (HR_ONLY.test(o.la + o.laOdg)) bad('base', `Croatian letters in the Latin of ${o.id}`); if (LA_ONLY.test(o.hr + o.hrOdg)) bad('base', `Latin letters in the Croatian of ${o.id}`); if (!o.strLa || !o.strHr) bad('base', `no source page for ${o.id}`); }
  for (const x of BASE.dijelovi) if (x.vrsta === 'red') { text('base', `dio ${x.id}`, x.la); text('base', `dio ${x.id}`, x.hr); if (HR_ONLY.test(x.la)) bad('base', `Croatian letters in the Latin of ${x.id}`); if (LA_ONLY.test(x.hr)) bad('base', `Latin letters in the Croatian of ${x.id}`); if (!x.strLa || !x.strHr) bad('base', `no source page for ${x.id}`); }
  for (const [k, w] of Object.entries<any>(BASE.rijeci)) { text('base', `riječ ${k}`, w.hr); text('base', `natuknica ${k}`, w.n); if (LA_ONLY.test(w.hr)) bad('base', `Latin letters in the meaning of ${k}`); if (HR_ONLY.test(k)) bad('base', `Croatian letters in the word ${k}`); if (!w.str) bad('base', `no page for ${k}`); }
  for (const r of all) {
    const day = days.get(r.d); if (!day) { bad(r.d, 'not a round day of the calendar'); continue; } days.delete(r.d);
    r.wd === 0 ? counts.sundays++ : counts.feasts++;
    const v = massOf(D, day, principal(day));
    if (r.t !== day.title.replace(/\s*\[[^\]]*\]/g, '').trim()) bad(r.d, 'title differs from the calendar'); if (r.k !== v.colour) bad(r.d, 'colour differs from the Mass'); if (r.c !== day.cls) bad(r.d, 'class differs'); if (!!r.g !== v.gloria || !!r.cr !== v.credo) bad(r.d, 'Gloria/Credo differ from the Mass');
    text(r.d, 'title', r.t); if (!BASE.boje[r.k]) bad(r.d, 'unknown colour');
    for (const dob of ['a', 'b', 'c'] as const) {
      counts.byBand[dob]++; const games: string[] = r.x[dob];
      if (games.length > SIZE[dob] || games.length < 2) bad(r.d, `band ${dob}: ${games.length} games (limit ${SIZE[dob]})`);
      if (games.filter(g => FIXED.includes(g)).length !== 1) bad(r.d, `band ${dob}: not exactly one fixed-knowledge game`);
      if (games.some(g => !FIX[dob].includes(g) && !CHG[dob].includes(g))) bad(r.d, `band ${dob}: a game not meant for this band`);
      if (new Set(games).size !== games.length) bad(r.d, `band ${dob}: a game twice`);
      for (const g of games) {
        counts.games[g] = (counts.games[g] ?? 0) + 1;
        if (g === 'rijeci') { counts.questions++; if (r.w.length !== 6) bad(r.d, `${r.w.length} words`); const hrs = r.w.map((w: any) => BASE.rijeci[w[0]]?.hr); if (new Set(hrs).size !== 6 || new Set(r.w.map((w: any) => w[0])).size !== 6) bad(r.d, 'words or meanings repeat');
          const inMass = new Set(massWords(v).map(plain)); for (const [k, f] of r.w) { usedWords.add(k); if (!BASE.rijeci[k]) bad(r.d, `unknown word ${k}`); if (!inMass.has(plain(f)) || !formsOf.get(k)?.has(plain(f))) bad(r.d, `word ${k} (${f}) is not in the Mass of the day`); } continue; }
        const levels = FIXED.includes(g) ? maxLevel(BASE, dob, g, true) : 1;
        for (let L = 1; L <= levels; L++) {
          counts.variants++; const steps = igra(BASE, r, dob, g, L).koraci; const where = `${dob} ${g} L${L}`;
          if (!steps.length) bad(r.d, `${where}: no steps`);
          for (const k of steps) {
            text(r.d, `${where} question`, k.pitanje);
            if (k.t === 'izbor') {
              counts.questions++; counts.choices += k.izbori.length;
              const right = k.izbori.filter(x => x.v === k.tocno); if (right.length !== 1) bad(r.d, `${where}: ${right.length} right answers`);
              if (k.izbori.length < 2) bad(r.d, `${where}: fewer than two choices`);
              const shown = k.izbori.map(x => `${x.hr ?? ''}|${x.la ?? ''}|${x.boja ?? ''}`.toLowerCase().replace(/[.!?,]/g, ''));
              if (new Set(shown).size !== shown.length || new Set(k.izbori.map(x => x.v)).size !== k.izbori.length) bad(r.d, `${where}: choices repeat: ${shown.join(' / ')}`);
              for (const x of k.izbori) { if (!x.hr && !x.la && !x.boja) bad(r.d, `${where}: an empty choice`); if (x.hr) text(r.d, where, x.hr); if (x.la) text(r.d, where, x.la); if (x.hr && LA_ONLY.test(x.hr) && !['evandjelje', 'sveci', 'boja'].includes(g)) bad(r.d, `${where}: Latin letters in a Croatian choice ${x.hr}`); }
              const u: any = k.uvod; if (u) { for (const f of ['hr', 'la', 'dan']) if (f in u && u[f] !== undefined) text(r.d, `${where} intro`, u[f]); }
            } else {
              counts.questions++; if (k.stavke.length < 3) bad(r.d, `${where}: fewer than three items to order`);
              if (new Set(k.stavke.map(x => x.v)).size !== k.stavke.length || new Set(k.stavke.map(x => (x.hr ?? x.la)!.toLowerCase())).size !== k.stavke.length) bad(r.d, `${where}: items repeat`);
              for (const x of k.stavke) text(r.d, where, x.hr ?? x.la);
            }
          }
        }
        // the content of the day's games against the calendar
        if (g === 'misa') { const ids: string[] = r.p; const order = BASE.dijelovi.map((x: any) => x.id); if (ids.some((id, i) => i && order.indexOf(id) <= order.indexOf(ids[i - 1]))) bad(r.d, 'parts out of order');
          if (r.p.includes('gloria') !== !!r.g || r.p.includes('credo') !== !!r.cr) bad(r.d, 'Gloria/Credo in the list do not match the day'); if (r.p.includes('Sequentia') !== !!sectionOf(v, 'Sequentia')) bad(r.d, 'Sequence does not match the day');
          for (const id of ids) { const x = BASE.dijelovi.find((y: any) => y.id === id); const n = x.vrsta === 'red' ? [x.la, x.hr] : (r.pl?.[id] ?? BASE.oznake[id]); const sec = sectionOf(v, id); if (sec && (sec.la !== n[0] || sec.hr !== n[1])) bad(r.d, `name of ${id} differs from the calendar`); } }
        if (g === 'evandjelje') { const e = r.e; if ((e.s.match(/_____/g) ?? []).length !== 1) bad(r.d, 'not exactly one blank'); const gs = sectionOf(v, 'Evangelium'); const body = gs ? gospelBody(hrOf(D, gs) ?? '') : ''; const full = e.s.replace('_____', e.a);
          if (!body.includes(full)) bad(r.d, 'the sentence is not in the Croatian Gospel of the day as the calendar shows it'); if (full.length > 160) bad(r.d, 'sentence too long'); sent.add(full); }
        if (g === 'poredaj') { const gs = sectionOf(v, 'Evangelium'); const body = gs ? gospelBody(hrOf(D, gs) ?? '') : ''; let at = -1; for (const s2 of r.po) { const i = body.indexOf(s2, at + 1); if (i <= at) bad(r.d, 'poredaj: a sentence is not in the Gospel of the day, or not in this order'); at = i; } }
        if (g === 'dio') for (const q of r.di) { const sec = sectionOf(v, q.p); const h = sec ? hrOf(D, sec) : null; if (!h) bad(r.d, `dio: ${q.p} has no Croatian`); const strip = (x: string) => x.replace(/<\/?[ib]>/g, '').replace(/\s+/g, ' '); if (h && !strip(h).includes(q.hr.replace(/ …$/, ''))) bad(r.d, `dio: the Croatian opening of ${q.p} is not its text`); const la = sec!.blocks.flatMap((b: any) => b.lines).map((l: any) => l.la ?? '').join(' ').replace(/\s+/g, ' '); if (!la.includes(q.la.replace(/ …$/, ''))) bad(r.d, `dio: the Latin opening of ${q.p} is not its text`); if (r.dl[q.p][1] !== sec!.hr) bad(r.d, `dio: label of ${q.p}`); }
        if (g === 'negovori') { const gr = sectionOf(v, 'Graduale'); const said = new Set(['kyrie', 'sanctus', 'paternoster', ...(v.gloria ? ['gloria'] : []), ...(v.credo ? ['credo'] : []), ...(gr && /Aleluja/.test(gr.hr) ? ['aleluja'] : [])]); for (const q of r.ng) { if (said.has(q.a)) bad(r.d, `negovori: ${q.a} is said`); if (q.y.some((y: string) => !said.has(y))) bad(r.d, 'negovori: a wrong choice is not said either'); } }
        if (g === 'tjedan') r.tj.forEach(([d, t, c]: string[], i: number) => { const x = allDays.get(d); if (!x || cleanT(x.title) !== t) bad(r.d, `tjedan: day ${d}`); const mv = x && massOf(D, x, principal(x)); if (mv && mv.colour !== c) bad(r.d, `tjedan: colour of ${d}`); if (i && Date.parse(d) - Date.parse(r.tj[i - 1][0]) !== 86400000) bad(r.d, 'tjedan: days not consecutive'); });
        if (g === 'sveci') for (const [d, t] of r.sv) { const x = allDays.get(d); if (!x || cleanT(x.title) !== t || x.celebration.kind !== 'feast' || d <= r.d || Date.parse(d) - Date.parse(r.d) > 6 * 86400000) bad(r.d, `sveci: ${d} ${t}`); }
        if (g === 'koliko') { const k = r.kn; const sundays = [...allDays.values()].filter(x => x.date > r.d && x.date <= k.d && x.weekday === 0).length; if (sundays !== k.n || k.s.length !== k.n) bad(r.d, `koliko: ${k.n} against ${sundays}`); const t = allDays.get(k.d)!; if (!(k.c === 'bozic' ? k.d.endsWith('-12-25') : t.temporalId === (k.c === 'uskrs' ? 'Pasc0-0' : 'Pasc7-0'))) bad(r.d, 'koliko: wrong target'); }
      }
    }
    r.e ? counts.withGospel++ : counts.withoutGospel++;
    // rubrics reflected in the answers
    const ids = new Set([...r.o, ...r.ol, ...r.od].map((q: string[]) => q[0])); const rite = day.masses.some(m => m.kind === 'rite');
    const psalm = ['iudica', 'emitte', 'confitebor', 'gloriapatri'].filter(x => ids.has(x)); if (psalm.length && (rite || v.colour === 'b' || (/^(Quad5|Quad6)-/.test(day.temporalId) && day.celebration.id.startsWith('Tempora')))) bad(r.d, 'Psalm 42 on a day that omits it (Missal p. 216)');
    if (rite && ids.has('misereatur')) bad(r.d, 'Misereatur on a day with a blessing before Mass');
    const prev = all[all.indexOf(r) - 1]; const setOf = (q: string[][]) => q.map(x => x[0]).sort().join(); if (prev && (setOf(prev.o) === setOf(r.o) || setOf(prev.ol) === setOf(r.ol))) bad(r.d, 'the same set of answers as the round before');
    if (rite && ['introibo', 'adiutorium', 'deustu', 'ostende', 'exaudi', 'iudica', 'emitte', 'confitebor', 'gloriapatri'].some(x => ids.has(x))) bad(r.d, 'prayers at the foot of the altar on a day with a blessing before Mass'); if (rite && r.p.includes('pristupne')) bad(r.d, 'Pristupne molitve listed on a day with a blessing before Mass');
    if (v.colour === 'b' && (ids.has('ite') || ids.has('benedicat'))) bad(r.d, 'Ite/blessing in a Requiem'); if (day.temporalId === 'Quad6-0' && ids.has('evangelium')) bad(r.d, 'Gloria tibi at the Passion'); if (day.temporalId === 'Pasc0-0' && ids.has('ite')) bad(r.d, 'plain Ite on Easter Sunday');
  }
  for (const d of days.keys()) bad(d, 'a round day of the calendar has no round');
  // variety: consecutive rounds differ, the fixed game never twice running (also from Sunday to Sunday), each fixed game ≥ 8 times a liturgical year
  const variety: any = {};
  for (const dob of ['a', 'b', 'c'] as const) {
    const fx = (r: any) => r.x[dob].find((g: string) => FIXED.includes(g)); const perYear: Record<number, Record<string, number>> = {}; let sameSet = 0; let prevSun: any = null;
    all.forEach((r: any, i: number) => {
      const y = litYear(r.d); (perYear[y] ??= {}); perYear[y][fx(r)] = (perYear[y][fx(r)] ?? 0) + 1;
      if (i) { const p = all[i - 1]; if (fx(p) === fx(r)) bad(r.d, `band ${dob}: the same fixed game as the round before`); if (p.x[dob].join() === r.x[dob].join()) sameSet++; }
      if (r.wd === 0) { if (prevSun && fx(prevSun) === fx(r)) bad(r.d, `band ${dob}: the same fixed game as the Sunday before`); if (prevSun && prevSun.x[dob].join() === r.x[dob].join()) bad(r.d, `band ${dob}: the same games as the Sunday before`); prevSun = r; }
    });
    const full = Object.keys(perYear).map(Number).filter(y => y >= 2026 && y <= 2035);
    for (const y of full) for (const g of FIX[dob]) if ((perYear[y][g] ?? 0) < 8) bad(String(y), `band ${dob}: ${g} only ${perYear[y][g] ?? 0} times in the liturgical year ${y}/${y + 1}`);
    variety[dob] = { sameGamesAsRoundBefore: sameSet, fixedPerYear: Object.fromEntries(Object.entries(perYear).map(([y, m]) => [y, m])), minPerFullYear: Object.fromEntries(FIX[dob].map(g => [g, Math.min(...full.map(y => perYear[y][g] ?? 0))])) };
  }
  counts.variety = variety;
  counts.distinctGospelSentences = sent.size; counts.wordsUsed = usedWords.size; counts.words = Object.keys(BASE.rijeci).length; counts.problems = problems.length;
  return { counts, problems };
}
if (process.argv[1]?.endsWith('verify-data.ts')) { const r = verifyData(); fs.writeFileSync('data/verify/igra-data.json', JSON.stringify(r.counts, null, 1) + '\n'); console.log(JSON.stringify(r.counts)); console.log(r.problems.slice(0, 30).join('\n')); process.exit(r.problems.length ? 1 : 0); }
