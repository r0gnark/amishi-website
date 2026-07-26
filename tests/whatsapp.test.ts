import { describe, expect, it } from "vitest";
import {
  buildWhatsAppUrl,
  whatsappBaseUrlFromNumber,
  whatsappNumberFromUrl,
} from "../lib/whatsapp";

describe("WhatsApp contact helpers", () => {
  it("normalizes a formatted international number", () => {
    expect(whatsappBaseUrlFromNumber("+56 9 8991-3721")).toBe(
      "https://wa.me/56989913721",
    );
  });

  it("rejects an invalid number", () => {
    expect(whatsappBaseUrlFromNumber("123")).toBeNull();
  });

  it("extracts the editable number from a WhatsApp URL", () => {
    expect(whatsappNumberFromUrl("https://wa.me/56989913721")).toBe(
      "+56989913721",
    );
  });

  it("uses the administered base URL and identifies the source", () => {
    const url = new URL(
      buildWhatsAppUrl({
        source: "la ficha de producto",
        productName: "Mishi frasco",
        baseUrl: "https://wa.me/56911112222",
      }),
    );

    expect(url.pathname).toBe("/56911112222");
    expect(url.searchParams.get("text")).toContain("la ficha de producto");
    expect(url.searchParams.get("text")).toContain("Mishi frasco");
  });
});
