import { z } from "zod";

export const progressInputSchema = z.object({
  enrollmentId: z.string().min(1, "enrollmentId obrigatório"),
  lessonId: z.string().min(1, "lessonId obrigatório"),
  progressPct: z.number().int().min(0).max(100),
});

export type ProgressInput = z.infer<typeof progressInputSchema>;
