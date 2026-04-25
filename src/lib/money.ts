const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCentsToBRL(cents: number): string {
  return BRL.format(cents / 100);
}

export function parseBRLToCents(input: string): number {
  if (typeof input !== "string") return Number.NaN;
  const cleaned = input
    .replace(/\s/g, "")
    .replace(/^R\$/, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  if (cleaned === "") return Number.NaN;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return Number.NaN;
  return Math.round(value * 100);
}
