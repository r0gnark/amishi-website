"""Tests para scripts/seed_catalog.py."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.seed_catalog import PRODUCTS, seed
from backend.storage import load_catalog

STATIC_PRODUCT_COUNT = 62  # total en data/products.ts


def test_seed_writes_expected_product_count(tmp_path):
    path = tmp_path / "catalog.json"
    n = seed(path)
    assert n == STATIC_PRODUCT_COUNT


def test_seed_catalog_json_has_correct_structure(tmp_path):
    path = tmp_path / "catalog.json"
    seed(path)
    data = load_catalog(path)
    assert "products" in data
    assert "siteContent" in data
    assert len(data["products"]) == STATIC_PRODUCT_COUNT


def test_seed_products_have_required_fields(tmp_path):
    path = tmp_path / "catalog.json"
    seed(path)
    data = load_catalog(path)
    for p in data["products"]:
        assert p.get("id"), f"product missing id: {p}"
        assert p.get("name"), f"product missing name: {p}"
        assert isinstance(p.get("price"), int), f"product price not int: {p}"
        assert p.get("category"), f"product missing category: {p}"


def test_seed_product_count_at_least_as_many_as_static_source():
    assert len(PRODUCTS) >= STATIC_PRODUCT_COUNT
