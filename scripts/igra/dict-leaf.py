# Which scan leaf of Žepić 1881 holds a headword: python3 scripts/igra/dict-leaf.py <lemma>...   (an estimate from the OCR; the leaf is a two-page spread)
# Image: curl -sL "https://archive.org/download/latinsko_hrvatski_rjecnik_1881-sebastijan_zepic/page/n<leaf>.jpg" -o data/raw/rjecnik/n<leaf>.jpg
import json,re,sys,bisect
R='data/raw/rjecnik/'
st=open(R+'st.txt',encoding='utf8').read(); pi=json.load(open(R+'pi.json'))
keys=[]
for i,p in enumerate(pi):
    t=st[p[0]:p[1]].lower()
    ws=sorted(w for w in re.findall(r'(?:\n|[.;] )([a-z]{4,12}), [a-z]{1,5}[,.] ',t))
    keys.append(ws[len(ws)//2] if len(ws)>=6 else None)
# keep the longest increasing chain (drops leaves whose OCR misleads)
idx=[i for i,k in enumerate(keys) if k and 6<i<530]
best=[1]*len(idx); prev=[-1]*len(idx)
for a in range(len(idx)):
    for b in range(max(0,a-40),a):
        if keys[idx[b]]<=keys[idx[a]] and best[b]+1>best[a]: best[a]=best[b]+1; prev[a]=b
a=max(range(len(idx)),key=lambda x:best[x]); chain=[]
while a>=0: chain.append(idx[a]); a=prev[a]
chain.reverse(); ck=[keys[i] for i in chain]
for w in sys.argv[1:]:
    j=bisect.bisect_right(ck,w.lower()); lo=chain[max(0,j-1)]; hi=chain[min(len(chain)-1,j)]
    print(w, 'leaf about', lo, 'to', hi, f'({ck[max(0,j-1)]} .. {ck[min(len(ck)-1,j)]})')
