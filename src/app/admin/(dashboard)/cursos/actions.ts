"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { courseInputSchema } from "@/lib/validations/course";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionResult = { success: true } | { error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}

function parseCourseFormData(fd: FormData) {
  const get = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v : "";
  };
  const num = (k: string) => Number(get(k));
  const bool = (k: string) => {
    const v = get(k);
    return v === "on" || v === "true" || v === "1";
  };
  const textOpt = (k: string) => {
    const v = get(k).trim();
    return v === "" ? undefined : v;
  };
  const thumbnailUrl = get("thumbnailUrl").trim();
  return {
    title: get("title"),
    slug: get("slug"),
    description: get("description"),
    category: get("category"),
    priceCents: num("priceCents"),
    workloadHours: num("workloadHours"),
    examQuestionsCount: num("examQuestionsCount"),
    examPassScore: num("examPassScore"),
    thumbnailUrl: thumbnailUrl === "" ? undefined : thumbnailUrl,
    featured: bool("featured"),
    published: bool("published"),
    certificateCourseName: textOpt("certificateCourseName"),
    certificateValidity: textOpt("certificateValidity"),
    examScopeTitle: textOpt("examScopeTitle"),
    examScopeSubtitle: textOpt("examScopeSubtitle"),
    examScopeTopics: textOpt("examScopeTopics"),
  };
}

export async function createCourseAction(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = courseInputSchema.safeParse(parseCourseFormData(fd));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Dados inválidos" };
  }

  let courseId: string;
  try {
    const created = await db.course.create({
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: parsed.data.description,
        category: parsed.data.category,
        priceCents: parsed.data.priceCents,
        workloadHours: parsed.data.workloadHours,
        examQuestionsCount: parsed.data.examQuestionsCount,
        examPassScore: parsed.data.examPassScore,
        thumbnailUrl: parsed.data.thumbnailUrl ?? null,
        featured: parsed.data.featured,
        published: parsed.data.published,
        certificateCourseName: parsed.data.certificateCourseName ?? null,
        certificateValidity: parsed.data.certificateValidity ?? null,
        examScopeTitle: parsed.data.examScopeTitle ?? null,
        examScopeSubtitle: parsed.data.examScopeSubtitle ?? null,
        examScopeTopics: parsed.data.examScopeTopics ?? null,
      },
      select: { id: true },
    });
    courseId = created.id;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Slug já está em uso" };
    }
    throw err;
  }

  revalidatePath("/admin/cursos");
  redirect(`/admin/cursos/${courseId}`);
}

export async function updateCourseAction(
  courseId: string,
  _prev: ActionResult,
  fd: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const existing = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, slug: true, _count: { select: { enrollments: true } } },
  });
  if (!existing) return { error: "Curso não encontrado" };

  const parsed = courseInputSchema.safeParse(parseCourseFormData(fd));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Dados inválidos" };
  }

  if (parsed.data.slug !== existing.slug && existing._count.enrollments > 0) {
    return { error: "Slug não pode mudar: existem matrículas associadas" };
  }

  try {
    await db.course.update({
      where: { id: courseId },
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: parsed.data.description,
        category: parsed.data.category,
        priceCents: parsed.data.priceCents,
        workloadHours: parsed.data.workloadHours,
        examQuestionsCount: parsed.data.examQuestionsCount,
        examPassScore: parsed.data.examPassScore,
        thumbnailUrl: parsed.data.thumbnailUrl ?? null,
        featured: parsed.data.featured,
        published: parsed.data.published,
        certificateCourseName: parsed.data.certificateCourseName ?? null,
        certificateValidity: parsed.data.certificateValidity ?? null,
        examScopeTitle: parsed.data.examScopeTitle ?? null,
        examScopeSubtitle: parsed.data.examScopeSubtitle ?? null,
        examScopeTopics: parsed.data.examScopeTopics ?? null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Slug já está em uso" };
    }
    throw err;
  }

  revalidatePath("/admin/cursos");
  revalidatePath(`/admin/cursos/${courseId}`);
  return { success: true };
}

export async function deleteCourseAction(courseId: string): Promise<void> {
  await requireAdmin();
  await db.course.delete({ where: { id: courseId } });
  revalidatePath("/admin/cursos");
  redirect("/admin/cursos");
}
