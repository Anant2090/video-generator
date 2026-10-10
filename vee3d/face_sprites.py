"""Mouth + eyelid sprites for the 3D VEE's face decals (same shapes as the 2D rig), Real-ESRGAN x4.

python vee3d/face_sprites.py   (run from video/)
-> voicera-motion/public/legion/vee3d/face/{mouth1..5,blink1,blink2}.png + face.json (boxes in source px)
"""
import json
import sys
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageDraw, ImageFilter
from spandrel import ModelLoader

HERE = Path(__file__).parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / 'mascot-test'))
import rig_mascot as R  # noqa: E402  paint(), mouth(), blinked(), MOUTH_PAINT, EYES
from dither_mascot import load  # noqa: E402

OUT = ROOT / 'voicera-motion' / 'public' / 'legion' / 'vee3d' / 'face'
OUT.mkdir(parents=True, exist_ok=True)
model = ModelLoader().load_from_file(str(HERE / 'RealESRGAN_x4plus.pth'))
model.eval()


def esrgan(img):
    x = torch.from_numpy(np.array(img)).permute(2, 0, 1).float().div(255).unsqueeze(0)
    with torch.no_grad():
        y = model(x)
    return Image.fromarray((y[0].permute(1, 2, 0).clamp(0, 1).numpy() * 255).round().astype(np.uint8))


im, _ = load(ROOT / 'Screenshot 2026-04-27 175954 1.png')
M = 6  # source px of context around each sprite, then feathered out


def sprite(name, variant, box, shape):
    """Crop box(+margin) from the variant, upscale, alpha = feathered `shape` mask (source-px drawing fn)."""
    x0, y0, x1, y1 = box[0] - M, box[1] - M, box[2] + M, box[3] + M
    up = esrgan(variant.crop((x0, y0, x1, y1)).convert('RGB'))
    a = Image.new('L', ((x1 - x0) * 4, (y1 - y0) * 4))
    shape(ImageDraw.Draw(a), lambda x, y: ((x - x0) * 4, (y - y0) * 4))
    a = a.filter(ImageFilter.GaussianBlur(6))
    rgba = up.convert('RGBA')
    rgba.putalpha(a)
    rgba.save(OUT / f'{name}.png')
    return [x0, y0, x1, y1]


boxes = {}
mp = R.MOUTH_PAINT
for i in range(1, 6):
    boxes[f'mouth{i}'] = sprite(
        f'mouth{i}', R.paint(im, mp, R.mouth(i)), mp,
        lambda d, p: d.rectangle([*p(mp[0] + 2, mp[1] + 2), *p(mp[2] - 2, mp[3] - 2)], fill=255),
    )
eye_box = (min(e[0] for e in R.EYES) - 3, min(e[1] for e in R.EYES) - 3, max(e[2] for e in R.EYES) + 3, max(e[3] for e in R.EYES) + 3)
for lvl in (1, 2):
    boxes[f'blink{lvl}'] = sprite(
        f'blink{lvl}', R.blinked(im, lvl), eye_box,
        lambda d, p: [d.ellipse([*p(e[0] - 2, e[1] - 2), *p(e[2] + 2, e[3] + 2)], fill=255) for e in R.EYES],
    )
(OUT / 'face.json').write_text(json.dumps(boxes, indent=1))
print('wrote', sorted(boxes), '->', OUT)
