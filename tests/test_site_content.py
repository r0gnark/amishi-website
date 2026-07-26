"""Tests de contenido y ajustes personalizables del sitio."""

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


async def _login(client: AsyncClient) -> None:
    response = await client.post(
        "/api/auth/login",
        json={"email": ENV["ADMIN_EMAIL"], "password": ENV["ADMIN_PASSWORD"]},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_public_contenido_returns_defaults():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/contenido")

    assert response.status_code == 200
    body = response.json()
    assert body["siteName"] == "amishi"
    assert body["contactUrl"] == "https://ig.me/m/amishi.cl"
    assert body["aboutImage"] == "/images/amishi-bienvenida.png"
    assert "about" in body
    assert "announcementBar" in body


@pytest.mark.asyncio
async def test_update_contenido_unauthenticated_returns_401():
    with patch.dict(os.environ, ENV):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.patch(
                "/api/admin/contenido",
                json={"about": "Hola"},
            )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_and_read_all_site_settings():
    settings = {
        "about": "Somos Amishi",
        "aboutTitle": "Nuestra historia",
        "aboutImage": "/images/sobre-amishi.png",
        "announcementBar": "Envíos a todo Chile",
        "siteName": "Amishi Tienda",
        "contactLabel": "Escríbenos",
        "contactUrl": "https://example.com/contacto",
        "instagramHandle": "@amishi",
        "instagramProfileUrl": "https://instagram.com/amishi",
        "footerText": "Hecho a mano en Chile",
    }

    with patch.dict(os.environ, ENV):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            await _login(client)
            update_response = await client.patch(
                "/api/admin/contenido",
                json=settings,
            )
            public_response = await client.get("/api/contenido")

    assert update_response.status_code == 200
    assert update_response.json() == settings
    assert public_response.json() == settings


@pytest.mark.asyncio
async def test_update_contenido_partial_patch_preserves_other_fields():
    with patch.dict(os.environ, ENV):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            await _login(client)
            await client.patch(
                "/api/admin/contenido",
                json={
                    "about": "Texto A",
                    "announcementBar": "Barra A",
                    "siteName": "Nombre original",
                },
            )
            response = await client.patch(
                "/api/admin/contenido",
                json={"about": "Texto B"},
            )

    body = response.json()
    assert body["about"] == "Texto B"
    assert body["announcementBar"] == "Barra A"
    assert body["siteName"] == "Nombre original"
