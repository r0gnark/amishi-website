"""Persistencia atómica del catálogo en JSON."""

import json
import os
import tempfile
from pathlib import Path

DEFAULT_CATALOG_PATH = Path("data/catalog.json")


def load_catalog(path: Path = DEFAULT_CATALOG_PATH) -> dict:
    """Carga el catálogo desde disco. Devuelve estructura vacía válida si no existe."""
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return _empty_catalog()


def save_catalog(data: dict, path: Path = DEFAULT_CATALOG_PATH) -> None:
    """Guarda el catálogo en disco de forma atómica via archivo temporal + os.replace()."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, path)
    except Exception:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


def _empty_catalog() -> dict:
    return {
        "products": [],
        "siteContent": {
            "about": "",
            "announcementBar": "",
        },
    }
