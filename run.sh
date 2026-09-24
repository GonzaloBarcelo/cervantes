#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export UV_CACHE_DIR="$PWD/.cache/uv"
export UV_PYTHON_INSTALL_DIR="$PWD/.runtime/python"
if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  echo 'Instalad Node.js 20.19+ o 22.12+ (con npm) y volved a ejecutar ./run.sh.' >&2; exit 1
fi
if command -v uv >/dev/null 2>&1; then UV="$(command -v uv)";
elif [ -x .bootstrap/bin/uv ]; then UV="$PWD/.bootstrap/bin/uv";
else python3 -m pip install --target .bootstrap uv; UV="$PWD/.bootstrap/bin/uv"; fi
"$UV" sync --locked --python 3.12
if [ ! -f frontend/node_modules/.package-lock.json ] || [ frontend/package-lock.json -nt frontend/node_modules/.package-lock.json ]; then
  (cd frontend && npm ci --cache ../.cache/npm)
fi
(cd frontend && npm run build)
if [ "${1:-}" = '--prepare' ]; then exit 0; fi
exec "$UV" run python -m backend
