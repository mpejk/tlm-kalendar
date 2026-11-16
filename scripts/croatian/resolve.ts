// Croatian for a Latin block: exact match of the normalised proper words in the block memory, else a close match
// (old-site Latin typos, spelling), else nothing.
import fs from 'node:fs';
import { similarity } from '../verify/texts-lib';

function lev(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 9;
  let d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) { const p = d.slice(); d[0] = i; for (let j = 1; j <= b.length; j++) d[j] = Math.min(p[j] + 1, d[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); }
  return d[b.length];
}
/** True when two normalised texts differ only the way a typo or a spelling variant does: a few words one or two letters apart,
 *  or words run together / split. A different name, an added or a missing word is not a typo. */
export function typoOnly(a: string, b: string): boolean {
  const A = a.split(' '), B = b.split(' ');
  const L = Array.from({ length: A.length + 1 }, () => new Uint16Array(B.length + 1));
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  let i = 0, j = 0, diffs = 0; let da: string[] = [], db: string[] = [];
  const flush = () => {
    if (!da.length && !db.length) return true;
    diffs++;
    const x = da.join(''), y = db.join('');
    const ok = x === y || (da.length === db.length && da.every((w, k) => typoPair(w, db[k]))) || (da.length && db.length && lev(x, y) <= 1 && x.length > 5);
    da = []; db = []; return !!ok;
  };
  while (i < A.length || j < B.length) {
    if (i < A.length && j < B.length && A[i] === B[j]) { if (!flush()) return false; i++; j++; }
    else if (j < B.length && (i >= A.length || L[i][j + 1] >= L[i + 1][j])) db.push(B[j++]); else da.push(A[i++]);
  }
  return flush() && diffs <= Math.max(3, Math.round(A.length / 60));
}
let NAMES = new Set<string>();
const typoPair = (w: string, v: string) => { const d = lev(w, v); const long = Math.max(w.length, v.length) >= 5; if (NAMES.has(w) || NAMES.has(v)) return d <= 1 && long; return d <= (long ? 2 : 1); };
export interface Hit { hr: string; src: 'site' | 'kniewald'; via: 'exact' | 'typo' | 'variant' | 'manual'; page: string; sim?: number; diff?: string }

const BOOKS = new Set('isai esdr iv i ii iii vel neh tren ps sap cant et eccli prov iob dan ier os ioel mal mat marc luc ioan act rom cor gal efes fil col tes tim hebr iac petr apoc ex gen lev num deut reg par tob iudit ester mac postcomunio v p'.split(' '));
const DIVINE = new Set('deus dei deo deum domine dominus domini domino dominum cristus cristi cristo cristum iesus iesu iesum spiritus sancti sancto sanctus sanctum pater patris patri filius fili filium filio maria marie mariam virgo virginis eclesia eclesie isrel'.split(' '));

