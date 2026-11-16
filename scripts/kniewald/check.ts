// Kniewald check (Stage 4): for every block of the old-site translation memory (data/tm/blocks.json) find the
// counterpart in Kniewald, "Rimski misal za privatnu upotrebu" (1942, archive.org OCR) and compare CONTENT, not wording:
// same passage, same boundaries, nothing truncated. Writes data/tm/kniewald-alt.json and KNIEWALD-CHECK.md.
//
//   export PATH="$PWD/tools.nosync/bin:$PATH"; npx tsx scripts/kniewald/check.ts [--debug]
//
// Input (downloaded once, never refetched): data/raw/kniewald/<item>_hocr_searchtext.txt.gz (one OCR paragraph per line),
// <item>_hocr_pageindex.json.gz (character range of each scan leaf). The OCR is NOT corrected here.
import fs from 'node:fs';
import zlib from 'node:zlib';

const ITEM = 'rimski_misal_za_privatnu_upotrebu_1942-dragutin_kniewald';
const RAW = 'data/raw/kniewald/';
const DEBUG = process.argv.includes('--debug');

// ---------------------------------------------------------------- normalisation
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/đ/g, 'd');
/** words of a Croatian text, lower-case, diacritics stripped */
const words = (s: string) => fold(s).replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
/** matching key of a word: confusable letters folded (OCR: l/1/i/j, dj/d), first 4 letters; '' for words that carry no signal */
const keyOf = (w: string) => {
  if (/\d/.test(w)) return '';
  const k = w.replace(/dj/g, 'd').replace(/[lj1]/g, 'i').replace(/ii+/g, 'i');
  return k.length < 3 ? '' : k.slice(0, 4);
};
const keys = (s: string) => words(s).map(keyOf).filter(Boolean);

// ---------------------------------------------------------------- Kniewald OCR -> paragraphs -> units
type Para = { leaf: number; text: string; type: string; short: boolean };
type Unit = { id: number; type: string; leaf: number; raw: string; ext: string[]; pi: number };

function loadParas(): Para[] {
  const st = zlib.gunzipSync(fs.readFileSync(RAW + ITEM + '_hocr_searchtext.txt.gz')).toString('utf8');
  const idx: number[][] = JSON.parse(zlib.gunzipSync(fs.readFileSync(RAW + ITEM + '_hocr_pageindex.json.gz')).toString('utf8'));
  const out: Para[] = [];
  idx.forEach(([a, b], leaf) => {
    for (let line of st.slice(a, b).split('\n')) {
      line = line.replace(/\s+/g, ' ').trim();
      // join words hyphenated at line ends: "po¬ stove", "vi- kaše"
      line = line.replace(/¬ ?/g, '').replace(/(\p{Ll})- (\p{Ll})/gu, '$1$2');
      if (!line) continue;
      out.push({ leaf, text: line, type: '', short: line.length < 90 });
    }
  });
  return out;
}

const LABELS: [RegExp, string][] = [
  [/^.{0,3}molitva nad pukom/, 'SuperPopulum'],
  [/^.{0,3}(molitva|ulazna)\b/, 'Oratio'],
  [/^.{0,3}ulaz\b/, 'Introitus'],
  [/^.{0,3}[cč]itanje\b/, 'Lectio'],
  [/^.{0,3}(na stepenicama|stepenica|zavlaka|aleluja,? aleluja)/, 'Graduale'],
  [/^.{0,6}(slijedi|pocetak) sv/, 'Evangelium'],
  [/^.{0,3}muka gospodina nasega/, 'Evangelium'],
  [/^.{0,3}prikazanje\b/, 'Offertorium'],
  [/^.{0,3}tajna\b/, 'Secreta'],
  [/^.{0,3}popr[il1]c[ec]sna/, 'Postcommunio'],
  [/^.{0,3}pr[il1]c[ec]sna/, 'Communio'],
  [/^.{0,3}posljednica\b/, 'Sequentia'],
  [/^.{0,4}[ud] ?istinu.? je dostojno/, 'Prefatio'],
];
// paragraphs that end a unit without starting a text of their own
const BREAK = /^.{0,3}(spomen\b|misa kao|sve kao|sve ostalo|ostalo kao|predslovlje|postaja kod|n[ec] moli se|slava\b|vjerujem\b|evandelje (kao|iz)|evandelje,|poslanica (kao|iz)|\d{1,2}\. ?[ivx]+\. )/;

