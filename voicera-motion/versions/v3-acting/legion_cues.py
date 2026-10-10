"""public/legion/words.json (Cartesia VO timestamps) -> public/legion/cues.json.

Single source of truth for the Legion promo timeline (Remotion + legion_audio.py):
VO placement, silences inserted between words, re-timed caption words, scene starts, beat marks.
All output times are VIDEO seconds.
"""
import json
import re
import wave
from pathlib import Path

import numpy as np

L = Path(__file__).resolve().parents[1] / 'public' / 'legion'
words = json.loads((L / 'words.json').read_text(encoding='utf-8'))
# The VO says the letter "V"; on screen the brand is spelled VEE (captions + anchors).
for w in words:
    w['text'] = re.sub(r'^(\s*)V(\W*)$', r'\1VEE\2', w['text'])
text = [w['text'].strip() for w in words]

VO_START = 0.3
DURATION = 30.0
# Silence inserted after these words (VO seconds of gap): a beat for the red glitch,
# and room for the numbers to land before "and shows you exactly why".
GAPS = {'troublemakers.': 0.35, 'call,': 1.0}

cuts = []  # (VO seconds mid-silence after the word, gap)
for i, w in enumerate(text):
    if w in GAPS:
        cuts.append(((words[i]['endMs'] + words[i + 1]['startMs']) / 2000, GAPS[w]))


def video(v: float) -> float:
    return round(VO_START + v + sum(g for c, g in cuts if v >= c), 3)


def at(word: str, nth: int = 1, edge: str = 'startMs') -> float:
    """Video time of the nth occurrence of a word."""
    idx = [i for i, w in enumerate(text) if w == word][nth - 1]
    return video(words[idx][edge] / 1000)


bounds = [0.0] + [c for c, _ in cuts] + [words[-1]['endMs'] / 1000 + 0.2]
segments = [{'from': a, 'to': b, 'at': video(a)} for a, b in zip(bounds, bounds[1:])]

scenes = {
    'hook': 0.0,
    'reveal': at("I'm") - 0.2,
    'legion': at('I') - 0.2,  # "I test"
    'build': at('Define') - 0.25,
    'live': at('run') - 0.15,
    'scores': at('I', 2) - 0.25,  # "and I score"
    'why': at('show') - 0.35,
    'real': at('Even') - 0.15,
    'cta': at('VEE', 2) - 0.3,  # closing "VEE Legion." ("VEE." after "I'm" has a period)
}
marks = {
    'which': at('Which'),
    'imVee': at("I'm"),
    'meet': at('Meet'),
    'legionName': at('Legion.'),
    'voice': at('voice'),
    'legionWord': at('legion'),
    'frustrated': at('frustrated,'),
    'confused': at('confused...'),
    'troublemakers': at('troublemakers.'),
    'define': at('Define'),
    'run': at('run'),
    'scoresWord': at('score'),
    'exactly': at('exactly'),
    'failed': at('failed.'),
    'real': at('real'),
    'catch': at('Catch'),
    'voEnd': video(words[-1]['endMs'] / 1000),
}
# --- VEE's physical choreography (video seconds), shared by src/legion/choreo.ts + legion_audio.py ---
HOP = 0.45
S, M = scenes, marks
actions = {
    'hopDur': HOP,
    # hops between stages: [start, stage] (stage names are defined in choreo.ts)
    'hops': [
        [round(M['which'] + 0.02, 3), 'hook'],  # startle hop in place
        [round(S['reveal'] - 0.3, 3), 'hero'],
        [round(S['legion'] + 0.05, 3), 'legion'],
        [round(S['build'] - 0.45, 3), 'build'],
        [round(S['live'] - 0.2, 3), 'live'],
        [round(S['scores'] - 0.3, 3), 'scores'],
        [round(S['why'] - 0.3, 3), 'why'],
        [round(S['real'] - 0.25, 3), 'real'],
        [round(S['cta'] - 0.25, 3), 'cta'],
    ],
    'wave': round(M['imVee'] - 0.03, 3),
    'pumps': [round(M['legionName'] - 0.12, 3), round(M['catch'] + 1.95, 3)],
    'deal': [round(M['legionWord'] - 0.05 + i * 0.3, 3) for i in range(4)],  # 4 flicks x 3 caller cards
    'trouble': round(M['troublemakers'] - 0.05, 3),
    'taps': [round(S['build'] + d, 3) for d in (0.4, 0.7, 1.05, 1.25)],  # after the dither-in (0.32 s)
    'run': round(S['live'] + 0.45, 3),  # RUN button impact
    'statDeal': [round(S['scores'] + 0.25 + i * 0.32, 3) for i in range(3)],
    'stamp': round(M['exactly'] + 0.08, 3),  # FAIL stamp impact
    'drop': round(S['real'] + 0.43, 3),  # file released; lands 0.28 s later
    'press': round(M['catch'] + 1.35, 3),  # CTA button press
    'bubbles': [
        [round(M['which'] + 0.1, 3), 0.75, 'Uh-oh…'],
        [round(M['imVee'], 3), 0.9, 'Hi!'],
        [round(M['legionWord'] + 1.2, 3), 1.3, 'Meet the gang!'],
        [round(S['live'] + 0.45, 3), 0.8, 'Go!'],
        [round(S['scores'] + 0.25 + 0.95, 3), 1.0, '94%!'],  # when the first stat has counted up
        [round(M['exactly'] + 0.08, 3), 1.0, 'Gotcha!'],
        [round(M['catch'] + 1.75, 3), 1.8, 'Your turn!'],
    ],
}

