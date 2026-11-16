// Corpus and Mass-view types shared by the assembler, the build and the site.
export interface Unit { k: 'ref' | 'text' | 'rubric' | 'macro' | 'sep' | 'head' | 'missing'; la?: string; x?: string; name?: string; mark?: string }
export interface Formulary {
  officium: string; rank: string; rule: string[]; ruleInherited?: string[]; fallback?: string;
  sections: Record<string, Unit[]>; from?: Record<string, string>;
  variants?: Record<string, Record<string, Unit[] | null>>;
}
export interface Corpus {
  formularies: Record<string, Formulary>;
  texts: Record<string, string>;
  ordo: { prayers: Record<string, Unit[]>; prefaces: Record<string, Unit[]> };
}
export type LineKind = 'ref' | 'text' | 'rubric' | 'gloriaPatri' | 'conclusion' | 'oremus' | 'head';
export interface Line { k: LineKind; la: string; /** the text before a name was put in place of "N." */ la0?: string; x?: string; mark?: string; hr?: string; hrSrc?: string; kn?: string }
export interface Block { /** Croatian forms of the name put into this prayer in place of "N." (the build puts them in place of "I.") */ nameHr?: Record<string, string>; label?: string; commType?: string; lines: Line[]; /** where the block's text comes from: formulary id | section name */ src?: string; hr?: string; hrSrc?: string }
export interface Section { kind: 'section'; key: string; la: string; hr: string; blocks: Block[]; hidden?: boolean; src?: string }
export interface Note { kind: 'note'; key: string; text: string }
export type Item = Section | Note;
export interface MassView { id: string; formulary: string; label?: string; title: string; rankLine: string; colour: string; subnotes: string[]; items: Item[]; gloria: boolean; credo: boolean; preface: string }
