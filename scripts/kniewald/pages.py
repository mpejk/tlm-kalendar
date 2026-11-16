# Split DjVu XML into per-leaf text: writes data/raw/kniewald/<ed>_pages.json  (list of strings, index = leaf)
import sys, re, json, html
ed = sys.argv[1]
src = f'data/raw/kniewald/{ed}_djvu.xml'
x = open(src, encoding='utf-8').read()
pages = []
for obj in re.split(r'<OBJECT ', x)[1:]:
    lines = []
    for par in re.findall(r'<PARAGRAPH>(.*?)</PARAGRAPH>', obj, re.S):
        for ln in re.findall(r'<LINE>(.*?)</LINE>', par, re.S):
            ws = re.findall(r'<WORD[^>]*>(.*?)</WORD>', ln, re.S)
            lines.append(' '.join(html.unescape(w) for w in ws))
        lines.append('')
    pages.append('\n'.join(lines))
json.dump(pages, open(f'data/raw/kniewald/{ed}_pages.json', 'w', encoding='utf-8'), ensure_ascii=False)
print(len(pages))
