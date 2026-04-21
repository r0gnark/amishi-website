# Amishi — sitio vitrina

Sitio web de vitrina para **Amishi** (diseño, gatos y cerámica), construido con **Next.js (App Router)**, **TypeScript** y **Tailwind CSS v4**. Inspirado en la estructura suave de tiendas tipo [Ho' colors](https://ho-colors.myshopify.com/), sin carrito ni checkout: las consultas van por Instagram.

- **Entrada (`/`)**: catálogo al inicio; debajo, secciones Sobre y newsletter.
- **Detalle de producto**: `/producto/[slug]` donde `slug` coincide con el campo `id` de cada producto en `data/products.ts`.

## Requisitos

- Node.js 20+ (recomendado)
- npm

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando       | Descripción              |
| ------------- | ------------------------ |
| `npm run dev` | Servidor de desarrollo   |
| `npm run build` | Compilación de producción |
| `npm run start` | Servidor tras `build`    |
| `npm run lint`  | ESLint                   |

## Dónde editar el contenido

| Qué cambiar | Archivo / carpeta |
| ----------- | ------------------ |
| **Productos, precios, imágenes, descripciones, categoría** | [`data/products.ts`](data/products.ts) — campo `category` debe coincidir con un id de [`data/catalog-filters.ts`](data/catalog-filters.ts) |
| **Menú circular de filtros (etiquetas e imágenes)** | [`data/catalog-filters.ts`](data/catalog-filters.ts) |
| **Página de detalle (SEO)** | [`app/producto/[slug]/page.tsx`](app/producto/[slug]/page.tsx) — metadata por producto |
| **Instagram, nombre** | [`lib/site.ts`](lib/site.ts) |
| **Colores y tipografía (tema)** | [`app/globals.css`](app/globals.css) — tokens `--color-*` y fuentes en `@theme inline` |
| **Fuentes Google** | [`app/layout.tsx`](app/layout.tsx) — `Fraunces` (títulos) y `Nunito` (cuerpo) |
| **Textos de secciones** | Componentes en [`components/`](components/) (`About`, `ProductGrid`, etc.) |
| **SEO y URL canónica** | [`app/layout.tsx`](app/layout.tsx) — `metadata` y variable `NEXT_PUBLIC_SITE_URL` |
| **Dominios de imágenes remotas** | [`next.config.ts`](next.config.ts) — `images.remotePatterns` si usas otro host además de `picsum.photos` |

Crea un archivo `.env.local` a partir de [`.env.example`](.env.example) para la URL pública del sitio (Open Graph / metadata).

## Despliegue

Compatible con [Vercel](https://vercel.com) u otro hosting Node. Define `NEXT_PUBLIC_SITE_URL` con la URL definitiva (ej. `https://tudominio.cl`).

## Notas

- Las imágenes de producto usan **placeholders** (`picsum.photos`) marcados con comentarios `TODO` para reemplazo.
- El formulario de newsletter es **solo UI**: muestra un mensaje de confirmación; conecta [Formspree](https://formspree.io), tu API o proveedor de email cuando quieras captar suscriptores de verdad.

## Licencia

Privado — Amishi.
