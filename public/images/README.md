Coloca aquí las fotos reales de productos y de la marca.

**Catálogo** (`productos/`):

- `miniaturas/` → categoría **Mishi frasco** (cada archivo = un producto).
- `michi-flor/` → **Mishi Flor**.
- `hello-kitty/` → **Mishi Kitty**.
- `imanes/` → **Imanes**.
- `aros/` → **Michi aros**.
- `papeleria/prints/`, `papeleria/stickers-billetes/`, `papeleria/stickers-caras/` → **Papelería** (cada archivo = un producto).

Las rutas se listan en [`data/products.ts`](../../data/products.ts). Si agregas o quitas fotos, actualiza ese archivo (o vuelve a generar la lista).

**Filtros circulares:** usan una foto de muestra de cada carpeta (ver [`data/catalog-filters.ts`](../../data/catalog-filters.ts)); el acercamiento visual se hace con CSS en `CatalogFilterCircles`.
