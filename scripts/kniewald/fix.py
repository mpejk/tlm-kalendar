# usage: fix.py <ed> <leafFrom> <leafTo> <startRegex> <endRegex> <replacements.json> [out.txt]
# Extracts an OCR span and applies an ordered list of [old, new] literal (or "re:"-prefixed regex) replacements
# that were established by reading the page scans. Reports replacements that did not match.
import sys, re, json
ed, a, b, s, e, rp = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5], sys.argv[6]
pages = json.load(open(f'data/raw/kniewald/{ed}_pages.json', encoding='utf-8'))
t = '\n'.join(f'[[leaf {i}]]\n' + pages[i] for i in range(a, b + 1))
t = re.sub(r'[¬-]\s*\n\s*', '', t); t = re.sub(r'[ \t]+', ' ', t); t = re.sub(r'\n(?!\n)', ' ', t); t = re.sub(r'\n\s*', '\n', t)
m = re.search(s, t); t = t[m.start():] if m else t
m = re.search(e, t); t = t[:m.end()] if m else t
for old, new in json.load(open(rp, encoding='utf-8')):
    if old.startswith('re:'):
        t2 = re.sub(old[3:], new, t, flags=re.S)
    else:
        t2 = t.replace(old, new)
    if t2 == t: print('NOMATCH:', old, file=sys.stderr)
    t = t2
t = re.sub(r' +', ' ', t).strip()
if len(sys.argv) > 7: open(sys.argv[7], 'w', encoding='utf-8').write(t)
print(t)
odd = sorted(set(re.findall(r"[^\w\s.,;:!?()»«\-†]", t)))
print('ODD CHARS:', odd, file=sys.stderr)
print('SUSPECT:', re.findall(r"\b\w*[A-ZČĆĐŠŽ]\w*[a-zčćđšž]\w*[A-ZČĆĐŠŽ]\w*\b|\b[a-zčćđšž]+[A-ZČĆĐŠŽ]\w*|\b\w*\d\w*[a-z]\w*|\b1\b|\bl\b|\bI [a-zčćđšž]{1,2}\b", t)[:80], file=sys.stderr)
