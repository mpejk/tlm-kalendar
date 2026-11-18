// The steps of every game of a round, for an age band and a level. Pure (no DOM, no randomness): the page renders and shuffles
// them, the checks (scripts/igra/verify-data.ts) test every round × band × level, and the play-through knows the right answers
// from here. A step is a question with choices (exactly one right) or an ordering (items in their right order).

export type Dob = 'a' | 'b' | 'c';
/** A text in one or both languages; `boja` = a colour swatch; `ikona` = drawing id (vestment, chalice piece, altar item). */
export interface Txt { hr?: string; la?: string; boja?: string; ikona?: string; mala?: string }
export interface Izbor { t: 'izbor'; pitanje: string; uvod?: Txt & { svecenik?: boolean; navod?: string; dan?: string }; izbori: (Txt & { v: string })[]; tocno: string; slika?: Slika }
export interface Red { t: 'red'; pitanje: string; stavke: (Txt & { v: string })[]; imena: boolean; slika?: 'ruho' | 'kalez' }
export type Korak = Izbor | Red;
/** what the drawing shows beside a question: the priest or the chalice with some pieces, the altar with some items */
export interface Slika { vrsta: 'ruho' | 'kalez' | 'oltar'; ima: string[] }
export interface Igra { g: string; razina: number; koraci: Korak[] }

export const NAZIV: Record<string, string> = {
  boja: 'Boja i dan', tjedan: 'Boje tjedna', koliko: 'Koliko još nedjelja?', ruho: 'Obuci svećenika', kalez: 'Složi kalež', oltar: 'Pripremi oltar',
  misa: 'Složi misu', odgovori: 'Odgovori na misi', rijeci: 'Riječi nedjelje', evandjelje: 'Dopuni evanđelje', dio: 'Koji je ovo dio?',
  negovori: 'Što se danas ne govori?', poredaj: 'Poredaj evanđelje', sveci: 'Sveci tjedna',
};
export const FIXED = ['ruho', 'kalez', 'oltar', 'misa', 'odgovori'];
const WD = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota'];
const WDU = ['u nedjelju', 'u ponedjeljak', 'u utorak', 'u srijedu', 'u četvrtak', 'u petak', 'u subotu'];
export const dayName = (iso: string) => WD[new Date(iso + 'T00:00:00Z').getUTCDay()];
export const shortDate = (iso: string) => `${+iso.slice(8)}. ${+iso.slice(5, 7)}.`;
const CILJ: Record<string, [string, string]> = { bozic: ['Božića', 'Božić'], uskrs: ['Uskrsa', 'Uskrs'], duhovi: ['Duhova', 'Duhovi'] };

/** deterministic choice from a list, by a string seed (so that a round looks the same on every device) */
export function seeded(seed: string) { let h = 2166136261; for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; }
function pickN<T>(a: T[], n: number, r: () => number): T[] { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b.slice(0, n); }

export function maxLevel(B: any, dob: Dob, g: string, ministrant = false): number {
  const m = B.maxLevel?.[dob]?.[g] ?? 1; return g === 'odgovori' && dob === 'b' && ministrant ? 3 : m;
}
const partName = (B: any, r: any, id: string): [string, string] => { const x = B.dijelovi.find((d: any) => d.id === id); return x.vrsta === 'red' ? [x.la, x.hr] : (r.pl?.[id] ?? B.oznake[id]); };
export const partsFor = (B: any, r: any, dob: Dob): string[] => r.p.filter((id: string) => dob === 'c' || B.dijelovi.find((x: any) => x.id === id)?.kratko);
const NG: Record<string, string> = { aleluja: 'Aleluja' };
const ngName = (B: any, id: string): [string, string] => id === 'aleluja' ? ['Allelúia', 'Aleluja'] : (() => { const x = B.dijelovi.find((d: any) => d.id === id); return [x.la, x.hr]; })();

