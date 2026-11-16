// Types of the calendar engine. The engine holds no liturgical text: titles come from the data tables in the configuration.
export type Cls = 1 | 2 | 3 | 4;
export type Colour = 'w' | 'r' | 'v' | 'g' | 'b' | 'p';
export type Kind = 'sunday' | 'feria' | 'feast' | 'vigil' | 'octave' | 'bvmsat';
export type CommType = 'privileged' | 'ordinary' | 'same';

export interface SanctoralEntry {
  date: string;            // MM-DD
  id: string;              // Divinum Officium Sancti id (or a local id)
  class: Cls;              // 4 = commemoration only
  colour: Colour;
  title: string;
  lord?: boolean;          // feast of the Lord
  bvm?: boolean;
  vigil?: boolean;
  with?: string;           // title of the inseparable commemoration (n. 110)
  local?: boolean;         // from the local layer
  ord?: number;            // explicit place in the table of precedence (n. 91)
  mass?: string;           // formulary id when it differs from the id
  massPaschal?: string;    // formulary id used in Paschaltide (Common of martyrs in Paschaltide)
  note?: string;
  source?: string;
}

export interface Observance {
  idPaschal?: string;      // formulary used instead of id in Paschaltide
  key: string;             // 'T:Adv1-0', 'S:12-04'
  id: string;              // formulary id: 'Tempora/Adv1-0', 'Sancti/12-04', 'Commune/C10b'
  title: string;
  cls: Cls;
  ord: number;             // position in the table of precedence, n. 91 (1–28); 30 = commemoration only
  kind: Kind;
  colour: Colour;
  lord?: boolean;
  bvm?: boolean;
  local?: boolean;
  with?: string;
  transferredFrom?: string;
  /** how it is commemorated when it loses the day: privileged (n. 109), ordinary, or not at all */
  commAs?: 'privileged' | 'ordinary' | null;
  seasonal?: boolean;      // a commemoration "of the season" (n. 113)
}

export interface Commemoration { key: string; id: string; title: string; type: CommType; cls: Cls; kind: Kind | 'oration'; onlyMass?: number; local?: boolean; colour?: Colour }
export interface MassRef { id: string; label?: string; kind: 'mass' | 'rite'; variant?: string; /** a rite added to the Mass of the day (not counted as one of the day's Masses) */ extra?: boolean }

export interface Day {
  date: string;
  weekday: number;
  season: string;          // season key
  temporalId: string;      // e.g. 'Quad3-1'
  celebration: Observance;
  cls: Cls;
  colour: Colour;
  colours?: Colour[];      // days with two colours
  title: string;           // display title (capitals for I class, suffixes applied)
  commemorations: Commemoration[];
  masses: MassRef[];
  flags: { rogation?: boolean; greaterLitanies?: boolean; ember?: boolean; local?: boolean; noMass?: boolean };
  notes: string[];         // e.g. neobvezatni spomendan of the local layer
  omitted: { key: string; title: string; reason: string }[];
}

export interface CalendarConfig {
  sanctoral: SanctoralEntry[];
  local?: SanctoralEntry[];                 // local layer (class 1–3 feasts); notes handled separately
  localNotes?: { date: string; title: string }[];
  /** anniversary of the pope's coronation/inauguration, MM-DD, and the label used for the added oration */
  pope?: { name: string; date: string };
}
