"""Endpoints públicos del catálogo de productos."""

from fastapi import APIRouter, HTTPException

from backend.models.catalog import Product
from backend.repository import CatalogNotFoundError, get_all_products, get_product_by_slug

router = APIRouter(prefix="/api/productos", tags=["productos"])


@router.get("", response_model=list[Product])
async def list_products():
    return get_all_products()


@router.get("/{slug}", response_model=Product)
async def get_product(slug: str):
    try:
        return get_product_by_slug(slug)
    except CatalogNotFoundError:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
