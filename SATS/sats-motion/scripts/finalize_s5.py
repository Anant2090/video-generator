"""Mux the pickup-scene slice of mix.wav onto out/scenario5-render.mp4 -> out/scenario5.mp4."""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RENDER = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'out' / 'scenario5-render.mp4'
MIX = ROOT / 'public' / 'audio' / 'mix.wav'
OUT = ROOT / 'out' / 'scenario5.mp4'
TL = json.loads((ROOT / 'src' / 'data' / 'timeline.json').read_text())
FPS = TL['fps']
pickup = next(s for s in TL['scenes'] if s['name'] == 'pickup')
START = pickup['start']
EXPECTED = round((pickup['end'] - pickup['start']) * FPS)
DUR = EXPECTED / FPS


def _bin(name: str) -> list[str]:
    found = shutil.which(name)
    if found:
        return [found]
    return [shutil.which('npx') or 'npx', 'remotion', name]


FFMPEG = _bin('ffmpeg')
FFPROBE = _bin('ffprobe')


def ff(*args):
    r = subprocess.run([*FFMPEG, '-hide_banner', '-y', *args], capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr[-2000:] or r.stdout[-2000:])
    return r.stderr


def loudnorm(src: Path, dst: Path):
    log = ff('-i', str(src), '-af', 'loudnorm=I=-16:TP=-1:LRA=11:print_format=json', '-f', 'null', '-')
    m = json.loads(log[log.rindex('{'):log.rindex('}') + 1])
    ln = (
        f"loudnorm=I=-16:TP=-1:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
        f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:"
        f"offset={m['target_offset']}:linear=true"
    )
    ff('-i', str(src), '-af', ln + ',aresample=48000', '-c:a', 'pcm_s16le', str(dst))
    print(f'loudnorm input {m["input_i"]} LUFS -> target -16')


if __name__ == '__main__':
    if not RENDER.exists():
        sys.exit(f'missing {RENDER} — run npm run render:s5 first')
    if not MIX.exists():
        sys.exit(f'missing {MIX}')
    OUT.parent.mkdir(parents=True, exist_ok=True)
    sliced = ROOT / 'out' / 'scenario5-mix.wav'
    ff('-i', str(MIX), '-ss', f'{START:.3f}', '-t', f'{DUR:.4f}', '-c:a', 'pcm_s16le', str(sliced))
    norm = ROOT / 'out' / 'scenario5-audio-norm.wav'
    loudnorm(sliced, norm)
    ff(
        '-i', str(RENDER), '-i', str(norm),
        '-map', '0:v', '-map', '1:a',
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k',
        '-movflags', '+faststart', '-shortest',
        str(OUT),
    )
    r = subprocess.run(
        [*FFPROBE, '-v', 'error', '-count_frames', '-select_streams', 'v:0',
         '-show_entries', 'stream=nb_read_frames', '-of', 'json', str(OUT)],
        capture_output=True, text=True, check=True,
    )
    n = int(json.loads(r.stdout)['streams'][0]['nb_read_frames'])
    print(f'frames: {n} (expected {EXPECTED})', 'OK' if n == EXPECTED else 'MISMATCH')
    if n != EXPECTED:
        sys.exit(1)
    print(f'-> {OUT}')
