"""Endpoints protegidos para administrar la cuenta."""

from fastapi import APIRouter, Depends, Response

from backend.models.auth import PasswordChange
from backend.services.auth import COOKIE_NAME, change_password, get_current_user

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
