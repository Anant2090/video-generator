"""Deliberately slow local chat agent (Legion text-tier HTTP AUT) so a run is visibly live.

python agent_server.py [delay_s]   -> POST http://127.0.0.1:8099/respond  {turn, transcript} -> {text, terminal}
"""
import json
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from seed import AGENT

DELAY = float(sys.argv[1]) if len(sys.argv) > 1 else 0.35


class H(BaseHTTPRequestHandler):
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers['Content-Length'] or 0)) or b'{}')
        turn = int(body.get('turn', 0))
        time.sleep(DELAY)
        out = json.dumps({'text': AGENT[min(turn, len(AGENT) - 1)], 'terminal': turn >= len(AGENT) - 1}).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(out)))
        self.end_headers()
        self.wfile.write(out)

    def log_message(self, *a):
        pass


ThreadingHTTPServer(('127.0.0.1', 8099), H).serve_forever()
