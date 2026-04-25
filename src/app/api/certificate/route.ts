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
    select: {
      certificate: {
        select: {
          verificationCode: true,
          pdfUrl: true,
          studentName: true,
          courseTitle: true,
          workloadHours: true,
          issuedAt: true,
        },
      },
    },
  });
  if (!enrollment?.certificate) {
    return NextResponse.json({ certificate: null });
  }
  return NextResponse.json({
    certificate: {
      ...enrollment.certificate,
      issuedAt: enrollment.certificate.issuedAt.toISOString(),
    },
  });
}
