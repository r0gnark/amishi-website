import type { CatalogCategoryId } from "@/data/catalog-filters";

/**
 * Contenedor de la foto en catálogo y ficha: rectángulo vertical alargado (tipo mockup móvil).
 */
export const PRODUCT_PHOTO_ASPECT_CLASS = "aspect-[3/5]";

/** Mishi aros 1, 3, 4 y 5: más acercamiento al producto. */
const MISHI_AROS_EXTRA_ZOOM = new Set<string>([
  "aros-image00026",
  "aros-image00028",
  "aros-image00029",
  "aros-image00030",
]);

/**
 * Imagen: cover, centrada, zoom ligero para que el producto ocupe mejor el marco.
 */
export function productImageClassName(
  _category: CatalogCategoryId,
  options: { withCardHover?: boolean; productId?: string } = {},
): string {
  const { withCardHover = false, productId } = options;
  const closer = productId && MISHI_AROS_EXTRA_ZOOM.has(productId);
  const scale = closer ? "scale-[1.34]" : "scale-[1.14]";
  const hover = withCardHover
    ? closer
      ? "transition duration-300 ease-out will-change-transform group-hover:scale-[1.44]"
      : "transition duration-300 ease-out will-change-transform group-hover:scale-[1.22]"
    : "";

  const base = `h-full w-full origin-center object-cover object-[center_50%] ${scale}`;

  return [base, hover].filter(Boolean).join(" ");
}
