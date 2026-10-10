# Source frames with a labelled 100 px grid, for reading cue rects in source pixels.
#   python scripts/grid.py 12.5 30 61   ->  analysis/grid/g_<t>.png (half size)
import subprocess, sys
from PIL import Image, ImageDraw
from common import FF, ROOT, SRC

out = ROOT / "analysis/grid"
out.mkdir(parents=True, exist_ok=True)
for t in sys.argv[1:]:
    p = out / f"g_{t}.png"
    subprocess.run([FF, "-y", "-loglevel", "error", "-ss", t, "-i", SRC, "-frames:v", "1", str(p)], check=True)
    im = Image.open(p).convert("RGB")
    d = ImageDraw.Draw(im)
    for x in range(0, im.width, 100):
        d.line([(x, 0), (x, im.height)], fill=(255, 0, 80) if x % 500 == 0 else (255, 120, 160))
        d.text((x + 3, 95), str(x), fill=(200, 0, 60))
    for y in range(0, im.height, 100):
        d.line([(0, y), (im.width, y)], fill=(255, 0, 80) if y % 500 == 0 else (255, 120, 160))
        d.text((3, y + 3), str(y), fill=(200, 0, 60))
    d.text((im.width - 220, 20), f"t={t}", fill=(0, 0, 0))
    im.resize((im.width * 3 // 4, im.height * 3 // 4)).save(p)
print(f"{len(sys.argv) - 1} frames -> {out}")
