"""Endpoints de autenticación: login y logout."""

from fastapi import APIRouter, HTTPException, Response, status

from backend.models.auth import Credentials
from backend.services.auth import COOKIE_NAME, login as svc_login

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
async def do_login(credentials: Credentials, response: Response):
    token = svc_login(credentials.email, credentials.password)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=8 * 3600,
    )
    return {"ok": True}


@router.post("/logout")
async def do_logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME)
    return {"ok": True}
