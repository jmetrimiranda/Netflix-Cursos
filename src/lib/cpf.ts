export function stripCpfMask(raw: string): string {
  return (raw ?? "").replace(/\D/g, "");
}

export function maskCpf(raw: string): string {
  const digits = stripCpfMask(raw).slice(0, 11);
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 9),
    digits.slice(9, 11),
  ].filter((p) => p.length > 0);
  if (parts.length <= 1) return parts.join("");
  if (parts.length === 2) return `${parts[0]}.${parts[1]}`;
  if (parts.length === 3) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  return `${parts[0]}.${parts[1]}.${parts[2]}-${parts[3]}`;
}

export function validateCpf(raw: string): boolean {
  const digits = stripCpfMask(raw);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const compute = (slice: string, factor: number): number => {
    let sum = 0;
    for (let i = 0; i < slice.length; i++) {
      sum += Number(slice[i]) * (factor - i);
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  const dv1 = compute(digits.slice(0, 9), 10);
  if (dv1 !== Number(digits[9])) return false;
  const dv2 = compute(digits.slice(0, 10), 11);
  if (dv2 !== Number(digits[10])) return false;
  return true;
}