function classify(p: Para) {
  const f = fold(p.text.slice(0, 50));
  for (const [re, t] of LABELS) if (re.test(f)) { p.type = t; return; }
  if (BREAK.test(f)) p.type = '#break';
  else if (/^\d{1,4}$/.test(p.text) || (p.short && (/^\d{1,4} \S/.test(p.text) || / \d{1,4}\.?$/.test(p.text)) && !/[a-zčćšžđ]{3,}\.$/.test(p.text))) p.type = '#head';
}

function buildUnits(paras: Para[]): Unit[] {
  const units: Unit[] = [];
  let cur: Unit | null = null; let open = false;
  const endsOpen = (t: string) => !/[.!?»"”:;)*]\s*$/.test(t);
  paras.forEach((p, pi) => {
    classify(p);
    if (p.type === '#head') return;
    if (p.type && p.type !== '#break') { cur = { id: units.length, type: p.type, leaf: p.leaf, raw: p.text, ext: [], pi }; units.push(cur); open = true; return; }
    if (p.type === '#break') { cur = null; open = false; return; }
    const lower = /^\p{Ll}/u.test(p.text);
    if (cur && open && (lower || endsOpen(cur.raw)) ) {
      if (p.short && !lower) return;            // running head in the middle of a sentence
      cur.raw += ' ' + p.text; return;
    }
    if (p.short) { if (!cur || !endsOpen(cur.raw)) open = false; return; }   // heading or rubric
    // long unlabelled paragraph: a unit of its own (rites, ordinary, commentary) and a possible continuation of the previous unit
    if (cur && cur.ext.length < 5) cur.ext.push(p.text);
    units.push({ id: units.length, type: '', leaf: p.leaf, raw: p.text, ext: [], pi });
  });
  return units;
}

// printed page numbers: each scan leaf is a spread of two pages; calibrate "page = 2*leaf + d" from page-number lines
function pageRefs(paras: Para[], nLeaves: number): (leaf: number) => string {
  const byLeaf: number[][] = Array.from({ length: nLeaves }, () => []);
  for (const p of paras) { const m = p.short && (p.text.match(/^(\d{1,4})$/) || p.text.match(/^(\d{1,4}) \S/) || p.text.match(/ (\d{1,4})\.?$/)); if (m) byLeaf[p.leaf].push(+m[1]); }
  const off: (number | null)[] = byLeaf.map((ns, leaf) => { const c = ns.map(n => n - 2 * leaf).filter(d => d % 2 === 0 ? true : false); const d = c.find(d => Math.abs(d) < 40 && c.filter(x => x === d).length >= 1 && ns.includes(2 * leaf + d + 1)); return d ?? null; });
  return (leaf: number) => {
    // nearest calibrated leaf within 6 leaves
    for (let r = 0; r <= 6; r++) for (const l of [leaf - r, leaf + r]) if (l >= 0 && l < nLeaves && off[l] !== null) { const n = 2 * leaf + (off[l] as number); return `Kniewald 1942, str. ${n}–${n + 1} (snimka ${leaf})`; }
    return `Kniewald 1942, snimka ${leaf} (list bez čitljive paginacije)`;
  };
}

// ---------------------------------------------------------------- cleaning of both sides
const PRAYERS = new Set(['Oratio', 'Secreta', 'Postcommunio', 'SuperPopulum']);
const FORMULA_I = /^(po (istom )?(gospodinu|kristu)|pomolimo se|slava ocu|koji (s tobom |s istim |zivis|zivi)|prignimo|prignite|amen|per dominum)/;
const isRefLine = (l: string) => { const t = l.replace(/<[^>]+>/g, '').trim(); if (!/\d/.test(t) || t.length > 90) return false; const w = t.split(/\s+/).filter(x => /^\p{Ll}{5,}/u.test(x)).length; return w === 0; };
const refPairs = (s: string) => { const out = new Set<string>(); for (const m of s.matchAll(/(\d{1,3})\s*[,.]\s*(\d{1,3})/g)) out.add(m[1] + ':' + m[2]); return out; };

function cleanSite(hr: string, sec: string): { text: string; refs: Set<string> } {
  let refsSrc = '';
  let t = hr.split('\n').filter(l => { if (isRefLine(l)) { refsSrc += ' ' + l; return false; } return true; }).join('\n');
  t = t.replace(/\[[^\]]*\]/g, ' ');
  t = t.replace(/<i>([\s\S]*?)<\/i>/g, (_, x) => FORMULA_I.test(fold(x).trim()) ? ' ¶ ' : ' ' + x + ' ');
  t = t.replace(/\((?:[1-4I]{1,3}\.? ?)?\p{Lu}?[\p{L}]*\.? ?\d[^()]*\)/gu, m => { refsSrc += ' ' + m; return ' '; });
  if (sec === 'Introitus' || sec.startsWith('Other')) {
    // the antiphon is printed again after the verse: keep the first statement only
    const w = t.replace(/¶/g, ' ').replace(/\s+/g, ' ').trim(); const head = w.slice(0, 28);
    const again = head.length >= 20 ? w.indexOf(head, 40) : -1;
    t = again > 0 ? w.slice(0, again) : w;
  }
  return { text: t.replace(/¶/g, ' ').replace(/\s+/g, ' ').trim(), refs: refPairs(refsSrc) };
}

