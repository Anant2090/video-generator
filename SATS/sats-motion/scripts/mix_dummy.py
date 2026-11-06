"""Voice + SFX + music for the dummy cut -> public/audio/mix.dummy.wav (does not touch mix.wav)."""
import json
import wave
from pathlib import Path

import numpy as np
from scipy import signal

from mix import add, music, read, sfx, SR

ROOT = Path(__file__).resolve().parents[1]
TL = json.loads((ROOT / 'src' / 'data' / 'timeline.dummy.json').read_text())
AUD = ROOT / 'public' / 'audio' / 'dummy'
N = int(TL['total'] * SR) + SR


def main():
    voice = np.zeros(N)
    for key, ln in TL['lines'].items():
        path = AUD / f'{key}.wav'
        if not path.exists():
            raise SystemExit(f'missing {path} — run python scripts/dummy_audio.py first')
        x = read(path)
        peak_x = np.max(np.abs(x)) + 1e-9
        x = x / peak_x * 0.62
        x = signal.sosfilt(signal.butter(2, 70, 'highpass', fs=SR, output='sos'), x)
        add(voice, x, ln['at'])

    fx = np.zeros(N)
    for e in TL['sfx']:
        add(fx, sfx(e['name']), e['at'], e['gain'])

    full = music()
    if full.shape[1] < N:
        m = np.concatenate([full, np.zeros((2, N - full.shape[1]))], axis=1)
    else:
        m = full[:, :N]
    t = np.arange(N) / SR
    sc = {s['name']: s for s in TL['scenes']}
    level = np.interp(
        t,
        [0, 2, sc['dashboard']['start'], sc['end']['start'], sc['end']['start'] + 1.5, TL['total'] - 2, TL['total']],
        [0.0, 0.65, 0.75, 0.85, 1.0, 0.9, 0.0],
    )
    e = signal.sosfiltfilt(signal.butter(1, 3, fs=SR, output='sos'), np.abs(voice))
    duck = 1 - 0.5 * np.clip(e / 0.05, 0, 1)
    m = m * level * duck * 0.14

    mix = m + np.stack([voice + fx, voice + fx])
    peak = np.max(np.abs(mix))
    mix = mix / (peak + 1e-12) * 0.89
    out = ROOT / 'public' / 'audio' / 'mix.dummy.wav'
    out.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix.T * 32767).astype(np.int16).tobytes())
    print(f'wrote {out} {N / SR:.1f}s, peak before norm {peak:.2f}')


if __name__ == '__main__':
    main()
