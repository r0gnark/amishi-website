"""Endpoints protegidos para administrar la cuenta."""

from fastapi import APIRouter, Depends, Response

from backend.models.auth import MfaCode, MfaDisable, MfaEmailDisable, PasswordChange
from backend.services.auth import (
    COOKIE_NAME,
    begin_email_mfa,
    begin_mfa_enrollment,
    change_password,
    confirm_email_mfa,
    confirm_mfa_enrollment,
    disable_email_mfa,
    disable_mfa,
    get_current_user,
    mfa_status,
)

router = APIRouter(prefix="/api/admin/cuenta", tags=["admin-cuenta"])


@router.patch("/password")
async def update_password(
    payload: PasswordChange,
    response: Response,
    _user: str = Depends(get_current_user),
):
    change_password(payload.current_password, payload.new_password)
    response.delete_cookie(key=COOKIE_NAME)
    return {"ok": True}


@router.get("/mfa")
async def read_mfa(_user: str = Depends(get_current_user)):
    return mfa_status()


@router.post("/mfa/setup")
async def setup_mfa(_user: str = Depends(get_current_user)):
    return begin_mfa_enrollment()


@router.post("/mfa/confirm")
async def confirm_mfa(payload: MfaCode, _user: str = Depends(get_current_user)):
    return {"recovery_codes": confirm_mfa_enrollment(payload.code)}


@router.post("/mfa/disable")
async def remove_mfa(payload: MfaDisable, _user: str = Depends(get_current_user)):
    disable_mfa(payload.password, payload.code)
    return {"ok": True}


@router.post("/mfa/email/start")
async def start_email_mfa(_user: str = Depends(get_current_user)):
    return begin_email_mfa()


@router.post("/mfa/email/confirm")
async def confirm_email(payload: MfaCode, _user: str = Depends(get_current_user)):
    return {"recovery_codes": confirm_email_mfa(payload.code)}


@router.post("/mfa/email/disable")
async def remove_email_mfa(
    payload: MfaEmailDisable,
    _user: str = Depends(get_current_user),
):
    disable_email_mfa(payload.password)
    return {"ok": True}
