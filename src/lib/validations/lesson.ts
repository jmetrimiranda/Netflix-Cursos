import { z } from "zod";

export const lessonInputSchema = z.object({
  title: z.string().trim().min(2, "Título obrigatório").max(200),
  // Aceita URL ou ID YouTube. Validação do conteúdo via extractYoutubeId no
  // handler (ADR-016); aqui só limitamos tamanho e normalizamos vazio.
  videoSource: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  sidebarContentJson: z.string().optional().default(""),
  sidebarPdfUrl: z
    .string()
    .url()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type LessonInput = z.infer<typeof lessonInputSchema>;
