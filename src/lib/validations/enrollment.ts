import { z } from "zod";

export const enrollmentInputSchema = z.object({
  courseId: z.string().min(1, "courseId obrigatório"),
  studentEmail: z.string().trim().toLowerCase().email("Email inválido").max(254),
});

export type EnrollmentInput = z.infer<typeof enrollmentInputSchema>;
