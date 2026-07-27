# Convenciones de código

> Homogeneidad extrema. La IA predice mejor cuando el repositorio se parece
> a sí mismo en todas partes.

## Stack

- **Runtime backend:** Python 3.12+.
- **Framework API:** FastAPI con uvicorn como servidor ASGI.
- **Validación / tipos:** Pydantic v2 (modelos en `backend/models/`).
- **Autenticación:** JWT con `python-jose` o `PyJWT`; cookie `httpOnly`.
- **Tests:** pytest + pytest-asyncio (`tests/*.py`).
- **Runtime frontend:** Node.js 20+ (solo para Next.js/React).
- **Framework UI:** Next.js (App Router), React, Tailwind CSS.

## Estilo Python

- **Formato:** Black implícito (líneas máximo 88 caracteres). Seguir PEP 8.
- **Imports:** stdlib primero, luego third-party, luego locales (`backend.*`). Un
  grupo por tipo, separados por línea en blanco.
- **Strings:** comillas dobles `"..."` en Python.
- **Tipos:** anotar todos los parámetros y retornos de funciones públicas.
  Usar `type` aliases para unions complejas.
- **Async:** `async def` para handlers FastAPI y operaciones I/O. Usar `await`
  en lugar de wrappers síncronos salvo utilidades puntuales.

## Nombres

| Tipo                    | Convención        | Ejemplo                        |
|-------------------------|-------------------|--------------------------------|
| Archivos backend        | `snake_case.py`   | `catalog_storage.py`           |
| Clases / modelos        | `PascalCase`      | `CatalogData`, `ProductCreate` |
| Funciones / variables   | `snake_case`      | `load_catalog`, `product_slug` |
| Constantes              | `UPPER_SNAKE`     | `DEFAULT_CATALOG_PATH`         |
| Privadas en módulo      | prefijo `_`       | `_atomic_write`                |
| Routers FastAPI         | `snake_case.py`   | `admin_productos.py`           |
| Componentes React       | `PascalCase.tsx`  | `ProductGrid.tsx`              |
| Páginas App Router      | `page.tsx`        | `app/admin/page.tsx`           |

## Estructura de archivo en `backend/`

```python
"""Una línea describiendo el propósito del módulo."""

import os
from pathlib import Path

from pydantic import BaseModel

from backend.models.catalog import CatalogData
```

## Tests

- Un archivo de test por módulo: `tests/test_<módulo>.py`.
- Cada test usa un directorio temporal (`tmp_path` fixture de pytest) y limpia
  tras de sí.
- Nombres descriptivos: `test_load_catalog_returns_empty_when_file_missing`.
- No mockear el filesystem para código de persistencia; usar archivos reales
  en `tmp_path`.
- Tests de endpoints con `httpx.AsyncClient` + `ASGITransport` (sin levantar servidor).

## Manejo de errores

Errores de dominio en `backend/repository.py`:

```python
class CatalogError(Exception):
    pass

class CatalogNotFoundError(CatalogError):
    pass
```

Los routers capturan errores de dominio con `@app.exception_handler` o
bloques `try/except` y responden con `JSONResponse({"detail": "..."}, status_code=...)`.
Nunca propagar stack traces al cliente.

## Comentarios

Por defecto **no** se escriben. Solo se permiten cuando explican un *por qué*
no obvio (p. ej. workaround de FastAPI, invariante de atomicidad). Los nombres
deben hacer el resto.

## Variables de entorno

| Variable          | Uso                              |
|-------------------|----------------------------------|
| `ADMIN_EMAIL`     | Email del único administrador    |
| `ADMIN_PASSWORD`  | Contraseña del administrador     |
| `SECRET_KEY`      | Clave para firmar tokens JWT     |

Documentar siempre en `.env.example`. Nunca commitear `.env`.
