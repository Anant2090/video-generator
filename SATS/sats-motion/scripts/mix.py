"""Synthesised music + sound effects + all voice lines -> public/audio/mix.wav (48 kHz stereo).

Music and effects are generated here (no licensed assets). The consignee and counter get a phone-line
filter; the narrator and agent stay clean. The music ducks under speech and sits lower during calls.
"""
import json
import wave
from pathlib import Path

import numpy as np
from scipy import signal

ROOT = Path(__file__).resolve().parents[1]
TL = json.loads((ROOT / 'src' / 'data' / 'timeline.json').read_text())
SR = 48000
N = int(TL['total'] * SR) + SR
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(d, a, r):
    t = t_(d)
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / r)


def bp(x, lo, hi, order=4):
    return signal.sosfilt(signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)


def lp(x, hz, order=2):
    return signal.sosfilt(signal.butter(order, hz, 'lowpass', fs=SR, output='sos'), x)


def hp(x, hz, order=2):
    return signal.sosfilt(signal.butter(order, hz, 'highpass', fs=SR, output='sos'), x)


def reverb(x, secs=2.4, wet=0.25):
    ir = rng.standard_normal(int(secs * SR)) * np.exp(-t_(secs) * 6.5 / secs)
    ir = lp(ir, 6000)
    ir /= np.sqrt(np.sum(ir ** 2))
    return x + wet * signal.fftconvolve(x, ir)[:len(x)]


