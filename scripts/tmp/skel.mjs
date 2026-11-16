import fs from 'node:fs';
import { decodeEntities, decodeHtml } from '../harvest/util.mjs';
let h = decodeEntities(decodeHtml(fs.readFileSync(process.argv[2])));
h = h.slice(h.search(/<BODY>/i)).replace(/[ \t\r\n]+/g, ' ');
h = h.replace(/>([^<]{130,})</g, (m, t) => '>' + t.slice(0, 60) + ' … ' + t.slice(-40) + '<');
console.log(h);
