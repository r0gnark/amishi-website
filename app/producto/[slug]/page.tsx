import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProductSlugs, getProductBySlug } from "@/data/products";
import { formatCLP } from "@/lib/format";
import { SITE } from "@/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) {
    return { title: "Producto no encontrado" };
  }
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} · Amishi`,
      description: product.description.slice(0, 200),
      type: "website",
    },
  };
}

export default async function ProductoPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  return (
    <div className="border-b border-rose/15 bg-gradient-to-b from-cream to-blush/15">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <nav className="text-sm text-ink/70" aria-label="Migas de pan">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="font-medium text-clay hover:underline">
                Catálogo
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-ink">{product.name}</li>
          </ol>
        </nav>

        <div className="mt-8 grid gap-10 md:grid-cols-2 md:items-start">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-rose/25 bg-blush/30 shadow-sm">
            {/* TODO: reemplazar por imagen real en /public cuando esté disponible */}
            <Image
              src={product.image}
              alt={`Fotografía del producto ${product.name}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>

          <div className="flex flex-col">
            <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">
              {product.name}
            </h1>
            <p className="mt-4 text-2xl font-semibold text-clay">{formatCLP(product.price)}</p>
            <p className="mt-6 leading-relaxed text-ink/90">{product.description}</p>

            <a
              href={product.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-full bg-clay px-6 text-sm font-semibold text-white transition hover:bg-clay/90 sm:w-auto"
            >
              Consultar en Instagram
            </a>

            <p className="mt-6 text-sm text-ink/65">
              Precio de referencia. Disponibilidad y envíos se confirman por {SITE.name} en redes.
            </p>

            <Link
              href="/#catalogo"
              className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-clay hover:underline"
            >
              ← Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
