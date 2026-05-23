import { stripCpfMask } from "@/lib/cpf";
import type { EnrollmentStatus } from "@prisma/client";

export type RecoverResult =
  | { ok: true; redirectTo: string }
  | {
      ok: false;
      reason: "course_not_found" | "not_found" | "not_active" | "cpf_mismatch";
    };

export type RecoverDeps = {
  findCourseWithFirstLesson(slug: string): Promise<{
    id: string;
    slug: string;
    firstLessonId: string | null;
  } | null>;
  findEnrollmentByCourseAndEmail(
    courseId: string,
    email: string,
  ): Promise<{
    id: string;
    status: EnrollmentStatus;
    payment: { studentCpf: string } | null;
  } | null>;
};

export type RecoverInput = {
  courseSlug: string;
  studentEmail: string;
  studentCpf: string;
};

export async function recoverEnrollment(
  deps: RecoverDeps,
  input: RecoverInput,
): Promise<RecoverResult> {
  const course = await deps.findCourseWithFirstLesson(input.courseSlug);
  if (!course) return { ok: false, reason: "course_not_found" };

  const enrollment = await deps.findEnrollmentByCourseAndEmail(course.id, input.studentEmail);
  if (!enrollment) return { ok: false, reason: "not_found" };

  if (enrollment.status !== "active") {
    return { ok: false, reason: "not_active" };
  }

  const storedCpf = stripCpfMask(enrollment.payment?.studentCpf ?? "");
  const providedCpf = stripCpfMask(input.studentCpf);
  if (!storedCpf || storedCpf !== providedCpf) {
    return { ok: false, reason: "cpf_mismatch" };
  }

  if (!course.firstLessonId) {
    return { ok: true, redirectTo: `/cursos/${course.slug}` };
  }
  return {
    ok: true,
    redirectTo: `/cursos/${course.slug}/aulas/${course.firstLessonId}`,
  };
}
