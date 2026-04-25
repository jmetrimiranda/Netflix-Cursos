"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { type QuestionInput, questionInputSchema } from "@/lib/validations/question";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionResult = { success: true } | { error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

export async function createQuestionAction(
  courseId: string,
  payload: QuestionInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = questionInputSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  await db.question.create({
    data: {
      courseId,
      statement: parsed.data.statement,
      active: parsed.data.active,
      options: parsed.data.options,
    },
  });
  revalidatePath(`/admin/cursos/${courseId}/questoes`);
  return { success: true };
}

export async function updateQuestionAction(
  questionId: string,
  payload: QuestionInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = questionInputSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const updated = await db.question.update({
    where: { id: questionId },
    data: {
      statement: parsed.data.statement,
      active: parsed.data.active,
      options: parsed.data.options,
    },
    select: { courseId: true },
  });
  revalidatePath(`/admin/cursos/${updated.courseId}/questoes`);
  return { success: true };
}

export async function toggleQuestionActiveAction(
  questionId: string,
  active: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  const updated = await db.question.update({
    where: { id: questionId },
    data: { active },
    select: { courseId: true },
  });
  revalidatePath(`/admin/cursos/${updated.courseId}/questoes`);
  return { success: true };
}

export async function deleteQuestionAction(questionId: string): Promise<ActionResult> {
  await requireAdmin();
  const deleted = await db.question.delete({
    where: { id: questionId },
    select: { courseId: true },
  });
  revalidatePath(`/admin/cursos/${deleted.courseId}/questoes`);
  return { success: true };
}
