import { LOGO_PATH } from "@/lib/site";

type BrandLogoProps = {
  /** Cabecera: compacto. Pie: más grande. Sobre: tarjeta destacada. */
  variant: "header" | "footer" | "about";
  /** Nombre del sitio para accesibilidad */
  siteName: string;
  /** Si se indica, sustituye el alt por defecto (útil fuera de enlaces). */
  alt?: string;
};

/**
 * Logo de marca: usamos <img> nativo (no next/image) para que el canal alpha
 * del PNG se respete siempre (evita cuadrados negros con el optimizador).
 */
export function BrandLogo({ variant, siteName, alt }: BrandLogoProps) {
  const className =
    variant === "header"
      ? "h-11 w-11 object-contain md:h-14 md:w-14 bg-transparent"
      : variant === "footer"
        ? "h-20 w-20 object-contain md:h-24 md:w-24 bg-transparent"
        : "h-44 w-44 object-contain sm:h-52 sm:w-52 md:h-56 md:w-56 bg-transparent";

  return (
    // eslint-disable-next-line @next/next/no-img-element -- transparencia PNG fiable en todos los navegadores
    <img
      src={LOGO_PATH}
      alt={alt ?? `${siteName} — vínculo creativo`}
      width={120}
      height={120}
      className={className}
      loading={variant === "header" || variant === "about" ? "eager" : "lazy"}
      decoding="async"
      style={{ backgroundColor: "transparent" }}
    />
  );
}