const LABEL_STRIP = /^.{0,6}?(Molitva nad pukom|Molitva|Ulazna|Ulaz|Na stepenicama|Stepenica|Zavlaka|Prikazanje|Tajna|Pop\S{6,8}|Pr\S{6,7}|Posljednica)\b[.:]?\s*/u;
function cleanKn(raw: string, type: string): { text: string; body: string; refs: Set<string> } {
  let body = raw;
  if (type && !['Lectio', 'Evangelium', 'Prefatio'].includes(type) && !/^.{0,3}Aleluja/i.test(raw)) body = raw.replace(LABEL_STRIP, '');
  let refsSrc = '';
  let t = body.replace(/\(([^()]{0,60})\)/g, (m, x) => { if (/\d/.test(x)) { refsSrc += ' ' + x; return ' '; } if (/^ovdje/i.test(x.trim())) return ' '; return ' ' + x + ' '; });
  if (PRAYERS.has(type)) {
    t = t.replace(/^\s*Pomolimo se[.!]?\s*(Prignite[^.!]*[.!])?/i, ' ');
    t = t.replace(/[,;]?\s*(po (istom |istome )?[GC]\.? ?[nm]\b.*|po (istom |istome )?Gospodinu na[sš]emu.*|po (istom )?Kristu,? Gospodinu.*|koji (s Tobom |s tobom )?[zž]ivi[sš]?\b.*)$/u, ' ');
  }
  if (type === 'Introitus') {
    t = t.replace(/Slava Ocu.*$/i, ' ');
    t = t.replace(/[^.!?]*(\.\s*){2,}[.,\s]*$/, ' ');         // "Smiluj mi se . . ." = repetition of the antiphon
  }
  return { text: t.replace(/\s+/g, ' ').trim(), body: body.trim(), refs: refPairs(refsSrc) };
}

// ---------------------------------------------------------------- candidates
type Cand = { unit: Unit; text: string; body: string; refs: Set<string>; ks: string[]; variant: string };
const SEC2TYPE: Record<string, string[]> = {
  Introitus: ['Introitus'], Oratio: ['Oratio'], Secreta: ['Secreta', 'Oratio'], Postcommunio: ['Postcommunio', 'Oratio'], SuperPopulum: ['SuperPopulum', 'Oratio'],
  Lectio: ['Lectio'], Evangelium: ['Evangelium'], Graduale: ['Graduale'], Offertorium: ['Offertorium'], Communio: ['Communio'], Sequentia: ['Sequentia', ''], Prefatio: ['Prefatio', ''],
};

