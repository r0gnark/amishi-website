/**
 * Filtros del catálogo (menú circular).
 * Imágenes de ejemplo — TODO: reemplazar por fotos reales por categoría en /public/images/catalog-filters/
 */
export const CATALOG_FILTER_IDS = [
  "mishi-frasco",
  "mishi-flor",
  "imanes",
  "michi-aros",
  "papeleria",
  "otros",
] as const;

export type CatalogCategoryId = (typeof CATALOG_FILTER_IDS)[number];

export type CatalogFilterItem = {
  id: CatalogCategoryId;
  /** Texto bajo el círculo */
  label: string;
  /** Imagen del círculo — TODO: reemplazar por asset propio */
  image: string;
};

export const catalogFilters: CatalogFilterItem[] = [
  {
    id: "mishi-frasco",
    label: "Mishi frasco",
    image: "https://picsum.photos/seed/amishi-filter-frasco/240/240",
  },
  {
    id: "mishi-flor",
    label: "Mishi Flor",
    image: "https://picsum.photos/seed/amishi-filter-flor/240/240",
  },
  {
    id: "imanes",
    label: "Imanes",
    image: "https://picsum.photos/seed/amishi-filter-imanes/240/240",
  },
  {
    id: "michi-aros",
    label: "Michi aros",
    image: "https://picsum.photos/seed/amishi-filter-aros/240/240",
  },
  {
    id: "papeleria",
    label: "Papelería",
    image: "https://picsum.photos/seed/amishi-filter-papeleria/240/240",
  },
  {
    id: "otros",
    label: "Otros",
    image: "https://picsum.photos/seed/amishi-filter-otros/240/240",
  },
];
