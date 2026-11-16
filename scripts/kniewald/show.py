# usage: show.py <ed> <leaf> [start regex] [chars]
import sys, re, json
ed, leaf = sys.argv[1], int(sys.argv[2])
pages = json.load(open(f'data/raw/kniewald/{ed}_pages.json', encoding='utf-8'))
t = re.sub(r'¬\s*\n\s*', '', pages[leaf]); t = re.sub(r'[ \t]+', ' ', t); t = re.sub(r'\n(?!\n)', ' ', t)
if len(sys.argv) > 3:
    m = re.search(sys.argv[3], t, re.I); t = t[m.start():] if m else t
n = int(sys.argv[4]) if len(sys.argv) > 4 else 100000
print(t[:n])
