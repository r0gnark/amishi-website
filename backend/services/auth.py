"""Autenticación con JWT y contraseña persistente cifrada de forma irreversible."""

import base64
import hashlib
import hmac
import io
import json
import os
import secrets
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

import pyotp
import qrcode
import qrcode.image.svg
from cryptography.fernet import Fernet, InvalidToken
from fastapi import Cookie, HTTPException, status
from jose import JWTError, jwt

from backend.services.mail import (
    MailDeliveryError,
    MailNotConfigured,
    mail_configured,
    send_email,
)

_TOKEN_EXPIRE_HOURS = 8
_ALGORITHM = "HS256"
_COOKIE_NAME = "amishi_session"
_AUTH_KEY = "auth.json"
_DEFAULT_AUTH_PATH = Path("data/auth.json")
_PASSWORD_ALGORITHM = "pbkdf2_sha256"
_PASSWORD_ITERATIONS = 310_000
_MFA_PURPOSE = "mfa"
_MFA_TOKEN_MINUTES = 5
_EMAIL_CODE_MINUTES = 10
_EMAIL_RESEND_SECONDS = 60
_RECOVERY_CODE_COUNT = 8
_MFA_KEYS = (
    "mfa_enabled",
    "mfa_secret",
    "mfa_pending_secret",
    "mfa_recovery_hashes",
    "mfa_last_step",
    "mfa_email_enabled",
    "mfa_email_pending_hash",
    "mfa_email_pending_expires",
    "mfa_email_code_hash",
    "mfa_email_code_expires",
    "mfa_email_sent_at",
)
_TOTP_FIELDS = ("mfa_secret", "mfa_pending_secret", "mfa_last_step")


class MfaRequired(Exception):
    """La contraseña es válida y todavía falta un segundo factor."""

    def __init__(self, token: str, methods: list[str], masked_email: str) -> None:
        super().__init__("mfa")
        self.token = token
        self.methods = methods
        self.masked_email = masked_email


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
    if record is None or "password_hash" not in record:
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
    if not record or not record.get("version"):
        return "environment"
    return str(record["version"])


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
        if payload.get("purpose") == _MFA_PURPOSE:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
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
    version = _password_version()
    methods = _mfa_methods(record)
    if methods:
        raise MfaRequired(
            _create_mfa_token(email, version),
            methods,
            _mask_email(admin_email),
        )
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
    updated = {
        "algorithm": _PASSWORD_ALGORITHM,
        "iterations": _PASSWORD_ITERATIONS,
        "salt": base64.b64encode(salt).decode("ascii"),
        "password_hash": base64.b64encode(password_hash).decode("ascii"),
        "version": uuid4().hex,
    }
    for key in _MFA_KEYS:
        if record and key in record:
            updated[key] = record[key]
    _save_password_record(updated)


def _cipher() -> Fernet:
    _, _, secret = _settings()
    digest = hashlib.sha256(secret.encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def _encrypt(value: str) -> str:
    return _cipher().encrypt(value.encode("utf-8")).decode("ascii")


def _decrypt(value: str) -> str:
    try:
        return _cipher().decrypt(value.encode("ascii")).decode("utf-8")
    except (InvalidToken, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")


def _create_mfa_token(subject: str, password_version: str) -> str:
    _, _, secret = _settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=_MFA_TOKEN_MINUTES)
    return jwt.encode(
        {
            "sub": subject,
            "exp": expire,
            "pwdv": password_version,
            "purpose": _MFA_PURPOSE,
        },
        secret,
        algorithm=_ALGORITHM,
    )


def _qr_svg(data: str) -> str:
    image = qrcode.make(
        data,
        image_factory=qrcode.image.svg.SvgPathImage,
        border=2,
    )
    buffer = io.BytesIO()
    image.save(buffer)
    return buffer.getvalue().decode("utf-8")


def _matching_step(secret: str, code: str) -> int | None:
    normalized = code.strip().replace(" ", "")
    if not normalized.isdigit() or len(normalized) != 6:
        return None
    totp = pyotp.TOTP(secret)
    base = int(datetime.now(timezone.utc).timestamp() // 30)
    for offset in (-1, 0, 1):
        step = base + offset
        if hmac.compare_digest(totp.generate_otp(step), normalized):
            return step
    return None


def _hash_recovery(code: str) -> str:
    normalized = code.strip().lower().replace("-", "").replace(" ", "")
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def _new_recovery_codes() -> tuple[list[str], list[str]]:
    plain: list[str] = []
    hashes: list[str] = []
    for _ in range(_RECOVERY_CODE_COUNT):
        raw = secrets.token_hex(4)
        formatted = f"{raw[:4]}-{raw[4:]}"
        plain.append(formatted)
        hashes.append(_hash_recovery(formatted))
    return plain, hashes


def _take_recovery(record: dict, code: str) -> bool:
    target = _hash_recovery(code)
    hashes = list(record.get("mfa_recovery_hashes") or [])
    for index, stored in enumerate(hashes):
        if len(stored) == len(target) and hmac.compare_digest(stored, target):
            hashes.pop(index)
            record["mfa_recovery_hashes"] = hashes
            return True
    return False


def _mask_email(email: str) -> str:
    local, separator, domain = email.partition("@")
    if not separator:
        return "***"
    return f"{local[:1]}***@{domain}"


def _mfa_methods(record: dict | None) -> list[str]:
    if not record:
        return []
    methods: list[str] = []
    if record.get("mfa_enabled"):
        methods.append("totp")
    if record.get("mfa_email_enabled"):
        methods.append("email")
    return methods


def _now_timestamp() -> int:
    return int(datetime.now(timezone.utc).timestamp())


def _hash_email_code(code: str) -> str:
    normalized = code.strip().replace(" ", "")
    return hashlib.sha256(f"email:{normalized}".encode("utf-8")).hexdigest()


def _new_email_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _deliver_code(code: str) -> str:
    email, _, _ = _settings()
    body = (
        f"Tu código de acceso a Amishi es {code}.\n"
        "Caduca en 10 minutos. Si no lo pediste, ignora este mensaje.\n"
    )
    try:
        send_email(email, "Código de acceso a Amishi", body)
    except MailNotConfigured:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El envío de correo no está configurado",
        )
    except MailDeliveryError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No fue posible enviar el correo",
        )
    return _mask_email(email)


