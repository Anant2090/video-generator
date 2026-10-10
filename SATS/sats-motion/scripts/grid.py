"""Grid overlay for measuring screenshot coordinates.

  python scripts/grid.py <image> <x0> <y0> <x1> <y1> [step] [scale]  -> analysis/grid_<name>_<x0>_<y0>.png
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
src, x0, y0, x1, y1 = sys.argv[1], *map(int, sys.argv[2:6])
step = int(sys.argv[6]) if len(sys.argv) > 6 else 50
scale = float(sys.argv[7]) if len(sys.argv) > 7 else 1.0

im = Image.open(src).convert('RGB').crop((x0, y0, x1, y1))
im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
d = ImageDraw.Draw(im)
for x in range((x0 // step + 1) * step, x1, step):
    X = (x - x0) * scale
    d.line([(X, 0), (X, im.height)], fill=(255, 0, 0) if x % (step * 2) == 0 else (255, 150, 150), width=1)
    d.text((X + 2, 2), str(x), fill=(200, 0, 0))
for y in range((y0 // step + 1) * step, y1, step):
    Y = (y - y0) * scale
    d.line([(0, Y), (im.width, Y)], fill=(0, 0, 255) if y % (step * 2) == 0 else (150, 150, 255), width=1)
    d.text((2, Y + 2), str(y), fill=(0, 0, 200))
out = ROOT / 'analysis' / f'grid_{Path(src).stem.replace(" ", "_")}_{x0}_{y0}.png'
out.parent.mkdir(exist_ok=True)
im.save(out)
print(out)
