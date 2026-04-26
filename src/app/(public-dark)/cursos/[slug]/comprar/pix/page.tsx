import { PixView } from "@/components/public/pix-view";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

type RouteParams = { slug: string };

export default async function ComprarPixPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const course = await db.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" }, select: { id: true } },
        },
      },
    },
  });
  if (!course || !course.published) notFound();
  const firstLessonId = course.modules.flatMap((m) => m.lessons)[0]?.id ?? null;

  return <PixView slug={slug} firstLessonId={firstLessonId} />;
}
