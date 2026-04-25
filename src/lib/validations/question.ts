import { z } from "zod";

export const QUESTION_OPTION_COUNT = 4;

export const questionOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(1, "Texto da opção obrigatório").max(500),
  isCorrect: z.boolean(),
});

export const questionInputSchema = z
  .object({
    statement: z.string().trim().min(5, "Enunciado muito curto").max(2000),
    active: z.coerce.boolean().optional().default(true),
    options: z.array(questionOptionSchema).length(QUESTION_OPTION_COUNT, "Devem ser 4 opções"),
  })
  .refine((q) => q.options.filter((o) => o.isCorrect).length === 1, {
    message: "Marque exatamente uma opção correta",
    path: ["options"],
  });

export type QuestionInput = z.infer<typeof questionInputSchema>;
export type QuestionOption = z.infer<typeof questionOptionSchema>;
