"""Tests para backend/storage.py."""

from pathlib import Path

import pytest

from backend.storage import load_catalog, save_catalog


def test_load_catalog_returns_empty_when_file_missing(tmp_path):
    path = tmp_path / "catalog.json"
    result = load_catalog(path)
    assert result["products"] == []
    assert "siteContent" in result
    assert "about" in result["siteContent"]
    assert "announcementBar" in result["siteContent"]


def test_save_and_load_roundtrip(tmp_path):
    path = tmp_path / "catalog.json"
    data = {
        "products": [{"id": "test", "name": "Test Product", "price": 100}],
        "siteContent": {"about": "Hola", "announcementBar": "Oferta"},
    }
    save_catalog(data, path)
    loaded = load_catalog(path)
    assert loaded == data


def test_save_catalog_leaves_no_tmp_files(tmp_path):
    path = tmp_path / "catalog.json"
    original = {"products": [], "siteContent": {"about": "original", "announcementBar": ""}}
    save_catalog(original, path)

    new_data = {"products": [{"id": "p1"}], "siteContent": {"about": "new", "announcementBar": ""}}
    save_catalog(new_data, path)

    tmp_files = list(tmp_path.glob("*.tmp"))
    assert tmp_files == []

    loaded = load_catalog(path)
    assert loaded == new_data
