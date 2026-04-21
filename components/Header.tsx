"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { catalogFilters, type CatalogCategoryId } from "@/data/catalog-filters";
import { BrandLogo } from "./BrandLogo";
import { useCatalogFilter } from "./CatalogFilterContext";

type HeaderProps = {
  siteName: string;
  instagramUrl: string;
};

function scrollToCatalogSmooth() {
  requestAnimationFrame(() => {
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  });
}

export function Header({ siteName, instagramUrl }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { setFilter } = useCatalogFilter();

  const goToCatalogWithFilter = useCallback(
    (id: CatalogCategoryId | null) => {
      setFilter(id);
      setOpen(false);
      if (pathname === "/") {
        scrollToCatalogSmooth();
      } else {
        router.push("/#catalogo");
      }
    },
    [pathname, router, setFilter],
  );

  return (
    <header className="sticky top-0 z-50 border-b border-rose/20 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:py-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 outline-none ring-rose ring-offset-2 ring-offset-cream transition-opacity hover:opacity-90 focus-visible:rounded-full focus-visible:ring-2"
        >
          <BrandLogo variant="header" siteName={siteName} />
          <span className="sr-only">{siteName}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Principal">
          <Link
            href="/"
            className="text-sm font-medium text-ink/90 transition hover:text-clay"
          >
            Catálogo
          </Link>
          <Link
            href="/#sobre"
            className="text-sm font-medium text-ink/90 transition hover:text-clay"
          >
            Sobre
          </Link>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-ink/90 transition hover:text-clay"
          >
            Contacto
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full p-2 text-ink transition hover:bg-blush/60"
            aria-label="Instagram de Amishi"
          >
            <InstagramIcon className="h-6 w-6" aria-hidden />
          </a>

          <button
            type="button"
            className="rounded-lg p-2 text-ink md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
          >
            {open ? (
              <CloseIcon className="h-6 w-6" />
            ) : (
              <MenuIcon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="menu-movil"
          className="max-h-[min(70vh,calc(100dvh-5rem))] overflow-y-auto border-t border-rose/20 bg-cream px-4 py-4 md:hidden"
          aria-label="Móvil"
        >
          <ul className="flex flex-col gap-1">
            <li>
              <button
                type="button"
                onClick={() => goToCatalogWithFilter(null)}
                className="w-full rounded-lg px-2 py-2.5 text-left text-base font-medium text-ink hover:bg-blush/50"
              >
                Todo el catálogo
              </button>
            </li>
          </ul>

          <p className="mt-3 px-2 text-xs font-semibold uppercase tracking-wide text-ink/50">
            Categorías
          </p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {catalogFilters.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => goToCatalogWithFilter(item.id)}
                  className="w-full rounded-lg px-2 py-2.5 text-left text-base font-medium text-ink hover:bg-blush/50"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="my-3 border-t border-rose/20" />

          <ul className="flex flex-col gap-1">
            <li>
              <Link
                href="/#sobre"
                className="block rounded-lg px-2 py-2.5 text-base font-medium text-ink hover:bg-blush/50"
                onClick={() => setOpen(false)}
              >
                Sobre
              </Link>
            </li>
            <li>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg px-2 py-2.5 text-base font-medium text-ink hover:bg-blush/50"
                onClick={() => setOpen(false)}
              >
                Contacto
              </a>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}
