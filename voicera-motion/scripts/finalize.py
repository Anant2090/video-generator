# Last step after `npm run render`:   python scripts/finalize.py [out/render.mp4]
#
# 1. Swaps in the source's original audio track (Remotion's own mix is re-encoded and
#    runs ~42 ms late) -> out/final.mp4.
# 2. Checks it: frame count/length, audio present, frame-exact alignment with the source
#    on untouched 'full' ranges.
# 3. Writes analysis/final_captions.png: every 4th caption line as rendered, next to the
#    text it should show. Look at it: stale-DOM bugs only show up in long renders.
import json, re, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from common import FF, FFPROBE, ROOT, SRC, VIDEO

render = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "out/render.mp4"
final = ROOT / "out/final.mp4"
ts = (ROOT / "src/timeline.ts").read_text(encoding="utf-8")
end_frames = 0 if re.search(r"export const endCard[^=]*= null", ts) else 180
fps, n_src = VIDEO["fps"], VIDEO["frames"]


def streams(path):
    out = subprocess.run([FFPROBE, "-v", "error", "-count_packets", "-show_entries",
                          "stream=codec_type,nb_read_packets,duration", "-of", "json", str(path)],
                         capture_output=True, check=True, text=True).stdout
    return {s["codec_type"]: s for s in json.loads(out)["streams"]}


def gray(path, n):
    raw = subprocess.run([FF, "-loglevel", "error", "-ss", f"{(n - 0.25) / fps:.4f}", "-i", str(path), "-frames:v", "1",
                          "-vf", "scale=480:270,format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(270, 480).astype(np.int16)


has_audio = "audio" in streams(SRC)
subprocess.run([FF, "-y", "-loglevel", "error", "-i", str(render), "-i", SRC, "-map", "0:v",
                *(["-map", "1:a"] if has_audio else []), "-c", "copy", "-movflags", "+faststart", str(final)], check=True)

problems = []
st = streams(final)
frames = int(st["video"]["nb_read_packets"])
print(f"{final.name}: {frames} frames = {frames / fps:.2f}s (source {n_src} + end card {end_frames})")
if frames != n_src + end_frames:
    problems.append(f"expected {n_src + end_frames} frames, got {frames}")
if has_audio != ("audio" in st):
    problems.append("audio track missing")

# alignment: on 'full' ranges the render shows the source untouched, so frame n must match source n
full = [(int(a), n_src if b == "SRC_FRAMES" else int(b))
        for a, b, m in re.findall(r"from: (\d+), to: (\w+), mode: '(\w+)'", ts) if m == "full"]
probe_at = [a + (b - a) // k for a, b in full for k in (4, 2) if b - a > 10][:4]
for n in probe_at:
    r = gray(final, n)
    err = {k: np.abs(r - gray(SRC, n + k)).mean() for k in (-1, 0, 1)}
    ok = err[0] <= min(err[-1], err[1]) + 0.05
    print(f"  frame {n}: diff vs source n-1/n/n+1 = {err[-1]:.2f}/{err[0]:.2f}/{err[1]:.2f} {'ok' if ok else 'MISALIGNED'}")
    if not ok:
        problems.append(f"frame {n} misaligned")
if not probe_at:
    print("  (no 'full' ranges: alignment check skipped)")

# caption sheet
pages = json.loads(subprocess.run(["node", "--input-type=module", "-e", """
import {createTikTokStyleCaptions} from '@remotion/captions';
import fs from 'node:fs';
const words = JSON.parse(fs.readFileSync('public/words.json', 'utf8'));
const {pages} = createTikTokStyleCaptions({captions: words, combineTokensWithinMilliseconds: 1400});
console.log(JSON.stringify(pages.map(p => ({t: (p.startMs + Math.min(p.tokens.at(-1).toMs, p.startMs + p.durationMs)) / 2000,
  text: p.tokens.map(x => x.text.trim()).join(' ')}))));
"""], cwd=ROOT, capture_output=True, check=True, text=True, stdin=subprocess.DEVNULL).stdout)
rows = []
for p in pages[1::4]:
    raw = subprocess.run([FF, "-loglevel", "error", "-ss", f"{p['t']:.2f}", "-i", str(final), "-frames:v", "1",
                          "-vf", "crop=1320:90:300:970,scale=660:45", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True, check=True).stdout
    rows.append((p, Image.frombytes("RGB", (660, 45), raw)))
if rows:
    half = (len(rows) + 1) // 2
    sheet = Image.new("RGB", (1920, half * 48), "white")
    d = ImageDraw.Draw(sheet)
    for i, (p, im) in enumerate(rows):
        x, y = (i // half) * 960, (i % half) * 48
        sheet.paste(im, (x, y))
        d.text((x + 665, y + 14), f"{p['t']:.1f}s: {p['text'][:42]}", fill=(200, 0, 60))
    sheet.save(ROOT / "analysis/final_captions.png")
    print(f"  {len(rows)} caption lines -> analysis/final_captions.png (check rendered vs expected)")

if problems:
    raise SystemExit("FAILED: " + "; ".join(problems))
print("OK")
