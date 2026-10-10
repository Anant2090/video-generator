# Shared by the Python scripts: project paths, ffmpeg location, per-video facts.
import glob, json, os, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = str(ROOT / "public/source.mp4")
VIDEO_JSON = ROOT / "src/video.json"


def tool(name):
    """ffmpeg/ffprobe: $FFMPEG_DIR, then PATH, then winget's install folder (PATH needs a new shell)."""
    exe = name + (".exe" if os.name == "nt" else "")
    if os.environ.get("FFMPEG_DIR"):
        return str(Path(os.environ["FFMPEG_DIR"]) / exe)
    found = shutil.which(name)
    if found:
        return found
    hits = glob.glob(os.path.expandvars(rf"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\*\bin\{exe}"))
    if hits:
        return hits[0]
    raise SystemExit(f"{name} not found. Install it (winget install Gyan.FFmpeg) or set FFMPEG_DIR.")


FF, FFPROBE = tool("ffmpeg"), tool("ffprobe")
VIDEO = json.loads(VIDEO_JSON.read_text(encoding="utf-8")) if VIDEO_JSON.exists() else None
