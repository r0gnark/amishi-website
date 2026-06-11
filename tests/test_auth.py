"""Tests para backend/services/auth.py."""

import os
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from fastapi import HTTPException
from jose import jwt

from backend.services.auth import (
    COOKIE_NAME,
    _ALGORITHM,
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
