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

---

## 2026-07-26 — Feature 11: Arranque local simplificado (DONE)

**Implementado:**
- `npm run setup` crea el entorno Python aislado en el filesystem de WSL.
- `npm run dev:all` levanta Next.js y FastAPI con un solo comando.
- El frontend y la API local usan de forma consistente el puerto 8000.
- `pytest.ini` limita el descubrimiento de pruebas a `tests/`.
- README actualizado con instrucciones para PowerShell y WSL.

**Verificación:** `pytest` 41/41 verde; `npm test` verde; `npm run build`
verde; smoke test de `/`, `/docs` y `/api/productos` con HTTP 200;
`./init.sh` verde.

**Deuda detectada:** `npm run lint` mantiene un error preexistente en
`app/admin/productos/page.tsx` (`react-hooks/set-state-in-effect`).

---

## 2026-07-26 — Feature 12: Previsualización de imágenes (DONE)

**Implementado:**
- Miniaturas de la imagen principal en el listado del administrador.
- Vista previa reactiva de la imagen principal al crear o editar.
- Cuadrícula de previsualización para todas las URLs de galería.
- Estado visible cuando una URL de imagen no puede cargarse.
- Carga cancelable del listado, corrigiendo el error previo de ESLint.

**Verificación:** `pytest` 41/41 verde; `npm test`, `npm run lint`,
`npm run build` y `./init.sh` verdes.

---

## 2026-07-26 — Feature 13: Biblioteca multimedia (DONE)

**Implementado:**
- API protegida para listar y subir imágenes JPG, PNG o WebP.
- Validación de contenido, límite de 10 MB y escritura atómica.
- Selector visual para imagen principal y galería de productos.
- Carga desde el equipo y actualización inmediata de la biblioteca.

**Verificación:** `pytest` 45/45 verde; `npm run lint`, `npm run build` y
`./init.sh` verdes.

---

## 2026-07-26 — Feature 14: Ajustes personalizables (DONE)

**Implementado:**
- Formulario de identidad, anuncio, sección Sobre, contacto, Instagram y pie.
- Imagen de Sobre seleccionable desde la biblioteca multimedia.
- Contexto público con valores de respaldo para catálogos antiguos.
- Cabecera, anuncio, Sobre y pie conectados a los ajustes persistidos.

**Verificación:** `pytest` 45/45 verde; `npm test`, `npm run lint`,
`npm run build` y `./init.sh` verdes.

---

## 2026-07-26 — Feature 15: Login admin a pantalla completa (DONE)

**Implementado:**
- Las rutas administrativas ya no heredan cabecera, anuncio ni pie públicos.
- `/admin/login` no muestra la barra lateral del panel.
- El panel autenticado conserva su navegación y cierre de sesión.

**Verificación:** inspección visual a 1280×720 sin navegación alrededor del
login; `pytest` 45/45 verde; `npm run lint`, `npm run build` y `./init.sh`
verdes.

---

## 2026-07-26 — Feature 16: Gestión de categorías (DONE)

**Implementado:**
- CRUD persistente de categorías con nombre, slug y fotografía.
- Pantalla `/admin/categorias` con biblioteca multimedia.
- Protección contra eliminar categorías que todavía tienen productos.
- Filtros públicos y formulario de productos conectados a categorías dinámicas.
- Sincronización inmediata después de crear, editar o eliminar.

**Verificación:** `pytest` 49/49 verde; `npm run lint`, `npm run build` y
`./init.sh` verdes.

---

## 2026-07-26 — Feature 17: Orden manual de categorías (DONE)

**Implementado:**
- Posición visible en cada tarjeta de categoría.
- Controles Subir/Bajar con guardado inmediato.
- API que valida y persiste el orden completo sin omisiones ni duplicados.
- Actualización inmediata de filtros públicos y selector de productos.

**Verificación:** `pytest` 51/51 verde; `npm run lint`, `npm run build` y
`./init.sh` verdes.

---

## 2026-07-27 — Feature 25: Infraestructura de producción AWS y Vercel (DONE)

**Implementado:**
- Catálogo e imágenes administradas persistentes en buckets S3 separados.
- AWS DEV y PROD desplegados con API Gateway, Lambda y estados Terraform aislados.
- Rate limit, concurrencia reservada y presupuesto mensual de USD 5 por cuenta.
- Vercel conectado a `develop` como Preview y `master` como Production.
- Deploy de producción condicionado al resultado exitoso de los tests.

