// Mechanical agreement of the Croatian with the Latin in the number of Alleluias that close the antiphons at the introit,
// offertory and communion. The Latin follows the Code of Rubrics (nn. 429, 478, 504: added in Paschaltide, omitted from
// Septuagesima to Easter); the Croatian cell comes from an old-site page of one particular day, so it can carry one Alleluia
// too many or too few for the day shown. Only the Alleluias at the end of a line are touched; no other word is changed.
const LA_TAIL = /((?:[,;:.]?\s*allel[úu][ij]a)+)[.!]?\s*$/i;
const HR_TAIL = /((?:[,;:.!]?\s*(?:<i>)?alelu[jy]a(?:<\/i>)?)+)\s*[.!]?\s*$/i;
const count = (s0: string, re: RegExp) => { const s = s0.replace(/\s*\([^()]*\)\s*$/, ''); const m = s.match(re); return m ? (m[1].match(/al+el[uú]/gi) ?? []).length : 0; };
const isRef = (t: string) => t.length < 70 && /\d/.test(t) && /^[\p{L}\d .,;:\-–()]+$/u.test(t) && !/\p{Ll}{9,}/u.test(t);
const isFormula = (t: string) => /^<i>[^<]*<\/i>\.?$/.test(t);

function setTail(line: string, n: number): string {
  let base = line.replace(HR_TAIL, '').trimEnd();
  if (!n) return /[.!?»"]$/.test(base) ? base : base.replace(/[,;:]$/, '') + '.';
  const tail = Array.from({ length: n }, () => '<i>aleluja</i>').join(', ');
  if (/[!?»"]$/.test(base)) return `${base} ${tail.replace('<i>a', '<i>A')}.`;
  return `${base.replace(/[.,;:]$/, '')}, ${tail}.`;
}

/** Returns the Croatian cell with the closing Alleluias of each antiphon line made equal to the Latin, or the cell unchanged
 *  when the lines cannot be paired. `changed` says whether anything was touched. */
export function reconcileAlleluia(la: { k: string; la: string }[], hr: string): { hr: string; changed: boolean; paired: boolean } {
  const L = la.filter(l => l.k === 'text').map(l => l.la.normalize('NFC'));
  // Croatian text segments: lines that are not references, formulas (Slava Ocu) or bracketed notes; a line that holds the
  // antiphon and, after an inline reference, the psalm verse counts as two segments
  const lines = hr.split('\n'); type Seg = { i: number; from: number; to: number };
  const segs: Seg[] = [];
  lines.forEach((raw, i) => {
    const t = raw.trim(); if (!t || /^\[[^\]]*\]\.?$/.test(t) || isRef(t.replace(/<[^>]+>/g, '')) || isFormula(t)) return;
    const cut = [...raw.matchAll(/\s\((?:[1-4] )?\p{Lu}[\p{L}*]* ?\d+[^()]*\)\s/gu)].map(m => m.index!).filter(x => x > 20);
    let from = 0; for (const c of cut) { segs.push({ i, from, to: c }); from = c; }
    segs.push({ i, from, to: raw.length });
  });
  if (!L.length || !segs.length) return { hr, changed: false, paired: false };
  const paired = L.length === segs.length;
  const pairs: [number, Seg][] = paired ? L.map((_, k) => [k, segs[k]] as [number, Seg]) : [[L.length - 1, segs[segs.length - 1]]];
  let changed = false;
  // from the last segment backwards, so that offsets inside a line stay valid
  for (const [li, sg] of pairs.reverse()) {
    const part = lines[sg.i].slice(sg.from, sg.to); const lead = part.match(/^\s*/)![0];
    const want = count(L[li], LA_TAIL), have = count(part, HR_TAIL);
    if (want !== have) { lines[sg.i] = lines[sg.i].slice(0, sg.from) + lead + setTail(part.trim(), want) + lines[sg.i].slice(sg.to); changed = true; }
  }
  return { hr: lines.join('\n'), changed, paired };
}

// ---- gradual / Alleluia / tract
const AO_LA = /^(allel[úu][ij]a)(,\s*allel[úu][ij]a)?[.,]?$/i;
const AO_HR = /^(?:<i>)?alelu[jy]a(?:<\/i>)?(?:,\s*(?:<i>)?alelu[jy]a(?:<\/i>)?)*\s*[.!]?$/i;
const HR_LEAD = /^((?:(?:<i>)?alelu[jy]a(?:<\/i>)?[,.]?\s*)+)(?=\S)/i;
const aoLine = (n: number) => Array.from({ length: n }, (_, k) => (k ? '<i>aleluja</i>' : '<i>Aleluja</i>')).join(', ') + '.';

/** The same for the chants between the readings: the lines that consist of Alleluia alone ("Alleluia, alleluia.") and the
 *  Alleluia closing each verse are made to stand in the Croatian where they stand in the Latin. Verses are paired in order;
 *  when the two columns divide the verses differently, only the last verse and the Alleluia before it are touched. */
export function reconcileGradual(la: { k: string; la: string }[], hr: string): { hr: string; changed: boolean; paired: boolean } {
  type It = { ao: number } | { tail: number };
  const L: It[] = [];
  const lt = la.filter(l => l.k === 'text').map(l => l.la.normalize('NFC').trim());
  lt.forEach((t, k) => {
    if (AO_LA.test(t)) { L.push({ ao: (t.match(/allel/gi) ?? []).length }); return; }
    let tail = count(t, LA_TAIL);
    // "V. ... Alleluia, alleluia" closing a verse that is not the last: the double Alleluia introduces the next verse
    if (tail >= 2 && k < lt.length - 1) { L.push({ tail: tail - 2 }); L.push({ ao: 2 }); } else L.push({ tail });
  });
  const lines = hr.split('\n');
  const kind = lines.map(raw => { const t = raw.trim(); if (!t) return 'blank'; if (AO_HR.test(t)) return 'ao'; if (/^\[[^\]]*\]\.?$/.test(t) || isRef(t.replace(/<[^>]+>/g, '')) || isFormula(t)) return 'other'; return 'verse'; });
  const lv = L.filter(x => 'tail' in x) as { tail: number }[]; const hv = kind.map((k, i) => (k === 'verse' ? i : -1)).filter(i => i >= 0);
  if (!lv.length || !hv.length) return { hr, changed: false, paired: false };
  const before = hr; const paired = lv.length === hv.length;
  if (paired) {
    // Alleluia-only lines are rebuilt from the Latin; a verse that opens with Alleluia loses it to such a line
    const out: string[] = []; let v = 0; const aoBefore = new Map<number, number>(); let pend = 0;
    for (const it of L) { if ('ao' in it) pend = it.ao; else { if (pend) aoBefore.set(v, pend); pend = 0; v++; } }
    v = 0;
    let kept: string | null = null;   // an Alleluia line already standing before this verse, kept as printed if it has the right number
    lines.forEach((raw, i) => {
      if (kind[i] === 'ao') { kept = raw; return; }
      if (kind[i] !== 'verse') { out.push(raw); return; }
      const n = aoBefore.get(v); if (n) out.push(kept !== null && (String(kept).match(/alelu/gi) ?? []).length === n ? kept : aoLine(n)); kept = null;
      const body = raw.trim().replace(HR_LEAD, ''); out.push(count(body, HR_TAIL) === lv[v].tail ? (body === raw.trim() ? raw : body) : setTail(body, lv[v].tail)); v++;
    });
    hr = out.join('\n').replace(/\n{3,}/g, '\n\n');
  } else {
    const last = hv[hv.length - 1]; const wantTail = lv[lv.length - 1].tail;
    if (count(lines[last], HR_TAIL) !== wantTail) lines[last] = setTail(lines[last].trim(), wantTail);
    const li = L.lastIndexOf(lv[lv.length - 1]); const prev = L[li - 1];
    const prevVerse = hv.length > 1 ? hv[hv.length - 2] : -1;
    const hasAo = kind.slice(prevVerse + 1, last).includes('ao');
    const total = (x: string) => (x.match(/al+el[uú][ijy]a/gi) ?? []).length;
    if (prev && 'ao' in prev && !hasAo && !HR_LEAD.test(lines[last].trim()) && total(hr) < total(lt.join(' '))) lines.splice(last, 0, aoLine(prev.ao));
    hr = lines.join('\n');
  }
  return { hr, changed: hr !== before, paired };
}
