import { db } from "@/lib/db";
import { enrollmentInputSchema } from "@/lib/validations/enrollment";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = enrollmentInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { courseId, studentEmail } = parsed.data;

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, published: true },
  });
  if (!course || !course.published) {
    return NextResponse.json({ error: "Curso não disponível" }, { status: 404 });
  }

  const enrollment = await db.enrollment.upsert({
    where: { studentEmail_courseId: { studentEmail, courseId } },
    update: {},
    create: { studentEmail, courseId },
    select: { id: true },
  });

  return NextResponse.json({ enrollmentId: enrollment.id });
}
