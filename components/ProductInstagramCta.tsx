"use client";

import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useSiteContent } from "./SiteContentContext";

type ProductInstagramCtaProps = {
  productName: string;
  productPageUrl: string;
};

export function ProductInstagramCta({
  productName,
  productPageUrl,
}: ProductInstagramCtaProps) {
  const { contactUrl } = useSiteContent();

  return (
    <div className="mt-8 max-w-sm">
      <a
        href={buildWhatsAppUrl({
          source: "la ficha de producto del sitio Amishi",
          productName,
          productUrl: productPageUrl,
          baseUrl: contactUrl,
        })}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center rounded-full bg-rose px-6 py-3.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-rose/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose"
      >
        Consultar por WhatsApp
      </a>
    </div>
  );
}
