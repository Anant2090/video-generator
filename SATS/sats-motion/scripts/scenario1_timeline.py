"""Standalone Scenario 1 clock -> src/data/timeline.scenario1.json (does not write timeline.json)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LINES = json.loads((ROOT / 'src' / 'data' / 'lines.json').read_text())
FPS = 30

placed: dict[str, dict] = {}
scenes: list[dict] = []
sfx: list[dict] = []
marks: dict[str, float] = {}


def say(key: str, at: float) -> float:
    ln = LINES[key]
    placed[key] = {'at': round(at, 3), 'end': round(at + ln['dur'], 3), 'who': ln['who']}
    return at + ln['dur']


def fx(name: str, at: float, gain: float = 1.0):
    sfx.append({'name': name, 'at': round(at, 3), 'gain': gain})


def conversation(start: float, ids: list[str], tool_gap: dict[str, float]) -> float:
    t = start
    for i, k in enumerate(ids):
        if i:
            prev = LINES[ids[i - 1]]['who']
            t += tool_gap.get(k, 0.35 if prev == 'agent' else 0.5)
        t = say(k, t)
    return t


for key in ('E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7'):
    if key not in LINES:
        raise SystemExit(f'missing {key} in lines.json — run python scripts/audio.py {key}')

fx('whoosh', 0.15, 0.7)
marks['ring'] = 3.5
fx('ring', marks['ring'])
marks['pickup'] = marks['ring'] + 2.3
fx('pickup', marks['pickup'], 0.8)
t = conversation(marks['pickup'] + 0.35, ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7'], {'E3': 0.85, 'E5': 0.8, 'E7': 1.15})
marks['sms'] = placed['E6']['end'] + 0.2
marks['hangup'] = t + 0.45
fx('hangup', marks['hangup'], 0.7)
scenes.append({'name': 'scenario1', 'start': 0, 'end': round(t + 2.2, 3)})

total = scenes[-1]['end']
if total > 90:
    print(f'WARNING: {total:.1f}s exceeds 1.5 min target')
out = {
    'fps': FPS,
    'total': round(total, 3),
    'frames': round(total * FPS),
    'scenes': scenes,
    'lines': placed,
    'sfx': sfx,
    'marks': {k: round(v, 3) for k, v in marks.items()},
}
(ROOT / 'src' / 'data' / 'timeline.scenario1.json').write_text(json.dumps(out, indent=1))
print(f"scenario1 0.00 -> {total:.2f}  ({total:.1f}s)")
