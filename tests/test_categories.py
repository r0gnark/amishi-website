"""Tests del CRUD de categorías."""

import pytest

from backend.models.catalog import CategoryCreate, CategoryUpdate, ProductCreate
from backend.repository import (
    CatalogConflictError,
    create_category,
    create_product,
    delete_category,
    get_categories,
    reorder_categories,
    update_category,
)


def test_categories_have_defaults_for_legacy_catalog(tmp_path):
    categories = get_categories(tmp_path / "catalog.json")
    assert any(item.id == "mishi-frasco" for item in categories)


def test_create_and_update_category(tmp_path):
    path = tmp_path / "catalog.json"
    created = create_category(
        CategoryCreate(label="Nuevos Mishis", image="/images/nuevos.webp"),
        path,
    )
    updated = update_category(
        created.id,
        CategoryUpdate(label="Mishis nuevos"),
        path,
    )

    assert created.id == "nuevos-mishis"
    assert updated.label == "Mishis nuevos"
    assert updated.image == "/images/nuevos.webp"


def test_delete_unused_category(tmp_path):
    path = tmp_path / "catalog.json"
    created = create_category(
        CategoryCreate(label="Temporal", image="/images/temporal.webp"),
        path,
    )
    delete_category(created.id, path)
    assert created.id not in {item.id for item in get_categories(path)}


def test_delete_category_with_products_is_rejected(tmp_path):
    path = tmp_path / "catalog.json"
    create_product(
        ProductCreate(
            name="Producto",
            price=1000,
            image="/images/producto.webp",
            category="mishi-frasco",
        ),
        path,
    )

    with pytest.raises(CatalogConflictError):
        delete_category("mishi-frasco", path)


def test_reorder_categories_persists_position(tmp_path):
    path = tmp_path / "catalog.json"
    original = get_categories(path)
    reversed_ids = [item.id for item in reversed(original)]

    reordered = reorder_categories(reversed_ids, path)

    assert [item.id for item in reordered] == reversed_ids
    assert [item.id for item in get_categories(path)] == reversed_ids


def test_reorder_categories_rejects_missing_or_duplicate_ids(tmp_path):
    path = tmp_path / "catalog.json"
    category_ids = [item.id for item in get_categories(path)]

    with pytest.raises(CatalogConflictError):
        reorder_categories(category_ids[:-1], path)
    with pytest.raises(CatalogConflictError):
        reorder_categories([category_ids[0], *category_ids], path)
