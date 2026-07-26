#!/usr/bin/env bash
# build_lambda.sh — Empaqueta el backend FastAPI + dependencias en lambda_package.zip
#
# Output: infra/lambda_package.zip (referenciado por infra/terraform/lambda.tf)
# Uso:    bash infra/scripts/build_lambda.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$INFRA_DIR/.." && pwd)"
BUILD_DIR="$INFRA_DIR/.lambda_build"
ZIP_FILE="$INFRA_DIR/lambda_package.zip"

echo "==> Limpiando build anterior..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

echo "==> Instalando dependencias Python en $BUILD_DIR..."
pip install \
    --quiet \
    --requirement "$ROOT_DIR/requirements.txt" \
    --target "$BUILD_DIR" \
    --upgrade

echo "==> Copiando código fuente del backend..."
cp -r "$ROOT_DIR/backend" "$BUILD_DIR/backend"

echo "==> Generando manifiesto de imágenes estáticas..."
python3 - "$ROOT_DIR/public/images" "$BUILD_DIR/backend/static_media.json" <<'PY'
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
destination = Path(sys.argv[2])
extensions = {".jpg", ".jpeg", ".png", ".webp"}
items = [
    {
        "name": path.name,
        "url": f"/images/{path.relative_to(root).as_posix()}",
    }
    for path in root.rglob("*")
    if path.is_file() and path.suffix.lower() in extensions
]
destination.write_text(
    json.dumps(sorted(items, key=lambda item: item["url"]), ensure_ascii=False),
    encoding="utf-8",
)
PY

echo "==> Creando $ZIP_FILE..."
rm -f "$ZIP_FILE"
python3 - "$BUILD_DIR" "$ZIP_FILE" <<'PY'
import sys
import zipfile
from pathlib import Path

root = Path(sys.argv[1])
destination = Path(sys.argv[2])
excluded_suffixes = {".pyc", ".pyo"}
excluded_parts = {"__pycache__"}

with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as archive:
    for path in root.rglob("*"):
        relative = path.relative_to(root)
        if not path.is_file():
            continue
        if path.suffix in excluded_suffixes or excluded_parts.intersection(relative.parts):
            continue
        if any(part.endswith((".dist-info", ".egg-info")) for part in relative.parts):
            continue
        archive.write(path, relative.as_posix())
PY

ZIP_SIZE=$(du -sh "$ZIP_FILE" | cut -f1)
echo "==> Listo: $ZIP_FILE ($ZIP_SIZE)"

if [ "$(du -k "$ZIP_FILE" | cut -f1)" -gt 51200 ]; then
    echo "AVISO: El zip supera 50 MB. Considera subir a S3 antes de deploy:"
    echo "  aws s3 cp $ZIP_FILE s3://<bucket>/lambda_package.zip"
    echo "  aws lambda update-function-code --function-name <fn> --s3-bucket <bucket> --s3-key lambda_package.zip"
fi
