"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { catalogFilters, type CatalogFilterItem } from "@/data/catalog-filters";

const CategoryContext = createContext<CatalogFilterItem[]>(catalogFilters);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState(catalogFilters);

  useEffect(() => {
    let cancelled = false;
    function loadCategories() {
      fetch("/api/categorias")
        .then((response) => response.json())
        .then((data) => {
          if (!cancelled && Array.isArray(data)) setCategories(data);
        })
        .catch(() => undefined);
    }
    loadCategories();
    window.addEventListener("amishi-categories-changed", loadCategories);
    return () => {
      cancelled = true;
      window.removeEventListener("amishi-categories-changed", loadCategories);
    };
  }, []);

  return (
    <CategoryContext.Provider value={categories}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoryContext);
}
