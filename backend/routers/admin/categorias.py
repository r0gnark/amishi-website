"""CRUD protegido de categorías."""

from fastapi import APIRouter, Depends, HTTPException

from pydantic import BaseModel

from backend.models.catalog import Category, CategoryCreate, CategoryUpdate
from backend.repository import (
    CatalogConflictError,
    CatalogNotFoundError,
    create_category,
    delete_category,
    reorder_categories,
    update_category,
)
from backend.services.auth import get_current_user

router = APIRouter(prefix="/api/admin/categorias", tags=["admin-categorias"])


class CategoryOrder(BaseModel):
    ids: list[str]


@router.post("", response_model=Category, status_code=201)
async def create(body: CategoryCreate, _user: str = Depends(get_current_user)):
    return create_category(body)


@router.put("/orden", response_model=list[Category])
async def reorder(body: CategoryOrder, _user: str = Depends(get_current_user)):
    try:
        return reorder_categories(body.ids)
    except CatalogConflictError:
        raise HTTPException(
            status_code=422,
            detail="El orden debe incluir cada categoría exactamente una vez",
        )


@router.patch("/{category_id}", response_model=Category)
async def update(
    category_id: str,
    body: CategoryUpdate,
    _user: str = Depends(get_current_user),
):
    try:
        return update_category(category_id, body)
    except CatalogNotFoundError:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")


@router.delete("/{category_id}", status_code=204)
async def delete(
    category_id: str,
    _user: str = Depends(get_current_user),
):
    try:
        delete_category(category_id)
    except CatalogConflictError:
        raise HTTPException(
            status_code=409,
            detail="Reasigna o elimina sus productos antes de borrar la categoría",
        )
    except CatalogNotFoundError:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
