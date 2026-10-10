"""Sonic-logo drafts for the end card -> out/sonic/logo_<a|b|c>.wav + preview_<a|b|c>.mp4

Each logo is 6.0 s long and starts with the demo card (t=0); the title wipe runs 0.45-1.25 s,
so every draft lands its main hit at 0.45 s and rings out before the loop seam at 6.0 s.
  a  ring -> answered: soft ring cut off by a pick-up click, rising three-note V-E-E motif
  b  voice chord: the narrator's "VEE" stacked into a sung chord that holds as a choir
  c  voice -> tone: "VEE" freezes and dissolves into a pure tone that blooms into a chord
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'out' / 'sonic'
SR = 48000
DUR = 6.0
CARD_AT = 183.03  # output seconds where the demo card starts (finalize.py fade_at)
VEE = (23.155, 23.405)  # source seconds of the narrator's "VEE" in "Let's see how VEE handles a call"
HIT = 0.45

rng = np.random.default_rng(7)
G3, B3, D4, A4, G4, B4, D5, B5 = 196.0, 246.94, 293.66, 440.0, 392.0, 493.88, 587.33, 987.77


def t_(d):
    return np.arange(int(d * SR)) / SR


def lp(x, hz, order=2):
    return sosfilt(butter(order, hz, 'low', fs=SR, output='sos'), x, axis=0)


def hp(x, hz, order=2):
    return sosfilt(butter(order, hz, 'high', fs=SR, output='sos'), x, axis=0)


def track():
    return np.zeros((int(DUR * SR), 2))


def put(buf, x, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    x = x[: max(0, len(buf) - i)]
    if x.ndim == 1:
        x = np.stack([x * np.sqrt((1 - pan) / 2), x * np.sqrt((1 + pan) / 2)], 1) * np.sqrt(2)
    buf[i:i + len(x)] += x * gain


def env(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na) ** 2
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e


def keys(f, d=3.5, bright=1.0):
    """Felt-piano-ish: soft attack, upper partials die faster, slight chorus."""
    t = t_(d)
    x = np.zeros_like(t)
    for cents in (-3, 3):
        ff = f * 2 ** (cents / 1200)
        for n in range(1, 9):
            x += np.sin(2 * np.pi * ff * n * t + rng.uniform(0, 6)) * (bright / n ** 1.8) * np.exp(-t * (1.2 + 1.6 * n))
    return x * env(len(t), 0.006, 0.3) * 0.5


def bell(f, d=3.5):
    """Soft FM bell, low index so it stays warm."""
    t = t_(d)
    idx = 1.6 * np.exp(-t * 3)
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t)) * np.exp(-t * 1.1)
    return x * env(len(t), 0.003, 0.4) * 0.35


def pad(freqs, d, a=0.6, r=2.0):
    t = t_(d)
    x = np.zeros((len(t), 2))
    for f in freqs:
        for ch, cents in ((0, -6), (1, 6)):
            ff = f * 2 ** (cents / 1200)
            for n in range(1, 7):
                x[:, ch] += np.sin(2 * np.pi * ff * n * t + rng.uniform(0, 6)) / n ** 1.5
    x = lp(x, 1400, 2) * env(len(t), a, r)[:, None]
    return x / len(freqs) * 0.35


def sub(f, d):
    t = t_(d)
    return np.sin(2 * np.pi * f * t) * env(len(t), 0.25, 1.8) * 0.35


def reverb(x, rt60=2.4, wet=0.32):
    n = int(rt60 * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-6.9 * t / rt60)[:, None]
    ir = lp(ir, 5000, 1)
    ir[: int(0.012 * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum(0))
    w = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], 1)
    return x * (1 - wet) + w * wet * 1.6


def finish(x):
    x = hp(x, 40)
    fade = int(0.5 * SR)
    x[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
    return x / np.abs(x).max() * 0.7


def ffmpeg(*a):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr)


def write(path, x):
    ch = x.shape[1] if x.ndim > 1 else 1
    p = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', str(ch), '-i', '-', '-c:a', 'pcm_s24le', str(path)],
                       input=x.astype(np.float32).tobytes(), capture_output=True)
    if p.returncode:
        sys.exit(p.stderr.decode())


def read(path, ss=None, t=None, af=None):
    a = ['ffmpeg', '-v', 'error']
    if ss is not None:
        a += ['-ss', str(ss), '-t', str(t)]
    a += ['-i', str(path), '-vn', '-ac', '1', '-ar', str(SR)]
    if af:
        a += ['-af', af]
    return np.frombuffer(subprocess.run(a + ['-f', 'f32le', '-'], capture_output=True).stdout, np.float32).astype(float)


# ---- voice material ---------------------------------------------------------
def vee_word():
    x = read(ROOT / 'public' / 'source.mp4', VEE[0], VEE[1] - VEE[0])
    return x * env(len(x), 0.012, 0.05)


def f0(x):
    seg = x[int(0.06 * SR): int(0.2 * SR)]
    ac = np.correlate(seg, seg, 'full')[len(seg) - 1:]
    lo, hi = int(SR / 400), int(SR / 70)
    return SR / (lo + np.argmax(ac[lo:hi]))


def shifted(x, ratio):
    tmp = OUT / '_v.wav'
    tmp2 = OUT / '_v2.wav'
    write(tmp, x)
    ffmpeg('-i', str(tmp), '-af', f'rubberband=pitch={ratio}:formant=preserved:pitchq=quality', str(tmp2))
    return read(tmp2)


def freeze(x, d, at=0.12, n=4096):
    """Hold the vowel's spectrum at `at` s as a sustained, choir-like tone."""
    i = int(at * SR)
    w = np.hanning(n)
    mag = np.abs(np.fft.rfft(x[i:i + n] * w))
    hop = n // 4
    out = np.zeros(int(d * SR) + n)
    for k in range(0, int(d * SR), hop):
        ph = np.exp(1j * rng.uniform(0, 2 * np.pi, len(mag)))
        out[k:k + n] += np.fft.irfft(mag * ph) * w
    out = out[: int(d * SR)]
    return out / (np.abs(out).max() + 1e-9)


