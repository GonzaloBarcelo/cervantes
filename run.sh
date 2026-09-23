#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export UV_CACHE_DIR="$PWD/.cache/uv"
export UV_PYTHON_INSTALL_DIR="$PWD/.runtime/python"
if command -v uv >/dev/null 2>&1; then UV="$(command -v uv)";
elif [ -x .bootstrap/bin/uv ]; then UV="$PWD/.bootstrap/bin/uv";
else python3 -m pip install --target .bootstrap uv; UV="$PWD/.bootstrap/bin/uv"; fi
"$UV" sync --python 3.12
(cd frontend && npm ci --cache ../.cache/npm && npm run build)
exec "$UV" run python -m backend
