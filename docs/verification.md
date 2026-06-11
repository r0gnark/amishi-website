# Verificación — Cómo demostrar que el trabajo funciona

> Regla de oro: **el agente no dice "funciona", lo demuestra**.
> Toda feature termina con evidencia ejecutable, no con afirmaciones.

## Niveles de verificación

### Nivel 1 — Tests unitarios (obligatorio)

Toda función pública en `backend/` tiene al menos un test en `tests/` que:

1. Cubre el camino feliz.
2. Cubre al menos un camino de error si la función puede fallar.

Comando:

```bash
pytest
```

### Nivel 2 — Arranque del servidor (obligatorio para features de API)

Las features que añaden endpoints deben arrancar sin error:

```bash
uvicorn backend.main:app --reload
```

### Nivel 3 — Tests de API (obligatorio para features de admin/API)

Las features que añaden endpoints bajo `/api/` incluyen tests que usan
`httpx.AsyncClient` con `ASGITransport`:

```python
import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app

@pytest.mark.asyncio
async def test_unauthenticated_request_returns_401():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/admin/productos")
    assert response.status_code == 401
```

### Nivel 4 — Smoke test manual (opcional pero recomendado)

Antes de cerrar la sesión, verifica el flujo en desarrollo:

```bash
uvicorn backend.main:app --reload
# API docs: http://localhost:8000/docs
# Sitio público: npm run dev → http://localhost:3000
```

## Anti-patrones (no hacer)

- "He añadido la ruta, debería funcionar." → falta `pytest` verde.
- Test que solo verifica que la función no lanza excepción. → tiene que
  comprobar el resultado concreto.
- `mock.patch("builtins.open")` en tests de persistencia. → usa `tmp_path` real.
- Marcar la feature como `done` sin pasar `./init.sh`.

## Verificación final antes de cerrar

```bash
./init.sh           # debe terminar con [OK] Entorno listo
```

Si `./init.sh` está rojo, **no** marques nada como `done`. Anota el bloqueo
en `progress/current.md` con estado `blocked` en `feature_list.json`.
