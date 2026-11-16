// Turns Divinum Officium Mass files into this project's clean format: sections as lists of typed units.
// Unit kinds: ref (scripture reference), text, rubric, macro (Gloria Patri, conclusions), sep (paragraph break), head.
import { getSection, parseFile, sectionNames } from './dofile.mjs';

const OFFICE_ONLY = /^(Ant|Lectio\d|Responsory|Hymnus|Versum|Capitulum|Invit|Oratio\d|Ant Matutinum|Nocturn|Lectio Prima|Day\d|Commemoratio\d|Special|Popup|HymnusM|Oratio Matutinum|Ant Vespera|Ant Laudes|Ant Prima|Lectio94|Psalm|Minor|Legend|Missa$|Te Deum|Hymnus|MM LB)/;
export const MASS_SECTIONS = ['Introitus', 'Oratio', 'Lectio', 'Graduale', 'GradualeP', 'GradualeF', 'Tractus', 'Sequentia', 'Evangelium', 'Offertorium', 'Secreta', 'Communio', 'Postcommunio', 'Super populum',
  'Commemoratio Oratio', 'Commemoratio Secreta', 'Commemoratio Postcommunio', 'Prefatio', 'Munda Cor Passionis', 'Maundi', 'Post Missam'];

function firstLine(lines) { return (lines || []).map(l => l.trim()).filter(Boolean)[0] || ''; }

/** Where a file sends us for sections it does not have: the 4th field of [Rank] ("vide C4a", "ex Sancti/12-25m3") or a [Rule] line. */
export function fallbackOf(file, ctx = {}) {
  const f = parseFile(file, ctx); if (!f) return null;
  const cands = [];
  const rank = firstLine(f.sections.Rank).split(';;')[3];
  if (rank) cands.push(rank);
  for (const l of f.sections.Rule || []) cands.push(l);
  for (const c of cands) {
    const m = c.trim().match(/^(?:ex|vide)\s+([A-Za-z0-9\/-]+)/);
    if (!m) continue;
    let t = m[1];
    if (!t.includes('/')) t = (/^C\d/.test(t) ? 'Commune/' : file.split('/')[0] + '/') + t;
    if (parseFile(t, ctx)) return t;
    if (parseFile('Tempora/' + m[1], ctx)) return 'Tempora/' + m[1];
  }
  // a feria of the temporal cycle without texts of its own takes the Mass of the preceding Sunday
  const m = file.match(/^Tempora\/(.+)-([1-6])(Feria)?$/);
  if (m) { for (const s of [m[1] + '-0r', m[1] + '-0']) if (parseFile('Tempora/' + s, ctx) && SUNDAY_OK(m[1], s)) return 'Tempora/' + s; }
  return null;
}
// Weeks whose Sunday Mass is not the Mass repeated on the ferias (the ferias take the "a" Sunday Mass instead).
const SUNDAY_OK = (stem, s) => true;

export function sectionWithFallback(file, name, ctx = {}, depth = 0, trail = []) {
  if (depth > 6) return null;
  const own = getSection(file, name, ctx);
  if (own && own.some(l => l.trim())) return { lines: own, from: file, trail };
  const fb = fallbackOf(file, ctx);
  if (!fb || trail.includes(fb)) return null;
  return sectionWithFallback(fb, name, ctx, depth + 1, [...trail, file]);
}

/** [Name] of a proper file: default form and per-section overrides, used to fill "N." in texts taken from a Common. */
function names(file, ctx) {
  const lines = (getSection(file, 'Name', ctx) || []).map(l => l.trim()).filter(Boolean);
  const out = { default: null };
  for (const l of lines) { const m = l.match(/^([A-Za-z ]+)=(.*)$/); if (m) out[m[1].trim()] = m[2].trim(); else if (out.default === null) out.default = l; }
  return out;
}

const REF_LINE = /\d/;
export function toUnits(lines) {
  const units = [];
  let cont = false;
  for (let raw of lines) {
    let line = raw.replace(/\s+$/, '');
    const joinNext = line.endsWith('~');
    if (joinNext) line = line.slice(0, -1);
    const t = line.trim();
    if (cont && units.length && units[units.length - 1].k === 'text') { units[units.length - 1].la += ' ' + t; cont = joinNext; continue; }
    cont = joinNext;
    if (t === '' || t === '_') { if (units.length && units[units.length - 1].k !== 'sep') units.push({ k: 'sep' }); continue; }
    if (t === '!') continue;
    if (t.startsWith('!!')) { units.push({ k: 'head', la: t.slice(2).trim() }); continue; }
    if (t.startsWith('!')) { const x = t.slice(1).trim(); units.push(REF_LINE.test(x) && x.length < 80 && !/^(Pro|Commemoratio|Deinde|Post|In |Si |Et |Hic |Ad )/.test(x) ? { k: 'ref', la: x.replace(/\.$/, '') } : { k: 'rubric', la: x }); continue; }
    if (t.startsWith('#')) { units.push({ k: 'head', la: t.replace(/^#+\s*/, '') }); continue; }
    if (t.startsWith('$') || t.startsWith('&')) { units.push({ k: 'macro', name: t.slice(1).replace(/\.$/, '').trim() }); continue; }
    if (/^\[missing /.test(t)) { units.push({ k: 'missing', la: t }); continue; }
    let m;
    if ((m = t.match(/^([VRvr])\.\s+(.*)$/))) { units.push({ k: 'text', la: m[2], mark: m[1] === 'v' || m[1] === 'r' ? undefined : m[1] }); continue; }
    if ((m = t.match(/^(M|S|D|C|J)\.\s+(.*)$/))) { units.push({ k: 'text', la: m[2], mark: m[1] }); continue; }
    units.push({ k: 'text', la: t });
  }
  while (units.length && units[units.length - 1].k === 'sep') units.pop();
  // tidy DO markup inside text: "++" (sign of the cross in Gospel titles), "+" marks, double spaces
  for (const u of units) if (u.la) u.la = u.la.replace(/\s*\+\+\s*/g, ' ✠ ').replace(/\s+/g, ' ').trim();
  return units;
}

export function importFormulary(file, ctx = {}) {
  const f = parseFile(file, ctx);
  if (!f) return null;
  const out = { id: file, officium: firstLine(getSection(file, 'Officium', ctx)), rank: firstLine(getSection(file, 'Rank', ctx)), rule: [], fallback: fallbackOf(file, ctx), sections: {}, from: {} };
  const rule = sectionWithFallback(file, 'Rule', ctx);
  out.rule = (getSection(file, 'Rule', ctx) || []).map(l => l.trim()).filter(Boolean);
  out.ruleInherited = rule && rule.from !== file ? rule.lines.map(l => l.trim()).filter(Boolean) : undefined;
  const nm = names(file, ctx);
  const wanted = new Set(MASS_SECTIONS);
  for (const n of sectionNames(file, ctx)) if (!OFFICE_ONLY.test(n) && !['Officium', 'Rank', 'Rule', 'Name', 'Comment'].includes(n)) wanted.add(n);
  // numbered lessons of Ember days etc. may live in the fallback
  for (const n of [...wanted]) {
    const r = sectionWithFallback(file, n, ctx);
    if (!r) continue;
    let lines = r.lines;
    if (r.from !== file && nm.default !== null) { const v = nm[n] ?? nm.default; lines = lines.map(l => l.replace(/\bN\.(?=\s|,|:|;|$)/g, v)); }
    out.sections[n] = toUnits(lines);
    if (r.from !== file) out.from[n] = r.from;
  }
  return out;
}
