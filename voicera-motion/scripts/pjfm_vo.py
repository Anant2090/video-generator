"""Cartesia VO for PJFM intro + end. Key from env/.env — never printed."""
import json
import os
import sys
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENVS = [
    ROOT / '.env',
    ROOT.parent / '.env',
    ROOT.parent / 'SATS' / 'sats-motion' / '.env',
]
OUT = ROOT / 'public' / 'pjfm'
API = 'https://api.cartesia.ai'
VERSION = '2024-11-13'
MODEL = 'sonic-3.5'
QUINN = '045f0292-0731-4a4c-971d-64594fc2c35a'

INTRO = (
    'Powered by Voicera. Every question answered. Every connection made. '
    'Meet the AI assistant for The Glorious Church — helping visitors find service times, '
    'locate the Miracle Dome, explore English services, get in touch, and register for baptism, '
    'all through a simple conversation.'
)
END = (
    'Voicera, for The Glorious Church. Questions answered. Next steps made simple. '
    'Baptism registration received. The church team will follow up.'
)
OUTBOUND_INTRO = (
    'Powered by Voicera. The church reaches out first. '
    'Watch the AI agent place a live outbound call for Prophet Jerome Fernando Ministries — '
    'sharing prayer service times, the Miracle Dome location, the faith line, '
    'and capturing a follow-up with Mr. Daniel.'
)
INBOUND_INTRO = (
    'Powered by Voicera. When a visitor calls, the AI answers. '
    'Watch a live inbound call to Prophet Jerome Fernando Ministries and The Glorious Church — '
    'service times at the Miracle Dome, and a prayer request from Rahul Sharma.'
)
FULL_INTRO = (
    'Powered by Voicera. One AI for Prophet Jerome Fernando Ministries and The Glorious Church — '
    'answering on the website, picking up when visitors call, and reaching out first.'
)
FULL_END = 'Voicera, for The Glorious Church. Every channel, one voice.'


def key() -> str:
    env = os.environ.get('CARTESIA_API_KEY', '').strip().strip('"').strip("'")
    if env:
        return env
    for path in ENVS:
        if not path.exists():
            continue
        for line in path.read_text(encoding='utf-8').splitlines():
            k, _, v = line.partition('=')
            if k.strip() == 'CARTESIA_API_KEY' and v.strip():
                return v.strip().strip('"').strip("'")
    sys.exit('CARTESIA_API_KEY not set')


def tts(text: str, dest: Path) -> float:
    body = {
        'model_id': MODEL,
        'transcript': text,
        'voice': {'mode': 'id', 'id': QUINN},
        'language': 'en',
        'output_format': {'container': 'raw', 'encoding': 'pcm_s16le', 'sample_rate': 44100},
        'generation_config': {'speed': 1.02},
    }
    req = urllib.request.Request(
        API + '/tts/bytes',
        data=json.dumps(body).encode(),
        headers={'X-API-Key': key(), 'Cartesia-Version': VERSION, 'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        pcm = r.read()
    dest.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(dest), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(44100)
        w.writeframes(pcm)
    sec = len(pcm) / 88200
    print('wrote', dest.name, f'{sec:.2f}s')
    return sec


def load_meta() -> dict:
    path = ROOT / 'src' / 'pjfm' / 'vo.json'
    if path.exists():
        return json.loads(path.read_text(encoding='utf-8'))
    return {}


def save_meta(meta: dict) -> None:
    path = ROOT / 'src' / 'pjfm' / 'vo.json'
    path.write_text(json.dumps(meta, indent=2), encoding='utf-8')
    print('vo.json', meta)


if __name__ == '__main__':
    only = sys.argv[1:] 
    meta = load_meta()
    if '--outbound' in only or not only:
        ob = tts(OUTBOUND_INTRO, OUT / 'vo-outbound-intro.wav')
        meta['outboundIntroSec'] = round(ob + 0.7, 2)
    if '--inbound' in only or not only:
        ib = tts(INBOUND_INTRO, OUT / 'vo-inbound-intro.wav')
        meta['inboundIntroSec'] = round(ib + 0.7, 2)
    if '--full' in only:
        fi = tts(FULL_INTRO, OUT / 'vo-full-intro.wav')
        fe = tts(FULL_END, OUT / 'vo-full-end.wav')
        meta['fullIntroSec'] = round(fi + 0.7, 2)
        meta['fullEndSec'] = round(fe + 0.9, 2)
    if '--chat' in only or not only:
        intro = tts(INTRO, OUT / 'vo-intro.wav')
        end = tts(END, OUT / 'vo-end.wav')
        meta['introSec'] = round(intro + 0.7, 2)
        meta['endSec'] = round(end + 0.55, 2)
    save_meta(meta)
