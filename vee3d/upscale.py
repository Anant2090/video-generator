"""Real-ESRGAN x4 (CPU, via spandrel) of the official VEE art + transparent cut-out.

python vee3d/upscale.py   (run from video/)
-> vee3d/vee_up.png (RGBA, 1316x2532) and vee3d/vee_up_square.png (padded square, for image-to-3D)
"""
import sys
import urllib.request
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageFilter
from spandrel import ModelLoader

HERE = Path(__file__).parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / 'mascot-test'))
from dither_mascot import load  # noqa: E402  same cut-out as the official dither

WEIGHTS = HERE / 'RealESRGAN_x4plus.pth'
URL = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth'

if not WEIGHTS.exists():
    urllib.request.urlretrieve(URL, WEIGHTS)
model = ModelLoader().load_from_file(str(WEIGHTS))
model.eval()

im, mask = load(ROOT / 'Screenshot 2026-04-27 175954 1.png')
x = torch.from_numpy(np.array(im)).permute(2, 0, 1).float().div(255).unsqueeze(0)
with torch.no_grad():
    y = model(x)
up = Image.fromarray((y[0].permute(1, 2, 0).clamp(0, 1).numpy() * 255).round().astype(np.uint8))

# crisp alpha from the official cut-out, minus background pockets the flood fill can't reach
# (e.g. between the headset band and the skull): near-white and unsaturated; robot highlights are bluish
a = np.array(up).astype(int)
pocket = (a.min(2) > 226) & (a.max(2) - a.min(2) < 16)
alpha = np.array(mask.resize(up.size, Image.LANCZOS)) > 128
alpha = Image.fromarray(((alpha & ~pocket) * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(1))
rgba = up.convert('RGBA')
rgba.putalpha(alpha)
rgba.save(HERE / 'vee_up.png')

side = int(max(rgba.size) * 1.1)
sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
sq.paste(rgba, ((side - rgba.width) // 2, (side - rgba.height) // 2), rgba)
sq.save(HERE / 'vee_up_square.png')
print('wrote', HERE / 'vee_up.png', rgba.size, 'and vee_up_square.png', sq.size)
