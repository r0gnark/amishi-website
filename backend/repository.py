"""CRUD del catálogo sobre el almacenamiento JSON."""

import re
import unicodedata
from pathlib import Path

from backend.models.catalog import (
    Category,
    CategoryCreate,
    CategoryUpdate,
    Product,
    ProductCreate,
    ProductUpdate,
)
from backend.storage import load_catalog, save_catalog


class CatalogError(Exception):
    pass


class CatalogNotFoundError(CatalogError):
    pass


class CatalogConflictError(CatalogError):
    pass


DEFAULT_CATEGORIES = [
    Category(id="mishi-frasco", label="Mishi frasco", image="/images/catalog-filters/mishi-frasco.webp"),
    Category(id="mishi-flor", label="Mishi Flor", image="/images/catalog-filters/mishi-flor.webp"),
    Category(id="mishi-aros", label="Mishi aros", image="/images/catalog-filters/aros.webp"),
    Category(id="imanes", label="Imanes", image="/images/catalog-filters/imanes.webp"),
    Category(id="mishi-kitty", label="Mishi Kitty", image="/images/catalog-filters/hello-kitty.webp"),
    Category(id="papeleria", label="Papelería", image="/images/catalog-filters/papeleria.webp"),
]


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


def get_all_products(path: Path | None = None) -> list[Product]:
    data = load_catalog(path)
    return [Product.model_validate(p) for p in data["products"]]


def get_categories(path: Path | None = None) -> list[Category]:
    data = load_catalog(path)
    stored = data.get("categories")
    return (
        [Category.model_validate(item) for item in stored]
        if stored
        else [item.model_copy() for item in DEFAULT_CATEGORIES]
    )


def create_category(category: CategoryCreate, path: Path | None = None) -> Category:
    data = load_catalog(path)
    categories = get_categories(path)
    category_id = _unique_slug(_slugify(category.label), {item.id for item in categories})
    created = Category(id=category_id, label=category.label, image=category.image)
    data["categories"] = [item.model_dump() for item in categories] + [created.model_dump()]
    save_catalog(data, path)
    return created


def update_category(
    category_id: str,
    updates: CategoryUpdate,
    path: Path | None = None,
) -> Category:
    data = load_catalog(path)
    categories = get_categories(path)
    for index, category in enumerate(categories):
        if category.id == category_id:
            updated = category.model_copy(update=updates.model_dump(exclude_none=True))
            categories[index] = updated
            data["categories"] = [item.model_dump() for item in categories]
            save_catalog(data, path)
            return updated
    raise CatalogNotFoundError(f"Category not found: {category_id}")


def delete_category(category_id: str, path: Path | None = None) -> None:
    data = load_catalog(path)
    if any(product["category"] == category_id for product in data["products"]):
        raise CatalogConflictError("Category has products")
    categories = get_categories(path)
    remaining = [item for item in categories if item.id != category_id]
    if len(remaining) == len(categories):
        raise CatalogNotFoundError(f"Category not found: {category_id}")
    data["categories"] = [item.model_dump() for item in remaining]
    save_catalog(data, path)


def reorder_categories(
    category_ids: list[str],
    path: Path | None = None,
) -> list[Category]:
    data = load_catalog(path)
    categories = get_categories(path)
    current_ids = {item.id for item in categories}
    if len(category_ids) != len(set(category_ids)) or set(category_ids) != current_ids:
        raise CatalogConflictError("Category order must contain every category once")
    by_id = {item.id: item for item in categories}
    ordered = [by_id[category_id] for category_id in category_ids]
    data["categories"] = [item.model_dump() for item in ordered]
    save_catalog(data, path)
    return ordered


def get_product_by_slug(slug: str, path: Path | None = None) -> Product:
    data = load_catalog(path)
    for p in data["products"]:
        if p["id"] == slug:
            return Product.model_validate(p)
    raise CatalogNotFoundError(f"Product not found: {slug}")


def create_product(product: ProductCreate, path: Path | None = None) -> Product:
    data = load_catalog(path)
    if product.category not in {item.id for item in get_categories(path)}:
        raise CatalogNotFoundError(f"Category not found: {product.category}")
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
    slug: str, updates: ProductUpdate, path: Path | None = None
) -> Product:
    data = load_catalog(path)
    if updates.category is not None and updates.category not in {
        item.id for item in get_categories(path)
    }:
        raise CatalogNotFoundError(f"Category not found: {updates.category}")
    for i, p in enumerate(data["products"]):
        if p["id"] == slug:
            patch = updates.model_dump(exclude_none=True, by_alias=True)
            data["products"][i] = {**p, **patch}
            save_catalog(data, path)
            return Product.model_validate(data["products"][i])
    raise CatalogNotFoundError(f"Product not found: {slug}")


def delete_product(slug: str, path: Path | None = None) -> None:
    data = load_catalog(path)
    original_len = len(data["products"])
    data["products"] = [p for p in data["products"] if p["id"] != slug]
    if len(data["products"]) == original_len:
        raise CatalogNotFoundError(f"Product not found: {slug}")
    save_catalog(data, path)
