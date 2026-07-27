"""Tests para backend/services/auth.py."""

import json
import os
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient
from jose import jwt

from backend.main import app
from backend.services.auth import (
    COOKIE_NAME,
    _ALGORITHM,
    change_password,
    create_token,
    get_current_user,
    login,
    verify_token,
)

SECRET = "test-secret-key-for-unit-tests-only"
EMAIL = "admin@test.cl"
PASSWORD = "secret123"

ENV = {"ADMIN_EMAIL": EMAIL, "ADMIN_PASSWORD": PASSWORD, "SECRET_KEY": SECRET}


# ── create_token / verify_token ──────────────────────────────────────────────

def test_create_and_verify_token_roundtrip():
    token = create_token(EMAIL, secret_key=SECRET)
    subject = verify_token(token, secret_key=SECRET)
    assert subject == EMAIL


def test_verify_token_raises_401_on_bad_token():
    with pytest.raises(HTTPException) as exc_info:
        verify_token("not.a.valid.token", secret_key=SECRET)
    assert exc_info.value.status_code == 401


def test_verify_token_raises_401_on_expired_token():
    expired = datetime.now(timezone.utc) - timedelta(seconds=1)
    token = jwt.encode({"sub": EMAIL, "exp": expired}, SECRET, algorithm=_ALGORITHM)
    with pytest.raises(HTTPException) as exc_info:
        verify_token(token, secret_key=SECRET)
    assert exc_info.value.status_code == 401


# ── login ────────────────────────────────────────────────────────────────────

def test_login_happy_path():
    with patch.dict(os.environ, ENV):
        token = login(EMAIL, PASSWORD)
    assert token
    subject = verify_token(token, secret_key=SECRET)
    assert subject == EMAIL


def test_login_wrong_password_returns_401():
    with patch.dict(os.environ, ENV):
        with pytest.raises(HTTPException) as exc_info:
            login(EMAIL, "wrong-password")
    assert exc_info.value.status_code == 401


def test_login_wrong_email_returns_401():
    with patch.dict(os.environ, ENV):
        with pytest.raises(HTTPException) as exc_info:
            login("otro@test.cl", PASSWORD)
    assert exc_info.value.status_code == 401


def test_login_error_does_not_reveal_which_field_failed():
    with patch.dict(os.environ, ENV):
        with pytest.raises(HTTPException) as exc_wrong_email:
            login("otro@test.cl", PASSWORD)
        with pytest.raises(HTTPException) as exc_wrong_pass:
            login(EMAIL, "wrong")
    assert exc_wrong_email.value.detail == exc_wrong_pass.value.detail


# ── get_current_user ─────────────────────────────────────────────────────────

def test_get_current_user_happy_path():
    with patch.dict(os.environ, ENV):
        token = login(EMAIL, PASSWORD)
        user = get_current_user(amishi_session=token)
    assert user == EMAIL


def test_get_current_user_raises_401_when_no_cookie():
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(amishi_session=None)
    assert exc_info.value.status_code == 401


def test_get_current_user_raises_401_on_invalid_token():
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(amishi_session="invalid.token")
    assert exc_info.value.status_code == 401


def test_change_password_persists_hash_and_enables_new_login(tmp_path):
    auth_path = tmp_path / "auth.json"
    with patch.dict(os.environ, {**ENV, "AUTH_PATH": str(auth_path)}, clear=True):
        old_token = login(EMAIL, PASSWORD)
        change_password(PASSWORD, "new-password-123")
        record = json.loads(auth_path.read_text(encoding="utf-8"))

        assert record["algorithm"] == "pbkdf2_sha256"
        assert PASSWORD not in auth_path.read_text(encoding="utf-8")
        assert "new-password-123" not in auth_path.read_text(encoding="utf-8")
        with pytest.raises(HTTPException):
            verify_token(old_token)
        with pytest.raises(HTTPException):
            login(EMAIL, PASSWORD)
        assert login(EMAIL, "new-password-123")


def test_change_password_rejects_wrong_current_password():
    with patch.dict(os.environ, ENV, clear=True):
        with pytest.raises(HTTPException) as exc_info:
            change_password("wrong-password", "new-password-123")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "La contraseña actual es incorrecta"


def test_change_password_uses_s3_when_bucket_is_configured():
    s3_client = MagicMock()
    missing = Exception("missing")
    missing.response = {"Error": {"Code": "NoSuchKey"}}
    s3_client.get_object.side_effect = missing

    with (
        patch.dict(os.environ, {**ENV, "S3_BUCKET": "amishi-catalog"}, clear=True),
        patch("backend.services.auth._s3_client", return_value=s3_client),
    ):
        change_password(PASSWORD, "new-password-123")

    put_arguments = s3_client.put_object.call_args.kwargs
    record = json.loads(put_arguments["Body"].decode("utf-8"))
    assert put_arguments["Bucket"] == "amishi-catalog"
    assert put_arguments["Key"] == "auth.json"
    assert put_arguments["ServerSideEncryption"] == "AES256"
    assert record["password_hash"] != "new-password-123"


@pytest.mark.asyncio
async def test_change_password_endpoint_requires_authentication():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.patch(
            "/api/admin/cuenta/password",
            json={
                "current_password": PASSWORD,
                "new_password": "new-password-123",
            },
        )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_change_password_endpoint_rejects_short_new_password():
    with patch.dict(os.environ, ENV, clear=False):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            await client.post(
                "/api/auth/login",
                json={"email": EMAIL, "password": PASSWORD},
            )
            response = await client.patch(
                "/api/admin/cuenta/password",
                json={
                    "current_password": PASSWORD,
                    "new_password": "short",
                },
            )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_change_password_endpoint_changes_credentials_and_logs_out():
    with patch.dict(os.environ, ENV, clear=False):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            login_response = await client.post(
                "/api/auth/login",
                json={"email": EMAIL, "password": PASSWORD},
            )
            assert login_response.status_code == 200

            response = await client.patch(
                "/api/admin/cuenta/password",
                json={
                    "current_password": PASSWORD,
                    "new_password": "new-password-123",
                },
            )
            assert response.status_code == 200
            assert COOKIE_NAME not in client.cookies

            old_login = await client.post(
                "/api/auth/login",
                json={"email": EMAIL, "password": PASSWORD},
            )
            new_login = await client.post(
                "/api/auth/login",
                json={"email": EMAIL, "password": "new-password-123"},
            )

    assert old_login.status_code == 401
    assert new_login.status_code == 200
