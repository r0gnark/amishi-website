"""Endpoints protegidos para administrar imágenes del sitio."""

import os
import re
import tempfile
import unicodedata
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from backend.services.auth import get_current_user

router = APIRouter(prefix="/api/admin/media", tags=["admin-media"])

MEDIA_ROOT = Path(__file__).resolve().parents[3] / "public" / "images"
UPLOAD_ROOT = MEDIA_ROOT / "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024
CONTENT_TYPE_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def list_media() -> list[dict[str, str]]:
    """Lista las imágenes disponibles para el administrador."""
    if not MEDIA_ROOT.exists():
        return []

    items = []
    for path in MEDIA_ROOT.rglob("*"):
        if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
            relative_path = path.relative_to(MEDIA_ROOT).as_posix()
            items.append(
                {
                    "name": path.name,
                    "url": f"/images/{relative_path}",
                }
            )
    return sorted(items, key=lambda item: item["url"])


def _safe_stem(filename: str) -> str:
    normalized = unicodedata.normalize("NFKD", Path(filename).stem)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", "-", ascii_name).strip("-") or "imagen"


def _matches_image_type(content: bytes, content_type: str) -> bool:
    if content_type == "image/jpeg":
        return content.startswith(b"\xff\xd8\xff")
    if content_type == "image/png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/webp":
        return (
            len(content) >= 12
            and content.startswith(b"RIFF")
            and content[8:12] == b"WEBP"
        )
    return False


@router.get("")
async def get_media(_user: str = Depends(get_current_user)):
    return {"items": list_media()}


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_media(
    file: UploadFile,
    _user: str = Depends(get_current_user),
):
    extension = CONTENT_TYPE_EXTENSIONS.get(file.content_type or "")
    if extension is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Solo se permiten imágenes JPG, PNG o WebP",
        )

    content = await file.read(MAX_FILE_SIZE + 1)
    if not content:
        raise HTTPException(status_code=400, detail="El archivo está vacío")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="La imagen no puede superar 10 MB",
        )
    if not _matches_image_type(content, file.content_type or ""):
        raise HTTPException(status_code=400, detail="El contenido no es una imagen válida")

    UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    filename = f"{_safe_stem(file.filename or 'imagen')}-{uuid4().hex[:10]}{extension}"
    destination = UPLOAD_ROOT / filename

    descriptor, temporary_name = tempfile.mkstemp(
        dir=UPLOAD_ROOT,
        prefix=".upload-",
        suffix=".tmp",
    )
    try:
        with os.fdopen(descriptor, "wb") as temporary_file:
            temporary_file.write(content)
            temporary_file.flush()
            os.fsync(temporary_file.fileno())
        os.replace(temporary_name, destination)
    except Exception:
        Path(temporary_name).unlink(missing_ok=True)
        raise

    return {
        "name": filename,
        "url": f"/images/uploads/{filename}",
    }
