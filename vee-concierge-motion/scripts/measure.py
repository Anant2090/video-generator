"""Measure text blocks on the static Mews frames: tight bbox, text colour, background colour.
python scripts/measure.py  -> prints one line per region, writes analysis/measure/<name>.png zooms
"""
import subprocess
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'public' / 'source.mp4'
OUT = ROOT / 'analysis' / 'measure'
OUT.mkdir(parents=True, exist_ok=True)

# name: (source second, search region [x, y, w, h] in source px)
REGIONS = {
    'dash_search': (150, [355, 25, 330, 40]),
    'tl_search': (160, [370, 65, 430, 45]),
    'tl_picker': (160, [515, 135, 200, 45]),
    'tl_month': (160, [325, 190, 200, 40]),
    'tl_d1': (160, [380, 230, 100, 40]),
    'tl_d2': (160, [575, 230, 100, 40]),
    'tl_d3': (160, [770, 230, 100, 40]),
    'tl_d4': (160, [970, 230, 90, 40]),
    'tl_d5': (160, [1165, 230, 90, 40]),
    'tl_bar': (160, [1095, 630, 140, 30]),
    'pn_group': (160, [1505, 200, 115, 40]),
    'pn_dates': (160, [1390, 280, 270, 40]),
    'pn_nights': (160, [1390, 312, 260, 32]),
    'pn_room': (160, [1390, 420, 200, 50]),
    'pn_guests': (160, [1675, 563, 220, 38]),
    'pn_arrival': (160, [1565, 830, 135, 36]),
    'pn_pickup_space': (160, [1690, 800, 210, 85]),
    'sl_search': (175, [345, 58, 370, 38]),
    'sl_date': (175, [770, 410, 160, 45]),
    'sl_dow': (175, [710, 465, 60, 35]),
    'sl_rooms': (175, [1095, 410, 55, 45]),
}

_cache = {}


def frame(t):
    if t not in _cache:
        png = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', str(SRC), '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'],
                             capture_output=True, check=True).stdout
        _cache[t] = np.asarray(Image.open(BytesIO(png)).convert('RGB')).astype(int)
    return _cache[t]


for name, (t, (x, y, w, h)) in REGIONS.items():
    a = frame(t)[y:y + h, x:x + w]
    lum = a.mean(-1)
    bg = np.median(a.reshape(-1, 3)[lum.reshape(-1) > np.percentile(lum, 60)], 0).astype(int)
    # text is far darker than grid lines (or far lighter, on the blue booking bar)
    ink_mask = lum > 215 if bg.mean() < 160 else lum < 150
    if ink_mask.any():
        ys, xs = np.where(ink_mask)
        bx, by, bw, bh = x + xs.min(), y + ys.min(), xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
        ink = np.median(a[ink_mask], 0).astype(int)
    else:
        bx = by = bw = bh = 0
        ink = bg
    hexc = lambda c: '#%02X%02X%02X' % tuple(c)
    print(f'{name:16s} t={t} bbox=[{bx},{by},{bw},{bh}] ink={hexc(ink)} bg={hexc(bg)}')
    Image.fromarray(a.astype(np.uint8)).resize((w * 4, h * 4), Image.NEAREST).save(OUT / f'{name}.png')
