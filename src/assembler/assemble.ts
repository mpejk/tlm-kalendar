// Assembler: liturgical day + corpus -> the ordered Mass (sections, commemoration prayers in place, preface, Gloria and Credo lines).
import { Commemoration, Day, MassRef } from '../engine/types';
import { Block, Corpus, Formulary, Item, Line, MassView, Section, Unit } from './types';

export const LABELS: Record<string, [string, string]> = {
  Introitus: ['Antíphona ad intróitum', 'Ulazna pjesma'], Oratio: ['Orátio', 'Molitva'], Epistola: ['Epístola', 'Poslanica'], Lectio: ['Léctio', 'Čitanje'],
  G: ['Graduále', 'Gradual'], GA: ['Graduále + Allelúia', 'Gradual + Aleluja'], GT: ['Graduále + Tractus', 'Gradual + Zavlaka'], A: ['Allelúia', 'Aleluja'], T: ['Tractus', 'Zavlaka'], AT: ['Allelúia + Tractus', 'Aleluja + Zavlaka'],
  Sequentia: ['Sequéntia', 'Posljednica'], Evangelium: ['Evangélium', 'Evanđelje'], Offertorium: ['Antíphona ad offertórium', 'Prikazna pjesma'], Secreta: ['Secréta', 'Prikazna molitva'],
  Communio: ['Antíphona ad communiónem', 'Pričesna pjesma'], Postcommunio: ['Postcommúnio', 'Popričesna'], SuperPopulum: ['Orátio super pópulum', 'Molitva nad narodom'],
};
export const PREFACES: Record<string, [string, string]> = {
  Communis: ['Praefátio commúnis', 'Predslovlje obično'], Trinitate: ['Praefátio de sanctíssima Trinitáte', 'Predslovlje Presvetog Trojstva'], Apostolis: ['Praefátio de Apóstolis', 'Predslovlje apostola'],
  Maria: ['Praefátio de beáta María Vírgine', 'Predslovlje blažene Djevice Marije'], Nat: ['Praefátio de Nativitáte Dómini', 'Predslovlje Rođenja Gospodnjeg (božićno)'], Epi: ['Praefátio de Epiphánia Dómini', 'Predslovlje Bogojavljenja'],
  Quad: ['Praefátio de Quadragésima', 'Predslovlje korizmeno'], Joseph: ['Praefátio de sancto Joseph, sponso beátae Maríae Vírginis', 'Predslovlje svetog Josipa, zaručnika blažene Djevice Marije'],
  Quad5: ['Praefátio de Sancta Cruce', 'Predslovlje Svetog Križa'], Chrismatis: ['Praefátio ad Missam chrismátis', 'Predslovlje na misi posvete ulja'], Pasch: ['Praefátio paschális', 'Predslovlje uskrsno'],
  Asc: ['Praefátio de Ascensióne Dómini', 'Predslovlje Uzašašća Gospodnjeg'], Spiritu: ['Praefátio de Spíritu Sancto', 'Predslovlje Duha Svetoga'], Cord: ['Praefátio de Sacratíssimo Corde Iesu', 'Predslovlje Presvetog Srca Isusovog'],
  Regis: ['Praefátio de Dómino nostro Iesu Christo Rege', 'Predslovlje Gospodina našega Isusa Krista Kralja'], Defunctorum: ['Praefátio defunctórum', 'Predslovlje pokojnika'],
};
export const NOTE = {
  gloria: 'Na ovoj misi govori se Gloria', noGloria: 'Na ovoj misi NE govori se Gloria',
  credo: 'Na ovoj misi govori se Nicejsko-carigradsko vjerovanje', noCredo: 'Na ovoj misi NE govori se Nicejsko-carigradsko vjerovanje',
  superPopulum: 'Na misama ferija u vremenu korizme i muke molitva nad narodom:',
};
const COMM_LABEL: Record<string, string> = { privileged: 'spomen i na tihim i na pjevanim misama', ordinary: 'spomen na tihim misama', same: 'spomen pod istim završetkom na svim misama' };

interface Ctx { emberSat?: boolean; paschal: boolean; septuagesima: boolean; easterWeek: boolean; tid: string; feria: boolean }

function formulary(corpus: Corpus, id: string, variant?: string): Formulary | null {
  const f = corpus.formularies[id];
  if (!f) return null;
  const sections = { ...f.sections };
  for (const name of (variant ?? '').split('+')) {
    const v = name && f.variants?.[name];
    if (v) for (const [k, u] of Object.entries(v)) { if (u === null) delete sections[k]; else sections[k] = u; }
  }
  return { ...f, sections };
}

