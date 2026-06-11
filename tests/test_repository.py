"""Tests para backend/repository.py."""

import pytest

from backend.models.catalog import ProductCreate, ProductUpdate
from backend.repository import (
    CatalogNotFoundError,
    create_product,
    delete_product,
    get_all_products,
    get_product_by_slug,
    update_product,
)


def _new_product(**kwargs) -> ProductCreate:
    defaults = dict(
        name="Test Product",
        price=5000,
        image="/images/test.jpeg",
        category="imanes",
    )
    defaults.update(kwargs)
    return ProductCreate(**defaults)


# ── get_all_products ─────────────────────────────────────────────────────────

def test_get_all_products_returns_empty_on_new_catalog(tmp_path):
    path = tmp_path / "catalog.json"
    assert get_all_products(path) == []


def test_get_all_products_returns_created_products(tmp_path):
    path = tmp_path / "catalog.json"
    create_product(_new_product(name="Producto A"), path)
    create_product(_new_product(name="Producto B"), path)
    products = get_all_products(path)
    assert len(products) == 2


# ── get_product_by_slug ──────────────────────────────────────────────────────

def test_get_product_by_slug_happy_path(tmp_path):
    path = tmp_path / "catalog.json"
    created = create_product(_new_product(name="Imán especial"), path)
    found = get_product_by_slug(created.id, path)
    assert found.id == created.id
    assert found.name == "Imán especial"


def test_get_product_by_slug_raises_not_found(tmp_path):
    path = tmp_path / "catalog.json"
    with pytest.raises(CatalogNotFoundError):
        get_product_by_slug("no-existe", path)


# ── create_product ───────────────────────────────────────────────────────────

def test_create_product_generates_slug_from_name(tmp_path):
    path = tmp_path / "catalog.json"
    product = create_product(_new_product(name="Mishi Flor Especial"), path)
    assert product.id == "mishi-flor-especial"


def test_create_product_generates_unique_slug_on_collision(tmp_path):
    path = tmp_path / "catalog.json"
    p1 = create_product(_new_product(name="Mishi"), path)
    p2 = create_product(_new_product(name="Mishi"), path)
    assert p1.id != p2.id
    assert p2.id == "mishi-1"


def test_create_product_persists_to_disk(tmp_path):
    path = tmp_path / "catalog.json"
    create_product(_new_product(name="Persistido"), path)
    products = get_all_products(path)
    assert len(products) == 1
    assert products[0].name == "Persistido"


def test_create_product_validates_empty_name(tmp_path):
    path = tmp_path / "catalog.json"
    with pytest.raises(Exception):
        create_product(_new_product(name="   "), path)


def test_create_product_validates_negative_price(tmp_path):
    path = tmp_path / "catalog.json"
    with pytest.raises(Exception):
        create_product(_new_product(price=-1), path)


def test_create_product_validates_invalid_category(tmp_path):
    path = tmp_path / "catalog.json"
    with pytest.raises(Exception):
        create_product(_new_product(category="no-existe"), path)


# ── update_product ───────────────────────────────────────────────────────────

def test_update_product_happy_path(tmp_path):
    path = tmp_path / "catalog.json"
    created = create_product(_new_product(name="Original", price=1000), path)
    updated = update_product(created.id, ProductUpdate(price=2000), path)
    assert updated.price == 2000
    assert updated.name == "Original"


def test_update_product_raises_not_found(tmp_path):
    path = tmp_path / "catalog.json"
    with pytest.raises(CatalogNotFoundError):
        update_product("no-existe", ProductUpdate(price=100), path)


# ── delete_product ───────────────────────────────────────────────────────────

def test_delete_product_happy_path(tmp_path):
    path = tmp_path / "catalog.json"
    created = create_product(_new_product(name="A borrar"), path)
    delete_product(created.id, path)
    assert get_all_products(path) == []


def test_delete_product_raises_not_found(tmp_path):
    path = tmp_path / "catalog.json"
    with pytest.raises(CatalogNotFoundError):
        delete_product("no-existe", path)
