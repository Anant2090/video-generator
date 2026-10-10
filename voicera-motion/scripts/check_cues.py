# Draws every zoom/callout rect from src/timeline.ts onto the source frame at the
# cue's start (+0.5s) and end (-0.3s) -> analysis/cues/sheet_NN.png (3x3 tiles).
# If the UI moved under a rect (scroll, modal), it shows here.
import re, subprocess
from PIL import Image, ImageDraw
from common import FF, ROOT, SRC

src = (ROOT / "src/timeline.ts").read_text(encoding="utf-8")
cue_re = re.compile(r"\{at: ([\d.]+), until: ([\d.]+), rect: \[(\d+), (\d+), (\d+), (\d+)\](?:, label: '([^']*)')?\}")
cues = [(float(a), float(u), tuple(map(int, r)), lbl or "ZOOM") for a, u, *r, lbl in
        [(m[1], m[2], m[3], m[4], m[5], m[6], m[7]) for m in cue_re.finditer(src)]]
if not cues:
    raise SystemExit("no zoom/callout cues in src/timeline.ts yet")

out = ROOT / "analysis/cues"
out.mkdir(parents=True, exist_ok=True)
tmp = out / "_f.png"
tiles = []
for at, until, (x, y, w, h), label in cues:
    for t, tag in ((at + 0.5, "start"), (until - 0.3, "end")):
        subprocess.run([FF, "-y", "-loglevel", "error", "-ss", f"{t:.2f}", "-i", SRC,
                        "-frames:v", "1", str(tmp)], check=True)
        im = Image.open(tmp).convert("RGB")
        d = ImageDraw.Draw(im)
        color = (0, 200, 255) if label == "ZOOM" else (255, 0, 120)
        d.rectangle([x, y, x + w, y + h], outline=color, width=6)
        d.rectangle([0, 0, im.width, 60], fill=(0, 0, 0))
        d.text((12, 12), f"{tag} {t:.1f}s  {label}", fill=(255, 255, 255), font_size=36)
        tiles.append(im.resize((640, 360)))

for i in range(0, len(tiles), 9):
    sheet = Image.new("RGB", (1920, 1080), "white")
    for j, tile in enumerate(tiles[i:i + 9]):
        sheet.paste(tile, ((j % 3) * 640, (j // 3) * 360))
    sheet.save(out / f"sheet_{i // 9 + 1:02d}.png")
tmp.unlink()
print(f"{len(cues)} cues -> {(len(tiles) + 8) // 9} sheets in {out}")
