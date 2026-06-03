import { courseInputSchema } from "@/lib/validations/course";
import { describe, expect, it } from "vitest";

const baseInput = {
  title: "Curso de Teste",
  slug: "curso-de-teste",
  description: "Descrição suficientemente longa.",
  category: "seguranca" as const,
  priceCents: 9900,
  workloadHours: 8,
  examQuestionsCount: 10,
  examPassScore: 6,
  featured: false,
  published: false,
};

describe("courseInputSchema — certificate config fields", () => {
  it("accepts the input without any certificate fields (all optional)", () => {
    const result = courseInputSchema.safeParse(baseInput);
    expect(result.success).toBe(true);
  });

  it("accepts the new certificate config fields when provided", () => {
    const result = courseInputSchema.safeParse({
      ...baseInput,
      certificateCourseName: "NR 17",
      certificateValidity: "12 MESES",
      examScopeTitle: "CURSO DE NR 17",
      examScopeSubtitle: "ERGONOMIA",
      examScopeTopics: "Introdução\nErgonomia\nPostura",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.certificateCourseName).toBe("NR 17");
      expect(result.data.examScopeTopics).toContain("Ergonomia");
    }
  });

  it("trims certificate fields", () => {
    const result = courseInputSchema.safeParse({
      ...baseInput,
      certificateCourseName: "  NR 35  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.certificateCourseName).toBe("NR 35");
    }
  });

  it("rejects a certificate course name over the max length", () => {
    const result = courseInputSchema.safeParse({
      ...baseInput,
      certificateCourseName: "x".repeat(151),
    });
    expect(result.success).toBe(false);
  });

  it("rejects scope topics over the max length", () => {
    const result = courseInputSchema.safeParse({
      ...baseInput,
      examScopeTopics: "x".repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});
