export const WHATSAPP_NUMBER = "56989913721";
export const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

type WhatsAppMessageOptions = {
  source: string;
  productName?: string;
  productUrl?: string;
  baseUrl?: string;
};

export function buildWhatsAppUrl({
  source,
  productName,
  productUrl,
  baseUrl = WHATSAPP_BASE_URL,
}: WhatsAppMessageOptions): string {
  const lines = [`Hola, vengo desde ${source}.`];

  if (productName) {
    lines.push(`Quisiera consultar por: ${productName}.`);
  }
  if (productUrl) {
    lines.push(`Producto: ${productUrl}`);
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set("text", lines.join("\n"));
    return url.toString();
  } catch {
    return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(lines.join("\n"))}`;
  }
}