export function makeResolver(file = 'data/tm/blocks.json') {
  const tm = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, { hr: string; src: string; sec: string }>;
  // word statistics: frequent words, and words the old site writes with a capital inside a sentence (names)
  const freq = new Map<string, number>(); const names = new Set<string>();
  for (const k of Object.keys(tm)) for (const w of k.split(' ')) freq.set(w, (freq.get(w) ?? 0) + 1);
  const units = JSON.parse(fs.readFileSync('data/tm/tm.json', 'utf8')) as Record<string, { la: string }>;
  for (const u of Object.values(units)) for (const m of u.la.matchAll(/[\p{Ll},] (\p{Lu}[\p{L}]+)/gu)) { const w = normLaLocal(m[1]); if (!DIVINE.has(w)) names.add(w); }
  NAMES = names;
  const VARWORDS = new Set('memoriam comemorationem comemoratione festivitate festivitatem festum solemnia solemnitate natalitia'.split(' '));
  const common = (w: string) => VARWORDS.has(w) || (freq.get(w) ?? 0) >= 15 && !names.has(w);
  const manual = fs.existsSync('data/tm/manual.json') ? JSON.parse(fs.readFileSync('data/tm/manual.json', 'utf8')) as Record<string, { hr: string; page: string; why: string }> : {};

  /** Differences that leave the translation valid: typos, references that slipped into the old-site text, an Alleluia more or
   *  less, one or two common words of the Vulgate text. Never a name. Returns a description, or null if the texts really differ. */
  function variantOnly(a: string, b: string): string | null {
    const A = a.split(' '), B = b.split(' ');
    if (A.length * B.length > 2_000_000) return null;
    const L = Array.from({ length: A.length + 1 }, () => new Uint16Array(B.length + 1));
    for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    let i = 0, j = 0, words = 0; let da: string[] = [], db: string[] = []; const notes: string[] = []; let ok = true; let generic = false;
    const flush = () => {
      if (!da.length && !db.length) return;
      const x = da.join(''), y = db.join('');
      const typo = x === y || (da.length === db.length && da.every((w, k) => typoPair(w, db[k]))) || (!!da.length && !!db.length && lev(x, y) <= 1 && x.length > 5);
      if (!typo) {
        const xa = da.join(' '), xb = db.join(' ');
        if (/^sequentia sancti evangeli secundum \w+( in ilo tempore)?$/.test(xa) && !xb) { notes.push('naslov evanđelja'); da = []; db = []; return; }
        // the memory has the prayer of the Common with "N.", the Mass names the saint: the Croatian keeps the placeholder
        if (xa === 'n' && db.length >= 1 && db.length <= 3) { notes.push(`N. → ${xb}`); generic = true; da = []; db = []; return; }
        const rest = [...da.filter(w => !BOOKS.has(w)), ...db.filter(w => w.length > 1)].filter(w => w !== 'aleluia');
        if (rest.some(w => !common(w)) || rest.length > 3) ok = false;
        words += rest.length;
        if (da.length || db.length) notes.push(`${da.join(' ') || '∅'} → ${db.join(' ') || '∅'}`);
      }
      da = []; db = [];
    };
    while (i < A.length || j < B.length) {
      if (i < A.length && j < B.length && A[i] === B[j]) { flush(); i++; j++; }
      else if (j < B.length && (i >= A.length || L[i][j + 1] >= L[i + 1][j])) db.push(B[j++]); else da.push(A[i++]);
    }
    flush();
    if (!ok || words > Math.max(3, Math.round(A.length / 40))) return null;
    return notes.join('; ');
  }

  const byHead = new Map<string, string[]>(); const byTail = new Map<string, string[]>();
  const head = (c: string) => c.split(' ').slice(0, 3).join(' '), tail = (c: string) => c.split(' ').slice(-3).join(' ');
  const push = (m: Map<string, string[]>, k: string, v: string) => { const a = m.get(k); if (a) a.push(v); else m.set(k, [v]); };
  for (const k of Object.keys(tm)) { push(byHead, head(k), k); push(byTail, tail(k), k); const w = k.split(' '); if (w.length > 6) { push(byHead, w.slice(1, 4).join(' '), k); push(byHead, w.slice(3, 6).join(' '), k); } }
  const cache = new Map<string, Hit | null>();
  resolve.variantOnly = variantOnly;
  return resolve;
  function resolve(core: string): Hit | null {
    if (!core) return null;
    if (cache.has(core)) return cache.get(core)!;
    let hit: Hit | null = null;
    const e = tm[core];
    if (manual[core]) hit = { hr: manual[core].hr, src: 'site', via: 'manual', page: manual[core].page, diff: manual[core].why };
    else if (e) hit = { hr: e.hr, src: 'site', via: 'exact', page: e.src };
    else {
      const w = core.split(' ');
      const cands = new Set([...(byHead.get(head(core)) ?? []), ...(byTail.get(tail(core)) ?? []), ...(byHead.get(w.slice(1, 4).join(' ')) ?? []), ...(byHead.get(w.slice(3, 6).join(' ')) ?? [])]);
      let best: Hit | null = null;
      for (const k of cands) {
        if (Math.abs(k.length - core.length) > 0.2 * core.length + 12) continue;
        const s = similarity(k, core); if (s < 0.8 || (best && s <= best.sim!)) continue;
        if (typoOnly(k, core)) best = { hr: tm[k].hr, src: 'site', via: 'typo', page: tm[k].src, sim: s };
        else { const d = variantOnly(k, core); if (d !== null) best = { hr: tm[k].hr, src: 'site', via: 'variant', page: tm[k].src, sim: s, diff: d }; }
      }
      hit = best;
    }
    cache.set(core, hit); return hit;
  }
}
function normLaLocal(s: string): string { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/ae|oe/g, 'e').replace(/j/g, 'i').replace(/y/g, 'i').replace(/ch/g, 'c').replace(/th/g, 't').replace(/ph/g, 'f').replace(/([a-z])\1+/g, '$1').replace(/ci(?=[aeiou])/g, 'ti').replace(/[^a-z]+/g, ''); }
