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
    update_products,
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

def test_legacy_product_is_available_and_has_no_stock(tmp_path):
    path = tmp_path / "catalog.json"
    path.write_text(
        """
        {
          "products": [{
            "id": "viejo",
            "name": "Producto viejo",
            "price": 1000,
            "image": "/images/test.jpeg",
            "instagramUrl": "",
            "description": "",
            "category": "imanes"
          }]
        }
        """,
        encoding="utf-8",
    )
    product = get_product_by_slug("viejo", path)
    assert product.available is True
    assert product.stock is None


def test_create_product_persists_availability_and_stock(tmp_path):
    path = tmp_path / "catalog.json"
    created = create_product(
        _new_product(name="Agotado", available=False, stock=2),
        path,
    )
    stored = get_product_by_slug(created.id, path)
    assert stored.available is False
    assert stored.stock == 2


def test_update_product_can_clear_stock(tmp_path):
    path = tmp_path / "catalog.json"
    created = create_product(_new_product(name="Con stock", stock=4), path)
    updated = update_product(created.id, ProductUpdate(stock=None), path)
    assert updated.stock is None
    assert get_product_by_slug(created.id, path).stock is None


def test_update_product_rejects_negative_stock(tmp_path):
    path = tmp_path / "catalog.json"
    with pytest.raises(Exception):
        ProductUpdate(stock=-1)


def test_update_product_happy_path(tmp_path):
    path = tmp_path / "catalog.json"
    created = create_product(_new_product(name="Original", price=1000), path)
    updated = update_product(created.id, ProductUpdate(price=2000), path)
    assert updated.price == 2000
    assert updated.name == "Original"


def test_update_products_changes_only_the_selection(tmp_path):
    path = tmp_path / "catalog.json"
    first = create_product(_new_product(name="Uno", price=1000), path)
    second = create_product(_new_product(name="Dos", price=1000), path)
    third = create_product(_new_product(name="Tres", price=1000), path)

    updated = update_products(
        [first.id, second.id],
        ProductUpdate(available=False, price=2500),
        path,
    )

    assert [item.id for item in updated] == [first.id, second.id]
    assert all(item.available is False and item.price == 2500 for item in updated)
    stored = {item.id: item for item in get_all_products(path)}
    assert stored[third.id].available is True
    assert stored[third.id].price == 1000


def test_update_products_missing_id_keeps_catalog(tmp_path):
    path = tmp_path / "catalog.json"
    created = create_product(_new_product(name="Solo"), path)
    with pytest.raises(CatalogNotFoundError):
        update_products([created.id, "no-existe"], ProductUpdate(available=False), path)
    assert get_product_by_slug(created.id, path).available is True


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
