# Historial de sesiones

> Bitácora append-only. Cada sesión cerrada se añade al final de este archivo.

---

## 2026-06-10 — Migración del arnés a amishi-website CMS

**Contexto:** El repositorio pasó de un ejemplo didáctico `notes-cli` (Python) a
`amishi-website` (Next.js) con CMS de productos y login básico.

**Cambios en el arnés:**
- `feature_list.json` reescrito con 10 features de CMS.
- `docs/architecture.md`, `docs/conventions.md`, `docs/verification.md` adaptados a Next.js.
- `init.sh` verifica Node.js/npm en lugar de Python.
- Creados `CHECKPOINTS.md`, `progress/current.md`, `progress/history.md`.

**Features implementadas:** ninguna (todas `pending`).

---

## 2026-06-10 — Feature 1: catalog_storage (DONE)

**Stack migrado:** arnés actualizado de Node.js/Next.js a Python/FastAPI.

**Implementado:**
- `backend/__init__.py` — paquete backend.
- `backend/storage.py` — `load_catalog(path)` y `save_catalog(data, path)`. Escritura atómica via `tempfile.mkstemp` + `os.replace()`. `load_catalog` devuelve estructura vacía válida si el archivo no existe.
- `tests/__init__.py` + `tests/test_storage.py` — 3 tests: archivo faltante → vacío, roundtrip save/load, sin ficheros `.tmp` residuales.

**Verificación:** `pytest` 3/3 verde. `./init.sh` verde.

---

## 2026-06-10 — Features 2–10: Backend FastAPI completo + CMS admin (DONE)

**Backend Python/FastAPI (features 2–4):**
- `backend/models/catalog.py` — Pydantic: `Product`, `ProductCreate`, `ProductUpdate`, `SiteContent`, `CatalogData` (aliases camelCase).
- `backend/models/auth.py` — `Credentials`, `TokenData`.
- `backend/repository.py` — CRUD con `CatalogNotFoundError`, slug auto-slugify + deduplicación.
- `backend/services/auth.py` — JWT (python-jose), cookie httpOnly, `login()`, `verify_token()`, `get_current_user()`.
- `backend/main.py` — FastAPI con CORS, todos los routers.
- Routers: GET /api/productos, GET /api/contenido, POST /api/auth/login+logout, POST/PATCH/DELETE /api/admin/productos, GET+PATCH /api/admin/contenido.
- `scripts/seed_catalog.py` — 62 productos → `data/catalog.json`.

**Infraestructura:**
- `next.config.ts` — rewrites `/api/*` → FastAPI (env `API_URL`).
- `proxy.ts` (Next.js 16) — protege `/admin/*`, redirige sin cookie.
- `.env.example` — `API_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SECRET_KEY`.

**Frontend admin Next.js (features 5–10):**
- `app/admin/login/page.tsx`, `app/admin/layout.tsx`, `app/admin/page.tsx`.
- `app/admin/productos/page.tsx` (tabla + eliminar con confirm), `nuevo/page.tsx`, `[slug]/editar/page.tsx`.
- `app/admin/contenido/page.tsx`.
- `components/admin/ProductForm.tsx` — reutilizado en crear y editar.

**Verificación:** `pytest` 41/41 verde. `npm run build` 73 páginas sin errores. `./init.sh` verde.