function macroLine(corpus: Corpus, name: string): Line | null {
  const key = name.replace(/\.$/, '');
  if (key === 'Gloria') return { k: 'gloriaPatri', la: 'Glória Patri, et Fílio, et Spirítui Sancto. Sicut erat in princípio, et nunc, et semper, et in sǽcula sæculórum. Amen.' };
  if (key === 'Oremus') return { k: 'oremus', la: 'Orémus.' };
  const u = corpus.ordo.prayers[key];
  if (!u) return { k: 'rubric', la: key };
  const la = u.filter(x => x.k === 'text' && x.mark !== 'R').map(x => corpus.texts[x.x!]).join(' ');
  return { k: /^(Per|Qui)/.test(key) ? 'conclusion' : 'text', la };
}

function paschalText(la: string, ctx: Ctx): string {
  // "(Allelúja, allelúja.)" or "(, allelúja)": said in Paschaltide only
  return la.replace(/\s*\(([,;:]?\s*Allel[úu][ij]a[^)]*)\)/gi, (_, a) => (ctx.paschal ? (/^[,;:]/.test(a) ? '' : ' ') + a : '')).trim();
}

function lines(corpus: Corpus, units: Unit[] | undefined, ctx: Ctx): Line[] {
  const out: Line[] = [];
  for (const u of units ?? []) {
    if (u.k === 'text') { const la = paschalText(u.x ? corpus.texts[u.x] ?? '' : u.la ?? '', ctx); if (la) out.push({ k: 'text', la, x: u.x, mark: u.mark }); }
    else if (u.k === 'ref') out.push({ k: 'ref', la: u.la! });
    else if (u.k === 'rubric' || u.k === 'head') out.push({ k: u.k === 'head' ? 'head' : 'rubric', la: u.la! });
    else if (u.k === 'macro') { const m = macroLine(corpus, u.name!); if (m) out.push(m); }
  }
  return out;
}

/** Splits a section body at paragraph separators. */
function chunks(units: Unit[] | undefined): Unit[][] {
  const out: Unit[][] = [[]];
  for (const u of units ?? []) { if (u.k === 'sep') out.push([]); else out[out.length - 1].push(u); }
  return out.filter(c => c.length);
}

const isAlleluiaStart = (s: string) => /^Allel[úu][ij]a,\s*allel[úu][ij]a/i.test(s);

