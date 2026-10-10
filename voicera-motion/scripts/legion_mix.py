"""Final audio for the Legion promo: sample-exact VO placement + balanced mix, remuxed onto the render.

  python scripts/legion_mix.py   (after `npx remotion render LegionPromo out/legion-promo.mp4`)
  -> out/legion-promo-final.mp4
  python scripts/legion_mix.py VIDEO OUT START   partial render (--frames=...) starting at START seconds

Remotion's rendered audio lands ~43 ms late (measured; same offset as the VEE demo), so the
render's own audio track is replaced, never used.
"""
import json
import os
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parents[1]
L = ROOT / 'public' / os.environ.get('LEGION', 'legion')  # LEGION=legion5 mixes the v5 promo
FF = ROOT / 'node_modules' / '@remotion' / 'compositor-win32-x64-msvc' / 'ffmpeg.exe'
SR = 48000
cues = json.loads((L / 'cues.json').read_text(encoding='utf-8'))
N = int(cues['duration'] * SR)


def read(name):
    with wave.open(str(L / name)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
        x = x.reshape(-1, w.getnchannels()).mean(1)
        return resample_poly(x, SR, w.getframerate()) if w.getframerate() != SR else x


def db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


vo_src = read('vo.wav')
vo = np.zeros(N)
for seg in cues['segments']:
    a, b = int(seg['from'] * SR), int(seg['to'] * SR)
    i = int(round(seg['at'] * SR))
    part = vo_src[a:b][: N - i]
    vo[i:i + len(part)] += part

speech = np.zeros(N, bool)
for w in cues['words']:
    speech[int(w['startMs'] * SR / 1000):int(w['endMs'] * SR / 1000)] = True

music, sfx = read('music.wav'), read('sfx.wav')
# Targets (dBFS RMS): voice on top, bed clearly under it, SFX as accents.
vo *= 10 ** ((-16 - db(vo[speech])) / 20)
music *= 10 ** ((-25 - db(music[~speech])) / 20)
sfx *= 10 ** ((-9 - 20 * np.log10(np.abs(sfx).max() + 1e-12)) / 20)  # sfx peaks at -9 dBFS

mix = vo + music + sfx
mix = np.tanh(mix * 1.2) / 1.2  # gentle soft-clip on the rare coincident peaks
mix *= 10 ** (-1 / 20) / np.abs(mix).max()  # peak -1 dBFS
print(f'speech {db(mix[speech]):.1f} dB | gaps {db(mix[~speech]):.1f} dB | peak -1.0 dBFS')

video, final, start = (sys.argv[1:4] + [None] * 3)[:3] if len(sys.argv) > 1 else ('out/legion-promo.mp4', 'out/legion-promo-final.mp4', None)
mix = mix[int(float(start) * SR):] if start else mix  # sample-exact window for partial renders

out_wav = ROOT / 'out' / 'legion-mix.wav'
with wave.open(str(out_wav), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.stack([mix, mix], 1) * 32767).astype('<i2').tobytes())

subprocess.run(
    [str(FF), '-v', 'error', '-y', '-i', str(ROOT / video), '-i', str(out_wav),
     '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', str(ROOT / final)],
    check=True,
)
print('wrote', final)
