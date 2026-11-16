// Normalisation of Latin for matching: accents, case, punctuation, spacing, æ/ae, œ/oe, j/i and y/i are folded.
export function normLa(s) {
  return s.replace(/<[^>]+>/g, ' ')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/œ/g, 'oe')
    .replace(/ae|oe/g, 'e')
    .replace(/j/g, 'i').replace(/y/g, 'i')
    .replace(/[^a-z]+/g, ' ').trim();
}
// Normalisation of displayed text for comparisons "after normalising whitespace and typography".
export function normText(s) {
  return s.replace(/<[^>]+>/g, ' ').normalize('NFC').replace(/[»«„“”"']/g, '"').replace(/[–—-]/g, '-').replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
}
// Inline scripture reference such as "(Ps 79, 2)" or "(Isai 30, 30)" or "(1 Kor 2, 3-4)".
export const INLINE_REF = /\((?:[1-4I]{1,3}\.? )?\p{Lu}[\p{L}]*\.? ?\d+[^()]*\)/gu;
export function stripTags(s) { return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }
