// Puts a saint's (or the Pope's) Croatian name into a prayer in place of the placeholder "I." (review finding T12).
// The case is decided by the words before the placeholder; where the sentence needs a form that is not on record, "I." stays.
const GEN = /\b(blaženoga|blaženog|svetoga|svetog|blažene|svete)(\s+)I\.(?=[\s,;:.]|$)/g;
const ACC = /\b(slugu (?:svoga|tvoga|svojega|tvojega)|[Pp]apu našega)(\s+)I\.(?:\s*\[[^\]]*\])?(?=[\s,;:.]|$)/g;
const INS = /\b([Pp]apom našim)(\s+)I\.(?=[\s,;:.]|$)/g;   // "skupa s preblaženim papom našim I. i biskupom I.": only the Pope
export function insertNameHr(hr: string, forms: Record<string, string> | undefined): string {
  if (!forms || !/I\./.test(hr)) return hr;
  if (forms.gen) hr = hr.replace(GEN, (_, a, sp) => a + sp + forms.gen);
  if (forms.acc) hr = hr.replace(ACC, (_, a, sp) => a + sp + forms.acc);
  if (forms.ins) hr = hr.replace(INS, (_, a, sp) => a + sp + forms.ins);
  return hr;
}