function graduale(corpus: Corpus, f: Formulary, ctx: Ctx, suffix = ''): Section | null {
  let units: Unit[] | undefined;
  const ownSec = (n: string) => !!f.sections[n] && !f.from?.[n];
  const twoVerseAlleluia = (u?: Unit[]) => { const t = (u ?? []).filter(x => x.k === 'text').map(x => corpus.texts[x.x!] ?? ''); const ai = t.findIndex(x => /^Allel[úu][ij]a,\s*allel[úu][ij]a\.?$/i.test(x)); return ai > 0 && t.length - ai - 1 >= 2; };
  const startsAlleluia = (u?: Unit[]) => { const t = (u ?? []).find(x => x.k === 'text'); return !!t && /^Allel[úu][ij]a/i.test(corpus.texts[t.x!] ?? ''); };
  // ferias that repeat the Sunday Mass in Advent and after Septuagesima: gradual only, without the Alleluia or the tract
  if (ctx.feria && !suffix && f.sections.GradualeF && f.from?.Graduale) units = f.sections.GradualeF;
  // Paschaltide: the formulary's own chant if it is already an Alleluia or carries an Alleluia with two verses, else the Paschal form
  else if (ctx.paschal && !ctx.easterWeek && f.sections['GradualeP' + suffix] && !startsAlleluia(f.sections['Graduale' + suffix]) && !(ownSec('Graduale' + suffix) && twoVerseAlleluia(f.sections['Graduale' + suffix]))) units = f.sections['GradualeP' + suffix];
  else if (ctx.septuagesima && f.sections['Tractus' + suffix]) {
    units = f.sections['Tractus' + suffix];
    // a Tract printed without its gradual: the gradual of the Mass stands before it
    const g = f.sections['Graduale' + suffix] ?? []; const firstOf = (u: Unit[]) => u.find(x => x.k === 'text')?.x;
    const AL = /[.,;:]?\s*Allel[úu][ij]a,\s*allel[úu][ij]a[.,]?$/i;
    const ai = g.findIndex(x => x.k === 'text' && AL.test(corpus.texts[x.x!] ?? ''));
    if (ownSec('Tractus' + suffix) && ai > 0 && firstOf(units) !== firstOf(g) && units.filter(x => x.k === 'text').length <= 4) {
      const cut = (corpus.texts[g[ai].x!] ?? '').replace(AL, '').trim();
      units = [...g.slice(0, ai), ...(cut ? [{ k: 'text' as const, la: cut + '.', mark: g[ai].mark }] : []), ...units];
    }
  }
  else units = f.sections['Graduale' + suffix];
  if (!units || !units.length) return null;
  let ls = lines(corpus, units, ctx);
  // Paschaltide, own chant printed as gradual + Alleluia with two verses: the gradual part is dropped
  if (ctx.paschal && !ctx.easterWeek && units === f.sections['Graduale' + suffix]) {
    const ai = ls.findIndex(l => l.k === 'text' && /^Allel[úu][ij]a,\s*allel[úu][ij]a\.?$/i.test(l.la));
    if (ai > 0 && ls.slice(ai + 1).filter(l => l.k === 'text').length >= 2) ls = ls.slice(ai);
  }
  // classify the chant: gradual, alleluia, tract
  const texts = ls.filter(l => l.k === 'text');
  const firstText = ls.findIndex(l => l.k === 'text');
  const laterRef = ls.some((l, i) => i > firstText && firstText >= 0 && (l.k === 'ref' || (l.k === 'rubric' && /tract/i.test(l.la))));
  let key: string;
  if (ctx.easterWeek && texts.length > 2 && texts.slice(1).some(l => /Allel[úu][ij]a,\s*allel[úu][ij]a\.?$/i.test(l.la))) key = 'GA';
  else if (texts.length && /^Allel[úu][ij]a/i.test(texts[0].la)) key = texts.length > 3 && !ctx.paschal ? 'AT' : texts.length > 3 && ctx.tid === 'Pasc6-6' ? 'AT' : 'A';
  else if (texts.some(l => /Allel[úu][ij]a,\s*allel[úu][ij]a/i.test(l.la))) key = 'GA';
  else if (ctx.emberSat && !suffix) key = 'T';
  else if (units === f.sections['Tractus' + suffix] && texts.length > 2) key = 'GT';
  else if (texts.length <= 2) key = 'G';
  else key = laterRef || units !== f.sections['Graduale' + suffix] ? 'GT' : 'T';
  const lab = LABELS[key] ?? LABELS.G;
  return { kind: 'section', key: 'Graduale', la: lab[0], hr: lab[1], blocks: [{ lines: ls.filter(l => !(l.k === 'rubric' && /^tractus/i.test(l.la))) }] };
}

function section(corpus: Corpus, key: string, label: [string, string], units: Unit[] | undefined, ctx: Ctx): Section | null {
  if (!units || !units.length) return null;
  return { kind: 'section', key, la: label[0], hr: label[1], blocks: [{ lines: lines(corpus, units, ctx) }] };
}

function lectioLabel(corpus: Corpus, units: Unit[] | undefined): [string, string] {
  const first = (units ?? []).find(u => u.k === 'text');
  const t = first ? corpus.texts[first.x!] : '';
  return /Ep[íi]stol/i.test(t) ? LABELS.Epistola : LABELS.Lectio;
}

/** Gloria in excelsis (Code of Rubrics n. 431–432). */
export function hasGloria(day: Day, mass: MassRef, f: Formulary): boolean {
  const c = day.celebration; const tid = day.temporalId;
  if (mass.variant === 'rogation') return false;
  if (c.key === 'S:11-02') return false;
  const rule = [...(f.rule ?? []), ...(f.ruleInherited ?? [])].join('\n');
  if (c.kind === 'feast' || c.kind === 'bvmsat' || c.kind === 'octave') return true;
  if (c.kind === 'vigil') return c.key === 'T:Pasc5-3' || c.key === 'T:Pasc6-6';
  if (c.kind === 'sunday') return !(day.season === 'advent' || day.season === 'septuagesima' || day.season === 'lent' || day.season === 'passion');
  // ferias
  if (tid === 'Quad6-4') return true;
  if (day.season === 'christmas' || day.season === 'epiphany') return true;
  if (day.season === 'easter') return true;
  return /^Gloria$/m.test(rule) && false;
}

