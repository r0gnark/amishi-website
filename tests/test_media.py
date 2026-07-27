"""Tests de la biblioteca multimedia del administrador."""

import os
from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from backend.main import app
from backend.routers.admin import media
from backend.routers import media as public_media

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


@pytest.fixture
def media_root(tmp_path, monkeypatch):
    root = tmp_path / "images"
    monkeypatch.setattr(media, "MEDIA_ROOT", root)
    monkeypatch.setattr(media, "UPLOAD_ROOT", root / "uploads")
    return root


@pytest.mark.asyncio
async def test_media_requires_authentication(media_root):
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/admin/media")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_media_returns_existing_images(media_root):
    product_folder = media_root / "productos"
    product_folder.mkdir(parents=True)
    (product_folder / "mishi.png").write_bytes(b"\x89PNG\r\n\x1a\n")

    with patch.dict(os.environ, ENV):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            await _login(client)
            response = await client.get("/api/admin/media")

    assert response.status_code == 200
    assert response.json() == {
        "items": [
            {
                "name": "mishi.png",
                "url": "/images/productos/mishi.png",
            }
        ]
    }


@pytest.mark.asyncio
async def test_upload_media_saves_image_and_lists_it(media_root):
    png_content = b"\x89PNG\r\n\x1a\n" + b"test-image"

    with patch.dict(os.environ, ENV):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            await _login(client)
            response = await client.post(
                "/api/admin/media",
                files={"file": ("Mi foto.png", png_content, "image/png")},
            )
            listing = await client.get("/api/admin/media")

    assert response.status_code == 201
    uploaded = response.json()
    assert uploaded["url"].startswith("/images/uploads/mi-foto-")
    assert (media_root / uploaded["url"].removeprefix("/images/")).read_bytes() == png_content
    assert uploaded in listing.json()["items"]


@pytest.mark.asyncio
async def test_upload_media_rejects_invalid_content(media_root):
    with patch.dict(os.environ, ENV):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            await _login(client)
            response = await client.post(
                "/api/admin/media",
                files={"file": ("falso.png", b"not-an-image", "image/png")},
            )

    assert response.status_code == 400
    assert not list(media_root.rglob("*"))


@pytest.mark.asyncio
async def test_upload_media_uses_s3_when_bucket_is_configured(media_root):
    png_content = b"\x89PNG\r\n\x1a\n" + b"production-image"
    s3_client = MagicMock()

    with (
        patch.dict(os.environ, {**ENV, "S3_BUCKET": "amishi-catalog"}, clear=True),
        patch.object(media, "_s3_client", return_value=s3_client),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            await _login(client)
            response = await client.post(
                "/api/admin/media",
                files={"file": ("Nueva foto.png", png_content, "image/png")},
            )

    assert response.status_code == 201
    uploaded = response.json()
    assert uploaded["url"].startswith("/api/media/uploads/nueva-foto-")
    put_arguments = s3_client.put_object.call_args.kwargs
    assert put_arguments["Bucket"] == "amishi-catalog"
    assert put_arguments["Body"] == png_content
    assert put_arguments["ContentType"] == "image/png"
    assert not list(media_root.rglob("*"))


@pytest.mark.asyncio
async def test_public_media_serves_local_upload(media_root, monkeypatch):
    upload = media_root / "uploads" / "mishi.png"
    upload.parent.mkdir(parents=True)
    upload.write_bytes(b"\x89PNG\r\n\x1a\n")
    monkeypatch.setattr(public_media, "MEDIA_ROOT", media_root)

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/media/uploads/mishi.png")

    assert response.status_code == 200
    assert response.content == b"\x89PNG\r\n\x1a\n"
    assert response.headers["cache-control"] == "public, max-age=31536000, immutable"


@pytest.mark.asyncio
async def test_public_media_rejects_path_traversal(media_root, monkeypatch):
    monkeypatch.setattr(public_media, "MEDIA_ROOT", media_root)

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/media/uploads/../catalog.json")

    assert response.status_code == 404
