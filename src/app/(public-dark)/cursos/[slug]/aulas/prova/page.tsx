import { ExamGate } from "@/components/public/exam-gate";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

type RouteParams = { slug: string };

export default async function ProvaPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const course = await db.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" }, select: { id: true, title: true } },
        },
      },
    },
  });
  if (!course || !course.published) notFound();

  const lessons = course.modules.flatMap((m) => m.lessons);

  return (
    <ExamGate
      courseId={course.id}
      courseSlug={course.slug}
      courseTitle={course.title}
      lessons={lessons}
    />
  );
}
