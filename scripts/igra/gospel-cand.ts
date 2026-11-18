// Candidate sentences for game 6, to choose from by hand (data/igra/evandjelje.yaml): npx tsx scripts/igra/gospel-cand.ts
import { loadDist, zagrebDays, isRound, principal, massOf, sectionOf, hrOf } from './lib';
export function gospelBody(t: string): string { return t.split('\n').filter(l => !(l.length < 70 && /\d/.test(l) && !/\p{Ll}{9,}/u.test(l))).join(' ').replace(/<\/?[ib]>/g, '').replace(/\s+/g, ' ').trim(); }
export const sentences = (body: string) => body.split(/(?<=[.!?][»«"]?)\s+(?=[–»«"]?\s?\p{Lu})/u).map(s => s.trim());
if (process.argv[1]?.endsWith('gospel-cand.ts')) {
  const D = loadDist('dist'); const seen = new Map<string, string>();
  for (const d of zagrebDays(D).filter(isRound)) { const v = massOf(D, d, principal(d)); const g = sectionOf(v, 'Evangelium')!; const t = hrOf(D, g)!; if (!seen.has(g.src!)) seen.set(g.src!, t); else if (seen.get(g.src!) !== t) console.log('VARIES', g.src); }
  const NUM = /\b(dva|dvije|dvojica|tri|trojica|četiri|pet|šest|sedam|osam|devet|deset|jedanaest|dvanaest|dvanaestorica|trideset|četrdeset|sto|stotinu|tisuć\p{L}*|treći|trećega|sedamdeset\p{L}*|osamnaest|trideset i osam|sedmer\p{L}*|petero|dvoje)\b/iu;
  const NOUN = /\b(kruh\p{L}*|rib\p{L}*|vin\p{L}*|vod\p{L}*|lađ\p{L}*|mrež\p{L}*|ovc\p{L}*|ovac\p{L}*|pastir\p{L}*|anđe\p{L}*|zvijezd\p{L}*|hram\p{L}*|more\p{L}*|gor[aeiu]|vrt\p{L}*|vinograd\p{L}*|sjem\p{L}*|smokv\p{L}*|kamen\p{L}*|grob\p{L}*|jasl\p{L}*|golub\p{L}*|magar\p{L}*|denar\p{L}*|talent\p{L}*|svjetilj\p{L}*|vrat\p{L}*|ključ\p{L}*|mač\p{L}*|križ\p{L}*|oblak\p{L}*|sunc\p{L}*|srce\p{L}*|oči\p{L}*|ruk\p{L}*|nog\p{L}*)\b/iu;
  for (const [src, t] of seen) {
    const ss = sentences(gospelBody(t)).slice(1).filter(s => s.length >= 35 && s.length <= 150);
    const sc = (s: string) => (NUM.test(s) ? 3 : 0) + (/\s\p{Lu}\p{Ll}{3,}/u.test(s.replace(/\b(Isus\p{L}*|Gospodin\p{L}*|Bog\p{L}*|Bož\p{L}*|Otac|Oca|Ocu|Sina?|Duh\p{L}*|Krist\p{L}*)\b/gu, '')) ? 2 : 0) + (NOUN.test(s) ? 2 : 0);
    const best = ss.map((s, i) => ({ s, i, k: sc(s) })).sort((a, b) => b.k - a.k || a.i - b.i).slice(0, 4).sort((a, b) => a.i - b.i);
    console.log('## ' + src.replace('|Evangelium', '')); for (const b of best) console.log('  ' + b.s);
  }
}