/** Creed (Code of Rubrics n. 475–476). */
export function hasCredo(day: Day, mass: MassRef, f: Formulary): boolean {
  const c = day.celebration;
  if (mass.variant === 'rogation') return false;
  if (c.key === 'S:11-02') return false;
  if (day.weekday === 0) return true;
  if (c.kind === 'sunday') return true;
  if (c.cls === 1 && c.kind === 'feast') return true;
  if (c.kind === 'octave') return true;                        // octaves of Christmas, Easter and Pentecost
  if (c.cls === 2 && c.kind === 'feast' && (c.lord || c.bvm)) return true;
  const rule = (f.rule ?? []).join('\n');
  if (c.kind === 'feast' && (c.cls <= 2 || c.key === 'S:06-11') && /^Credo$/m.test(rule)) return true;  // n. 475e
  if (day.temporalId === 'Quad6-4' && mass.id.endsWith('Quad6-4r') ) return false;
  return false;
}

/** Preface: proper (from the formulary's rule), else of the season, else of the Trinity on Sundays, else common. */
export function prefaceOf(day: Day, mass: MassRef, f: Formulary): string {
  // A preface named by the formulary's own rule; from a Common only those of Our Lady and of the Apostles (Common C1).
  // The Common of Supreme Pontiffs does not bring the preface of the Apostles (as on the old site; DECISIONS.md).
  const pick = (rules: string[] | undefined) => (rules ?? []).map(r => r.match(/^Prefatio=([A-Za-z0-9]+)/)).find(Boolean)?.[1];
  const allRules = [...(f.rule ?? []), ...(f.ruleInherited ?? [])].join('\n');
  const popeCommon = /C4b|summorum pontificum|^[OC]Pap/im.test(allRules) || /Commune\/C4b/.test(f.fallback ?? '');
  let own = pick(f.rule);
  if (own === 'Apostolis' && popeCommon) own = undefined;
  let inherited = popeCommon ? undefined : pick(f.ruleInherited);
  if (!own && !inherited && /Apostol|Evangelist/i.test(f.officium) && !/Vigilia|Cathedr|Conversion|Commemoratio/i.test(f.officium)) inherited = 'Apostolis';
  const c = day.celebration; const tid = day.temporalId; const s = day.season;
  if (c.key === 'S:11-02') return 'Defunctorum';
  let seasonal = '';
  if (s === 'christmas') seasonal = 'Nat';
  else if (s === 'epiphany') seasonal = 'Epi';
  else if (s === 'lent') seasonal = 'Quad';
  else if (s === 'passion') seasonal = 'Quad5';
  else if (s === 'easter') {
    const [w, d] = tid.replace('Pasc', '').split('-').map(Number);
    seasonal = w === 7 || (w === 6 && d === 6) ? 'Spiritu' : (w === 5 && d >= 4) || w === 6 ? 'Asc' : 'Pasch';
  }
  const feastLike = c.kind === 'feast' || c.kind === 'vigil' || c.kind === 'bvmsat' || c.kind === 'octave' || mass.id.startsWith('Sancti/');
  let proper = own && own !== 'Communis' && PREFACES[own] && (feastLike || own === 'Chrismatis') ? own : '';
  if (!proper && !own && inherited && PREFACES[inherited] && feastLike && c.kind !== 'vigil') proper = inherited;
  if (proper) return proper;
  if (seasonal) return seasonal;
  if (day.weekday === 0) return 'Trinitate';     // n. 500: Sundays without a proper or seasonal preface
  return 'Communis';
}

function commBlocks(corpus: Corpus, day: Day, massIndex: number, sec: 'Oratio' | 'Secreta' | 'Postcommunio', ctx: Ctx, main: Formulary): Block[] {
  const out: Block[] = [];
  const rogation = day.masses[massIndex]?.variant === 'rogation';
  // In the Rogation Mass the office of the day is commemorated (as on the old site); nothing else.
  if (rogation) {
    const w = day.celebration;
    if (w.kind === 'feria' && w.cls === 4) return out;
    const ls = lines(corpus, formulary(corpus, w.id, day.season === 'easter' ? '+paschal' : '')?.sections[sec], ctx).filter(l => l.k !== 'rubric');
    return [{ label: `spomen: ${w.title}`, commType: 'rogation', lines: ls }];
  }
  for (const c of day.commemorations) {
    if (c.onlyMass !== undefined && c.onlyMass !== massIndex) continue;
    let units: Unit[] | undefined;
    if (c.key.endsWith('+with')) units = main.sections['Commemoratio ' + sec];
    else {
      const f = corpus.formularies[COMM_FORMULARY[c.key] ?? c.id];
      units = f?.sections[sec];
      if (c.key === 'S:12-25m2c') units = f?.sections['Commemoratio ' + sec];
    }
    const ls = lines(corpus, units, ctx).filter(l => l.k !== 'rubric');
    out.push({ label: `${COMM_LABEL[c.type]}: ${c.title}`, commType: c.type, lines: ls });
  }
  return out;
}

