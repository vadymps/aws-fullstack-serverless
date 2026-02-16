#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_FILE="$ROOT_DIR/backend/src/app.py"
OUT_ZIP="$ROOT_DIR/infra/lambda.zip"
BUILD_DIR="$ROOT_DIR/backend/.build"

if [[ ! -f "$SRC_FILE" ]]; then
  echo "Missing Lambda source file: $SRC_FILE" >&2
  exit 1
fi

rm -f "$OUT_ZIP"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

cp "$SRC_FILE" "$BUILD_DIR/app.py"

cd "$BUILD_DIR"
zip -r "$OUT_ZIP" app.py

echo "Created $OUT_ZIP"
