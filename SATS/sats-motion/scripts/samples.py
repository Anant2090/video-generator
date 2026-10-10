"""Voice audition samples -> public/audio/samples/<role>_<name>.wav"""
import cartesia as c

c.ENVS = [c.ROOT.parents[1] / '.env']
OUT = c.ROOT / 'public' / 'audio' / 'samples'

NARRATOR = ('This is SATS Import TeleAdvice: an agentic AI voice workflow, built on VOICERAcx dot A I, '
            'that makes those calls, answers those questions, and records every outcome.')
AGENT = ('Good afternoon, Daniel. This is a notice of arrival. Your shipment under air waybill ending '
         'four, five, one, eight arrived today from Frankfurt at two thirty-two p.m.')
CONSIGNEE = "Okay, great. What's the current status? ... I'm driving right now. Can you call me back after five?"
COUNTER = 'Import counter, good afternoon.'

CAST = {
    'narrator': (NARRATOR, {'marian': '26403c37-80c1-4a1a-8692-540551ca2ae5',
                            'quinn': '045f0292-0731-4a4c-971d-64594fc2c35a',
                            'courtney': '16a4052e-1f11-47ac-95f5-9330bee062f9'}),
    'agent': (AGENT, {'reed': '533b2990-5b82-45a4-b9f2-367776972ca6',
                      'colin': 'e39b9fc0-23f5-4616-962a-da99c8ccb1dc',
                      'daniel': '47c38ca4-5f35-497b-b1a3-415245fb35e1'}),
    'consignee': (CONSIGNEE, {'justin_sg': 'df38a4f6-5d10-4fe7-b268-952aef25d76a',
                              'krishna': 'c63361f8-d142-4c62-8da7-8f8149d973d6',
                              'devansh': '1259b7e3-cb8a-43df-9446-30971a46b8b0'}),
    'counter': (COUNTER, {'nadia_sg': 'efddb3d2-4464-45e0-9f8a-fcd5fd4fc54f'}),
}

if __name__ == '__main__':
    for role, (text, voices) in CAST.items():
        for name, vid in voices.items():
            c.tts(vid, text, OUT / f'{role}_{name}.wav')