function candidatesOf(u: Unit, units: Unit[]): Cand[] {
  const mk = (raw: string, variant: string, type = u.type): Cand => { const c = cleanKn(raw, type); return { unit: u, text: c.text, body: c.body, refs: c.refs, ks: keys(c.text), variant }; };
  const out = [mk(u.raw, 'unit')];
  let acc = u.raw; u.ext.forEach((e, i) => { acc += ' ' + e; if (u.type && !PRAYERS.has(u.type)) out.push(mk(acc, 'unit+' + (i + 1))); });
  if (u.type === 'Graduale') {
    const m = u.raw.slice(12).search(/\(?Aleluja,? aleluja/i);
    if (m > 0) { out.push(mk(u.raw.slice(0, m + 12), 'first part')); out.push(mk(u.raw.slice(m + 12), 'second part')); }
    const nx = units[u.id + 1];
    if (nx && nx.type === 'Graduale' && nx.pi - u.pi <= 3) out.push(mk(u.raw + ' ' + nx.raw.replace(LABEL_STRIP, ''), 'with following chant'));
  }
  return out;
}

// ---------------------------------------------------------------- similarity and alignment
let IDF = new Map<string, number>(); let IDF_DEFAULT = 8;
const idf = (k: string) => IDF.get(k) ?? IDF_DEFAULT;
function sim(a: string[], b: string[]) {
  const cb = new Map<string, number>(); for (const k of b) cb.set(k, (cb.get(k) ?? 0) + 1);
  let wa = 0, wb = 0, c = 0;
  for (const k of b) wb += idf(k);
  for (const k of a) { const w = idf(k); wa += w; const n = cb.get(k) ?? 0; if (n > 0) { c += w; cb.set(k, n - 1); } }
  const P = wa ? c / wa : 0, R = wb ? c / wb : 0;
  return { P, R, F: P + R ? 2 * P * R / (P + R) : 0 };
}
/** longest common subsequence of two key sequences; returns matched index pairs */
function lcs(a: string[], b: string[]): [number, number][] {
  const n = a.length, m = b.length; if (!n || !m) return [];
  const W = m + 1; const T = new Uint16Array((n + 1) * W);
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) T[i * W + j] = a[i] === b[j] ? T[(i + 1) * W + j + 1] + 1 : Math.max(T[(i + 1) * W + j], T[i * W + j + 1]);
  const out: [number, number][] = []; let i = 0, j = 0;
  while (i < n && j < m) { if (a[i] === b[j]) { out.push([i, j]); i++; j++; } else if (T[(i + 1) * W + j] >= T[i * W + j + 1]) i++; else j++; }
  return out;
}
/** unmatched material at the head and tail of both texts, measured from the first/last "solid" run of matches */
function edges(a: string[], b: string[]) {
  const p = lcs(a, b);
  const solid = (x: number) => { let c = 0; for (let y = Math.max(0, x - 3); y <= Math.min(p.length - 1, x + 3); y++) if (Math.abs(p[y][0] - p[x][0]) <= 8 && Math.abs(p[y][1] - p[x][1]) <= 8) c++; return c >= 3; };
  let f = 0; while (f < p.length && !solid(f)) f++;
  let l = p.length - 1; while (l >= 0 && !solid(l)) l--;
  if (f > l) return { ok: false, headA: a.length, headB: b.length, tailA: a.length, tailB: b.length, matched: p.length, gapA: 0, gapB: 0 };
  // largest one-sided gap in the middle (verses omitted on one side)
  let gapA = 0, gapB = 0;
  for (let x = f + 1; x <= l; x++) { const da = p[x][0] - p[x - 1][0] - 1, db = p[x][1] - p[x - 1][1] - 1; if (da - db > gapA) gapA = da - db; if (db - da > gapB) gapB = db - da; }
  return { ok: true, headA: p[f][0], headB: p[f][1], tailA: a.length - 1 - p[l][0], tailB: b.length - 1 - p[l][1], matched: p.length, gapA, gapB };
}

// ---------------------------------------------------------------- main
type Block = { hr: string; sec: string; src: string; n: number };
const blocks: Record<string, Block> = JSON.parse(fs.readFileSync('data/tm/blocks.json', 'utf8'));
const paras = loadParas();
const nLeaves = paras[paras.length - 1].leaf + 1;
const units = buildUnits(paras);
const refOf = pageRefs(paras, nLeaves);
const cands: Cand[] = units.flatMap(u => candidatesOf(u, units));
{ // idf over units
  const df = new Map<string, number>();
  for (const u of units) for (const k of new Set(keys(u.raw))) df.set(k, (df.get(k) ?? 0) + 1);
  for (const [k, n] of df) IDF.set(k, Math.log(1 + units.length / n));
  IDF_DEFAULT = Math.log(1 + units.length);
}
const inv = new Map<string, number[]>();
cands.forEach((c, ci) => { for (const k of new Set(c.ks)) { let a = inv.get(k); if (!a) inv.set(k, a = []); a.push(ci); } });

type Res = { key: string; b: Block; site: string; sk: string[]; refs: Set<string>; best?: Cand; F: number; P: number; R: number; refHit: boolean; typed: boolean; score: number; status: string; note: string; ratio: number; near?: boolean };
const secBase = (s: string) => s.startsWith('Other') ? 'Other' : s;

