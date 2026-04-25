import { Button } from "@/components/ui/button";
import { categoryLabel } from "@/lib/categories";
import type { CourseCategory } from "@prisma/client";
import Link from "next/link";

export type HeroCourse = {
  slug: string;
  title: string;
  description: string;
  category: CourseCategory;
  thumbnailUrl: string | null;
};

const MAX_DESCRIPTION = 220;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export function HeroSection({ course }: { course: HeroCourse | null }) {
  if (!course) {
    return (
      <section className="relative flex min-h-[40vh] items-center justify-center bg-gradient-to-br from-zinc-900 to-black px-4 py-16 text-center sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Cursos em breve
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Estamos preparando os primeiros cursos. Volte em breve.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover opacity-40"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-zinc-800 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
      </div>
      <div className="mx-auto flex min-h-[55vh] max-w-7xl flex-col justify-end px-4 pb-10 pt-24 sm:px-6 sm:pb-16 sm:pt-32">
        <span className="inline-flex w-fit rounded bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur">
          {categoryLabel(course.category)}
        </span>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-foreground sm:text-5xl">
          {course.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
          {truncate(course.description, MAX_DESCRIPTION)}
        </p>
        <div className="mt-5">
          <Link href={`/cursos/${course.slug}`}>
            <Button size="lg" className="px-5">
              Começar curso
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
