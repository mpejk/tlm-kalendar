// Shared helpers for reading the old site's windows-1250 pages.
const dec = new TextDecoder('windows-1250');
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', nbsp: ' ', apos: "'" };
export function decodeEntities(s) {
  return s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(\w+);/g, (m, n) => NAMED[n] ?? m);
}
export function decodeHtml(buf) { return dec.decode(buf); }
export function clean(s) { return decodeEntities(s.replace(/<[^>]+>/g, ' ')).replace(/[\s ]+/g, ' ').trim(); }
// Encoding damage on the old site: a few Croatian letters were stored as their ISO-8859-1 look-alikes.
const DAMAGE = { 'æ': 'ć', 'ð': 'đ', 'è': 'č', 'Æ': 'Ć', 'Ð': 'Đ', 'È': 'Č' };
export function repairHr(s) { return s.replace(/[æðèÆÐÈ]/g, c => DAMAGE[c]); }
