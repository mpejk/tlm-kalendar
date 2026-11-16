// Rites outside the Mass formulary files: ready bilingual documents.
//   from the old site (both languages): blessing of palms, Good Friday, the washing of the feet;
//   from the Divinum Officium [Prelude] sections (Latin; Croatian where the old site has the same unit): Candlemas, ashes, Easter Vigil.
import fs from 'node:fs';
import path from 'node:path';
import { Corpus, Unit } from '../../src/assembler/types';
import { normLa } from '../../src/assembler/norm';
import { fileOf } from './data';
import YAML from 'yaml';
import { NOTE } from '../../src/assembler/assemble';
import { insertNameHr } from '../croatian/names';
import { NameForms } from '../../src/engine/types';

const golden = (f: string) => JSON.parse(fs.readFileSync(`data/golden/masses/${f}.json`, 'utf8'));
const fromGolden = (items: any[]) => items.filter(it => !it.hidden).map(it => (it.kind === 'note' ? { kind: 'note', text: it.text } : { kind: 'section', la: it.la, hr: it.hr, rows: it.rows.map((r: any) => (r.la === undefined ? { text: r.text ?? '' } : { la: r.la, hr: r.hr, ...(r.head ? { head: true } : {}) })) }));

export function buildRites(dist: string, corpus: Corpus, fix?: { edit(hr: string, fid: string, section?: string): string }, pope?: NameForms): { id: string; rows: number; withCroatian: number }[] {
  const out: Record<string, any> = {}; const report: { id: string; rows: number; withCroatian: number }[] = [];
  const palms = golden('2018/actions_20180325_0'), friday = golden('2018/actions_20180330_0'), thursday = golden('2018/propers_20180329_1');
  out['Tempora/Quad6-0r:palms'] = { rite: true, source: 'tradicionalnamisa.com', title: 'Blagoslov grančica i procesija', items: fromGolden(palms.items) };
  out['Tempora/Quad6-5r'] = { rite: true, source: 'tradicionalnamisa.com', title: 'Svečana popodnevna liturgijska služba Muke i Smrti Gospodnje', items: fromGolden(friday.items) };
  const a = thursday.items.findIndex((it: any) => it.kind === 'note' && /pranje nogu/.test(it.text)), b = thursday.items.findIndex((it: any) => it.kind === 'note' && /^Zatim se nastavlja/.test(it.text));
  if (a >= 0 && b > a) out['Tempora/Quad6-4rm2:mandatum'] = { rite: true, source: 'tradicionalnamisa.com', title: 'Pranje nogu', items: fromGolden(thursday.items.slice(a, b + 1)) };

  const tm = JSON.parse(fs.readFileSync('data/tm/tm.json', 'utf8')) as Record<string, { hr: string }>;
  // Latin corrections inside rites (logged in data/corpus/la/OVERRIDES.md): [damaged text in the DO file, text of the same passage in another DO file]
  const RITE_FIXES: [string, string][] = [
    // Gen 1, 25 in Tempora/Quad6-6r lost a line (fecit ... vidit); restored from the same lesson in Tempora/Quad6-6
    ['Et fecit Deus quod esset bonum, et ait:', 'Et fecit Deus béstias terræ juxta spécies suas, et juménta, et omne réptile terræ in génere suo. Et vidit Deus quod esset bonum, et ait:'],
  ];
  const text = (u: Unit) => { let t = u.x ? corpus.texts[u.x] ?? '' : u.la ?? ''; for (const [a, b] of RITE_FIXES) if (t.includes(a)) t = t.replace(a, b); return t; };
  const prelude = (id: string, title: string, sectionName = 'Prelude') => {
    const units = corpus.formularies[id]?.sections[sectionName]; if (!units) return;
    const items: any[] = []; let sec: any = null; let chunk: Unit[] = []; let rows = 0, withHr = 0;
    const flush = () => {
      if (!chunk.length) return;
      const la: string[] = [], hr: string[] = []; let texts = 0, found = 0;
      for (const u of chunk) {
        if (u.k === 'rubric') { la.push(`[${u.la!.replace(/ ! /g, ' ')}]`); continue; }
        if (u.k === 'ref') { la.push(u.la!); continue; }
        if (u.k === 'macro') { const m = u.name === 'Gloria' ? '<i>Glória Patri, et Fílio, et Spirítui Sancto. Sicut erat in princípio, et nunc, et semper, et in sǽcula sæculórum. Amen</i>.' : /Dominus ?Vobiscum/i.test(u.name ?? '') ? '℣. Dóminus vobíscum. ℟. Et cum spíritu tuo.' : ''; if (m) la.push(m); continue; }
        if (u.k !== 'text') continue;
        const t = text(u); if (/^_`?$/.test(t.trim())) continue; /* DO separator mark */ la.push((u.mark === 'V' ? '℣. ' : u.mark === 'R' ? '℟. ' : '') + t); texts++;
        const e = tm[normLa(t)]; if (e) { hr.push(e.hr.replace(/<[^>]+>/g, '')); found++; }
      }
      if (la.length) { if (!sec) { sec = { kind: 'section', la: title, hr: '', rows: [] }; items.push(sec); }
        const all = texts > 0 && found === texts; sec.rows.push({ la: la.join('\n'), hr: texts === 0 ? ' ' : all ? hr.join('\n') : '' }); if (texts) { rows++; if (all) withHr++; } }
      chunk = [];
    };
    for (const u of units) {
      if (u.k === 'head') { flush(); sec = { kind: 'section', la: u.la, hr: '', rows: [] }; items.push(sec); }
      else if (u.k === 'sep') flush(); else chunk.push(u);
    }
    flush();
    out[`${id}:${sectionName}`] = { rite: true, source: 'Divinum Officium', title, items };
    report.push({ id: `${id}:${sectionName}`, rows, withCroatian: withHr });
  };
  prelude('Sancti/02-02', 'Blagoslov svijeća i procesija');
  prelude('Tempora/Quadp3-3', 'Blagoslov i dijeljenje pepela');
  prelude('Tempora/Quad6-6r', 'Vazmeno bdijenje');
  // ---- Easter Vigil: the Mass after the Kyrie (data/corpus/la/vigil-mass.json, made by scripts/import/vigil-mass.ts)
  const vigil = out['Tempora/Quad6-6r:Prelude'];
  if (vigil && fs.existsSync('data/corpus/la/vigil-mass.json')) {
    const vm = JSON.parse(fs.readFileSync('data/corpus/la/vigil-mass.json', 'utf8')) as { sections: { la: string; hr: string; rows: any[] }[] };
    const T = (u: Unit) => (u.x ? corpus.texts[u.x] ?? '' : u.la ?? '');
    const concl = (name: string) => (corpus.ordo.prayers[name] ?? []).filter(u => u.k === 'text' && u.mark !== 'R').map(T).join(' ');
    for (const sec of vm.sections) {
      const rows: any[] = [];
      for (const r of sec.rows) {
        if (r.note) { rows.push({ text: r.note === 'gloria' ? NOTE.gloria : NOTE.noCredo }); continue; }
        let la: string = r.la ?? '';
        if (r.preface) la = (corpus.ordo.prefaces[r.preface] ?? []).filter(u => u.k === 'text').map(T).filter(t => !/^Paschalis$/.test(t)).join(' ').replace('in hoc potíssimum', 'in hac potíssimum nocte');   // Missal 1962, p. 288: in Missa Vigiliae paschalis dicitur «in hac potissimum nocte»
        if (r.concl) la += '\n<i>' + concl(r.concl).replace(/\.$/, '') + '</i>.';
        rows.push(r.key ? { la, hr: '', key: r.key } : { la, hr: ' ' });
      }
      // a group that holds only a rubric and a note (the Gloria) joins the section before it
      if (!rows.some(r => r.key)) vigil.items[vigil.items.length - 1].rows.push(...rows); else vigil.items.push({ kind: 'section', la: sec.la, hr: sec.hr, rows });
    }
  }
  // ---- Exsultet: its last paragraph (1955) has no Croatian in Kniewald 1942, whose text ends with the older wording; the
  //      paragraph stands as a row of its own so that the rest keeps its translation (review finding H01)
  const kn = fs.existsSync('data/tm/kniewald-rites.json') ? JSON.parse(fs.readFileSync('data/tm/kniewald-rites.json', 'utf8')) as Record<string, { hr: string; ref: string }> : {};
  const manual = (fs.existsSync('data/tm/rites-hr.yaml') ? YAML.parse(fs.readFileSync('data/tm/rites-hr.yaml', 'utf8')) ?? {} : {}) as Record<string, { hr: string; source?: string }>;
  const riteGaps: any[] = [];
  for (const [id, doc] of Object.entries<any>(out)) { if (doc.source !== 'Divinum Officium') continue; doc.items.forEach((it: any, si: number) => (it.rows ?? []).forEach((r: any, ri: number) => { if (r.la === undefined || r.hr) return; const key = r.key ?? `${id}#${si}.${ri}`; if (manual[key]?.hr) { r.hr = manual[key].hr; r.src = manual[key].source; } else if (kn[key]) { r.hr = kn[key].hr.split('\n').filter((l: string) => !/^_`?$/.test(l.trim())).join('\n'); r.src = kn[key].ref; } else riteGaps.push({ key, section: it.la, la: r.la }); })); }
  // H01: split the closing row of the Exsultet
  if (vigil) for (const it of vigil.items) { const ri = (it.rows ?? []).findIndex((r: any) => typeof r.la === 'string' && r.la.includes('Réspice étiam ad eos, qui nos in potestáte regunt'));
    if (ri < 0) continue; const r = it.rows[ri]; const a = r.la.indexOf('Réspice étiam'), b = r.la.indexOf('Per eúndem Dóminum'); const h = (r.hr ?? '').indexOf(', po istom Gospodinu');
    if (a < 0 || b < a || h < 0) throw new Error('Exsultet: the closing row cannot be split');
    const key = 'vigil:exsultet-respice'; const mid: any = { la: r.la.slice(a, b).trim(), hr: manual[key]?.hr ?? '', key, ...(manual[key]?.source ? { src: manual[key].source } : {}) };
    if (!mid.hr) riteGaps.push({ key, section: it.la, la: mid.la });
    it.rows.splice(ri, 1, { ...r, la: r.la.slice(0, a).trim(), hr: r.hr.slice(0, h) + '.' }, mid, { ...r, la: r.la.slice(b).trim(), hr: 'P' + r.hr.slice(h + 3) });
  }
  // Latin misprints inside the rites (old-site pages and Divinum Officium), found with scripts/verify/latin-words.py and
  // corrected against the Missal 1962; listed in TYPOS.md
  const LATIN_FIXES: [string, string][] = [['Opéruit cselos', 'Opéruit cælos'], ['hearéticis', 'hæréticis'], ['incólumen custódiat', 'incólumem custódiat'], ['orbe terrarium', 'orbe terrárum'], ['ministéris et potestátibus', 'ministériis et potestátibus'], ['suffícere posit', 'suffícere possit'], ['désuper context per', 'désuper contéxta per'],
    ['conctis vetustátis', 'cunctis vetustátis'], ['facit super earn', 'facit super eam'], ['ministranttiun', 'ministrantium'], ['nómine santæ Trinitátis', 'nómine sanctæ Trinitátis'], ['semetípsis seméntum', 'semetípsis seméntem']];
  const used = new Set<string>();
  for (const doc of Object.values<any>(out)) for (const it of doc.items) for (const r of it.rows ?? []) if (typeof r.la === 'string') for (const [x, y] of LATIN_FIXES) if (r.la.includes(x)) { r.la = r.la.split(x).join(y); used.add(x); }
  for (const [x] of LATIN_FIXES) if (!used.has(x)) throw new Error('rites: Latin correction matched nothing: ' + x);
  // the Pope's name in place of the placeholder (Good Friday, Exsultet); the bishop's stays "N."
  if (pope) for (const doc of Object.values<any>(out)) for (const it of doc.items) for (const r of it.rows ?? []) {
    if (typeof r.la === 'string' && pope.la?.abl) r.la = r.la.replace(/(Papa nostro) N\./g, `$1 ${pope.la.abl}`);
    if (typeof r.hr === 'string' && r.hr.trim()) r.hr = insertNameHr(r.hr, pope.hr as any);
  }
  fs.writeFileSync('data/tm/rite-gaps.json', JSON.stringify(riteGaps, null, 1));
  // corrections of the Croatian (data/tm/corrections.yaml)
  if (fix) for (const [id, doc] of Object.entries<any>(out)) for (const it of doc.items) for (const r of it.rows ?? []) if (typeof r.hr === 'string' && r.hr.trim()) r.hr = fix.edit(r.hr, id);
  for (const [id, doc] of Object.entries(out)) fs.writeFileSync(path.join(dist, `data/f/${fileOf(id)}.js`), `TLM.f(${JSON.stringify(id)},${JSON.stringify(doc)});\n`);
  return report;
}
