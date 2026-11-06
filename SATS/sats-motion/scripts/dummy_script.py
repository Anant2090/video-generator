"""Parse assets/dummy/script.txt into five narration blocks (demo1–demo5).

Blocks are separated by one or more blank lines. Lines starting with # are ignored.
Optional per-block show text: first line ``show: ...`` (display/captions), remainder is spoken.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'assets' / 'dummy' / 'script.txt'
IDS = [f'demo{i}' for i in range(1, 6)]


def load(path: Path | None = None) -> list[tuple[str, str, str]]:
    """Return [(id, spoken, show), ...] for demo1..demo5."""
    path = path or SCRIPT
    raw = path.read_text(encoding='utf-8') if path.exists() else ''
    chunks = [c.strip() for c in raw.replace('\r\n', '\n').split('\n\n') if c.strip()]
    chunks = [c for c in chunks if not all(l.strip().startswith('#') or not l.strip() for l in c.splitlines())]
    if len(chunks) != 5:
        raise SystemExit(
            f'{path} must contain exactly 5 non-empty blocks separated by blank lines (found {len(chunks)}). '
            f'Expected keys: {", ".join(IDS)}.'
        )
    out: list[tuple[str, str, str]] = []
    for key, chunk in zip(IDS, chunks):
        lines = [ln for ln in chunk.splitlines() if ln.strip() and not ln.strip().startswith('#')]
        show = None
        if lines and lines[0].lower().startswith('show:'):
            show = lines[0].split(':', 1)[1].strip()
            lines = lines[1:]
        spoken = ' '.join(ln.strip() for ln in lines).strip()
        if not spoken:
            raise SystemExit(f'Empty narration in block {key} in {path}')
        out.append((key, spoken, show or spoken))
    return out
