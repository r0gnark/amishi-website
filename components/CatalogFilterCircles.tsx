"use client";

import Image from "next/image";
import type { CatalogCategoryId } from "@/data/catalog-filters";
import { catalogFilters } from "@/data/catalog-filters";

type CatalogFilterCirclesProps = {
  /** null = mostrar todos los productos */
  activeId: CatalogCategoryId | null;
  onSelect: (id: CatalogCategoryId | null) => void;
};

export function CatalogFilterCircles({ activeId, onSelect }: CatalogFilterCirclesProps) {
  function handleClick(id: CatalogCategoryId) {
    onSelect(activeId === id ? null : id);
  }

  return (
    <div className="w-full min-w-0" role="group" aria-label="Filtrar por categoría">
      {/*
        Móvil/tablet: scroll horizontal suave (muchas categorías).
        sm+: fila centrada con wrap para 2 filas si hace falta.
      */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
        <ul
          className="
            flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pt-1 [scrollbar-width:thin]
            sm:snap-none sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-1 sm:pt-0
            md:gap-6 lg:gap-8
          "
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {catalogFilters.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li
                key={item.id}
                className="
                  flex w-[4.5rem] shrink-0 snap-center flex-col items-center
                  sm:w-[5rem] sm:shrink
                  md:w-[5.25rem]
                "
              >
                <button
                  type="button"
                  onClick={() => handleClick(item.id)}
                  aria-pressed={isActive}
                  aria-label={`Filtrar por ${item.label}${isActive ? " (activo, pulsar para quitar filtro)" : ""}`}
                  className="group flex w-full flex-col items-center gap-1.5 rounded-2xl p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:gap-2"
                >
                  <span
                    className={`relative aspect-square w-full overflow-hidden rounded-full border-2 bg-[#e8e8e8] shadow-sm transition ${
                      isActive
                        ? "border-clay ring-2 ring-clay/40 ring-offset-2 ring-offset-cream"
                        : "border-white/80 group-hover:border-rose/50"
                    }`}
                  >
                    {/* TODO: reemplazar por imagen real de la categoría */}
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 76px, 88px"
                      className="object-cover"
                    />
                  </span>
                  <span
                    className={`w-full max-w-[6.25rem] px-0.5 text-center text-[10px] font-medium leading-[1.15] sm:text-[11px] md:max-w-[6.5rem] md:text-xs ${
                      isActive ? "text-clay" : "text-ink/80"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="mt-2 px-1 text-center text-[11px] text-ink/55 sm:mt-3 sm:text-xs">
        {activeId
          ? "Toca de nuevo la misma categoría para ver todo el catálogo."
          : "Desliza en el móvil o elige una categoría para filtrar."}
      </p>
    </div>
  );
}