/** The steps of game `g` of round `r` for band `dob` at `level`. */
export function igra(B: any, r: any, dob: Dob, g: string, level: number): Igra {
  const rnd = seeded(`${r.d}|${dob}|${g}|${level}`); const k: Korak[] = [];
  const ruho: any[] = B.ruho, kalez: any[] = B.kalez;
  if (g === 'boja') {
    k.push({ t: 'izbor', pitanje: 'Koje je boje misnica na misi ovoga dana?', izbori: Object.keys(B.boje).map(c => ({ v: c, hr: B.boje[c], boja: c })), tocno: r.k });
    if (dob !== 'a') k.push({ t: 'izbor', pitanje: 'Koji je to dan?', izbori: [r.t, ...r.dan].map((t: string) => ({ v: t, hr: t })), tocno: r.t });
  } else if (g === 'tjedan') {
    for (const [d, t, c] of r.tj) {
      const others = Object.keys(B.boje).filter(x => x !== c); const pool = dob === 'a' ? [c, ...pickN(others, 2, rnd)] : [c, ...others];
      k.push({ t: 'izbor', pitanje: 'Koje je boje misa?', uvod: { dan: `${dayName(d)}, ${shortDate(d)}`, hr: t }, izbori: Object.keys(B.boje).filter(x => pool.includes(x)).map(x => ({ v: x, hr: B.boje[x], boja: x })), tocno: c });
    }
  } else if (g === 'koliko') {
    const kn = r.kn; const n = kn.n; const wrong = [n - 2, n - 1, n + 1, n + 2, n + 3].filter(x => x > 0 && x !== n); const ws = wrong.slice(0, 3);
    const sunday = new Date(kn.d + 'T00:00:00Z').getUTCDay() === 0;
    k.push({ t: 'izbor', pitanje: `Koliko je još nedjelja do ${CILJ[kn.c][0]}?`, uvod: { hr: `Broji nedjelje poslije ovoga dana${sunday ? `; ${CILJ[kn.c][1]} je nedjelja i broji se.` : ` do ${shortDate(kn.d)}`}` }, izbori: [n, ...ws].sort((a, b) => a - b).map(x => ({ v: String(x), hr: String(x) })), tocno: String(n) });
  } else if (g === 'ruho' || g === 'kalez') {
    const items = g === 'ruho' ? ruho : kalez; const lab = (x: any) => ({ v: x.id, hr: x.hr ?? undefined, la: x.la, ikona: x.id });
    if (level <= 2) k.push({ t: 'red', pitanje: g === 'ruho' ? 'Obuci svećenika za misu.' : 'Pripremi kalež za misu.', stavke: items.map(lab), imena: level === 1, slika: g });
    else if (level === 3) {
      const miss = g === 'ruho' ? r.mz : r.kz; const others = pickN(items.filter(x => x.id !== miss && (g === 'ruho' || x.id !== 'calix')), 3, rnd);
      k.push({ t: 'izbor', pitanje: g === 'ruho' ? 'Svećenik se obukao, ali nešto nedostaje. Što?' : 'Kalež je pripremljen, ali nešto nedostaje. Što?', izbori: [items.find(x => x.id === miss), ...others].sort((a, b) => items.indexOf(a) - items.indexOf(b)).map(lab), tocno: miss, slika: { vrsta: g, ima: items.filter(x => x.id !== miss).map(x => x.id) } });
    } else for (const x of ruho) {
      const ws = pickN(ruho.filter(y => y.id !== x.id), 3, rnd);
      k.push({ t: 'izbor', pitanje: 'Uz koji dio ruha svećenik moli ovu molitvu?', uvod: { la: x.molitva }, izbori: [x, ...ws].sort((a, b) => ruho.indexOf(a) - ruho.indexOf(b)).map(lab), tocno: x.id });
    }
  } else if (g === 'oltar') {
    const it: any[] = B.oltar; const M = B.mjesta; const nm = (x: any) => ({ hr: x.hr ?? undefined, la: x.la, ikona: x.id });
    if (level === 1) {
      const stol = it.filter(x => x.mjesto === 'stolic'), alt = it.filter(x => x.mjesto !== 'stolic');
      const pick = [...pickN(stol, 2, rnd), ...pickN(alt, 4, rnd)].sort((a, b) => it.indexOf(a) - it.indexOf(b));
      for (const x of pick) k.push({ t: 'izbor', pitanje: 'Gdje to stoji na misi?', uvod: nm(x), izbori: [{ v: 'oltar', hr: 'na žrtveniku' }, { v: 'stolic', hr: M.stolic.hr }], tocno: x.mjesto === 'stolic' ? 'stolic' : 'oltar' });
    } else if (level === 2) {
      const placed: string[] = ['stolnjaci'];
      for (const x of it.filter(y => ['sredina', 'strane', 'poslanica', 'evandjelje'].includes(y.mjesto))) {
        k.push({ t: 'izbor', pitanje: 'Gdje stoji na žrtveniku?', uvod: nm(x), izbori: ['sredina', 'strane', 'poslanica', 'evandjelje'].map(m => ({ v: m, hr: M[m].hr })), tocno: x.mjesto, slika: { vrsta: 'oltar', ima: placed.slice() } });
        placed.push(x.id);
      }
    } else {
      const s = it.find(x => x.id === 'stolnjaci');
      k.push({ t: 'izbor', pitanje: 'Koliko je stolnjaka na žrtveniku?', izbori: ['1', '2', '3', '4'].map(v => ({ v, hr: v })), tocno: String(s.broj), slika: { vrsta: 'oltar', ima: ['stolnjaci'] } });
      const st = pickN(it.filter(x => x.mjesto === 'stolic'), 1, rnd)[0]; const alt = pickN(it.filter(x => x.mjesto !== 'stolic' && x.id !== 'stolnjaci'), 3, rnd);
      k.push({ t: 'izbor', pitanje: 'Što ne stoji na žrtveniku, nego na stoliću sa strane Poslanice?', izbori: [st, ...alt].sort((a, b) => it.indexOf(a) - it.indexOf(b)).map(x => ({ v: x.id, ...nm(x) })), tocno: st.id });
      const sv = it.find(x => x.mjesto === 'strane'); const ws = pickN(it.filter(x => x.mjesto !== 'strane' && x.mjesto !== 'stolic' && x.id !== 'stolnjaci'), 3, rnd);
      k.push({ t: 'izbor', pitanje: 'Što stoji s obje strane raspela?', izbori: [sv, ...ws].sort((a, b) => it.indexOf(a) - it.indexOf(b)).map(x => ({ v: x.id, ...nm(x) })), tocno: sv.id, slika: { vrsta: 'oltar', ima: ['stolnjaci', 'raspelo'] } });
    }
  } else if (g === 'misa') {
    const full = partsFor(B, r, dob); const nm = (id: string) => { const [la, hr] = partName(B, r, id); return { v: id, la, hr }; };
    if (level === 1) { const short = partsFor(B, r, 'b'); const four = pickN(short, 4, rnd).sort((a, b) => short.indexOf(a) - short.indexOf(b)); k.push({ t: 'red', pitanje: 'Složi ove dijelove mise po redu.', stavke: four.map(nm), imena: true }); }
    else if (level === 2) {
      // always the day's full order: "immediately after" must be true of the Mass, not of a shortened list
      const all: string[] = r.p; const pos = pickN(all.slice(0, -1).map((_, i) => i), 3, rnd).sort((a, b) => a - b);
      for (const i of pos) { const ws = pickN(all.filter((_, j) => j !== i && j !== i + 1), 3, rnd); k.push({ t: 'izbor', pitanje: 'Što dolazi odmah poslije ovoga dijela?', uvod: nm(all[i]), izbori: [all[i + 1], ...ws].sort((a, b) => all.indexOf(a) - all.indexOf(b)).map(nm), tocno: all[i + 1] }); }
    } else k.push({ t: 'red', pitanje: 'Složi misu ovoga dana po redu.', stavke: full.map(nm), imena: true });
  } else if (g === 'odgovori') {
    // level 1: the easy answers (band b) or the five answers (band c); level 2: five answers; level 3: two longer answers and two easy ones
    const qs: string[][] = level === 1 ? (dob === 'c' ? r.o : r.ol) : level === 2 || !r.od?.length ? r.o : [...r.od, ...r.ol.slice(0, 2)];
    const ids = B.odgovori.map((o: any) => o.id);
    for (const q of qs.slice().sort((a, b) => ids.indexOf(a[0]) - ids.indexOf(b[0]))) {
      const o = B.odgovori.find((x: any) => x.id === q[0]);
      k.push({ t: 'izbor', pitanje: 'Što odgovaramo?', uvod: { la: o.la, hr: o.hr, svecenik: true }, izbori: q.map(id => { const x = B.odgovori.find((y: any) => y.id === id); return { v: id, la: x.laOdg, hr: x.hrOdg }; }), tocno: o.id });
    }
  } else if (g === 'evandjelje') {
    const e = r.e; k.push({ t: 'izbor', pitanje: 'Koja riječ nedostaje u evanđelju?', uvod: { hr: e.s, navod: e.ref }, izbori: [e.a, ...e.x].map((w: string) => ({ v: w, hr: w })), tocno: e.a });
  } else if (g === 'dio') {
    const labels = Object.keys(r.dl);
    for (const q of r.di) {
      const ws = pickN(labels.filter(l => l !== q.p && r.dl[l][1] !== r.dl[q.p][1]), 3, rnd);
      k.push({ t: 'izbor', pitanje: 'Iz kojega je dijela mise ovaj tekst?', uvod: dob === 'c' ? { la: q.la, hr: q.hr } : { hr: q.hr }, izbori: [q.p, ...ws].sort((a, b) => labels.indexOf(a) - labels.indexOf(b)).map(l => ({ v: l, hr: r.dl[l][1], ...(dob === 'c' ? { la: r.dl[l][0] } : {}) })), tocno: q.p });
    }
  } else if (g === 'negovori') {
    for (const q of r.ng) k.push({ t: 'izbor', pitanje: 'Što se na misi ovoga dana NE govori?', izbori: [q.a, ...q.y].map((id: string) => { const [la, hr] = ngName(B, id); return { v: id, hr, la }; }), tocno: q.a });
  } else if (g === 'poredaj') {
    k.push({ t: 'red', pitanje: 'Poredaj rečenice iz evanđelja ovoga dana.', stavke: r.po.map((s: string, i: number) => ({ v: 's' + i, hr: s })), imena: true });
  } else if (g === 'sveci') {
    for (const [d, t] of r.sv) k.push({ t: 'izbor', pitanje: `Koga ili što slavimo ${WDU[new Date(d + 'T00:00:00Z').getUTCDay()]}, ${shortDate(d)}?`, izbori: r.sv.map((x: [string, string]) => ({ v: x[0], hr: x[1] })), tocno: d });
  }
  return { g, razina: level, koraci: k };
}
export { NG };
/** Round data are stored slim (scripts/igra/build.ts): the labels of "dio" as keys, the week as [title, colour] from the round's day.
 *  This restores the full form; used by the page and by the checks alike. */
export function expand(r: any, B: any): any {
  if (Array.isArray(r.dl)) r.dl = Object.fromEntries(r.dl.map((k: string) => [k, r.pl?.[k] ?? B.oznake[k]]));
  if (r.tj && r.tj[0]?.length === 2) { const t0 = Date.parse(r.d + 'T00:00:00Z'); r.tj = r.tj.map(([t, c]: [string, string], i: number) => [new Date(t0 + i * 86400000).toISOString().slice(0, 10), t, c]); }
  return r;
}
