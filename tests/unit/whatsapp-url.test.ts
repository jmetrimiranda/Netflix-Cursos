import { buildWhatsAppUrl, contact } from "@/content/contact";
import { describe, expect, it } from "vitest";

describe("buildWhatsAppUrl", () => {
  it("uses the default message when no argument is passed", () => {
    const url = buildWhatsAppUrl();
    expect(url.startsWith(`https://wa.me/${contact.whatsappRaw}?text=`)).toBe(true);
    const decoded = decodeURIComponent(url.split("text=")[1] ?? "");
    expect(decoded).toBe(contact.whatsappMessage);
  });

  it("uses the provided custom message when given", () => {
    const custom = "Quero um orçamento de PMOC para 3 unidades";
    const url = buildWhatsAppUrl(custom);
    const decoded = decodeURIComponent(url.split("text=")[1] ?? "");
    expect(decoded).toBe(custom);
  });

  it("URL-encodes special characters that wa.me requires", () => {
    const message = "Pergunta com & + espaços + acentuação não";
    const url = buildWhatsAppUrl(message);
    const queryPart = url.split("text=")[1] ?? "";

    // Special characters must be percent-encoded, not appear literal
    expect(queryPart).not.toContain(" ");
    expect(queryPart).not.toContain("&");
    expect(queryPart).not.toContain("+");

    // Round-trip must reproduce the original
    expect(decodeURIComponent(queryPart)).toBe(message);
  });
});
