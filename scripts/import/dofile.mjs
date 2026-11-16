// Reader for Divinum Officium data files (data only; this is an independent implementation of the documented
// file format: [Section] headers with optional conditions, conditional lines, and @-inclusions).
// Everything is evaluated for the version "Rubrics 1960 - 1960" in the context of the Mass.
import fs from 'node:fs';
import path from 'node:path';

export const DO_ROOT = 'data/raw/do/repo/web/www/missa/Latin';
const VERSION = 'Rubrics 1960 - 1960';
const SCOPE_NULL = 0, SCOPE_LINE = 1, SCOPE_CHUNK = 2, SCOPE_NEST = 3;
const WEIGHT = { sed: 1, vero: 1, atque: 2, attamen: 3, si: 0, deinde: 1 };
const BACKSCOPED = new Set(['sed', 'vero', 'atque', 'attamen']);
const SCOPE_RE = '(?:\\bloco\\s+(?:hu[ij]us\\s+versus|horum\\s+versuum)\\b)?\\s*(?:\\b(?:(?:dicitur|dicuntur)(?:\\s+semper)?|(?:hic\\s+versus\\s+)?omittitur|(?:hoc\\s+versus\\s+)?omittitur|(?:h[æa]e?c\\s+versus\\s+)?omittuntur|(?:hi\\s+versus\\s+)?omittuntur)\\b)?';
const COND_RE = new RegExp('^\\s*\\(\\s*((?:(?:sed|vero|atque|attamen|si|deinde)\\b\\s*)*)(.*?)(' + SCOPE_RE + ')\\s*\\)\\s*(.*)$', 'i');
const BLANK = /^\s*_?\s*$/;

const PRED = {
  tridentina: v => /Trident/.test(v), monastica: v => /Monastic/.test(v), innovata: v => /2020 USA|NewCal/i.test(v), innovatis: v => /2020 USA|NewCal/i.test(v),
  'summorum pontificum': v => /194[2-9]|195[45]|196/.test(v), longior: v => v == 1, brevior: v => v == 2,
  prima: v => v == 1, secunda: v => v == 2, tertia: v => v == 3,
};
const SUBJECTS = new Set(['rubricis', 'rubrica', 'tempore', 'missa', 'communi', 'die', 'feria', 'commune', 'votiva', 'officio', 'ad', 'mense', 'anno', 'dioecesis']);

// ctx: { missa: 1|2|3, tempus: string, die: string, feria: number }
export function vero(condition, ctx = {}) {
  condition = condition.trim();
  if (!condition) return true;
  const subj = s => ({ rubrica: VERSION, rubricis: VERSION, communi: VERSION, missa: ctx.missa ?? 1, tempore: ctx.tempus ?? '', die: ctx.die ?? '', feria: ctx.feria ?? '', ad: 'missam', commune: ctx.commune ?? '', votiva: '', officio: '', mense: ctx.mense ?? '', anno: ctx.anno ?? 'communi', dioecesis: '' })[s];
  outer: for (const alt of condition.split(/\baut\b/)) {
    let neg = false;
    for (const part of alt.split(/\b(et|nisi)\b/)) {
      if (part === 'nisi') { neg = true; continue; }
      if (part === 'et') continue;
      const t = part.trim().replace(/\s+/g, ' ');
      if (!t) continue;
      let [subject, ...rest] = t.split(' ');
      let predicate = rest.join(' ');
      if (!predicate) { predicate = subject; subject = ''; }
      if (subject && !SUBJECTS.has(subject.toLowerCase())) { predicate = subject + ' ' + predicate; subject = ''; }
      subject = (subject || 'tempore').toLowerCase();
      const val = subj(subject);
      const fn = PRED[predicate.toLowerCase()] || (v => new RegExp(predicate, 'i').test(String(v)));
      if (!(fn(val) !== neg)) continue outer;
    }
    return true;
  }
  return false;
}

function parseConditional(stopwords, condition, scope, ctx) {
  const words = stopwords.toLowerCase().split(/\s+/).filter(Boolean);
  const strength = words.reduce((a, w) => a + (WEIGHT[w] || 0), 0);
  const result = vero(condition, ctx);
  const implicit = words.some(w => BACKSCOPED.has(w));
  const backscope = /versuum|omittuntur/i.test(scope) ? SCOPE_NEST : /versus|omittitur/i.test(scope) ? SCOPE_CHUNK : (!/semper/i.test(scope) && implicit) ? SCOPE_LINE : SCOPE_NULL;
  let forwardscope;
  if (/omittitur|omittuntur/i.test(scope)) forwardscope = SCOPE_NULL;
  else if (/dicuntur/i.test(scope)) forwardscope = backscope === SCOPE_CHUNK ? SCOPE_CHUNK : SCOPE_NEST;
  else forwardscope = (backscope === SCOPE_CHUNK || backscope === SCOPE_NEST) ? SCOPE_CHUNK : SCOPE_LINE;
  return { strength, result, backscope, forwardscope };
}

