"""Modelos Pydantic para el catálogo de productos."""

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

VALID_CATEGORIES = {
    "mishi-frasco",
    "mishi-flor",
    "mishi-aros",
    "imanes",
    "mishi-kitty",
    "papeleria",
}


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

    @field_validator("category")
    @classmethod
    def category_valid(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of {sorted(VALID_CATEGORIES)}")
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

    @field_validator("category")
    @classmethod
    def category_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of {sorted(VALID_CATEGORIES)}")
        return v


class SiteContent(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    about: str = ""
    announcement_bar: str = Field(default="", alias="announcementBar")


class CatalogData(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    products: list[Product] = []
    site_content: SiteContent = Field(default_factory=SiteContent, alias="siteContent")
