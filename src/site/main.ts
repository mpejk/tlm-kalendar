// The site: a single page that composes day views in the browser from the calendar and formulary files.
import { Day } from '../engine/types';
import { assembleMass, formulariesFor } from '../assembler/assemble';
import { blockCore, hashKey } from '../assembler/norm';
import { Block, Corpus, Formulary, Line, MassView, Section } from '../assembler/types';

interface Base { years: { from: number; to: number }; pope: { name: string; date: string }; ordo: Corpus['ordo']; gloria: { la: string; hr: string }; credo: { la: string; hr: string }; built: string; coverage: any; hasZagreb: boolean; croatianPrimary?: 'site' | 'kniewald'; rites?: Record<string, string> }
interface CalYear { opci: Day[]; zagreb: Record<string, Day> }
type HrVal = null | { t?: string; v?: string; kn?: string; knRef?: string };
type FData = Formulary & { hr: Record<string, HrVal>; rite?: boolean; title?: string; items?: any[] };

const W = window as any;
const F: Record<string, FData> = {}; const CAL: Record<number, CalYear> = {}; let BASE: Base;
const waiting: Record<string, ((ok: boolean) => void)[]> = {};
W.TLM = { base: (b: Base) => { BASE = b; }, cal: (y: number, d: CalYear) => { CAL[y] = d; }, f: (id: string, d: FData) => { F[id] = d; } };
const here = (document.currentScript as HTMLScriptElement | null)?.src.replace(/app\.js.*$/, '') ?? '';
function load(src: string): Promise<boolean> {
  return new Promise(res => {
    if (waiting[src]) { waiting[src].push(res); return; }
    waiting[src] = [res];
    const s = document.createElement('script'); s.src = here + src;
    const done = (ok: boolean) => { const w = waiting[src]; delete waiting[src]; if (ok) loaded.add(src); w.forEach(f => f(ok)); };
    s.onload = () => done(true); s.onerror = () => done(false);
    document.head.appendChild(s);
  });
}
const loaded = new Set<string>();
const fileOf = (id: string) => id.replace(/[^A-Za-z0-9]+/g, '_');
async function need(src: string) { if (!loaded.has(src)) await load(src); }
async function needYear(y: number) { if (!CAL[y] && y >= BASE.years.from && y <= BASE.years.to) await need(`data/cal/${y}.js`); return CAL[y]; }
async function needF(ids: string[]) { await Promise.all(ids.filter(id => !F[id]).map(id => need(`data/f/${fileOf(id)}.js`))); }

