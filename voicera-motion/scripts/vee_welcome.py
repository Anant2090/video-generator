"""VEE welcome greeting. The API key is read inside cartesia and never printed."""
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT.parent / 'SATS' / 'sats-motion' / 'scripts' / 'cartesia.py'
spec = importlib.util.spec_from_file_location('cartesia', path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
mod.ENVS = [ROOT.parent / 'SATS' / 'sats-motion' / '.env', ROOT.parent / '.env', ROOT / '.env']

NADIA = 'efddb3d2-4464-45e0-9f8a-fcd5fd4fc54f'
TEXT = (
    "Hello, welcome. You're checked in to vee Hotel. "
    "I can help you with room service, local deals, and restaurants."
)
mod.tts(NADIA, TEXT, ROOT / 'out' / 'vee-welcome.wav', 1.08)
