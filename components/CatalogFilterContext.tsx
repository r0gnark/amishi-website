"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CatalogCategoryId } from "@/data/catalog-filters";

type CatalogFilterContextValue = {
  filter: CatalogCategoryId | null;
  setFilter: (id: CatalogCategoryId | null) => void;
};

const CatalogFilterContext = createContext<CatalogFilterContextValue | null>(null);

export function CatalogFilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilterState] = useState<CatalogCategoryId | null>(null);

  const setFilter = useCallback((id: CatalogCategoryId | null) => {
    setFilterState(id);
  }, []);

  const value = useMemo(
    () => ({ filter, setFilter }),
    [filter, setFilter],
  );

  return (
    <CatalogFilterContext.Provider value={value}>{children}</CatalogFilterContext.Provider>
  );
}

export function useCatalogFilter(): CatalogFilterContextValue {
  const ctx = useContext(CatalogFilterContext);
  if (!ctx) {
    throw new Error("useCatalogFilter debe usarse dentro de CatalogFilterProvider");
  }
  return ctx;
}
