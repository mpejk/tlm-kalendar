# usage: span.py <ed> <leafFrom> <leafTo> <startRegex> <endRegex>  -> prints dehyphenated OCR text from start match to end match (inclusive)
import sys, re, json
ed, a, b, s, e = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5]
pages = json.load(open(f'data/raw/kniewald/{ed}_pages.json', encoding='utf-8'))
t = '\n'.join(f'[[leaf {i}]]\n' + pages[i] for i in range(a, b + 1))
t = re.sub(r'[¬-]\s*\n\s*', '', t); t = re.sub(r'[ \t]+', ' ', t); t = re.sub(r'\n(?!\n)', ' ', t); t = re.sub(r'\n\s*', '\n', t)
m = re.search(s, t); t = t[m.start():] if m else t
m = re.search(e, t); t = t[:m.end()] if m else t
print(t)
