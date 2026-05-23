import { db } from "@/lib/db";
import { type RecoverDeps, recoverEnrollment } from "@/lib/enrollment-recover";
import { rateLimitResponse } from "@/lib/rate-limit";
import { enrollmentRecoverSchema } from "@/lib/validations/enrollment-recover";
import { NextResponse } from "next/server";

const deps: RecoverDeps = {
  async findCourseWithFirstLesson(slug) {
    const course = await db.course.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        published: true,
        modules: {
          orderBy: { order: "asc" },
          select: {
            lessons: {
              orderBy: { order: "asc" },
              select: { id: true },
              take: 1,
            },
          },
          take: 1,
        },
      },
    });
    if (!course || !course.published) return null;
    const firstLessonId = course.modules[0]?.lessons[0]?.id ?? null;
    return { id: course.id, slug: course.slug, firstLessonId };
  },

  async findEnrollmentByCourseAndEmail(courseId, email) {
    const enrollment = await db.enrollment.findFirst({
      where: {
        courseId,
        studentEmail: { equals: email, mode: "insensitive" },
      },
      select: {
        id: true,
        status: true,
        payment: { select: { studentCpf: true } },
      },
    });
    return enrollment;
  },
};

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "enrollment-recover", {
    max: 5,
    windowMs: 60_000,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = enrollmentRecoverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await recoverEnrollment(deps, parsed.data);

  if (result.ok) {
    console.warn(
      `[enrollment-recover] ok course=${parsed.data.courseSlug} redirectTo=${result.redirectTo}`,
    );
    return NextResponse.json(result);
  }

  if (result.reason === "course_not_found") {
    console.warn(`[enrollment-recover] course_not_found course=${parsed.data.courseSlug}`);
    return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
  }

  console.warn(
    `[enrollment-recover] denied course=${parsed.data.courseSlug} reason=${result.reason}`,
  );
  return NextResponse.json({ ok: false, reason: result.reason });
}
