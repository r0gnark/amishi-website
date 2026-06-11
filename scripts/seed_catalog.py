"""Seed: pobla data/catalog.json con todos los productos estáticos de Amishi.

Ejecutar desde la raíz del proyecto:
    python3 scripts/seed_catalog.py
"""

import json
import sys
from pathlib import Path

# Permite importar backend/ sin instalación del paquete
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.storage import save_catalog

IG = "https://ig.me/m/amishi.cl"
PRINT_MARCO = "/images/productos/papeleria/prints/print_marco.png"

PRODUCTS = [
    # ── Mishi frasco ───────────────────────────────────────────────────────
    *[
        {
            "id": f"miniaturas-image{n:05d}",
            "name": f"Mishi frasco {i+1}",
            "price": 5000,
            "image": f"/images/productos/miniaturas/image{n:05d}.jpeg",
            "instagramUrl": IG,
            "description": "Miniatura hecha a mano\nMaterial figura: yeso cerámico\nMaterial frasco: cristal\nTamaño: 2x3,5cm app",
            "category": "mishi-frasco",
        }
        for i, n in enumerate([5, 8, 9, 13, 18, 21, 22, 23, 24, 25])
    ],
    # ── Mishi flor ─────────────────────────────────────────────────────────
    *[
        {
            "id": f"michi-flor-image{n:05d}",
            "name": f"Mishi Flor {i+1}",
            "price": 15000,
            "image": f"/images/productos/michi-flor/image{n:05d}.jpeg",
            "instagramUrl": IG,
            "description": "Figura decorativa Mishi Flor\nMaterial figura: yeso cerámico\nTamaño: 5x6cm app\nBarniz: mate",
            "category": "mishi-flor",
        }
        for i, n in enumerate([6, 12, 15, 17, 19])
    ],
    # ── Mishi Kitty ────────────────────────────────────────────────────────
    *[
        {
            "id": f"hello-kitty-image{n:05d}",
            "name": f"Mishi Kitty {i+1}",
            "price": 5000,
            "image": f"/images/productos/hello-kitty/image{n:05d}.jpeg",
            "instagramUrl": IG,
            "description": "Figura decorativa\nMaterial: yeso cerámico\nTamaño: 4,5x5,5cm app",
            "category": "mishi-kitty",
        }
        for i, n in enumerate([1, 2, 3, 4, 10, 33])
    ],
    # ── Imanes ─────────────────────────────────────────────────────────────
    *[
        {
            "id": f"imanes-image{n:05d}",
            "name": f"Imán {i+1}",
            "price": 4000,
            "image": f"/images/productos/imanes/image{n:05d}.jpeg",
            "instagramUrl": IG,
            "description": "Imán decorativo\nMaterial: yeso cerámico\nTamaño: 4x5 cm app",
            "category": "imanes",
        }
        for i, n in enumerate([7, 11, 14, 16, 20])
    ],
    # ── Mishi aros ─────────────────────────────────────────────────────────
    *[
        {
            "id": f"aros-image{n:05d}",
            "name": f"Mishi aros {i+1}",
            "price": 15000,
            "image": f"/images/productos/aros/image{n:05d}.jpeg",
            "instagramUrl": IG,
            "description": "Aros Mishi\nMaterial figura: arcilla secado al aire\nMaterial pendiente: acero inoxidable",
            "category": "mishi-aros",
        }
        for i, n in enumerate([26, 27, 28, 29, 30, 31, 32, 34, 35, 36])
    ],
    # ── Papelería — prints ──────────────────────────────────────────────────
    *[
        {
            "id": f"papeleria-prints-image{n:05d}",
            "name": f"Print / postal {i+1}",
            "price": 2500,
            "image": f"/images/productos/papeleria/prints/image{n:05d}.jpeg",
            "gallery": [PRINT_MARCO],
            "instagramUrl": IG,
            "description": (
                "Print/postal ideal para decorar\nImpresión Láser\n"
                "Papel couche, 270 grs.\nTamaño: 10x15cm app\n\n"
                "Se pueden enviar enmarcado con marco blanco por 3.000 extras "
                "(preguntar en dm por disponibilidad)\n\n"
                "* no incluye pedestal que aparece en la fotografía de exposición"
            ),
            "category": "papeleria",
        }
        for i, n in enumerate([53, 54, 55, 56, 57, 58, 59, 60])
    ],
    {
        "id": "papeleria-prints-print-nuevo",
        "name": "Print / postal 9",
        "price": 2500,
        "image": "/images/productos/papeleria/prints/print_nuevo.png",
        "gallery": [PRINT_MARCO],
        "instagramUrl": IG,
        "description": (
            "Print/postal ideal para decorar\nImpresión Láser\n"
            "Papel couche, 270 grs.\nTamaño: 10x15cm app\n\n"
            "Se pueden enviar enmarcado con marco blanco por 3.000 extras "
            "(preguntar en dm por disponibilidad)\n\n"
            "Pueden consultar por la disponibilidad de un color similar al de su mishi "
            "(preguntar en dm)\n\n"
            "* no incluye pedestal que aparece en la fotografía de exposición"
        ),
        "category": "papeleria",
    },
    # ── Papelería — croquera ───────────────────────────────────────────────
    {
        "id": "papeleria-croqueras-croquera",
        "name": "Croquera",
        "price": 5000,
        "image": "/images/productos/papeleria/croqueras/croquera.png",
        "instagramUrl": IG,
        "description": "Croquera tapa dura\n100 hojas blancas\nTamaño: 11x17cm app",
        "category": "papeleria",
    },
    # ── Papelería — stickers billetes ──────────────────────────────────────
    *[
        {
            "id": f"papeleria-stickers-billetes-image{n:05d}",
            "name": f"Sticker billete {i+1}",
            "price": 500,
            "image": f"/images/productos/papeleria/stickers-billetes/image{n:05d}.jpeg",
            "instagramUrl": IG,
            "description": "Mishi billete\nPapel adhesivo\nTamaño: 5,5x9,5cm\n\n500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web",
            "category": "papeleria",
        }
        for i, n in enumerate([49, 50, 51, 52])
    ],
    # ── Papelería — stickers caras ─────────────────────────────────────────
    *[
        {
            "id": f"papeleria-stickers-caras-image{n:05d}",
            "name": f"Sticker cara Mishi {i+1}",
            "price": 500,
            "image": f"/images/productos/papeleria/stickers-caras/image{n:05d}.jpeg",
            "instagramUrl": IG,
            "description": "Sticker Mishi troquelado\nPapel adhesivo\nTamaño: 6x5cm app\n\n500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web",
            "category": "papeleria",
        }
        for i, n in enumerate([37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48])
    ],
]


def seed(catalog_path: Path = Path("data/catalog.json")) -> int:
    """Escribe PRODUCTS en catalog_path. Devuelve el número de productos escritos."""
    catalog = {
        "products": PRODUCTS,
        "siteContent": {
            "about": "",
            "announcementBar": "",
        },
    }
    save_catalog(catalog, catalog_path)
    return len(PRODUCTS)


if __name__ == "__main__":
    n = seed()
    print(f"[OK] Seed completado: {n} productos escritos en data/catalog.json")
