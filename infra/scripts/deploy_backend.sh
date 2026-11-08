#!/usr/bin/env bash
# deploy_backend.sh — Publica el backend en la instancia t4g.nano vía S3 + SSM.
#
# Requiere que `terraform apply` ya se haya ejecutado en infra/terraform (lee
# sus outputs), AWS CLI con credenciales de la cuenta del entorno y python3.
#
# Uso: AWS_REGION=us-east-1 bash infra/scripts/deploy_backend.sh [release_id]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TF_DIR="$ROOT_DIR/infra/terraform"

RELEASE_ID="${1:-$(git -C "$ROOT_DIR" rev-parse --short=12 HEAD)}"
REGION="${AWS_REGION:?Define AWS_REGION}"

log() { echo "==> $*"; }

tf_output() { terraform -chdir="$TF_DIR" output -raw "$1"; }

INSTANCE_ID="$(tf_output api_instance_id)"
BUCKET="$(tf_output s3_bucket_name)"
PARAM_PREFIX="$(tf_output api_parameter_prefix)"
API_URL="$(tf_output api_url)"
PUBLIC_IP="$(tf_output api_public_ip)"
RELEASE_KEY="releases/$RELEASE_ID.zip"

BUILD_DIR="$(mktemp -d)"
trap 'rm -rf "$BUILD_DIR"' EXIT
BUNDLE="$BUILD_DIR/backend.zip"

log "Empaquetando backend ($RELEASE_ID)..."
python3 - "$ROOT_DIR" "$BUNDLE" <<'PY'
import json
import sys
import zipfile
from pathlib import Path

root = Path(sys.argv[1])
destination = Path(sys.argv[2])
image_extensions = {".jpg", ".jpeg", ".png", ".webp"}
text_suffixes = {".py", ".sh", ".service", ".txt", ""}


def add(archive: zipfile.ZipFile, path: Path) -> None:
    relative = path.relative_to(root).as_posix()
    data = path.read_bytes()
    # A bundle built from a Windows checkout must still run on Linux.
    if path.suffix in text_suffixes:
        data = data.replace(b"\r\n", b"\n")
    archive.writestr(relative, data)


images = root / "public" / "images"
static_media = [
    {
        "name": path.name,
        "url": f"/images/{path.relative_to(images).as_posix()}",
    }
    for path in images.rglob("*")
    if path.is_file() and path.suffix.lower() in image_extensions
]

with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as archive:
    for path in sorted((root / "backend").rglob("*")):
        if not path.is_file() or "__pycache__" in path.parts:
            continue
        if path.suffix in {".pyc", ".pyo"}:
            continue
        add(archive, path)
    add(archive, root / "requirements.txt")
    add(archive, root / "infra" / "scripts" / "server_install.sh")
    for path in sorted((root / "infra" / "systemd").iterdir()):
        add(archive, path)
    archive.writestr(
        "backend/static_media.json",
        json.dumps(sorted(static_media, key=lambda item: item["url"]), ensure_ascii=False),
    )
PY

log "Subiendo s3://$BUCKET/$RELEASE_KEY..."
aws s3 cp "$BUNDLE" "s3://$BUCKET/$RELEASE_KEY" --region "$REGION" --only-show-errors

log "Esperando a que $INSTANCE_ID esté registrada en SSM..."
for attempt in $(seq 1 60); do
    ping_status="$(aws ssm describe-instance-information \
        --region "$REGION" \
        --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
        --query 'InstanceInformationList[0].PingStatus' \
        --output text 2>/dev/null || true)"
    if [ "$ping_status" = "Online" ]; then
        break
    fi
    if [ "$attempt" -eq 60 ]; then
        echo "La instancia no se registró en SSM tras 10 minutos" >&2
        exit 1
    fi
    sleep 10
done

PARAMETERS="$(python3 - "$RELEASE_ID" "s3://$BUCKET/$RELEASE_KEY" "$PARAM_PREFIX" "$REGION" <<'PY'
import json
import sys

release, source, prefix, region = sys.argv[1:]
remote = f"/tmp/amishi-release-{release}"
print(json.dumps({"commands": [
    "set -euo pipefail",
    f"rm -rf {remote} && mkdir -p {remote}",
    f"aws s3 cp {source} {remote}/backend.zip --region {region} --only-show-errors",
    f"python3 -m zipfile -e {remote}/backend.zip {remote}/src",
    f"bash {remote}/src/infra/scripts/server_install.sh {release} {prefix} {region}",
    f"rm -rf {remote}",
]}))
PY
)"

log "Ejecutando la instalación en $INSTANCE_ID..."
COMMAND_ID="$(aws ssm send-command \
    --region "$REGION" \
    --instance-ids "$INSTANCE_ID" \
    --document-name AWS-RunShellScript \
    --comment "amishi backend $RELEASE_ID" \
    --timeout-seconds 600 \
    --parameters "$PARAMETERS" \
    --query Command.CommandId \
    --output text)"

command_status="Pending"
for _ in $(seq 1 120); do
    sleep 10
    command_status="$(aws ssm get-command-invocation \
        --region "$REGION" \
        --command-id "$COMMAND_ID" \
        --instance-id "$INSTANCE_ID" \
        --query Status \
        --output text 2>/dev/null || echo Pending)"
    case "$command_status" in
        Pending | InProgress | Delayed) continue ;;
        *) break ;;
    esac
done

for stream in StandardOutputContent StandardErrorContent; do
    aws ssm get-command-invocation \
        --region "$REGION" \
        --command-id "$COMMAND_ID" \
        --instance-id "$INSTANCE_ID" \
        --query "$stream" \
        --output text || true
done

if [ "$command_status" != "Success" ]; then
    echo "La instalación terminó con estado: $command_status" >&2
    exit 1
fi

log "Verificando $API_URL/api/productos..."
for _ in $(seq 1 18); do
    if curl -fsS -o /dev/null --max-time 10 "$API_URL/api/productos"; then
        log "API pública OK: $API_URL"
        exit 0
    fi
    sleep 10
done

echo "::warning::La API responde dentro de la instancia, pero $API_URL todavía no responde por HTTPS. Si usas un dominio propio, apunta su registro A a $PUBLIC_IP."