export function processConditionalLines(lines, ctx) {
  const output = [];
  const AFF = 1, NOT = 0, DUMMY = 2;
  let stack = [[AFF, SCOPE_NEST]];
  const offsets = [-1];
  for (let line of lines) {
    const m = line.match(COND_RE);
    // Only treat as a conditional when the parenthesis holds a recognisable condition (a stopword, a subject or a scope).
    if (m && isCondition(m)) {
      let { strength, result, backscope, forwardscope } = parseConditional(m[1] || '', m[2], m[3] || '', ctx);
      line = m[4];
      const top = stack[stack.length - 1];
      if (top[0] === AFF || strength >= offsets.length - 1) {
        if (strength >= offsets.length - 1) stack = [];
        else if (strength >= (offsets.length - 1) - (stack.length - 1)) stack.length = Math.max(0, (offsets.length - 1) - strength);
        if (result) {
          const fence = offsets.length - 1 >= strength ? offsets[strength] : -1;
          if (backscope === SCOPE_LINE) { if (output.length - 1 > fence) output.pop(); }
          else if (backscope === SCOPE_CHUNK) {
            while (output.length - 1 > fence && !BLANK.test(output[output.length - 1])) output.pop();
            while (output.length - 1 > fence && BLANK.test(output[output.length - 1])) output.pop();
          } else if (backscope === SCOPE_NEST) output.length = fence + 1;
        }
        if (forwardscope === SCOPE_NULL) { forwardscope = SCOPE_NEST; result = true; }
        if (result) for (let i = 0; i <= strength; i++) offsets[i] = output.length - 1;
        while (strength < (offsets.length - 1) - (stack.length - 1) - 1) stack.push([DUMMY, forwardscope]);
        stack.push([result ? AFF : NOT, forwardscope]);
      }
      if (!line) continue;
    }
    line = line.replace(/^~/, '');
    if (stack[stack.length - 1][0] === AFF) output.push(line);
    while (stack[stack.length - 1][1] === SCOPE_LINE || (stack[stack.length - 1][1] === SCOPE_CHUNK && BLANK.test(line))) {
      do { stack.pop(); } while (stack.length && stack[stack.length - 1][0] === DUMMY);
      if (!stack.length) stack.push([AFF, SCOPE_NEST]);
    }
  }
  return output;
}
function isCondition(m) {
  if (m[1] && m[1].trim()) return true;
  if (m[3] && m[3].trim()) return true;
  const first = m[2].trim().split(/\s+/)[0]?.toLowerCase();
  return SUBJECTS.has(first) || first === 'nisi';
}

