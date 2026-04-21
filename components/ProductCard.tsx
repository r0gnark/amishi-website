import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import { formatCLP } from "@/lib/format";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const detailHref = `/producto/${product.id}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-rose/20 bg-white shadow-sm transition hover:shadow-md">
      <Link href={detailHref} className="relative block aspect-square w-full overflow-hidden bg-blush/30 outline-none ring-rose ring-offset-2 ring-offset-cream focus-visible:ring-2">
        {/* TODO: reemplazar por imagen real en /public cuando esté disponible */}
        <Image
          src={product.image}
          alt={`Fotografía del producto ${product.name}`}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-semibold text-ink">
          <Link
            href={detailHref}
            className="hover:text-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm font-medium text-clay">{formatCLP(product.price)}</p>
        <div className="mt-4 flex flex-1 flex-col justify-end gap-2">
          <Link
            href={detailHref}
            className="inline-flex w-full items-center justify-center rounded-full border border-rose/50 bg-white py-2.5 text-sm font-semibold text-ink transition hover:bg-blush/40"
          >
            Ver detalle
          </Link>
          <a
            href={product.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-full bg-clay py-2.5 text-sm font-semibold text-white transition hover:bg-clay/90"
          >
            Consultar
          </a>
        </div>
      </div>
    </article>
  );
}
