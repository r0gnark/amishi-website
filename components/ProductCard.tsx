import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import { formatCLP } from "@/lib/format";
import { PRODUCT_PHOTO_ASPECT_CLASS, productImageClassName } from "@/lib/product-image";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const detailHref = `/producto/${product.id}`;

  return (
    <article className="group flex flex-col">
      <Link
        href={detailHref}
        className={`relative block w-full overflow-hidden rounded-[2rem] bg-white ${PRODUCT_PHOTO_ASPECT_CLASS} outline-none ring-rose ring-offset-2 ring-offset-white transition-shadow hover:shadow-md focus-visible:ring-2`}
      >
        <Image
          src={product.image}
          alt={`Fotografía del producto ${product.name}`}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className={productImageClassName(product.category, {
            withCardHover: true,
            productId: product.id,
          })}
        />
      </Link>
      <div className="px-1 pt-4 text-center">
        <h3 className="font-display text-lg font-semibold leading-snug text-ink">
          <Link
            href={detailHref}
            className="hover:text-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 font-display text-base font-medium text-rose">{formatCLP(product.price)}</p>
      </div>
    </article>
  );
}
