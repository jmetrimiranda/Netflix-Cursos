import { validateCpf } from "@/lib/cpf";
import { z } from "zod";

export const enrollmentRecoverSchema = z.object({
  courseSlug: z.string().trim().min(1).max(120),
  studentEmail: z.string().trim().toLowerCase().email().max(254),
  studentCpf: z.string().refine(validateCpf, { message: "CPF inválido" }),
});

export type EnrollmentRecoverInput = z.infer<typeof enrollmentRecoverSchema>;
