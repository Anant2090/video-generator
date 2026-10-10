"""Original music bed + SFX for the Legion promo, synthesized (no licensing), locked to cues.json.

  python scripts/legion_audio.py   -> public/legion/music.wav, public/legion/sfx.wav (48 kHz stereo)

SFX times mirror the animation timing in src/legion/scenes.tsx (comments name the scene).
"""
import json
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
L = Path(__file__).resolve().parents[1] / 'public' / 'legion'
cues = json.loads((L / 'cues.json').read_text(encoding='utf-8'))
SC, MK = cues['scenes'], cues['marks']
DUR = cues['duration']
N = int(SR * DUR)
rng = np.random.default_rng(7)

BPM = 124
BEAT = 60 / BPM
BAR = 4 * BEAT
DROP = SC['reveal']  # downbeat of the groove = "Meet VEE Legion"


# --- primitives ----------------------------------------------------------------------
def ts(sec):
    return np.arange(int(sec * SR)) / SR


def filt(x, kind, f):
    return sosfilt(butter(2, f, kind, fs=SR, output='sos'), x)


def add(buf, sig, at, gain=1.0):
    i = int(round(at * SR))
    if i < 0:
        sig, i = sig[-i:], 0
    n = min(len(sig), len(buf) - i)
    if n > 0:
        buf[i:i + n] += sig[:n] * gain


def saw(f, t, detune=0.0):
    return 2 * ((t * f * (1 + detune)) % 1) - 1


def noise(sec):
    return rng.uniform(-1, 1, int(sec * SR))


def kick():
    t = ts(0.42)
    f = 46 + 95 * np.exp(-t / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)
    return body + filt(noise(0.42), 'highpass', 3000) * np.exp(-t / 0.004) * 0.3


def clap():
    t = ts(0.25)
    env = sum(np.exp(-np.clip(t - d, 0, None) / 0.012) * (t >= d) for d in (0, 0.011, 0.022)) + 0.6 * np.exp(-t / 0.09)
    return filt(noise(0.25), 'bandpass', [900, 4200]) * env * 0.6


def hat(open_=False):
    t = ts(0.2)
    return filt(noise(0.2), 'highpass', 7500) * np.exp(-t / (0.07 if open_ else 0.022)) * 0.35


NOTE = {n: 440 * 2 ** ((i - 9) / 12) for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}


def hz(name, octave):
    return NOTE[name] * 2 ** (octave - 4)


CHORDS = [('A', ['A', 'C', 'E']), ('F', ['F', 'A', 'C']), ('C', ['C', 'E', 'G']), ('G', ['G', 'B', 'D'])]  # Am F C G


def chord_at(t):
    return CHORDS[int(np.floor((t - DROP) / BAR)) % 4] if t >= DROP else CHORDS[0]


# --- music stems -----------------------------------------------------------------------
drums = np.zeros(N)
bass = np.zeros(N)
pad = np.zeros(N)
arp = np.zeros(N)
fx = np.zeros(N)

why0, why1 = SC['why'], SC['real']  # "the why": groove drops out for tension
end_hit = DROP + np.ceil((MK['voEnd'] - DROP) / BAR) * BAR  # first downbeat after the last word

beats = np.arange(np.floor(-DROP / BEAT), (DUR - DROP) / BEAT) * BEAT + DROP
for b in beats:
    if b < 0 or b >= end_hit:
        continue
    step = int(round((b - DROP) / BEAT)) % 4
    tension = why0 <= b < why1
    if b < DROP:  # intro: heartbeat kick on 1 and 3, closed hats on the off-beat
        if step % 2 == 0:
            add(drums, kick(), b, 0.35)
        add(drums, hat(), b + BEAT / 2, 0.25)
        continue
    if not tension:
        add(drums, kick(), b, 0.9)
        if step in (1, 3):
            add(drums, clap(), b, 0.8)
    add(drums, hat(open_=True), b + BEAT / 2, 0.55 if not tension else 0.3)
    if SC['build'] <= b < SC['scores'] or b >= SC['cta']:  # lift: 16th hats
        add(drums, hat(), b + BEAT / 4, 0.3)
        add(drums, hat(), b + 3 * BEAT / 4, 0.3)
    # bass: 8ths on the chord root (octave 2), plucky filtered saw + sub
    root = hz(chord_at(b)[0], 2)
    for e in (0, BEAT / 2):
        t = ts(BEAT / 2)
        note = (0.7 * saw(root, t) + 0.6 * np.sin(2 * np.pi * root / 2 * t)) * np.exp(-t / 0.16)
        add(bass, filt(note, 'lowpass', 700 if not tension else 350), b + e, 0.5)
