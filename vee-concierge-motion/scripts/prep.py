"""Source facts -> src/edit.json, public/words.json, public/levels.json.

edit.json   keep-segments in source frames (dead air removed) + hook/tail lengths
words.json  Cartesia word timings (source s) with brand/format fixes applied
levels.json per-source-frame speech level 0..1 (drives the phone waveform)
"""
import json
import re
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'public' / 'source.mp4'
FPS = 30
SRC_FRAMES = 5979

START = 2.533  # frozen silent logo before this is dropped (hook replaces it)
END = 195.8  # IH Miami card after this is replaced by the demo card
HOOK_S = 3.0
TAIL_S = 1.5
KEEP_PAUSE = 0.2  # seconds of silence kept on each side of a cut

# silencedetect -35 dB / 0.8 s; only stretches where the picture is static or covered by the call scene
SILENCES = [
    (65.60, 66.62), (77.06, 79.86), (82.88, 83.80), (104.70, 105.50), (109.13, 110.03),
    (112.42, 113.91), (115.97, 117.03), (121.91, 122.83), (124.29, 125.56), (127.46, 128.74),
    (132.81, 133.45),
]

FIXES = {'p.m.': 'PM', 'p.m.,': 'PM,', '12.45pm,': '12:45 PM,', '1pm': '1 PM', 'Muse': 'Mews', 'V': 'VEE', 'Vee': 'VEE',
         'vConcierge': 'VEE Concierge', 'IHS': 'IH', 'checkout': 'check-out'}


def edit():
    f = lambda s: round(s * FPS)
    segs, cur = [], f(START)
    for s, e in SILENCES:
        segs.append([cur, f(s + KEEP_PAUSE)])
        cur = f(e - KEEP_PAUSE)
    segs.append([cur, f(END)])
    assert all(a < b for a, b in segs)
    out = {'fps': FPS, 'srcFrames': SRC_FRAMES, 'hookFrames': f(HOOK_S), 'tailFrames': f(TAIL_S), 'segments': segs}
    (ROOT / 'src' / 'edit.json').write_text(json.dumps(out, indent=1))
    body = sum(b - a for a, b in segs)
    total = out['hookFrames'] + body + out['tailFrames']
    print(f'edit: {len(segs)} segments, removed {(f(END) - f(START) - body) / FPS:.2f}s, total {total} frames = {total / FPS:.2f}s')


def words():
    raw = json.loads((ROOT / 'analysis' / 'cartesia_stt.json').read_text())['words']
    merged = []
    for w in raw:
        if merged and not w['word'].startswith(' '):  # continuation token (".m.", "-in")
            merged[-1]['text'] += w['word']
            merged[-1]['end'] = w['end']
        else:
            merged.append({'text': w['word'].strip(), 'start': w['start'], 'end': w['end']})
    for m in merged:
        core = re.sub(r'[,.?!]$', '', m['text'])
        tail = m['text'][len(core):]
        if m['text'] in FIXES:
            m['text'] = FIXES[m['text']]
        elif core in FIXES:
            m['text'] = FIXES[core] + tail
        m['start'], m['end'] = round(m['start'], 3), round(m['end'], 3)
    (ROOT / 'public' / 'words.json').write_text(json.dumps(merged, indent=0))
    print(f'words: {len(merged)}')


def levels():
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(SRC), '-vn', '-ac', '1', '-ar', '48000', '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    per = 48000 // FPS
    n = len(a) // per
    rms = np.sqrt((a[: n * per].reshape(n, per) ** 2).mean(1))
    db = 20 * np.log10(rms + 1e-6)
    lv = np.clip((db + 50) / 38, 0, 1)  # -50 dB -> 0, -12 dB -> 1
    (ROOT / 'public' / 'levels.json').write_text(json.dumps([round(float(x), 3) for x in lv]))
    print(f'levels: {n} frames')


def frame(t):
    from io import BytesIO

    from PIL import Image
    png = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', str(SRC), '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'],
                         capture_output=True, check=True).stdout
    return Image.open(BytesIO(png)).convert('RGB')


def assets():
    from PIL import Image, ImageDraw
    f = frame(12)
    # VEE head, circular avatar
    head = f.crop((970, 90, 1430, 550)).resize((320, 320), Image.LANCZOS)
    mask = Image.new('L', (1280, 1280), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 1279, 1279), fill=255)
    head.putalpha(mask.resize((320, 320), Image.LANCZOS))
    head.save(ROOT / 'public' / 'vee.png')
    # Voicera orbit mark on its grey badge: the mark is saturated, the badge is not
    mark = f.crop((1672, 838, 1816, 982)).convert('RGBA')
    a = np.asarray(mark).astype(np.float32)
    sat = a[..., :3].max(-1) - a[..., :3].min(-1)
    a[..., 3] = np.clip((sat - 18) * 6, 0, 255)
    Image.fromarray(a.astype(np.uint8)).save(ROOT / 'public' / 'orbit.png')
    print('assets: vee.png, orbit.png')


if __name__ == '__main__':
    edit()
    words()
    levels()
    assets()
