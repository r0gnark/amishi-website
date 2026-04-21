import { LOGO_PATH } from "@/lib/site";

type BrandLogoProps = {
  /** Cabecera: compacto. Pie: más grande. */
  variant: "header" | "footer";
  /** Nombre del sitio para accesibilidad */
  siteName: string;
};

/**
 * Logo de marca: usamos <img> nativo (no next/image) para que el canal alpha
 * del PNG se respete siempre (evita cuadrados negros con el optimizador).
 */
export function BrandLogo({ variant, siteName }: BrandLogoProps) {
  const className =
    variant === "header"
      ? "h-11 w-11 object-contain md:h-14 md:w-14 bg-transparent"
      : "h-20 w-20 object-contain md:h-24 md:w-24 bg-transparent";

  return (
    // eslint-disable-next-line @next/next/no-img-element -- transparencia PNG fiable en todos los navegadores
    <img
      src={LOGO_PATH}
      alt={`${siteName} — vínculo creativo`}
      width={120}
      height={120}
      className={className}
      loading={variant === "header" ? "eager" : "lazy"}
      decoding="async"
      style={{ backgroundColor: "transparent" }}
    />
  );
}
