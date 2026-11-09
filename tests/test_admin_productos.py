"""Tests de API para /api/admin/productos (features 8 y 9)."""

import os
from unittest.mock import patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from backend.main import app

ENV = {
    "ADMIN_EMAIL": "admin@test.cl",
    "ADMIN_PASSWORD": "pass123",
    "SECRET_KEY": "test-secret-32-chars-long-enough!",
}


async def _auth_client() -> tuple[AsyncClient, dict]:
    """Devuelve cliente autenticado y headers con cookie."""
    transport = ASGITransport(app=app)
    client = AsyncClient(transport=transport, base_url="http://test")
    resp = await client.post(
        "/api/auth/login",
        json={"email": ENV["ADMIN_EMAIL"], "password": ENV["ADMIN_PASSWORD"]},
    )
    assert resp.status_code == 200
    return client, {}


@pytest.mark.asyncio
async def test_create_product_unauthenticated_returns_401():
    with patch.dict(os.environ, ENV):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/api/admin/productos", json={
                "name": "Test", "price": 1000, "image": "/img.jpeg", "category": "imanes"
            })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_product_authenticated_returns_201():
    with patch.dict(os.environ, ENV):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            login = await client.post(
                "/api/auth/login",
                json={"email": ENV["ADMIN_EMAIL"], "password": ENV["ADMIN_PASSWORD"]},
            )
            assert login.status_code == 200
            resp = await client.post("/api/admin/productos", json={
                "name": "Nuevo Imán",
                "price": 4000,
                "image": "/images/test.jpeg",
                "category": "imanes",
            })
    assert resp.status_code == 201
    assert resp.json()["name"] == "Nuevo Imán"


@pytest.mark.asyncio
async def test_create_product_invalid_data_returns_422():
    with patch.dict(os.environ, ENV):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/auth/login",
                json={"email": ENV["ADMIN_EMAIL"], "password": ENV["ADMIN_PASSWORD"]},
            )
            resp = await client.post("/api/admin/productos", json={
                "name": "",
                "price": -1,
                "image": "/img.jpeg",
                "category": "no-existe",
            })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_update_product_unauthenticated_returns_401():
    with patch.dict(os.environ, ENV):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.patch("/api/admin/productos/any-slug", json={"price": 100})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_delete_product_unauthenticated_returns_401():
    with patch.dict(os.environ, ENV):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.delete("/api/admin/productos/any-slug")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_delete_product_not_found_returns_404():
    with patch.dict(os.environ, ENV):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/auth/login",
                json={"email": ENV["ADMIN_EMAIL"], "password": ENV["ADMIN_PASSWORD"]},
            )
            resp = await client.delete("/api/admin/productos/slug-no-existe")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_public_catalog_hides_stock_and_shows_availability():
    with patch.dict(os.environ, ENV):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/auth/login",
                json={"email": ENV["ADMIN_EMAIL"], "password": ENV["ADMIN_PASSWORD"]},
            )
            created = await client.post("/api/admin/productos", json={
                "name": "Pieza agotada",
                "price": 3000,
                "image": "/images/test.jpeg",
                "category": "imanes",
                "available": False,
                "stock": 0,
            })
            assert created.status_code == 201
            slug = created.json()["id"]

            public = await client.get(f"/api/productos/{slug}")
            admin = await client.get(f"/api/admin/productos/{slug}")

    assert public.status_code == 200
    assert public.json()["available"] is False
    assert "stock" not in public.json()
    assert admin.status_code == 200
    assert admin.json()["stock"] == 0


@pytest.mark.asyncio
async def test_admin_product_list_requires_auth_and_includes_stock():
    with patch.dict(os.environ, ENV):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            anonymous = await client.get("/api/admin/productos")
            await client.post(
                "/api/auth/login",
                json={"email": ENV["ADMIN_EMAIL"], "password": ENV["ADMIN_PASSWORD"]},
            )
            await client.post("/api/admin/productos", json={
                "name": "Con unidades",
                "price": 1500,
                "image": "/images/test.jpeg",
                "category": "imanes",
                "stock": 7,
            })
            listing = await client.get("/api/admin/productos")

    assert anonymous.status_code == 401
    assert listing.status_code == 200
    assert listing.json()[0]["stock"] == 7
    assert listing.json()[0]["available"] is True


@pytest.mark.asyncio
async def test_bulk_update_requires_auth_and_applies_availability():
    with patch.dict(os.environ, ENV):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            anonymous = await client.post(
                "/api/admin/productos/masivo",
                json={"ids": ["x"], "available": False},
            )
            await client.post(
                "/api/auth/login",
                json={"email": ENV["ADMIN_EMAIL"], "password": ENV["ADMIN_PASSWORD"]},
            )
            first = await client.post("/api/admin/productos", json={
                "name": "Pieza A",
                "price": 1000,
                "image": "/images/test.jpeg",
                "category": "imanes",
            })
            second = await client.post("/api/admin/productos", json={
                "name": "Pieza B",
                "price": 2000,
                "image": "/images/test.jpeg",
                "category": "imanes",
            })
            untouched = await client.post("/api/admin/productos", json={
                "name": "Pieza C",
                "price": 3000,
                "image": "/images/test.jpeg",
                "category": "imanes",
            })
            bulk = await client.post("/api/admin/productos/masivo", json={
                "ids": [first.json()["id"], second.json()["id"]],
                "available": False,
            })
            listing = await client.get("/api/admin/productos")

    assert anonymous.status_code == 401
    assert bulk.status_code == 200
    assert [item["available"] for item in bulk.json()] == [False, False]
    by_id = {item["id"]: item for item in listing.json()}
    assert by_id[untouched.json()["id"]]["available"] is True
    assert by_id[first.json()["id"]]["available"] is False


@pytest.mark.asyncio
async def test_bulk_update_missing_product_changes_nothing():
    with patch.dict(os.environ, ENV):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/auth/login",
                json={"email": ENV["ADMIN_EMAIL"], "password": ENV["ADMIN_PASSWORD"]},
            )
            created = await client.post("/api/admin/productos", json={
                "name": "Pieza intacta",
                "price": 1000,
                "image": "/images/test.jpeg",
                "category": "imanes",
            })
            missing = await client.post("/api/admin/productos/masivo", json={
                "ids": [created.json()["id"], "no-existe"],
                "available": False,
            })
            stored = await client.get(f"/api/admin/productos/{created.json()['id']}")

    assert missing.status_code == 404
    assert stored.json()["available"] is True


@pytest.mark.asyncio
async def test_bulk_update_without_changes_returns_422():
    with patch.dict(os.environ, ENV):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/auth/login",
                json={"email": ENV["ADMIN_EMAIL"], "password": ENV["ADMIN_PASSWORD"]},
            )
            resp = await client.post("/api/admin/productos/masivo", json={"ids": ["algo"]})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_negative_stock_returns_422():
    with patch.dict(os.environ, ENV):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            await client.post(
                "/api/auth/login",
                json={"email": ENV["ADMIN_EMAIL"], "password": ENV["ADMIN_PASSWORD"]},
            )
            resp = await client.post("/api/admin/productos", json={
                "name": "Stock inválido",
                "price": 1000,
                "image": "/images/test.jpeg",
                "category": "imanes",
                "stock": -3,
            })
    assert resp.status_code == 422
