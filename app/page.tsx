import { About } from "@/components/About";
import { ProductGrid } from "@/components/ProductGrid";

/** Entrada del sitio: catálogo y sección Sobre. */
export default function CatalogHomePage() {
  return (
    <div className="flex flex-col">
      <ProductGrid />
      <About />
    </div>
  );
}
