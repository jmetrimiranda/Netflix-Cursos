import { slugify } from "@/lib/slug";
import { z } from "zod";

export const COURSE_CATEGORIES = ["civil", "mecanica", "seguranca"] as const;
export const COURSE_CATEGORY_LABELS: Record<(typeof COURSE_CATEGORIES)[number], string> = {
  civil: "Engenharia Civil",
  mecanica: "Engenharia Mecânica",
  seguranca: "Segurança do Trabalho",
};

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const courseInputSchema = z.object({
  title: z.string().trim().min(3, "Título precisa de pelo menos 3 caracteres").max(150),
  slug: z
    .string()
    .trim()
    .min(3, "Slug precisa de pelo menos 3 caracteres")
    .max(150)
    .regex(slugRegex, "Slug deve conter apenas letras minúsculas, números e hífens"),
  description: z.string().trim().min(10, "Descrição muito curta").max(5000),
  category: z.enum(COURSE_CATEGORIES),
  priceCents: z.number().int("Preço inválido").min(0, "Preço inválido").max(9_999_999),
  workloadHours: z.number().int("Carga horária inteira").min(1).max(10_000),
  examQuestionsCount: z.number().int().min(1).max(200),
  examPassScore: z.number().min(0).max(10),
  thumbnailUrl: z.string().url().max(500).optional(),
  featured: z.boolean(),
  published: z.boolean(),
});

export type CourseInput = z.infer<typeof courseInputSchema>;

export function ensureSlug(input: string): string {
  return slugify(input);
}
