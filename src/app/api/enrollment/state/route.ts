import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  courseId: z.string().min(1),
  studentEmail: z.string().trim().toLowerCase().email().max(254),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    courseId: searchParams.get("courseId") ?? "",
    studentEmail: searchParams.get("studentEmail") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const { courseId, studentEmail } = parsed.data;

  const enrollment = await db.enrollment.findUnique({
    where: { studentEmail_courseId: { studentEmail, courseId } },
    select: { id: true, status: true },
  });

  if (!enrollment) {
    return NextResponse.json({ enrollmentId: null, status: null, views: [] });
  }

  if (enrollment.status !== "active") {
    return NextResponse.json({
      enrollmentId: enrollment.id,
      status: enrollment.status,
      views: [],
    });
  }

  const lessons = await db.lesson.findMany({
    where: { module: { courseId } },
    select: { id: true },
  });
  const lessonIds = lessons.map((l) => l.id);

  const views = lessonIds.length
    ? await db.lessonView.findMany({
        where: { studentEmail, lessonId: { in: lessonIds } },
        select: { lessonId: true, progressPct: true, completed: true },
      })
    : [];

  return NextResponse.json({
    enrollmentId: enrollment.id,
    status: enrollment.status,
    views,
  });
}
