import { issueCertificateIfNeeded } from "@/lib/certificates";
import { db } from "@/lib/db";
import type { QuestionOption } from "@/lib/validations/question";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  attemptId: z.string().min(1),
  answers: z.record(z.string(), z.string()),
});

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
  const { attemptId, answers } = parsed.data;

  const attempt = await db.examAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      submittedAt: true,
      selectedQuestionIds: true,
      enrollmentId: true,
      enrollment: {
        select: {
          status: true,
          course: { select: { id: true, examPassScore: true } },
        },
      },
    },
  });
  if (!attempt) {
    return NextResponse.json({ error: "Tentativa não encontrada" }, { status: 404 });
  }
  if (attempt.enrollment.status !== "active") {
    return NextResponse.json({ error: "Acesso pendente" }, { status: 403 });
  }
  if (attempt.submittedAt) {
    return NextResponse.json({ error: "Tentativa já submetida" }, { status: 409 });
  }

  const ids = (attempt.selectedQuestionIds as string[]) ?? [];
  const questions = await db.question.findMany({
    where: { id: { in: ids } },
    select: { id: true, options: true },
  });

  let correct = 0;
  for (const q of questions) {
    const opts = (q.options as QuestionOption[]) ?? [];
    const correctOpt = opts.find((o) => o.isCorrect);
    if (correctOpt && answers[q.id] === correctOpt.id) correct += 1;
  }

  const total = ids.length;
  const score = total > 0 ? Math.round((correct / total) * 100) / 10 : 0;
  const passed = score >= attempt.enrollment.course.examPassScore;

  await db.examAttempt.update({
    where: { id: attempt.id },
    data: {
      submittedAt: new Date(),
      answers,
      score,
      passed,
    },
  });

  let certificatePayload: { verificationCode: string; pdfUrl: string | null } | null = null;
  if (passed) {
    try {
      const cert = await issueCertificateIfNeeded(attempt.enrollmentId);
      certificatePayload = {
        verificationCode: cert.verificationCode,
        pdfUrl: cert.pdfUrl,
      };
    } catch (e) {
      console.error("[exam] Falha ao emitir certificado:", e);
    }
  }

  return NextResponse.json({
    score,
    passed,
    certificate: certificatePayload,
  });
}
