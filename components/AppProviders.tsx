"use client";

import type { ReactNode } from "react";
import { CatalogFilterProvider } from "./CatalogFilterContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return <CatalogFilterProvider>{children}</CatalogFilterProvider>;
}
