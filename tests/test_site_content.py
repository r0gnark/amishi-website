"""Tests de API para /api/contenido y /api/admin/contenido (feature 10)."""

import os
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient

from backend.main import app

ENV = {
    "ADMIN_EMAIL": "admin@test.cl",
    "ADMIN_PASSWORD": "pass123",
    "SECRET_KEY": "test-secret-32-chars-long-enough!",
}


@pytest.mark.asyncio
async def test_public_contenido_returns_defaults():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/contenido")
    assert resp.status_code == 200
    body = resp.json()
    assert "about" in body
    assert "announcementBar" in body


@pytest.mark.asyncio
async def test_update_contenido_unauthenticated_returns_401():
    with patch.dict(os.environ, ENV):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.patch("/api/admin/contenido", json={"about": "Hola"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_update_and_read_contenido():
    with patch.dict(os.environ, ENV):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/auth/login",
                json={"email": ENV["ADMIN_EMAIL"], "password": ENV["ADMIN_PASSWORD"]},
            )
            patch_resp = await client.patch(
                "/api/admin/contenido",
                json={"about": "Somos Amishi", "announcementBar": "Envíos a todo Chile"},
            )
            assert patch_resp.status_code == 200
            body = patch_resp.json()
            assert body["about"] == "Somos Amishi"
            assert body["announcementBar"] == "Envíos a todo Chile"


@pytest.mark.asyncio
async def test_update_contenido_partial_patch():
    with patch.dict(os.environ, ENV):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/auth/login",
                json={"email": ENV["ADMIN_EMAIL"], "password": ENV["ADMIN_PASSWORD"]},
            )
            await client.patch(
                "/api/admin/contenido",
                json={"about": "Texto A", "announcementBar": "Bar A"},
            )
            resp = await client.patch("/api/admin/contenido", json={"about": "Texto B"})
            body = resp.json()
            assert body["about"] == "Texto B"
            assert body["announcementBar"] == "Bar A"
