import { importFormulary } from '../import/formulary.mjs';
const f = importFormulary(process.argv[2], process.argv[3] ? { missa: 2 } : {});
if (!f) { console.log('no file'); process.exit(); }
console.log(f.id, '|', f.officium, '|', f.rank, '|', f.rule.join(' / '), '| fb:', f.fallback, f.ruleInherited ? '| inh: ' + f.ruleInherited.join(' / ') : '');
for (const [n, u] of Object.entries(f.sections)) console.log(`[${n}]${f.from[n] ? ' <- ' + f.from[n] : ''}\n` + u.map(x => '   ' + x.k + (x.mark ? '(' + x.mark + ')' : '') + ': ' + (x.la ?? x.name ?? '').slice(0, 110)).join('\n'));
