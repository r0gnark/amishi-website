export const WHATSAPP_NUMBER = "56989913721";
export const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export function whatsappBaseUrlFromNumber(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length < 8 || digits.length > 15) return null;
  return `https://wa.me/${digits}`;
}

export function whatsappNumberFromUrl(url: string): string {
  const match = url.match(/wa\.me\/(\d{8,15})/);
  return match ? `+${match[1]}` : `+${WHATSAPP_NUMBER}`;
}

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
