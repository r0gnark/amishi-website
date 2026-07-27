"""Endpoints protegidos de gestión del contenido del sitio."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from backend.models.catalog import SiteContent
from backend.services.auth import get_current_user
from backend.storage import load_catalog, save_catalog

router = APIRouter(prefix="/api/admin/contenido", tags=["admin-contenido"])


class SiteContentUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    about: str | None = None
    about_title: str | None = Field(default=None, alias="aboutTitle")
    about_image: str | None = Field(default=None, alias="aboutImage")
    announcement_bar: str | None = Field(default=None, alias="announcementBar")
    site_name: str | None = Field(default=None, alias="siteName")
    contact_label: str | None = Field(default=None, alias="contactLabel")
    contact_url: str | None = Field(default=None, alias="contactUrl")
    instagram_handle: str | None = Field(default=None, alias="instagramHandle")
    instagram_profile_url: str | None = Field(
        default=None,
        alias="instagramProfileUrl",
    )
    footer_text: str | None = Field(default=None, alias="footerText")


@router.get("")
async def get_contenido(_user: str = Depends(get_current_user)):
    data = load_catalog()
    stored = data.get("siteContent", {})
    return SiteContent.model_validate(stored).model_dump(by_alias=True)


@router.patch("")
async def update_contenido(
    body: SiteContentUpdate,
    _user: str = Depends(get_current_user),
):
    data = load_catalog()
    site_content = SiteContent.model_validate(
        data.get("siteContent", {})
    ).model_dump(by_alias=True)
    site_content.update(body.model_dump(by_alias=True, exclude_none=True))
    data["siteContent"] = site_content
    save_catalog(data)
    return site_content
