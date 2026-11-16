// Font check (finding W06): the shipped font files must not turn u into v in text tagged as Latin.
// Every font file is shaped with HarfBuzz twice, with the language set to Latin ("la") and with no language, for the letters
// u U v and the control words; the glyphs must be the same and none may be a *.LAT form. Also checks the GSUB tables directly:
// no language system "LAT" is left.
//   npx tsx scripts/verify/font-shape.ts [fontdir]        (default dist/fonts; exits 1 on failure)
// The unmodified typeface fails it:  npx tsx scripts/verify/font-shape.ts node_modules/@fontsource/eb-garamond/files
import fs from 'node:fs'; import path from 'node:path';
import * as hb from 'harfbuzzjs';
// @ts-ignore (no typings)
import decompress from 'wawoff2/decompress.js';

const dir = process.argv[2] ?? 'dist/fonts';
const only = /^(ebg-|eb-garamond-latin(-ext)?-(400|600)-(normal|italic)\.woff2$)/;
const files = fs.readdirSync(dir).filter(f => /\.(woff2|ttf|otf)$/.test(f) && only.test(f)).sort();
const TEXT = 'u U v V justítiam, Deus, tuus, meum, verbum';
let bad = 0; const rows: any[] = [];
for (const file of files) {
  let data: Uint8Array = fs.readFileSync(path.join(dir, file));
  if (file.endsWith('.woff2')) data = await decompress(data);
  const face = new hb.Face(new hb.Blob(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer)); const font = new hb.Font(face);
  const shape = (lang: string | null) => { const b = new hb.Buffer(); b.addText(TEXT); b.guessSegmentProperties(); if (lang) b.setLanguage(lang); hb.shape(font, b); return b.getGlyphInfos().map((g: any) => font.glyphName(g.codepoint)); };
  const plain = shape(null), la = shape('la'), hr = shape('hr');
  const langs = ['GSUB', 'GPOS'].flatMap(t => { try { const scripts = (face as any).getTableScriptTags(t) as string[]; return scripts.flatMap((_, i) => (face as any).getScriptLanguageTags(t, i) as string[]); } catch { return []; } });
  const covers = plain.some(n => n === 'u');       // the Latin Extended files do not hold the letter u at all
  const problems: string[] = [];
  if (la.join(' ') !== plain.join(' ')) problems.push(`Latin shaping differs: ${la.filter((n, i) => n !== plain[i]).join(' ')}`);
  if (hr.join(' ') !== plain.join(' ')) problems.push('Croatian shaping differs');
  if (la.some(n => /\.LAT$/i.test(n))) problems.push('a .LAT glyph is used');
  if (/^ebg-vr/.test(file)) { const b = new hb.Buffer(); b.addText('℟℣'); b.guessSegmentProperties(); hb.shape(font, b); const g = b.getGlyphInfos().map((x: any) => x.codepoint); if (g.length !== 2 || g.some((x: number) => x === 0)) problems.push('the signs ℟ ℣ are missing'); }
  if (covers && !(la[0] === 'u' && la[2] === 'U' && la[4] === 'v')) problems.push(`u U v shaped as ${la[0]} ${la[2]} ${la[4]}`);
  if (langs.some(l => l.trim() === 'LAT')) problems.push('language system LAT present');
  rows.push({ file, hasU: covers, 'u U v (la)': covers ? [la[0], la[2], la[4]].join(' ') : '—', ok: !problems.length, problems: problems.join('; ') });
  if (problems.length) bad++;
}
if (!files.length) { console.log('no font files in ' + dir); process.exit(1); }
if (!rows.some(r => r.hasU && /400-normal/.test(r.file)) || !rows.some(r => r.hasU && /600-normal/.test(r.file)) || !rows.some(r => r.hasU && /400-italic/.test(r.file))) { console.log('upright 400, upright 600 and italic files with the letter u were not all found'); bad++; }
console.table(rows);
console.log(JSON.stringify({ dir, files: files.length, failed: bad }));
process.exit(bad ? 1 : 0);
