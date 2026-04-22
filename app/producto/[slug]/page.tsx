import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProductSlugs, getProductBySlug } from "@/data/products";
import { formatCLP } from "@/lib/format";
import { PRODUCT_PHOTO_ASPECT_CLASS, productImageClassName } from "@/lib/product-image";

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
    <div className="border-b border-rose/10 bg-white">
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
          <div
            className={`relative w-full overflow-hidden rounded-[2rem] border border-rose/15 bg-white shadow-sm ${PRODUCT_PHOTO_ASPECT_CLASS}`}
          >
            <Image
              src={product.image}
              alt={`Fotografía del producto ${product.name}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={productImageClassName(product.category, { productId: product.id })}
              priority
            />
          </div>

          <div className="flex flex-col">
            <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">
              {product.name}
            </h1>
            <p className="mt-4 font-display text-2xl font-semibold text-rose">{formatCLP(product.price)}</p>
            <p className="mt-6 leading-relaxed text-ink/90">{product.description}</p>

            <a
              href={product.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex w-full max-w-sm items-center justify-center rounded-full bg-rose px-6 py-3.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-rose/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose"
            >
              Consultar disponibilidad y envío
            </a>

            <p className="mt-4 text-sm text-ink/65">
              Precio de referencia. Al pulsar el botón se abre Instagram de Amishi para confirmar stock y envío.
            </p>

            <Link
              href="/#catalogo"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-clay hover:underline"
            >
              ← Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
