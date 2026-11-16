# Word-level sweep of the published Latin against the 1962 Missal (OCR of missale62.pdf, data/raw/missale62/pg/*.txt):
# words of the site that never occur in the Missal are candidates for misprints of the source data (review finding T06 and its like).
#   python3 scripts/verify/latin-words.py <snapshot>      (needs the Missal OCR; a finding aid, not a test)
import json, re, sys, glob, unicodedata, collections
def norm(w):
    w = ''.join(c for c in unicodedata.normalize('NFD', w.lower()) if unicodedata.category(c) != 'Mn')
    return w.replace('æ', 'ae').replace('œ', 'oe').replace('j', 'i').replace('v', 'u')
vocab = collections.Counter()
for f in sorted(glob.glob('data/raw/missale62/pg/p*.txt')):
    t = open(f, encoding='utf-8').read()
    t = re.sub(r'-\s*\n\s*', '', t)          # words divided at the end of a line
    for w in re.findall(r"[^\W\d_]+", t): vocab[norm(w)] += 1
s = json.load(open(f'.cache/snap/{sys.argv[1]}.json'))
seen = collections.defaultdict(lambda: [0, '', ''])
for key, v in s['views'].items():
    for r in v['rows']:
        if r[0] == 'day' or r[0].startswith('note'): continue
        la = s['texts'][r[1]]
        if la.startswith('Na ovoj misi'): continue
        for m in re.finditer(r"[^\W\d_]+", la):
            w = m.group(0); n = norm(w)
            if len(n) < 4 or n in vocab: continue
            e = seen[n]; e[0] += 1
            if not e[1]: e[1] = key; e[2] = la[max(0, m.start() - 30):m.end() + 25].replace('\n', ' ')
out = sorted(seen.items(), key=lambda x: x[0])
print(len(out), 'words not in the Missal OCR')
for n, (c, key, ctx) in out: print(f'{n} | {c} | {key} | {ctx}')
