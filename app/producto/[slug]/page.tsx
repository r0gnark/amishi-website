import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { ProductInstagramCta } from "@/components/ProductInstagramCta";
import { formatCLP } from "@/lib/format";
import type { Product } from "@/data/products";
import { getProductImages } from "@/data/products";

type Props = {
  params: Promise<{ slug: string }>;
};

async function fetchProduct(slug: string): Promise<Product | null> {
  const apiUrl = process.env.API_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${apiUrl}/api/productos/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    const p = await res.json();
    return { ...p, instagramUrl: p.instagramUrl ?? p.instagram_url ?? "" };
  } catch {
    return null;
  }
}

async function fetchAllSlugs(): Promise<string[]> {
  const apiUrl = process.env.API_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${apiUrl}/api/productos`, { cache: "no-store" });
    const data: Product[] = await res.json();
    return data.map((p) => p.id);
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  const slugs = await fetchAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) return { title: "Producto no encontrado" };
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
  const product = await fetchProduct(slug);
  if (!product) notFound();

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://amishi.cl").replace(/\/$/, "");
  const productPageUrl = `${siteUrl}/producto/${slug}`;

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
          <ProductImageCarousel
            images={getProductImages(product)}
            productName={product.name}
            category={product.category}
            productId={product.id}
          />

          <div className="flex flex-col">
            <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">
              {product.name}
            </h1>
            <p className="mt-4 font-display text-2xl font-semibold text-rose">{formatCLP(product.price)}</p>
            <p className="mt-6 whitespace-pre-line leading-relaxed text-ink/90">
              {product.description}
            </p>

            <ProductInstagramCta
              productName={product.name}
              productPageUrl={productPageUrl}
            />

            <p className="mt-6 text-sm text-ink/65">
              Precio de referencia. Stock y envío se confirman por WhatsApp.
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
