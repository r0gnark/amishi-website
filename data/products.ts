/**
 * Catálogo Amishi — rutas según `public/images/productos/` (carpetas del usuario).
 * Cada foto en disco es un producto. Al agregar o quitar archivos .jpeg/.png, regenera este archivo
 * o actualiza las entradas a mano.
 *
 * Precios en CLP — ver constantes al final del bloque de datos si se centralizan.
 */
import type { CatalogCategoryId } from "./catalog-filters";

const IG = "https://ig.me/m/amishi.cl";

/** Vista ejemplo con marco blanco; segunda foto en ficha de prints/postales. */
export const PRINT_MARCO_IMAGE = "/images/productos/papeleria/prints/print_marco.png" as const;

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  /** Rutas adicionales para galería en ficha (p. ej. mockup con marco). */
  gallery?: string[];
  instagramUrl: string;
  description: string;
  category: CatalogCategoryId;
};

export const products: Product[] = [
  {
    id: "miniaturas-image00005",
    name: "Mishi frasco 1",
    price: 5000,
    image: "/images/productos/miniaturas/image00005.jpeg",
    instagramUrl: IG,
    description: `Miniatura hecha a mano
Material figura: yeso cerámico
Material frasco: cristal
Tamaño: 2x3,5cm app`,
    category: "mishi-frasco",
  },
  {
    id: "miniaturas-image00008",
    name: "Mishi frasco 2",
    price: 5000,
    image: "/images/productos/miniaturas/image00008.jpeg",
    instagramUrl: IG,
    description: `Miniatura hecha a mano
Material figura: yeso cerámico
Material frasco: cristal
Tamaño: 2x3,5cm app`,
    category: "mishi-frasco",
  },
  {
    id: "miniaturas-image00009",
    name: "Mishi frasco 3",
    price: 5000,
    image: "/images/productos/miniaturas/image00009.jpeg",
    instagramUrl: IG,
    description: `Miniatura hecha a mano
Material figura: yeso cerámico
Material frasco: cristal
Tamaño: 2x3,5cm app`,
    category: "mishi-frasco",
  },
  {
    id: "miniaturas-image00013",
    name: "Mishi frasco 4",
    price: 5000,
    image: "/images/productos/miniaturas/image00013.jpeg",
    instagramUrl: IG,
    description: `Miniatura hecha a mano
Material figura: yeso cerámico
Material frasco: cristal
Tamaño: 2x3,5cm app`,
    category: "mishi-frasco",
  },
  {
    id: "miniaturas-image00018",
    name: "Mishi frasco 5",
    price: 5000,
    image: "/images/productos/miniaturas/image00018.jpeg",
    instagramUrl: IG,
    description: `Miniatura hecha a mano
Material figura: yeso cerámico
Material frasco: cristal
Tamaño: 2x3,5cm app`,
    category: "mishi-frasco",
  },
  {
    id: "miniaturas-image00021",
    name: "Mishi frasco 6",
    price: 5000,
    image: "/images/productos/miniaturas/image00021.jpeg",
    instagramUrl: IG,
    description: `Miniatura hecha a mano
Material figura: yeso cerámico
Material frasco: cristal
Tamaño: 2x3,5cm app`,
    category: "mishi-frasco",
  },
  {
    id: "miniaturas-image00022",
    name: "Mishi frasco 7",
    price: 5000,
    image: "/images/productos/miniaturas/image00022.jpeg",
    instagramUrl: IG,
    description: `Miniatura hecha a mano
Material figura: yeso cerámico
Material frasco: cristal
Tamaño: 2x3,5cm app`,
    category: "mishi-frasco",
  },
  {
    id: "miniaturas-image00023",
    name: "Mishi frasco 8",
    price: 5000,
    image: "/images/productos/miniaturas/image00023.jpeg",
    instagramUrl: IG,
    description: `Miniatura hecha a mano
Material figura: yeso cerámico
Material frasco: cristal
Tamaño: 2x3,5cm app`,
    category: "mishi-frasco",
  },
  {
    id: "miniaturas-image00024",
    name: "Mishi frasco 9",
    price: 5000,
    image: "/images/productos/miniaturas/image00024.jpeg",
    instagramUrl: IG,
    description: `Miniatura hecha a mano
Material figura: yeso cerámico
Material frasco: cristal
Tamaño: 2x3,5cm app`,
    category: "mishi-frasco",
  },
  {
    id: "miniaturas-image00025",
    name: "Mishi frasco 10",
    price: 5000,
    image: "/images/productos/miniaturas/image00025.jpeg",
    instagramUrl: IG,
    description: `Miniatura hecha a mano
Material figura: yeso cerámico
Material frasco: cristal
Tamaño: 2x3,5cm app`,
    category: "mishi-frasco",
  },
  {
    id: "michi-flor-image00006",
    name: "Mishi Flor 1",
    price: 15000,
    image: "/images/productos/michi-flor/image00006.jpeg",
    instagramUrl: IG,
    description: `Figura decorativa Mishi Flor
Material figura: yeso cerámico
Tamaño: 5x6cm app
Barniz: mate`,
    category: "mishi-flor",
  },
  {
    id: "michi-flor-image00012",
    name: "Mishi Flor 2",
    price: 15000,
    image: "/images/productos/michi-flor/image00012.jpeg",
    instagramUrl: IG,
    description: `Figura decorativa Mishi Flor
Material figura: yeso cerámico
Tamaño: 5x6cm app
Barniz: mate`,
    category: "mishi-flor",
  },
  {
    id: "michi-flor-image00015",
    name: "Mishi Flor 3",
    price: 15000,
    image: "/images/productos/michi-flor/image00015.jpeg",
    instagramUrl: IG,
    description: `Figura decorativa Mishi Flor
Material figura: yeso cerámico
Tamaño: 5x6cm app
Barniz: mate`,
    category: "mishi-flor",
  },
  {
    id: "michi-flor-image00017",
    name: "Mishi Flor 4",
    price: 15000,
    image: "/images/productos/michi-flor/image00017.jpeg",
    instagramUrl: IG,
    description: `Figura decorativa Mishi Flor
Material figura: yeso cerámico
Tamaño: 5x6cm app
Barniz: mate`,
    category: "mishi-flor",
  },
  {
    id: "michi-flor-image00019",
    name: "Mishi Flor 5",
    price: 15000,
    image: "/images/productos/michi-flor/image00019.jpeg",
    instagramUrl: IG,
    description: `Figura decorativa Mishi Flor
Material figura: yeso cerámico
Tamaño: 5x6cm app
Barniz: mate`,
    category: "mishi-flor",
  },
  {
    id: "hello-kitty-image00001",
    name: "Mishi Kitty 1",
    price: 5000,
    image: "/images/productos/hello-kitty/image00001.jpeg",
    instagramUrl: IG,
    description: `Figura decorativa
Material: yeso cerámico
Tamaño: 4,5x5,5cm app`,
    category: "mishi-kitty",
  },
  {
    id: "hello-kitty-image00002",
    name: "Mishi Kitty 2",
    price: 5000,
    image: "/images/productos/hello-kitty/image00002.jpeg",
    instagramUrl: IG,
    description: `Figura decorativa
Material: yeso cerámico
Tamaño: 4,5x5,5cm app`,
    category: "mishi-kitty",
  },
  {
    id: "hello-kitty-image00003",
    name: "Mishi Kitty 3",
    price: 5000,
    image: "/images/productos/hello-kitty/image00003.jpeg",
    instagramUrl: IG,
    description: `Figura decorativa
Material: yeso cerámico
Tamaño: 4,5x5,5cm app`,
    category: "mishi-kitty",
  },
  {
    id: "hello-kitty-image00004",
    name: "Mishi Kitty 4",
    price: 5000,
    image: "/images/productos/hello-kitty/image00004.jpeg",
    instagramUrl: IG,
    description: `Figura decorativa
Material: yeso cerámico
Tamaño: 4,5x5,5cm app`,
    category: "mishi-kitty",
  },
  {
    id: "hello-kitty-image00010",
    name: "Mishi Kitty 5",
    price: 5000,
    image: "/images/productos/hello-kitty/image00010.jpeg",
    instagramUrl: IG,
    description: `Figura decorativa
Material: yeso cerámico
Tamaño: 4,5x5,5cm app`,
    category: "mishi-kitty",
  },
  {
    id: "hello-kitty-image00033",
    name: "Mishi Kitty 6",
    price: 5000,
    image: "/images/productos/hello-kitty/image00033.jpeg",
    instagramUrl: IG,
    description: `Figura decorativa
Material: yeso cerámico
Tamaño: 4,5x5,5cm app`,
    category: "mishi-kitty",
  },
  {
    id: "imanes-image00007",
    name: "Imán 1",
    price: 4000,
    image: "/images/productos/imanes/image00007.jpeg",
    instagramUrl: IG,
    description: `Imán decorativo
Material: yeso cerámico
Tamaño: 4x5 cm app`,
    category: "imanes",
  },
  {
    id: "imanes-image00011",
    name: "Imán 2",
    price: 4000,
    image: "/images/productos/imanes/image00011.jpeg",
    instagramUrl: IG,
    description: `Imán decorativo
Material: yeso cerámico
Tamaño: 4x5 cm app`,
    category: "imanes",
  },
  {
    id: "imanes-image00014",
    name: "Imán 3",
    price: 4000,
    image: "/images/productos/imanes/image00014.jpeg",
    instagramUrl: IG,
    description: `Imán decorativo
Material: yeso cerámico
Tamaño: 4x5 cm app`,
    category: "imanes",
  },
  {
    id: "imanes-image00016",
    name: "Imán 4",
    price: 4000,
    image: "/images/productos/imanes/image00016.jpeg",
    instagramUrl: IG,
    description: `Imán decorativo
Material: yeso cerámico
Tamaño: 4x5 cm app`,
    category: "imanes",
  },
  {
    id: "imanes-image00020",
    name: "Imán 5",
    price: 4000,
    image: "/images/productos/imanes/image00020.jpeg",
    instagramUrl: IG,
    description: `Imán decorativo
Material: yeso cerámico
Tamaño: 4x5 cm app`,
    category: "imanes",
  },
  {
    id: "aros-image00026",
    name: "Mishi aros 1",
    price: 15000,
    image: "/images/productos/aros/image00026.jpeg",
    instagramUrl: IG,
    description: `Aros Mishi
Material figura: arcilla secado al aire
Material pendiente: acero inoxidable`,
    category: "mishi-aros",
  },
  {
    id: "aros-image00027",
    name: "Mishi aros 2",
    price: 15000,
    image: "/images/productos/aros/image00027.jpeg",
    instagramUrl: IG,
    description: `Aros Mishi
Material figura: arcilla secado al aire
Material pendiente: acero inoxidable`,
    category: "mishi-aros",
  },
  {
    id: "aros-image00028",
    name: "Mishi aros 3",
    price: 15000,
    image: "/images/productos/aros/image00028.jpeg",
    instagramUrl: IG,
    description: `Aros Mishi
Material figura: arcilla secado al aire
Material pendiente: acero inoxidable`,
    category: "mishi-aros",
  },
  {
    id: "aros-image00029",
    name: "Mishi aros 4",
    price: 15000,
    image: "/images/productos/aros/image00029.jpeg",
    instagramUrl: IG,
    description: `Aros Mishi
Material figura: arcilla secado al aire
Material pendiente: acero inoxidable`,
    category: "mishi-aros",
  },
  {
    id: "aros-image00030",
    name: "Mishi aros 5",
    price: 15000,
    image: "/images/productos/aros/image00030.jpeg",
    instagramUrl: IG,
    description: `Aros Mishi
Material figura: arcilla secado al aire
Material pendiente: acero inoxidable`,
    category: "mishi-aros",
  },
  {
    id: "aros-image00031",
    name: "Mishi aros 6",
    price: 15000,
    image: "/images/productos/aros/image00031.jpeg",
    instagramUrl: IG,
    description: `Aros Mishi
Material figura: arcilla secado al aire
Material pendiente: acero inoxidable`,
    category: "mishi-aros",
  },
  {
    id: "aros-image00032",
    name: "Mishi aros 7",
    price: 15000,
    image: "/images/productos/aros/image00032.jpeg",
    instagramUrl: IG,
    description: `Aros Mishi
Material figura: arcilla secado al aire
Material pendiente: acero inoxidable`,
    category: "mishi-aros",
  },
  {
    id: "aros-image00034",
    name: "Mishi aros 8",
    price: 15000,
    image: "/images/productos/aros/image00034.jpeg",
    instagramUrl: IG,
    description: `Aros Mishi
Material figura: arcilla secado al aire
Material pendiente: acero inoxidable`,
    category: "mishi-aros",
  },
  {
    id: "aros-image00035",
    name: "Mishi aros 9",
    price: 15000,
    image: "/images/productos/aros/image00035.jpeg",
    instagramUrl: IG,
    description: `Aros Mishi
Material figura: arcilla secado al aire
Material pendiente: acero inoxidable`,
    category: "mishi-aros",
  },
  {
    id: "aros-image00036",
    name: "Mishi aros 10",
    price: 15000,
    image: "/images/productos/aros/image00036.jpeg",
    instagramUrl: IG,
    description: `Aros Mishi
Material figura: arcilla secado al aire
Material pendiente: acero inoxidable`,
    category: "mishi-aros",
  },
  {
    id: "papeleria-prints-image00053",
    name: "Print / postal 1",
    price: 2500,
    image: "/images/productos/papeleria/prints/image00053.jpeg",
    gallery: [PRINT_MARCO_IMAGE],
    instagramUrl: IG,
    description: `Print/postal ideal para decorar
Impresión Láser
Papel couche, 270 grs.
Tamaño: 10x15cm app

Se pueden enviar enmarcado con marco blanco por 3.000 extras (preguntar en dm por disponibilidad)

* no incluye pedestal que aparece en la fotografía de exposición`,
    category: "papeleria",
  },
  {
    id: "papeleria-prints-image00054",
    name: "Print / postal 2",
    price: 2500,
    image: "/images/productos/papeleria/prints/image00054.jpeg",
    gallery: [PRINT_MARCO_IMAGE],
    instagramUrl: IG,
    description: `Print/postal ideal para decorar
Impresión Láser
Papel couche, 270 grs.
Tamaño: 10x15cm app

Se pueden enviar enmarcado con marco blanco por 3.000 extras (preguntar en dm por disponibilidad)

* no incluye pedestal que aparece en la fotografía de exposición`,
    category: "papeleria",
  },
  {
    id: "papeleria-prints-image00055",
    name: "Print / postal 3",
    price: 2500,
    image: "/images/productos/papeleria/prints/image00055.jpeg",
    gallery: [PRINT_MARCO_IMAGE],
    instagramUrl: IG,
    description: `Print/postal ideal para decorar
Impresión Láser
Papel couche, 270 grs.
Tamaño: 10x15cm app

Se pueden enviar enmarcado con marco blanco por 3.000 extras (preguntar en dm por disponibilidad)

* no incluye pedestal que aparece en la fotografía de exposición`,
    category: "papeleria",
  },
  {
    id: "papeleria-prints-image00056",
    name: "Print / postal 4",
    price: 2500,
    image: "/images/productos/papeleria/prints/image00056.jpeg",
    gallery: [PRINT_MARCO_IMAGE],
    instagramUrl: IG,
    description: `Print/postal ideal para decorar
Impresión Láser
Papel couche, 270 grs.
Tamaño: 10x15cm app

Se pueden enviar enmarcado con marco blanco por 3.000 extras (preguntar en dm por disponibilidad)

* no incluye pedestal que aparece en la fotografía de exposición`,
    category: "papeleria",
  },
  {
    id: "papeleria-prints-image00057",
    name: "Print / postal 5",
    price: 2500,
    image: "/images/productos/papeleria/prints/image00057.jpeg",
    gallery: [PRINT_MARCO_IMAGE],
    instagramUrl: IG,
    description: `Print/postal ideal para decorar
Impresión Láser
Papel couche, 270 grs.
Tamaño: 10x15cm app

Se pueden enviar enmarcado con marco blanco por 3.000 extras (preguntar en dm por disponibilidad)

* no incluye pedestal que aparece en la fotografía de exposición`,
    category: "papeleria",
  },
  {
    id: "papeleria-prints-image00058",
    name: "Print / postal 6",
    price: 2500,
    image: "/images/productos/papeleria/prints/image00058.jpeg",
    gallery: [PRINT_MARCO_IMAGE],
    instagramUrl: IG,
    description: `Print/postal ideal para decorar
Impresión Láser
Papel couche, 270 grs.
Tamaño: 10x15cm app

Se pueden enviar enmarcado con marco blanco por 3.000 extras (preguntar en dm por disponibilidad)

* no incluye pedestal que aparece en la fotografía de exposición`,
    category: "papeleria",
  },
  {
    id: "papeleria-prints-image00059",
    name: "Print / postal 7",
    price: 2500,
    image: "/images/productos/papeleria/prints/image00059.jpeg",
    gallery: [PRINT_MARCO_IMAGE],
    instagramUrl: IG,
    description: `Print/postal ideal para decorar
Impresión Láser
Papel couche, 270 grs.
Tamaño: 10x15cm app

Se pueden enviar enmarcado con marco blanco por 3.000 extras (preguntar en dm por disponibilidad)

* no incluye pedestal que aparece en la fotografía de exposición`,
    category: "papeleria",
  },
  {
    id: "papeleria-prints-image00060",
    name: "Print / postal 8",
    price: 2500,
    image: "/images/productos/papeleria/prints/image00060.jpeg",
    gallery: [PRINT_MARCO_IMAGE],
    instagramUrl: IG,
    description: `Print/postal ideal para decorar
Impresión Láser
Papel couche, 270 grs.
Tamaño: 10x15cm app

Se pueden enviar enmarcado con marco blanco por 3.000 extras (preguntar en dm por disponibilidad)

* no incluye pedestal que aparece en la fotografía de exposición`,
    category: "papeleria",
  },
  {
    id: "papeleria-prints-print-nuevo",
    name: "Print / postal 9",
    price: 2500,
    image: "/images/productos/papeleria/prints/print_nuevo.png",
    gallery: [PRINT_MARCO_IMAGE],
    instagramUrl: IG,
    description: `Print/postal ideal para decorar
Impresión Láser
Papel couche, 270 grs.
Tamaño: 10x15cm app

Se pueden enviar enmarcado con marco blanco por 3.000 extras (preguntar en dm por disponibilidad)

Pueden consultar por la disponibilidad de un color similar al de su mishi (preguntar en dm)

* no incluye pedestal que aparece en la fotografía de exposición`,
    category: "papeleria",
  },
  {
    id: "papeleria-croqueras-croquera",
    name: "Croquera",
    price: 5000,
    image: "/images/productos/papeleria/croqueras/croquera.png",
    instagramUrl: IG,
    description: `Croquera tapa dura
100 hojas blancas
Tamaño: 11x17cm app`,
    category: "papeleria",
  },
  {
    id: "papeleria-stickers-billetes-image00049",
    name: "Sticker billete 1",
    price: 500,
    image: "/images/productos/papeleria/stickers-billetes/image00049.jpeg",
    instagramUrl: IG,
    description: `Mishi billete
Papel adhesivo
Tamaño: 5,5x9,5cm

500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web`,
    category: "papeleria",
  },
  {
    id: "papeleria-stickers-billetes-image00050",
    name: "Sticker billete 2",
    price: 500,
    image: "/images/productos/papeleria/stickers-billetes/image00050.jpeg",
    instagramUrl: IG,
    description: `Mishi billete
Papel adhesivo
Tamaño: 5,5x9,5cm

500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web`,
    category: "papeleria",
  },
  {
    id: "papeleria-stickers-billetes-image00051",
    name: "Sticker billete 3",
    price: 500,
    image: "/images/productos/papeleria/stickers-billetes/image00051.jpeg",
    instagramUrl: IG,
    description: `Mishi billete
Papel adhesivo
Tamaño: 5,5x9,5cm

500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web`,
    category: "papeleria",
  },
  {
    id: "papeleria-stickers-billetes-image00052",
    name: "Sticker billete 4",
    price: 500,
    image: "/images/productos/papeleria/stickers-billetes/image00052.jpeg",
    instagramUrl: IG,
    description: `Mishi billete
Papel adhesivo
Tamaño: 5,5x9,5cm

500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web`,
    category: "papeleria",
  },
  {
    id: "papeleria-stickers-caras-image00037",
    name: "Sticker cara Mishi 1",
    price: 500,
    image: "/images/productos/papeleria/stickers-caras/image00037.jpeg",
    instagramUrl: IG,
    description: `Sticker Mishi troquelado
Papel adhesivo
Tamaño: 6x5cm app

500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web`,
    category: "papeleria",
  },
  {
    id: "papeleria-stickers-caras-image00038",
    name: "Sticker cara Mishi 2",
    price: 500,
    image: "/images/productos/papeleria/stickers-caras/image00038.jpeg",
    instagramUrl: IG,
    description: `Sticker Mishi troquelado
Papel adhesivo
Tamaño: 6x5cm app

500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web`,
    category: "papeleria",
  },
  {
    id: "papeleria-stickers-caras-image00039",
    name: "Sticker cara Mishi 3",
    price: 500,
    image: "/images/productos/papeleria/stickers-caras/image00039.jpeg",
    instagramUrl: IG,
    description: `Sticker Mishi troquelado
Papel adhesivo
Tamaño: 6x5cm app

500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web`,
    category: "papeleria",
  },
  {
    id: "papeleria-stickers-caras-image00040",
    name: "Sticker cara Mishi 4",
    price: 500,
    image: "/images/productos/papeleria/stickers-caras/image00040.jpeg",
    instagramUrl: IG,
    description: `Sticker Mishi troquelado
Papel adhesivo
Tamaño: 6x5cm app

500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web`,
    category: "papeleria",
  },
  {
    id: "papeleria-stickers-caras-image00041",
    name: "Sticker cara Mishi 5",
    price: 500,
    image: "/images/productos/papeleria/stickers-caras/image00041.jpeg",
    instagramUrl: IG,
    description: `Sticker Mishi troquelado
Papel adhesivo
Tamaño: 6x5cm app

500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web`,
    category: "papeleria",
  },
  {
    id: "papeleria-stickers-caras-image00042",
    name: "Sticker cara Mishi 6",
    price: 500,
    image: "/images/productos/papeleria/stickers-caras/image00042.jpeg",
    instagramUrl: IG,
    description: `Sticker Mishi troquelado
Papel adhesivo
Tamaño: 6x5cm app

500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web`,
    category: "papeleria",
  },
  {
    id: "papeleria-stickers-caras-image00043",
    name: "Sticker cara Mishi 7",
    price: 500,
    image: "/images/productos/papeleria/stickers-caras/image00043.jpeg",
    instagramUrl: IG,
    description: `Sticker Mishi troquelado
Papel adhesivo
Tamaño: 6x5cm app

500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web`,
    category: "papeleria",
  },
  {
    id: "papeleria-stickers-caras-image00044",
    name: "Sticker cara Mishi 8",
    price: 500,
    image: "/images/productos/papeleria/stickers-caras/image00044.jpeg",
    instagramUrl: IG,
    description: `Sticker Mishi troquelado
Papel adhesivo
Tamaño: 6x5cm app

500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web`,
    category: "papeleria",
  },
  {
    id: "papeleria-stickers-caras-image00045",
    name: "Sticker cara Mishi 9",
    price: 500,
    image: "/images/productos/papeleria/stickers-caras/image00045.jpeg",
    instagramUrl: IG,
    description: `Sticker Mishi troquelado
Papel adhesivo
Tamaño: 6x5cm app

500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web`,
    category: "papeleria",
  },
  {
    id: "papeleria-stickers-caras-image00046",
    name: "Sticker cara Mishi 10",
    price: 500,
    image: "/images/productos/papeleria/stickers-caras/image00046.jpeg",
    instagramUrl: IG,
    description: `Sticker Mishi troquelado
Papel adhesivo
Tamaño: 6x5cm app

500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web`,
    category: "papeleria",
  },
  {
    id: "papeleria-stickers-caras-image00047",
    name: "Sticker cara Mishi 11",
    price: 500,
    image: "/images/productos/papeleria/stickers-caras/image00047.jpeg",
    instagramUrl: IG,
    description: `Sticker Mishi troquelado
Papel adhesivo
Tamaño: 6x5cm app

500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web`,
    category: "papeleria",
  },
  {
    id: "papeleria-stickers-caras-image00048",
    name: "Sticker cara Mishi 12",
    price: 500,
    image: "/images/productos/papeleria/stickers-caras/image00048.jpeg",
    instagramUrl: IG,
    description: `Sticker Mishi troquelado
Papel adhesivo
Tamaño: 6x5cm app

500 c/u 3x 1.000 Se puede mezclar con stickers disponibles en el catálogo web`,
    category: "papeleria",
  },
];

/** Rutas de imágenes para la ficha: principal y extras de galería. */
export function getProductImages(product: Product): string[] {
  if (product.gallery?.length) {
    return [product.image, ...product.gallery];
  }
  return [product.image];
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.id === slug);
}

export function getAllProductSlugs(): string[] {
  return products.map((p) => p.id);
}
