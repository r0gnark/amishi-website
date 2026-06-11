# Arquitectura — Qué significa "hacer un buen trabajo"

> Este documento define el estándar de calidad. Los agentes revisores
> evalúan código contra este archivo. Si no está aquí, no es un requisito.

## Principios

1. **Capas claras.** El proyecto tiene cuatro capas y solo cuatro:
   - `backend/storage.py` — persistencia (JSON en disco).
   - `backend/repository.py` — dominio del catálogo (productos, siteContent).
   - `backend/services/auth.py` — autenticación y sesión del admin.
   - `backend/routers/` + `app/` + `components/` — API FastAPI y UI pública (Next.js/React).
   No introducir capas adicionales (ORM, servicios genéricos, Redux) hasta que
   haya una razón concreta documentada en `feature_list.json`.

2. **Dependencias mínimas.** Stack base: Python 3.12+, FastAPI, Pydantic v2, uvicorn.
   Frontend: Next.js, React, Tailwind. Si una feature requiere una dependencia nueva,
   debe estar justificada en `feature_list.json` o marcada `blocked` hasta acordarla.

3. **Errores explícitos.** Las funciones de dominio que pueden fallar (slug
   inexistente, JSON corrupto, credenciales inválidas) lanzan excepciones nombradas
   o devuelven `Result` tipado. Los routers de FastAPI traducen esos errores a códigos
   HTTP claros (400, 401, 404, 500). Nunca devolver `None` sin documentar el contrato.

4. **Inmutabilidad en memoria.** Tras `load_catalog()`, modificar el catálogo
   implica clonar/actualizar el objeto y llamar a `save_catalog()` una vez al
   final de la operación. No mutar el JSON en sitio dentro de handlers o componentes.

5. **Atomicidad en disco.** Toda escritura a `data/catalog.json` se hace
   primero en un archivo temporal y luego `os.replace()` atómico. Nunca dejar
   el archivo a medio escribir.

6. **Separación público / admin.** El sitio público (`app/`, `components/`) solo lee
   datos. Toda escritura pasa por endpoints bajo `/api/admin/` protegidos por sesión.
   No exponer endpoints de escritura sin autenticación.

## Flujo de datos

```
visitante  ─→  Next.js app/ + components/     (solo lectura)
                    │
                    └─→  GET /api/productos    (FastAPI)
                              │
                              └─→  repository  ─→  storage  ─→  data/catalog.json

admin      ─→  Next.js app/admin/             (UI protegida)
                    │
                    ├─ POST /api/auth/login    (FastAPI — cookie de sesión JWT)
                    │
                    └─→  /api/admin/*          (FastAPI — lectura/escritura)
                              │
                              └─→  repository  ─→  storage  ─→  data/catalog.json
```

## Modelo de datos

El archivo `data/catalog.json` contiene:

```json
{
  "products": [ /* lista de productos, mismo shape que data/products.py */ ],
  "siteContent": {
    "about": "...",
    "announcementBar": "..."
  }
}
```

Los tipos de dominio viven en `backend/models/` como clases Pydantic.
No duplicar definiciones de tipos entre capas.

## Estructura de carpetas

```
backend/
  main.py               Punto de entrada FastAPI (app = FastAPI())
  storage.py            Persistencia atómica en JSON
  repository.py         CRUD de dominio sobre el JSON
  models/
    catalog.py          Modelos Pydantic de dominio (Product, CatalogData, etc.)
    auth.py             Modelos de sesión y credenciales
  routers/
    productos.py        GET /api/productos, GET /api/productos/{slug}
    admin/
      productos.py      POST/PATCH/DELETE /api/admin/productos
      contenido.py      PATCH /api/admin/contenido
    auth.py             POST /api/auth/login, POST /api/auth/logout
  services/
    auth.py             login(), logout(), get_session()
data/
  catalog.json          Estado persistido del catálogo
app/                    Next.js frontend público
components/             Componentes React
tests/                  Tests pytest
```

## Qué NO hacer

- No leer/escribir `catalog.json` directamente desde routers o componentes.
  Siempre pasar por `repository.py`.
- No hardcodear credenciales. Usar `ADMIN_EMAIL`, `ADMIN_PASSWORD` y
  `SECRET_KEY` en `.env` (documentadas en `.env.example`).
- No mostrar stack traces al usuario en producción ni en el panel admin.
- No mezclar lógica de persistencia dentro de `repository.py`.
- No añadir base de datos hasta que `feature_list.json` lo documente.
