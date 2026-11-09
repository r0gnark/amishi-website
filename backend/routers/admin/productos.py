"""Endpoints protegidos de gestión de productos."""

from fastapi import APIRouter, Depends, HTTPException

from backend.models.catalog import Product, ProductBulkUpdate, ProductCreate, ProductUpdate
from backend.repository import (
    CatalogNotFoundError,
    create_product,
    delete_product,
    get_all_products,
    get_product_by_slug,
    update_product,
    update_products,
)
from backend.services.auth import get_current_user

router = APIRouter(prefix="/api/admin/productos", tags=["admin-productos"])


@router.get("", response_model=list[Product])
async def list_products(_user: str = Depends(get_current_user)):
    return get_all_products()


@router.post("/masivo", response_model=list[Product])
async def bulk_update(body: ProductBulkUpdate, _user: str = Depends(get_current_user)):
    try:
        return update_products(body.ids, body.as_update())
    except CatalogNotFoundError as exc:
        detail = (
            "Categoría no encontrada"
            if str(exc).startswith("Category")
            else "Producto no encontrado"
        )
        raise HTTPException(status_code=404, detail=detail)


@router.get("/{slug}", response_model=Product)
async def get_one(slug: str, _user: str = Depends(get_current_user)):
    try:
        return get_product_by_slug(slug)
    except CatalogNotFoundError:
        raise HTTPException(status_code=404, detail="Producto no encontrado")


@router.post("", response_model=Product, status_code=201)
async def create(body: ProductCreate, _user: str = Depends(get_current_user)):
    return create_product(body)


@router.patch("/{slug}", response_model=Product)
async def update(slug: str, body: ProductUpdate, _user: str = Depends(get_current_user)):
    try:
        return update_product(slug, body)
    except CatalogNotFoundError:
        raise HTTPException(status_code=404, detail="Producto no encontrado")


@router.delete("/{slug}", status_code=204)
async def delete(slug: str, _user: str = Depends(get_current_user)):
    try:
        delete_product(slug)
    except CatalogNotFoundError:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
