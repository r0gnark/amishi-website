"""Endpoint público de categorías."""

from fastapi import APIRouter

from backend.models.catalog import Category
from backend.repository import get_categories

router = APIRouter(prefix="/api/categorias", tags=["categorias"])


@router.get("", response_model=list[Category])
async def list_categories():
    return get_categories()
