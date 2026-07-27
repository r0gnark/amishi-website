"""Persistencia atómica del catálogo en JSON.

Modo de operación:
- Si la variable de entorno S3_BUCKET está definida → lee/escribe en S3 (producción/QA en AWS).
- Si no → usa el filesystem local (desarrollo).
"""

import json
import os
import tempfile
from pathlib import Path

DEFAULT_CATALOG_PATH = Path("data/catalog.json")


# ---------------------------------------------------------------------------
# Filesystem (desarrollo local)
# ---------------------------------------------------------------------------

def _load_from_disk(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return _empty_catalog()


def _save_to_disk(data: dict, path: Path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, path)
    except Exception:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


# ---------------------------------------------------------------------------
# S3 (AWS Lambda en QA / producción)
# ---------------------------------------------------------------------------

def _s3_client():
    import boto3  # lazy import — no se ejecuta si S3_BUCKET no está definida
    return boto3.client("s3")


def _load_from_s3(bucket: str, key: str) -> dict:
    try:
        response = _s3_client().get_object(Bucket=bucket, Key=key)
        return json.loads(response["Body"].read().decode("utf-8"))
    except Exception as exc:
        # botocore.exceptions.ClientError con código NoSuchKey → catálogo vacío
        error_code = (
            getattr(exc, "response", {}).get("Error", {}).get("Code")
            if hasattr(exc, "response")
            else None
        )
        if error_code == "NoSuchKey":
            return _empty_catalog()
        raise


def _save_to_s3(bucket: str, key: str, data: dict) -> None:
    body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
    _s3_client().put_object(Bucket=bucket, Key=key, Body=body, ContentType="application/json")


# ---------------------------------------------------------------------------
# Interfaz pública
# ---------------------------------------------------------------------------

def _resolve_catalog_path(path: Path | None) -> Path:
    if path is not None:
        return Path(path)
    return Path(os.environ.get("CATALOG_PATH", DEFAULT_CATALOG_PATH))


def load_catalog(path: Path | None = None) -> dict:
    """Carga el catálogo. Usa S3 si S3_BUCKET está definida, disco si no."""
    resolved_path = _resolve_catalog_path(path)
    bucket = os.environ.get("S3_BUCKET")
    if bucket:
        return _load_from_s3(bucket, resolved_path.name)
    return _load_from_disk(resolved_path)


def save_catalog(data: dict, path: Path | None = None) -> None:
    """Guarda el catálogo. Usa S3 si S3_BUCKET está definida, disco si no."""
    resolved_path = _resolve_catalog_path(path)
    bucket = os.environ.get("S3_BUCKET")
    if bucket:
        _save_to_s3(bucket, resolved_path.name, data)
        return
    _save_to_disk(data, resolved_path)


def _empty_catalog() -> dict:
    return {
        "products": [],
        "siteContent": {
            "about": "",
            "announcementBar": "",
        },
    }