def _store_email_code(record: dict, hash_key: str, expires_key: str) -> str:
    now = _now_timestamp()
    sent_at = int(record.get("mfa_email_sent_at") or 0)
    if now - sent_at < _EMAIL_RESEND_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Espera un minuto antes de pedir otro código",
        )
    code = _new_email_code()
    record[hash_key] = _hash_email_code(code)
    record[expires_key] = now + _EMAIL_CODE_MINUTES * 60
    record["mfa_email_sent_at"] = now
    return code


def _email_code_matches(
    record: dict,
    code: str,
    hash_key: str,
    expires_key: str,
) -> bool:
    stored = str(record.get(hash_key) or "")
    expires = int(record.get(expires_key) or 0)
    if not stored or _now_timestamp() > expires:
        return False
    target = _hash_email_code(code)
    return len(stored) == len(target) and hmac.compare_digest(stored, target)


def mfa_status() -> dict[str, bool | str]:
    """Indica qué segundos factores están activos."""
    record = _load_password_record() or {}
    email, _, _ = _settings()
    return {
        "totp_enabled": bool(record.get("mfa_enabled")),
        "email_enabled": bool(record.get("mfa_email_enabled")),
        "email_delivery": mail_configured(),
        "masked_email": _mask_email(email),
    }


def begin_mfa_enrollment() -> dict[str, str]:
    """Genera un secreto pendiente y el QR para escanearlo. No activa el MFA."""
    record = _load_password_record() or {}
    if record.get("mfa_enabled"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La autenticación en dos pasos ya está activa",
        )
    secret = pyotp.random_base32()
    email, _, _ = _settings()
    record["mfa_pending_secret"] = _encrypt(secret)
    record["mfa_enabled"] = False
    _save_password_record(record)
    uri = pyotp.TOTP(secret).provisioning_uri(name=email, issuer_name="Amishi")
    return {"secret": secret, "otpauth_uri": uri, "qr_svg": _qr_svg(uri)}


def confirm_mfa_enrollment(code: str) -> list[str]:
    """Activa el MFA si el código corresponde al secreto pendiente."""
    record = _load_password_record() or {}
    pending = record.get("mfa_pending_secret")
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay una configuración pendiente",
        )
    step = _matching_step(_decrypt(pending), code)
    if step is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código no es válido",
        )
    plain, hashes = _new_recovery_codes()
    record["mfa_secret"] = pending
    record.pop("mfa_pending_secret", None)
    record["mfa_enabled"] = True
    record["mfa_recovery_hashes"] = hashes
    record["mfa_last_step"] = step
    _save_password_record(record)
    return plain


