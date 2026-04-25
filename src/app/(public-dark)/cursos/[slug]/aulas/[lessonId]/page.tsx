import { LessonAccessGate } from "@/components/public/lesson-access-gate";
import type { LessonNavItem } from "@/components/public/lesson-view";
import { db } from "@/lib/db";
import type { JSONContent } from "@tiptap/react";
import { notFound } from "next/navigation";

type RouteParams = { slug: string; lessonId: string };

export default async function LessonPage({ params }: { params: Promise<RouteParams> }) {
  const { slug, lessonId } = await params;

  const course = await db.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!course || !course.published) notFound();

  const flatLessons = course.modules.flatMap((m) => m.lessons);
  const idx = flatLessons.findIndex((l) => l.id === lessonId);
  if (idx === -1) notFound();

  const lesson = flatLessons[idx];
  const prev = flatLessons[idx - 1] ?? null;
  const next = flatLessons[idx + 1] ?? null;

  const siblings: LessonNavItem[] = flatLessons.map((l) => ({ id: l.id, title: l.title }));

  return (
    <LessonAccessGate
      courseId={course.id}
      courseSlug={course.slug}
      courseTitle={course.title}
      lesson={{
        id: lesson.id,
        title: lesson.title,
        bunnyVideoId: lesson.bunnyVideoId,
        bunnyLibraryId: lesson.bunnyLibraryId,
        durationSeconds: lesson.durationSeconds,
        sidebarContent: (lesson.sidebarContent as JSONContent | null) ?? null,
        sidebarPdfUrl: lesson.sidebarPdfUrl,
      }}
      index={idx}
      total={flatLessons.length}
      prevLessonId={prev?.id ?? null}
      nextLessonId={next?.id ?? null}
      siblingLessons={siblings}
    />
  );
}
