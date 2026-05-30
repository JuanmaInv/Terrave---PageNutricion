import json
import os
from pathlib import Path
import sys
from http.server import BaseHTTPRequestHandler

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from python.excel_builder import build_workbook


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            expected_token = os.getenv("EXCEL_EXPORT_INTERNAL_TOKEN", "").strip()
            if expected_token:
                received = self.headers.get("x-excel-export-token", "").strip()
                if received != expected_token:
                    self.send_response(401)
                    self.send_header("Content-Type", "text/plain; charset=utf-8")
                    self.end_headers()
                    self.wfile.write(b"Unauthorized")
                    return

            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length) if length > 0 else b"{}"
            payload = json.loads(raw.decode("utf-8")) if raw else {}

            content = build_workbook(payload)
            self.send_response(200)
            self.send_header(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            self.send_header("Content-Disposition", "attachment; filename=nutrilen-encuestas.xlsx")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as error:
            msg = str(error).encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)

    def do_GET(self):
        self.send_response(405)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"Method Not Allowed")
