"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lessonInputSchema } from "@/lib/validations/lesson";
import { moduleInputSchema } from "@/lib/validations/module";
import { extractYoutubeId } from "@/lib/youtube";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export type ActionResult = { success: true } | { error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

const idSchema = z.string().min(1).max(100);

export async function createModuleAction(courseId: string, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = moduleInputSchema.safeParse({
    title: typeof fd.get("title") === "string" ? fd.get("title") : "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const last = await db.module.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  await db.module.create({
    data: { courseId, title: parsed.data.title, order: (last?.order ?? -1) + 1 },
  });
  revalidatePath(`/admin/cursos/${courseId}`);
  return { success: true };
}

export async function renameModuleAction(moduleId: string, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = moduleInputSchema.safeParse({
    title: typeof fd.get("title") === "string" ? fd.get("title") : "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const updated = await db.module.update({
    where: { id: moduleId },
    data: { title: parsed.data.title },
    select: { courseId: true },
  });
  revalidatePath(`/admin/cursos/${updated.courseId}`);
  return { success: true };
}

export async function deleteModuleAction(moduleId: string): Promise<ActionResult> {
  await requireAdmin();
  const deleted = await db.module.delete({
    where: { id: moduleId },
    select: { courseId: true },
  });
  revalidatePath(`/admin/cursos/${deleted.courseId}`);
  return { success: true };
}

const reorderSchema = z.array(z.object({ id: idSchema, order: z.number().int().min(0) }));

export async function reorderModulesAction(
  courseId: string,
  ordered: { id: string; order: number }[],
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = reorderSchema.safeParse(ordered);
  if (!parsed.success) return { error: "Ordem inválida" };

  await db.$transaction(
    parsed.data.map((m) =>
      db.module.update({
        where: { id: m.id },
        data: { order: m.order },
      }),
    ),
  );
  revalidatePath(`/admin/cursos/${courseId}`);
  return { success: true };
}

type VideoFields =
  | { youtubeVideoId: string; bunnyVideoId: null; bunnyLibraryId: null }
  | { youtubeVideoId: null };

/**
 * Resolve o input `videoSource` em mutação Prisma.
 *
 * - vazio: zera youtubeVideoId; NÃO toca em bunny* (rollback path do ADR-016 —
 *   aula legacy hospedada em Bunny segue funcionando se admin salvar sem
 *   trocar nada).
 * - válido (extractYoutubeId retorna string): grava youtubeVideoId E zera
 *   ambos os bunny* na mesma transação (single source of truth).
 * - inválido: retorna null para o handler rejeitar.
 */
function resolveVideoFields(videoSource: string | undefined): VideoFields | null {
  if (!videoSource || videoSource.trim() === "") {
    return { youtubeVideoId: null };
  }
  const id = extractYoutubeId(videoSource);
  if (!id) return null;
  return { youtubeVideoId: id, bunnyVideoId: null, bunnyLibraryId: null };
}

export async function createLessonAction(moduleId: string, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const raw = {
    title: typeof fd.get("title") === "string" ? fd.get("title") : "",
    videoSource: typeof fd.get("videoSource") === "string" ? (fd.get("videoSource") as string) : "",
    sidebarContentJson:
      typeof fd.get("sidebarContentJson") === "string"
        ? (fd.get("sidebarContentJson") as string)
        : "",
    sidebarPdfUrl:
      typeof fd.get("sidebarPdfUrl") === "string" ? (fd.get("sidebarPdfUrl") as string) : "",
  };
  const parsed = lessonInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const video = resolveVideoFields(parsed.data.videoSource);
  if (video === null) return { error: "URL ou ID do YouTube inválido" };

  const moduleRecord = await db.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  if (!moduleRecord) return { error: "Módulo não encontrado" };

  const last = await db.lesson.findFirst({
    where: { moduleId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  let sidebarContent: unknown = null;
  if (parsed.data.sidebarContentJson && parsed.data.sidebarContentJson.trim() !== "") {
    try {
      sidebarContent = JSON.parse(parsed.data.sidebarContentJson);
    } catch {
      return { error: "Conteúdo da sidebar inválido (JSON malformado)" };
    }
  }

  await db.lesson.create({
    data: {
      moduleId,
      title: parsed.data.title,
      order: (last?.order ?? -1) + 1,
      ...video,
      sidebarContent: sidebarContent === null ? undefined : (sidebarContent as object),
      sidebarPdfUrl: parsed.data.sidebarPdfUrl ?? null,
    },
  });

  revalidatePath(`/admin/cursos/${moduleRecord.courseId}`);
  return { success: true };
}

export async function updateLessonAction(lessonId: string, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const raw = {
    title: typeof fd.get("title") === "string" ? fd.get("title") : "",
    videoSource: typeof fd.get("videoSource") === "string" ? (fd.get("videoSource") as string) : "",
    sidebarContentJson:
      typeof fd.get("sidebarContentJson") === "string"
        ? (fd.get("sidebarContentJson") as string)
        : "",
    sidebarPdfUrl:
      typeof fd.get("sidebarPdfUrl") === "string" ? (fd.get("sidebarPdfUrl") as string) : "",
  };
  const parsed = lessonInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const video = resolveVideoFields(parsed.data.videoSource);
  if (video === null) return { error: "URL ou ID do YouTube inválido" };

  let sidebarContent: unknown = null;
  if (parsed.data.sidebarContentJson && parsed.data.sidebarContentJson.trim() !== "") {
    try {
      sidebarContent = JSON.parse(parsed.data.sidebarContentJson);
    } catch {
      return { error: "Conteúdo da sidebar inválido (JSON malformado)" };
    }
  }

  const updated = await db.lesson.update({
    where: { id: lessonId },
    data: {
      title: parsed.data.title,
      ...video,
      sidebarContent: sidebarContent === null ? undefined : (sidebarContent as object),
      sidebarPdfUrl: parsed.data.sidebarPdfUrl ?? null,
    },
    select: { module: { select: { courseId: true } } },
  });

  revalidatePath(`/admin/cursos/${updated.module.courseId}`);
  return { success: true };
}

export async function deleteLessonAction(lessonId: string): Promise<ActionResult> {
  await requireAdmin();
  const deleted = await db.lesson.delete({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  revalidatePath(`/admin/cursos/${deleted.module.courseId}`);
  return { success: true };
}

export async function reorderLessonsAction(
  moduleId: string,
  ordered: { id: string; order: number }[],
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = reorderSchema.safeParse(ordered);
  if (!parsed.success) return { error: "Ordem inválida" };

  const moduleRecord = await db.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  if (!moduleRecord) return { error: "Módulo não encontrado" };

  await db.$transaction(
    parsed.data.map((l) =>
      db.lesson.update({
        where: { id: l.id },
        data: { order: l.order },
      }),
    ),
  );
  revalidatePath(`/admin/cursos/${moduleRecord.courseId}`);
  return { success: true };
}
