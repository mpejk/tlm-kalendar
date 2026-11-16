import { importFormulary, fallbackOf, sectionWithFallback } from '../import/formulary.mjs';
import { getSection, parseFile } from '../import/dofile.mjs';
const [id, sec] = process.argv.slice(2);
console.log('fallback', fallbackOf(id));
const f = importFormulary(id, {});
console.log('rule', f.rule, 'inh', f.ruleInherited, Object.keys(f.sections).join(','));
if (sec) { console.log(getSection(id, sec)); console.log(JSON.stringify(f.sections[sec], null, 0)?.slice(0, 1500)); console.log(f.from); }
