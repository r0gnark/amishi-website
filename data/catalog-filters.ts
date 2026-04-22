/**
 * Filtros del catálogo (menú circular).
 * Miniaturas en /public/images/catalog-filters/
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
    image: "/images/catalog-filters/mishi-frasco.jpeg",
  },
  {
    id: "mishi-flor",
    label: "Mishi Flor",
    image: "/images/catalog-filters/michi-flor.jpeg",
  },
  {
    id: "mishi-kitty",
    label: "Mishi Kitty",
    image: "/images/catalog-filters/hello-kitty.jpeg",
  },
  {
    id: "imanes",
    label: "Imanes",
    image: "/images/catalog-filters/imanes.jpeg",
  },
  {
    id: "michi-aros",
    label: "Michi aros",
    image: "/images/catalog-filters/aros.jpeg",
  },
  {
    id: "papeleria",
    label: "Papelería",
    image: "/images/catalog-filters/papeleria.jpeg",
  },
];
