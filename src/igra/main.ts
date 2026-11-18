// "Nedjeljni izazov": a short weekly game beside the calendar. A single page, classic script, data from script tags
// (data/base.js, data/r/<liturgical year>.js), so that it also opens from disk. Nothing leaves the device: profiles and
// albums are kept in localStorage.
import { figure, icon, outline, sticker } from './crtez';
import { Dob, Profil, Spremljeno, readStore as readStored, writeStore, eraseStore, empty } from './store';

interface Odgovor { id: string; la: string; laOdg: string; hr: string; hrOdg: string; strLa: number; strHr: number; lako?: boolean }
interface Dio { id: string; vrsta: 'red' | 'vlastito'; la?: string; hr?: string; kratko?: boolean; strLa?: number; strHr?: number }
interface Ruho { id: string; la: string; hr: string }
interface Rijec { n: string; hr: string; str: number; nacrt?: boolean }
interface Base {
  from: string; to: string; firstAlbum: number; boje: Record<string, string>; ruho: Ruho[]; ruhoIzvor: string; ruhoHrIzvor: string;
  odgovori: Odgovor[]; dijelovi: Dio[]; oznake: Record<string, [string, string]>; izvorLa: string; izvorHr: string;
  rijeci: Record<string, Rijec>; rjecnikIzvor: string; godine: number[]; built: string;
}
interface Round {
  d: string; t: string; c: number; k: string; wd: number; s: string; f: string; ml?: string; g: 0 | 1; cr: 0 | 1;
  dan: string[]; o: string[][]; ol: string[][]; p: string[]; pl?: Record<string, [string, string]>; w: [string, string][];
  e: { s: string; a: string; x: string[]; ref: string } | null;
}

const W = window as any;
let BASE: Base; const R: Record<number, Round[]> = {};
W.IGRA = { base: (b: Base) => { BASE = b; start(); }, r: (y: number, rs: Round[]) => { R[y] = rs; } };
const here = (document.currentScript as HTMLScriptElement | null)?.src.replace(/app\.js.*$/, '') ?? '';
const waiting: Record<string, Promise<boolean>> = {};
function load(src: string): Promise<boolean> {
  return (waiting[src] ??= new Promise(res => { const s = document.createElement('script'); s.src = here + src; s.onload = () => res(true); s.onerror = () => { delete waiting[src]; res(false); }; document.head.appendChild(s); }));
}
async function needYear(y: number): Promise<Round[]> { if (!R[y] && BASE.godine.includes(y)) await load(`data/r/${y}.js`); return R[y] ?? []; }

// ---------- dates
const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const dateOf = (iso: string) => new Date(iso + 'T00:00:00Z');
const addDays = (iso: string, n: number) => isoOf(new Date(dateOf(iso).getTime() + n * 86400000));
const validDate = (d: string | null | undefined): string | null => (d && /^\d{4}-\d\d-\d\d$/.test(d) && !isNaN(dateOf(d).getTime()) && isoOf(dateOf(d)) === d ? d : null);
const WD = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota'];
const MON = ['siječnja', 'veljače', 'ožujka', 'travnja', 'svibnja', 'lipnja', 'srpnja', 'kolovoza', 'rujna', 'listopada', 'studenoga', 'prosinca'];
const SEASON: Record<string, string> = { advent: 'Došašće', christmas: 'Božićno vrijeme', epiphany: 'Vrijeme Bogojavljenja', afterEpiphany: 'Vrijeme po Bogojavljenju', septuagesima: 'Predkorizmeno vrijeme', lent: 'Korizma', passion: 'Vrijeme Muke', easter: 'Vazmeno vrijeme', afterPentecost: 'Vrijeme po Duhovima' };
const fmtDate = (iso: string) => { const d = dateOf(iso); return `${d.getUTCDate()}. ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}.`; };
const fmtDay = (iso: string) => `${WD[dateOf(iso).getUTCDay()]}, ${fmtDate(iso)}`;
const shortDate = (iso: string) => `${+iso.slice(8)}. ${+iso.slice(5, 7)}.`;
/** Today in Zagreb; "?danas=YYYY-MM-DD" sets another day (used by the checks and by a parent who wants to look ahead). */
function today(): string {
  const o = validDate(new URLSearchParams(location.search.slice(1) || location.hash.slice(1)).get('danas')); if (o) return o;
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zagreb', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); } catch { return isoOf(new Date()); }
}
/** First Sunday of Advent of a year; the liturgical year of a date is named by the year in which it begins. */
function adventOf(y: number): string { const x = new Date(Date.UTC(y, 11, 25)); const wd = x.getUTCDay(); return isoOf(new Date(x.getTime() - ((wd === 0 ? 7 : wd) + 21) * 86400000)); }
const litYear = (iso: string) => { const y = +iso.slice(0, 4); return iso >= adventOf(y) ? y : y - 1; };
/** A round is open from the Monday before its day to the Saturday after it. */
const openFrom = (r: Round) => addDays(r.d, -(r.wd === 0 ? 6 : r.wd === 1 ? 7 : r.wd - 1));
const openTo = (r: Round) => addDays(r.d, r.wd === 6 ? 7 : 6 - r.wd);
const isOpen = (r: Round, t = today()) => openFrom(r) <= t && t <= openTo(r);

// ---------- storage (this device only)
const LS = (() => { try { return window.localStorage; } catch { return null; } })();
let S: Spremljeno = readStored(LS);
let storageWorks = true;
function save() { storageWorks = writeStore(LS, S); }
const me = (): Profil | null => S.profili.find(p => p.id === S.tko) ?? null;
const DOB: Record<Dob, string> = { a: '6–7 godina', b: '8–10 godina', c: '11 godina i više' };
const GAMES: Record<Dob, string[]> = { a: ['boja', 'ruho'], b: ['boja', 'ruho', 'odgovori', 'dijelovi'], c: ['boja', 'ruho', 'odgovori', 'dijelovi', 'rijeci', 'evandjelje'] };
const NAZIV: Record<string, string> = { boja: 'Boja i dan', ruho: 'Obuci svećenika', odgovori: 'Odgovori na misi', dijelovi: 'Složi misu', rijeci: 'Riječi nedjelje', evandjelje: 'Dopuni evanđelje' };
const gamesFor = (p: Profil, r: Round) => GAMES[p.dob].filter(g => g !== 'evandjelje' || r.e);

