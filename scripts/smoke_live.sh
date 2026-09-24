#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -z "${ANTHROPIC_API_KEY:-}" ] || [ -z "${ELEVENLABS_API_KEY:-}" ] || [ -z "${ELEVENLABS_VOICE_ID:-}" ]; then
  echo 'Faltan credenciales. Rellenad env.sh localmente y ejecutad source env.sh. No se envió ninguna petición.' >&2
  exit 2
fi
if [ ! -x .venv/bin/python ]; then ./run.sh --prepare; fi
MOCK=0 .venv/bin/python scripts/smoke_live.py
