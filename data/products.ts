/**
 * Catálogo de ejemplo — TODO: reemplazar con productos reales, precios e imágenes propias.
 * Las URLs de imagen usan picsum solo como placeholder; sustituir por archivos en /public/images/.
 * `id` se usa como slug en la URL: /producto/[id]
 */
import type { CatalogCategoryId } from "./catalog-filters";

export type Product = {
  id: string;
  name: string;
  /** Precio en pesos chilenos (entero) */
  price: number;
  /** Ruta local o URL remota — TODO: reemplazar cada src por foto real del producto */
  image: string;
  /** Enlace para consultar (Instagram DM o post del producto) */
  instagramUrl: string;
  /** Texto para la página de detalle — TODO: reemplazar con copy real */
  description: string;
  /** Filtro del menú circular */
  category: CatalogCategoryId;
};

export const products: Product[] = [
  {
    id: "taza-gatita",
    name: "Taza Gatita",
    price: 12000,
    image: "https://picsum.photos/seed/amishi-taza/600/600",
    instagramUrl: "https://www.instagram.com/amishi.cl/",
    description:
      "Taza de cerámica esmaltada con detalle felino. Ideal para mates largos o chocolate caliente. Pieza hecha a mano; pequeñas variaciones son parte del encanto.",
    category: "otros",
  },
  {
    id: "bowl-artesanal",
    name: "Bowl artesanal",
    price: 18500,
    image: "https://picsum.photos/seed/amishi-bowl/600/600",
    instagramUrl: "https://www.instagram.com/amishi.cl/",
    description:
      "Bowl profundo para desayunos y ensaladas. Interior suave, exterior con textura orgánica. Edición limitada.",
    category: "mishi-frasco",
  },
  {
    id: "print-gatos",
    name: "Print ilustrado Gatos",
    price: 8500,
    image: "https://picsum.photos/seed/amishi-print/600/600",
    instagramUrl: "https://www.instagram.com/amishi.cl/",
    description:
      "Ilustración en papel fine art, lista para enmarcar. Inspirada en la vida con gatos y rincones acogedores.",
    category: "papeleria",
  },
  {
    id: "posavasos-set",
    name: "Set posavasos cerámica",
    price: 9900,
    image: "https://picsum.photos/seed/amishi-posa/600/600",
    instagramUrl: "https://www.instagram.com/amishi.cl/",
    description:
      "Cuatro posavasos con glaseado reactivo. Protegen la mesa con estilo y un toque artesanal.",
    category: "mishi-frasco",
  },
  {
    id: "maceta-mini",
    name: "Maceta mini gatito",
    price: 14500,
    image: "https://picsum.photos/seed/amishi-maceta/600/600",
    instagramUrl: "https://www.instagram.com/amishi.cl/",
    description:
      "Maceta pequeña para suculentas o aromáticas. Forma orgánica y drenaje cuidado. Perfecta para escritorio.",
    category: "mishi-flor",
  },
  {
    id: "stickers-pack",
    name: "Pack stickers Amishi",
    price: 4500,
    image: "https://picsum.photos/seed/amishi-stickers/600/600",
    instagramUrl: "https://www.instagram.com/amishi.cl/",
    description:
      "Pack de stickers ilustrados para planner, laptop o regalos. Papel vinílico mate resistente al agua.",
    category: "papeleria",
  },
  {
    id: "iman-nevera-michi",
    name: "Imán nevera Michi",
    price: 3500,
    image: "https://picsum.photos/seed/amishi-iman/600/600",
    instagramUrl: "https://www.instagram.com/amishi.cl/",
    description:
      "Imán de nevera con ilustración Michi. Ideal para recordatorios con estilo en la cocina.",
    category: "imanes",
  },
  {
    id: "aros-michi-dorados",
    name: "Aros Michi dorados",
    price: 8900,
    image: "https://picsum.photos/seed/amishi-aros/600/600",
    instagramUrl: "https://www.instagram.com/amishi.cl/",
    description:
      "Aros colgantes con charm felino. Acero inoxidable dorado; livianos para el día a día.",
    category: "michi-aros",
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.id === slug);
}

export function getAllProductSlugs(): string[] {
  return products.map((p) => p.id);
}
