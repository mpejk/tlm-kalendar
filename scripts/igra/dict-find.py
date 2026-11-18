# Finds the candidate entries of the lemmas in the OCR text of Žepić 1881 (with the scan leaf) and of Žepić 1941 (cross-check).
import json,re,sys,bisect
R='data/raw/rjecnik/'
st=open(R+'st.txt',encoding='utf8').read(); pi=json.load(open(R+'pi.json')); starts=[p[0] for p in pi]
z41=open(R+'z1941.txt',encoding='utf8').read()
L=json.load(open('scripts/igra/lemmas.json'))
want=sys.argv[1:] or list(L)
def leaf(pos): return bisect.bisect_right(starts,pos)-1
for k in want:
    pat=re.compile(r'(?:(?<=\n)|(?<=[.;] )|^)(?:[IVX1-4]+\. ?)?'+re.escape(k)+r'[,.]? (?=.{0,60}?(?:\d\)|[mfn/]\. |adj|adv|\d\.|num))',re.I)
    c=[m for m in pat.finditer(st)]
    c=[m for m in c if st[m.start():m.start()+len(k)+3].lower().startswith(k) or True][:3]
    out=[f"  81 n{leaf(m.start())}: {st[m.start():m.start()+150]!r}" for m in c]
    m=re.search(r'\n'+re.escape(k)+r'[,. ][^\n]*\n[^\n]*',z41,re.I)
    print(k); print('\n'.join(out) or '  81 —'); print('  41:',repr(re.sub(r'\s+',' ',m.group(0))[:110]) if m else '—')