def read(path: Path) -> np.ndarray:
    with wave.open(str(path)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
        return signal.resample_poly(x, SR // 100, w.getframerate() // 100)


def note(f):
    return 440 * 2 ** ((f - 69) / 12)


# ---------------------------------------------------------------- music
def music() -> np.ndarray:
    beat = 60 / 88
    bar = beat * 4
    prog = [[50, 57, 62, 66], [45, 57, 61, 64], [47, 54, 62, 66], [43, 55, 59, 62]]  # D, A, Bm, G
    L, R = np.zeros(N), np.zeros(N)
    t0 = 0.0
    i = 0
    while t0 < N / SR:
        chord = prog[i % 4]
        d = bar * 2
        seg = t_(d + 2.5)
        a = np.minimum(1, seg / 1.2) * np.minimum(1, np.maximum(0, d + 2.5 - seg) / 2.5)
        for k, m in enumerate(chord):
            f = note(m)
            for det, side in ((-0.12, L), (0.12, R)):
                tone = np.sin(2 * np.pi * (f * (1 + det / 100)) * seg) + 0.25 * np.sin(2 * np.pi * 2 * f * seg + k)
                tone *= a * (0.9 + 0.1 * np.sin(2 * np.pi * 0.2 * seg + k)) * (0.055 if k else 0.07)
                s = int(t0 * SR)
                side[s:s + len(tone)] += tone[:max(0, min(len(tone), N - s))]
        # soft arpeggio pluck on eighths
        arp = [chord[1] + 12, chord[2] + 12, chord[3] + 12, chord[2] + 12]
        for j in range(int(d / (beat / 2))):
            f = note(arp[j % 4])
            pl = np.sin(2 * np.pi * f * t_(0.6)) * env(0.6, 0.004, 0.18) * 0.022
            s = int((t0 + j * beat / 2) * SR)
            side = L if j % 2 else R
            side[s:s + len(pl)] += pl[:max(0, min(len(pl), N - s))]
        # sub on the downbeats
        sub = np.sin(2 * np.pi * note(chord[0] - 12) * t_(bar * 2)) * env(bar * 2, 0.05, 2.5) * 0.06
        s = int(t0 * SR)
        L[s:s + len(sub)] += sub[:max(0, min(len(sub), N - s))]
        R[s:s + len(sub)] += sub[:max(0, min(len(sub), N - s))]
        t0 += d
        i += 1
    L, R = lp(L, 5200), lp(R, 5200)
    return np.stack([reverb(L, wet=0.35), reverb(R, wet=0.35)])


# ---------------------------------------------------------------- effects
def sfx(name: str) -> np.ndarray:
    if name == 'touchdown':
        thump = np.sin(2 * np.pi * 55 * t_(0.6)) * env(0.6, 0.005, 0.18)
        rumble = lp(rng.standard_normal(int(1.6 * SR)), 300) * env(1.6, 0.02, 0.5) * 0.6
        out = np.zeros(int(1.6 * SR))
        out[:len(thump)] += thump
        return reverb(out + rumble, 1.5, 0.2) * 0.55
    if name == 'tick':
        return np.sin(2 * np.pi * 2400 * t_(0.05)) * env(0.05, 0.001, 0.012) * 0.18
    if name == 'click':
        n = rng.standard_normal(int(0.03 * SR))
        return hp(n, 2000) * env(0.03, 0.0005, 0.004) * 0.35
    if name in ('stream', 'whoosh'):
        d = 0.9 if name == 'stream' else 0.75
        n = rng.standard_normal(int(d * SR))
        t = t_(d)
        lo = 300 + 2600 * (t / d) if name == 'stream' else 500 + 1800 * np.sin(np.pi * t / d)
        # time-varying bandpass via short blocks
        out = np.zeros_like(n)
        blk = 1024
        for s in range(0, len(n), blk):
            f = lo[s]
            out[s:s + blk] = bp(n[max(0, s - 4096):s + blk], f * 0.6, f * 1.6, 2)[-len(n[s:s + blk]):]
        shape = np.sin(np.pi * t / d) ** 2
        return reverb(out * shape, 1.2, 0.3) * (0.16 if name == 'whoosh' else 0.14)
    if name == 'ring':  # soft marimba ringtone, two phrases
        out = np.zeros(int(2.8 * SR))
        for p in (0, 1.35):
            for j, m in enumerate((76, 80, 83, 88)):
                f = note(m)
                tone = (np.sin(2 * np.pi * f * t_(0.7)) + 0.3 * np.sin(2 * np.pi * 4 * f * t_(0.7))) * env(0.7, 0.002, 0.16)
                s = int((p + j * 0.11) * SR)
                out[s:s + len(tone)] += tone
        return reverb(out, 1.2, 0.25) * 0.12
    if name == 'ringback':  # line ringback the caller hears during the transfer (425 Hz)
        out = np.zeros(int(2.4 * SR))
        for s0 in (0.0, 0.6):
            seg = np.sin(2 * np.pi * 425 * t_(0.4)) * np.minimum(1, t_(0.4) / 0.01) * np.minimum(1, (0.4 - t_(0.4)) / 0.01)
            out[int(s0 * SR):int(s0 * SR) + len(seg)] += seg
        return bp(out, 300, 3400) * 0.08
    if name in ('pickup', 'hangup'):
        seq = (72, 79) if name == 'pickup' else (79, 72)
        out = np.zeros(int(0.5 * SR))
        for j, m in enumerate(seq):
            tone = np.sin(2 * np.pi * note(m) * t_(0.25)) * env(0.25, 0.003, 0.07)
            out[int(j * 0.09 * SR):int(j * 0.09 * SR) + len(tone)] += tone
        return out * 0.12
    if name == 'chime':
        out = np.zeros(int(4 * SR))
        for j, m in enumerate((74, 81, 86, 90)):
            tone = (np.sin(2 * np.pi * note(m) * t_(3.5)) + 0.2 * np.sin(2 * np.pi * 2.76 * note(m) * t_(3.5))) * env(3.5, 0.003, 0.9)
            out[int(j * 0.07 * SR):int(j * 0.07 * SR) + len(tone)] += tone
        return reverb(out, 2.5, 0.35) * 0.07
    raise KeyError(name)


def phone(x: np.ndarray) -> np.ndarray:
    y = bp(x, 320, 3300, 4)
    y = np.tanh(y * 2.2) / np.tanh(2.2)
    y += lp(rng.standard_normal(len(y)), 3000) * 0.0025
    return y * 1.15


def add(bus: np.ndarray, x: np.ndarray, at: float, gain=1.0):
    s = int(at * SR)
    n = max(0, min(len(x), bus.shape[-1] - s))
    bus[..., s:s + n] += x[:n] * gain


def main():
    voice = np.zeros(N)
    for key, ln in TL['lines'].items():
        sub = 'vo' if key.startswith('vo') else 'call'
        x = read(ROOT / 'public' / 'audio' / sub / f'{key}.wav')
        x = x / (np.max(np.abs(x)) + 1e-9) * 0.5
        if ln['who'] in ('consignee', 'counter'):
            x = phone(x)
        elif ln['who'] == 'agent':
            x = hp(x, 110)
        else:
            x = hp(x, 70)
        add(voice, x, ln['at'])

    fx = np.zeros(N)
    for e in TL['sfx']:
        add(fx, sfx(e['name']), e['at'], e['gain'])

    m = music()
    # level automation: low under the hook, ducked through the calls, swell into the end card, fade out
    t = np.arange(N) / SR
    sc = {s['name']: s for s in TL['scenes']}
    duck_end = sc.get('pickup', sc['handoffs'])['end']
    level = np.interp(t, [0, 3, sc['challenge']['start'], sc['call']['start'] - 1, sc['call']['start'] + 1,
                          duck_end - 1, duck_end + 1, sc['end']['start'], sc['end']['start'] + 1.5,
                          TL['total'] - 2.5, TL['total']],
                      [0.0, 0.55, 0.8, 0.8, 0.42, 0.42, 0.8, 0.8, 1.1, 1.0, 0.0])
    # sidechain-style duck under speech
    e = signal.sosfiltfilt(signal.butter(1, 3, fs=SR, output='sos'), np.abs(voice))
    duck = 1 - 0.5 * np.clip(e / 0.05, 0, 1)
    m = m * level * duck * 0.25

    speaking = e > 0.02
    db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
    print(f'voice while speaking {db(voice[speaking]):.1f} dB, music while speaking {db(m[0][speaking]):.1f} dB, '
          f'music in gaps {db(m[0][~speaking]):.1f} dB')
    mix = m + np.stack([voice + fx, voice + fx])
    peak = np.max(np.abs(mix))
    mix = mix / peak * 0.89
    out = ROOT / 'public' / 'audio' / 'mix.wav'
    with wave.open(str(out), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix.T * 32767).astype(np.int16).tobytes())
    print(f'wrote {out} {N / SR:.1f}s, peak before norm {peak:.2f}')


if __name__ == '__main__':
    main()
