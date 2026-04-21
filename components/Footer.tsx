import Link from "next/link";

type FooterProps = {
  siteName: string;
  instagramUrl: string;
};

export function Footer({ siteName, instagramUrl }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-rose/25 bg-blush/40">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div>
            <p className="font-display text-2xl font-semibold text-ink">{siteName}</p>
            <p className="mt-2 max-w-sm text-sm text-ink/80">
              Diseño, gatos y cerámica hecha con cariño en Chile. Consultas y pedidos por
              Instagram.
            </p>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-sm font-medium text-clay underline-offset-4 hover:underline"
            >
              @amishi.cl en Instagram
            </a>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:gap-16">
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
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/70">
                Legal
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-ink/80">
                <li>
                  <span className="cursor-default">Política de privacidad (próximamente)</span>
                </li>
                <li>
                  <span className="cursor-default">Términos y envíos (próximamente)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-10 border-t border-rose/20 pt-8 text-center text-xs text-ink/60">
          © {year} {siteName}. Hecho con amor y barro.
        </p>
      </div>
    </footer>
  );
}
