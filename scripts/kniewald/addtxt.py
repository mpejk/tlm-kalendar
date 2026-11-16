# usage: addtxt.py <id> <out.txt> <ref> <checked> <note> [header]   -> adds entry with hr = header + "\n" + file text
import sys, json, subprocess
id_, f, ref, chk, note = sys.argv[1:6]
hdr = sys.argv[6] + '\n' if len(sys.argv) > 6 and sys.argv[6] else ''
e = {"id": id_, "hr": hdr + open(f, encoding='utf-8').read().strip(), "ref": ref, "checked": chk}
if note: e["note"] = note
subprocess.run(['python3', '-I', 'scripts/kniewald/add.py'], input=json.dumps([e]).encode(), check=True)
