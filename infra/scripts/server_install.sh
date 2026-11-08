#!/usr/bin/env bash
# server_install.sh — Instala o actualiza el backend en la instancia t4g.nano.
#
# Lo ejecuta SSM Run Command (como root) dentro del bundle que publica
# infra/scripts/deploy_backend.sh. Es idempotente: el primer deploy prepara la
# instancia (swap, Python 3.12, Caddy, usuarios) y los siguientes solo
# reemplazan el código y reinician los servicios.
#
# Uso: bash server_install.sh <release_id> <ssm_parameter_prefix> <aws_region>

set -euo pipefail

RELEASE_ID="$1"
PARAM_PREFIX="$2"
REGION="$3"

CADDY_VERSION="2.11.9"
CADDY_SHA512="9e5e76d7888542924de2c25353ae87c5f77e2a22c5b1198633cae13688922282e05383d142599205c88d8d80eee5e967d291214d7abce4835329a191b20dd6e0"

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_ROOT="/opt/amishi"
RELEASE_DIR="$APP_ROOT/releases/$RELEASE_ID-$(date +%Y%m%d%H%M%S)"
KEEP_RELEASES=3

log() { echo "==> $*"; }

ssm_parameter() {
    aws ssm get-parameter --region "$REGION" --name "$1" --with-decryption --output json \
        | python3 -c 'import json, sys; sys.stdout.write(json.load(sys.stdin)["Parameter"]["Value"])'
}

wait_for_first_boot() {
    if command -v cloud-init >/dev/null 2>&1; then
        cloud-init status --wait >/dev/null || true
    fi
}

# 512 MB de RAM no alcanzan para dnf + pip sin swap.
ensure_swap() {
    if swapon --show=NAME --noheadings | grep -qx /swapfile; then
        return
    fi
    log "Creando swap de 1 GB..."
    if [ ! -f /swapfile ]; then
        dd if=/dev/zero of=/swapfile bs=1M count=1024 status=none
    fi
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile
    grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap defaults 0 0' >> /etc/fstab
}

ensure_python() {
    if command -v python3.12 >/dev/null 2>&1 && python3.12 -m pip --version >/dev/null 2>&1; then
        return
    fi
    log "Instalando Python 3.12..."
    dnf install -y -q python3.12 python3.12-pip
}

ensure_users() {
    id -u amishi >/dev/null 2>&1 || useradd --system --no-create-home --shell /sbin/nologin amishi
    id -u caddy >/dev/null 2>&1 || useradd --system --home-dir /var/lib/caddy --create-home --shell /sbin/nologin caddy
}

ensure_caddy() {
    if [ -x /usr/local/bin/caddy ] && /usr/local/bin/caddy version | grep -q "^v$CADDY_VERSION "; then
        return
    fi
    log "Instalando Caddy $CADDY_VERSION (arm64)..."
    local archive="caddy_${CADDY_VERSION}_linux_arm64.tar.gz"
    local workdir
    workdir="$(mktemp -d)"
    curl -fsSL -o "$workdir/$archive" \
        "https://github.com/caddyserver/caddy/releases/download/v$CADDY_VERSION/$archive"
    echo "$CADDY_SHA512  $workdir/$archive" | sha512sum -c --quiet -
    tar -xzf "$workdir/$archive" -C "$workdir" caddy
    install -m 755 "$workdir/caddy" /usr/local/bin/caddy
    rm -rf "$workdir"
}

install_release() {
    log "Instalando release en $RELEASE_DIR..."
    mkdir -p "$RELEASE_DIR"
    cp -r "$SRC_DIR/backend" "$SRC_DIR/requirements.txt" "$RELEASE_DIR/"
    python3.12 -m venv "$RELEASE_DIR/.venv"
    "$RELEASE_DIR/.venv/bin/pip" install \
        --quiet \
        --disable-pip-version-check \
        --cache-dir /var/cache/amishi-pip \
        --requirement "$RELEASE_DIR/requirements.txt"
    "$RELEASE_DIR/.venv/bin/python" -m compileall -q "$RELEASE_DIR/backend"
}

configure_services() {
    log "Configurando servicios..."
    install -d -m 755 /etc/amishi /etc/caddy

    (
        umask 077
        ssm_parameter "$PARAM_PREFIX/env" > /etc/amishi/api.env.new
        echo >> /etc/amishi/api.env.new
    )
    mv -f /etc/amishi/api.env.new /etc/amishi/api.env

    local domain
    domain="$(ssm_parameter "$PARAM_PREFIX/domain")"
    if [ -z "$domain" ]; then
        echo "El parámetro $PARAM_PREFIX/domain está vacío" >&2
        exit 1
    fi
    printf 'API_DOMAIN=%s\n' "$domain" > /etc/caddy/caddy.env
    install -m 644 "$SRC_DIR/infra/systemd/Caddyfile" /etc/caddy/Caddyfile
    install -m 644 "$SRC_DIR/infra/systemd/amishi-api.service" /etc/systemd/system/amishi-api.service
    install -m 644 "$SRC_DIR/infra/systemd/caddy.service" /etc/systemd/system/caddy.service
    systemctl daemon-reload
    systemctl enable --quiet amishi-api caddy
}

point_current_to() {
    ln -sfn "$1" "$APP_ROOT/current.new"
    mv -Tf "$APP_ROOT/current.new" "$APP_ROOT/current"
}

wait_for_api() {
    for _ in $(seq 1 30); do
        if curl -fsS -o /dev/null http://127.0.0.1:8000/api/productos; then
            return 0
        fi
        sleep 2
    done
    return 1
}

activate_release() {
    local previous=""
    if [ -L "$APP_ROOT/current" ]; then
        previous="$(readlink -f "$APP_ROOT/current")"
    fi

    point_current_to "$RELEASE_DIR"
    systemctl restart amishi-api

    if ! wait_for_api; then
        echo "La API no respondió en 127.0.0.1:8000" >&2
        journalctl -u amishi-api -n 50 --no-pager >&2 || true
        if [ -n "$previous" ] && [ -d "$previous" ]; then
            log "Rollback a $previous"
            point_current_to "$previous"
            systemctl restart amishi-api
        fi
        exit 1
    fi
    log "API OK en 127.0.0.1:8000"

    systemctl restart caddy
    if ! systemctl is-active --quiet caddy; then
        journalctl -u caddy -n 50 --no-pager >&2 || true
        exit 1
    fi
    log "Caddy activo para $(cut -d= -f2 /etc/caddy/caddy.env)"
}

prune_releases() {
    local current
    current="$(readlink -f "$APP_ROOT/current")"
    ls -1dt "$APP_ROOT"/releases/*/ | tail -n +$((KEEP_RELEASES + 1)) | while read -r dir; do
        if [ "$(readlink -f "$dir")" != "$current" ]; then
            rm -rf "$dir"
        fi
    done
}

wait_for_first_boot
ensure_swap
ensure_python
ensure_users
ensure_caddy
install_release
configure_services
activate_release
prune_releases
log "Deploy $RELEASE_ID listo"
