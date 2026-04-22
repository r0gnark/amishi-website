"use client";

import { useCallback, useState } from "react";

type ProductInstagramCtaProps = {
  productName: string;
  /** URL absoluta de la ficha (para identificar el producto al pegar en el DM). */
  productPageUrl: string;
  instagramUrl: string;
};

function buildDmMessage(productName: string, productPageUrl: string) {
  return `Hola 🙂 Consulto por: ${productName}\n${productPageUrl}`;
}

export function ProductInstagramCta({
  productName,
  productPageUrl,
  instagramUrl,
}: ProductInstagramCtaProps) {
  const [feedback, setFeedback] = useState<"idle" | "copied" | "error">("idle");

  const handleClick = useCallback(() => {
    const text = buildDmMessage(productName, productPageUrl);
    window.open(instagramUrl, "_blank", "noopener,noreferrer");

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => {
          setFeedback("copied");
          setTimeout(() => setFeedback("idle"), 5000);
        },
        () => {
          setFeedback("error");
          setTimeout(() => setFeedback("idle"), 5000);
        },
      );
    } else {
      setFeedback("error");
      setTimeout(() => setFeedback("idle"), 5000);
    }
  }, [productName, productPageUrl, instagramUrl]);

  return (
    <div className="mt-8 max-w-sm">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex w-full items-center justify-center rounded-full bg-rose px-6 py-3.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-rose/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose"
      >
        Consultar disponibilidad y envío
      </button>

      <p
        className="mt-2 min-h-[1.25rem] text-sm font-medium text-clay"
        role="status"
        aria-live="polite"
      >
        {feedback === "copied" ? "¡Listo! Mensaje copiado. Pégalo en el chat de Instagram." : null}
        {feedback === "error"
          ? "No pudimos copiar el texto. Indica el nombre del producto en el mensaje o vuelve a intentar."
          : null}
      </p>
    </div>
  );
}
