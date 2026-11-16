// Normalisation of Latin for matching (shared by the build and the browser): accents, case, punctuation, spacing, æ/ae, œ/oe,
// j/i, y/i and common spelling variants are folded. A block key is a hash of the normalised text of a block.
export function normLa(s: string): string {
  return s.replace(/<[^>]+>/g, ' ')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/œ/g, 'oe')
    .replace(/ae|oe/g, 'e')
    .replace(/j/g, 'i').replace(/y/g, 'i')
    .replace(/ch/g, 'c').replace(/th/g, 't').replace(/ph/g, 'f')
    .replace(/([a-z])\1+/g, '$1')
    .replace(/ci(?=[aeiou])/g, 'ti')
    .replace(/[^a-z]+/g, ' ').trim();
}
const FORMULAS = [
  /gloria patri et filio et spiritui sancto sicut erat in principio et nunc et semper et in secula seculorum amen/g,
  /per (dominum nostrum|eumdem dominum nostrum|eundem dominum nostrum) iesum cristum filium tum qui tecum vivit et regnat in unitate (eiusdem )?spiritus sancti deus per omnia secula seculorum( amen)?/g,
  /qui tecum vivit et regnat in unitate (eiusdem )?spiritus sancti deus per omnia secula seculorum( amen)?/g,
  /qui vivis et regnas cum deo patre in unitate (eiusdem )?spiritus sancti deus per omnia secula seculorum( amen)?/g,
  /qui vivis et regnas (cum deo patre )?in secula seculorum( amen)?/g, /qui vivit et regnat in secula seculorum( amen)?/g,
  /per cristum dominum nostrum( amen)?$/g, /per eumdem cristum dominum nostrum( amen)?$/g,
  /qui cum eodem deo patre et spiritu sancto vivis et regnas deus per omnia secula seculorum/g, /\bsedulius\b/g,
  /\boremus\b/g, /flectamus genua( levate)?/g, /humiliate capita vestra deo/g,
];
/** The text of a block reduced to its proper words: formulas (conclusions, Gloria Patri, Oremus) and inline rubrics removed. */
export function coreLa(s: string): string {
  let t = normLa(s.replace(/<b>[\s\S]*?<\/b>/g, ' ').replace(/(^|\s)[CSJ]\.(?=\s)/g, ' ').replace(/\((deinde|sed|atque|vero)\b[^)]*\)/g, ' ').replace(/[(\[]Hic genuflectitur[^)\]]*[)\]]/gi, ' ').replace(/\(hodi[ée]rna die\)/gi, 'hodierna die')
    .replace(/\((?:[1-4I]{1,3}\.? )?\p{Lu}[\p{L}]*\.? ?\d+[^()]*\)/gu, ' ').replace(/\[[^\]]*\]/g, ' '));
  for (const f of FORMULAS) t = t.replace(f, ' ');
  return t.replace(/\s+/g, ' ').trim();
}
/** 64-bit FNV-1a as 16 hex digits (two 32-bit halves with different offsets). */
export function hashKey(s: string): string {
  let a = 0x811c9dc5, b = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 0x01000193); b = Math.imul(b ^ c, 0x5bd1e995) ^ (b >>> 13); }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}
export function blockCore(lines: { k: string; la: string }[]): string { return coreLa(lines.filter(l => l.k === 'text').map(l => l.la).join(' ')); }