// ---------- small helpers
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function shuffle<T>(a: T[]): T[] { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
/** a shuffle that is never the right order itself (for the ordering games) */
function mixed<T>(a: T[]): T[] { if (a.length < 2) return a.slice(); for (let n = 0; n < 20; n++) { const b = shuffle(a); if (b.some((x, i) => x !== a[i])) return b; } return a.slice().reverse(); }
const main = () => document.getElementById('main')!;
const btn = (act: string, label: string, attrs = '', cls = 'btn') => `<button type="button" class="${cls}" data-act="${act}" ${attrs}>${label}</button>`;
const chip = (k: string) => `<span class="chip c-${k}" aria-hidden="true"></span>`;

// ---------- routing
interface State { v: 'pocetak' | 'album' | 'roditelji' | 'igra' | 'list'; d: string | null; g: number | null }
const st: State = { v: 'pocetak', d: null, g: null };
function readUrl() {
  const p = new URLSearchParams(location.search.slice(1) || location.hash.slice(1));
  const d = validDate(p.get('d')); const v = p.get('v');
  st.d = d; st.g = /^\d{4}$/.test(p.get('g') ?? '') ? +p.get('g')! : null;
  st.v = d ? (p.get('ispis') ? 'list' : 'igra') : v === 'album' || v === 'roditelji' ? v : 'pocetak';
}
function urlFor(o: Partial<State>): string {
  const s = { ...st, ...o }; const p: string[] = [];
  if (s.v === 'igra' || s.v === 'list') { p.push('d=' + s.d); if (s.v === 'list') p.push('ispis=1'); }
  else if (s.v !== 'pocetak') { p.push('v=' + s.v); if (s.v === 'album' && s.g) p.push('g=' + s.g); }
  const t = new URLSearchParams(location.search.slice(1) || location.hash.slice(1)).get('danas'); if (validDate(t)) p.push('danas=' + t);
  return '?' + p.join('&');
}
function go(o: Partial<State>, replace = false) {
  Object.assign(st, { d: null, g: null }, o);
  const u = urlFor({});
  try { replace ? history.replaceState(null, '', u) : history.pushState(null, '', u); } catch { location.hash = u.slice(1); }
  window.scrollTo(0, 0); play = null;
  return render();
}
const link = (o: Partial<State>, text: string, cls = '') => `<a href="${esc(urlFor({ d: null, g: null, ...o }))}" data-go='${esc(JSON.stringify(o))}'${cls ? ` class="${cls}"` : ''}>${text}</a>`;

// ---------- views
async function roundOf(d: string): Promise<Round | null> { return (await needYear(litYear(d))).find(r => r.d === d) ?? null; }
async function openRounds(): Promise<Round[]> {
  const t = today(); const ys = [...new Set([litYear(addDays(t, -7)), litYear(addDays(t, 8))])];
  const all = (await Promise.all(ys.map(needYear))).reduce<Round[]>((a, b) => a.concat(b), []);
  return all.filter(r => isOpen(r, t)).sort((a, b) => (a.d < b.d ? -1 : 1));
}
const markOf = (r: Round, p: Profil | null) => (p ? S.gotovo[p.id]?.[r.d] : undefined);

function profileBar(): string {
  const p = me();
  if (!S.profili.length) return '';
  return `<div class="tko" role="group" aria-label="Tko igra"><span class="lab">Igra:</span>${S.profili.map(x => btn('tko', esc(x.ime), `data-id="${x.id}" aria-pressed="${x.id === p?.id}"`, 'btn ime')).join('')}${btn('novi', '+ dodaj dijete', '', 'btn tiho')}</div>`;
}
function newProfileForm(first: boolean): string {
  return `<form class="novi card" data-form="novi" autocomplete="off">
    <h2>${first ? 'Tko igra?' : 'Novo dijete'}</h2>
    <p><label for="ime">Ime ili nadimak</label><input id="ime" name="ime" type="text" maxlength="20" required autocapitalize="words"></p>
    <fieldset><legend>Koliko ima godina?</legend>${(['a', 'b', 'c'] as Dob[]).map((d, i) => `<label class="radio"><input type="radio" name="dob" value="${d}"${i === 1 ? ' checked' : ''}> ${DOB[d]}</label>`).join('')}</fieldset>
    <p class="small">Ime ostaje samo na ovom uređaju. Dob se može kasnije promijeniti na stranici „Za roditelje“.</p>
    <p><button type="submit" class="btn glavni">Spremi</button>${first ? '' : ' ' + btn('odustani', 'Odustani')}</p>
  </form>`;
}
let adding = false;
async function viewStart(): Promise<string> {
  const p = me(); const open = await openRounds(); const t = today();
  let h = `<h1>Nedjeljni izazov</h1><p class="uvod">Kratka igra prije mise. Upoznaj boju, dan, dijelove mise i evanđelje, pa ih prepoznaj u crkvi.</p>`;
  if (!S.profili.length || adding) return h + newProfileForm(!S.profili.length);
  h += profileBar();
  if (!open.length) h += `<p class="card">Ovaj tjedan nema izazova. ${t < BASE.from ? 'Prvi izazov otvara se ' + fmtDate(addDays(BASE.from, -6)) : t > BASE.to ? 'Izazovi su pripremljeni do ' + fmtDate(BASE.to) : 'Dođi opet u ponedjeljak.'}</p>`;
  // the day that is still to come first, then the day that has passed
  const next = open.filter(r => r.d >= t), past = open.filter(r => r.d < t).reverse();
  const card = (r: Round, when: string) => {
    const m = markOf(r, p);
    return `<article class="card runda${m ? ' gotova' : ''}"><p class="kad">${when}</p><h2>${r.wd === 0 ? 'Nedjelja' : 'Blagdan'}, ${fmtDate(r.d)}</h2>
      ${m ? `<p class="stanje">${sticker(r.k, m === 'n', 44)} <span>Gotovo. ${esc(r.t)}</span></p>` : `<p class="small">${gamesFor(p!, r).length} kratkih igara · oko pet minuta</p>`}
      <p>${link({ v: 'igra', d: r.d }, m ? 'Igraj ponovno' : 'Igraj', 'btn ' + (m ? '' : 'glavni'))} ${link({ v: 'list', d: r.d }, 'List za ispis', 'btn tiho')}</p></article>`;
  };
  h += next.map((r, i) => card(r, r.d === t ? 'Danas' : i === 0 ? 'Ovaj tjedan' : 'Također ovaj tjedan')).join('');
  h += past.map(r => card(r, 'Još se može do subote')).join('');
  h += `<p class="dolje">${link({ v: 'album' }, 'Moj album', 'btn')} ${link({ v: 'roditelji' }, 'Za roditelje', 'btn tiho')}</p>`;
  return h;
}

async function viewAlbum(): Promise<string> {
  const p = me(); const t = today();
  const years = BASE.godine.filter(y => y >= BASE.firstAlbum);
  const y = st.g && years.includes(st.g) ? st.g : years.includes(litYear(t)) ? litYear(t) : years[0];
  const rs = await needYear(y);
  let h = `<h1>Album</h1>${profileBar()}`;
  if (!p) return h + `<p class="card">Najprije dodaj dijete na ${link({ v: 'pocetak' }, 'početnoj stranici')}.</p>`;
  const i = years.indexOf(y);
  h += `<div class="godina">${i > 0 ? link({ v: 'album', g: years[i - 1] }, '‹<span class="vh"> prethodna godina</span>', 'btn kv') : '<span class="kv"></span>'}<h2>Liturgijska godina ${y}./${y + 1}.</h2>${i < years.length - 1 ? link({ v: 'album', g: years[i + 1] }, '›<span class="vh"> sljedeća godina</span>', 'btn kv') : '<span class="kv"></span>'}</div>`;
  h += `<p class="small legenda">${sticker('g', true, 22)} sličica za izazov riješen u svom tjednu · ${sticker('g', false, 22)} vježba · prazno polje prošlog dana može se igrati za vježbu</p>`;
  let season = '';
  for (const r of rs) {
    if (r.s !== season) { if (season) h += '</ul>'; season = r.s; h += `<h3>${SEASON[r.s] ?? ''}</h3><ul class="album">`; }
    const m = markOf(r, p); const open = isOpen(r, t); const future = openFrom(r) > t;
    const state = m === 'n' ? 'sličica' : m === 'v' ? 'vježba' : open ? 'otvoreno' : future ? 'još nije otvoreno' : 'za vježbu';
    const shown = m ? esc(r.t) : open ? 'otvoreno' : future ? '' : 'vježba';
    // the name of the link is its visible text; what is not visible (the day's name, the state) follows for screen readers
    const inner = `<span class="slika">${m ? sticker(r.k, m === 'n', 56) : '<span class="prazno"></span>'}</span><span class="dat">${shortDate(r.d)}</span><span class="naz">${shown}</span><span class="vh">${m ? '' : future ? (r.wd === 0 ? 'nedjelja' : 'blagdan') : esc(r.t)}${shown === state ? '' : ', ' + state}</span>`;
    h += future && !m ? `<li class="polje buduce">${inner}</li>`
      : `<li class="polje${m ? ' ima' : ''}${open ? ' otvoreno' : ''}"><a href="${esc(urlFor({ v: 'igra', d: r.d, g: null }))}" data-go='${esc(JSON.stringify({ v: 'igra', d: r.d }))}'>${inner}</a></li>`;
  }
  if (season) h += '</ul>';
  return h;
}

let confirmErase = false;
function viewParents(): string {
  const rows = S.profili.map(p => `<li class="card dijete"><strong>${esc(p.ime)}</strong>
    <label>Dob <select data-change="dob" data-id="${p.id}">${(['a', 'b', 'c'] as Dob[]).map(d => `<option value="${d}"${p.dob === d ? ' selected' : ''}>${DOB[d]}</option>`).join('')}</select></label>
    ${p.dob === 'a' ? `<label class="radio"><input type="checkbox" data-change="vel" data-id="${p.id}"${p.vel ? ' checked' : ''}> VELIKA TISKANA SLOVA</label>` : ''}
    ${btn('brisi-dijete', 'Ukloni', `data-id="${p.id}" aria-label="Ukloni dijete ${esc(p.ime)} i njegov album"`, 'btn tiho')}</li>`).join('');
  return `<h1>Za roditelje</h1>
  <section class="tekst">
  <h2>Čemu služi</h2>
  <p>Nedjeljni izazov je kratka igra koju dijete odigra <strong>prije nedjeljne mise</strong>, kod kuće ili u autu. Na misi tada prepozna ono što je igralo: boju misnice, dan, dijelove mise, odgovore, nekoliko latinskih riječi i evanđelje.</p>
  <p>Igra traje oko pet minuta i onda završi. Nema bodova, nema natjecanja među djecom i nema sata koji požuruje. Krivi odgovor se mirno ispravi i može se pokušati ponovno.</p>
  <p><strong>Igra nije za vrijeme mise.</strong> U crkvi uređaj ostaje u džepu.</p>
  <h2>Što dijete dobiva</h2>
  <p>Za svaku nedjelju i za svaki blagdan I. i II. razreda postoji jedan izazov. Otvoren je od ponedjeljka prije do subote poslije toga dana. Tko ga riješi u tom tjednu, dobiva sličicu u boji dana u svom albumu liturgijske godine. Raniji dani mogu se igrati za vježbu i dobivaju tiši znak. Propušteni tjedan nije nikakav gubitak.</p>
  <h2>Dob</h2>
  <ul><li><strong>6–7 godina:</strong> boja dana i oblačenje svećenika.</li><li><strong>8–10 godina:</strong> još i dan, odgovori na misi i kraći red mise.</li><li><strong>11 godina i više:</strong> još i cijeli red mise, latinske riječi i rečenica iz evanđelja.</li></ul>
  <h2>Djeca na ovom uređaju</h2>
  ${rows ? `<ul class="djeca">${rows}</ul>` : '<p>Još nema nijednog djeteta.</p>'}
  ${adding ? newProfileForm(false) : `<p>${btn('novi', 'Dodaj dijete')}</p>`}
  <h2>Privatnost</h2>
  <p>Ništa ne napušta ovaj uređaj. Nema računa, kolačića ni praćenja, a stranica ne šalje zahtjeve nijednoj drugoj stranici. Imena djece i albumi spremljeni su samo u ovom pregledniku. Na drugom uređaju album počinje iznova.</p>
  ${storageWorks ? '' : '<p class="upozorenje">Ovaj preglednik ne dopušta spremanje (privatni način rada). Igra radi, ali se album neće sačuvati.</p>'}
  <h2>Ispis</h2>
  <p>Svaki izazov ima list za ispis na jednoj stranici A4: misnica za bojanje, riječi za spajanje, dijelovi mise za brojanje i rečenica iz evanđelja. Otvorite ga gumbom „List za ispis“ na početnoj stranici ili na kraju igre.</p>
  <h2>Brisanje</h2>
  ${confirmErase ? `<p class="upozorenje" role="alert">Obrisati svu djecu i sve albume na ovom uređaju? To se ne može vratiti. ${btn('brisi-sve-da', 'Da, obriši sve', '', 'btn opasno')} ${btn('brisi-sve-ne', 'Ne')}</p>` : `<p>${btn('brisi-sve', 'Obriši sve s ovog uređaja', '', 'btn')}</p>`}
  <h2>Izgled</h2>
  <p>${btn('tema', 'Svijetlo / tamno')}</p>
  <h2>Odakle je sadržaj</h2>
  <ul class="izvori">
    <li><strong>Boja, dan, dijelovi mise, evanđelje:</strong> iz ovoga kalendara (Rimski misal 1962., zagrebački kalendar).</li>
    <li><strong>Oblačenje svećenika:</strong> ${esc(BASE.ruhoIzvor)}; nazivi: ${esc(BASE.ruhoHrIzvor)}.</li>
    <li><strong>Odgovori i red mise:</strong> latinski ${esc(BASE.izvorLa)}; hrvatski ${esc(BASE.izvorHr)}.</li>
    <li><strong>Latinske riječi:</strong> ${esc(BASE.rjecnikIzvor)}.</li>
  </ul>
  <p class="small">Izazovi su pripremljeni od ${fmtDate(BASE.from)} do ${fmtDate(BASE.to)}</p>
  </section>`;
}

// ---------- the round
interface Play {
  r: Round; games: string[]; i: number; done: boolean; msg: string; ok: boolean;
  // per game
  bojaOk?: boolean; danOk?: boolean; krivo: Set<string>; izbori?: string[];
  red?: string[]; stavljeno: number;
  q: number;
  karte?: { k: string; la: boolean; t: string }[]; otv: number[]; nadjeno: Set<string>;
  finished?: boolean; practice?: boolean; dobro?: boolean;
}
let play: Play | null = null;
function newGameState(p: Play) {
  const g = p.games[p.i]; const prof = me()!;
  p.done = false; p.msg = ''; p.ok = true; p.krivo = new Set(); p.stavljeno = 0; p.q = 0; p.otv = []; p.nadjeno = new Set(); p.bojaOk = p.danOk = false; p.izbori = undefined;
  if (g === 'boja') p.izbori = shuffle([p.r.t, ...p.r.dan]);
  if (g === 'ruho') p.red = mixed(BASE.ruho.map(x => x.id));
  if (g === 'dijelovi') p.red = mixed(partsFor(p.r, prof));
  if (g === 'rijeci') p.karte = shuffle(p.r.w.reduce<{ k: string; la: boolean; t: string }[]>((a, [k]) => a.concat([{ k, la: true, t: k }, { k, la: false, t: BASE.rijeci[k].hr }]), []));
  if (g === 'evandjelje') p.izbori = shuffle([p.r.e!.a, ...p.r.e!.x]);
  if (g === 'odgovori') setQuestion(p);
}
const partsFor = (r: Round, prof: Profil) => r.p.filter(id => prof.dob === 'c' || BASE.dijelovi.find(x => x.id === id)?.kratko);
const questions = (r: Round, prof: Profil) => (prof.dob === 'b' ? r.ol : r.o);
function setQuestion(p: Play) { p.izbori = shuffle(questions(p.r, me()!)[p.q]); p.krivo = new Set(); }
const odg = (id: string) => BASE.odgovori.find(o => o.id === id)!;
const partName = (r: Round, id: string): [string, string] => { const x = BASE.dijelovi.find(d => d.id === id)!; return x.vrsta === 'red' ? [x.la!, x.hr!] : (r.pl?.[id] ?? BASE.oznake[id]); };

const WRONG = ['Još ne. Pokušaj ponovno.', 'Nije to. Probaj drugo.', 'Polako. Pogledaj još jednom.'];
const wrongMsg = () => WRONG[Math.floor(Math.random() * WRONG.length)];
function choice(act: string, v: string, inner: string, p: Play, right: boolean, solved: boolean, cls = ''): string {
  const off = p.krivo.has(v) || (solved && !right);
  return `<button type="button" class="izbor ${cls}${solved && right ? ' tocno' : ''}${p.krivo.has(v) ? ' krivo' : ''}" data-act="${act}" data-v="${esc(v)}"${off || solved ? ' disabled' : ''}>${inner}${solved && right ? '<span class="znak" aria-hidden="true">✓</span><span class="vh"> – točno</span>' : ''}</button>`;
}

function gameHtml(p: Play): string {
  const g = p.games[p.i]; const r = p.r; const prof = me()!;
  if (g === 'boja') {
    let h = `<p class="pitanje" id="pit">Koje je boje misnica na misi ovoga dana?</p><div class="izbori boje" role="group" aria-labelledby="pit">${Object.keys(BASE.boje).map(k => choice('boja', k, `<span class="uzorak c-${k}"></span><span>${BASE.boje[k]}</span>`, p, k === r.k, !!p.bojaOk, 'boja')).join('')}</div>`;
    if (p.bojaOk && prof.dob !== 'a') h += `<p class="pitanje" id="pit2">Koji je to dan?</p><div class="izbori" role="group" aria-labelledby="pit2">${p.izbori!.map(t => choice('dan', t, `<span>${esc(t)}</span>`, p, t === r.t, !!p.danOk)).join('')}</div>`;
    if (p.done) h += `<p class="sazetak">${chip(r.k)} Boja je <strong>${BASE.boje[r.k]}</strong>. Dan: <strong>${esc(r.t)}</strong>${r.ml ? ` (${esc(r.ml.toLowerCase())})` : ''}.</p>`;
    return h;
  }
  if (g === 'ruho') {
    const next = BASE.ruho[p.stavljeno];
    return `<p class="pitanje" id="pit">${p.done ? 'Svećenik je obučen za misu.' : p.stavljeno === 0 ? 'Obuci svećenika za misu. Što oblači prvo?' : 'Što oblači zatim?'}</p>
    <div class="oblacenje"><div class="lik" data-drop="lik" aria-label="Svećenik${p.stavljeno ? ': ' + BASE.ruho.slice(0, p.stavljeno).map(x => x.hr).join(', ') : ''}" role="img">${figure(p.stavljeno, r.k)}</div>
    <div class="strana"><ol class="obuceno" aria-label="Obučeno po redu">${BASE.ruho.slice(0, p.stavljeno).map(x => `<li><span>${esc(x.hr)}</span> <i lang="la">${esc(x.la)}</i></li>`).join('')}</ol>
    ${p.done ? '' : `<div class="ladica" role="group" aria-labelledby="pit">${p.red!.filter(id => BASE.ruho.findIndex(x => x.id === id) >= p.stavljeno).map(id => { const x = BASE.ruho.find(y => y.id === id)!; return `<button type="button" class="komad${p.krivo.has(id) ? ' krivo' : ''}" data-act="ruho" data-v="${id}" data-drag="1">${icon(id, r.k)}<span>${esc(x.hr)}</span></button>`; }).join('')}</div><p class="small pomoc">Dodirni komad ili ga povuci na svećenika.</p>`}</div></div>
    ${p.done ? `<p class="sazetak">Misnica je danas ${chip(r.k)} <strong>${BASE.boje[r.k]}</strong>.</p>` : ''}<span hidden data-next="${next?.id ?? ''}"></span>`;
  }
  if (g === 'odgovori') {
    const qs = questions(r, prof); const o = odg(qs[p.q][0]); const solved = p.ok && p.msg === 'ok';
    return `<p class="korak2">Pitanje ${p.q + 1} od ${qs.length}</p><div class="svecenik"><p class="lab" id="pit">Svećenik kaže:</p><p class="la" lang="la">${esc(o.la)}</p><p class="hr">${esc(o.hr)}</p></div>
    <p class="pitanje">Što odgovaramo?</p><div class="izbori" role="group" aria-labelledby="pit">${p.izbori!.map(id => { const x = odg(id); return choice('odgovor', id, `<span class="dvoje"><span lang="la" class="la">${esc(x.laOdg)}</span><span class="hr">${esc(x.hrOdg)}</span></span>`, p, id === o.id, solved); }).join('')}</div>`;
  }
  if (g === 'dijelovi') {
    const ids = partsFor(r, prof);
    return `<p class="pitanje" id="pit">${p.done ? 'Tako ide misa ovoga dana.' : p.stavljeno === 0 ? 'Složi misu po redu. Što je prvo?' : 'Što dolazi zatim?'}</p>
    <ol class="slozeno" aria-label="Složeno po redu">${ids.slice(0, p.stavljeno).map(id => { const [la, hr] = partName(r, id); return `<li><span>${esc(hr)}</span> <i lang="la">${esc(la)}</i></li>`; }).join('')}</ol>
    ${p.done ? '' : `<div class="izbori dijelovi" role="group" aria-labelledby="pit">${p.red!.filter(id => ids.indexOf(id) >= p.stavljeno).map(id => { const [la, hr] = partName(r, id); return `<button type="button" class="izbor${p.krivo.has(id) ? ' krivo' : ''}" data-act="dio" data-v="${id}"><span class="dvoje"><span class="hr">${esc(hr)}</span><span lang="la" class="la">${esc(la)}</span></span></button>`; }).join('')}</div>`}
    ${p.done ? `<p class="sazetak small">${r.g ? 'Na ovoj misi govori se Slava.' : 'Na ovoj misi nema Slave.'} ${r.cr ? 'Govori se Vjerovanje.' : 'Nema Vjerovanja.'}</p>` : ''}`;
  }
  if (g === 'rijeci') {
    const cards = p.karte!.map((c, i) => { const open = p.otv.includes(i) || p.nadjeno.has(c.k); return `<button type="button" class="karta${open ? ' otvorena' : ''}${p.nadjeno.has(c.k) ? ' nadjena' : ''}${c.la ? ' lat' : ''}" data-act="karta" data-v="${i}" aria-label="Karta ${i + 1}: ${open ? esc(c.t) + (c.la ? ' (latinski)' : '') : 'zatvorena'}"${p.nadjeno.has(c.k) ? ' disabled' : ''}>${open ? `<span${c.la ? ' lang="la"' : ''}>${esc(c.t)}</span>` : '<span class="ledja" aria-hidden="true"></span>'}</button>`; }).join('');
    return `<p class="pitanje" id="pit">${p.done ? 'Ovih šest riječi čut ćeš na misi.' : 'Nađi parove: latinska riječ i što ona znači.'}</p><div class="karte" role="group" aria-labelledby="pit">${cards}</div>
    ${p.done ? `<ul class="rjecnik">${r.w.map(([k, f]) => `<li><b lang="la">${esc(k)}</b> – ${esc(BASE.rijeci[k].hr)} <span class="small">u misi: <i lang="la">${esc(f)}</i></span></li>`).join('')}</ul><p class="small">Značenja: ${esc(BASE.rjecnikIzvor)}.</p>` : ''}`;
  }
  // evandjelje
  const e = r.e!; const solved = p.done; const parts = e.s.split('_____');
  return `<p class="pitanje" id="pit">Koja riječ nedostaje u evanđelju?</p><blockquote class="recenica">${esc(parts[0])}<span class="rupa${solved ? ' puna' : ''}">${solved ? esc(e.a) : '<span class="vh">praznina</span>'}</span>${esc(parts[1] ?? '')}${e.ref ? `<cite>${esc(e.ref)}</cite>` : ''}</blockquote>
  <div class="izbori rijeci4" role="group" aria-labelledby="pit">${p.izbori!.map(w => choice('rijec', w, `<span>${esc(w)}</span>`, p, w === e.a, solved)).join('')}</div>`;
}

function roundHtml(p: Play): string {
  const prof = me()!;
  if (p.finished) {
    return `<div class="kraj"><h1 tabindex="-1" id="naslov">Gotovo, ${esc(prof.ime)}!</h1>
    <p class="velika">${sticker(p.r.k, !p.practice, 120)}</p>
    <p><strong>${esc(p.r.t)}</strong><br>${fmtDay(p.r.d)}</p>
    <p>${p.practice ? 'Ovo je bila vježba. U albumu je tihi znak za ovaj dan.' : 'Sličica za ovaj dan je u tvom albumu.'}</p>
    <p class="savjet">Na misi pogledaj boju misnice: <strong>${BASE.boje[p.r.k]}</strong>.${prof.dob === 'a' ? '' : ' Poslušaj i odgovore koje sada znaš.'}</p>
    <p>${link({ v: 'album' }, 'Moj album', 'btn glavni')} ${link({ v: 'list', d: p.r.d }, 'List za ispis', 'btn')} ${link({ v: 'pocetak' }, 'Početak', 'btn tiho')}</p></div>`;
  }
  const g = p.games[p.i];
  return `<div class="igra igra-${g}"><p class="korak">${fmtDay(p.r.d)} · igra ${p.i + 1} od ${p.games.length}</p>
  <ol class="tocke" aria-hidden="true">${p.games.map((_, i) => `<li class="${i < p.i ? 'prosla' : i === p.i ? 'sada' : ''}"></li>`).join('')}</ol>
  <h1 tabindex="-1" id="naslov">${NAZIV[g]}</h1>
  ${gameHtml(p)}
  <p class="poruka${p.msg && p.msg !== 'ok' && !p.dobro ? ' ima' : ''}" role="status" aria-live="polite">${p.msg === 'ok' ? 'Točno!' : esc(p.msg)}</p>
  <p class="dalje">${p.done ? btn('dalje', p.i === p.games.length - 1 ? 'Završi' : 'Dalje', '', 'btn glavni') : ''}</p></div>`;
}
async function viewRound(): Promise<string> {
  const r = await roundOf(st.d!);
  if (!r) return `<h1>Nedjeljni izazov</h1><p class="card">Za ${fmtDate(st.d!)} nema izazova. Izazov postoji za svaku nedjelju i za blagdane I. i II. razreda od ${fmtDate(BASE.from)} do ${fmtDate(BASE.to)}</p><p>${link({ v: 'pocetak' }, 'Početak', 'btn')}</p>`;
  const prof = me();
  if (!prof) return `<h1>Nedjeljni izazov</h1>` + (S.profili.length && !adding ? profileBar() + '<p class="card">Odaberi tko igra.</p>' : newProfileForm(!S.profili.length));
  if (!play || play.r !== r) { play = { r, games: gamesFor(prof, r), i: 0, done: false, msg: '', ok: true, krivo: new Set(), stavljeno: 0, q: 0, otv: [], nadjeno: new Set() }; newGameState(play); }
  return roundHtml(play);
}
function finish(p: Play) {
  const prof = me()!; const open = isOpen(p.r); p.finished = true; p.practice = !open;
  const mine = (S.gotovo[prof.id] ??= {}); if (open) mine[p.r.d] = 'n'; else if (!mine[p.r.d]) mine[p.r.d] = 'v';
  save();
}
function rerender(focusTitle = false) { if (!play) return; main().innerHTML = roundHtml(play); document.body.classList.toggle('velika-slova', !!me()?.vel && me()?.dob === 'a'); if (focusTitle) { window.scrollTo(0, 0); (document.getElementById('naslov') as HTMLElement | null)?.focus({ preventScroll: true }); } }
function wrong(p: Play, v: string) { p.krivo.add(v); p.ok = false; p.msg = wrongMsg(); }

function act(a: string, v: string, el: HTMLElement) {
  const p = play; const prof = me();
  if (a === 'tko') { S.tko = el.dataset.id!; save(); play = null; render(); return; }
  if (a === 'novi') { adding = true; render().then(() => document.getElementById('ime')?.focus()); return; }
  if (a === 'odustani') { adding = false; render(); return; }
  if (a === 'tema') { const cur = document.documentElement.dataset.theme; const dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; const t = dark ? 'light' : 'dark'; try { localStorage.setItem('tlm.theme', t); } catch { /* private mode */ } document.documentElement.dataset.theme = t; return; }
  if (a === 'brisi-sve') { confirmErase = true; render(); return; }
  if (a === 'brisi-sve-ne') { confirmErase = false; render(); return; }
  if (a === 'brisi-sve-da') { confirmErase = false; S = empty(); eraseStore(LS); play = null; render(); return; }
  if (a === 'brisi-dijete') { const id = el.dataset.id!; S.profili = S.profili.filter(x => x.id !== id); delete S.gotovo[id]; delete S.razine[id]; if (S.tko === id) S.tko = S.profili[0]?.id ?? null; save(); render(); return; }
  if (a === 'ispis') { window.print(); return; }
  if (!p || !prof) return;
  const r = p.r; const g = p.games[p.i];
  if (a === 'dalje') { if (p.i === p.games.length - 1) finish(p); else { p.i++; newGameState(p); } rerender(true); return; }
  if (p.done) return;
  p.msg = ''; p.dobro = false;
  if (a === 'boja' && g === 'boja' && !p.bojaOk) { if (v === r.k) { p.bojaOk = true; p.krivo = new Set(); p.msg = 'ok'; if (prof.dob === 'a') p.done = true; } else wrong(p, v); }
  else if (a === 'dan' && g === 'boja' && p.bojaOk) { if (v === r.t) { p.danOk = true; p.done = true; p.msg = 'ok'; } else wrong(p, v); }
  else if (a === 'ruho' && g === 'ruho') { if (BASE.ruho[p.stavljeno].id === v) { p.stavljeno++; p.krivo = new Set(); p.msg = 'ok'; if (p.stavljeno === BASE.ruho.length) p.done = true; } else { p.krivo = new Set([v]); p.msg = 'Još ne. Prije toga ide nešto drugo.'; } }
  else if (a === 'dio' && g === 'dijelovi') { const ids = partsFor(r, prof); if (ids[p.stavljeno] === v) { p.stavljeno++; p.krivo = new Set(); p.msg = 'ok'; if (p.stavljeno === ids.length) p.done = true; } else { p.krivo = new Set([v]); p.msg = 'Još ne. Prije toga dolazi nešto drugo.'; } }
  else if (a === 'odgovor' && g === 'odgovori') {
    const qs = questions(r, prof);
    if (p.msg === '' && v === qs[p.q][0]) { p.ok = true; p.msg = 'ok'; rerender(); const q = p.q; setTimeout(() => { if (play !== p || p.q !== q || p.games[p.i] !== 'odgovori') return; if (p.q === qs.length - 1) { p.done = true; } else { p.q++; setQuestion(p); p.msg = ''; } rerender(); }, 1100); return; }
    wrong(p, v);
  }
  else if (a === 'karta' && g === 'rijeci') {
    const i = +v; const c = p.karte![i]; if (p.nadjeno.has(c.k) || (p.otv.length === 1 && p.otv[0] === i)) return;
    if (p.otv.length >= 2) p.otv = [];
    p.otv.push(i);
    if (p.otv.length === 2) { const [x, y] = p.otv.map(j => p.karte![j]); if (x.k === y.k && x.la !== y.la) { p.nadjeno.add(x.k); p.otv = []; p.msg = `${x.la ? x.t : y.t} – ${x.la ? y.t : x.t}`; p.dobro = true; if (p.nadjeno.size === r.w.length) p.done = true; } else p.msg = 'Nije par. Okreni druge dvije karte.'; }
  }
  else if (a === 'rijec' && g === 'evandjelje') { if (v === r.e!.a) { p.done = true; p.msg = 'ok'; } else wrong(p, v); }
  else return;
  rerender();
  // keep the keyboard user in place: focus the next thing to act on
  const f = main().querySelector<HTMLElement>(p.done ? '[data-act="dalje"]' : `[data-act="${a}"]:not([disabled])`); if (document.activeElement === document.body || !main().contains(document.activeElement)) f?.focus({ preventScroll: true });
}

// ---------- printable sheet (one A4 page)
async function viewSheet(): Promise<string> {
  const r = await roundOf(st.d!); if (!r) return viewRound();
  const short = r.p.filter(id => BASE.dijelovi.find(x => x.id === id)?.kratko);
  const seed = r.d.split('-').reduce((a, b) => a * 31 + +b, 7); const det = <T,>(a: T[], k: number): T[] => a.map((x, i) => [x, Math.sin(seed * (k + 1) + i * 12.9898) * 43758.5453 % 1] as [T, number]).sort((x, y) => x[1] - y[1]).map(x => x[0]);
  let parts = det(short, 1); if (parts.every((x, i) => x === short[i])) parts = short.slice().reverse();
  const words = r.w.map(([k]) => k); let hrs = det(words, 2); if (hrs.every((x, i) => x === words[i])) hrs = words.slice().reverse();
  const choices = r.e ? det([r.e.a, ...r.e.x], 3) : [];
  return `<div class="list">
  <p class="noprint alati">${btn('ispis', 'Ispiši', '', 'btn glavni')} ${link({ v: 'igra', d: r.d }, 'Igraj', 'btn')} ${link({ v: 'pocetak' }, 'Početak', 'btn tiho')}</p>
  <header><h1>Nedjeljni izazov</h1><p class="dan"><strong>${esc(r.t)}</strong> · ${fmtDay(r.d)}</p><p class="ime">Ime: <span class="crta"></span></p></header>
  <div class="dva">
    <section class="s-misnica"><h2>1. Oboji misnicu</h2><p>Boja dana: <strong>${BASE.boje[r.k]}</strong></p>${outline()}</section>
    <div>
    <section><h2>2. Spoji riječ i značenje</h2><div class="spoji"><ul>${words.map(k => `<li lang="la">${esc(k)} <span class="tocka"></span></li>`).join('')}</ul><ul>${hrs.map(k => `<li><span class="tocka"></span> ${esc(BASE.rijeci[k].hr)}</li>`).join('')}</ul></div></section>
    <section><h2>3. Poredaj dijelove mise brojevima</h2><ul class="broji">${parts.map(id => `<li><span class="kucica"></span> ${esc(partName(r, id)[1])}</li>`).join('')}</ul></section>
    </div>
  </div>
  ${r.e ? `<section><h2>4. Dopuni evanđelje${r.e.ref ? ` <span class="ref">(${esc(r.e.ref)})</span>` : ''}</h2><p class="recenica">${esc(r.e.s).replace('_____', '<span class="crta kratka"></span>')}</p><p class="ponuda">${choices.map(esc).join(' · ')}</p></section>` : ''}
  <footer><p class="rjesenja"><strong>Rješenja:</strong> 2. ${words.map(k => `${esc(k)} – ${esc(BASE.rijeci[k].hr)}`).join('; ')}. 3. ${short.map((id, i) => `${i + 1}. ${esc(partName(r, id)[1])}`).join(', ')}.${r.e ? ` 4. ${esc(r.e.a)}.` : ''}</p>
  <p class="izvor">Kalendar tradicionalne latinske mise, Zagreb · Rimski misal 1962. · značenja riječi: ${esc(BASE.rjecnikIzvor)}</p></footer></div>`;
}

// ---------- render and events
async function render(): Promise<void> {
  const m = main(); delete m.dataset.ready;
  document.querySelectorAll<HTMLAnchorElement>('.views a[data-nav]').forEach(a => { const on = a.dataset.nav === (st.v === 'igra' || st.v === 'list' ? '' : st.v); a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); a.href = urlFor({ v: a.dataset.nav as State['v'], d: null, g: null }); });
  document.body.dataset.v = st.v;
  const html = st.v === 'album' ? await viewAlbum() : st.v === 'roditelji' ? viewParents() : st.v === 'igra' ? await viewRound() : st.v === 'list' ? await viewSheet() : await viewStart();
  m.innerHTML = html;
  document.body.classList.toggle('velika-slova', !!me()?.vel && me()?.dob === 'a' && st.v !== 'roditelji');
  document.title = (st.v === 'album' ? 'Album · ' : st.v === 'roditelji' ? 'Za roditelje · ' : st.v === 'list' ? 'List za ispis · ' : '') + 'Nedjeljni izazov';
  m.dataset.ready = '1';
}
function start() {
  readUrl();
  document.addEventListener('click', e => {
    const t = e.target as HTMLElement; if (suppressClick) { suppressClick = false; e.preventDefault(); return; }
    const nav = t.closest<HTMLAnchorElement>('a[data-nav], a[data-go]');
    if (nav) { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); adding = false; confirmErase = false; go(nav.dataset.go ? JSON.parse(nav.dataset.go) : { v: nav.dataset.nav as State['v'] }); return; }
    const b = t.closest<HTMLElement>('[data-act]'); if (b && !(b as HTMLButtonElement).disabled) act(b.dataset.act!, b.dataset.v ?? '', b);
  });
  document.addEventListener('submit', e => {
    const f = e.target as HTMLFormElement; if (f.dataset.form !== 'novi') return; e.preventDefault();
    const ime = String(new FormData(f).get('ime') ?? '').trim().slice(0, 20); const dob = String(new FormData(f).get('dob') ?? 'b') as Dob; if (!ime) return;
    const id = 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    S.profili.push({ id, ime, dob: dob === 'a' || dob === 'c' ? dob : 'b' }); S.tko = id; save(); adding = false; play = null; render();
  });
  document.addEventListener('change', e => {
    const t = e.target as HTMLInputElement; const p = S.profili.find(x => x.id === t.dataset.id); if (!p) return;
    if (t.dataset.change === 'dob') { p.dob = t.value as Dob; if (p.dob !== 'a') delete p.vel; } else if (t.dataset.change === 'vel') p.vel = t.checked; else return;
    save(); play = null; render();
  });
  window.addEventListener('popstate', () => { readUrl(); play = null; render(); });
  dragSetup();
  render();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register(here + 'sw.js').catch(() => { /* offline use is an extra */ });
}

