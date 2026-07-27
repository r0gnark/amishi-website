"""Autenticación con JWT y contraseña persistente cifrada de forma irreversible."""

import base64
import hashlib
import hmac
import json
import os
import secrets
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import Cookie, HTTPException, status
from jose import JWTError, jwt

_TOKEN_EXPIRE_HOURS = 8
_ALGORITHM = "HS256"
_COOKIE_NAME = "amishi_session"
_AUTH_KEY = "auth.json"
_DEFAULT_AUTH_PATH = Path("data/auth.json")
_PASSWORD_ALGORITHM = "pbkdf2_sha256"
_PASSWORD_ITERATIONS = 310_000


def _settings() -> tuple[str, str, str]:
    """Devuelve (admin_email, admin_password, secret_key) desde variables de entorno."""
    email = os.getenv("ADMIN_EMAIL", "")
    password = os.getenv("ADMIN_PASSWORD", "")
    secret = os.getenv("SECRET_KEY", "")
    return email, password, secret


def _auth_path() -> Path:
    return Path(os.environ.get("AUTH_PATH", _DEFAULT_AUTH_PATH))


def _s3_client():
    import boto3

    return boto3.client("s3")


def _load_password_record() -> dict | None:
    bucket = os.environ.get("S3_BUCKET")
    if bucket:
        try:
            response = _s3_client().get_object(Bucket=bucket, Key=_AUTH_KEY)
            return json.loads(response["Body"].read().decode("utf-8"))
        except Exception as exc:
            error_code = getattr(exc, "response", {}).get("Error", {}).get("Code")
            if error_code in {"NoSuchKey", "404"}:
                return None
            raise

    try:
        return json.loads(_auth_path().read_text(encoding="utf-8"))
    except FileNotFoundError:
        return None


def _save_password_record(record: dict) -> None:
    bucket = os.environ.get("S3_BUCKET")
    if bucket:
        _s3_client().put_object(
            Bucket=bucket,
            Key=_AUTH_KEY,
            Body=json.dumps(record).encode("utf-8"),
            ContentType="application/json",
            ServerSideEncryption="AES256",
        )
        return

    path = _auth_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            json.dump(record, handle)
        os.replace(temporary_name, path)
    except Exception:
        try:
            os.unlink(temporary_name)
        except OSError:
            pass
        raise


def _hash_password(password: str, salt: bytes, iterations: int) -> bytes:
    return hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )


def _password_matches(password: str, record: dict | None = None) -> bool:
    if record is None:
        _, initial_password, _ = _settings()
        return hmac.compare_digest(
            password.encode("utf-8"),
            initial_password.encode("utf-8"),
        )

    try:
        if record["algorithm"] != _PASSWORD_ALGORITHM:
            return False
        salt = base64.b64decode(record["salt"], validate=True)
        expected_hash = base64.b64decode(record["password_hash"], validate=True)
        iterations = int(record["iterations"])
    except (KeyError, TypeError, ValueError):
        return False
    actual_hash = _hash_password(password, salt, iterations)
    return hmac.compare_digest(actual_hash, expected_hash)


def _password_version() -> str:
    record = _load_password_record()
    return str(record.get("version", "")) if record else "environment"


def create_token(
    subject: str,
    secret_key: str | None = None,
    password_version: str | None = None,
) -> str:
    """Crea un JWT firmado con expiración."""
    _, _, default_secret = _settings()
    secret = secret_key or default_secret
    expire = datetime.now(timezone.utc) + timedelta(hours=_TOKEN_EXPIRE_HOURS)
    version = password_version or _password_version()
    return jwt.encode(
        {"sub": subject, "exp": expire, "pwdv": version},
        secret,
        algorithm=_ALGORITHM,
    )


def verify_token(
    token: str,
    secret_key: str | None = None,
    password_version: str | None = None,
) -> str:
    """Verifica el JWT y devuelve el subject. Lanza HTTPException 401 si es inválido."""
    _, _, default_secret = _settings()
    secret = secret_key or default_secret
    try:
        payload = jwt.decode(token, secret, algorithms=[_ALGORITHM])
        sub: str = payload.get("sub", "")
        token_version: str = payload.get("pwdv", "")
        current_version = password_version or _password_version()
        if not sub or not hmac.compare_digest(token_version, current_version):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        return sub
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")


def login(email: str, password: str) -> str:
    """Valida credenciales y devuelve un token JWT. Lanza HTTPException 401 si son incorrectas."""
    admin_email, _, _ = _settings()
    record = _load_password_record()
    if not hmac.compare_digest(
        email.encode("utf-8"),
        admin_email.encode("utf-8"),
    ) or not _password_matches(
        password,
        record,
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
    version = str(record.get("version", "")) if record else "environment"
    return create_token(email, password_version=version)


def change_password(current_password: str, new_password: str) -> None:
    """Valida la contraseña actual y guarda un hash persistente de la nueva."""
    record = _load_password_record()
    if not _password_matches(current_password, record):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta",
        )
    if hmac.compare_digest(
        current_password.encode("utf-8"),
        new_password.encode("utf-8"),
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe ser diferente",
        )

    salt = secrets.token_bytes(16)
    password_hash = _hash_password(
        new_password,
        salt,
        _PASSWORD_ITERATIONS,
    )
    _save_password_record(
        {
            "algorithm": _PASSWORD_ALGORITHM,
            "iterations": _PASSWORD_ITERATIONS,
            "salt": base64.b64encode(salt).decode("ascii"),
            "password_hash": base64.b64encode(password_hash).decode("ascii"),
            "version": uuid4().hex,
        }
    )


def get_current_user(
    amishi_session: str | None = Cookie(default=None),
) -> str:
    """Dependencia FastAPI: extrae y valida el JWT de la cookie. Lanza 401 si no hay sesión."""
    if not amishi_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")
    return verify_token(amishi_session)


COOKIE_NAME = _COOKIE_NAME