**Verificación:** 54 tests backend y 4 frontend verdes; lint y build verdes;
smoke tests reales de login, catálogo, biblioteca y carga de imágenes; workflows
DEV y PROD completados correctamente; producción devuelve 62 productos.

---

## 2026-07-27 — Feature 26: Cambio seguro de contraseña administrativa (DONE)

**Implementado:**
- Nueva pantalla `Admin → Seguridad` para cambiar la contraseña.
- Validación de contraseña actual, confirmación visual y mínimo de 12 caracteres.
- Hash PBKDF2-SHA256 con sal; nunca se persiste la contraseña en texto plano.
- Persistencia atómica local y objeto privado `auth.json` en S3.
- Invalidación de todas las sesiones anteriores después del cambio.
- Controles accesibles de ojo para mostrar u ocultar las contraseñas.

**Verificación:** pytest 60/60 y Vitest 4/4 verdes; lint, build, Terraform
validate y `./init.sh` verdes.

---

## 2026-07-26 — Feature 23: Editar número de WhatsApp desde administración (DONE)

**Implementado:**
- Campo “Número de WhatsApp” en Administración → Contenido.
- Acepta `+`, espacios y guiones; normaliza al formato requerido por WhatsApp.
- Mensaje de validación para teléfonos sin código de país o longitud válida.
- Cabecera, menú móvil, pie y productos consumen el número administrado.

**Verificación:** Vitest 4/4 y pytest 51/51 verdes; `npm run lint`,
`npm run build` y `./init.sh` verdes.

---

## 2026-07-26 — Feature 24: Actualizar imagen de bienvenida (DONE)

**Implementado:**
- Incorporada `IMG_2409.png` como `/images/amishi-bienvenida.png`.
- Contenido persistente y valores de respaldo actualizados al nuevo recurso.
- Transparencia y resolución original 2361×2361 conservadas.
- Selector de Contenido y biblioteca administrativa continúan habilitados.

**Verificación:** recurso presente en la biblioteca; Vitest 4/4 y pytest
51/51 verdes; `npm run lint`, `npm run build` y `./init.sh` verdes.

---

## 2026-07-26 — Feature 21: Mejorar encuadre de la imagen Sobre Amishi (DONE)

**Implementado:**
- Nueva composición vertical 4:5 de la ilustración, con menos espacio vacío.
- Fondo crema con halo rosado integrado a la identidad visual.
- Recurso original conservado y nueva imagen usada por el contenido del sitio.
- Renderizado con `object-contain` para evitar recortes en futuras imágenes.

**Verificación:** imagen 1122×1402; `pytest` 51/51 verde; `npm run lint`,
`npm run build` y `./init.sh` verdes.

---

## 2026-07-26 — Feature 22: Contacto por WhatsApp con origen (DONE)

**Implementado:**
- Número `+56 9 8991 3721` configurado en formato internacional.
- Mensajes prellenados que identifican cabecera, menú móvil o pie de página.
- Consultas de producto con nombre y enlace exacto de la ficha.
- Botón de producto y textos públicos actualizados de Instagram a WhatsApp.

**Verificación:** `pytest` 51/51 verde; `npm run lint`, `npm run build` y
`./init.sh` verdes.

---

## 2026-07-26 — Feature 20: Biblioteca de imágenes en el administrador (DONE)

**Implementado:**
- Nuevo acceso “Imágenes” en la navegación del administrador.
- Página `/admin/imagenes` con la biblioteca completa, sin límite de altura.
- Carga de nuevas fotografías compartida con productos, categorías y contenidos.
- Actualización inmediata de la biblioteca después de cada carga.

**Verificación:** `pytest` 51/51 verde; `npm run lint`, `npm run build` y
`./init.sh` verdes.

---

## 2026-07-26 — Feature 18: Eliminar productos de prueba (DONE)

**Implementado:** eliminados `nuevo-iman`, `nuevo-iman-1`, `nuevo-iman-2`,
`nuevo-iman-3` y `nuevo-iman-4`.

**Verificación:** quedan 62 productos; cero IDs `nuevo-iman`; cero imágenes
principales locales inexistentes; `pytest` 51/51 y `./init.sh` verdes.

---

## 2026-07-26 — Feature 19: Ordenar categorías con drag and drop (DONE)

**Implementado:**
- Tarjetas de categorías arrastrables con indicador visual durante el movimiento.
- Reordenamiento optimista y persistencia automática al soltar.
- Actualización inmediata del orden usado por el catálogo público.

**Verificación:** `pytest` 51/51 verde; `npm run lint`, `npm run build` y
`./init.sh` verdes.
