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
/** parts[0] is the labelled paragraph; further parts were joined as continuations (sure[i] = the join is certain) */
type Unit = { id: number; type: string; leaf: number; parts: string[]; sure: boolean[]; ext: string[]; pi: number };
const rawOf = (u: Unit) => u.parts.join(' ');

// labels printed in the middle of an OCR paragraph (two paragraphs merged by the OCR)
const EMBEDDED = /(?<=[.!?:»"”] )(?=(?:Čitanje (?:poslanice|knjige|proroka|Djela|\p{Lu}\p{Ll}+ [Pp]roroka)|(?:Pjesma n|N)a stepenicama|Zavlaka \(|Prikazanje \(|Pričesna \(|Tajna\. |Popričesna\. |Molitva\. |Molitva nad pukom|Ulaz \(|. Slijedi sv))/u;

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
      for (const t of line.split(EMBEDDED)) if (t.trim()) out.push({ leaf, text: t.trim(), type: '', short: t.length < 90 });
    }
  });
  return out;
}

const LABELS: [RegExp, string][] = [
  [/^.{0,3}molitva nad p/, 'SuperPopulum'],
  [/^.{0,3}(molitva|ulazna)\b/, 'Oratio'],
  [/^.{0,3}ulaz\b/, 'Introitus'],
  [/^.{0,3}[cč]itanje\b/, 'Lectio'],
  [/^.{0,3}(pjesma na stepenicama|na stepenicama|stepenica|zavlaka|a[l1i]e[l1i]u[ij]a\W{1,3}a[l1i]e[l1i]u[ij]a)/, 'Graduale'],
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
const BREAK = /^.{0,3}(spomen\b|misa kao|sve kao|sve ostalo|ostalo kao|predslovlje|postaja kod|n[ec] moli se|slava\b|vjerujem\b|vjem|evandelje (kao|iz)|evandelje,|poslanica (kao|iz)|sada se|pomolimo se|\d{1,2}\. ?[ivx]+\. )/;
const isPageNo = (t: string) => /^\d{1,4}$/.test(t);

function classifyAll(paras: Para[]) {
  // running heads: short lines that carry a page number, stand next to a page-number line, or are repeated on the spread
  const seen = new Map<string, number>();
  const hk = (p: Para) => p.leaf + '|' + keys(p.text).join(' ');
  for (const p of paras) if (p.short && p.text.length < 70) seen.set(hk(p), (seen.get(hk(p)) ?? 0) + 1);
  paras.forEach((p, i) => {
    const f = fold(p.text.slice(0, 50));
    for (const [re, t] of LABELS) if (re.test(f)) { p.type = t; return; }
    if (isPageNo(p.text)) { p.type = '#head'; return; }
    if (p.short && p.text.length < 70) {
      const numbered = /^\d{1,4} \S/.test(p.text) && !/^\d{1,2}\. ?[IVX]+\./.test(p.text) || (/ \d{2,4}\.?$/.test(p.text) && !/str\. ?\d+\.?$/.test(p.text));
      const nextToNo = (i > 0 && paras[i - 1].leaf === p.leaf && isPageNo(paras[i - 1].text)) || (i > 0 && paras[i - 1].leaf !== p.leaf);
      const repeated = (seen.get(hk(p)) ?? 0) >= 2 && keys(p.text).length >= 2;
      if ((numbered || nextToNo || repeated) && !/^\p{Ll}/u.test(p.text)) { p.type = '#head'; return; }
    }
    if (BREAK.test(f)) p.type = '#break';
  });
}

function buildUnits(paras: Para[]): Unit[] {
  const units: Unit[] = [];
  let cur: Unit | null = null;      // last labelled unit that may still take continuations / extensions
  let tail: Unit | null = null;     // unit that the running text currently belongs to
  const endsOpen = (t: string) => !/[.!?»"”:;)*]\s*$/.test(t);
  classifyAll(paras);
  paras.forEach((p, pi) => {
    if (p.type === '#head') return;
    if (p.type && p.type !== '#break') { cur = tail = { id: units.length, type: p.type, leaf: p.leaf, parts: [p.text], sure: [true], ext: [], pi }; units.push(cur); return; }
    if (p.type === '#break') { cur = tail = null; return; }
    const lower = /^\p{Ll}/u.test(p.text);
    if (tail) {
      const prev = tail.parts[tail.parts.length - 1];
      const open = endsOpen(prev);
      if (lower || open) {
        if (p.short && !lower && !open) return;
        if (p.short && !lower && /^[^\p{L}]*\p{Lu}/u.test(p.text) && keys(p.text).length <= 8 && open && /^[\^*'‘’"]|po našem|str\./.test(p.text)) return;   // footnote
        tail.parts.push(p.text); tail.sure.push(lower && open);
        if (cur && tail !== cur && cur.ext.length) cur.ext[cur.ext.length - 1] += ' ' + p.text;
        return;
      }
    }
    // a paragraph that does not obviously continue the running text: possible continuation after a page break (kept as an
    // extension candidate of the labelled unit) and, when long, a unit of its own (rites, ordinary, commentary)
    if (cur && cur.ext.length < (/^.{0,3}Muka/.test(cur.parts[0]) ? 80 : 6)) cur.ext.push(p.text);
    if (!p.short) { tail = { id: units.length, type: '', leaf: p.leaf, parts: [p.text], sure: [true], ext: [], pi }; units.push(tail); }
  });
  return units;
}

// printed page numbers: each scan leaf is a spread of two pages; calibrate "page = 2*leaf + d" from page-number lines
function pageRefs(paras: Para[], nLeaves: number): (leaf: number) => string {
  const byLeaf: number[][] = Array.from({ length: nLeaves }, () => []);
  for (const p of paras) { const m = p.short && (p.text.match(/^(\d{1,4})$/) || p.text.match(/^(\d{1,4}) \S/) || p.text.match(/ (\d{1,4})\.?$/)); if (m) byLeaf[p.leaf].push(+m[1]); }
  const off: (number | null)[] = byLeaf.map((ns, leaf) => { const d = ns.map(n => n - 2 * leaf).find(d => d % 2 === 0 && Math.abs(d) < 40 && ns.includes(2 * leaf + d + 1)); return d ?? null; });
  return (leaf: number) => {
    for (let r = 0; r <= 6; r++) for (const l of [leaf - r, leaf + r]) if (l >= 0 && l < nLeaves && off[l] !== null) { const n = 2 * leaf + (off[l] as number); return `Kniewald 1942, str. ${n}–${n + 1} (snimka ${leaf})`; }
    return `Kniewald 1942, snimka ${leaf} (list bez čitljive paginacije)`;
  };
}

// ---------------------------------------------------------------- cleaning of both sides
const PRAYERS = new Set(['Oratio', 'Secreta', 'Postcommunio', 'SuperPopulum']);
const CHANTS = new Set(['Introitus', 'Graduale', 'Offertorium', 'Communio']);
const READINGS = new Set(['Lectio', 'Evangelium']);
const FORMULA_I = /^(po (istom )?(gospodinu|kristu)|pomolimo se|slava ocu|koji (s tobom |s istim |zivis|zivi)|prignimo|prignite|amen|per dominum)/;
const isRefLine = (l: string) => { const t = l.replace(/<[^>]+>/g, '').trim(); if (!/\d/.test(t) || t.length > 90) return false; const w = t.split(/\s+/).filter(x => /^\p{Ll}{5,}/u.test(x)).length; return w === 0; };
const refPairs = (s: string) => { const out = new Set<string>(); for (const m of s.matchAll(/(\d{1,3})\s*[,.]\s*(\d{1,3})/g)) out.add(m[1] + ':' + m[2]); return out; };
const endsOpen = (t: string) => !/[.!?»"”:;)*]\s*$/.test(t.trim());
/** the numbers of a citation, book ordinal dropped: "1 Kor 13, 1-13" and "(1. Kor. 13, 1-13)" -> "13.1.13" */
const citeNums = (s: string) => (s.replace(/<[^>]+>/g, '').replace(/^[\s(]*[1-4]\.? ?(?=\p{L})/u, '').match(/\d+/g) ?? []).join('.');
const siteCite = (hr: string) => { const l = hr.split('\n')[0]; return isRefLine(l) ? citeNums(l) : ''; };
const knCite = (raw: string) => { const m = raw.slice(0, 200).match(/\(([^()]*\d[^()]*)\)/); return m ? citeNums(m[1]) : ''; };

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
  return { text: t.replace(/¶/g, ' ').replace(/\s+([.,;:!?])/g, '$1').replace(/^[\s.]+|(?<=[.!?])[\s.]+$/g, '').replace(/\s+/g, ' ').trim(), refs: refPairs(refsSrc) };
}

const LABEL_STRIP = /^.{0,6}?(Molitva nad p\p{L}+|Molitva|Ulazna|Ulaz|Pjesma na stepenicama|Na stepenicama|Stepenica|Zavlaka|Prikazanje|Tajna|Pop\S{6,8}|Pr\S{6,7}|Posljednica)\b[.:]?\s*/u;
const ALLELUIA2 = /\(?A[l1i]e\W{0,3}[lI1i][un]\W?[ij]a\W{1,6}a[l1i]e\W{0,3}[l1i][un]\W?[ij]a/;
function cleanKn(raw: string, type: string): { text: string; body: string; refs: Set<string> } {
  let body = raw;
  if (type && !['Lectio', 'Evangelium', 'Prefatio'].includes(type) && !/^.{0,3}Aleluja/i.test(raw)) body = raw.replace(LABEL_STRIP, '');
  let refsSrc = '';
  let t = body.replace(/\(([^()]{0,60})\)/g, (m, x) => { if (/\d/.test(x)) { refsSrc += ' ' + x; return ' '; } if (/^ovdje/i.test(x.trim())) return ' '; return ' ' + x + ' '; });
  if (PRAYERS.has(type)) {
    t = t.replace(/^.{0,60}?pred Bogom[.!]?\s*/i, ' ').replace(/^\s*Pomolimo se[.!]?\s*/i, ' ');
    t = t.replace(/[,;.]?\s*(po (istom |istome )?[GC]\.? ?[nm]\b.*|po (istom |istome )?Gospodinu na[sš]emu.*|po (istom )?Kristu,? Gospodinu.*|koji (s Tobom |s Bogom )?[zž]ivi[sš]?\b.*|koji s Tobom i s Duhom.*)$/iu, ' ');
  }
  if (type === 'Introitus') {
    t = t.replace(/Slava Ocu.*$/i, ' ');
    t = t.replace(/[^.!?]*(\.\s*){2,}[.,\s]*$/, ' ');         // "Smiluj mi se . . ." = repetition of the antiphon
  }
  return { text: t.replace(/\s+([.,;:!?])/g, '$1').replace(/^[\s.,]+/, '').replace(/\s+/g, ' ').trim(), body: body.trim(), refs: refPairs(refsSrc) };
}

// ---------------------------------------------------------------- candidates
type Cand = { unit: Unit; text: string; body: string; refs: Set<string>; ks: string[]; variant: string; cite: string; open: boolean };
const SEC2TYPE: Record<string, string[]> = {
  Introitus: ['Introitus'], Oratio: ['Oratio', 'SuperPopulum'], Secreta: ['Secreta', 'Oratio'], Postcommunio: ['Postcommunio', 'Oratio'], SuperPopulum: ['SuperPopulum', 'Oratio'],
  Lectio: ['Lectio'], Evangelium: ['Evangelium'], Graduale: ['Graduale'], Offertorium: ['Offertorium'], Communio: ['Communio'], Sequentia: ['Sequentia'], Prefatio: ['Prefatio'],
};

function candidatesOf(u: Unit, units: Unit[]): Cand[] {
  const cite = knCite(u.parts[0]);
  const mk = (raw: string, variant: string): Cand => { const c = cleanKn(raw, u.type); return { unit: u, text: c.text, body: c.body, refs: c.refs, ks: keys(c.text), variant, cite, open: endsOpen(raw) }; };
  const full = rawOf(u);
  const out = [mk(full, 'unit')];
  // shorter: cut before a continuation that was joined without certainty
  for (let k = 1; k < u.parts.length; k++) if (!u.sure[k]) out.push(mk(u.parts.slice(0, k).join(' '), 'unit, first ' + k + ' paragraph(s)'));
  // longer: paragraphs that follow and may continue the text after a page break
  let acc = full; const maxExt = PRAYERS.has(u.type) ? 2 : u.ext.length;
  u.ext.slice(0, maxExt).forEach((e, i) => { acc += ' ' + e; out.push(mk(acc, 'unit+' + (i + 1))); });
  if (u.type === 'Graduale') {
    // gradual, alleluia and tract: every contiguous run of the verses of this unit and the chant units that follow it
    const pieces: string[] = []; let own = 0;
    const group = [u]; for (let j = u.id + 1; j < units.length && group.length < 3; j++) { const nx = units[j]; if (nx.type !== 'Graduale' || nx.pi - group[group.length - 1].pi > 4) break; group.push(nx); }
    group.forEach((g, gi) => {
      let t = rawOf(g).replace(LABEL_STRIP, '');
      const marks: number[] = [0];
      for (const m of t.matchAll(/\([^()]{0,40}\d[^()]{0,40}\)/g)) marks.push(m.index!);
      const am = t.slice(8).match(ALLELUIA2); if (am) marks.push(am.index! + 8);
      marks.sort((a, b) => a - b); marks.push(t.length);
      for (let i = 0; i + 1 < marks.length; i++) { const piece = t.slice(marks[i], marks[i + 1]).trim(); if (keys(piece.replace(/\([^()]*\d[^()]*\)/g, ' ')).length >= 2) { pieces.push(piece); if (gi === 0) own = pieces.length; } }
    });
    for (let i = 0; i < own && pieces.length <= 12; i++) for (let j = i; j < pieces.length; j++) {
      if (i === 0 && j === own - 1 && group.length >= 1 && own === pieces.length) continue;
      const c = cleanKn(pieces.slice(i, j + 1).join(' '), ''); const body = pieces.slice(i, j + 1).join(' ');
      out.push({ unit: u, text: c.text, body, refs: c.refs, ks: keys(c.text), variant: `verses ${i + 1}-${j + 1} of ${pieces.length}`, cite, open: endsOpen(body) });
    }
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
  for (const u of units) for (const k of new Set(keys(rawOf(u)))) df.set(k, (df.get(k) ?? 0) + 1);
  for (const [k, n] of df) IDF.set(k, Math.log(1 + units.length / n));
  IDF_DEFAULT = Math.log(1 + units.length);
}
const inv = new Map<string, number[]>();
cands.forEach((c, ci) => { for (const k of new Set(c.ks)) { let a = inv.get(k); if (!a) inv.set(k, a = []); a.push(ci); } });
// readings that Kniewald prints only as a cross-reference: "(8, 5-13). (Kao na 3. nedjelju po Bogojavljenju, str. 81...)"
const xrefs = units.filter(u => READINGS.has(u.type) && rawOf(u).length < 320 && /\bkao\b|str\. ?\d/i.test(rawOf(u)) && knCite(u.parts[0]));

type Res = { key: string; b: Block; site: string; sk: string[]; refs: Set<string>; cite: string; best?: Cand; F: number; P: number; R: number; refHit: boolean; typed: boolean; citeEq: boolean; score: number; status: string; note: string; ratio: number; near?: boolean; kn?: string; knText?: string; xref?: Unit };
const secBase = (s: string) => s.startsWith('Other') ? 'Other' : s;

function search(r: Res, anchor?: number): void {
  const acc = new Map<number, number>();
  const want = SEC2TYPE[r.b.sec];
  for (const k of new Set(r.sk)) { const w = idf(k); if (w < 1.2) continue; for (const ci of inv.get(k) ?? []) { const t = cands[ci].unit.type; if (want && t !== '' && !want.includes(t)) continue; acc.set(ci, (acc.get(ci) ?? 0) + w); } }
  const top = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 80);
  let best: { c: Cand; rank: number; s: ReturnType<typeof sim>; refHit: boolean; typed: boolean; near: boolean; citeEq: boolean } | null = null;
  for (const [ci] of top) {
    const c = cands[ci]; const s = sim(r.sk, c.ks);
    const typed = !want || want.includes(c.unit.type);
    const refHit = r.refs.size > 0 && [...r.refs].some(x => c.refs.has(x));
    const citeEq = READINGS.has(r.b.sec) && !!r.cite && r.cite === c.cite;
    const near = anchor !== undefined && Math.abs(c.unit.pi - anchor) <= 70;
    const rank = s.F + (typed ? 0.08 : 0) + (refHit ? 0.12 : 0) + (near ? 0.1 : 0) + (citeEq ? 0.1 : 0);
    if (!best || rank > best.rank) best = { c, rank, s, refHit, typed, near, citeEq };
  }
  if (!best) return;
  r.best = best.c; r.F = best.s.F; r.P = best.s.P; r.R = best.s.R; r.refHit = best.refHit; r.typed = best.typed; r.near = best.near; r.citeEq = best.citeEq;
}

const results: Res[] = Object.entries(blocks).map(([key, b]) => { const c = cleanSite(b.hr, b.sec); return { key, b, site: c.text, sk: keys(c.text), refs: c.refs, cite: siteCite(b.hr), F: 0, P: 0, R: 0, refHit: false, typed: false, citeEq: false, score: 0, status: 'not-found', note: '', ratio: 0 }; });
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
const FLAG = new Set(['shorter-on-site', 'longer-on-site', 'different-start', 'different-end']);
for (const r of results) {
  if (!r.best) continue;
  const n = r.sk.length; const sec = r.b.sec; const c = r.best;
  const conf = r.F + (r.refHit ? 0.15 : 0) + (r.typed ? 0.05 : 0) + (r.near ? 0.1 : 0) + (r.citeEq ? 0.1 : 0);
  const contain = Math.max(r.P, r.R);
  let found = n >= 3 && (conf >= 0.5 || (contain >= 0.75 && r.F >= 0.3 && r.typed && n >= 8) || (r.refHit && r.typed && r.F >= 0.28));
  if (found && SEC2TYPE[sec] && c.unit.type === '' && r.F < 0.55) found = false;   // unlabelled paragraph: only a strong match counts
  if (found && secBase(sec) === 'Other' && r.F < 0.45) found = false;
  if (!found) { r.status = 'not-found'; continue; }
  r.score = Math.min(1, Math.round(conf * 100) / 100);
  r.kn = c.body; r.knText = c.text;
  const kw = c.text.split(/\s+/).length, sw = r.site.split(/\s+/).length; r.ratio = sw / Math.max(1, kw);
  const notes: string[] = []; let status = 'ok';
  let siteMore = false, knMore = false;
  if (sec === 'Prefatio') { if (r.F < 0.5) { status = 'uncertain'; notes.push('predslovlje: slaba podudarnost'); } }
  else if (n >= 30 && !CHANTS.has(sec) && !PRAYERS.has(sec)) {
    const e = edges(r.sk, c.ks);
    const T = Math.max(7, Math.round(0.07 * Math.min(n, c.ks.length)));
    if (!e.ok) { status = 'uncertain'; notes.push('poravnanje nije uspjelo'); }
    else {
      if (e.headB - e.headA >= T) { status = 'different-start'; knMore = true; notes.push(`Kniewald počinje ranije (oko ${e.headB} riječi prije početka na stranici)`); }
      else if (e.headA - e.headB >= T) { status = 'different-start'; siteMore = true; notes.push(`stranica počinje ranije (oko ${e.headA} riječi prije Kniewaldova početka)`); }
      if (e.tailB - e.tailA >= T) { if (status === 'ok') status = 'different-end'; knMore = true; notes.push(`tekst na stranici završava ranije (Kniewald ima još oko ${e.tailB} riječi)`); }
      else if (e.tailA - e.tailB >= T) { if (status === 'ok') status = 'different-end'; siteMore = true; notes.push(`tekst na stranici završava kasnije (još oko ${e.tailA} riječi nakon Kniewaldova kraja)`); }
      const G = Math.max(14, Math.round(0.1 * n));
      if (status === 'ok' && e.gapB >= G && r.ratio < 0.85) { status = 'shorter-on-site'; knMore = true; notes.push(`u sredini na stranici nedostaje oko ${e.gapB} riječi koje Kniewald ima`); }
      if (status === 'ok' && e.gapA >= G && r.ratio > 1.18) { status = 'longer-on-site'; siteMore = true; notes.push(`u sredini stranica ima oko ${e.gapA} riječi kojih u Kniewalda nema`); }
      if (status === 'ok' && r.ratio < 0.7) { status = 'shorter-on-site'; knMore = true; notes.push('tekst na stranici znatno kraći'); }
      if (status === 'ok' && r.ratio > 1.45) { status = 'longer-on-site'; siteMore = true; notes.push('tekst na stranici znatno dulji'); }
    }
  } else {
    const d = sw - kw;
    if (r.ratio < 0.6 && d <= -7) { if (r.P >= 0.6) { status = 'shorter-on-site'; knMore = true; notes.push('tekst na stranici znatno kraći'); } else { status = 'uncertain'; notes.push('različita duljina i slaba podudarnost'); } }
    else if (r.ratio > 1.7 && d >= 7) { if (r.R >= 0.6) { status = 'longer-on-site'; siteMore = true; notes.push('tekst na stranici znatno dulji'); } else { status = 'uncertain'; notes.push('različita duljina i slaba podudarnost'); } }
  }
  // the OCR passage is the incomplete side: not evidence about the old site
  if (FLAG.has(status) && siteMore && !knMore) {
    if (r.citeEq) { status = 'cite'; notes.push('navod (poglavlje i reci) jednak; Kniewaldov odlomak u OCR-u nepotpun'); }
    else if (c.open || /[\^~™“‘]{2}|\w[\^_]\w/.test(c.body.slice(-200))) { status = 'uncertain'; notes.push('Kniewaldov odlomak u OCR-u prekinut ili oštećen'); }
  }
  if (status === 'ok' && r.F < 0.36 && !(r.refHit && r.typed)) { status = 'uncertain'; notes.push('slaba leksička podudarnost; možda nije isti tekst'); }
  r.status = status; r.note = notes.join('; ');
}
// Kniewald gives the pericope by cross-reference to a longer one printed elsewhere
for (const r of results) {
  if (!READINGS.has(r.b.sec) || !r.cite || r.citeEq || r.status === 'ok') continue;
  const x = xrefs.find(u => u.type === r.b.sec && knCite(u.parts[0]) === r.cite);
  if (x) { r.xref = x; r.note = `Kniewald ovo čitanje donosi samo uputom na drugo mjesto: «${rawOf(x).slice(0, 140)}»` + (r.note ? ' — usporedba s tim duljim odlomkom: ' + r.note : ''); r.status = 'xref'; if (!r.kn && r.best) { r.kn = r.best.body; r.knText = r.best.text; } }
}
// a section printed in several rows (gradual + alleluia, the lessons of an Ember Saturday): judged by its rows
const byHr = new Map<string, Res>(); for (const r of results) byHr.set(r.b.hr, r);
for (const r of results) {
  if (PRAYERS.has(r.b.sec) || !r.b.hr.includes('\n\n')) continue;
  const rows = r.b.hr.split('\n\n').map(h => byHr.get(h));
  if (rows.length < 2 || rows.some(x => !x || x === r)) continue;
  if (rows.every(x => x!.status === 'ok')) { r.status = 'ok'; r.note = ''; r.kn = rows.map(x => x!.kn).join('\n\n'); r.knText = rows.map(x => x!.knText).join(' '); r.score = Math.min(...rows.map(x => x!.score)); r.best = rows[0]!.best; }
  else if (r.status !== 'ok') { const worst = rows.find(x => x!.status !== 'ok')!; if (r.status === 'not-found' && worst.status !== 'not-found') { r.best = rows.find(x => x!.best)?.best; r.kn = rows.map(x => x!.kn ?? '[…]').join('\n\n'); r.knText = rows.map(x => x!.knText ?? '').join(' '); } r.status = worst.status === 'not-found' ? 'not-found' : 'rows'; r.note = 'vidi pojedine retke ovog odsjeka'; }
}

// ---------------------------------------------------------------- output
const ALT_STATUS: Record<string, string> = { cite: 'uncertain', xref: 'uncertain', rows: 'uncertain' };
const alt: Record<string, any> = {};
for (const r of results) if (r.kn && r.best && r.status !== 'not-found') alt[r.key] = { kn: r.kn, ref: refOf(r.best.unit.leaf), score: r.score, status: ALT_STATUS[r.status] ?? r.status };
fs.writeFileSync('data/tm/kniewald-alt.json', JSON.stringify(alt, null, 0).replace(/\},"/g, '},\n"'));

const secs = [...new Set(results.map(r => secBase(r.b.sec)))];
const order = ['Introitus', 'Oratio', 'Lectio', 'Graduale', 'Sequentia', 'Evangelium', 'Offertorium', 'Secreta', 'Prefatio', 'Communio', 'Postcommunio', 'SuperPopulum', 'Other'];
secs.sort((a, b) => order.indexOf(a) - order.indexOf(b));
const bySecSrc = (a: Res, b: Res) => order.indexOf(secBase(a.b.sec)) - order.indexOf(secBase(b.b.sec)) || a.b.src.localeCompare(b.b.src);
const cnt = (rs: Res[]) => ({ all: rs.length, found: rs.filter(r => r.status !== 'not-found').length, ok: rs.filter(r => r.status === 'ok').length, cite: rs.filter(r => r.status === 'cite' || r.status === 'xref').length, flagged: rs.filter(r => FLAG.has(r.status)).length, unc: rs.filter(r => r.status === 'uncertain' || r.status === 'rows').length, nf: rs.filter(r => r.status === 'not-found').length });
const page = (src: string) => { const m = src.match(/^(propers|actions)_(\d{4})(\d\d)(\d\d)_(\d)$/); return m ? `${m[4]}.${m[3]}.${m[2]}. (${m[1]} ${m[5]})` : src; };
const md: string[] = [];
md.push('# Kniewald check', '');
md.push('Generated by `npx tsx scripts/kniewald/check.ts`. Do not edit by hand (the "Not found" explanation comes from `scripts/kniewald/not-found-categories.md`).', '');
md.push('## Method', '');
md.push('- Old-site side: every block of `data/tm/blocks.json` (the Croatian cell as printed on tradicionalnamisa.com). Reference lines, inline references, bracketed notes, "Pomolimo se", the prayer conclusions, "Slava Ocu" and the repeated introit antiphon are removed before comparing.');
md.push('- Kniewald side: *Rimski misal za privatnu upotrebu*, 4th ed. 1942, archive.org OCR (`' + ITEM + '`), one OCR paragraph per line. Line-end hyphenation is joined, running heads and page numbers are dropped, and paragraphs are grouped into labelled units (Ulaz, Molitva, Čitanje, Na stepenicama / Zavlaka / Aleluja, Evanđelje, Prikazanje, Tajna, Pričesna, Popričesna, Molitva nad pukom, Predslovlje), with continuation across page breaks. Kniewald\'s abbreviations ("po G. n.", "Smiluj mi se . . .") are removed in the same way.');
md.push('- Matching: words are lower-cased, stripped of diacritics, folded for the usual OCR confusions (l/1/i/j) and cut to four letters; candidates of the same kind of section come from an inverted index and are ranked by IDF-weighted overlap (F-measure), with bonuses for a shared chapter:verse reference, an identical citation, and nearness to the other texts of the same old-site page.');
md.push('- Content comparison, not wording. Readings and Gospels: a longest-common-subsequence alignment gives the unmatched material at the head and tail of each side (pericope boundaries) and the largest one-sided gap in the middle; the printed citations (chapter and verses) are compared as well. Prayers and chants: only the extent (length ratio with high containment) is checked, since the old site\'s Croatian is a later revision and rewording is expected. A section printed in several rows (gradual + alleluia or tract, several lessons) is judged row by row.');
md.push('- A difference where the *OCR passage* is the shorter side is not held against the old site when the citations are identical or the OCR paragraph visibly breaks off; those are counted under "citation only" or "uncertain".');
md.push('- **The Kniewald text in `data/tm/kniewald-alt.json` is raw OCR, uncorrected** (č ć đ š ž and single letters are often wrong, some passages are cut at page breaks). It must be corrected against the page scans before it is displayed. Its `status` uses `uncertain` also for the "citation only" and "by rows" cases. Page references give the two printed pages of the scan spread and the scan number ("snimka").', '');
md.push('## Totals by section', '');
md.push('| Section | Blocks checked | Counterpart found | Content agrees | Agrees by citation or cross-reference only | Flagged | Uncertain | Not found |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
for (const s of secs) { const c = cnt(results.filter(r => secBase(r.b.sec) === s)); md.push(`| ${s === 'Other' ? 'Other (rites, ordinary)' : s} | ${c.all} | ${c.found} | ${c.ok} | ${c.cite} | ${c.flagged} | ${c.unc} | ${c.nf} |`); }
{ const c = cnt(results); md.push(`| **Total** | **${c.all}** | **${c.found}** | **${c.ok}** | **${c.cite}** | **${c.flagged}** | **${c.unc}** | **${c.nf}** |`, ''); }
md.push('"Flagged" = the counterpart was found and the content differs in extent (start, end or length); these are the ones to review. "Uncertain" = a candidate was found but the OCR passage is damaged, cut, or too weak a match to judge.', '');
md.push('## Flagged blocks', '');
const cites = (r: Res) => READINGS.has(r.b.sec) && r.cite && r.best!.cite ? ` Navod: stranica ${r.cite.replace(/\./g, ' ')}, Kniewald ${r.best!.cite.replace(/\./g, ' ')}.` : '';
for (const r of results.filter(r => FLAG.has(r.status)).sort(bySecSrc)) {
  md.push(`- **${page(r.b.src)} · ${r.b.sec} · ${r.status}** — ${r.note}. Riječi: stranica ${r.site.split(/\s+/).length}, Kniewald ${r.knText!.split(/\s+/).length}.${cites(r)} ${refOf(r.best!.unit.leaf)}.`);
  md.push(`  - stranica: «${first(r.site)} … ${last(r.site)}»`);
  md.push(`  - Kniewald (OCR): «${first(r.knText!)} … ${last(r.knText!)}»`);
}
md.push('', '## Agreeing by citation or cross-reference only', '');
for (const r of results.filter(r => r.status === 'cite' || r.status === 'xref').sort(bySecSrc)) md.push(`- ${page(r.b.src)} · ${r.b.sec} (${r.cite.replace(/\./g, ' ')}) — ${r.note}. ${refOf((r.xref ?? r.best!.unit).leaf)}.`);
md.push('', '## Uncertain matches', '');
for (const r of results.filter(r => r.status === 'uncertain' || r.status === 'rows').sort(bySecSrc)) md.push(`- ${page(r.b.src)} · ${r.b.sec} — ${r.note}: «${first(r.site, 9)}» ↔ «${first(r.knText ?? '', 9)}» (${refOf(r.best!.unit.leaf)})`);
md.push('', '## Not found', '');
md.push('NOTFOUND_PLACEHOLDER');
md.push('', '### List', '');
for (const r of results.filter(r => r.status === 'not-found').sort(bySecSrc)) md.push(`- ${page(r.b.src)} · ${r.b.sec} — «${first(r.site, 10)}»`);
let notFoundText = '(categories: see scripts/kniewald/not-found-categories.md)';
try { notFoundText = fs.readFileSync('scripts/kniewald/not-found-categories.md', 'utf8').trim(); } catch { /* optional hand-written explanation */ }
fs.writeFileSync('KNIEWALD-CHECK.md', md.join('\n').replace('NOTFOUND_PLACEHOLDER', notFoundText) + '\n');

fs.mkdirSync('.cache', { recursive: true });
if (DEBUG) fs.writeFileSync('.cache/kniewald-debug.json', JSON.stringify(results.map(r => ({ src: r.b.src, sec: r.b.sec, status: r.status, F: +r.F.toFixed(2), P: +r.P.toFixed(2), R: +r.R.toFixed(2), refHit: r.refHit, typed: r.typed, near: r.near, citeEq: r.citeEq, cite: r.cite, kcite: r.best?.cite, ratio: +r.ratio.toFixed(2), note: r.note, site: r.site, kn: r.knText ?? r.best?.text, variant: r.best?.variant, ktype: r.best?.unit.type, leaf: r.best?.unit.leaf })), null, 1));
console.log({ paragraphs: paras.length, units: units.length, typedUnits: units.filter(u => u.type).length, candidates: cands.length, xrefs: xrefs.length, ...cnt(results), altEntries: Object.keys(alt).length });