add(drums, kick(), end_hit, 1.0)

# pad: detuned saws per chord bar, soft attack; intro filter opens toward the drop
for bar in np.arange(np.floor(-DROP / BAR), (DUR - DROP) / BAR) * BAR + DROP:
    start = max(bar, 0.0)
    length = min(bar + BAR, end_hit + 2 * BAR if bar >= end_hit else DUR) - start
    if length <= 0 or bar > end_hit:
        continue
    t = ts(length + 0.4)
    tones = sum(saw(hz(n, 3 if n in 'GAB' else 4), t, d) for n in chord_at(bar + 0.01)[1] for d in (-0.004, 0, 0.004))
    env = np.minimum(1, t / 0.25) * np.clip((length + 0.4 - t) / 0.4, 0, 1)
    if bar >= end_hit:  # final chord rings out
        env = np.minimum(1, t / 0.05) * np.exp(-t / 1.4)
    cutoff = 600 + 1800 * min(1, max(0, start) / DROP) if bar < DROP else 2600
    add(pad, filt(tones * env, 'lowpass', cutoff), start, 0.07)

# arp: 16th-note plucks over the chord in the legion + scores stretches (playful energy)
for b in beats:
    if not (SC['legion'] <= b < SC['why'] or SC['cta'] <= b < end_hit):
        continue
    notes = chord_at(b)[1]
    for j in range(4):
        f = hz(notes[j % 3], 5) * (2 if j == 3 else 1)
        t = ts(0.2)
        add(arp, filt(saw(f, t) * np.exp(-t / 0.07), 'lowpass', 3200), b + j * BEAT / 4, 0.12)

# risers into the drop and into the CTA; crash on the drop
for hit in (DROP, SC['cta']):
    t = ts(1.3)
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / 1.3) ** 2) / SR)
    add(fx, (filt(noise(1.3), 'highpass', 2500) * 0.6 + sweep * 0.25) * (t / 1.3) ** 2.5, hit - 1.3, 0.5)
    t = ts(1.6)
    add(fx, filt(noise(1.6), 'highpass', 5000) * np.exp(-t / 0.45), hit, 0.45)

music = drums + bass + pad + arp + fx

# duck under the voice (words +/- 80 ms, smoothed)
duck = np.ones(N)
for w in cues['words']:
    duck[int((w['startMs'] - 80) * SR / 1000):int((w['endMs'] + 80) * SR / 1000)] = 0.5
duck = np.convolve(duck, np.ones(int(0.06 * SR)) / int(0.06 * SR), mode='same')
music *= duck
music *= np.minimum(1, np.clip((DUR - ts(DUR)[:N]) / 1.0, 0, 1))  # fade last second

# --- SFX ------------------------------------------------------------------------------
sfx = np.zeros(N)


def err(at):  # failure buzz
    t = ts(0.22)
    tone = np.sign(np.sin(2 * np.pi * (190 - 60 * t) * t)) * np.exp(-t / 0.08)
    add(sfx, filt(tone, 'lowpass', 1800), at, 0.28)


def pop_(at, pitch=1.0):
    t = ts(0.1)
    add(sfx, np.sin(2 * np.pi * np.cumsum(520 * pitch + 900 * pitch * t) / SR) * np.exp(-t / 0.03), at, 0.35)


def click(at):
    t = ts(0.03)
    add(sfx, filt(noise(0.03), 'bandpass', [1500, 6000]) * np.exp(-t / 0.004), at, 0.6)


def key(at):
    t = ts(0.03)
    add(sfx, filt(noise(0.03), 'bandpass', [2500, 7000]) * np.exp(-t / 0.006), at, 0.22)


def whoosh(at, sec=0.34):
    t = ts(sec)
    add(sfx, filt(noise(sec), 'bandpass', [400, 3500]) * np.sin(np.pi * t / sec) ** 2, at - sec / 2, 0.35)


