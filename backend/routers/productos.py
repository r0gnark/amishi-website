"""Endpoints públicos del catálogo de productos."""

from fastapi import APIRouter, HTTPException

from backend.models.catalog import Product, PublicProduct
from backend.repository import CatalogNotFoundError, get_all_products, get_product_by_slug

router = APIRouter(prefix="/api/productos", tags=["productos"])


def _public(product: Product) -> PublicProduct:
    return PublicProduct.model_validate(product.model_dump())


@router.get("", response_model=list[PublicProduct])
async def list_products():
    return [_public(product) for product in get_all_products()]


@router.get("/{slug}", response_model=PublicProduct)
async def get_product(slug: str):
    try:
        return _public(get_product_by_slug(slug))
    except CatalogNotFoundError:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
