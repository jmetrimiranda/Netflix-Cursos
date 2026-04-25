export const contact = {
  whatsappRaw: "5527998183686",
  whatsappDisplay: "27 99818-3686",
  email: "ativaengmec@gmail.com",
  instagram: "@ativaeng",
  instagramUrl: "https://instagram.com/ativaeng",
  website: "www.ativaengenharia.net",
  websiteUrl: "https://www.ativaengenharia.net",
  whatsappMessage: "Olá! Vim pelo site da Ativa Engenharia e gostaria de mais informações.",
} as const;

export function buildWhatsAppUrl(message?: string): string {
  const text = encodeURIComponent(message ?? contact.whatsappMessage);
  return `https://wa.me/${contact.whatsappRaw}?text=${text}`;
}
