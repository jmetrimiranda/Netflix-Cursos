import { z } from "zod";

export const lessonInputSchema = z.object({
  title: z.string().trim().min(2, "Título obrigatório").max(200),
  bunnyVideoId: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  bunnyLibraryId: z
    .string()
    .trim()
    .max(100)
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
