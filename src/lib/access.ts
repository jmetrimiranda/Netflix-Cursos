import { db } from "@/lib/db";

export type EnrollmentLite = {
  id: string;
  status: "pending_payment" | "active" | "cancelled";
  courseId: string;
};

export async function getEnrollment(
  courseId: string,
  studentEmail: string,
): Promise<EnrollmentLite | null> {
  return db.enrollment.findUnique({
    where: { studentEmail_courseId: { studentEmail, courseId } },
    select: { id: true, status: true, courseId: true },
  });
}

export function hasAccess(e: { status: string } | null): boolean {
  return e?.status === "active";
}
