// Calendar engine: date + configuration -> liturgical day, by the Code of Rubrics of 1960.
// Paragraph numbers (n.) refer to the Code of Rubrics.
import { CalendarConfig, Cls, Commemoration, Day, MassRef, Observance, SanctoralEntry } from './types';
import { dayNumber, easter, fromDayNumber, isLeap, iso, weekday } from './dates';
import { Temporal, christTheKing, temporal } from './temporal';

const upper = (s: string) => s.toLocaleUpperCase('hr');

/** Place of a fixed feast in the table of precedence (n. 91). */
function ordOf(e: SanctoralEntry): number {
  if (e.ord) return e.ord;
  if (e.class === 4) return 30;
  if (e.class === 1) {
    if (e.id === '12-25') return 1;
    if (e.id === '01-06') return 3;
    if (e.id === '12-08' || e.id === '08-15') return 4;
    if (e.id === '12-24' || e.id === '01-01') return 5;
    if (e.id === '11-02') return 8;
    return e.local ? 12 : 11;
  }
  if (e.class === 2) return e.vigil ? 21 : e.lord ? 14 : e.local ? 19 : 16;
  return e.vigil ? 26 : e.local ? 23 : 24;
}

function toObs(e: SanctoralEntry, transferredFrom?: string): Observance {
  return {
    key: (e.local ? 'L:' : 'S:') + e.id, id: e.mass ?? (e.local ? e.id : 'Sancti/' + e.id), title: e.title, cls: e.class, ord: ordOf(e),
    kind: e.vigil ? 'vigil' : 'feast', colour: e.colour, lord: e.lord, bvm: e.bvm, local: e.local, with: e.with, transferredFrom,
    commAs: 'ordinary',
  };
}

interface YearCtx { y: number; byDate: Map<string, SanctoralEntry[]>; transfersIn: Map<number, Observance[]>; transferredOut: Set<string>; days: Map<number, Day> }