def disable_mfa(password: str, code: str) -> None:
    """Desactiva el segundo factor comprobando contraseña y un código vigente."""
    record = _load_password_record() or {}
    if not record.get("mfa_enabled"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La autenticación en dos pasos no está activa",
        )
    if not _password_matches(password, record):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta",
        )
    secret = _decrypt(record["mfa_secret"])
    accepted = _matching_step(secret, code) is not None or _take_recovery(record, code)
    if not accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código no es válido",
        )
    record["mfa_enabled"] = False
    for key in _TOTP_FIELDS:
        record.pop(key, None)
    if not record.get("mfa_email_enabled"):
        record.pop("mfa_recovery_hashes", None)
    _save_password_record(record)


def begin_email_mfa() -> dict[str, str]:
    """Envía un código de prueba al correo de ingreso. No activa el método todavía."""
    record = _load_password_record() or {}
    if record.get("mfa_email_enabled"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código por correo ya está activo",
        )
    code = _store_email_code(
        record,
        "mfa_email_pending_hash",
        "mfa_email_pending_expires",
    )
    masked_email = _deliver_code(code)
    _save_password_record(record)
    return {"masked_email": masked_email}


def confirm_email_mfa(code: str) -> list[str]:
    """Activa el código por correo si el mensaje de prueba coincide."""
    record = _load_password_record() or {}
    if not _email_code_matches(
        record,
        code,
        "mfa_email_pending_hash",
        "mfa_email_pending_expires",
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código no es válido",
        )
    record["mfa_email_enabled"] = True
    record.pop("mfa_email_pending_hash", None)
    record.pop("mfa_email_pending_expires", None)
    recovery: list[str] = []
    if not record.get("mfa_recovery_hashes"):
        recovery, hashes = _new_recovery_codes()
        record["mfa_recovery_hashes"] = hashes
    _save_password_record(record)
    return recovery


def disable_email_mfa(password: str) -> None:
    """Desactiva el código por correo comprobando la contraseña."""
    record = _load_password_record() or {}
    if not record.get("mfa_email_enabled"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código por correo no está activo",
        )
    if not _password_matches(password, record):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta",
        )
    record["mfa_email_enabled"] = False
    for key in (
        "mfa_email_pending_hash",
        "mfa_email_pending_expires",
        "mfa_email_code_hash",
        "mfa_email_code_expires",
        "mfa_email_sent_at",
    ):
        record.pop(key, None)
    if not record.get("mfa_enabled"):
        record.pop("mfa_recovery_hashes", None)
    _save_password_record(record)


def send_login_email_code(token: str) -> str:
    """Manda un código de un solo uso al correo de ingreso durante el login."""
    record = _record_for_challenge(token)
    if not record.get("mfa_email_enabled"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código por correo no está activo",
        )
    code = _store_email_code(record, "mfa_email_code_hash", "mfa_email_code_expires")
    masked_email = _deliver_code(code)
    _save_password_record(record)
    return masked_email


def _record_for_challenge(token: str) -> dict:
    _, _, secret_key = _settings()
    try:
        payload = jwt.decode(token, secret_key, algorithms=[_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    admin_email, _, _ = _settings()
    subject = str(payload.get("sub", ""))
    version = str(payload.get("pwdv", ""))
    if (
        payload.get("purpose") != _MFA_PURPOSE
        or not subject
        or not hmac.compare_digest(subject.encode("utf-8"), admin_email.encode("utf-8"))
        or not hmac.compare_digest(version, _password_version())
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    return _load_password_record() or {}


def complete_mfa_login(token: str, code: str) -> str:
    """Canjea el desafío de MFA por un JWT de sesión."""
    record = _record_for_challenge(token)
    if not _mfa_methods(record) and not record.get("mfa_recovery_hashes"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    admin_email, _, _ = _settings()
    version = _password_version()
    if record.get("mfa_enabled"):
        secret = _decrypt(record["mfa_secret"])
        step = _matching_step(secret, code)
        if step is not None:
            last_step = int(record.get("mfa_last_step", -1))
            if step <= last_step:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Código incorrecto",
                )
            record["mfa_last_step"] = step
            _save_password_record(record)
            return create_token(admin_email, password_version=version)

    if record.get("mfa_email_enabled") and _email_code_matches(
        record,
        code,
        "mfa_email_code_hash",
        "mfa_email_code_expires",
    ):
        record.pop("mfa_email_code_hash", None)
        record.pop("mfa_email_code_expires", None)
        _save_password_record(record)
        return create_token(admin_email, password_version=version)

    if _take_recovery(record, code):
        _save_password_record(record)
        return create_token(admin_email, password_version=version)

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Código incorrecto")


def get_current_user(
    amishi_session: str | None = Cookie(default=None),
) -> str:
    """Dependencia FastAPI: extrae y valida el JWT de la cookie. Lanza 401 si no hay sesión."""
    if not amishi_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")
    return verify_token(amishi_session)


COOKIE_NAME = _COOKIE_NAME
