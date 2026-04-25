import { CourseDetailView, type ModuleItem } from "@/components/public/course-detail-view";
import { categoryLabel } from "@/lib/categories";
import { db } from "@/lib/db";
import { formatCentsToBRL } from "@/lib/money";
import { notFound } from "next/navigation";

type RouteParams = { slug: string };

export default async function CoursePage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;

  const course = await db.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, title: true },
          },
        },
      },
    },
  });

  if (!course || !course.published) {
    notFound();
  }

  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const moduleItems: ModuleItem[] = course.modules.map((m) => ({
    id: m.id,
    title: m.title,
    lessons: m.lessons,
  }));

  return (
    <article>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover opacity-30"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-zinc-800 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
        </div>
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-24">
          <span className="inline-flex w-fit rounded bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur">
            {categoryLabel(course.category)}
          </span>
          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-4xl">
            {course.title}
          </h1>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground sm:text-base">
            {course.description}
          </p>
          <p className="text-xs text-muted-foreground">
            {totalLessons} {totalLessons === 1 ? "aula" : "aulas"} · {course.workloadHours}h ·
            Certificado {formatCentsToBRL(course.priceCents)}
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <CourseDetailView courseId={course.id} courseSlug={course.slug} modules={moduleItems} />
      </section>
    </article>
  );
}
