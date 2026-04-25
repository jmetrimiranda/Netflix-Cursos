import { makeUniqueSlug, slugify } from "@/lib/slug";
import { describe, expect, it } from "vitest";

describe("slugify", () => {
  it("normalizes ASCII text", () => {
    expect(slugify("Engenharia Civil")).toBe("engenharia-civil");
  });

  it("strips diacritics", () => {
    expect(slugify("Construção e Manutenção")).toBe("construcao-e-manutencao");
  });

  it("collapses whitespace and special chars", () => {
    expect(slugify("  Hello,   World!!! ")).toBe("hello-world");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("---hello---")).toBe("hello");
  });

  it("returns empty string for input without alphanumerics", () => {
    expect(slugify("###")).toBe("");
  });
});

describe("makeUniqueSlug", () => {
  it("returns the base slug when no conflict", async () => {
    const taken = new Set<string>();
    const result = await makeUniqueSlug("Engenharia Civil", (s) => taken.has(s));
    expect(result).toBe("engenharia-civil");
  });

  it("appends -2 then -3 when slugs are taken", async () => {
    const taken = new Set(["engenharia-civil", "engenharia-civil-2"]);
    const result = await makeUniqueSlug("Engenharia Civil", (s) => taken.has(s));
    expect(result).toBe("engenharia-civil-3");
  });

  it("falls back to 'curso' when input has no alphanumerics", async () => {
    const result = await makeUniqueSlug("###", () => false);
    expect(result).toBe("curso");
  });
});
