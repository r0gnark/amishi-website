"""Endpoints protegidos de gestión del contenido del sitio."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.services.auth import get_current_user
from backend.storage import DEFAULT_CATALOG_PATH, load_catalog, save_catalog

router = APIRouter(prefix="/api/admin/contenido", tags=["admin-contenido"])


class SiteContentUpdate(BaseModel):
    about: str | None = None
    announcementBar: str | None = None


@router.get("")
async def get_contenido(_user: str = Depends(get_current_user)):
    data = load_catalog()
    return data.get("siteContent", {"about": "", "announcementBar": ""})


@router.patch("")
async def update_contenido(body: SiteContentUpdate, _user: str = Depends(get_current_user)):
    data = load_catalog()
    site_content = data.get("siteContent", {"about": "", "announcementBar": ""})
    if body.about is not None:
        site_content["about"] = body.about
    if body.announcementBar is not None:
        site_content["announcementBar"] = body.announcementBar
    data["siteContent"] = site_content
    save_catalog(data)
    return site_content
