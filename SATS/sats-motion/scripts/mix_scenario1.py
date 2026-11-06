"""Scenario 1 mix -> public/audio/mix.scenario1.wav (does not touch mix.wav)."""
import json
import wave
from pathlib import Path

import numpy as np
from scipy import signal

from mix import add, hp, music, phone, read, sfx, SR

ROOT = Path(__file__).resolve().parents[1]
TL = json.loads((ROOT / 'src' / 'data' / 'timeline.scenario1.json').read_text())
AUD = ROOT / 'public' / 'audio'
N = int(TL['total'] * SR) + SR


def main():
    voice = np.zeros(N)
    for key, ln in TL['lines'].items():
        sub = 'vo' if key.startswith('vo') else 'call'
        path = AUD / sub / f'{key}.wav'
        if not path.exists():
            raise SystemExit(f'missing {path}')
        x = read(path)
        x = x / (np.max(np.abs(x)) + 1e-9) * 0.62
        if ln['who'] in ('consignee', 'counter'):
            x = phone(x)
        else:
            x = hp(x, 70 if ln['who'] == 'narrator' else 110)
        add(voice, x, ln['at'])

    fx = np.zeros(N)
    for e in TL['sfx']:
        add(fx, sfx(e['name']), e['at'], e['gain'])

    full = music()
    m = full[:, :N] if full.shape[1] >= N else np.concatenate([full, np.zeros((2, N - full.shape[1]))], axis=1)
    t = np.arange(N) / SR
    level = np.interp(t, [0, 1.5, 4, TL['total'] - 2.2, TL['total']], [0.0, 0.45, 0.38, 0.5, 0.0])
    e = signal.sosfiltfilt(signal.butter(1, 3, fs=SR, output='sos'), np.abs(voice))
    duck = 1 - 0.55 * np.clip(e / 0.05, 0, 1)
    m = m * level * duck * 0.16

    mix = m + np.stack([voice + fx, voice + fx])
    peak = np.max(np.abs(mix))
    mix = mix / (peak + 1e-12) * 0.89
    out = AUD / 'mix.scenario1.wav'
    with wave.open(str(out), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix.T * 32767).astype(np.int16).tobytes())
    print(f'wrote {out} {N / SR:.1f}s, peak before norm {peak:.2f}')


if __name__ == '__main__':
    main()
