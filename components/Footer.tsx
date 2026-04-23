import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

type FooterProps = {
  siteName: string;
  instagramUrl: string;
  instagramProfileUrl: string;
};

export function Footer({ siteName, instagramUrl, instagramProfileUrl }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-rose/15 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div>
            <BrandLogo variant="footer" siteName={siteName} />
            <p className="mt-2 max-w-sm text-sm text-ink/80">
              Diseño, gatos y cerámica hecha con cariño en Chile. Consultas y pedidos por
              Instagram.
            </p>
            <a
              href={instagramProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-sm font-medium text-clay underline-offset-4 hover:underline"
            >
              @amishi.cl en Instagram
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
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink hover:text-clay"
                >
                  Contacto
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
