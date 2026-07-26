"""Lectura pública de imágenes administradas."""

import os
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse

from backend.routers.admin.media import MEDIA_ROOT, UPLOAD_PREFIX, _s3_client

router = APIRouter(prefix="/api/media", tags=["media"])


def _valid_upload_key(key: str) -> bool:
    path = Path(key)
    return (
        key.startswith(UPLOAD_PREFIX)
        and ".." not in path.parts
        and path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    )


@router.get("/{key:path}")
async def get_media(key: str):
    if not _valid_upload_key(key):
        raise HTTPException(status_code=404, detail="Imagen no encontrada")

    bucket = os.environ.get("S3_BUCKET")
    if bucket:
        try:
            response = _s3_client().get_object(Bucket=bucket, Key=key)
        except Exception as exc:
            error_code = getattr(exc, "response", {}).get("Error", {}).get("Code")
            if error_code in {"NoSuchKey", "404"}:
                raise HTTPException(status_code=404, detail="Imagen no encontrada") from exc
            raise
        return StreamingResponse(
            response["Body"],
            media_type=response.get("ContentType", "application/octet-stream"),
            headers={"Cache-Control": "public, max-age=31536000, immutable"},
        )

    path = (MEDIA_ROOT / key).resolve()
    if not path.is_relative_to(MEDIA_ROOT.resolve()) or not path.is_file():
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    return FileResponse(
        path,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
