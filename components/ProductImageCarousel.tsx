"use client";

import Image from "next/image";
import { useState } from "react";
import type { CatalogCategoryId } from "@/data/catalog-filters";
import { PRODUCT_PHOTO_ASPECT_CLASS, productImageClassName } from "@/lib/product-image";

type ProductImageCarouselProps = {
  images: string[];
  productName: string;
  category: CatalogCategoryId;
  productId: string;
};

export function ProductImageCarousel({
  images,
  productName,
  category,
  productId,
}: ProductImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const n = images.length;
  const safeIndex = n ? Math.min(index, n - 1) : 0;
  const src = n ? images[safeIndex] : "";

  const goPrev = () => setIndex((i) => (i <= 0 ? n - 1 : i - 1));
  const goNext = () => setIndex((i) => (i >= n - 1 ? 0 : i + 1));

  const imageClass = productImageClassName(category, { productId });
  const altBase = `Fotografía del producto ${productName}`;

  if (n === 0) {
    return null;
  }

  if (n === 1) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-[2rem] border border-rose/15 bg-white shadow-sm ${PRODUCT_PHOTO_ASPECT_CLASS}`}
      >
        <Image
          src={src}
          alt={altBase}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={imageClass}
          priority
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[2rem] border border-rose/15 bg-white shadow-sm ${PRODUCT_PHOTO_ASPECT_CLASS}`}
    >
      <Image
        key={src}
        src={src}
        alt={`${altBase} (foto ${safeIndex + 1} de ${n})`}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className={imageClass}
        priority={safeIndex === 0}
      />

      <div className="absolute inset-0 flex items-center justify-between p-2 pointer-events-none">
        <button
          type="button"
          onClick={goPrev}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-rose/20 bg-white/90 text-ink shadow-sm backdrop-blur-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose"
          aria-label="Foto anterior"
        >
          <span className="text-lg" aria-hidden>
            ←
          </span>
        </button>
        <button
          type="button"
          onClick={goNext}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-rose/20 bg-white/90 text-ink shadow-sm backdrop-blur-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose"
          aria-label="Foto siguiente"
        >
          <span className="text-lg" aria-hidden>
            →
          </span>
        </button>
      </div>

      <p
        className="absolute bottom-3 left-0 right-0 text-center text-xs font-medium text-ink/80 drop-shadow-sm"
        aria-live="polite"
      >
        {safeIndex + 1} / {n}
      </p>
    </div>
  );
}
