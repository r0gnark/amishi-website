"""Tests para backend/services/auth.py."""

import json
import os
import re
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pyotp
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
from backend.services.mail import MailNotConfigured

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


class FrozenClock(datetime):
    current = datetime.now(timezone.utc)

    @classmethod
    def now(cls, tz=None):
        return cls.current


def _unused_code(secret: str, moment: datetime) -> str:
    totp = pyotp.TOTP(secret)
    step = int(moment.timestamp() // 30)
    used = {totp.generate_otp(step + offset) for offset in (-1, 0, 1)}
    for candidate in range(1_000_000):
        code = f"{candidate:06d}"
        if code not in used:
            return code
    raise AssertionError("no quedó un código TOTP libre")


@pytest.mark.asyncio
async def test_mfa_setup_requires_authentication():
    with patch.dict(os.environ, ENV, clear=False):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post("/api/admin/cuenta/mfa/setup")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_mfa_setup_confirm_and_two_step_login():
    new_password = "new-password-123"
    FrozenClock.current = datetime.now(timezone.utc)
    with (
        patch.dict(os.environ, ENV, clear=False),
        patch("backend.services.auth.datetime", FrozenClock),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            logged_in = await client.post(
                "/api/auth/login",
                json={"email": EMAIL, "password": PASSWORD},
            )
            assert logged_in.status_code == 200
            assert COOKIE_NAME in logged_in.cookies

            setup = await client.post("/api/admin/cuenta/mfa/setup")
            assert setup.status_code == 200
            secret = setup.json()["secret"]
            assert secret in setup.json()["otpauth_uri"]
            assert "<svg" in setup.json()["qr_svg"]
            stored = open(os.environ["AUTH_PATH"], encoding="utf-8").read()
            assert secret not in stored

            pending = await client.get("/api/admin/cuenta/mfa")
            assert pending.json()["totp_enabled"] is False

            wrong = await client.post(
                "/api/admin/cuenta/mfa/confirm",
                json={"code": _unused_code(secret, FrozenClock.current)},
            )
            assert wrong.status_code == 400

            code = pyotp.TOTP(secret).at(FrozenClock.current)
            confirmed = await client.post(
                "/api/admin/cuenta/mfa/confirm",
                json={"code": code},
            )
            assert confirmed.status_code == 200
            recovery_codes = confirmed.json()["recovery_codes"]
            assert len(recovery_codes) == 8
            assert (await client.get("/api/admin/cuenta/mfa")).json()["totp_enabled"] is True

            changed = await client.patch(
                "/api/admin/cuenta/password",
                json={"current_password": PASSWORD, "new_password": new_password},
            )
            assert changed.status_code == 200
            assert COOKIE_NAME not in client.cookies

            old_login = await client.post(
                "/api/auth/login",
                json={"email": EMAIL, "password": PASSWORD},
            )
            assert old_login.status_code == 401

            challenged = await client.post(
                "/api/auth/login",
                json={"email": EMAIL, "password": new_password},
            )
            assert challenged.status_code == 200
            assert challenged.json()["mfa_required"] is True
            assert COOKIE_NAME not in challenged.cookies
            mfa_token = challenged.json()["mfa_token"]

            replay = await client.post(
                "/api/auth/mfa",
                json={"mfa_token": mfa_token, "code": code},
            )
            assert replay.status_code == 401
            blocked = await client.get(
                "/api/admin/cuenta/mfa",
                headers={"cookie": f"{COOKIE_NAME}={mfa_token}"},
            )
            assert blocked.status_code == 401

            FrozenClock.current = FrozenClock.current + timedelta(seconds=60)
            fresh_code = pyotp.TOTP(secret).at(FrozenClock.current)
            accepted = await client.post(
                "/api/auth/mfa",
                json={"mfa_token": mfa_token, "code": fresh_code},
            )
            assert accepted.status_code == 200
            assert COOKIE_NAME in accepted.cookies

            client.cookies.clear()
            second = await client.post(
                "/api/auth/login",
                json={"email": EMAIL, "password": new_password},
            )
            reused = await client.post(
                "/api/auth/mfa",
                json={
                    "mfa_token": second.json()["mfa_token"],
                    "code": recovery_codes[0],
                },
            )
            assert reused.status_code == 200
            client.cookies.clear()
            spent = await client.post(
                "/api/auth/login",
                json={"email": EMAIL, "password": new_password},
            )
            spent_code = await client.post(
                "/api/auth/mfa",
                json={
                    "mfa_token": spent.json()["mfa_token"],
                    "code": recovery_codes[0],
                },
            )
            assert spent_code.status_code == 401


def _capture_email(sent: dict):
    def _send(recipient: str, subject: str, body: str) -> None:
        sent["recipient"] = recipient
        sent["subject"] = subject
        sent["body"] = body

    return _send


@pytest.mark.asyncio
async def test_email_mfa_sends_code_to_login_address_and_rejects_reuse():
    sent: dict[str, str] = {}
    FrozenClock.current = datetime.now(timezone.utc)
    with (
        patch.dict(os.environ, ENV, clear=False),
        patch("backend.services.auth.datetime", FrozenClock),
        patch("backend.services.auth.send_email", side_effect=_capture_email(sent)),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            await client.post(
                "/api/auth/login",
                json={"email": EMAIL, "password": PASSWORD},
            )
            started = await client.post("/api/admin/cuenta/mfa/email/start")
            assert started.status_code == 200
            assert started.json()["masked_email"] == "a***@test.cl"
            assert sent["recipient"] == EMAIL
            code = re.search(r"\d{6}", sent["body"]).group()
            confirmed = await client.post(
                "/api/admin/cuenta/mfa/email/confirm",
                json={"code": code},
            )
            assert confirmed.status_code == 200
            assert len(confirmed.json()["recovery_codes"]) == 8
            status = await client.get("/api/admin/cuenta/mfa")
            assert status.json()["email_enabled"] is True
            assert status.json()["totp_enabled"] is False

            client.cookies.clear()
            FrozenClock.current = FrozenClock.current + timedelta(seconds=61)
            challenged = await client.post(
                "/api/auth/login",
                json={"email": EMAIL, "password": PASSWORD},
            )
            assert challenged.status_code == 200
            assert challenged.json()["mfa_required"] is True
            assert challenged.json()["methods"] == ["email"]
            assert COOKIE_NAME not in challenged.cookies

            mailed = await client.post(
                "/api/auth/mfa/email",
                json={"mfa_token": challenged.json()["mfa_token"]},
            )
            assert mailed.status_code == 200
            login_code = re.search(r"\d{6}", sent["body"]).group()
            accepted = await client.post(
                "/api/auth/mfa",
                json={
                    "mfa_token": challenged.json()["mfa_token"],
                    "code": login_code,
                },
            )
            assert accepted.status_code == 200
            assert COOKIE_NAME in accepted.cookies

            client.cookies.clear()
            again = await client.post(
                "/api/auth/login",
                json={"email": EMAIL, "password": PASSWORD},
            )
            reused = await client.post(
                "/api/auth/mfa",
                json={
                    "mfa_token": again.json()["mfa_token"],
                    "code": login_code,
                },
            )
            assert reused.status_code == 401


@pytest.mark.asyncio
async def test_email_mfa_reports_when_smtp_is_not_configured():
    with (
        patch.dict(os.environ, ENV, clear=False),
        patch(
            "backend.services.auth.send_email",
            side_effect=MailNotConfigured(),
        ),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            await client.post(
                "/api/auth/login",
                json={"email": EMAIL, "password": PASSWORD},
            )
            response = await client.post("/api/admin/cuenta/mfa/email/start")
    assert response.status_code == 400
    assert response.json()["detail"] == "El envío de correo no está configurado"
