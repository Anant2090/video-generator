"""out/render.mp4 (silent) + source audio cut by src/edit.json -> out/vee-concierge-booth.mp4

Audio: keep-segments concatenated (5 ms fades at each cut, all cuts sit in digital silence),
3 s silent hook in front, faded to silence where the demo card starts (drops the dated
IH Miami line), padded to the video length, two-pass loudnorm to -14 LUFS / -1 dBTP,
then the sonic logo mixed in on the demo card.
Then checks frame count, duration, loudness and A/V sync against the source.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'public' / 'source.mp4'
RENDER = ROOT / 'out' / 'render.mp4'
OUT = ROOT / 'out' / 'vee-concierge-booth.mp4'
WAV = ROOT / 'out' / 'audio_cut.wav'
LOGO = ROOT / 'out' / 'sonic' / 'logo_a.wav'
DEMO_AT = 191.3  # src/cues.ts DEMO_AT

E = json.loads((ROOT / 'src' / 'edit.json').read_text())
FPS, SEGS, HOOK, TAIL = E['fps'], E['segments'], E['hookFrames'], E['tailFrames']
TOTAL = HOOK + sum(b - a for a, b in SEGS) + TAIL


def src_to_out(s):
    at = HOOK
    for a, b in SEGS:
        if s * FPS < b:
            return (at + max(0, s * FPS - a)) / FPS
        at += b - a
    return at / FPS


def ff(*args, capture=False):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-y', *args], capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr[-2000:])
    return r.stderr


def build_audio():
    parts = []
    for i, (a, b) in enumerate(SEGS):
        d = (b - a) / FPS
        parts.append(f'[0:a]atrim={a / FPS}:{b / FPS},asetpts=PTS-STARTPTS,afade=t=in:d=0.005,afade=t=out:st={d - 0.005}:d=0.005[s{i}]')
    total_s = TOTAL / FPS
    fade_at = src_to_out(DEMO_AT)
    graph = ';'.join(parts) + ';' + \
        f'anullsrc=r=48000:cl=stereo,atrim=0:{HOOK / FPS}[h];' + \
        '[h]' + ''.join(f'[s{i}]' for i in range(len(SEGS))) + f'concat=n={len(SEGS) + 1}:v=0:a=1,' + \
        f'afade=t=out:st={fade_at}:d=0.2,apad=whole_dur={total_s},atrim=0:{total_s}[cut]'
    raw = ROOT / 'out' / 'audio_raw.wav'
    ff('-i', str(SRC), '-filter_complex', graph, '-map', '[cut]', '-ar', '48000', '-c:a', 'pcm_s16le', str(raw))
    # two-pass loudnorm
    log = ff('-i', str(raw), '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-')
    m = json.loads(log[log.rindex('{'):log.rindex('}') + 1])
    ln = (f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    norm = ROOT / 'out' / 'audio_norm.wav'
    ff('-i', str(raw), '-af', ln + ',aresample=48000', '-c:a', 'pcm_s16le', str(norm))
    # sonic logo (scripts/sonic.py draft a) starts on the demo card's first frame
    ms = round(round(fade_at * FPS) / FPS * 1000)
    ff('-i', str(norm), '-i', str(LOGO), '-filter_complex',
       f'[1:a]loudnorm=I=-15:TP=-1.5,aresample=48000,adelay={ms}|{ms}[l];[0:a][l]amix=inputs=2:normalize=0:duration=first[a]',
       '-map', '[a]', '-c:a', 'pcm_s16le', str(WAV))
    print(f'audio: {len(SEGS)} segments, fade at {fade_at:.2f}s, logo at {ms / 1000:.3f}s, input {m["input_i"]} LUFS')


def mux():
    ff('-i', str(RENDER), '-i', str(WAV), '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k',
       '-movflags', '+faststart', '-shortest', str(OUT))


def probe(path, entries):
    r = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', entries, '-of', 'json', str(path)],
                       capture_output=True, text=True)
    return json.loads(r.stdout)


def pcm(path, start, dur):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(start), '-t', str(dur), '-i', str(path), '-vn', '-ac', '1', '-ar', '8000', '-f', 's16le', '-'],
                         capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32)


def checks():
    n = int(probe(OUT, 'stream=nb_read_frames')['streams'][0]['nb_read_frames'])
    print(f'frames: {n} (expected {TOTAL})', 'OK' if n == TOTAL else 'MISMATCH')
    log = ff('-i', str(OUT), '-af', 'ebur128=peak=true', '-f', 'null', '-')
    i = re.findall(r'I:\s+(-?[\d.]+) LUFS', log)[-1]
    tp = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', log)[-1]
    print(f'loudness: {i} LUFS integrated, true peak {tp} dBFS')
    for s in (40.0, 150.0, 185.0):
        a = pcm(SRC, s, 4)
        b = pcm(OUT, src_to_out(s) - 0.25, 4.5)
        c = np.correlate(b - b.mean(), a - a.mean(), 'valid')
        lag_ms = (np.argmax(c) / 8000 - 0.25) * 1000
        print(f'sync @ src {s:.0f}s: {lag_ms:+.1f} ms', 'OK' if abs(lag_ms) <= 1000 / FPS else 'OFF')


if __name__ == '__main__':
    build_audio()
    mux()
    checks()
    print(f'-> {OUT}')
