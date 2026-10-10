"""v5 VO (slower middle, a few added lines) -> public/legion5/vo.wav + words.json. Leaves public/legion/ alone.

  python scripts/legion5_vo.py VOICE_ID [speed]
"""
import sys

import legion_vo as v

v.OUT = v.ROOT / 'public' / 'legion5'
v.SCRIPT = (
    'Your AI agent takes thousands of calls. Which ones went wrong? '
    "I'm V. Meet V Legion. "
    'I test your voice and chat agents with a legion of realistic callers: '
    'frustrated, confused... and a few troublemakers. '
    'Define what a good call looks like, in plain words. Run hundreds at once. '
    'And I score every call: pass rate, goals met, attacks resisted. '
    'And I show you exactly why one failed. '
    'Even your real calls. Import one from production, and it is scored with the same checks. '
    'V Legion. Catch it before your customers do.'
)

if __name__ == '__main__':
    v.OUT.mkdir(parents=True, exist_ok=True)
    v.full(sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else None)
