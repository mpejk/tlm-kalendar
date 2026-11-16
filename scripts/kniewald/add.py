# usage: add.py < entries.json   (array or object) -> merge by id into data/tm/kniewald-found.json
import sys, json, os
p = 'data/tm/kniewald-found.json'
cur = json.load(open(p, encoding='utf-8')) if os.path.exists(p) else []
new = json.load(sys.stdin)
if isinstance(new, dict): new = [new]
by = {e['id']: e for e in cur}
for e in new:
    assert e['id'] and e['hr'] and e['ref'] and e['checked'] in ('image', 'ocr'), e
    by[e['id']] = e
json.dump(list(by.values()), open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(by), 'entries')
