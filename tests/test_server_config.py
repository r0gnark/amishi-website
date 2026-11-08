"""Coherencia entre systemd, Caddy, el script de instalación y la app FastAPI."""

import re
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

from backend.main import app

ROOT = Path(__file__).resolve().parents[1]
API_UNIT = (ROOT / "infra" / "systemd" / "amishi-api.service").read_text(encoding="utf-8")
CADDYFILE = (ROOT / "infra" / "systemd" / "Caddyfile").read_text(encoding="utf-8")
INSTALL_SCRIPT = (ROOT / "infra" / "scripts" / "server_install.sh").read_text(
    encoding="utf-8"
)


def _exec_start() -> str:
    match = re.search(r"^ExecStart=(.+)$", API_UNIT, re.MULTILINE)
    assert match, "amishi-api.service no define ExecStart"
    return match.group(1)


def _uvicorn_port() -> str:
    match = re.search(r"--port (\d+)", _exec_start())
    assert match, "ExecStart no fija --port"
    return match.group(1)


def test_api_unit_serves_the_fastapi_app():
    assert "backend.main:app" in _exec_start()
    assert app.title == "Amishi API"


def test_api_unit_only_listens_on_localhost():
    assert "--host 127.0.0.1" in _exec_start()


def test_api_unit_does_not_run_as_root():
    assert re.search(r"^User=amishi$", API_UNIT, re.MULTILINE)


def test_caddy_proxies_to_the_uvicorn_port():
    assert f"reverse_proxy 127.0.0.1:{_uvicorn_port()}" in CADDYFILE


@pytest.mark.asyncio
async def test_install_health_check_targets_an_existing_route():
    match = re.search(r"http://127\.0\.0\.1:(\d+)(/api/[\w/-]+)", INSTALL_SCRIPT)
    assert match, "server_install.sh no tiene health check local"
    port, path = match.groups()
    assert port == _uvicorn_port()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(path)

    assert response.status_code == 200
