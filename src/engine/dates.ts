// Calendar arithmetic on plain {y, m, d} dates (proleptic Gregorian, no time zones).
export interface YMD { y: number; m: number; d: number }
export function dayNumber(y: number, m: number, d: number): number { return Math.floor(Date.UTC(y, m - 1, d) / 86400000); }
export function fromDayNumber(n: number): YMD { const t = new Date(n * 86400000); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; }
/** 0 = Sunday … 6 = Saturday */
export function weekday(n: number): number { return (((n + 4) % 7) + 7) % 7; }
export function iso(n: number): string { const { y, m, d } = fromDayNumber(n); return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
export function parseIso(s: string): number { const [y, m, d] = s.split('-').map(Number); return dayNumber(y, m, d); }
export function isLeap(y: number): boolean { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
/** Gregorian Easter Sunday (Meeus/Jones/Butcher) as a day number. */
export function easter(y: number): number {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return dayNumber(y, month, day);
}
/** First Sunday of Advent: the Sunday nearest 30 November (27 Nov – 3 Dec). */
export function advent1(y: number): number { const n = dayNumber(y, 11, 27); return n + ((7 - weekday(n)) % 7); }
