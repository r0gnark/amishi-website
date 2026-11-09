"""Endpoints de autenticación: login y logout."""

from fastapi import APIRouter, Response

from backend.models.auth import Credentials, MfaChallenge, MfaVerify
from backend.services.auth import (
    COOKIE_NAME,
    MfaRequired,
    complete_mfa_login,
    login as svc_login,
    send_login_email_code,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

_COOKIE_MAX_AGE = 8 * 3600


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=_COOKIE_MAX_AGE,
    )


@router.post("/login")
async def do_login(credentials: Credentials, response: Response):
    try:
        token = svc_login(credentials.email, credentials.password)
    except MfaRequired as challenge:
        return {
            "ok": True,
            "mfa_required": True,
            "mfa_token": challenge.token,
            "methods": challenge.methods,
            "masked_email": challenge.masked_email,
        }
    _set_session_cookie(response, token)
    return {"ok": True, "mfa_required": False}


@router.post("/mfa/email")
async def send_mfa_email(payload: MfaChallenge):
    return {"ok": True, "masked_email": send_login_email_code(payload.mfa_token)}


@router.post("/mfa")
async def do_mfa(payload: MfaVerify, response: Response):
    token = complete_mfa_login(payload.mfa_token, payload.code)
    _set_session_cookie(response, token)
    return {"ok": True}


@router.post("/logout")
async def do_logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME)
    return {"ok": True}
