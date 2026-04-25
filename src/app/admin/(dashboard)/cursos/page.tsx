import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatCentsToBRL } from "@/lib/money";
import { COURSE_CATEGORY_LABELS } from "@/lib/validations/course";
import Link from "next/link";
import { DeleteCourseButton } from "./_components/delete-course-button";

export default async function AdminCursosPage() {
  const courses = await db.course.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      published: true,
      featured: true,
      priceCents: true,
      thumbnailUrl: true,
      category: true,
      _count: { select: { modules: true, questions: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cursos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os cursos publicados na plataforma.
          </p>
        </div>
        <Link href="/admin/cursos/novo" className={buttonVariants()}>
          Novo curso
        </Link>
      </header>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum curso ainda. Comece criando o primeiro.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {courses.map((course) => (
            <li
              key={course.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div className="h-16 w-28 overflow-hidden rounded-md bg-muted">
                {course.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    sem imagem
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-medium">{course.title}</h2>
                  {course.published ? (
                    <Badge>Publicado</Badge>
                  ) : (
                    <Badge variant="outline">Rascunho</Badge>
                  )}
                  {course.featured ? <Badge variant="secondary">Destaque</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  /{course.slug} · {COURSE_CATEGORY_LABELS[course.category]} ·{" "}
                  {formatCentsToBRL(course.priceCents)} · {course._count.modules} módulos ·{" "}
                  {course._count.questions} questões
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/cursos/${course.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Editar
                </Link>
                <DeleteCourseButton courseId={course.id} title={course.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
