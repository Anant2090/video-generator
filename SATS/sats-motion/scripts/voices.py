"""List Cartesia English voices: python scripts/voices.py [filter]"""
import json
import sys

import cartesia as c

c.ENVS = [c.ROOT.parents[1] / '.env']

out, cursor = [], None
while True:
    d = json.loads(c.call('/voices?limit=100' + (f'&starting_after={cursor}' if cursor else '')))
    vs = d['data'] if isinstance(d, dict) else d
    out += vs
    if not (isinstance(d, dict) and d.get('has_more')) or not vs:
        break
    cursor = vs[-1]['id']

f = (sys.argv[1] if len(sys.argv) > 1 else '').lower()
for v in out:
    line = f"{v['id']} | {v.get('language')} | {v.get('gender', '')} | {v['name']} | {(v.get('description') or '')[:120]}"
    if v.get('language') == 'en' and f in line.lower():
        print(line)
print(len(out), 'voices total', file=sys.stderr)
