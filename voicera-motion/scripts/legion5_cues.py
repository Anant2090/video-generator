"""v5: public/legion5/words.json (Cartesia VO timestamps) -> public/legion5/cues.json.

Single source of truth for the v5 Legion promo timeline (src/legion5 + legion5_audio.py):
VO placement, silences inserted between words, re-timed caption words, scene starts, beat marks.
All output times are VIDEO seconds.
"""
import json
import re
import wave
from pathlib import Path

import numpy as np

L = Path(__file__).resolve().parents[1] / 'public' / 'legion5'
words = json.loads((L / 'words.json').read_text(encoding='utf-8'))
# The VO says the letter "V"; on screen the brand is spelled VEE (captions + anchors).
for w in words:
    w['text'] = re.sub(r'^(\s*)V(\W*)$', r'\1VEE\2', w['text'])
text = [w['text'].strip() for w in words]

VO_START = 0.3
# Silence inserted after these words (VO seconds of gap): the slower middle. Each product beat
# gets a readable hold before the next line (builder rule, 240/240 done, stat cards, FAIL reasons,
# the scored import). 'Legion.' pauses both times (reveal lockup, end card).
GAPS = {'wrong?': 0.6, 'Legion.': 0.4, 'troublemakers.': 0.35, 'words.': 1.0, 'once.': 1.6, 'resisted.': 0.6, 'failed.': 1.6, 'checks.': 0.8}

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
    'reveal': at("I'm") - 0.65,  # the wipe finishes, VEE grows in, then waves on "I'm"
    'legion': at('I') - 0.2,  # "I test"
    'build': at('Define') - 0.25,
    'live': at('Run') - 0.15,
    'scores': at('I', 2) - 0.25,  # "And I score"
    'why': at('And', 2) - 0.15,  # "And I show you exactly why"
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
    'run': at('Run'),
    'scoresWord': at('score'),
    'pass': at('pass'),
    'goals': at('goals'),
    'attacks': at('attacks'),
    'exactly': at('exactly'),
    'failed': at('failed.'),
    'real': at('real'),
    'import': at('Import'),
    'scored': at('scored'),
    'checks': at('checks.'),
    'catch': at('Catch'),
    'voEnd': video(words[-1]['endMs'] / 1000),
}
DURATION = float(round(marks['voEnd'] + 3.5))
# --- timing of VEE (bookends only) and the UI beats (video seconds), shared by src/legion5 + legion5_audio.py ---
HOP = 0.6
S, M = scenes, marks
deal = [round(M['legionWord'] - 0.05 + i * 0.3, 3) for i in range(4)]  # 4 bursts x 3 caller cards
taps = [round(S['build'] + d, 3) for d in (0.55, 1.15, 1.9, 2.3)]  # chip, chip | (camera zooms) | rule menu, AI judge
run = round(S['live'] + 0.5, 3)
drop = round(M['import'], 3)  # the call file slides in on "Import"
actions = {
    'hopDur': HOP,
    'veeIn': round(S['reveal'] + 0.34, 3),  # VEE grows in once the reveal's dither wipe (0.32 s) is done
    'hops': [[round(S['legion'] + 0.05, 3), 'legion']],  # [start, place] (places in bubble.ts)
    'deal': deal,
    'veeOut': round(deal[-1] + 0.25, 3),  # VEE shrinks away after the last burst: the product is pure UI
    'veeBack': round(S['cta'] + 0.4, 3),  # and grows back in once the end card's wipe (0.36 s) is done
    'wave': round(M['imVee'] - 0.03, 3),
    'pumps': [round(M['legionName'] - 0.12, 3), round(M['catch'] + 1.95, 3)],
    'taps': taps,
    'typeEnd': round(taps[-1] + 1.5, 3),  # AI judge rule typed out, then holds
    'run': run,  # RUN button click
    'runDone': round(run + 1.8, 3),  # 240/240
    'statDeal': [round(M[w] + 0.1, 3) for w in ('pass', 'goals', 'attacks')],  # each stat on its word
    'stamp': round(M['exactly'] + 0.08, 3),  # FAIL stamp impact
    'drop': drop,
    'dropLand': round(drop + 0.45, 3),
    'importClick': round(drop + 1.0, 3),  # "Import & score" clicked -> the scored report
    'scored': round(M['scored'] - 0.1, 3),  # camera pushes to the result
    'press': round(M['catch'] + 1.35, 3),  # CTA button press
    'bubbles': [
        [round(M['imVee'], 3), 0.9, 'Hi!'],
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
