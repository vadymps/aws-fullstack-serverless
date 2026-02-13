#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$ROOT_DIR/backend/src"
OUT_ZIP="$ROOT_DIR/infra/lambda.zip"
REQS_FILE="$ROOT_DIR/backend/requirements.txt"
BUILD_DIR="$ROOT_DIR/backend/.build"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Missing source dir: $SRC_DIR" >&2
  exit 1
fi

rm -f "$OUT_ZIP"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

if [[ -f "$REQS_FILE" && -s "$REQS_FILE" ]]; then
  if command -v python3 >/dev/null 2>&1; then
    python3 -m pip install -r "$REQS_FILE" -t "$BUILD_DIR"
  else
    python -m pip install -r "$REQS_FILE" -t "$BUILD_DIR"
  fi
fi

cp -R "$SRC_DIR"/. "$BUILD_DIR"/

cd "$BUILD_DIR"
zip -r "$OUT_ZIP" . -x "*.pyc" "__pycache__/*"

echo "Created $OUT_ZIP"
