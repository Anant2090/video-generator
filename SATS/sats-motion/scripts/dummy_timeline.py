"""Place dummy lines and scenes -> src/data/timeline.dummy.json (does not write timeline.json)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LINES = json.loads((ROOT / 'src' / 'data' / 'lines.dummy.json').read_text())
FPS = 30

placed: dict[str, dict] = {}
scenes: list[dict] = []
sfx: list[dict] = []


def say(key: str, at: float) -> float:
    ln = LINES[key]
    placed[key] = {'at': round(at, 3), 'end': round(at + ln['dur'], 3), 'who': ln['who']}
    return at + ln['dur']


def fx(name: str, at: float, gain: float = 1.0):
    sfx.append({'name': name, 'at': round(at, 3), 'gain': gain})


def scene(name: str, start: float, end: float):
    scenes.append({'name': name, 'start': round(start, 3), 'end': round(end, 3)})


for key in ('demo1', 'demo2', 'demo3', 'demo4', 'demo5'):
    if key not in LINES:
        raise SystemExit(f'missing {key} in src/data/lines.dummy.json — run python scripts/dummy_audio.py first')

# 1 Title
fx('whoosh', 0.2, 0.7)
t = say('demo1', 0.8)
scene('title', 0, t + 0.8)

# 2 Dashboard
s2 = scenes[-1]['end']
fx('whoosh', s2 - 0.2, 0.7)
t = say('demo2', s2 + 0.6)
scene('dashboard', s2, t + 0.7)

# 3 Workflow
s3 = scenes[-1]['end']
fx('whoosh', s3 - 0.2, 0.7)
t = say('demo3', s3 + 0.6)
scene('workflow', s3, t + 0.7)

# 4 Shipment
s4 = scenes[-1]['end']
fx('whoosh', s4 - 0.2, 0.7)
t = say('demo4', s4 + 0.6)
scene('shipment', s4, t + 0.7)

# 5 End
s5 = scenes[-1]['end']
fx('chime', s5 + 0.2, 0.8)
t = say('demo5', s5 + 0.7)
scene('end', s5, t + 2.5)

total = scenes[-1]['end']
out = {
    'fps': FPS,
    'total': round(total, 3),
    'frames': round(total * FPS),
    'scenes': scenes,
    'lines': placed,
    'sfx': sfx,
    'marks': {},
}
(ROOT / 'src' / 'data' / 'timeline.dummy.json').write_text(json.dumps(out, indent=1))
for s in scenes:
    print(f"{s['name']:11} {s['start']:7.2f} -> {s['end']:7.2f}  ({s['end'] - s['start']:5.1f}s)")
print(f'total {total:.2f}s = {int(total // 60)}:{total % 60:04.1f}')
