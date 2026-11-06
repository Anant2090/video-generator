"""Places every line, scene and sound effect on one clock -> src/data/timeline.json.

All times are seconds from the start of the video. Line timings come from src/data/lines.json,
so regenerating a line re-flows everything after it.
"""
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
    """Place a line at `at`; returns its end time."""
    ln = LINES[key]
    placed[key] = {'at': round(at, 3), 'end': round(at + ln['dur'], 3), 'who': ln['who']}
    return at + ln['dur']


def fx(name: str, at: float, gain: float = 1.0):
    sfx.append({'name': name, 'at': round(at, 3), 'gain': gain})


def scene(name: str, start: float, end: float):
    scenes.append({'name': name, 'start': round(start, 3), 'end': round(end, 3)})


def conversation(start: float, ids: list[str], tool_gap: dict[str, float]) -> float:
    """Turn-taking gaps: short after the agent, longer before an agent answer that needs a tool."""
    t = start
    for i, k in enumerate(ids):
        if i:
            prev = LINES[ids[i - 1]]['who']
            t += tool_gap.get(k, 0.35 if prev == 'agent' else 0.55)
        t = say(k, t)
    return t


# 1 Hook
fx('touchdown', 2.1)
for i in range(5):
    fx('tick', 4.3 + i * 0.42, 0.6)
fx('stream', 8.2)
fx('ring', 10.4)
say('vo1', 0.8)
marks['hook_ring'] = 10.4
scene('hook', 0, 14.0)

# 2 Challenge
fx('whoosh', 13.7)
t = say('vo2', 14.4)
scene('challenge', 14.0, t + 0.4)

# 3 Title + platform
s3 = t + 0.4
fx('whoosh', s3 - 0.3, 0.8)
t = say('vo3', s3 + 0.5)
marks['home_in'] = s3 + 6.0
marks['click_canvas'] = s3 + 9.0
marks['list_in'] = s3 + 9.6
marks['click_sats'] = s3 + 13.0
fx('click', marks['click_canvas'], 0.7)
fx('click', marks['click_sats'], 0.7)
scene('title', s3, max(t + 0.6, marks['click_sats'] + 1.0))

# 4 Canvas tour
s4 = scenes[-1]['end']
fx('whoosh', s4 - 0.2, 0.7)
t = say('vo4a', s4 + 0.7)
t = say('vo4b', t + 0.6)
t = say('vo4c', t + 0.5)
t = say('vo4d', t + 0.5)
t = say('vo4e', t + 0.4)
scene('canvas', s4, t + 1.0)

# 5 Call A (split screen)
s5 = scenes[-1]['end']
fx('whoosh', s5 - 0.2, 0.7)
t = say('vo5', s5 + 0.6)
marks['trigger'] = t + 0.3
marks['ringA'] = t + 0.9
fx('ring', marks['ringA'])
marks['pickupA'] = marks['ringA'] + 2.9
fx('pickup', marks['pickupA'], 0.8)
t = conversation(marks['pickupA'] + 0.4, ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11'],
                 {'A5': 1.1, 'A7': 1.1, 'A9': 1.1})
marks['hangupA'] = t + 0.4
fx('hangup', marks['hangupA'], 0.7)
scene('call', s5, t + 1.6)

# 6 Hand-offs: Call B (transfer), Call C (callback)
s6 = scenes[-1]['end']
t = say('vo6a', s6 + 0.4)
marks['callB'] = t + 0.2
t = conversation(t + 0.6, ['B1', 'B2'], {'B2': 1.0})
marks['ringB'] = t + 0.3
fx('ringback', marks['ringB'])
t = say('B3', marks['ringB'] + 1.8)
marks['callC'] = t + 0.5
t = say('vo6b', t + 0.7)
t = conversation(t + 0.5, ['C1', 'C2'], {'C2': 0.9})
marks['hangupC'] = t + 0.3
fx('hangup', marks['hangupC'], 0.6)
scene('handoffs', s6, t + 1.0)

# 6b Scenario 6: pickup deadline and payment link
s6b = scenes[-1]['end']
fx('whoosh', s6b - 0.2, 0.7)
t = say('vo5d', s6b + 0.5)
marks['ringD'] = t + 0.8
fx('ring', marks['ringD'])
marks['pickupD'] = marks['ringD'] + 2.5
fx('pickup', marks['pickupD'], 0.8)
t = conversation(marks['pickupD'] + 0.4, ['D1', 'D2', 'D3', 'D4', 'D5'], {'D3': 0.9, 'D5': 1.4})
marks['smsD'] = placed['D4']['end'] + 0.25
marks['hangupD'] = t + 0.5
fx('hangup', marks['hangupD'], 0.7)
scene('pickup', s6b, t + 2.4)

# 7 Exceptions
s7 = scenes[-1]['end']
fx('whoosh', s7 - 0.2, 0.7)
t = say('vo7', s7 + 0.7)
scene('exceptions', s7, t + 1.0)

# 8 On record
s8 = scenes[-1]['end']
t = say('vo8', s8 + 0.6)
scene('record', s8, t + 1.0)

# 9 Benefits
s9 = scenes[-1]['end']
fx('whoosh', s9 - 0.2, 0.6)
t = say('vo9', s9 + 0.5)
scene('benefits', s9, t + 0.6)

# 10 End card
s10 = scenes[-1]['end']
fx('chime', s10 + 0.2, 0.8)
t = say('vo10', s10 + 0.7)
scene('end', s10, t + 2.5)

total = scenes[-1]['end']
out = {'fps': FPS, 'total': round(total, 3), 'frames': round(total * FPS), 'scenes': scenes, 'lines': placed,
       'sfx': sfx, 'marks': {k: round(v, 3) for k, v in marks.items()}}
(ROOT / 'src' / 'data' / 'timeline.json').write_text(json.dumps(out, indent=1))
for s in scenes:
    print(f"{s['name']:11} {s['start']:7.2f} -> {s['end']:7.2f}  ({s['end'] - s['start']:5.1f}s)")
print(f'total {total:.2f}s = {int(total // 60)}:{total % 60:04.1f}')
