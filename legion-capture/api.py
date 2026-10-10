"""Tiny client for the local capture backend (legion-ctl serve --tenant-keys acme=demo-capture-key)."""
import json
import urllib.error
import urllib.request

BASE = 'http://127.0.0.1:8080'
KEY = 'demo-capture-key'  # local-only demo tenant key, not a real credential


def req(method: str, path: str, body=None):
    r = urllib.request.Request(
        BASE + path,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={'X-Legion-API-Key': KEY, 'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(r, timeout=600) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raise SystemExit(f'{method} {path} -> {e.code}: {e.read().decode()[:600]}')


get = lambda p: req('GET', p)
post = lambda p, b: req('POST', p, b)
put = lambda p, b: req('PUT', p, b)
