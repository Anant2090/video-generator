"""Stitch intro + existing demo + end card into out/pjfm-chat-mg.mp4."""
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INTRO = ROOT / 'out' / 'pjfm-intro.mp4'
BODY = ROOT / 'out' / 'pjfm-chat-body.mp4'
END = ROOT / 'out' / 'pjfm-end.mp4'
TRIM = ROOT / 'out' / 'pjfm-chat-body-trim.mp4'
OUT = ROOT / 'out' / 'pjfm-chat-mg.mp4'
LIST = ROOT / 'out' / 'pjfm-concat-list.txt'


def _bin(name: str) -> list[str]:
    found = shutil.which(name)
    if found:
        return [found]
    npx = shutil.which('npx') or 'npx'
    return [npx, 'remotion', name]


FFMPEG = _bin('ffmpeg')


def ff(args: list[str]) -> None:
    r = subprocess.run([*FFMPEG, '-hide_banner', '-y', *args], capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr[-2500:] or r.stdout[-2500:])


if __name__ == '__main__':
    for p in (INTRO, BODY, END):
        if not p.exists():
            sys.exit(f'missing {p}')
    if not TRIM.exists():
        ff([
            '-i', str(BODY),
            '-t', '115.9',
            '-an',
            '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p',
            str(TRIM),
        ])
    ff([
        '-i', str(INTRO),
        '-i', str(TRIM),
        '-i', str(END),
        '-f', 'lavfi',
        '-t', '115.9',
        '-i', 'anullsrc=r=48000:cl=stereo',
        '-filter_complex',
        '[0:v][0:a][1:v][3:a][2:v][2:a]concat=n=3:v=1:a=1[v][a]',
        '-map', '[v]',
        '-map', '[a]',
        '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '192k',
        '-shortest',
        '-movflags', '+faststart',
        str(OUT),
    ])
    print(f'-> {OUT}')
