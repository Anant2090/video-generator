"""Two ending lines for the 16:9 hotel film. Key is read inside cartesia and never printed."""
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT.parent / 'SATS' / 'sats-motion' / 'scripts' / 'cartesia.py'
spec = importlib.util.spec_from_file_location('cartesia', path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
mod.ENVS = [ROOT.parent / 'SATS' / 'sats-motion' / '.env', ROOT.parent / '.env', ROOT / '.env']

VO = ROOT / 'public' / 'hotel' / 'vo'
NADIA = 'efddb3d2-4464-45e0-9f8a-fcd5fd4fc54f'
mod.tts(NADIA, "You're checked in to vee Hotel. How can I help you?", VO / 'open-checked.wav', 1.08)
