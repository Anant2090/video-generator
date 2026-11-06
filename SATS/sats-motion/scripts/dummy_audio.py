"""Cartesia narration for the dummy cut -> public/audio/dummy/<id>.wav + src/data/lines.dummy.json.

Does not write src/data/lines.json. If CARTESIA_API_KEY is missing or TTS fails, writes
silent placeholders so DummyMain stays renderable.

  python scripts/dummy_audio.py
  python scripts/dummy_audio.py demo3
"""
import base64
import json
import os
import sys
import wave

import cartesia as c
from dummy_script import load

c.ENVS = [c.ROOT / '.env', c.ROOT.parents[1] / '.env']
AUD = c.ROOT / 'public' / 'audio' / 'dummy'
DATA = c.ROOT / 'src' / 'data' / 'lines.dummy.json'

QUINN = '045f0292-0731-4a4c-971d-64594fc2c35a'
VOICE = QUINN
SPEED = 1.05


def _key() -> str | None:
    env = os.environ.get('CARTESIA_API_KEY', '').strip().strip('"').strip("'")
    if env:
        return env
    try:
        return c.key()
    except SystemExit:
        return None


def sse(text: str):
    body = {
        'model_id': c.MODEL,
        'transcript': text,
        'voice': {'mode': 'id', 'id': VOICE},
        'language': 'en',
        'output_format': {'container': 'raw', 'encoding': 'pcm_s16le', 'sample_rate': 44100},
        'add_timestamps': True,
        'generation_config': {'speed': SPEED},
    }
    pcm, words = bytearray(), []
    for line in c.call('/tts/sse', body).decode().splitlines():
        if not line.startswith('data:'):
            continue
        ev = json.loads(line[5:])
        if ev.get('type') == 'chunk' and ev.get('data'):
            pcm += base64.b64decode(ev['data'])
        elif ev.get('type') == 'timestamps':
            ts = ev['word_timestamps']
            words += [{'w': w, 's': round(s, 3), 'e': round(e, 3)} for w, s, e in zip(ts['words'], ts['start'], ts['end'])]
    return bytes(pcm), words


def silence(seconds: float) -> bytes:
    n = max(1, int(seconds * 44100))
    return b'\x00\x00' * n


def estimate_dur(text: str) -> float:
    words = max(1, len(text.split()))
    return round(max(4.0, words / 2.4), 3)


def write_wav(dest, pcm: bytes):
    dest.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(dest), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(44100)
        w.writeframes(pcm)


def main(force: set[str]):
    blocks = load()
    key = _key()
    if key:
        os.environ['CARTESIA_API_KEY'] = key
        c.key = lambda: key
    else:
        print('CARTESIA_API_KEY not set — writing silent dummy VO placeholders')

    data = json.loads(DATA.read_text()) if DATA.exists() else {}
    keep = {k for k, _, _ in blocks}
    data = {k: v for k, v in data.items() if k in keep}
    used_tts = False
    for key_id, spoken, show in blocks:
        dest = AUD / f'{key_id}.wav'
        if dest.exists() and key_id in data and key_id not in force and data[key_id].get('text') == spoken:
            continue
        if key:
            try:
                pcm, words = sse(spoken)
                used_tts = True
            except Exception as e:
                print(f'{key_id}: TTS failed ({type(e).__name__}) — silent placeholder')
                pcm, words = silence(estimate_dur(spoken)), []
        else:
            pcm, words = silence(estimate_dur(spoken)), []
        write_wav(dest, pcm)
        data[key_id] = {
            'who': 'narrator',
            'text': spoken,
            'show': show,
            'dur': round(len(pcm) / 88200, 3),
            'words': words,
        }
        print(f'{key_id:6} {data[key_id]["dur"]:6.2f}s  {len(words)} words')
    DATA.parent.mkdir(parents=True, exist_ok=True)
    DATA.write_text(json.dumps(data, indent=1))
    total = sum(v['dur'] for v in data.values())
    print(f'dummy narration {total:.1f}s ({"Cartesia" if used_tts else "silent placeholders"})')


if __name__ == '__main__':
    main(set(sys.argv[1:]))
