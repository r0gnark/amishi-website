"use client";

import { useCallback, useState } from "react";

type ProductInstagramCtaProps = {
  /** URL absoluta de la ficha (cuerpo del DM: solo el enlace). */
  productPageUrl: string;
  instagramUrl: string;
};

function buildDmBody(productPageUrl: string) {
  return productPageUrl;
}

/** Añade `?text=` / `&text=` para prellenar el compositor de Instagram (cuando la app lo respeta). */
function instagramUrlWithPrefilledText(baseUrl: string, message: string): string {
  try {
    const u = new URL(baseUrl);
    u.searchParams.set("text", message);
    return u.toString();
  } catch {
    const sep = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${sep}text=${encodeURIComponent(message)}`;
  }
}

export function ProductInstagramCta({ productPageUrl, instagramUrl }: ProductInstagramCtaProps) {
  const [feedback, setFeedback] = useState<"idle" | "ok" | "error">("idle");

  const handleClick = useCallback(() => {
    const body = buildDmBody(productPageUrl);
    const dmUrl = instagramUrlWithPrefilledText(instagramUrl, body);
    window.open(dmUrl, "_blank", "noopener,noreferrer");

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(body).then(
        () => {
          setFeedback("ok");
          setTimeout(() => setFeedback("idle"), 5000);
        },
        () => {
          setFeedback("error");
          setTimeout(() => setFeedback("idle"), 5000);
        },
      );
    } else {
      setFeedback("ok");
      setTimeout(() => setFeedback("idle"), 5000);
    }
  }, [productPageUrl, instagramUrl]);

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
        {feedback === "ok"
          ? "Listo. En el chat debería aparecer solo el enlace de esta ficha. Si no, pégalo con Ctrl+V (o mantén pulsado → pegar): también quedó copiado."
          : null}
        {feedback === "error"
          ? "No pudimos copiar el respaldo. Copia la URL de esta página y pégala en el mensaje."
          : null}
      </p>
    </div>
  );
}
