"use client";

import type { ReactNode } from "react";
import { CatalogFilterProvider } from "./CatalogFilterContext";
import { CategoryProvider } from "./CategoryContext";
import { SiteContentProvider } from "./SiteContentContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SiteContentProvider>
      <CategoryProvider>
        <CatalogFilterProvider>{children}</CatalogFilterProvider>
      </CategoryProvider>
    </SiteContentProvider>
  );
}
