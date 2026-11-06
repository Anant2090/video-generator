"""VEE Hotel guest + assistant lines -> public/hotel/vo/*.wav, mix.wav, src/hotel/cues.json.

Cartesia key is read from .env at runtime and never printed.
"""
from __future__ import annotations

import importlib.util
import json
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
VO = ROOT / 'public' / 'hotel' / 'vo'
CUES = ROOT / 'src' / 'hotel' / 'cues.json'
SR = 44100

JUSTIN = 'df38a4f6-5d10-4fe7-b268-952aef25d76a'  # guest
NADIA = 'efddb3d2-4464-45e0-9f8a-fcd5fd4fc54f'  # VEE

# id, who, spoken, caption. "vee" is spoken as one word; the caption stays VEE.
LINES = [
    ('g1', 'guest', 'Hi vee, how can you help me?', 'Hi VEE, how can you help me?'),
    ('v1', 'vee', 'I can help with restaurants, local deals, and room service. What are you looking for?', None),
    ('g2', 'guest', 'I want dinner tonight. What do you recommend?', None),
    ('v2', 'vee', 'Tap Local Coupons. Nearby restaurants and offers are right there.', None),
    ('g3', 'guest', "Great, let's check it out.", None),
    ('v3', 'vee', 'Here are some nearby favorites. Pick a place for tonight.', None),
    ('g4', 'guest', 'This looks great. Can you reserve a table?', None),
    ('v4', 'vee', 'What time, and for how many?', None),
    ('g5', 'guest', 'Seven thirty tonight, for two.', None),
    ('v5', 'vee', 'Your request is with the hotel team. Want a text when it is confirmed?', None),
    ('g6', 'guest', 'Yes, please.', None),
    ('v7', 'vee', "We'll text you when it's confirmed.", None),
]


def cartesia():
    path = ROOT.parent / 'SATS' / 'sats-motion' / 'scripts' / 'cartesia.py'
    spec = importlib.util.spec_from_file_location('cartesia', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.ENVS = [ROOT.parent / 'SATS' / 'sats-motion' / '.env', ROOT.parent / '.env', ROOT / '.env']
    return mod


def dur_of(path: Path) -> float:
    with wave.open(str(path), 'rb') as w:
        return w.getnframes() / w.getframerate()


def synth(force: bool = False) -> dict[str, float]:
    c = cartesia()
    voice = {'guest': JUSTIN, 'vee': NADIA}
    speed = {'guest': 1.12, 'vee': 1.08}
    durs = {}
    meta_path = VO / 'meta.json'
    meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
    for i, who, text, _show in LINES:
        dest = VO / f'{i}.wav'
        prev = meta.get(i, {})
        if dest.exists() and prev.get('text') == text and not force:
            durs[i] = dur_of(dest)
            continue
        c.tts(voice[who], text, dest, speed[who])
        durs[i] = dur_of(dest)
        meta[i] = {'text': text, 'dur': round(durs[i], 3)}
    meta_path.write_text(json.dumps(meta, indent=1))
    return durs


def place(durs: dict[str, float]) -> dict:
    gap = 0.2
    hold_tap = 0.7
    t = 0.35
    lines = []
    by_id = {}
    for i, who, spoken, show in LINES:
        extra = hold_tap if i in ('g3', 'v5') else 0.0
        t += extra
        item = {'id': i, 'who': who, 'text': show or spoken, 'at': round(t, 3), 'dur': round(durs[i], 3)}
        lines.append(item)
        by_id[i] = item
        t += durs[i] + gap

    def end(i: str) -> float:
        return by_id[i]['at'] + by_id[i]['dur']

    tap_coupons = round(end('v2') + 0.15, 3)
    coupons_in = round(tap_coupons + 0.4, 3)
    scroll = round(max(coupons_in + 1.1, by_id['v3']['at'] + 0.3), 3)
    garden_in = round(end('v3') + 0.25, 3)
    photos = round(garden_in + 1.3, 3)
    tap_reserve = round(end('g5') + 0.2, 3)
    banner = round(tap_reserve + 0.55, 3)
    sms_in = round(by_id['g6']['at'] - 0.15, 3)
    end_card = round(max(36.0, end('v7') + 0.45), 3)
    total = 42.0 if end_card <= 37.6 else round(end_card + 5.2, 2)
    return {
        'fps': 30,
        'total': total,
        'frames': int(round(total * 30)),
        'lines': lines,
        'marks': {
            'tapCoupons': tap_coupons,
            'couponsIn': coupons_in,
            'scroll': scroll,
            'gardenIn': garden_in,
            'photos': photos,
            'tapReserve': tap_reserve,
            'banner': banner,
            'smsIn': sms_in,
            'end': end_card,
        },
    }


def pcm(path: Path) -> np.ndarray:
    with wave.open(str(path), 'rb') as w:
        n = w.getnframes()
        raw = w.readframes(n)
        x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
        if w.getnchannels() == 2:
            x = x.reshape(-1, 2).mean(axis=1)
        if w.getframerate() != SR:
            raise SystemExit(f'unexpected rate {path}')
        return x


def click(n: int = int(0.06 * SR)) -> np.ndarray:
    rng = np.random.default_rng(3)
    t = np.arange(n) / SR
    return (rng.standard_normal(n) * np.exp(-t * 70) * 0.25).astype(np.float32)


def mix(cues: dict) -> None:
    total = cues['total'] + 0.2
    buf = np.zeros(int(total * SR), dtype=np.float32)
    tt = np.arange(len(buf)) / SR
    pad = (
        0.012 * np.sin(2 * np.pi * 196 * tt)
        + 0.008 * np.sin(2 * np.pi * 247 * tt)
        + 0.006 * np.sin(2 * np.pi * 294 * tt)
    ) * (0.35 + 0.65 * np.sin(2 * np.pi * 0.05 * tt) ** 2)
    buf += pad * 0.35
    for line in cues['lines']:
        x = pcm(VO / f"{line['id']}.wav")
        i = int(line['at'] * SR)
        buf[i:i + len(x)] += x * 0.9
    clk = click()
    for mark in ('tapCoupons', 'tapReserve'):
        i = int(cues['marks'][mark] * SR)
        buf[i:i + len(clk)] += clk
    peak = np.max(np.abs(buf)) or 1
    buf = np.clip(buf / peak * 0.9, -1, 1)
    stereo = np.column_stack([buf, buf])
    out = ROOT / 'public' / 'hotel' / 'mix.wav'
    with wave.open(str(out), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((stereo * 32767).astype(np.int16).tobytes())
    print('mix', round(total, 2), 's peak', round(float(peak), 3))


def main() -> None:
    VO.mkdir(parents=True, exist_ok=True)
    durs = synth()
    for i, who, _spoken, _show in LINES:
        print(f'{i:3} {who:5} {durs[i]:5.2f}s')
    cues = place(durs)
    CUES.parent.mkdir(parents=True, exist_ok=True)
    CUES.write_text(json.dumps(cues, indent=1))
    print('marks', json.dumps(cues['marks']))
    print('total', cues['total'])
    mix(cues)


if __name__ == '__main__':
    main()
