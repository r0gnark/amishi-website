"""Endpoint público para leer el contenido del sitio."""

from fastapi import APIRouter

from backend.storage import load_catalog

router = APIRouter(prefix="/api/contenido", tags=["contenido"])


@router.get("")
async def get_contenido():
    data = load_catalog()
    return data.get("siteContent", {"about": "", "announcementBar": ""})
