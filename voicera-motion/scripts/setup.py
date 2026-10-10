# One-time setup for a video:   python scripts/setup.py path/to/video.mp4
#
# Copies it to public/source.mp4, probes it, finds where the screen recording sits
# inside any letterbox, grabs the last frame (end-card background), and writes the
# material for authoring cues into analysis/:
#   sheets/sheet_NN.png  1 frame every 2 s, 20 per sheet, timestamped
#   scenes.txt           scene-cut times (s)
#   still.txt            stretches where the picture is still (safe for callouts)
#   audio16k.wav         for scripts/transcribe.mjs
# Writes src/video.json; keys you set by hand (scrollDeny, whisperPrompt, crop) are kept.
import json, os, shutil, subprocess, sys
from fractions import Fraction
import numpy as np
from common import FF, FFPROBE, ROOT, SRC, VIDEO_JSON


def run(*args):
    return subprocess.run([FF, "-loglevel", "error", *args], capture_output=True, check=True).stdout


def probe():
    out = subprocess.run([FFPROBE, "-v", "error", "-count_packets", "-show_entries",
                          "stream=codec_type,width,height,r_frame_rate,nb_read_packets", "-of", "json", SRC],
                         capture_output=True, check=True, text=True).stdout
    streams = json.loads(out)["streams"]
    v = next(s for s in streams if s["codec_type"] == "video")
    return {"fps": round(float(Fraction(v["r_frame_rate"])), 3), "frames": int(v["nb_read_packets"]),
            "width": v["width"], "height": v["height"]}, any(s["codec_type"] == "audio" for s in streams)


def frame_at(t, w, h):
    raw = run("-ss", f"{t:.3f}", "-i", SRC, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-")
    return np.frombuffer(raw, np.uint8).reshape(h, w, 3).astype(int)


def find_crop(v):
    """Box of the picture inside a flat letterbox (Canva exports add one). Median over 15
    samples, so full-bleed title cards don't widen it; inset 2 px to skip anti-aliased edges."""
    boxes = []
    for i in range(15):
        a = frame_at(v["frames"] * (i + 0.5) / 15 / v["fps"], v["width"], v["height"])
        ys, xs = np.nonzero(np.abs(a - a[0, 0]).max(axis=2) > 6)
        if len(xs):
            boxes.append((xs.min(), ys.min(), xs.max(), ys.max()))
    x0, y0, x1, y1 = np.median(np.array(boxes), axis=0).astype(int)
    x0, y0 = min(x0 + 2, v["width"] // 4), min(y0 + 2, v["height"] // 4)
    x1, y1 = max(x1 - 2, v["width"] * 3 // 4), max(y1 - 2, v["height"] * 3 // 4)
    return {"x": int(x0), "y": int(y0), "w": int(x1 - x0 + 1), "h": int(y1 - y0 + 1)}


def still_stretches(v, out):
    w, h, rate = 192, 108, 10
    raw = run("-i", SRC, "-vf", f"fps={rate},scale={w}:{h},format=gray", "-f", "rawvideo", "-")
    d = np.abs(np.diff(np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.int16), axis=0)).mean(axis=(1, 2))
    spans, s = [], None
    for i, still in enumerate(np.append(d < 0.35, False)):
        if still and s is None:
            s = i
        elif not still and s is not None:
            if i - s >= 12:
                spans.append(f"{s / rate:.1f}-{i / rate:.1f}")
            s = None
    out.write_text(" ".join(spans) + "\n")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: python scripts/setup.py path/to/video.mp4")
    (ROOT / "public").mkdir(exist_ok=True)
    if os.path.abspath(sys.argv[1]) != os.path.abspath(SRC):
        shutil.copyfile(sys.argv[1], SRC)
    v, has_audio = probe()
    old = json.loads(VIDEO_JSON.read_text(encoding="utf-8")) if VIDEO_JSON.exists() else {}
    video = {**v, "crop": old.get("crop") or find_crop(v), "scrollDeny": old.get("scrollDeny", []),
             "whisperPrompt": old.get("whisperPrompt", "")}
    VIDEO_JSON.write_text(json.dumps(video, indent=2) + "\n", encoding="utf-8")

    an = ROOT / "analysis"
    (an / "sheets").mkdir(parents=True, exist_ok=True)
    run("-sseof", "-0.1", "-i", SRC, "-frames:v", "1", "-update", "1", "-y", str(ROOT / "public/last-frame.png"))
    font = "fontfile='C\\:/Windows/Fonts/arial.ttf':" if os.name == "nt" else ""
    run("-y", "-i", SRC, "-vf", f"fps=1/2,scale=384:-1,drawtext={font}text='%{{pts\\:hms}}':x=6:y=6:fontsize=18:"
        "fontcolor=white:box=1:boxcolor=black@0.6,tile=5x4", str(an / "sheets/sheet_%02d.png"))
    scenes = subprocess.run([FF, "-i", SRC, "-vf", "select='gt(scene,0.3)',showinfo", "-an", "-f", "null", "-"],
                            capture_output=True, text=True).stderr
    (an / "scenes.txt").write_text(" ".join(x.split(":")[1] for x in scenes.split() if x.startswith("pts_time:")) + "\n")
    still_stretches(v, an / "still.txt")
    if has_audio:
        run("-y", "-i", SRC, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", str(an / "audio16k.wav"))

    print(json.dumps(video))
    print(f"{v['frames'] / v['fps']:.2f}s, audio: {'yes' if has_audio else 'NO (skip transcription)'}")
    print("analysis/ has sheets, scenes.txt, still.txt" + (", audio16k.wav" if has_audio else ""))
