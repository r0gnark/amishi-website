"use client";

import Link from "next/link";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { BrandLogo } from "./BrandLogo";
import { useSiteContent } from "./SiteContentContext";

export function Footer() {
  const {
    siteName,
    contactLabel,
    contactUrl,
    instagramHandle,
    instagramProfileUrl,
    footerText,
  } = useSiteContent();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-rose/15 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div>
            <BrandLogo variant="footer" siteName={siteName} />
            <p className="mt-2 max-w-sm text-sm text-ink/80">
              {footerText}
            </p>
            <a
              href={instagramProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-sm font-medium text-clay underline-offset-4 hover:underline"
            >
              {instagramHandle} en Instagram
            </a>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/70">
              Navegación
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/" className="text-ink hover:text-clay">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/#sobre" className="text-ink hover:text-clay">
                  Sobre Amishi
                </Link>
              </li>
              <li>
                <a
                  href={buildWhatsAppUrl({
                    source: "el pie de página del sitio Amishi",
                    baseUrl: contactUrl,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink hover:text-clay"
                >
                  {contactLabel}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-rose/20 pt-8 text-center text-xs text-ink/60">
          © {year} {siteName}. Hecho con amor.
        </p>
      </div>
    </footer>
  );
}
