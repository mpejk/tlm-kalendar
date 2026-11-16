# usage: find.py <ed> <regex> [context chars]  -> prints leaf, printed pages, context for each hit in per-leaf OCR
import sys, re, json
ed, pat = sys.argv[1], sys.argv[2]
ctx = int(sys.argv[3]) if len(sys.argv) > 3 else 200
pages = json.load(open(f'data/raw/kniewald/{ed}_pages.json', encoding='utf-8'))
for i, t in enumerate(pages):
    t2 = re.sub(r'¬\s*\n\s*', '', t)
    t2 = re.sub(r'\s+', ' ', t2)
    for m in re.finditer(pat, t2, re.I):
        s = max(0, m.start() - 60); e = min(len(t2), m.end() + ctx)
        print(f'[leaf {i}] ...{t2[s:e]}...')
