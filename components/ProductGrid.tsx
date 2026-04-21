"use client";

import { useMemo } from "react";
import { products } from "@/data/products";
import { CatalogFilterCircles } from "./CatalogFilterCircles";
import { useCatalogFilter } from "./CatalogFilterContext";
import { ProductCard } from "./ProductCard";

export function ProductGrid() {
  const { filter, setFilter } = useCatalogFilter();

  const visible = useMemo(() => {
    if (!filter) return products;
    return products.filter((p) => p.category === filter);
  }, [filter]);

  return (
    <section
      id="catalogo"
      className="border-b border-rose/15 bg-gradient-to-b from-cream to-blush/20 py-10 md:py-14"
      aria-labelledby="catalogo-titulo"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h1
          id="catalogo-titulo"
          className="text-center font-display text-3xl font-semibold text-ink md:text-4xl"
        >
          Catálogo
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-ink/75">
          Elige una categoría o mira todo. Toca un producto para ver el detalle. Precios de
          referencia; disponibilidad y envíos se coordinan por Instagram.
        </p>

        <div className="mt-8 border-b border-rose/15 pb-8 md:mt-10 md:pb-10">
          <CatalogFilterCircles activeId={filter} onSelect={setFilter} />
        </div>

        {visible.length === 0 ? (
          <p className="mt-10 text-center text-sm text-ink/70" role="status">
            No hay productos en esta categoría por ahora.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
