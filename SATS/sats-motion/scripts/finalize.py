"""Mux public/audio/mix.wav onto out/render.mp4 (muted Remotion render) -> out/final.mp4.

Two-pass loudnorm to -16 LUFS / -1 dBTP, then check frame count against timeline.json.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RENDER = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'out' / 'render.mp4'
MIX = ROOT / 'public' / 'audio' / 'mix.wav'
OUT = ROOT / 'out' / 'final.mp4'
TL = json.loads((ROOT / 'src' / 'data' / 'timeline.json').read_text())
FPS, EXPECTED = TL['fps'], TL['frames']


def ff(*args):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-y', *args], capture_output=True, text=True)
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


def mux(norm: Path):
    ff(
        '-i', str(RENDER), '-i', str(norm),
        '-map', '0:v', '-map', '1:a',
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k',
        '-movflags', '+faststart', '-shortest',
        str(OUT),
    )


def checks():
    r = subprocess.run(
        ['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0',
         '-show_entries', 'stream=nb_read_frames,duration', '-of', 'json', str(OUT)],
        capture_output=True, text=True, check=True,
    )
    st = json.loads(r.stdout)['streams'][0]
    n = int(st['nb_read_frames'])
    print(f'frames: {n} (expected {EXPECTED})', 'OK' if n == EXPECTED else 'MISMATCH')
    log = ff('-i', str(OUT), '-af', 'ebur128=peak=true', '-f', 'null', '-')
    i = re.findall(r'I:\s+(-?[\d.]+) LUFS', log)[-1]
    tp = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', log)[-1]
    print(f'loudness: {i} LUFS integrated, true peak {tp} dBFS')
    if n != EXPECTED:
        sys.exit(1)


if __name__ == '__main__':
    if not RENDER.exists():
        sys.exit(f'missing {RENDER} — run npm run render first')
    if not MIX.exists():
        sys.exit(f'missing {MIX} — run npm run audio first')
    norm = ROOT / 'out' / 'audio_norm.wav'
    loudnorm(MIX, norm)
    mux(norm)
    checks()
    print(f'-> {OUT}')
