# Merges the page readings of Žepić 1881 (data/igra/rjecnik-dio-*.json) with the forms (scripts/igra/lemmas.json) into
# data/igra/rjecnik.yaml, and cross-checks every meaning against the OCR of Milan Žepić's school dictionary (1941 ed.).
import json,re,glob
z=re.sub(r'¬\s*','',open('data/raw/rjecnik/z1941.txt',encoding='utf8').read())
L=json.load(open('scripts/igra/lemmas.json'))
DROP={'benedico':'samo uputnica na "bene"','desertum':'nema vlastite natuknice','ecclesia':'samo klasično značenje (narodna skupština)','oratio':'samo značenje "govor"','offero':'tiskano značenje zastarjelo (nudjati)','caro':'značenje "meso" ne odgovara uporabi u misi','manduco':'natuknica bez hrvatskoga značenja'}
FIX={'dominus':('gospodin','gospodin')}   # printed in the same entry ("gospodar, domadar, gospodin"), read on the page image (p. 318)
rows=[]
for f in sorted(glob.glob('data/igra/rjecnik-dio-*.json')): rows+=json.load(open(f))
out=[];left=[];weak=[]
for x in rows:
    k=x['lema']
    if not x.get('hr') or k in DROP: left.append((k,DROP.get(k) or x.get('napomena') or 'nema natuknice')); continue
    if k in FIX: x['tiskano'],x['hr']=FIX[k]
    n=re.sub(r'\s*[\(\[][^\)\]]*[\)\]]','',x['natuknica']); n=re.sub(r'^\d\.\s*','',n); n=re.sub(r',\s*,',',',n).strip().rstrip(',')
    n=re.sub(r',?\s*\d\)\s*adj\..*','',n); n=re.sub(r',\s*[AB]\)\s*adj\.',', adj.',n)
    key=x['hr'].split()[0][:5].lower()
    ok=any(key in re.sub(r'\s+',' ',m.group(0)).lower() for m in re.finditer(r'\n ?(?:\d\. )?'+re.escape(k.replace('i','[ij]',1) if k[0]=='i' else k)[:9]+r'[^\n]{0,60}(?:\n[^\n]*){0,12}',z,re.I))
    if not ok: weak.append(k)
    e={'k':k,'n':n,'hr':x['hr'],'str':x['str']}
    if x['tiskano']!=x['hr']: e['tiskano']=x['tiskano']
    e['oblici']=L[k]; out.append(e)
out.sort(key=lambda e:e['k'])
y=['# Game 5 (Riječi nedjelje): Latin words of the Sunday and feast-day Masses with one short Croatian meaning.',
'# Source: Sebastijan Žepić, Latinsko-hrvatski rječnik, Zagreb 1881 (public domain; the first edition of the school dictionary that',
'# M. Divković re-edited in 1900), scan: archive.org/details/latinsko_hrvatski_rjecnik_1881-sebastijan_zepic, read on the page images.',
'# k = the word as the Missal of 1962 spells it; n = the head of the entry as printed (length marks, notes in brackets left out);',
'# hr = a meaning printed in that entry, in today\'s spelling; tiskano = the printed spelling where it differs (ie/ije, dj/đ, …);',
'# str = printed page; oblici = the forms by which the word is recognised in a Mass (mechanical paradigms, scripts/igra/lemmas.py).',
'# Words left out (no entry, or no fitting meaning printed) are listed at the end.',
'izvor: "S. Žepić, Latinsko-hrvatski rječnik (Zagreb 1881.)"','rijeci:']
q=lambda s:json.dumps(s,ensure_ascii=False)
for e in out: y.append('  - { k: %s, n: %s, hr: %s, %sstr: %d, oblici: [%s] }'%(e['k'],q(e['n']),q(e['hr']),('tiskano: %s, '%q(e['tiskano'])) if 'tiskano' in e else '',e['str'],', '.join(e['oblici'])))
y.append('izostavljeno:')
for k,why in left: y.append('  - { k: %s, razlog: %s }'%(k,q(why[:90])))
open('data/igra/rjecnik.yaml','w').write('\n'.join(y)+'\n')
print(len(out),'words;',len(left),'left out; not confirmed by the 1941 OCR:',' '.join(weak))
