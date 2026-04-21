import { About } from "@/components/About";
import { Newsletter } from "@/components/Newsletter";
import { ProductGrid } from "@/components/ProductGrid";

/** Entrada del sitio: catálogo primero; Sobre y newsletter a continuación. */
export default function CatalogHomePage() {
  return (
    <div className="flex flex-col">
      <ProductGrid />
      <About />
      <Newsletter />
    </div>
  );
}
