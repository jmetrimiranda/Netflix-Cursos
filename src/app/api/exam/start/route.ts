import { db } from "@/lib/db";
import type { QuestionOption } from "@/lib/validations/question";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({ enrollmentId: z.string().min(1) });

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const { enrollmentId } = parsed.data;

  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      status: true,
      course: { select: { id: true, examQuestionsCount: true } },
    },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "Matrícula não encontrada" }, { status: 404 });
  }
  if (enrollment.status !== "active") {
    return NextResponse.json({ error: "Acesso pendente de pagamento" }, { status: 403 });
  }

  // Sorteia N questões ativas aleatoriamente
  const sampled = await db.$queryRaw<Array<{ id: string; statement: string; options: unknown }>>`
    SELECT "id", "statement", "options"
    FROM "Question"
    WHERE "courseId" = ${enrollment.course.id} AND "active" = true
    ORDER BY random()
    LIMIT ${enrollment.course.examQuestionsCount}
  `;

  if (sampled.length === 0) {
    return NextResponse.json({ error: "Curso sem questões ativas" }, { status: 409 });
  }

  const attempt = await db.examAttempt.create({
    data: {
      enrollmentId,
      selectedQuestionIds: sampled.map((q) => q.id),
      answers: {},
    },
    select: { id: true },
  });

  // Sanitize: remove `isCorrect` antes de mandar pro cliente
  const safeQuestions = sampled.map((q) => {
    const opts = (q.options as QuestionOption[]) ?? [];
    return {
      id: q.id,
      statement: q.statement,
      options: opts.map((o) => ({ id: o.id, text: o.text })),
    };
  });

  return NextResponse.json({ attemptId: attempt.id, questions: safeQuestions });
}
