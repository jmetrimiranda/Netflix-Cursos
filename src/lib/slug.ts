const DIACRITICS = /\p{Diacritic}/gu;

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

type SlugTaken = (slug: string) => Promise<boolean> | boolean;

export async function makeUniqueSlug(base: string, isTaken: SlugTaken): Promise<string> {
  const root = slugify(base) || "curso";
  let candidate = root;
  let suffix = 2;
  while (await isTaken(candidate)) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}