// ---------- state
const WD = ['NEDJELJA', 'PONEDJELJAK', 'UTORAK', 'SRIJEDA', 'ČETVRTAK', 'PETAK', 'SUBOTA'];
const WD3 = ['NED', 'PON', 'UTO', 'SRI', 'ČET', 'PET', 'SUB'];
const MON = ['siječnja', 'veljače', 'ožujka', 'travnja', 'svibnja', 'lipnja', 'srpnja', 'kolovoza', 'rujna', 'listopada', 'studenoga', 'prosinca'];
const MONN = ['Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj', 'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const COLOUR: Record<string, string> = { w: 'bijela', r: 'crvena', v: 'ljubičasta', g: 'zelena', b: 'crna', p: 'ružičasta' };
const SEASON: Record<string, string> = { advent: 'Došašće', christmas: 'Božićno vrijeme', epiphany: 'Vrijeme Bogojavljenja', afterEpiphany: 'Vrijeme po Bogojavljenju', septuagesima: 'Predkorizmeno vrijeme', lent: 'Korizma', passion: 'Vrijeme Muke', easter: 'Vazmeno vrijeme', afterPentecost: 'Vrijeme po Duhovima' };
const COMM: Record<string, string> = { privileged: 'spomen i na tihim i na pjevanim misama', ordinary: 'spomen na tihim misama', same: 'spomen pod istim završetkom na svim misama' };
const store = { get: (k: string) => { try { return localStorage.getItem('tlm.' + k); } catch { return null; } }, set: (k: string, v: string) => { try { localStorage.setItem('tlm.' + k, v); } catch { /* private mode */ } } };
const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const dateOf = (iso: string) => new Date(iso + 'T00:00:00Z');
const addDays = (iso: string, n: number) => isoOf(new Date(dateOf(iso).getTime() + n * 86400000));
function today(): string { try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zagreb', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); } catch { return isoOf(new Date()); } }
interface State { d: string; k: 'opci' | 'zagreb'; v: 'dan' | 'mjesec' | 'godina' | 'trazi' | 'info'; m: number; q: string }
const st: State = { d: today(), k: 'zagreb', v: 'dan', m: 0, q: '' };
function readUrl() {
  const p = new URLSearchParams(location.search.slice(1) || location.hash.slice(1));
  const d = p.get('d'); st.d = d && /^\d{4}-\d\d-\d\d$/.test(d) ? d : today();
  const k = p.get('k') ?? store.get('k'); st.k = k === 'opci' || !BASE.hasZagreb ? 'opci' : 'zagreb';
  const v = p.get('v'); st.v = v === 'mjesec' || v === 'godina' || v === 'trazi' || v === 'info' ? v : 'dan';
  st.m = +(p.get('m') ?? 0) || 0; st.q = p.get('q') ?? '';
}
function urlFor(o: Partial<State>): string {
  const s = { ...st, ...o }; const p: string[] = [`d=${s.d}`];
  if (s.k === 'opci' && BASE.hasZagreb) p.push('k=opci'); if (s.v !== 'dan') p.push('v=' + s.v); if (s.m && s.v === 'dan') p.push('m=' + s.m); if (s.q && s.v === 'trazi') p.push('q=' + encodeURIComponent(s.q));
  return '?' + p.join('&');
}
function go(o: Partial<State>, replace = false) {
  if (o.d && o.m === undefined) o.m = 0;
  Object.assign(st, o); if (o.k) store.set('k', o.k);
  const u = urlFor({});
  try { replace ? history.replaceState(null, '', u) : history.pushState(null, '', u); } catch { location.hash = u.slice(1); }
  render(); window.scrollTo(0, 0);
}
async function dayOf(iso: string, k = st.k): Promise<Day | null> {
  const y = +iso.slice(0, 4); const c = await needYear(y); if (!c) return null;
  const z = k === 'zagreb' ? c.zagreb[iso.slice(5)] : undefined; if (z) return z;
  return c.opci.find(d => d.date === iso) ?? null;
}

// ---------- rendering helpers
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const h = (tag: string, attrs: Record<string, string> | null, ...kids: (string | null | undefined | false)[]) => `<${tag}${attrs ? Object.entries(attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join('') : ''}>${kids.filter(Boolean).join('')}</${tag}>`;
const link = (o: Partial<State>, text: string, cls = '', title = '') => `<a href="${esc(urlFor(o))}" data-nav='${esc(JSON.stringify(o))}'${cls ? ` class="${cls}"` : ''}${title ? ` title="${esc(title)}" aria-label="${esc(title)}"` : ''}>${text}</a>`;
const fmtDate = (iso: string) => { const d = dateOf(iso); return `${d.getUTCDate()}. ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}.`; };
const oldDate = (iso: string) => `${+iso.slice(8)}.${ROMAN[+iso.slice(5, 7)]}.${iso.slice(0, 4)}.`;
const typo = (s: string) => s.replace(/\bV\.\s/g, '℣. ').replace(/\bR\.\s/g, '℟. ').replace(/\s\+\s/g, ' ✠ ');
function laLine(l: Line): string {
  const t = esc(l.la).replace(/\(\(/g, '(').replace(/\)\)/g, ')');
  if (l.k === 'ref') return h('span', { class: 'ref' }, t);
  if (l.k === 'rubric' || l.k === 'head') return h('span', { class: 'rub' }, t);
  if (l.k === 'gloriaPatri' || l.k === 'conclusion' || l.k === 'oremus') return h('span', { class: 'formula' }, t);
  const mark = l.mark === 'V' ? '<span class="vr">℣.</span> ' : l.mark === 'R' ? '<span class="vr">℟.</span> ' : l.mark ? `<span class="vr">${esc(l.mark)}.</span> ` : '';
  return h('span', { class: 'tx' }, mark + t.replace(/(^|\s)([CSJ])\.(?=\s)/g, (_, a, b) => `${a}<span class="vr">${b === 'J' ? '✠' : b + '.'}</span>`).replace(/✠/g, '<span class="vr">✠</span>').replace(/\(([^()]{3,80})\)/g, '<span class="rub">($1)</span>'));
}
/** Croatian cell text of the old site: line breaks, <i>/<b>, inline references, bracketed rubrics. */
function hrCell(text: string): string {
  return text.split('\n').map(line => {
    const t = line.trim(); if (!t) return '<span class="gap"></span>';
    let x = esc(t).replace(/&lt;(\/?)(i|b)&gt;/g, '<$1$2>');
    if (/^<i>[^<]*<\/i>\.?$/.test(x)) return h('span', { class: 'formula' }, x.replace(/<\/?i>/g, ''));
    if (t.length < 70 && /\d/.test(t) && /^[\p{L}\d .,;:\-–()]+$/u.test(t) && !/\p{Ll}{9,}/u.test(t)) return h('span', { class: 'ref' }, x);
    x = x.replace(/\((?:[1-4I]{1,3}\.? )?\p{Lu}[\p{L}]*\.? ?\d+[^()]*\)/gu, m => `<span class="ref in">${m}</span>`).replace(/\[([^\]]*)\]/g, '<span class="rub">[$1]</span>');
    return h('span', { class: 'tx' }, x);
  }).join('');
}
function hrFor(lines: Line[], src: string | undefined): string {
  const fid = (src ?? '').split('|')[0]; const core = blockCore(lines); if (!core) return '';
  const v = F[fid]?.hr?.[hashKey(core)];
  const prim = BASE.croatianPrimary === 'kniewald' ? (v?.kn ?? v?.t) : (v?.t ?? v?.kn);
  if (!prim) return h('span', { class: 'missing' }, 'hrvatski prijevod nedostaje');
  const fromKn = prim === v?.kn;
  return hrCell(prim) + (fromKn ? h('span', { class: 'srcnote' }, esc(v?.knRef ?? 'Kniewald')) : '');
}
const PRAYER = new Set(['Oratio', 'Secreta', 'Postcommunio', 'SuperPopulum']);
function sectionHtml(s: Section): string {
  const rows: string[] = [];
  const units: { label?: string; lines: Line[]; src?: string }[] = PRAYER.has(s.key) ? s.blocks.map(b => ({ label: b.label, lines: b.lines, src: b.src ?? s.src })) : [{ lines: s.blocks.reduce<Line[]>((a, b) => a.concat(b.lines), []), src: s.src }];
  for (const u of units) {
    if (!u.lines.length && !u.label) continue;
    const lab = u.label ? h('span', { class: 'commlab' }, esc(u.label)) : '';
    rows.push(h('div', { class: 'row' }, h('div', { class: 'la', lang: 'la' }, lab, u.lines.map(laLine).join('')), h('div', { class: 'hr', lang: 'hr' }, lab, hrFor(u.lines, u.src))));
  }
  return h('section', { class: 'sec sec-' + s.key }, h('div', { class: 'row head' }, h('h2', { class: 'la', lang: 'la' }, esc(s.la)), h('h2', { class: 'hr', lang: 'hr' }, esc(s.hr))), rows.join(''));
}
function fixedHtml(title: string, t: { la: string; hr: string }): string {
  return h('details', { class: 'fixed' }, h('summary', null, esc(title)), h('div', { class: 'row' }, h('div', { class: 'la', lang: 'la' }, h('span', { class: 'tx' }, esc(t.la))), h('div', { class: 'hr', lang: 'hr' }, h('span', { class: 'tx' }, esc(t.hr)))));
}
function massHtml(v: MassView): string {
  const ins = (v as any).insert as { at: number; html: string } | undefined;
  return v.items.map((it, i) => (ins && ins.at === i ? ins.html : '') + one(it)).join('');
  function one(it: MassView['items'][number]): string {
    if (it.kind === 'section') return sectionHtml(it);
    let extra = '';
    if (it.key === 'gloria' && v.gloria && BASE.gloria) extra = fixedHtml('Tekst himna Gloria', BASE.gloria);
    if (it.key === 'credo' && v.credo && BASE.credo) extra = fixedHtml('Tekst Vjerovanja', BASE.credo);
    return h('p', { class: 'note' }, esc(it.text)) + extra;
  }
}
function riteHtml(f: FData): string {
  return (f.items ?? []).map((it: any) => {
    if (it.kind === 'note') return h('p', { class: 'note rubnote' }, esc(it.text));
    const rows = (it.rows ?? []).map((r: any) => r.la === undefined ? h('p', { class: 'note rubnote' }, esc(r.text ?? '')) : r.hr === ' ' ? h('div', { class: 'rubonly', lang: 'la' }, hrCell(typo(r.la))) : h('div', { class: r.head ? 'row sub' : 'row' }, h('div', { class: 'la', lang: 'la' }, hrCell(typo(r.la))), h('div', { class: 'hr', lang: 'hr' }, r.hr ? hrCell(typo(r.hr)) + (r.src ? h('span', { class: 'srcnote' }, esc(r.src)) : '') : h('span', { class: 'missing' }, 'hrvatski prijevod nedostaje')))).join('');
    return h('section', { class: 'sec' }, h('div', { class: 'row head' }, h('h2', { class: 'la', lang: 'la' }, esc(it.la ?? '')), h('h2', { class: 'hr', lang: 'hr' }, esc(it.hr ?? ''))), rows);
  }).join('');
}
function commLines(d: Day): string {
  return d.commemorations.map(c => h('li', null, `${COMM[c.type]}: ${esc(c.title)}${c.onlyMass !== undefined ? ` (samo ${esc(d.masses[c.onlyMass]?.label?.toLowerCase() ?? 'jedna misa')})` : ''}${c.local ? ' <span class="tag">mjesni kalendar</span>' : ''}`)).join('');
}
const chip = (c: string) => `<span class="chip c-${c}" title="${COLOUR[c]}"></span>`;
const corpus = (): Corpus => ({ formularies: F as any, texts: {}, ordo: BASE.ordo });

// ---------- views
async function viewDay(): Promise<string> {
  const d = await dayOf(st.d);
  const nav = h('nav', { class: 'daynav' }, link({ d: addDays(st.d, -1) }, '‹', 'btn', 'Prethodni dan'), h('span', { class: 'when' }, `${WD[dateOf(st.d).getUTCDay()]}, ${fmtDate(st.d)}`), link({ d: addDays(st.d, 1) }, '›', 'btn', 'Sljedeći dan'));
  if (!d) return nav + h('p', { class: 'empty' }, `Kalendar obuhvaća godine ${BASE.years.from}.–${BASE.years.to}.`);
  const gen = st.k === 'zagreb' ? await dayOf(st.d, 'opci') : null;
  const changed = !!gen && !!d.flags.local;
  const cols = d.colours ?? [d.colour];
  let head = h('h1', { class: 'c-text-' + d.colour }, esc(d.title));
  head += h('p', { class: 'meta' }, cols.map(chip).join(''), `<span>${cols.map(c => COLOUR[c]).join(' / ')}</span><span>·</span><span>${ROMAN[d.cls]}. razred</span><span>·</span><span>${SEASON[d.season] ?? ''}</span>`,
    changed ? ` <span class="tag">mjesni kalendar</span> ${link({ k: 'opci' }, 'opći kalendar', 'small')}` : '', st.k === 'opci' && BASE.hasZagreb ? ` ${link({ k: 'zagreb' }, 'zagrebački kalendar', 'small')}` : '');
  if (d.commemorations.length) head += h('ul', { class: 'comms' }, commLines(d));
  if (d.notes?.length) head += h('ul', { class: 'comms notes' }, d.notes.map(n => h('li', null, esc(n) + ' <span class="tag">mjesni kalendar</span>')).join(''));
  // open on the Mass, not on a rite that precedes it, unless a tab was chosen
  const firstMass = Math.max(0, d.masses.findIndex(x => !x.extra));
  const idx = st.m >= 0 && (st.m > 0 || new URLSearchParams(location.search.slice(1) || location.hash.slice(1)).has('m')) ? Math.min(st.m, d.masses.length - 1) : firstMass; const m = d.masses[idx];
  let tabs = '';
  if (d.masses.length > 1) tabs = h('div', { class: 'tabs', role: 'tablist' }, d.masses.map((x, i) => `<a role="tab" aria-selected="${i === idx}" href="${esc(urlFor({ m: i }))}" data-nav='${JSON.stringify({ m: i })}' class="tab${i === idx ? ' on' : ''}">${esc(x.label ?? (d.flags.rogation && x.kind === 'mass' ? 'Misa dana' : `Misa ${i + 1}`))}</a>`).join(''));
  let body = '';
  if (m.kind === 'mass') {
    await needF(formulariesFor(d, idx));
    const v = assembleMass(d, idx, corpus());
    if (v && m.id === 'Tempora/Quad6-4rm2') { await needF([m.id + ':mandatum']); const md = F[m.id + ':mandatum']; const at = v.items.findIndex(it => it.kind === 'note' && it.key === 'credo'); if (md && at >= 0) (v as any).insert = { at, html: riteHtml(md) }; }
    body = v ? h('p', { class: 'rank' }, esc(m.variant === 'rogation' ? 'Zazivna misa nakon procesije' : v.rankLine)) + massHtml(v) : h('p', { class: 'empty' }, 'Tekst mise nije dostupan.');
  } else {
    await needF([m.id]); const f = F[m.id];
    body = f?.items ? riteHtml(f) : h('p', { class: 'empty' }, 'Tekst obreda nije dostupan.');
  }
  return nav + h('header', { class: 'dayhead' }, head) + tabs + h('article', { class: 'mass' }, body);
}
async function viewMonth(): Promise<string> {
  const y = +st.d.slice(0, 4), mo = +st.d.slice(5, 7); const first = `${y}-${pad(mo)}-01`;
  const prev = isoOf(new Date(Date.UTC(y, mo - 2, 1))), next = isoOf(new Date(Date.UTC(y, mo, 1)));
  const days: (Day | null)[] = []; const n = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  for (let i = 1; i <= n; i++) days.push(await dayOf(`${y}-${pad(mo)}-${pad(i)}`));
  const lead = (dateOf(first).getUTCDay() + 6) % 7; const t = today();
  let cells = ['PON', 'UTO', 'SRI', 'ČET', 'PET', 'SUB', 'NED'].map(x => h('div', { class: 'wd' }, x)).join('') + '<div class="cell off"></div>'.repeat(lead);
  days.forEach((d, i) => { const iso = `${y}-${pad(mo)}-${pad(i + 1)}`; cells += d ? `<a class="cell c-${d.colour}${iso === t ? ' today' : ''}${d.cls <= 2 ? ' major' : ''}" href="${esc(urlFor({ d: iso, v: 'dan' }))}" data-nav='${JSON.stringify({ d: iso, v: 'dan' })}'><span class="n">${i + 1}</span><span class="t">${esc(d.title)}</span>${d.flags.local ? '<span class="tag">mj.</span>' : ''}</a>` : `<div class="cell off"><span class="n">${i + 1}</span></div>`; });
  return h('nav', { class: 'daynav' }, link({ d: prev }, '‹', 'btn', 'Prethodni mjesec'), h('span', { class: 'when' }, `${MONN[mo - 1]} ${y}.`), link({ d: next }, '›', 'btn', 'Sljedeći mjesec')) + h('div', { class: 'grid' }, cells);
}
async function viewYear(): Promise<string> {
  const y = +st.d.slice(0, 4); const c = await needYear(y);
  const nav = h('nav', { class: 'daynav' }, link({ d: `${y - 1}-01-01` }, '‹', 'btn', 'Prethodna godina'), h('span', { class: 'when' }, `${y}.`), link({ d: `${y + 1}-01-01` }, '›', 'btn', 'Sljedeća godina'));
  if (!c) return nav + h('p', { class: 'empty' }, `Kalendar obuhvaća godine ${BASE.years.from}.–${BASE.years.to}.`);
  const rows = c.opci.map(g => { const d = (st.k === 'zagreb' && c.zagreb[g.date.slice(5)]) || g;
    const comm = d.commemorations.map(x => `<br><span class="cm">${COMM[x.type]}: ${esc(x.title)}</span>`).join('');
    return `<tr class="${d.weekday === 0 ? 'sun' : ''}"><td>${oldDate(d.date)}</td><td>${WD3[d.weekday]}</td><td>${ROMAN[d.cls]}</td><td>${chip(d.colour)}</td><td>${link({ d: d.date, v: 'dan' }, esc(d.title))}${d.flags.local ? ' <span class="tag">mjesni kalendar</span>' : ''}${comm}</td></tr>`; }).join('');
  const ics = `<p class="small">Kalendar za ${y}. u formatu .ics: <a href="${here}ics/tlm-${y}-${st.k}.ics" download>preuzmi</a></p>`;
  return nav + ics + `<table class="year"><thead><tr><th>Datum</th><th>Dan</th><th>Razred</th><th></th><th>Naslov i spomeni</th></tr></thead><tbody>${rows}</tbody></table>`;
}
async function viewSearch(): Promise<string> {
  const q = st.q.trim().toLocaleLowerCase('hr'); let out = `<form class="search" data-search><label for="q">Traži blagdan ili sveca</label><input id="q" name="q" type="search" value="${esc(st.q)}" autocomplete="off"><button class="btn">Traži</button></form>`;
  if (q.length < 2) return out + h('p', { class: 'empty' }, 'Upišite barem dva slova.');
  const fold = (s: string) => s.toLocaleLowerCase('hr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  const fq = fold(q); const hits: string[] = [];
  for (let y = BASE.years.from; y <= BASE.years.to; y++) { const c = await needYear(y); if (!c) continue;
    for (const g of c.opci) { const d = (st.k === 'zagreb' && c.zagreb[g.date.slice(5)]) || g;
      const where = fold(d.title).includes(fq) ? d.title : d.commemorations.map(x => x.title).concat(d.notes ?? []).find(t => fold(t).includes(fq));
      if (where) hits.push(h('li', null, link({ d: d.date, v: 'dan' }, `${fmtDate(d.date)} — ${esc(where)}`))); } }
  return out + (hits.length ? h('p', { class: 'small' }, `${hits.length} dana`) + h('ul', { class: 'hits' }, hits.slice(0, 400).join('')) : h('p', { class: 'empty' }, 'Nema rezultata.'));
}
function viewInfo(): string {
  const c = BASE.coverage;
  return h('article', { class: 'info' }, h('h1', null, 'O kalendaru'),
    h('p', null, 'Kalendar tradicionalne latinske mise za Zagreb prema Rimskom misalu iz 1962. (Kodeks rubrika iz 1960.), za godine ' + `${BASE.years.from}.–${BASE.years.to}.` + ' Nastavlja kalendar sa stranice tradicionalnamisa.com.'),
    h('p', null, 'Prikazuju se promjenjivi dijelovi mise (proprij) na latinskom i hrvatskom. Latinski tekst: Divinum Officium; hrvatski prijevod: stranice misa s tradicionalnamisa.com, a gdje ga ondje nema, Kniewaldov Rimski misal.'),
    h('p', null, `Hrvatski prijevod: ${c.uniqueSite} tekstova sa stare stranice, ${c.uniqueKniewald} iz Kniewalda, ${c.uniqueMissing} nedostaje.`),
    h('p', null, `Spomen sv. Oca: ${esc(BASE.pope.name)}, ${+BASE.pope.date.slice(3)}. ${MON[+BASE.pope.date.slice(0, 2) - 1]}.`),
    h('p', { class: 'small' }, `Izrađeno ${BASE.built}. Bez kolačića i praćenja; postavke se pamte samo u pregledniku.`));
}

// ---------- shell
async function render() {
  const main = document.getElementById('main')!;
  document.querySelectorAll('[data-view]').forEach(a => a.classList.toggle('on', (a as HTMLElement).dataset.view === st.v));
  (document.getElementById('date') as HTMLInputElement).value = st.d;
  document.querySelectorAll('[data-view]').forEach(a => a.setAttribute('href', urlFor({ v: (a as HTMLElement).dataset.view as State['v'] })));
  const my = ++seq;
  const html = st.v === 'mjesec' ? await viewMonth() : st.v === 'godina' ? await viewYear() : st.v === 'trazi' ? await viewSearch() : st.v === 'info' ? viewInfo() : await viewDay();
  if (my !== seq) return;
  main.innerHTML = html; main.dataset.ready = st.d + '|' + st.v + '|' + st.k + '|' + st.m;
  const t = main.querySelector('h1'); document.title = (st.v === 'dan' && t ? `${t.textContent} — ${fmtDate(st.d)}` : 'Kalendar tradicionalne latinske mise') + ' · Zagreb';
}
let seq = 0;
function nextSunday(): string { let d = today(); do d = addDays(d, 1); while (dateOf(d).getUTCDay() !== 0); return d; }
function applyPrefs() {
  const r = document.documentElement;
  r.dataset.theme = store.get('theme') ?? ''; r.dataset.lang = store.get('lang') ?? 'oba'; r.style.setProperty('--fs', (store.get('fs') ?? '100') + '%'); r.dataset.paper = store.get('paper') ?? 'a4';
  let ps = document.getElementById('paper-style'); if (!ps) { ps = document.createElement('style'); ps.id = 'paper-style'; document.head.appendChild(ps); }
  ps.textContent = r.dataset.paper === 'a5' ? '@page { size: A5; margin: 9mm 8mm; }' : '';
  const pb = document.querySelector('[data-act="paper"]'); if (pb) pb.textContent = r.dataset.paper === 'a5' ? 'Papir: A5' : 'Papir: A4';
  document.querySelectorAll('[data-lang-btn]').forEach(b => b.setAttribute('aria-pressed', String((b as HTMLElement).dataset.langBtn === r.dataset.lang)));
}
function init() {
  readUrl(); applyPrefs();
  document.addEventListener('click', e => {
    const a = (e.target as HTMLElement).closest('a[data-nav]') as HTMLAnchorElement | null;
    if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); go(JSON.parse(a.dataset.nav!)); return; }
    const b = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null; if (!b) return;
    const act = b.dataset.act!;
    if (act === 'today') go({ d: today(), v: 'dan' });
    else if (act === 'sunday') go({ d: nextSunday(), v: 'dan' });
    else if (act === 'print') window.print();
    else if (act === 'theme') { const cur = document.documentElement.dataset.theme; const dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; store.set('theme', dark ? 'light' : 'dark'); applyPrefs(); }
    else if (act === 'bigger' || act === 'smaller') { const fs = Math.max(80, Math.min(160, +(store.get('fs') ?? '100') + (act === 'bigger' ? 10 : -10))); store.set('fs', String(fs)); applyPrefs(); }
    else if (act === 'lang') { store.set('lang', b.dataset.langBtn!); applyPrefs(); }
    else if (act === 'paper') { store.set('paper', document.documentElement.dataset.paper === 'a5' ? 'a4' : 'a5'); applyPrefs(); }
    else if (act === 'view') { e.preventDefault(); go({ v: b.dataset.view as State['v'] }); }
  });
  document.addEventListener('submit', e => { const f = e.target as HTMLFormElement; if (f.matches('[data-search]')) { e.preventDefault(); go({ v: 'trazi', q: (f.elements.namedItem('q') as HTMLInputElement).value }); } });
  const date = document.getElementById('date') as HTMLInputElement; date.min = `${BASE.years.from}-01-01`; date.max = `${BASE.years.to}-12-31`;
  date.addEventListener('change', () => { if (date.value) go({ d: date.value, v: st.v === 'mjesec' || st.v === 'godina' ? st.v : 'dan' }); });
  document.addEventListener('keydown', e => { if ((e.target as HTMLElement).matches('input,textarea,select') || e.metaKey || e.ctrlKey || e.altKey || st.v !== 'dan') return; if (e.key === 'ArrowLeft') go({ d: addDays(st.d, -1) }); if (e.key === 'ArrowRight') go({ d: addDays(st.d, 1) }); });
  window.addEventListener('popstate', () => { readUrl(); render(); }); window.addEventListener('hashchange', () => { readUrl(); render(); });
  render();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register(here + 'sw.js').catch(() => { /* offline use unavailable */ });
}
W.TLM.start = init;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init()); else setTimeout(init, 0);
/** used by the verification crawl: show a day and resolve when it is rendered */
W.TLM.nav = async (o: Partial<State>) => { Object.assign(st, o); const u = urlFor({}); try { history.replaceState(null, '', u); } catch { /* file:// */ } await render(); };