const cache = new Map();
const SECTION_RE = /^\s*\[([\p{L}\p{N}_ #,:-]+)\](?:\s*\(\s*((?:(?:sed|vero|atque|attamen|si|deinde)\b\s*)*)(.*?)\s*\))?/iu;

/** Raw parse of one file: { preamble: string[], sections: {name: string[]} } with conditionals applied. */
export function parseFile(rel, ctx = {}, root = DO_ROOT) {
  const key = rel + '|' + JSON.stringify(ctx) + '|' + root;
  if (cache.has(key)) return cache.get(key);
  let full = path.join(root, rel + '.txt');
  // the Commons of Apostles (C1…) are shared with the Office and live under horas/ in this snapshot
  if (!fs.existsSync(full) && /^Commune\//.test(rel)) full = path.join(root.replace('/missa/', '/horas/'), rel + '.txt');
  if (!fs.existsSync(full)) { cache.set(key, null); return null; }
  const lines = fs.readFileSync(full, 'utf8').replace(/^﻿/, '').split(/\r?\n/);
  const sections = {}; const order = []; const conditional = new Set();
  let keyName = '__preamble', use = true;
  sections[keyName] = [];
  for (const line of lines) {
    const m = line[0] === '[' && line.match(SECTION_RE);
    if (m) {
      const cond = m[3];
      // "[Name] (condition dicitur)": the scoped condition belongs to the first lines of the body, not to the section
      if (m[3] && /\b(dicitur|dicuntur|omittitur|omittuntur)\b/.test(m[3])) { use = true; keyName = m[1]; sections[keyName] = ['(' + (m[2] || '') + m[3] + ')']; if (!order.includes(keyName)) order.push(keyName); continue; }
      // a section whose condition holds wins over the unconditional section of the same name, whichever comes first
      if (!cond && conditional.has(m[1])) use = false;
      else if (!cond || vero(cond.replace(/^non\s+/, 'nisi '), ctx) ) { use = true; keyName = m[1]; sections[keyName] = []; if (cond) conditional.add(keyName); if (!order.includes(keyName)) order.push(keyName); }
      else use = false;
    } else if (use) sections[keyName].push(line);
  }
  const out = { preamble: [], sections: {}, order };
  for (const k of Object.keys(sections)) {
    const body = processConditionalLines(sections[k], ctx);
    while (body.length && !body[body.length - 1].trim()) body.pop();
    if (k === '__preamble') out.preamble = body.filter(l => l.trim()); else out.sections[k] = body;
  }
  cache.set(key, out);
  return out;
}

const INCL_RE = /^@([^:\s]*)(?::([^:]*?))?(?::(.*))?\s*$/;

function applySubs(lines, subs) {
  let text = lines.join('\n') + '\n';
  const re = /(?:s\/((?:[^\/\\]|\\.)*)\/((?:[^\/\\]|\\.)*)\/([gism]*))|(?:(!?)(\d+)(?:-(\d+))?)/g;
  let m;
  while ((m = re.exec(subs))) {
    if (m[5]) {
      const s = +m[5] - 1, l = m[6] ? +m[6] - s : 1;
      const t1 = text.split('\n'); if (t1[t1.length - 1] === '') t1.pop();
      const t2 = t1.splice(s, l);
      text = (m[4] ? t1 : t2).join('\n') + '\n';
    } else {
      let flags = m[3] || ''; 
      try { text = text.replace(new RegExp(m[1], flags.replace(/[^gism]/g, '')), m[2].replace(/\\n/g, '\n').replace(/\$(\d)/g, '$$$1')); } catch (e) { /* unsupported pattern: leave text unchanged */ }
    }
  }
  const out = text.split('\n'); while (out.length && out[out.length - 1] === '') out.pop();
  return out;
}

/** Section of a file with all @-inclusions resolved (recursively). Returns string[] or null. */
export function getSection(rel, name, ctx = {}, depth = 0, seen = []) {
  if (depth > 12) return null;
  const f = parseFile(rel, ctx);
  if (!f) return null;
  let body = f.sections[name];
  if (body === undefined) {
    // whole-file inclusion in the preamble: "@Commune/C4a" or "@Sancti/01-01:..."
    for (const p of f.preamble) {
      const m = p.match(INCL_RE);
      if (m && m[1] && !m[2]) { const r = getSection(m[1], name, ctx, depth + 1, seen); if (r) return m[3] ? applySubs(r, m[3]) : r; }
    }
    return null;
  }
  const out = [];
  for (const line of body) {
    const m = line[0] === '@' && line.match(INCL_RE);
    if (m) {
      const file = m[1] || rel, sec = m[2] || name;
      if (sec === 'Munda Cor Passionis') continue;   // the priest's preparation before the Passion: Ordinary, not Proper
      const id = file + ':' + sec;
      if (seen.includes(id) && file === rel && sec === name) { out.push(`[missing ${id}]`); continue; }
      let r = getSection(file, sec, ctx, depth + 1, [...seen, rel + ':' + name]);
      if (!r) { out.push(`[missing ${id}]`); continue; }
      if (m[3]) r = applySubs(r, m[3]);
      // A chant borrowed from a Paschaltide Mass by a Mass outside Paschaltide: its alleluias are said in Paschaltide only.
      else if ((/^Tempora\/Pasc/.test(file) && !/^Tempora\/Pasc/.test(rel)) || (/^Commune\/C.*p$/.test(file) && !/^Commune\/C.*p$/.test(rel) && !/Pasc/.test(rel))) r = r.map(l => /^[!$&@]/.test(l) ? l : l.replace(/([,;:]?\s*allel[úu][ij]a)+(?=[\s.,;:]|$)/gi, x => '(' + x + ')'));
      out.push(...r);
    } else out.push(line);
  }
  return out;
}

export function sectionNames(rel, ctx = {}, depth = 0) {
  const f = parseFile(rel, ctx);
  if (!f || depth > 6) return [];
  const names = new Set(Object.keys(f.sections));
  for (const p of f.preamble) { const m = p.match(INCL_RE); if (m && m[1] && !m[2]) for (const n of sectionNames(m[1], ctx, depth + 1)) names.add(n); }
  return [...names];
}
