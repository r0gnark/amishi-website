"""Configuración compartida para mantener los tests fuera del catálogo real."""

import pytest


@pytest.fixture(autouse=True)
def isolated_catalog(tmp_path, monkeypatch):
    catalog_path = tmp_path / "catalog.json"
    monkeypatch.setenv("CATALOG_PATH", str(catalog_path))
    monkeypatch.delenv("S3_BUCKET", raising=False)
    return catalog_path
