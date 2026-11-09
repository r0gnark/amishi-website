"""Modelos Pydantic para el catálogo de productos."""

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

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


class PublicProduct(BaseModel):
    """Producto visible en el sitio. No incluye el stock interno."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    price: int
    image: str
    gallery: Optional[list[str]] = None
    instagram_url: str = Field(alias="instagramUrl")
    description: str
    category: str
    available: bool = True


class Product(PublicProduct):
    stock: Optional[int] = None


class ProductCreate(BaseModel):
    name: str
    price: int
    image: str
    gallery: Optional[list[str]] = None
    instagram_url: str = Field(alias="instagramUrl", default="")
    description: str = ""
    category: str
    available: bool = True
    stock: Optional[int] = None

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

    @field_validator("stock")
    @classmethod
    def stock_non_negative(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and value < 0:
            raise ValueError("stock must be >= 0")
        return value


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    image: Optional[str] = None
    gallery: Optional[list[str]] = None
    instagram_url: Optional[str] = Field(default=None, alias="instagramUrl")
    description: Optional[str] = None
    category: Optional[str] = None
    available: Optional[bool] = None
    stock: Optional[int] = None

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

    @field_validator("stock")
    @classmethod
    def stock_non_negative(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and value < 0:
            raise ValueError("stock must be >= 0")
        return value


class ProductBulkUpdate(BaseModel):
    """Cambios compartidos por varios productos. Solo los campos enviados se aplican."""

    ids: list[str]
    available: Optional[bool] = None
    category: Optional[str] = None
    price: Optional[int] = None
    stock: Optional[int] = None

    @field_validator("ids")
    @classmethod
    def ids_not_empty(cls, value: list[str]) -> list[str]:
        cleaned = [item.strip() for item in value if item.strip()]
        if not cleaned:
            raise ValueError("ids must not be empty")
        return cleaned

    @field_validator("price")
    @classmethod
    def price_non_negative(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and value < 0:
            raise ValueError("price must be >= 0")
        return value

    @field_validator("stock")
    @classmethod
    def stock_non_negative(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and value < 0:
            raise ValueError("stock must be >= 0")
        return value

    @model_validator(mode="after")
    def at_least_one_change(self) -> "ProductBulkUpdate":
        has_change = any(
            (
                "available" in self.model_fields_set and self.available is not None,
                "category" in self.model_fields_set and self.category is not None,
                "price" in self.model_fields_set and self.price is not None,
                "stock" in self.model_fields_set,
            )
        )
        if not has_change:
            raise ValueError("at least one field to update")
        return self

    def as_update(self) -> ProductUpdate:
        payload: dict[str, object] = {}
        if "available" in self.model_fields_set and self.available is not None:
            payload["available"] = self.available
        if "category" in self.model_fields_set and self.category is not None:
            payload["category"] = self.category
        if "price" in self.model_fields_set and self.price is not None:
            payload["price"] = self.price
        if "stock" in self.model_fields_set:
            payload["stock"] = self.stock
        return ProductUpdate.model_validate(payload)


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