function search(r: Res, anchor?: number): void {
  const acc = new Map<number, number>();
  for (const k of new Set(r.sk)) { const w = idf(k); if (w < 1.2) continue; for (const ci of inv.get(k) ?? []) acc.set(ci, (acc.get(ci) ?? 0) + w); }
  const want = SEC2TYPE[r.b.sec];
  const top = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60);
  let best: { c: Cand; rank: number; s: ReturnType<typeof sim>; refHit: boolean; typed: boolean; near: boolean } | null = null;
  for (const [ci] of top) {
    const c = cands[ci]; const s = sim(r.sk, c.ks);
    const typed = !want || want.includes(c.unit.type);
    const refHit = r.refs.size > 0 && [...r.refs].some(x => c.refs.has(x));
    const near = anchor !== undefined && Math.abs(c.unit.pi - anchor) <= 70;
    const rank = s.F + (typed ? 0.08 : 0) + (refHit ? 0.12 : 0) + (near ? 0.1 : 0);
    if (!best || rank > best.rank) best = { c, rank, s, refHit, typed, near };
  }
  if (!best) return;
  r.best = best.c; r.F = best.s.F; r.P = best.s.P; r.R = best.s.R; r.refHit = best.refHit; r.typed = best.typed; r.near = best.near;
}

const results: Res[] = Object.entries(blocks).map(([key, b]) => { const c = cleanSite(b.hr, b.sec); return { key, b, site: c.text, sk: keys(c.text), refs: c.refs, F: 0, P: 0, R: 0, refHit: false, typed: false, score: 0, status: 'not-found', note: '', ratio: 0 }; });
for (const r of results) search(r);
// second pass: the Mass of a page sits in one place of the missal; use confident blocks of the same page as an anchor
const bySrc = new Map<string, Res[]>(); for (const r of results) { let a = bySrc.get(r.b.src); if (!a) bySrc.set(r.b.src, a = []); a.push(r); }
for (const rs of bySrc.values()) {
  const sure = rs.filter(r => r.best && r.F >= 0.6).map(r => r.best!.unit.pi).sort((a, b) => a - b);
  if (sure.length < 2) continue; const anchor = sure[sure.length >> 1];
  for (const r of rs) if (!r.best || r.F < 0.6) search(r, anchor);
}

// acceptance and content comparison
const first = (s: string, n = 8) => s.split(/\s+/).slice(0, n).join(' ');
const last = (s: string, n = 8) => s.split(/\s+/).slice(-n).join(' ');
for (const r of results) {
  if (!r.best) continue;
  const n = r.sk.length;
  const conf = r.F + (r.refHit ? 0.15 : 0) + (r.typed ? 0.05 : 0) + (r.near ? 0.1 : 0);
  // containment either way counts: a passage that is wholly inside the other is "found", then flagged for its length
  const contain = Math.max(r.P, r.R);
  const found = n >= 3 && (conf >= 0.5 || (contain >= 0.75 && r.F >= 0.3 && r.typed && n >= 8) || (r.refHit && r.typed && r.F >= 0.28));
  if (!found) { r.status = 'not-found'; continue; }
  r.score = Math.min(1, Math.round(conf * 100) / 100);
  const kw = r.best.text.split(/\s+/).length, sw = r.site.split(/\s+/).length; r.ratio = sw / Math.max(1, kw);
  const e = edges(r.sk, r.best.ks);
  const long = n >= 30;
  const T = Math.max(7, Math.round(0.07 * Math.min(n, r.best.ks.length)));
  const notes: string[] = []; let status = 'ok';
  if (!e.ok) { status = 'uncertain'; notes.push('poravnanje nije uspjelo'); }
  else if (long) {
    if (e.headB - e.headA >= T) { status = 'different-start'; notes.push(`Kniewald počinje ranije (oko ${e.headB} riječi prije početka na stranici)`); }
    else if (e.headA - e.headB >= T) { status = 'different-start'; notes.push(`stranica počinje ranije (oko ${e.headA} riječi prije Kniewaldova početka)`); }
    if (e.tailB - e.tailA >= T) { if (status === 'ok') status = 'different-end'; notes.push(`tekst na stranici završava ranije (Kniewald ima još oko ${e.tailB} riječi)`); }
    else if (e.tailA - e.tailB >= T) { if (status === 'ok') status = 'different-end'; notes.push(`tekst na stranici završava kasnije (još oko ${e.tailA} riječi nakon Kniewaldova kraja)`); }
    const G = Math.max(12, Math.round(0.1 * n));
    if (status === 'ok' && e.gapB >= G && r.ratio < 0.88) { status = 'shorter-on-site'; notes.push(`u sredini na stranici nedostaje oko ${e.gapB} riječi koje Kniewald ima`); }
    if (status === 'ok' && e.gapA >= G && r.ratio > 1.14) { status = 'longer-on-site'; notes.push(`u sredini stranica ima oko ${e.gapA} riječi kojih u Kniewalda nema`); }
    if (status === 'ok' && r.ratio < 0.72) { status = 'shorter-on-site'; notes.push('tekst na stranici znatno kraći'); }
    if (status === 'ok' && r.ratio > 1.4) { status = 'longer-on-site'; notes.push('tekst na stranici znatno dulji'); }
  } else {
    const d = sw - kw;
    if (r.ratio < 0.6 && d <= -7) { status = 'shorter-on-site'; notes.push('tekst na stranici znatno kraći'); }
    else if (r.ratio > 1.7 && d >= 7) { status = 'longer-on-site'; notes.push('tekst na stranici znatno dulji'); }
  }
  if (status === 'ok' && r.F < 0.36 && !(r.refHit && r.typed)) { status = 'uncertain'; notes.push('slaba leksička podudarnost; možda nije isti tekst'); }
  r.status = status; r.note = notes.join('; ');
}

