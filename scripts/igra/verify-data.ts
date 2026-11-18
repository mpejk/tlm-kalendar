// Checks every round of the game as built (dist/igra/data), for the three age bands, against the calendar's data:
//   npx tsx scripts/igra/verify-data.ts  -> data/verify/igra-data.json (counts) ; used by tests/igra.test.ts
import fs from 'node:fs';
import { loadDist, zagrebDays, isRound, principal, massOf, sectionOf, hrOf } from './lib';
import { loadIgra, GAMES } from './play-lib';
import { massWords, plain } from './words';
import { gospelBody } from './gospel-cand';
import { read } from './generate';

const HR_ONLY = /[čćžšđČĆŽŠĐ]/; const LA_ONLY = /[æœǽÆŒ]|[áéíóúý]/;
export function verifyData(dist = 'dist') {
  const D = loadDist(dist); const { BASE, all } = loadIgra(dist); const problems: string[] = []; const bad = (d: string, m: string) => problems.push(`${d}: ${m}`);
  const days = new Map(zagrebDays(D).filter(isRound).map(d => [d.date, d]));
  const counts: Record<string, any> = { rounds: all.length, sundays: 0, feasts: 0, byBand: { a: 0, b: 0, c: 0 }, games: {} as Record<string, number>, questions: 0, choices: 0, withGospel: 0, withoutGospel: 0, distinctGospelSentences: 0, wordsUsed: 0, from: all[0]?.d, to: all[all.length - 1]?.d };
  const sent = new Set<string>(); const usedWords = new Set<string>(); const forms = read('data/igra/rjecnik.yaml').rijeci as { k: string; oblici: string[] }[]; const formsOf = new Map(forms.map(w => [w.k, new Set(w.oblici)]));
  const text = (d: string, what: string, s: any) => { if (typeof s !== 'string' || !s.trim()) bad(d, `empty text: ${what}`); else if (/(^|[\s(])[NI]\.(\s|$|[,)])/.test(s)) bad(d, `placeholder in ${what}: ${s}`); else if (/undefined|null|\[object/.test(s)) bad(d, `broken text in ${what}: ${s}`); };
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
    for (const dob of ['a', 'b', 'c']) {
      counts.byBand[dob]++; const games = GAMES[dob].filter(g => g !== 'evandjelje' || r.e);
      const want = dob === 'a' ? 2 : dob === 'b' ? 4 : 6; if (games.length !== want) bad(r.d, `band ${dob}: ${games.length} games, expected ${want}`);
      for (const g of games) {
        counts.games[g] = (counts.games[g] ?? 0) + 1;
        if (g === 'boja') { one(r.d, 'colour', r.k, Object.keys(BASE.boje).filter(k => k !== r.k), 5); if (dob !== 'a') one(r.d, 'day', r.t, r.dan, 3); }
        if (g === 'ruho') { if (BASE.ruho.length !== 6) bad(r.d, 'not six vestments'); counts.questions++; }
        if (g === 'odgovori') { const qs: string[][] = dob === 'b' ? r.ol : r.o; if (qs.length !== (dob === 'b' ? 4 : 5)) bad(r.d, `band ${dob}: ${qs.length} answers`); if (new Set(qs.map(q => q[0])).size !== qs.length) bad(r.d, 'an answer is asked twice');
          for (const q of qs) { const [o, ...ws] = q.map(id => BASE.odgovori.find((x: any) => x.id === id)); if (!o || ws.some(x => !x)) { bad(r.d, 'unknown answer id'); continue; } one(r.d, `answer ${o.id} (la)`, o.laOdg, ws.map(x => x.laOdg), dob === 'b' ? 2 : 3); if (new Set([o.hrOdg, ...ws.map(x => x.hrOdg)].map(s => s.toLowerCase().replace(/[.!]/g, ''))).size !== q.length) bad(r.d, `answer ${o.id}: Croatian choices repeat`); if (dob === 'b' && !o.lako) bad(r.d, `band b got ${o.id}`); } }
        if (g === 'dijelovi') { const ids: string[] = r.p.filter((id: string) => dob === 'c' || BASE.dijelovi.find((x: any) => x.id === id)?.kratko); counts.questions++;
          if (ids.length < (dob === 'c' ? 14 : 6)) bad(r.d, `band ${dob}: only ${ids.length} parts`); if (new Set(ids).size !== ids.length) bad(r.d, 'a part repeats');
          const order = BASE.dijelovi.map((x: any) => x.id); if (ids.some((id, i) => i && order.indexOf(id) <= order.indexOf(ids[i - 1]))) bad(r.d, 'parts out of order');
          if (r.p.includes('gloria') !== !!r.g || r.p.includes('credo') !== !!r.cr) bad(r.d, 'Gloria/Credo in the list do not match the day'); if (r.p.includes('Sequentia') !== !!sectionOf(v, 'Sequentia')) bad(r.d, 'Sequence does not match the day');
          const names = ids.map(id => { const x = BASE.dijelovi.find((y: any) => y.id === id); return x.vrsta === 'red' ? [x.la, x.hr] : (r.pl?.[id] ?? BASE.oznake[id]); });
          names.forEach((n, i) => { text(r.d, `part ${ids[i]}`, n?.[0]); text(r.d, `part ${ids[i]}`, n?.[1]); if (n && HR_ONLY.test(n[0])) bad(r.d, `Croatian letters in the Latin name of ${ids[i]}`); if (n && LA_ONLY.test(n[1])) bad(r.d, `Latin letters in the Croatian name of ${ids[i]}`); const sec = sectionOf(v, ids[i]); if (sec && (sec.la !== n[0] || sec.hr !== n[1])) bad(r.d, `name of ${ids[i]} differs from the calendar`); });
          if (new Set(names.map(n => n[1])).size !== names.length) bad(r.d, 'two parts have the same name'); }
        if (g === 'rijeci') { counts.questions++; if (r.w.length !== 6) bad(r.d, `${r.w.length} words`); const hrs = r.w.map((w: any) => BASE.rijeci[w[0]]?.hr); if (new Set(hrs).size !== 6 || new Set(r.w.map((w: any) => w[0])).size !== 6) bad(r.d, 'words or meanings repeat');
          const inMass = new Set(massWords(v).map(plain)); for (const [k, f] of r.w) { usedWords.add(k); if (!BASE.rijeci[k]) bad(r.d, `unknown word ${k}`); if (!inMass.has(plain(f)) || !formsOf.get(k)?.has(plain(f))) bad(r.d, `word ${k} (${f}) is not in the Mass of the day`); } }
        if (g === 'evandjelje') { const e = r.e; one(r.d, 'gospel', e.a, e.x, 3); if ((e.s.match(/_____/g) ?? []).length !== 1) bad(r.d, 'not exactly one blank'); const gs = sectionOf(v, 'Evangelium'); const body = gs ? gospelBody(hrOf(D, gs) ?? '') : ''; const full = e.s.replace('_____', e.a);
          if (!body.includes(full)) bad(r.d, 'the sentence is not in the Croatian Gospel of the day as the calendar shows it'); if (full.length > 160) bad(r.d, 'sentence too long'); sent.add(full); if (LA_ONLY.test(full)) bad(r.d, 'Latin letters in the Gospel sentence'); }
      }
    }
    r.e ? counts.withGospel++ : counts.withoutGospel++;
    // rubrics reflected in the answers
    const ids = new Set([...r.o, ...r.ol].map((q: string[]) => q[0])); const rite = day.masses.some(m => m.kind === 'rite');
    if (rite && ['introibo', 'adiutorium', 'deustu', 'ostende', 'exaudi'].some(x => ids.has(x))) bad(r.d, 'prayers at the foot of the altar on a day with a blessing before Mass'); if (rite && r.p.includes('pristupne')) bad(r.d, 'Pristupne molitve listed on a day with a blessing before Mass');
    if (v.colour === 'b' && (ids.has('ite') || ids.has('benedicat'))) bad(r.d, 'Ite/blessing in a Requiem'); if (day.temporalId === 'Quad6-0' && ids.has('evangelium')) bad(r.d, 'Gloria tibi at the Passion'); if (day.temporalId === 'Pasc0-0' && ids.has('ite')) bad(r.d, 'plain Ite on Easter Sunday');
  }
  for (const d of days.keys()) bad(d, 'a round day of the calendar has no round');
  counts.distinctGospelSentences = sent.size; counts.wordsUsed = usedWords.size; counts.words = Object.keys(BASE.rijeci).length; counts.problems = problems.length;
  return { counts, problems };
}
if (process.argv[1]?.endsWith('verify-data.ts')) { const r = verifyData(); fs.writeFileSync('data/verify/igra-data.json', JSON.stringify(r.counts, null, 1) + '\n'); console.log(JSON.stringify(r.counts)); console.log(r.problems.slice(0, 30).join('\n')); process.exit(r.problems.length ? 1 : 0); }
