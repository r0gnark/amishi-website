"""Modelos Pydantic para el catálogo de productos."""

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

class Category(BaseModel):
    id: str
    label: str
    image: str


class CategoryCreate(BaseModel):
    label: str
    image: str

    @field_validator("label")
    @classmethod
    def label_not_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("label must not be empty")
        return value.strip()


class CategoryUpdate(BaseModel):
    label: str | None = None
    image: str | None = None


class Product(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    price: int
    image: str
    gallery: Optional[list[str]] = None
    instagram_url: str = Field(alias="instagramUrl")
    description: str
    category: str


class ProductCreate(BaseModel):
    name: str
    price: int
    image: str
    gallery: Optional[list[str]] = None
    instagram_url: str = Field(alias="instagramUrl", default="")
    description: str = ""
    category: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name must not be empty")
        return v

    @field_validator("price")
    @classmethod
    def price_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("price must be >= 0")
        return v

    @field_validator("image")
    @classmethod
    def image_valid_url(cls, v: str) -> str:
        if not (v.startswith("/") or v.startswith("http://") or v.startswith("https://")):
            raise ValueError("image must start with '/' or 'http(s)://'")
        return v



class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    image: Optional[str] = None
    gallery: Optional[list[str]] = None
    instagram_url: Optional[str] = Field(default=None, alias="instagramUrl")
    description: Optional[str] = None
    category: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("name must not be empty")
        return v

    @field_validator("price")
    @classmethod
    def price_non_negative(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("price must be >= 0")
        return v

    @field_validator("image")
    @classmethod
    def image_valid_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not (v.startswith("/") or v.startswith("http://") or v.startswith("https://")):
            raise ValueError("image must start with '/' or 'http(s)://'")
        return v



class SiteContent(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    about: str = ""
    about_title: str = Field(default="Bienvenid@ a Amishi", alias="aboutTitle")
    about_image: str = Field(
        default="/images/amishi-bienvenida.png",
        alias="aboutImage",
    )
    announcement_bar: str = Field(default="", alias="announcementBar")
    site_name: str = Field(default="amishi", alias="siteName")
    contact_label: str = Field(default="Contacto", alias="contactLabel")
    contact_url: str = Field(
        default="https://ig.me/m/amishi.cl",
        alias="contactUrl",
    )
    instagram_handle: str = Field(default="@amishi.cl", alias="instagramHandle")
    instagram_profile_url: str = Field(
        default="https://www.instagram.com/amishi.cl/",
        alias="instagramProfileUrl",
    )
    footer_text: str = Field(
        default="Diseño, gatos y cerámica hecha con cariño en Chile.",
        alias="footerText",
    )


class CatalogData(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    products: list[Product] = []
    categories: list[Category] = []
    site_content: SiteContent = Field(default_factory=SiteContent, alias="siteContent")
