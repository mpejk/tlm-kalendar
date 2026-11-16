// debug helper: print OCR paragraphs of a scan leaf (node scripts/kniewald/show.mjs <leaf> [grep])
import fs from 'node:fs'; import zlib from 'node:zlib';
const I='data/raw/kniewald/rimski_misal_za_privatnu_upotrebu_1942-dragutin_kniewald';
const st=zlib.gunzipSync(fs.readFileSync(I+'_hocr_searchtext.txt.gz')).toString('utf8');
const pi=JSON.parse(zlib.gunzipSync(fs.readFileSync(I+'_hocr_pageindex.json.gz')));
const [a,b,g,w]=process.argv.slice(2); const W=+(w||150);
for(let l=+a;l<=+(b||a);l++){console.log('--- leaf',l);st.slice(pi[l][0],pi[l][1]).split('\n').forEach((x,i)=>{x=x.replace(/\s+/g,' ');if(!g||g==='-'||new RegExp(g).test(x))console.log(i,x.length,'|',x.slice(0,W),x.length>W*2?' … '+x.slice(-W):'')})}