# ---- drafts -----------------------------------------------------------------
def draft_a():
    buf = track()
    # soft trill ring, two short bursts, the second one cut off by the pick-up
    t = t_(0.42)
    trill = (np.sin(2 * np.pi * B5 * t) + 0.6 * np.sin(2 * np.pi * D5 * 2 * t)) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 16 * t)))
    trill = lp(trill, 2500) * env(len(t), 0.01, 0.0)
    gate = np.ones(len(t))
    gate[int(0.16 * SR): int(0.24 * SR)] = 0
    trill *= lp(gate, 200)
    trill[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
    put(buf, trill, 0.0, 0.18)
    # pick-up click: tiny filtered noise tick + low thump
    c = t_(0.03)
    click = lp(hp(rng.standard_normal(len(c)), 1500), 6000) * np.exp(-c * 300) * 0.5 + np.sin(2 * np.pi * 110 * c) * np.exp(-c * 120)
    put(buf, click, 0.41, 0.5)
    # V-E-E: rising G4 -> D5 -> B5, the last note held
    for at, f, pan in ((HIT, G4, -0.25), (HIT + 0.17, D5, 0.1), (HIT + 0.34, B5, 0.3)):
        put(buf, keys(f, 4.0), at, 0.9, pan)
        put(buf, bell(f, 3.5), at, 0.5, pan)
    put(buf, bell(B5 * 2, 3.0), HIT + 0.34, 0.12, 0.4)
    put(buf, pad([G3, B3, D4, A4], 5.0, a=0.5, r=2.5), HIT + 0.3, 1.0)
    put(buf, sub(G3 / 2, 5.0), HIT + 0.3, 0.8)
    return finish(reverb(buf))


CHORD = sorted(G3 * 2 ** (o + s / 12) for o in range(-2, 3) for s in (0, 4, 7))  # G major tones


def nearest_tone(f):
    return min(CHORD, key=lambda c: abs(np.log(c / f)))


def draft_b(word, base):
    buf = track()
    i0 = CHORD.index(nearest_tone(base))
    stack = [(shifted(word, CHORD[i0 + k] / base), pan, dt) for k, pan, dt in ((0, -0.3, 0.0), (1, 0.3, 0.05), (2, -0.1, 0.1), (3, 0.2, 0.15))]
    for i, (v, pan, dt) in enumerate(stack):
        put(buf, v, HIT + dt, 0.55 if i else 0.75, pan)
        hold = freeze(v, 3.6) * env(int(3.6 * SR), 0.15, 2.2)
        put(buf, lp(hold, 3500), HIT + dt + 0.18, 0.22, pan)
    put(buf, bell(G4, 3.5), HIT, 0.35, 0)
    put(buf, bell(D5, 3.5), HIT + 0.1, 0.2, 0.2)
    put(buf, sub(G3 / 2, 4.5), HIT + 0.1, 0.6)
    return finish(reverb(buf, wet=0.4))


def draft_c(word, base):
    buf = track()
    root = nearest_tone(base)
    v = shifted(word, root / base)
    put(buf, v, 0.15, 0.8)
    # the vowel freezes, then narrows into a pure tone on the same pitch
    d = 1.4
    fr = freeze(v, d)
    t = t_(d)
    tone = sum(np.sin(2 * np.pi * root * n * t) / n ** 2 for n in range(1, 5))
    k = np.clip((t - 0.15) / 0.9, 0, 1) ** 1.5
    morph = fr * (1 - k) * 0.6 + tone * k * 0.6
    morph *= env(len(t), 0.05, 0.0)
    put(buf, morph, 0.15 + (VEE[1] - VEE[0]) * 0.55, 0.5)
    # bloom into the chord as the title finishes revealing
    bloom = HIT + 0.85
    for f, pan, dt in ((G4, -0.2, 0), (B4, 0.2, 0.04), (D5, -0.05, 0.08), (A4 * 2, 0.3, 0.12)):
        put(buf, keys(f, 3.8, 0.8), bloom + dt, 0.7, pan)
        put(buf, bell(f, 3.4), bloom + dt, 0.35, pan)
    put(buf, pad([G3, B3, D4, A4], 4.0, a=0.3, r=2.5), bloom - 0.1, 1.0)
    put(buf, sub(G3 / 2, 4.0), bloom, 0.8)
    return finish(reverb(buf))


def preview(name):
    """Last 10 s of the final cut with the logo mixed in at the demo card."""
    final = ROOT / 'out' / 'vee-concierge-booth.mp4'
    start = CARD_AT - 4.0
    ffmpeg('-ss', f'{start}', '-i', str(final), '-i', str(OUT / f'logo_{name}.wav'),
           '-filter_complex', f'[1:a]loudnorm=I=-15:TP=-1.5,aresample=48000,adelay=4000|4000[l];[0:a][l]amix=inputs=2:normalize=0:duration=first[a]',
           '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-crf', '16', '-c:a', 'aac', '-b:a', '256k', str(OUT / f'preview_{name}.mp4'))


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    word = vee_word()
    base = f0(word)
    print(f'narrator "VEE" pitch ~{base:.0f} Hz')
    for name, make in (('a', draft_a), ('b', lambda: draft_b(word, base)), ('c', lambda: draft_c(word, base))):
        write(OUT / f'logo_{name}.wav', make())
        preview(name)
        print('->', OUT / f'preview_{name}.mp4')
    for p in OUT.glob('_v*.wav'):
        p.unlink()
