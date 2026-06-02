import json
from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from python.excel_builder import build_workbook


def main() -> None:
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw else {}
    content = build_workbook(payload)
    sys.stdout.buffer.write(content)


if __name__ == "__main__":
    main()
