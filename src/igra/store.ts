// Stored data of the game (this device only, localStorage). Pure functions, so that the migration can be tested in Node.
//
// Version 1 (live from 17 Nov 2026), key "igra.v1":
//   { profili: [{ id, ime, dob: 'a'|'b'|'c', vel? }], tko: id|null, gotovo: { [profileId]: { [date]: 'n'|'v' } } }
// Version 2, key "igra.v2": the same, with v: 2 and the levels of the fixed-knowledge games:
//   razine: { [profileId]: { [game]: { l: level (1…), ok: [dates of the rounds finished correctly at this level] } } }
// Reading prefers v2; when only v1 exists it is migrated forward and the v1 entry is left untouched (a copy to fall back on).
// Anything unknown in a stored object is kept as it was, so that a later version's fields are not lost by an older page.

export type Dob = 'a' | 'b' | 'c';
export interface Profil { id: string; ime: string; dob: Dob; vel?: boolean }
export interface Razina { l: number; ok: string[] }
export interface Spremljeno {
  v: 2; profili: Profil[]; tko: string | null;
  gotovo: Record<string, Record<string, 'n' | 'v'>>;
  razine: Record<string, Record<string, Razina>>;
  [other: string]: unknown;
}
export const KEY = 'igra.v2', KEY_V1 = 'igra.v1';
export interface Storage { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }

export const empty = (): Spremljeno => ({ v: 2, profili: [], tko: null, gotovo: {}, razine: {} });
const isObj = (x: unknown): x is Record<string, any> => !!x && typeof x === 'object' && !Array.isArray(x);

/** Brings any stored object (v1 or v2) to the present version, keeping everything that can be kept. */
export function migrate(s: unknown): Spremljeno {
  if (!isObj(s) || !Array.isArray(s.profili)) return empty();
  const profili: Profil[] = s.profili.filter((p: any) => isObj(p) && typeof p.id === 'string').map((p: any) => ({ ...p, ime: String(p.ime ?? ''), dob: p.dob === 'a' || p.dob === 'c' ? p.dob : 'b' }));
  const gotovo: Spremljeno['gotovo'] = {};
  if (isObj(s.gotovo)) for (const [pid, m] of Object.entries(s.gotovo)) if (isObj(m)) { gotovo[pid] = {}; for (const [d, x] of Object.entries(m)) if (x === 'n' || x === 'v') gotovo[pid][d] = x; }
  const razine: Spremljeno['razine'] = {};
  if (isObj(s.razine)) for (const [pid, m] of Object.entries(s.razine)) if (isObj(m)) { razine[pid] = {}; for (const [g, x] of Object.entries(m)) if (isObj(x)) razine[pid][g] = { l: Number.isInteger(x.l) && x.l >= 1 ? x.l : 1, ok: Array.isArray(x.ok) ? x.ok.filter((d: unknown) => typeof d === 'string') : [] }; }
  const tko = typeof s.tko === 'string' && profili.some(p => p.id === s.tko) ? s.tko : profili[0]?.id ?? null;
  return { ...s, v: 2, profili, tko, gotovo, razine };
}

/** Reads the stored data: v2 if present, else v1 migrated forward. A broken entry is never thrown away silently: v1 stays. */
export function readStore(st: Storage | null): Spremljeno {
  if (!st) return empty();
  for (const k of [KEY, KEY_V1]) {
    try { const raw = st.getItem(k); if (raw == null) continue; const s = JSON.parse(raw); if (isObj(s) && Array.isArray(s.profili)) return migrate(s); } catch { /* try the older one */ }
  }
  return empty();
}
/** Writes v2. Returns false when the browser does not allow storage (private mode). */
export function writeStore(st: Storage | null, s: Spremljeno): boolean {
  try { if (!st) return false; st.setItem(KEY, JSON.stringify(s)); return true; } catch { return false; }
}
/** Erases everything of the game on this device (both versions). */
export function eraseStore(st: Storage | null) { for (const k of [KEY, KEY_V1]) try { st?.removeItem(k); } catch { /* nothing stored */ } }

// ---------- levels of the fixed-knowledge games
/** Rounds finished correctly at a level before the next one opens. */
export const STEP = 3;
export function levelOf(s: Spremljeno, pid: string, game: string): number { return s.razine[pid]?.[game]?.l ?? 1; }
/** Records a round finished at the present level; `correct` = without a wrong try. Moves up after STEP different rounds, up to `max`.
 *  Returns true when the level rose. */
export function recordLevel(s: Spremljeno, pid: string, game: string, date: string, correct: boolean, max: number): boolean {
  if (!correct) return false;
  const r = ((s.razine[pid] ??= {})[game] ??= { l: 1, ok: [] });
  if (r.l >= max) { r.l = max; return false; }
  if (!r.ok.includes(date)) r.ok.push(date);
  if (r.ok.length >= STEP) { r.l++; r.ok = []; return true; }
  return false;
}
