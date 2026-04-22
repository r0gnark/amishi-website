/**
 * Filtros del catálogo (menú circular).
 * Miniaturas WebP en /public/images/catalog-filters/ (ligeras; redibujar si cambias PNG fuente).
 */
export const CATALOG_FILTER_IDS = [
  "mishi-frasco",
  "mishi-flor",
  "mishi-kitty",
  "imanes",
  "michi-aros",
  "papeleria",
] as const;

export type CatalogCategoryId = (typeof CATALOG_FILTER_IDS)[number];

export type CatalogFilterItem = {
  id: CatalogCategoryId;
  /** Texto bajo el círculo */
  label: string;
  /** Imagen del círculo */
  image: string;
};

/** El zoom en círculos se aplica en `CatalogFilterCircles`. */
export const catalogFilters: CatalogFilterItem[] = [
  {
    id: "mishi-frasco",
    label: "Mishi frasco",
    image: "/images/catalog-filters/mishi-frasco.webp",
  },
  {
    id: "mishi-flor",
    label: "Mishi Flor",
    image: "/images/catalog-filters/mishi-flor.webp",
  },
  {
    id: "mishi-kitty",
    label: "Mishi Kitty",
    image: "/images/catalog-filters/hello-kitty.webp",
  },
  {
    id: "imanes",
    label: "Imanes",
    image: "/images/catalog-filters/imanes.webp",
  },
  {
    id: "michi-aros",
    label: "Michi aros",
    image: "/images/catalog-filters/aros.webp",
  },
  {
    id: "papeleria",
    label: "Papelería",
    image: "/images/catalog-filters/papeleria.webp",
  },
];