// ---------------------------------------------------------------- output
const alt: Record<string, any> = {};
for (const r of results) if (r.best && r.status !== 'not-found') alt[r.key] = { kn: r.best.body, ref: refOf(r.best.unit.leaf), score: r.score, status: r.status };
fs.writeFileSync('data/tm/kniewald-alt.json', JSON.stringify(alt, null, 0).replace(/\},"/g, '},\n"'));

const secs = [...new Set(results.map(r => secBase(r.b.sec)))];
const order = ['Introitus', 'Oratio', 'Lectio', 'Graduale', 'Sequentia', 'Evangelium', 'Offertorium', 'Secreta', 'Prefatio', 'Communio', 'Postcommunio', 'SuperPopulum', 'Other'];
secs.sort((a, b) => order.indexOf(a) - order.indexOf(b));
const FLAG = new Set(['shorter-on-site', 'longer-on-site', 'different-start', 'different-end']);
const cnt = (rs: Res[]) => ({ all: rs.length, found: rs.filter(r => r.status !== 'not-found').length, ok: rs.filter(r => r.status === 'ok').length, flagged: rs.filter(r => FLAG.has(r.status)).length, unc: rs.filter(r => r.status === 'uncertain').length, nf: rs.filter(r => r.status === 'not-found').length });
const page = (src: string) => { const m = src.match(/^(propers|actions)_(\d{4})(\d\d)(\d\d)_(\d)$/); return m ? `${m[4]}.${m[3]}.${m[2]}. (${m[1]} ${m[5]})` : src; };
const md: string[] = [];
md.push('# Kniewald check', '');
md.push('Generated by `npx tsx scripts/kniewald/check.ts`. Do not edit by hand.', '');
md.push('## Method', '');
md.push('- Old-site side: every block of `data/tm/blocks.json` (the Croatian cell as printed on tradicionalnamisa.com). Reference lines, inline references, bracketed notes, "Pomolimo se", the prayer conclusions, "Slava Ocu" and the repeated introit antiphon are removed before comparing.');
md.push('- Kniewald side: *Rimski misal za privatnu upotrebu*, 4th ed. 1942, archive.org OCR (`' + ITEM + '`), one OCR paragraph per line. Line-end hyphenation is joined, running heads and page numbers are dropped, and paragraphs are grouped into labelled units (Ulaz, Molitva, Čitanje, Na stepenicama / Zavlaka / Aleluja, Evanđelje, Prikazanje, Tajna, Pričesna, Popričesna, Molitva nad pukom, Predslovlje). Kniewald\'s abbreviations ("po G. n.", "Smiluj mi se . . .") are removed in the same way.');
md.push('- Matching: words are lower-cased, stripped of diacritics, folded for the usual OCR confusions (l/1/i/j) and cut to four letters; candidates come from an inverted index, ranked by IDF-weighted overlap (F-measure), with bonuses for the same kind of section, a shared chapter:verse reference and nearness to the other texts of the same old-site page.');
md.push('- Content comparison, not wording: for texts of 30+ words (readings, Gospels, long chants) a longest-common-subsequence alignment gives the unmatched material at the head and tail of each side (pericope boundaries) and the largest one-sided gap in the middle; for short texts only the length ratio is checked. The old site\'s Croatian is a later revision, so rewording is expected and is not flagged.');
md.push('- **The Kniewald text in `data/tm/kniewald-alt.json` is raw OCR, uncorrected** (č ć đ š ž and single letters are often wrong). It must be corrected against the page scans before it is displayed. Page references give the two printed pages of the scan spread and the scan number ("snimka").', '');
md.push('## Totals by section', '');
md.push('| Section | Blocks checked | Counterpart found | Content agrees | Flagged | Uncertain | Not found |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
for (const s of secs) { const c = cnt(results.filter(r => secBase(r.b.sec) === s)); md.push(`| ${s === 'Other' ? 'Other (rites, ordinary)' : s} | ${c.all} | ${c.found} | ${c.ok} | ${c.flagged} | ${c.unc} | ${c.nf} |`); }
{ const c = cnt(results); md.push(`| **Total** | **${c.all}** | **${c.found}** | **${c.ok}** | **${c.flagged}** | **${c.unc}** | **${c.nf}** |`, ''); }
md.push('"Flagged" = the counterpart was found but the content differs in extent (start, end, or length). "Uncertain" = a candidate was found but the match is too weak to say it is the same text.', '');
md.push('## Flagged blocks', '');
const flagged = results.filter(r => FLAG.has(r.status)).sort((a, b) => order.indexOf(secBase(a.b.sec)) - order.indexOf(secBase(b.b.sec)) || a.b.src.localeCompare(b.b.src));
for (const r of flagged) {
  md.push(`- **${page(r.b.src)} · ${r.b.sec} · ${r.status}** — ${r.note}. Riječi: stranica ${r.site.split(/\s+/).length}, Kniewald ${r.best!.text.split(/\s+/).length}; ${refOf(r.best!.unit.leaf)}.`);
  md.push(`  - stranica: «${first(r.site)} … ${last(r.site)}»`);
  md.push(`  - Kniewald (OCR): «${first(r.best!.text)} … ${last(r.best!.text)}»`);
}
md.push('', '## Uncertain matches', '');
for (const r of results.filter(r => r.status === 'uncertain')) md.push(`- ${page(r.b.src)} · ${r.b.sec} — «${first(r.site, 10)}» ↔ «${first(r.best!.text, 10)}» (${refOf(r.best!.unit.leaf)})`);
md.push('', '## Not found', '');
md.push('NOTFOUND_PLACEHOLDER');
md.push('', '### List', '');
for (const r of results.filter(r => r.status === 'not-found').sort((a, b) => order.indexOf(secBase(a.b.sec)) - order.indexOf(secBase(b.b.sec)) || a.b.src.localeCompare(b.b.src))) md.push(`- ${page(r.b.src)} · ${r.b.sec} — «${first(r.site, 10)}»`);
let notFoundText = '(categories: see scripts/kniewald/not-found-categories.md)';
try { notFoundText = fs.readFileSync('scripts/kniewald/not-found-categories.md', 'utf8').trim(); } catch { /* optional hand-written explanation */ }
fs.writeFileSync('KNIEWALD-CHECK.md', md.join('\n').replace('NOTFOUND_PLACEHOLDER', notFoundText) + '\n');

fs.mkdirSync('.cache', { recursive: true });
if (DEBUG) fs.writeFileSync('.cache/kniewald-debug.json', JSON.stringify(results.map(r => ({ src: r.b.src, sec: r.b.sec, status: r.status, F: +r.F.toFixed(2), P: +r.P.toFixed(2), R: +r.R.toFixed(2), refHit: r.refHit, typed: r.typed, near: r.near, ratio: +r.ratio.toFixed(2), note: r.note, site: r.site, kn: r.best?.text, variant: r.best?.variant, ktype: r.best?.unit.type, leaf: r.best?.unit.leaf })), null, 1));
console.log({ paragraphs: paras.length, units: units.length, typedUnits: units.filter(u => u.type).length, candidates: cands.length, ...cnt(results), altEntries: Object.keys(alt).length });
