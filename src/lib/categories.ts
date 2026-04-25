import type { CourseCategory } from "@prisma/client";

export const CATEGORY_LABELS: Record<CourseCategory, string> = {
  civil: "Engenharia Civil",
  mecanica: "Engenharia Mecânica",
  seguranca: "Segurança do Trabalho",
};

export const CATEGORY_ORDER: CourseCategory[] = ["civil", "mecanica", "seguranca"];

export function categoryLabel(category: CourseCategory): string {
  return CATEGORY_LABELS[category];
}