def chime(at, gain=0.3):
    t = ts(1.0)
    add(sfx, sum(np.sin(2 * np.pi * f * t) * np.exp(-t / d) * a for f, d, a in ((1318.5, 0.5, 1), (1760, 0.35, 0.6), (2637, 0.2, 0.3))), at, gain)


def ping(at, f):
    t = ts(0.5)
    add(sfx, (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t / 0.18), at, 0.25)


def glitch(at):
    t = ts(0.22)
    chop = (np.floor(t * 60) % 2) * np.sign(np.sin(2 * np.pi * rng.uniform(300, 900) * t))
    add(sfx, np.round(filt(noise(0.22), 'bandpass', [800, 5000]) * 6) / 6 * 0.5 + chop * 0.25, at, 0.35)


def thud(at, gain=0.5, f0=110):  # impact: low body + short click
    t = ts(0.3)
    body = np.sin(2 * np.pi * np.cumsum(f0 + 90 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.09)
    add(sfx, body + filt(noise(0.3), 'bandpass', [1500, 5000]) * np.exp(-t / 0.006) * 0.5, at, gain)


def swish(at, gain=0.25):  # quick flick of the hand / a card flying
    t = ts(0.16)
    add(sfx, filt(noise(0.16), 'bandpass', [1800, 7000]) * np.sin(np.pi * t / 0.16) ** 2, at - 0.06, gain)


# VEE's physical actions — times from cues.json 'actions' (same numbers src/legion/choreo.ts animates)
AC = cues['actions']
HOP_D = AC['hopDur']
for start, _name in AC['hops']:  # hop: push-off whoosh, landing thud
    whoosh(start + 0.2, 0.3)
    thud(start + HOP_D * 0.82, 0.32, 90)
for f in AC['deal']:  # legion: a flick per 3 dealt cards, each card lands with a pop
    swish(f, 0.3)
    for j in range(3):
        pop_(f + j * 0.04 + 0.42, 1 + 0.15 * j)
for tap in AC['taps']:  # build: fingertip taps
    click(tap)
thud(AC['run'], 0.7, 70)  # live: RUN slam
click(AC['run'] + 0.01)
for f in AC['statDeal']:  # scores: stat cards dealt
    swish(f, 0.3)
    pop_(f + 0.36, 1.2)
thud(AC['stamp'], 0.85, 60)  # why: FAIL stamp slam
swish(AC['drop'], 0.3)  # real: file thrown into the window
pop_(AC['drop'] + 0.28, 0.7)
click(AC['press'])  # cta: button press
thud(AC['press'], 0.25, 160)
for at, _dur, _text in AC['bubbles']:  # speech bubbles pop
    pop_(at, 1.35)

# hook — three calls flip red (scenes.tsx Hook: which + 0.15 + j*0.28, mid-flip +0.14)
for j in range(3):
    err(MK['which'] + 0.15 + j * 0.28 + 0.14)
# reveal — dither wipe, logo pop
whoosh(SC['reveal'])
pop_(MK['meet'] + 0.05, 0.8)
# legion — persona pulses, troublemaker glitches
ping(MK['frustrated'], 988)
ping(MK['confused'], 1175)
for j in range(4):
    glitch(MK['troublemakers'] - 0.05 + j * 0.09)
# build — rule typing after the last tap (scenes.tsx Build frame timing)
t4, b1 = AC['taps'][3], SC['live']
for i in range(1, 22):
    key(t4 + 0.06 + i * (b1 - t4 - 0.15) / 22)
# live — done chime (0.85 s after the RUN slam)
chime(AC['run'] + 0.85, 0.22)
# why — the two failure reasons land after the stamp
err(AC['stamp'] + 0.15)
err(AC['stamp'] + 0.5)
# real — scored chime when the file lands
chime(AC['drop'] + 0.28 + 0.3, 0.25)
# cta — button pop-in
pop_(MK['catch'] + 1.05, 0.9)


def write(name, x):
    x = np.tanh(x * 1.1)
    x = x / max(1e-9, np.abs(x).max()) * 0.89
    st = np.stack([x, x], 1)
    with wave.open(str(L / name), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype('<i2').tobytes())
    print('wrote', name, f'{len(x) / SR:.2f}s')


write('music.wav', music)
write('sfx.wav', sfx)