function sanctoralKey(y: number, m: number, d: number): string | null {
  // In leap years the bissextile day is inserted after 23 February: the feasts of 24–28 February are kept a day later.
  if (isLeap(y) && m === 2 && d >= 24) { if (d === 24) return null; d -= 1; }
  return `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function candidates(n: number, ctx: YearCtx): { t: Temporal; fixed: Observance[] } {
  const { y, m, d } = fromDayNumber(n);
  const t = temporal(n);
  const key = sanctoralKey(y, m, d);
  const fixed = (key ? ctx.byDate.get(key) ?? [] : []).map(e => toObs(e));
  // Movable feasts that are not days of the temporal cycle proper
  if (n === christTheKing(y)) fixed.push({ key: 'S:10-DU', id: 'Sancti/10-DU', title: 'Krist Kralj', cls: 1, ord: 3, kind: 'feast', colour: 'w', lord: true, commAs: null });
  // Seven Sorrows of Our Lady, Friday after Passion Sunday: a commemoration (1960)
  if (t.tid === 'Quad5-5') fixed.push({ key: 'S:Quad5-5', id: 'Tempora/Quad5-5', title: 'Sedam žalosti BDM', cls: 4, ord: 30, kind: 'feast', colour: 'w', bvm: true, commAs: 'ordinary' });
  return { t, fixed };
}

/** The winner of the day among the temporal day and the fixed feasts, ignoring transfers. */
function winnerOf(t: Temporal, fixed: Observance[], wd: number): Observance {
  let best: Observance = t;
  for (const f of fixed) {
    if (f.cls === 4) continue;
    if (f.kind === 'vigil' && wd === 0 && f.key !== 'S:12-24') continue; // n. 30: a vigil falling on a Sunday is omitted (not the vigil of Christmas)
    if (f.key === 'S:11-02' && wd === 0) continue;                // All Souls yields to the Sunday (n. 91, 8)
    if (f.ord < best.ord) best = f;
    else if (f.ord === best.ord && best !== t && false) best = f;
  }
  return best;
}

function buildYear(y: number, config: CalendarConfig): YearCtx {
  const byDate = new Map<string, SanctoralEntry[]>();
  const add = (e: SanctoralEntry) => { const a = byDate.get(e.date) ?? []; a.push(e); byDate.set(e.date, a); };
  const localIds = new Map((config.local ?? []).map(e => [e.date + '|' + (e.mass ?? e.id), e]));
  for (const e of config.sanctoral) add(e);
  for (const e of config.local ?? []) add({ ...e, local: true });
  const ctx: YearCtx = { y, byDate, transfersIn: new Map(), transferredOut: new Set(), days: new Map() };
  const first = dayNumber(y, 1, 1), lastDay = dayNumber(y, 12, 31);
  // ---- transfers of impeded I class feasts (n. 95) and of All Souls (n. 91, 8)
  const baseClass = (n: number): number => {
    const { t, fixed } = candidates(n, ctx);
    const w = winnerOf(t, fixed.filter(f => !ctx.transferredOut.has(f.key + '@' + n)), weekday(n));
    let cls: number = w.cls;
    for (const x of ctx.transfersIn.get(n) ?? []) cls = Math.min(cls, x.cls);
    return cls;
  };
  for (let n = first; n <= lastDay; n++) {
    const { t, fixed } = candidates(n, ctx);
    const wd = weekday(n);
    const w = winnerOf(t, fixed, wd);
    const firsts = fixed.filter(f => f.cls === 1 && f !== w).sort((a, b) => a.ord - b.ord);
    for (const f of firsts) {
      ctx.transferredOut.add(f.key + '@' + n);
      let target = n + 1;
      if (f.key !== 'S:11-02') while (baseClass(target) <= 2) target++;
      const arr = ctx.transfersIn.get(target) ?? [];
      arr.push({ ...f, transferredFrom: iso(n) });
      ctx.transfersIn.set(target, arr);
    }
  }
  return ctx;
}

const cache = new Map<string, YearCtx>();
let cacheConfig: CalendarConfig | null = null;
function yearCtx(y: number, config: CalendarConfig): YearCtx {
  if (cacheConfig !== config) { cache.clear(); cacheConfig = config; }
  let c = cache.get(String(y)); if (!c) cache.set(String(y), c = buildYear(y, config));
  return c;
}

function commType(o: Observance): 'privileged' | 'ordinary' | null {
  if (o.commAs !== undefined) return o.commAs;
  return 'ordinary';
}

export function getDay(n: number, config: CalendarConfig): Day {
  const { y, m, d } = fromDayNumber(n);
  const ctx = yearCtx(y, config);
  const cached = ctx.days.get(n); if (cached) return cached;
  const wd = weekday(n);
  const { t, fixed: fixed0 } = candidates(n, ctx);
  const omitted: Day['omitted'] = [];
  const fixed = fixed0.filter(f => !ctx.transferredOut.has(f.key + '@' + n)).concat(ctx.transfersIn.get(n) ?? []);
  for (const f of fixed0) if (ctx.transferredOut.has(f.key + '@' + n)) omitted.push({ key: f.key, title: f.title, reason: 'prenesen (n. 95)' });
  const E = easter(y);

  // ---- occurrence (n. 91–95)
  let win: Observance = winnerOf(t, fixed, wd);
  // Saturday Office of Our Lady on IV class Saturdays with no feast (n. 91, 27)
  let bvmSat = false;
  if (win === t && t.cls === 4 && t.kind === 'feria' && wd === 6 && !t.placeholder) {
    bvmSat = true;
    const { m: mm, d: dd } = { m, d };
    const variant = t.season === 'easter' ? 'C10Pasc' : (mm === 12 || mm === 1 || (mm === 2 && dd <= 2)) ? 'C10b' : (n < E - 46 && n > dayNumber(y, 2, 2) && n < E) ? 'C10c' : 'C10';
    win = { key: 'T:BVMSat', id: 'Commune/' + variant, title: 'Subotnja služba Gospina', cls: 4, ord: 27, kind: 'bvmsat', colour: 'w', bvm: true, commAs: null };
  }

  // ---- commemorations (n. 106–114)
  type C = Commemoration & { ord: number; seasonal?: boolean; with?: string; lord?: boolean; bvm?: boolean };
  const comms: C[] = [];
  const push = (o: Observance, type: 'privileged' | 'ordinary') => comms.push({ key: o.key, id: o.id, title: o.title, type, cls: o.cls, kind: o.kind, ord: o.ord, seasonal: o.seasonal, with: o.with, lord: o.lord, bvm: o.bvm, local: o.local, colour: o.colour });
  if (win !== t && !bvmSat && win.key !== 'S:12-24') { // the vigil of Christmas takes the place of the Advent day entirely
    const ty = commType(t);
    if (ty && !t.placeholder) {
      if (t.kind === 'sunday' && win.lord) omitted.push({ key: t.key, title: t.title, reason: 'blagdan Gospodnji zamjenjuje nedjelju bez spomena (n. 112b)' });
      else push(t, ty);
    }
  }
  for (const f of fixed) {
    if (f === win) continue;
    if (f.kind === 'vigil' && wd === 0 && f.key !== 'S:12-24') { omitted.push({ key: f.key, title: f.title, reason: 'bdijenje u nedjelju se izostavlja (n. 30)' }); continue; }
    if (f.cls === 1) { continue; }
    comms.push({ key: f.key, id: f.id, title: f.title, type: 'ordinary', cls: f.cls, kind: f.kind, ord: f.ord, with: f.with, lord: f.lord, bvm: f.bvm, local: f.local, colour: f.colour });
  }
  // Greater Litanies, 25 April (n. 80–83): a privileged commemoration at Mass; moved to Tuesday if Easter Sunday or Monday
  const apr25 = dayNumber(y, 4, 25);
  const litaniesDay = (apr25 === E || apr25 === E + 1) ? E + 2 : apr25;
  const greaterLitanies = n === litaniesDay;
  const rogation = n >= E + 36 && n <= E + 38;
  if (greaterLitanies) comms.push({ key: 'X:LitMaj', id: 'Tempora/Pasc5-1', title: 'Velike litanije', type: 'privileged', cls: 4, kind: 'oration', ord: 29 });

  // order: of the season first (n. 113), then the table of precedence
  comms.sort((a, b) => (a.seasonal ? 0 : 1) - (b.seasonal ? 0 : 1) || a.ord - b.ord);
  // exclusions (n. 112) and limits (n. 111)
  let allowed: C[] = [];
  // A feast of the Lord kept on a Sunday takes the Sunday's place with its rights (n. 16), so the Sunday limits apply.
  const isSunday = win.kind === 'sunday' || (wd === 0 && !!win.lord);
  for (const c of comms) {
    let reason = '';
    if (win.lord && c.lord) reason = 'isti naslov (n. 112a)';
    else if (win.bvm && c.bvm) reason = 'isti naslov (n. 112d)';
    else if (win.cls === 1 && c.type !== 'privileged') reason = 'na dan I. razreda samo povlašteni spomen (n. 111a)';
    else if (isSunday && win.cls === 2 && c.type !== 'privileged' && c.cls !== 2) reason = 'u nedjelju II. razreda samo spomen blagdana II. razreda (n. 111b)';
    else if (isSunday && win.cls === 1 && c.type !== 'privileged') reason = 'n. 111a';
    if (reason) { omitted.push({ key: c.key, title: c.title, reason }); continue; }
    allowed.push(c);
  }
  const limit = win.cls === 1 ? 99 : win.cls === 2 ? 1 : 2;
  if (isSunday && win.cls === 2 && allowed.some(c => c.type === 'privileged')) allowed = allowed.filter(c => c.type === 'privileged');
  for (const c of allowed.slice(limit)) omitted.push({ key: c.key, title: c.title, reason: 'prekoračen broj spomena (n. 114)' });
  allowed = allowed.slice(0, limit);

  const commemorations: Commemoration[] = [];
  // added orations under one conclusion with the prayer of the day
  if (win.with) commemorations.push({ key: win.key + '+with', id: win.id, title: win.with, type: 'same', cls: win.cls, kind: 'feast' });
  const pope = config.pope;
  if (pope && `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` === pope.date && !(t.tid.startsWith('Quad6-') && weekday(n) >= 4))
    commemorations.push({ key: 'X:Papa', id: 'Votive/Papa', title: 'Spomen sv. Oca (godišnjica uvođenja u papinsku službu)', type: 'same', cls: 4, kind: 'oration' });
  const ck = christTheKing(y);
  if (n === ck - 7) commemorations.push({ key: 'X:Missio', id: 'Votive/Propaganda', title: 'Misijska nedjelja (molitva za širenje vjere)', type: 'same', cls: 4, kind: 'oration' });
  for (const c of allowed) {
    commemorations.push({ key: c.key, id: c.id, title: c.title, type: c.type, cls: c.cls, kind: c.kind, local: c.local, colour: c.colour });
    if (c.with) commemorations.push({ key: c.key + '+with', id: c.id, title: c.with, type: 'same', cls: c.cls, kind: 'feast' });
  }
  if (win.key === 'S:12-25') commemorations.push({ key: 'S:12-25m2c', id: 'Sancti/12-25m2', title: 'sv. Anastazija, mučenica', type: 'privileged', cls: 4, kind: 'feast', onlyMass: 1 });

  // ---- Masses of the day
  const masses: MassRef[] = [];
  const flags: Day['flags'] = {};
  const tid = t.tid;
  if (win.key === 'S:12-25') masses.push({ id: 'Sancti/12-25m1', label: 'Ponoćka', kind: 'mass' }, { id: 'Sancti/12-25m2', label: 'Zornica', kind: 'mass' }, { id: 'Sancti/12-25m3', label: 'Danja misa', kind: 'mass' });
  else if (win.key === 'S:11-02') masses.push({ id: 'Sancti/11-02m1', label: '1. misa', kind: 'mass' }, { id: 'Sancti/11-02m2', label: '2. misa', kind: 'mass' }, { id: 'Sancti/11-02m3', label: '3. misa', kind: 'mass' });
  else if (win === t && tid === 'Quad6-0') masses.push({ id: 'Tempora/Quad6-0r:palms', label: 'Blagoslov grančica', kind: 'rite' }, { id: 'Tempora/Quad6-0r', label: 'Misa', kind: 'mass', variant: 'longior' }, { id: 'Tempora/Quad6-0r', label: 'Misa (kraća Muka)', kind: 'mass', variant: 'brevior' });
  else if (win === t && tid === 'Quad6-4') masses.push({ id: 'Tempora/Quad6-4rm1', label: 'Misa posvete ulja', kind: 'mass' }, { id: 'Tempora/Quad6-4r', label: 'Večernja misa Večere Gospodnje', kind: 'mass' });
  else if (win === t && tid === 'Quad6-5') masses.push({ id: 'Tempora/Quad6-5r', label: 'Obred Velikog petka', kind: 'rite' });
  else if (win === t && tid === 'Quad6-6') { masses.push({ id: 'Tempora/Quad6-6r', label: 'Vazmeno bdijenje', kind: 'rite' }); flags.noMass = true; }
  else if (win === t && t.ember && wd === 6) masses.push({ id: win.id, label: 'Misa (duži oblik)', kind: 'mass', variant: 'longior' }, { id: win.id, label: 'Misa (kraći oblik)', kind: 'mass', variant: 'brevior' });
  else masses.push({ id: win.id, kind: 'mass' });
  if (rogation || greaterLitanies) { masses.push({ id: 'Tempora/Pasc5-1', label: 'Prosna misa', kind: 'mass', variant: 'rogation' }); flags.rogation = true; if (greaterLitanies) flags.greaterLitanies = true; }
  if (t.ember) flags.ember = true;
  if (win.local || commemorations.some(c => c.local)) flags.local = true;

  // ---- display
  let title = win.cls === 1 && (win === t || win.key === 'S:10-DU') ? upper(win.title) : win.title;
  if (flags.rogation) title += ' (prosni dan)';
  const colours = win === t && tid === 'Quad6-0' ? (['v', 'r'] as Day['colours']) : win === t && tid === 'Quad6-5' ? (['b', 'v'] as Day['colours']) : win === t && tid === 'Quad6-6' ? (['w', 'v'] as Day['colours']) : undefined;
  const notes: string[] = [];
  const mmdd = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  for (const x of config.localNotes ?? []) if (x.date === mmdd) { notes.push(x.title); flags.local = true; }
  const day: Day = {
    date: iso(n), weekday: wd, season: t.season, temporalId: tid, celebration: win, cls: win.cls as Cls,
    colour: bvmSat ? 'w' : win.colour, colours, title, commemorations, masses, flags, notes, omitted,
  };
  ctx.days.set(n, day);
  return day;
}

export function getYear(y: number, config: CalendarConfig): Day[] {
  const out: Day[] = [];
  for (let n = dayNumber(y, 1, 1); n <= dayNumber(y, 12, 31); n++) out.push(getDay(n, config));
  return out;
}
