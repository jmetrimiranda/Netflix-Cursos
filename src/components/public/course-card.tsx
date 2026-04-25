import Link from "next/link";
import type { CourseCategory } from "@prisma/client";
import { categoryLabel } from "@/lib/categories";
import { cn } from "@/lib/utils";

export type CourseCardData = {
  slug: string;
  title: string;
  category: CourseCategory;
  thumbnailUrl: string | null;
  lessonsCount: number;
  workloadHours: number;
};

type CourseCardProps = {
  course: CourseCardData;
  variant?: "thumbnail" | "poster";
};

export function CourseCard({ course, variant = "thumbnail" }: CourseCardProps) {
  if (variant === "poster") {
    return (
      <Link
        href={`/cursos/${course.slug}`}
        className="group relative block w-44 shrink-0 snap-start overflow-hidden rounded-lg ring-1 ring-white/5 transition-all duration-200 hover:scale-[1.03] hover:ring-white/20 hover:shadow-lg focus-visible:scale-[1.03] focus-visible:ring-2 focus-visible:ring-ring sm:w-52"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-primary/10 px-3 text-center text-xs font-medium uppercase tracking-wider text-primary-foreground/90">
              {categoryLabel(course.category)}
            </div>
          )}
          <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
            {categoryLabel(course.category)}
          </span>
        </div>
        <div className="p-3">
          <h3 className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
            {course.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {course.lessonsCount} {course.lessonsCount === 1 ? "aula" : "aulas"} ·{" "}
            {course.workloadHours}h
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/cursos/${course.slug}`}
      className={cn(
        "group relative block w-64 shrink-0 snap-start overflow-hidden rounded-lg ring-1 ring-white/5 transition-all duration-200 hover:scale-105 hover:ring-white/20 hover:shadow-lg focus-visible:scale-105 focus-visible:ring-2 focus-visible:ring-ring sm:w-72",
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs uppercase tracking-wider text-zinc-400">
            Sem thumbnail
          </div>
        )}
        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
          {categoryLabel(course.category)}
        </span>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
          {course.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {course.lessonsCount} {course.lessonsCount === 1 ? "aula" : "aulas"} ·{" "}
          {course.workloadHours}h
        </p>
      </div>
    </Link>
  );
}
