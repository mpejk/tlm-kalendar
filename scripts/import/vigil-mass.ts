// The Mass of the Easter Vigil after the Kyrie (review finding R01). The general import stops every text at a "Gloria" heading
// (right for Ember Saturdays), which cut the Vigil short. This script reads the same Divinum Officium data file
// (Tempora/Quad6-6r.txt of the pinned clone under data/raw/do/repo) and writes the proper parts of the Mass, in the order of
// the Missal (Sabbato sancto, De Missa solemni Vigiliae paschalis), to data/corpus/la/vigil-mass.json, which is committed.
// Each row has a stable key; its Croatian is in data/tm/rites-hr.yaml under the same key.
//   npx tsx scripts/import/vigil-mass.ts      (only needed again if the source file changes)
import fs from 'node:fs';
const src = 'data/raw/do/repo/web/www/missa/Latin/Tempora/Quad6-6r.txt';
const all = fs.readFileSync(src, 'utf8').split('\n').map(l => l.replace(/\s+$/, ''));
const from = all.findIndex(l => /^!!\s*Gloria/.test(l)); if (from < 0) throw new Error('no Gloria heading');
const L = all.slice(from);
// accents and capitals the source file leaves out, as printed in the Missale Romanum 1962, p. 212 (PDF 293)
const FIX: [string, string][] = [['noctem gloria domínicæ', 'noctem glória domínicæ'], ['Lectio Epistolæ beati Pauli apostoli ad Colossenses.', 'Léctio Epístolæ beáti Pauli Apóstoli ad Colossénses.'], ['Fratres: si consurrexístis', 'Fratres: Si consurrexístis'], ['Laudáte Dominum omnes gentes', 'Laudáte Dóminum, omnes gentes'], ['Paschálibus satiásti tua fácias', 'paschálibus satiásti, tua fácias']];
const fixed = (s: string) => FIX.reduce((t, [a, b]) => t.split(a).join(b), s);
const clean = (s: string) => fixed(s.normalize('NFC')).replace(/^[vVrRSMC]\.\s*/, '').replace(/\s*\+\+\s*/g, ' ✠ ').replace(/\s\+\s/g, ' ✠ ').replace(/~\(\d+:\d+\)\s*/, '').replace(/\s+/g, ' ').trim();
/** the first line that starts with the given words (after the speaker mark), whole */
const text = (start: string, after = 0): string => { const i = L.findIndex((l, k) => k >= after && clean(l).startsWith(start)); if (i < 0) throw new Error('not found: ' + start); return clean(L[i]); };
const at = (re: RegExp) => { const i = L.findIndex(l => re.test(l)); if (i < 0) throw new Error('not found: ' + re); return i; };
const rubric = (start: string) => { const i = L.findIndex(l => l.startsWith('! ' + start) || l.startsWith('!' + start)); if (i < 0) throw new Error('rubric not found: ' + start); return '[' + L[i].replace(/^!\s*/, '').replace(/ ! /g, ' ').replace(/\s+/g, ' ').trim() + ']'; };
const iLaud = at(/^!!\s*Pro Laudibus/);
const ps150 = L.slice(iLaud).filter(l => /^~\(150:/.test(l)).map(clean);
const bened = L.slice(at(/^! Benedictus/)).filter(l => /^r\. /.test(l)).map(clean);
const out = { source: 'Divinum Officium, web/www/missa/Latin/Tempora/Quad6-6r.txt (commit 326bc4a)', sections: [
  { la: 'Glória in excélsis', hr: 'Slava', rows: [
    { la: rubric('Finitis a choro Kyrie') }, { note: 'gloria' } ] },
  { la: 'Orátio', hr: 'Molitva', rows: [
    { key: 'vigil:oratio', la: `Orémus.\n${text('Deus, qui hanc sacratíssimam noctem')}`, concl: 'Per eundem' } ] },
  { la: 'Epístola', hr: 'Poslanica', rows: [
    { key: 'vigil:epistola', la: `${text('Léctio Epístolæ beáti Pauli')}\nCol 3:1-4\n${text('Fratres: Si consurrexístis')}` } ] },
  { la: 'Allelúia', hr: 'Aleluja', rows: [
    { la: rubric('Finita Epistola, celebrans incipit') + '\n' + rubric('Et totum decantat ter') },
    { key: 'vigil:alleluia', la: `Allelúia. Allelúia. Allelúia.\nPs. 117, 1\n℣. ${text('Confitémini Dómino, quóniam bonus')}` },
    { key: 'vigil:tractus', la: `Ps. 116\n℣. ${text('Laudáte Dóminum, omnes gentes')}\n℣. ${text('Quóniam confirmáta est super nos')}` } ] },
  { la: 'Evangélium', hr: 'Evanđelje', rows: [
    { la: rubric('Ad Evangelium non portantur luminaria') },
    { key: 'vigil:evangelium', la: `${text('Sequéntia ✠ sancti Evangélii secúndum Matthǽum')}\nMatt 28:1-7\n${text('Véspere autem sábbati')}` },
    { note: 'noCredo' },
    { la: rubric('Non dicitur antiphona ad Offertorium') } ] },
  { la: 'Secréta', hr: 'Prikazna molitva', rows: [
    { key: 'vigil:secreta', la: text('Súscipe, quǽsumus, Dómine, preces pópuli tui'), concl: 'Per Dominum' } ] },
  { la: 'Praefátio paschális', hr: 'Predslovlje uskrsno', rows: [
    { key: 'vigil:prefatio', preface: 'Pasch' },
    { la: rubric('Agnus Dei non dicitur') } ] },
  { la: 'Pro Láudibus', hr: 'Jutarnja', rows: [
    { la: '[' + L[iLaud + 1].replace(/^!\s*/, '').replace(/ ! /g, ' ').trim() + ']' },
    { key: 'vigil:laudes-ps150', la: `Ant. Allelúia, allelúia, allelúia.\nPsalmus 150\n${ps150.join('\n')}\nGlória Patri, et Fílio, et Spirítui Sancto. Sicut erat in princípio, et nunc, et semper, et in sǽcula sæculórum. Amen.\nAnt. Allelúia, allelúia, allelúia.` },
    { la: rubric('Capitulum, hymnus et versus non dicuntur') },
    { key: 'vigil:laudes-antiphona', la: text('Ant. Et valde mane una sabbatórum') },
    { la: rubric('Deinde cantatur Benedíctus') },
    { key: 'vigil:laudes-benedictus', la: `Luc 1:68-79\n${bened.filter(l => !/^(Glória Patri|Sicut erat)/.test(l)).join('\n')}\nGlória Patri, et Fílio, et Spirítui Sancto. Sicut erat in princípio, et nunc, et semper, et in sǽcula sæculórum. Amen.` },
    { key: 'vigil:laudes-antiphona', la: text('Ant. Et valde mane una sabbatórum') } ] },
  { la: 'Postcommúnio', hr: 'Popričesna', rows: [
    { key: 'vigil:postcommunio', la: `Orémus.\n${text('Spíritum nobis, Dómine, tuæ caritátis infúnde')}`, concl: 'Per Dominum eiusdem' } ] },
  { la: 'Conclúsio', hr: 'Otpust', rows: [
    { key: 'vigil:ite', la: `℣. ${text('Ite, Missa est, allelúia, allelúia.')}\n℟. ${text('Deo grátias, allelúia, allelúia.')}` },
    { la: rubric('Omisso ultimo Evangelio') } ] },
] };
fs.writeFileSync('data/corpus/la/vigil-mass.json', JSON.stringify(out, null, 1));
console.log(out.sections.map(s => `${s.la}: ${s.rows.length}`).join('; '));
