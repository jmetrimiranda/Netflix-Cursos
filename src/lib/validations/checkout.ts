import { validateCpf } from "@/lib/cpf";
import { z } from "zod";

export const checkoutCreateSchema = z.object({
  courseId: z.string().min(1),
  studentEmail: z.string().trim().toLowerCase().email().max(254),
  studentName: z.string().trim().min(5).max(120),
  studentCpf: z.string().refine(validateCpf, { message: "CPF inválido" }),
  lgpdConsent: z.literal(true, { message: "Consentimento LGPD obrigatório" }),
});

export type CheckoutCreateInput = z.infer<typeof checkoutCreateSchema>;
