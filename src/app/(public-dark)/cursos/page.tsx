import type { CourseCardData } from "@/components/public/course-card";
import { CourseRow } from "@/components/public/course-row";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/categories";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import type { CourseCategory } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Catálogo de cursos — Ativa Engenharia",
  description:
    "Cursos online de engenharia civil, mecânica e segurança do trabalho. Certificado vitalício pago via Pix.",
};

const FILTERS: { key: "todas" | CourseCategory; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "civil", label: "Engenharia Civil" },
  { key: "mecanica", label: "Engenharia Mecânica" },
  { key: "seguranca", label: "Segurança do Trabalho" },
];

type CatalogCourse = CourseCardData & { id: string };

async function loadCatalog() {
  const courses = await db.course.findMany({
    where: { published: true },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      thumbnailUrl: true,
      workloadHours: true,
      modules: { select: { lessons: { select: { id: true } } } },
    },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
  });

  const list: CatalogCourse[] = courses.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    category: c.category,
    thumbnailUrl: c.thumbnailUrl,
    workloadHours: c.workloadHours,
    lessonsCount: c.modules.reduce((acc, m) => acc + m.lessons.length, 0),
  }));

  const byCategory = new Map<CourseCategory, CatalogCourse[]>();
  for (const cat of CATEGORY_ORDER) byCategory.set(cat, []);
  for (const c of list) byCategory.get(c.category)?.push(c);

  return { list, byCategory };
}

type CursosPageProps = {
  searchParams: Promise<{ categoria?: string }>;
};

export default async function CursosPage({ searchParams }: CursosPageProps) {
  const { categoria } = await searchParams;
  const active = (FILTERS.find((f) => f.key === categoria)?.key ??
    "todas") as (typeof FILTERS)[number]["key"];
  const { list, byCategory } = await loadCatalog();

  const filteredList = active === "todas" ? list : list.filter((c) => c.category === active);

  return (
    <div className="space-y-10 pb-16">
      {/* Hero compacto */}
      <section className="border-b border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Catálogo</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Catálogo de cursos</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Capacitação técnica em engenharia. Estude no seu ritmo, faça a prova com tentativas
            ilimitadas e pague o certificado via Pix.
          </p>

          {/* Filtros */}
          <nav aria-label="Filtrar por categoria" className="mt-6 flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const href = filter.key === "todas" ? "/cursos" : `/cursos?categoria=${filter.key}`;
              const isActive = active === filter.key;
              return (
                <Link
                  key={filter.key}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "border border-white/15 bg-white/5 text-foreground/85 hover:bg-white/10",
                  )}
                >
                  {filter.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      {/* Conteúdo */}
      <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
        {active === "todas" ? (
          <>
            {CATEGORY_ORDER.map((cat) => (
              <CourseRow
                key={cat}
                title={CATEGORY_LABELS[cat]}
                courses={byCategory.get(cat) ?? []}
                variant="poster"
              />
            ))}
            {list.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Nenhum curso publicado ainda.
              </p>
            )}
          </>
        ) : (
          <>
            <CourseRow
              title={CATEGORY_LABELS[active as CourseCategory]}
              courses={filteredList}
              variant="poster"
            />
            {filteredList.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Nenhum curso publicado nesta categoria ainda.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