// commemorations whose prayers are taken from another formulary: days within the octave of Christmas
const COMM_FORMULARY: Record<string, string> = { 'T:Nat26': 'Sancti/12-25m3', 'T:Nat27': 'Sancti/12-25m3', 'T:Nat28': 'Sancti/12-25m3', 'T:Nat29': 'Sancti/12-25m3', 'T:Nat30': 'Sancti/12-25m3', 'T:Nat31': 'Sancti/12-25m3' };
const RANK_WORD: Record<string, string> = { sunday: 'Nedjelja', feria: 'Feria', feast: 'Blagdan', vigil: 'Bdijenje', octave: 'Dan u osmini', bvmsat: 'Feria' };
const ROMAN = ['', 'I', 'II', 'III', 'IV'];

export function assembleMass(day: Day, massIndex: number, corpus: Corpus): MassView | null {
  const mass = day.masses[massIndex];
  if (!mass || mass.kind !== 'mass') return null;
  const f = formulary(corpus, mass.id, (mass.variant === 'brevior' ? 'brevior' : '') + (day.season === 'easter' ? '+paschal' : ''));
  if (!f) return null;
  const tid = day.temporalId;
  const ctx: Ctx = {
    tid, feria: day.celebration.kind === 'feria', emberSat: !!day.flags.ember && day.weekday === 6 && day.celebration.key.startsWith('T:') && (day.season !== 'easter' || mass.variant !== 'brevior'), paschal: day.season === 'easter', easterWeek: /^Pasc0-[0-5]$/.test(tid),
    septuagesima: day.season === 'septuagesima' || day.season === 'lent' || day.season === 'passion',
  };
  const items: Item[] = [];
  const add = (s: Section | null) => { if (s) items.push(s); return s; };
  const gloria = hasGloria(day, mass, f), credo = hasCredo(day, mass, f);
  const pref = prefaceOf(day, mass, f);

  const intro = add(section(corpus, 'Introitus', LABELS.Introitus, f.sections.Introitus, ctx));
  // Paschaltide: two Alleluias are added to the Introit antiphon when the formulary has none (Rubricae generales Missalis)
  if (intro) { const ls = intro.blocks[0].lines; const gi = ls.findIndex(l => l.k === 'gloriaPatri'); const ant = ls.find(l => l.k === 'text');
    if (gi >= 0 && ant && !ls.slice(gi + 1).some(l => l.k === 'text')) ls.push({ ...ant }); }   // the antiphon is repeated after the Gloria Patri
  if (intro && ctx.paschal) { const ts = intro.blocks[0].lines.filter(l => l.k === 'text'); if (ts.length >= 2 && !/allel[úu][ij]a/i.test(ts[0].la)) { const ant = ts[0].la; for (const l of [ts[0], ts[ts.length - 1]]) if (l.la === ant) l.la = ant.replace(/[.:;,]?$/, ', allelúja, allelúja.'); } }
  // Ember days and some ferias: a first prayer, then lessons each followed by a chant and a prayer; the last prayer is the
  // collect, said after the Gloria note and followed by the commemorations.
  let nExtra = 0; while (f.sections['LectioL' + (nExtra + 1)]) nExtra++;
  const gloriaNote: Item = { kind: 'note', key: 'gloria', text: gloria ? NOTE.gloria : NOTE.noGloria };
  let oratio: Section | null;
  if (nExtra) {
    const shown = mass.variant === 'brevior' ? 1 : nExtra;
    add(section(corpus, 'Oratio', LABELS.Oratio, f.sections.Oratio, ctx));
    for (let i = 1; i <= shown; i++) {
      // a canticle printed after the lesson (Benedictus es on Ember Saturdays) stands as the chant
      const lu = f.sections['LectioL' + i]; const cut = lu.findIndex((u, k) => u.k === 'sep' && lu[k + 1]?.k === 'rubric' && /hymnus/i.test(lu[k + 1].la ?? ''));
      add(section(corpus, 'Lectio', lectioLabel(corpus, lu), cut >= 0 ? lu.slice(0, cut) : lu, ctx));
      if (cut >= 0) add(section(corpus, 'Graduale', LABELS.G, lu.slice(cut + 2), ctx)); else add(graduale(corpus, f, ctx, 'L' + i));
      if (i < shown) add(section(corpus, 'Oratio', LABELS.Oratio, f.sections['OratioL' + i], ctx));
    }
    items.push(gloriaNote);
    oratio = add(section(corpus, 'Oratio', LABELS.Oratio, f.sections['OratioL' + shown], ctx));   // n. 468: in the shorter form, the second prayer
  } else {
    items.push(gloriaNote);
    oratio = add(section(corpus, 'Oratio', LABELS.Oratio, f.sections.Oratio, ctx));
  }
  if (oratio) oratio.blocks.push(...commBlocks(corpus, day, massIndex, 'Oratio', ctx, f));
  add(section(corpus, 'Lectio', nExtra || day.flags.ember ? lectioLabel(corpus, f.sections.Lectio) : LABELS.Epistola, f.sections.Lectio, ctx));
  add(graduale(corpus, f, ctx));
  add(section(corpus, 'Sequentia', LABELS.Sequentia, f.sections.Sequentia, ctx));
  add(section(corpus, 'Evangelium', LABELS.Evangelium, f.sections.Evangelium, ctx));
  items.push({ kind: 'note', key: 'credo', text: credo ? NOTE.credo : NOTE.noCredo });
  add(section(corpus, 'Offertorium', LABELS.Offertorium, f.sections.Offertorium, ctx));
  const secreta = add(section(corpus, 'Secreta', LABELS.Secreta, f.sections.Secreta, ctx));
  if (secreta) secreta.blocks.push(...commBlocks(corpus, day, massIndex, 'Secreta', ctx, f));
  const pu = f.sections.Prefatio ?? corpus.ordo.prefaces[pref] ?? corpus.ordo.prefaces.Communis;
  const plab = PREFACES[pref] ?? PREFACES.Communis;
  const prefSec = add(section(corpus, 'Prefatio', plab, pu.filter(u => u.k !== 'rubric'), ctx));
  // variable words of the prefaces: the mystery named in the preface of Our Lady, "die" in the Easter octave, "hodierna die" at Pentecost
  if (prefSec) for (const l of prefSec.blocks[0].lines) {
    if (pref === 'Maria') { const mv = [...(f.rule ?? []), ...(f.ruleInherited ?? [])].map(r => r.match(/^Prefatio=Maria=([^;]+)/)).find(Boolean)?.[1]; l.la = l.la.replace(/\*Festivitáte\*/, mv ? mv.trim().replace(/^./, ch => ch.toUpperCase()) : 'Festivitáte'); }
    if (pref === 'Pasch' && /^Pasc0-/.test(tid)) l.la = l.la.replace('in hoc potíssimum', 'in hac potíssimum die');
    if (pref === 'Spiritu') l.la = l.la.replace(/\s*\* \*\s*/, /^Pasc(6-6|7-)/.test(tid) ? ' (hodiérna die) ' : ' ');
  }
  add(section(corpus, 'Communio', LABELS.Communio, f.sections.Communio, ctx));
  const post = add(section(corpus, 'Postcommunio', LABELS.Postcommunio, f.sections.Postcommunio, ctx));
  if (post) post.blocks.push(...commBlocks(corpus, day, massIndex, 'Postcommunio', ctx, f));
  if (f.sections['Super populum'] && day.celebration.kind === 'feria') {
    items.push({ kind: 'note', key: 'superPopulum', text: NOTE.superPopulum });
    add(section(corpus, 'SuperPopulum', LABELS.SuperPopulum, f.sections['Super populum'], ctx));
  }
  const c = day.celebration;
  const rankWord = c.key === 'S:11-02' ? 'Dan' : c.key === 'T:Pasc0-0' || c.key === 'T:Pasc7-0' ? 'Blagdan' : RANK_WORD[c.kind] ?? 'Dan';
  const rankLine = `${rankWord} ${ROMAN[day.cls]}. razreda`;
  return { id: `${day.date}_${massIndex}`, formulary: mass.id, label: mass.label, title: c.title, rankLine, colour: day.colour, subnotes: [], items, gloria, credo, preface: pref };
}