retimed = [
    {**w, 'startMs': round(video(w['startMs'] / 1000) * 1000), 'endMs': round(video(w['endMs'] / 1000) * 1000)}
    for w in words
]

# --- lip-sync: per-frame mouth shape + loudness from the VO as placed in the video ----------
# Visemes (src/legion/Vee.tsx MOUTHS): 0 rest smile, 1 closed-talk, 2 small, 3 mid, 4 wide, 5 "O".
FPS = 30
with wave.open(str(L / 'vo.wav')) as w:
    sr = w.getframerate()
    src = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
placed = np.zeros(int(DURATION * sr))
for s in segments:
    part = src[int(s['from'] * sr):int(s['to'] * sr)]
    i = int(round(s['at'] * sr))
    placed[i:i + len(part)] = part[: len(placed) - i]
LEAD = 0.03  # mouth shapes lead the sound slightly, like animators do
win = int(0.04 * sr)
rms = np.array([
    np.sqrt(np.mean(placed[max(0, int((f / FPS + LEAD) * sr) - win // 2):int((f / FPS + LEAD) * sr) + win // 2] ** 2) + 1e-12)
    for f in range(int(DURATION * FPS))
])
loud = np.clip(rms / np.percentile(rms[rms > 0.01], 95), 0, 1) ** 0.7
speaking = [any(w['startMs'] - 60 <= f * 1000 / FPS <= w['endMs'] + 60 for w in retimed) for f in range(len(loud))]
ROUND = {'your', 'ones', 'wrong', 'you', 'do', 'show', 'looks', 'good', 'to', 'who'}  # lips round: "O"
round_vowel = [any(w['startMs'] <= f * 1000 / FPS <= w['endMs'] and re.sub(r'\W', '', w['text']).lower() in ROUND for w in retimed)
               for f in range(len(loud))]
mouth, silent = [], 0
for f, o in enumerate(loud):  # thresholds sit near the speech loudness quartiles
    silent = 0 if speaking[f] else silent + 1
    if silent > 0.3 * FPS:
        v = 0
    elif o < 0.2:
        v = 1
    elif round_vowel[f] and o >= 0.4:
        v = 5
    else:
        v = 2 if o < 0.45 else 3 if o < 0.72 else 4
    mouth.append(v)
for f in range(1, len(mouth) - 1):  # 2-frame minimum hold: no single-frame flicker
    if mouth[f] != mouth[f - 1] and mouth[f] != mouth[f + 1]:
        mouth[f] = mouth[f - 1]

out = {'fps': 30, 'duration': DURATION, 'segments': segments, 'scenes': scenes, 'marks': marks, 'actions': actions, 'words': retimed,
       'mouth': mouth, 'loud': [round(float(x), 2) for x in loud]}
(L / 'cues.json').write_text(json.dumps(out, indent=1), encoding='utf-8')
print(json.dumps({'scenes': scenes, 'marks': marks, 'segments': segments}, indent=1))
