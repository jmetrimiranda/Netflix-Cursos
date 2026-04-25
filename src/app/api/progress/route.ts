import { db } from "@/lib/db";
import { COMPLETED_THRESHOLD_PCT } from "@/lib/progress";
import { progressInputSchema } from "@/lib/validations/progress";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = progressInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { enrollmentId, lessonId, progressPct } = parsed.data;

  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { studentEmail: true, courseId: true, status: true },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "Matrícula não encontrada" }, { status: 404 });
  }
  if (enrollment.status !== "active") {
    return NextResponse.json({ error: "Acesso pendente de pagamento" }, { status: 403 });
  }

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson || lesson.module.courseId !== enrollment.courseId) {
    return NextResponse.json({ error: "Aula não pertence ao curso" }, { status: 400 });
  }

  const existing = await db.lessonView.findUnique({
    where: { studentEmail_lessonId: { studentEmail: enrollment.studentEmail, lessonId } },
    select: { progressPct: true, completed: true },
  });

  const nextPct = existing ? Math.max(existing.progressPct, progressPct) : progressPct;
  const nextCompleted = existing?.completed === true || nextPct >= COMPLETED_THRESHOLD_PCT;

  const view = await db.lessonView.upsert({
    where: { studentEmail_lessonId: { studentEmail: enrollment.studentEmail, lessonId } },
    create: {
      studentEmail: enrollment.studentEmail,
      lessonId,
      progressPct: nextPct,
      completed: nextCompleted,
      lastWatchedAt: new Date(),
    },
    update: {
      progressPct: nextPct,
      completed: nextCompleted,
      lastWatchedAt: new Date(),
    },
    select: { progressPct: true, completed: true },
  });

  return NextResponse.json(view);
}