// ---------- dragging a vestment onto the figure (touch, pen and mouse); a tap does the same without dragging
let suppressClick = false;
function dragSetup() {
  let item: HTMLElement | null = null, ghost: HTMLElement | null = null, sx = 0, sy = 0, moving = false;
  const end = () => { ghost?.remove(); ghost = null; item?.classList.remove('nosi'); item = null; moving = false; document.querySelector('.lik')?.classList.remove('cilj'); };
  document.addEventListener('pointerdown', e => { const t = (e.target as HTMLElement).closest<HTMLElement>('[data-drag]'); if (!t || (e.pointerType === 'mouse' && e.button !== 0)) return; item = t; sx = e.clientX; sy = e.clientY; moving = false; });
  document.addEventListener('pointermove', e => {
    if (!item) return;
    if (!moving) { if (Math.hypot(e.clientX - sx, e.clientY - sy) < 10) return; moving = true; ghost = item.cloneNode(true) as HTMLElement; ghost.classList.add('duh'); ghost.removeAttribute('data-act'); ghost.style.width = item.offsetWidth + 'px'; document.body.appendChild(ghost); item.classList.add('nosi'); }
    ghost!.style.transform = `translate(${e.clientX - ghost!.offsetWidth / 2}px, ${e.clientY - ghost!.offsetHeight / 2}px)`;
    const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('.lik'); document.querySelector('.lik')?.classList.toggle('cilj', !!over);
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('pointerup', e => {
    if (!item) return; const it = item, was = moving; const over = was ? document.elementFromPoint(e.clientX, e.clientY)?.closest('.lik') : null; end();
    if (was) { suppressClick = true; setTimeout(() => { suppressClick = false; }, 60); if (over) act('ruho', it.dataset.v ?? '', it); }
  });
  document.addEventListener('pointercancel', end);
}
