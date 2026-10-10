"""Cartesia VO for the Legion promo.

  python scripts/legion_vo.py voices                 # list English voices
  python scripts/legion_vo.py samples ID [ID ...]    # hook line per voice -> public/legion/vo_samples/
  python scripts/legion_vo.py full ID [speed]        # full script -> public/legion/vo.wav

The API key is read from video/.env (else Legion-Backend/.env) at runtime; never printed or written.
"""
import base64
import json
import sys
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENVS = [ROOT / '.env', ROOT.parent / '.env']  # video/.env first
OUT = ROOT / 'public' / 'legion'
API = 'https://api.cartesia.ai'
VERSION = '2024-11-13'  # same as Legion-Eval-Service/cartesia/main.py
MODEL = 'sonic-3.5'

HOOK = 'Your AI agent takes thousands of calls. Which ones went wrong? Meet VEE Legion.'
# Spoken as the letter "V"; the brand is still spelled VEE on screen (legion_cues.py maps it back).
SCRIPT = (
    'Your AI agent takes thousands of calls. Which ones went wrong? '
    "I'm V. Meet V Legion. "
    'I test your voice and chat agents with a legion of realistic callers: '
    'frustrated, confused... and a few troublemakers. '
    'Define what a good call looks like, run hundreds at once, '
    'and I score every call, and show you exactly why one failed. '
    'Even your real calls. '
    'V Legion. Catch it before your customers do.'
)


def key() -> str:
    for env in ENVS:
        for line in env.read_text(encoding='utf-8').splitlines() if env.exists() else []:
            k, _, v = line.partition('=')
            if k.strip() == 'CARTESIA_API_KEY' and v.strip():
                return v.strip().strip('"').strip("'")
    sys.exit(f'CARTESIA_API_KEY not set in {ENVS}')


def call(path: str, body: dict | None = None) -> bytes:
    req = urllib.request.Request(
        API + path,
        data=json.dumps(body).encode() if body else None,
        headers={'X-API-Key': key(), 'Cartesia-Version': VERSION, 'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def tts(voice: str, text: str, dest: Path, speed: float | None = None) -> None:
    body = {
        'model_id': MODEL,
        'transcript': text,
        'voice': {'mode': 'id', 'id': voice},
        'language': 'en',
        'output_format': {'container': 'raw', 'encoding': 'pcm_s16le', 'sample_rate': 44100},
    }
    if speed:
        body['generation_config'] = {'speed': speed}
    pcm = call('/tts/bytes', body)  # raw: Cartesia's streamed wav header has no real length
    dest.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(dest), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(44100)
        w.writeframes(pcm)
    print('wrote', dest, f'{len(pcm) / 88200:.2f}s')


def full(voice: str, speed: float | None = None) -> None:
    """Full script via /tts/sse so Cartesia returns exact word timestamps with the audio."""
    body = {
        'model_id': MODEL,
        'transcript': SCRIPT,
        'voice': {'mode': 'id', 'id': voice},
        'language': 'en',
        'output_format': {'container': 'raw', 'encoding': 'pcm_s16le', 'sample_rate': 44100},
        'add_timestamps': True,
    }
    if speed:
        body['generation_config'] = {'speed': speed}
    pcm, words = bytearray(), []
    for line in call('/tts/sse', body).decode().splitlines():
        if not line.startswith('data:'):
            continue
        ev = json.loads(line[5:])
        if ev.get('type') == 'chunk' and ev.get('data'):
            pcm += base64.b64decode(ev['data'])
        elif ev.get('type') == 'timestamps':
            ts = ev['word_timestamps']
            words += [
                {'text': w, 'startMs': round(s * 1000), 'endMs': round(e * 1000), 'timestampMs': None, 'confidence': 1}
                for w, s, e in zip(ts['words'], ts['start'], ts['end'])
            ]
    with wave.open(str(OUT / 'vo.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(44100)
        w.writeframes(bytes(pcm))
    # @remotion/captions shape; text carries a leading space like whisper tokens
    for i, w in enumerate(words):
        w['text'] = (' ' if i else '') + w['text']
    (OUT / 'words.json').write_text(json.dumps(words, indent=1), encoding='utf-8')
    print(f'wrote vo.wav {len(pcm) / 88200:.2f}s, {len(words)} words')


if __name__ == '__main__':
    cmd, *args = sys.argv[1:] or ['voices']
    if cmd == 'voices':
        data = json.loads(call('/voices'))
        voices = data['data'] if isinstance(data, dict) else data
        for v in voices:
            if v.get('language') == 'en':
                print(v['id'], '|', v['name'], '|', (v.get('description') or '')[:90])
    elif cmd == 'samples':
        for vid in args:
            tts(vid, HOOK, OUT / 'vo_samples' / f'{vid[:8]}.wav')
    elif cmd == 'full':
        full(args[0], float(args[1]) if len(args) > 1 else None)
