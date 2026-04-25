import { z } from "zod";

export const moduleInputSchema = z.object({
  title: z.string().trim().min(2, "Título obrigatório").max(150),
});

export type ModuleInput = z.infer<typeof moduleInputSchema>;
