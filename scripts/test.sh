#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
./run.sh --prepare > reports/build.txt 2>&1
.venv/bin/python -m pytest -q | tee reports/backend-tests.txt
.venv/bin/python scripts/gallery.py
(cd frontend && npx playwright install chromium)
env -u ANTHROPIC_API_KEY -u ELEVENLABS_API_KEY -u ELEVENLABS_VOICE_ID MOCK=1 .venv/bin/python -m uvicorn backend.app:app --host 127.0.0.1 --port 8765 > reports/test-server.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT
.venv/bin/python - <<'PY'
import time, urllib.request
for attempt in range(100):
    try:
        with urllib.request.urlopen('http://127.0.0.1:8765/api/health') as response:
            assert response.status == 200
            break
    except OSError:
        time.sleep(.1)
else:
    raise SystemExit('No se pudo iniciar el servidor de pruebas.')
PY
(cd frontend && TEST_BASE_URL=http://127.0.0.1:8765 npx playwright test) | tee reports/browser-tests.txt
.venv/bin/python scripts/gallery.py
