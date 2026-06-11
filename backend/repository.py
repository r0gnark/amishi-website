"""CRUD del catálogo sobre el almacenamiento JSON."""

import re
import unicodedata
from pathlib import Path

from backend.models.catalog import Product, ProductCreate, ProductUpdate
from backend.storage import DEFAULT_CATALOG_PATH, load_catalog, save_catalog


class CatalogError(Exception):
    pass


class CatalogNotFoundError(CatalogError):
    pass


def _slugify(name: str) -> str:
    """Genera slug kebab-case desde un nombre."""
    nfkd = unicodedata.normalize("NFKD", name)
    ascii_str = nfkd.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^\w\s-]", "", ascii_str.lower())
    return re.sub(r"[\s_-]+", "-", slug).strip("-")


def _unique_slug(slug: str, existing_ids: set[str]) -> str:
    candidate = slug
    counter = 1
    while candidate in existing_ids:
        candidate = f"{slug}-{counter}"
        counter += 1
    return candidate


def get_all_products(path: Path = DEFAULT_CATALOG_PATH) -> list[Product]:
    data = load_catalog(path)
    return [Product.model_validate(p) for p in data["products"]]


def get_product_by_slug(slug: str, path: Path = DEFAULT_CATALOG_PATH) -> Product:
    data = load_catalog(path)
    for p in data["products"]:
        if p["id"] == slug:
            return Product.model_validate(p)
    raise CatalogNotFoundError(f"Product not found: {slug}")


def create_product(product: ProductCreate, path: Path = DEFAULT_CATALOG_PATH) -> Product:
    data = load_catalog(path)
    existing_ids = {p["id"] for p in data["products"]}
    slug = _unique_slug(_slugify(product.name), existing_ids)
    new_product = Product(
        id=slug,
        name=product.name,
        price=product.price,
        image=product.image,
        gallery=product.gallery,
        instagramUrl=product.instagram_url,
        description=product.description,
        category=product.category,
    )
    data["products"].append(new_product.model_dump(by_alias=True))
    save_catalog(data, path)
    return new_product


def update_product(
    slug: str, updates: ProductUpdate, path: Path = DEFAULT_CATALOG_PATH
) -> Product:
    data = load_catalog(path)
    for i, p in enumerate(data["products"]):
        if p["id"] == slug:
            patch = updates.model_dump(exclude_none=True, by_alias=True)
            data["products"][i] = {**p, **patch}
            save_catalog(data, path)
            return Product.model_validate(data["products"][i])
    raise CatalogNotFoundError(f"Product not found: {slug}")


def delete_product(slug: str, path: Path = DEFAULT_CATALOG_PATH) -> None:
    data = load_catalog(path)
    original_len = len(data["products"])
    data["products"] = [p for p in data["products"] if p["id"] != slug]
    if len(data["products"]) == original_len:
        raise CatalogNotFoundError(f"Product not found: {slug}")
    save_catalog(data, path)
