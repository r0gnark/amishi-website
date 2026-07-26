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

echo "==> Creando $ZIP_FILE..."
rm -f "$ZIP_FILE"
cd "$BUILD_DIR"
zip -r "$ZIP_FILE" . \
    --exclude "**/__pycache__/*" \
    --exclude "*.pyc" \
    --exclude "*.pyo" \
    --exclude "**/*.dist-info/*" \
    --exclude "**/*.egg-info/*"

ZIP_SIZE=$(du -sh "$ZIP_FILE" | cut -f1)
echo "==> Listo: $ZIP_FILE ($ZIP_SIZE)"

if [ "$(du -k "$ZIP_FILE" | cut -f1)" -gt 51200 ]; then
    echo "AVISO: El zip supera 50 MB. Considera subir a S3 antes de deploy:"
    echo "  aws s3 cp $ZIP_FILE s3://<bucket>/lambda_package.zip"
    echo "  aws lambda update-function-code --function-name <fn> --s3-bucket <bucket> --s3-key lambda_package.zip"
fi
