"""Endpoint público para leer el contenido del sitio."""

from fastapi import APIRouter

from backend.models.catalog import SiteContent
from backend.storage import load_catalog

router = APIRouter(prefix="/api/contenido", tags=["contenido"])


@router.get("")
async def get_contenido():
    data = load_catalog()
    stored = data.get("siteContent", {})
    return SiteContent.model_validate(stored).model_dump(by_alias=True)
