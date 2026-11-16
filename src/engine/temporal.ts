// Temporal cycle of the 1962 Missal (Code of Rubrics 1960). Pure functions of the date.
import { Cls, Colour, Kind, Observance } from './types';
import { advent1, dayNumber, easter, fromDayNumber, weekday } from './dates';

export interface Temporal extends Observance {
  tid: string;            // Divinum Officium style id, e.g. 'Quad3-1'
  season: string;
  ember?: boolean;
  /** lower-case nominative and genitive of the Sunday that names the week (for feria titles and commemorations) */
  nom?: string;
  /** numbered Sunday title of the week even when a feast replaces the Sunday */
  weekGen?: string;
  placeholder?: boolean;  // a day with no temporal office of its own (25 Dec, 1 and 6 Jan)
}

const WD_NOM = ['Nedjelja', 'Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota'];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Divinum Officium file names that differ from the plain day id under the 1960 rubrics (Tabulae/Tempora/Generale.txt).
const DO_1960: Record<string, string> = {
  'Quad5-5': 'Quad5-5Feria', 'Quad6-0': 'Quad6-0r', 'Quad6-4': 'Quad6-4r', 'Quad6-5': 'Quad6-5r', 'Quad6-6': 'Quad6-6r',
  'Pasc2-3': 'Pasc2-3Feria', 'Pasc2-4': 'Pasc2-4Feria', 'Pasc2-5': 'Pasc2-5Feria', 'Pasc2-6': 'Pasc2-6Feria', 'Pasc3-0': 'Pasc3-0r',
  'Pasc3-1': 'Pasc3-1Feria', 'Pasc3-2': 'Pasc3-2Feria', 'Pasc3-3': 'Pasc3-3Feria', 'Pasc5-1': 'Pasc5-1r', 'Pasc6-4': 'Pasc6-4r', 'Pasc6-6': 'Pasc6-6r',
  'Pent01-0': 'Pent01-0r', 'Pent02-0': 'Pent02-0r', 'Pent02-6': 'Pent02-6Feria', 'Pent03-0': 'Pent03-0r', 'Pent03-1': 'Pent03-1Feria',
  'Pent03-2': 'Pent03-2Feria', 'Pent03-3': 'Pent03-3Feria', 'Pent03-4': 'Pent03-4Feria', 'Pent03-5': 'Pent03-5Feria',
};
function mk(tid: string, title: string, cls: Cls, ord: number, kind: Kind, colour: Colour, season: string, extra: Partial<Temporal> = {}): Temporal {
  return { key: 'T:' + tid, id: 'Tempora/' + (DO_1960[tid] ?? tid), tid, title, cls, ord, kind, colour, season, ...extra };
}
const feria = (tid: string, weekGen: string, colour: Colour, season: string, extra: Partial<Temporal> = {}) =>
  mk(tid, `Feria (u tjednu ${weekGen})`, 4, 28, 'feria', colour, season, { commAs: null, weekGen, ...extra });
const sunday = (tid: string, nom: string, cls: Cls, colour: Colour, season: string, extra: Partial<Temporal> = {}) =>
  mk(tid, nom, cls, cls === 1 ? 6 : 15, 'sunday', colour, season, { commAs: 'privileged', nom, seasonal: true, ...extra });

/** Third Sunday of September: the Ember days are the Wednesday, Friday and Saturday after it (first Sunday of the month = first Sunday in the month, 1960). */
export function septemberEmberSunday(y: number): number { const n = dayNumber(y, 9, 1); return n + ((7 - weekday(n)) % 7) + 14; }
/** Feast of Christ the King: last Sunday of October. */
export function christTheKing(y: number): number { const n = dayNumber(y, 10, 31); return n - weekday(n); }

