"""Autenticación con JWT en cookie httpOnly."""

import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from fastapi import Cookie, HTTPException, status

_TOKEN_EXPIRE_HOURS = 8
_ALGORITHM = "HS256"
_COOKIE_NAME = "amishi_session"


def _settings() -> tuple[str, str, str]:
    """Devuelve (admin_email, admin_password, secret_key) desde variables de entorno."""
    email = os.getenv("ADMIN_EMAIL", "")
    password = os.getenv("ADMIN_PASSWORD", "")
    secret = os.getenv("SECRET_KEY", "")
    return email, password, secret


def create_token(subject: str, secret_key: str | None = None) -> str:
    """Crea un JWT firmado con expiración."""
    _, _, default_secret = _settings()
    secret = secret_key or default_secret
    expire = datetime.now(timezone.utc) + timedelta(hours=_TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": subject, "exp": expire}, secret, algorithm=_ALGORITHM)


def verify_token(token: str, secret_key: str | None = None) -> str:
    """Verifica el JWT y devuelve el subject. Lanza HTTPException 401 si es inválido."""
    _, _, default_secret = _settings()
    secret = secret_key or default_secret
    try:
        payload = jwt.decode(token, secret, algorithms=[_ALGORITHM])
        sub: str = payload.get("sub", "")
        if not sub:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        return sub
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")


def login(email: str, password: str) -> str:
    """Valida credenciales y devuelve un token JWT. Lanza HTTPException 401 si son incorrectas."""
    admin_email, admin_password, _ = _settings()
    if email != admin_email or password != admin_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
    return create_token(email)


def get_current_user(
    amishi_session: str | None = Cookie(default=None),
) -> str:
    """Dependencia FastAPI: extrae y valida el JWT de la cookie. Lanza 401 si no hay sesión."""
    if not amishi_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")
    return verify_token(amishi_session)


COOKIE_NAME = _COOKIE_NAME
