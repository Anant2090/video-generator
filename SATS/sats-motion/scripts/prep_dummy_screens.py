"""Copy dummy screenshots into public/screens/dummy/ and write src/data/screens.dummy.json.

Required sources in assets/dummy/ (PNG or JPG):
  dashboard.png
  workflow.png
  shipment.png

  python scripts/prep_dummy_screens.py
"""
import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / 'assets' / 'dummy'
OUT_DIR = ROOT / 'public' / 'screens' / 'dummy'
META = ROOT / 'src' / 'data' / 'screens.dummy.json'

SLOTS = ('dashboard', 'workflow', 'shipment')
EXTS = ('.png', '.jpg', '.jpeg', '.webp')


def find_src(stem: str) -> Path:
    for ext in EXTS:
        p = SRC_DIR / f'{stem}{ext}'
        if p.is_file() and p.stat().st_size > 0:
            return p
    raise SystemExit(f'Missing screenshot: {SRC_DIR / (stem + ".png")} (or .jpg). Do not substitute another image.')


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    meta: dict = {}
    for stem in SLOTS:
        src = find_src(stem)
        dest = OUT_DIR / f'{stem}.png'
        if src.suffix.lower() == '.png' and src.resolve() != dest.resolve():
            shutil.copy2(src, dest)
        else:
            Image.open(src).convert('RGB').save(dest, optimize=True)
        with Image.open(dest) as im:
            w, h = im.size
        if w < 200 or h < 200:
            raise SystemExit(f'{src} looks unreadable ({w}x{h})')
        meta[stem] = {'src': f'screens/dummy/{stem}.png', 'w': w, 'h': h}
        print(f'{src.name} -> {dest} ({w}x{h})')
    META.parent.mkdir(parents=True, exist_ok=True)
    META.write_text(json.dumps(meta, indent=1), encoding='utf-8')
    print('wrote', META)


if __name__ == '__main__':
    main()