export function temporal(n: number): Temporal {
  const { y, m, d } = fromDayNumber(n);
  const wd = weekday(n);
  const A = advent1(y);
  // ---- Advent and Christmas (end of the civil year)
  if (n >= A) {
    if (m === 12 && d >= 25) {
      if (d === 25) return mk('Nat25', 'Božić', 1, 99, 'octave', 'w', 'christmas', { placeholder: true, commAs: null });
      if (wd === 0) return sunday('Nat1-0', 'Nedjelja u božićnoj osmini', 2, 'w', 'christmas');
      return mk('Nat' + d, `${ROMAN[d - 24]}. dan božićne osmine`, 2, 17, 'octave', 'w', 'christmas', { commAs: 'privileged', seasonal: true });
    }
    const w = Math.floor((n - A) / 7) + 1;
    const gen = `${w}. nedjelje došašća`;
    if (wd === 0) return sunday(`Adv${w}-0`, `${w}. nedjelja došašća`, 1, w === 3 ? 'p' : 'v', 'advent', { weekGen: gen });
    const ember = w === 3 && (wd === 3 || wd === 5 || wd === 6);
    const late = m === 12 && d >= 17;
    const title = ember ? `${WD_NOM[wd]} adventskih kvatri` : `Feria (u tjednu ${gen})`;
    return mk(`Adv${w}-${wd}`, title, ember || late ? 2 : 3, ember || late ? 18 : 25, 'feria', 'v', 'advent', { commAs: 'privileged', seasonal: true, ember, weekGen: gen });
  }
  const E = easter(y);
  const jan1 = dayNumber(y, 1, 1);
  // ---- 1–13 January
  if (m === 1 && d <= 13) {
    if (d === 1) return mk('Nat01', 'Osmina Božića', 4, 99, 'feria', 'w', 'christmas', { placeholder: true, commAs: null });
    if (d <= 5) {
      const wd1 = weekday(jan1);
      const holyNameDay = wd1 >= 3 ? 1 + (7 - wd1) : 2; // Sunday between 2 and 5 January, otherwise 2 January
      if (d === holyNameDay) return mk('Nat2-0', 'Presveto Ime Isusovo', 2, 14, 'feast', 'w', 'christmas', { lord: true, commAs: null });
      return mk('Nat0' + d, 'Feria (nakon Osmine Božića)', 4, 28, 'feria', 'w', 'christmas', { commAs: null });
    }
    if (d === 6) return mk('Epi06', 'Bogojavljenje', 4, 99, 'feria', 'w', 'epiphany', { placeholder: true, commAs: null });
    if (wd === 0) return mk('Epi1-0', 'Sveta Obitelj Isusa, Marije i Josipa', 2, 14, 'feast', 'w', 'epiphany', { lord: true, commAs: null, weekGen: '1. nedjelje po Bogojavljenju' });
    const firstSunday = dayNumber(y, 1, 7) + ((7 - weekday(dayNumber(y, 1, 7))) % 7);
    if (n < firstSunday) return mk('Epi0-' + d, 'Feria (nakon Bogojavljenja)', 4, 28, 'feria', 'w', 'epiphany', { commAs: null, id: 'Sancti/01-' + String(d).padStart(2, '0') });
    return feria('Epi1-' + wd, '1. nedjelje po Bogojavljenju', 'w', 'epiphany');
  }
  const septuagesima = E - 63;
  // ---- time after Epiphany
  if (n < septuagesima) {
    const firstSunday = dayNumber(y, 1, 7) + ((7 - weekday(dayNumber(y, 1, 7))) % 7);
    const w = Math.floor((n - firstSunday) / 7) + 1;
    const gen = `${w}. nedjelje po Bogojavljenju`;
    if (wd === 0) return sunday(`Epi${w}-0`, `${w}. nedjelja po Bogojavljenju`, 2, 'g', 'afterEpiphany', { weekGen: gen });
    return feria(`Epi${w}-${wd}`, gen, 'g', 'afterEpiphany');
  }
  // ---- Septuagesima to Holy Saturday
  if (n < E) {
    const ash = E - 46;
    if (n < ash) {
      const w = Math.floor((n - septuagesima) / 7) + 1;
      const nom = ['', 'Sedamdesetnica (Septuagesima)', 'Šezdesetnica (Sexagesima)', 'Pedesetnica (Quinquagesima)'][w];
      const gen = ['', 'Sedamdesetnice (Septuagesimae)', 'Šezdesetnice (Sexagesimae)', 'Pedesetnice (Quinquagesimae)'][w];
      if (wd === 0) return sunday(`Quadp${w}-0`, nom, 2, 'v', 'septuagesima', { weekGen: gen });
      return feria(`Quadp${w}-${wd}`, gen, 'v', 'septuagesima');
    }
    if (n === ash) return mk('Quadp3-3', 'Pepelnica', 1, 7, 'feria', 'v', 'lent', { commAs: 'privileged', seasonal: true });
    if (n < E - 42) return mk(`Quadp3-${wd}`, `${WD_NOM[wd]} po Pepelnici`, 3, 22, 'feria', 'v', 'lent', { commAs: 'privileged', seasonal: true });
    const w = Math.floor((n - (E - 42)) / 7) + 1;
    const season = w >= 5 ? 'passion' : 'lent';
    if (w === 6) {
      if (wd === 0) return sunday('Quad6-0', 'Cvjetna nedjelja (2. nedjelja Muke)', 1, 'v', season);
      const names = ['', 'Veliki ponedjeljak', 'Veliki utorak', 'Velika srijeda', 'Veliki četvrtak', 'Veliki petak', 'Velika subota'];
      const colour: Colour = wd === 4 || wd === 6 ? 'w' : wd === 5 ? 'b' : 'v';
      return mk(`Quad6-${wd}`, names[wd], 1, wd >= 4 ? 2 : 7, 'feria', colour, season, { commAs: 'privileged', seasonal: true });
    }
    if (wd === 0) {
      const nom = w === 5 ? 'Gluha nedjelja (Glušnica), 1. nedjelja Muke' : `${w}. korizmena nedjelja`;
      return sunday(`Quad${w}-0`, nom, 1, w === 4 ? 'p' : 'v', season);
    }
    const ember = w === 1 && (wd === 3 || wd === 5 || wd === 6);
    const title = ember ? `${WD_NOM[wd]} korizmenih kvatri` : w === 5 ? `${WD_NOM[wd]} u 1. tjednu Muke` : `${WD_NOM[wd]} u ${w}. tjednu korizme`;
    return mk(`Quad${w}-${wd}`, title, ember ? 2 : 3, ember ? 18 : 22, 'feria', 'v', season, { commAs: 'privileged', seasonal: true, ember });
  }
  const P = E + 49;
  // ---- Paschaltide
  if (n < P + 7) {
    const w = Math.floor((n - E) / 7);
    if (w === 0) {
      const names = ['Uskrs (Nedjelja Uskrsnuća Gospodina našega Isusa Krista)', 'Uskrsni ponedjeljak', 'Uskrsni utorak', 'Uskrsna srijeda', 'Uskrsni četvrtak', 'Uskrsni petak', 'Bijela subota (Uskrsna subota)'];
      return mk(`Pasc0-${wd}`, names[wd], 1, wd === 0 ? 1 : 10, wd === 0 ? 'sunday' : 'octave', 'w', 'easter', { commAs: 'privileged', seasonal: true });
    }
    if (w === 7) {
      const names = ['Duhovi', 'Duhovski ponedjeljak', 'Duhovski utorak', 'Duhovska kvatrena srijeda', 'Duhovski četvrtak', 'Duhovski kvatreni petak', 'Duhovska kvatrena subota'];
      return mk(`Pasc7-${wd}`, names[wd], 1, wd === 0 ? 1 : 10, wd === 0 ? 'sunday' : 'octave', 'r', 'easter', { commAs: 'privileged', seasonal: true, ember: wd === 3 || wd === 5 || wd === 6 });
    }
    if (w === 1 && wd === 0) return sunday('Pasc1-0', 'Bijela nedjelja', 1, 'w', 'easter', { weekGen: 'Bijele nedjelje' });
    if (w === 5 && wd === 3) return mk('Pasc5-3', 'Bdijenje uoči dana Uzašašća Gospodina našega Isusa Krista', 2, 21, 'vigil', 'w', 'easter', { commAs: 'ordinary' });
    if (w === 5 && wd === 4) return mk('Pasc5-4', 'Uzašašće Gospodina našega Isusa Krista (Spasovo)', 1, 3, 'feast', 'w', 'easter', { lord: true, commAs: null });
    if (w === 5 && wd > 4) return mk(`Pasc5-${wd}`, 'Feria (nakon Uzašašća)', 4, 28, 'feria', 'w', 'easter', { commAs: null });
    if (w === 6 && wd === 6) return mk('Pasc6-6', 'Bdijenje uoči Duhova', 1, 9, 'vigil', 'r', 'easter', { commAs: 'privileged' });
    const nom = w === 6 ? 'Nedjelja po Uzašašću' : `${w}. nedjelja po Uskrsu`;
    const gen = w === 1 ? 'Bijele nedjelje' : w === 6 ? 'nedjelje po Uzašašću' : `${w}. nedjelje po Uskrsu`;
    if (wd === 0) return sunday(`Pasc${w}-0`, nom, 2, 'w', 'easter', { weekGen: gen });
    return feria(`Pasc${w}-${wd}`, gen, 'w', 'easter');
  }
  // ---- time after Pentecost
  const w = Math.floor((n - P) / 7);
  const last = A - 7;
  const total = (last - P) / 7; // number of the last Sunday after Pentecost (23–28)
  const sundayOfWeek = n - wd;
  let stem: string, nomS: string, genS: string;
  if (sundayOfWeek === last) { stem = 'Pent24'; nomS = 'Posljednja nedjelja po Duhovima'; genS = 'Posljednje nedjelje po Duhovima'; }
  else {
    stem = w <= 23 ? `Pent${String(w).padStart(2, '0')}` : `PentEpi${6 - (total - 1 - w)}`;
    nomS = `${w}. nedjelja po Duhovima`; genS = `${w}. nedjelje po Duhovima`;
  }
  if (wd === 0) {
    if (w === 1) return mk('Pent01-0', 'Presveto Trojstvo', 1, 3, 'feast', 'w', 'afterPentecost', { lord: true, commAs: null, weekGen: genS });
    return sunday(`${stem}-0`, nomS, 2, 'g', 'afterPentecost', { weekGen: genS });
  }
  if (w === 1 && wd === 4) return mk('Pent01-4', 'Tijelovo', 1, 3, 'feast', 'w', 'afterPentecost', { lord: true, commAs: null });
  if (w === 2 && wd === 5) return mk('Pent02-5', 'Presveto Srce Isusovo', 1, 3, 'feast', 'w', 'afterPentecost', { lord: true, commAs: null });
  const es = septemberEmberSunday(y);
  if (n > es && n < es + 7 && (wd === 3 || wd === 5 || wd === 6))
    return mk(`${stem}-${wd}`, `${WD_NOM[wd]} rujanskih kvatri`, 2, 18, 'feria', 'v', 'afterPentecost', { commAs: 'privileged', seasonal: true, ember: true, weekGen: genS, id: 'Tempora/093-' + wd });
  return feria(`${stem}-${wd}`, genS, 'g', 'afterPentecost');
}
