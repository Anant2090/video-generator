"""Cartesia lines -> public/audio/{vo,call}/<id>.wav + src/data/lines.json (durations + word timings).

  python scripts/audio.py            # generate missing lines only
  python scripts/audio.py vo4b A3    # force-regenerate these ids

Spoken text is phonetic where needed ("A W B", "Voicera C X"); `show` is what captions display.
"""
import base64
import json
import sys
import wave

import cartesia as c

c.ENVS = [c.ROOT / '.env', c.ROOT.parents[1] / '.env']
AUD = c.ROOT / 'public' / 'audio'
DATA = c.ROOT / 'src' / 'data' / 'lines.json'

QUINN = '045f0292-0731-4a4c-971d-64594fc2c35a'
COLIN = 'e39b9fc0-23f5-4616-962a-da99c8ccb1dc'
JUSTIN = 'df38a4f6-5d10-4fe7-b268-952aef25d76a'
NADIA = 'efddb3d2-4464-45e0-9f8a-fcd5fd4fc54f'
VOICE = {'narrator': QUINN, 'agent': COLIN, 'consignee': JUSTIN, 'counter': NADIA}
SPEED = {'narrator': 1.05, 'agent': 1.0, 'consignee': 1.08, 'counter': 1.0}

VO = {
    'vo1': 'A flight lands. Within minutes, every consignee waiting on that cargo needs to know: it\'s here, and what to do next.',
    'vo2': 'Today, that means phone calls, made one at a time. Calls that go unanswered. The same questions about status, pieces and '
           'collection, asked again and again. And very little left on record, once the call ends.',
    'vo3': 'This is SATS Import Tele Advice: an agentic AI voice workflow, built on Voicera C X dot A I, that makes those calls, '
           'answers those questions, and records every outcome.',
    'vo4a': 'Here is the complete workflow, on the Voicera C X Workflow Canvas.',
    'vo4b': 'It starts with an A T A event: the actual time of arrival. The trigger carries the air waybill, consignee, flight and '
            'arrival time, and starts the outbound call. The N O A Agent then speaks a personalised Notice of Arrival.',
    'vo4c': 'From there, the Supervisor takes over. It listens to what the consignee needs, and routes the conversation down one of three paths.',
    'vo4d': 'Shipment questions go to the Shipment Agent, which answers only from four Cosys-ready integrations: shipment status, '
            'A W B details, flight details, and arrival details.',
    'vo4e': 'Procedural questions go to the F A Q Agent, which draws only on approved SATS knowledge. '
            'And every answer is delivered through a single Response Node.',
    'vo5': "Here's how a call unfolds.",
    'vo6a': 'Not every call goes the same way.',
    'vo6b': "And if now isn't a good time...",
    'vo7': "If a call isn't answered, a dedicated path is configured to record the attempt, re-check the flight details, "
           'and return to the Supervisor for a second attempt.',
    'vo8': 'When the call ends, Record Acknowledgement stores the result: acknowledged, declined, callback requested, or no answer. '
           'Call Intelligence then captures the intent, the outcome, the next action, the agents used, and a summary, so every call can be reviewed.',
    'vo9': 'Every arrival, notified consistently. Every outcome, on record.',
    'vo10': 'SATS Import Tele Advice. Powered by Voicera C X dot A I.',
}

# (id, who, spoken, show)
CALL = [
    ('A1', 'agent', 'Hello, this is the SATS Import Tele Advice assistant, calling for Tan Freight Logistics. Am I speaking with Daniel?',
     'Hello, this is the SATS Import TeleAdvice assistant, calling for Tan Freight Logistics. Am I speaking with Daniel?'),
    ('A2', 'consignee', 'Yes, speaking.', None),
    ('A3', 'agent', 'Good afternoon, Daniel. This is a notice of arrival. Your shipment under air waybill ending four, five, one, eight, '
     'arrived today from Frankfurt at two thirty-two p.m.',
     'Good afternoon, Daniel. This is a notice of arrival. Your shipment under air waybill ending 4518 arrived today from Frankfurt at 2:32 p.m.'),
    ('A4', 'consignee', "Okay, great. What's the current status?", None),
    ('A5', 'agent', "It's been received at the import terminal, and it's ready for collection.", None),
    ('A6', 'consignee', 'How many pieces are under that A W B?', 'How many pieces are under that AWB?'),
    ('A7', 'agent', 'There are twelve pieces, with a total weight of four hundred and eighty-six kilograms.',
     'There are 12 pieces, with a total weight of 486 kilograms.'),
    ('A8', 'consignee', 'And what do I need to bring to collect it?', None),
    ('A9', 'agent', "Please bring the delivery order, your company's authorisation letter, and a valid photo I D.",
     "Please bring the delivery order, your company's authorisation letter, and a valid photo ID."),
    ('A10', 'consignee', 'Alright, noted. Thanks.', None),
    ('A11', 'agent', "You're welcome, Daniel. I've recorded your acknowledgement. Have a good day.", None),
    ('B1', 'consignee', 'Actually, can I speak to someone at the counter?', None),
    ('B2', 'agent', "Of course. I'll transfer you now, and pass on your air waybill details, so you won't need to repeat them.", None),
    ('B3', 'counter', 'Import counter, good afternoon.', None),
    ('C1', 'consignee', "I'm driving right now. Can you call me back after five?", None),
    ('C2', 'agent', "No problem. I've noted your request for a callback after five p.m. Drive safely.",
     "No problem. I've noted your request for a callback after 5 p.m. Drive safely."),
]


def sse(voice: str, text: str, speed: float):
    body = {
        'model_id': c.MODEL,
        'transcript': text,
        'voice': {'mode': 'id', 'id': voice},
        'language': 'en',
        'output_format': {'container': 'raw', 'encoding': 'pcm_s16le', 'sample_rate': 44100},
        'add_timestamps': True,
        'generation_config': {'speed': speed},
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


def main(force: set[str]):
    data = json.loads(DATA.read_text()) if DATA.exists() else {}
    jobs = [(k, 'narrator', t, None, 'vo') for k, t in VO.items()] + [(i, who, t, show, 'call') for i, who, t, show in CALL]
    for key, who, text, show, sub in jobs:
        dest = AUD / sub / f'{key}.wav'
        if dest.exists() and key in data and key not in force and data[key].get('text') == text:
            continue
        pcm, words = sse(VOICE[who], text, SPEED[who])
        dest.parent.mkdir(parents=True, exist_ok=True)
        with wave.open(str(dest), 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(44100)
            w.writeframes(pcm)
        data[key] = {'who': who, 'text': text, 'show': show or text, 'dur': round(len(pcm) / 88200, 3), 'words': words}
        print(f'{key:5} {who:9} {len(pcm) / 88200:6.2f}s  {len(words)} words')
    DATA.parent.mkdir(parents=True, exist_ok=True)
    DATA.write_text(json.dumps(data, indent=1))
    vo = sum(v['dur'] for k, v in data.items() if k.startswith('vo'))
    call = sum(v['dur'] for k, v in data.items() if not k.startswith('vo'))
    print(f'narration {vo:.1f}s, call lines {call:.1f}s')


if __name__ == '__main__':
    main(set(sys.argv[1:]))
