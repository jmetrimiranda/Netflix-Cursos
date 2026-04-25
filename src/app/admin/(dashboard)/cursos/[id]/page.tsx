import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { COURSE_CATEGORY_LABELS } from "@/lib/validations/course";
import type { JSONContent } from "@tiptap/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type ModuleItem, ModulesPanel } from "./_components/modules-panel";

export default async function CursoEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const course = await db.course.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      published: true,
      featured: true,
      category: true,
      modules: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              order: true,
              bunnyVideoId: true,
              bunnyLibraryId: true,
              sidebarContent: true,
              sidebarPdfUrl: true,
            },
          },
        },
      },
    },
  });

  if (!course) notFound();

  const modules: ModuleItem[] = course.modules.map((m) => ({
    id: m.id,
    title: m.title,
    order: m.order,
    lessons: m.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      order: l.order,
      bunnyVideoId: l.bunnyVideoId,
      bunnyLibraryId: l.bunnyLibraryId,
      sidebarContent: (l.sidebarContent as JSONContent | null) ?? null,
      sidebarPdfUrl: l.sidebarPdfUrl,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/cursos" className="text-sm text-muted-foreground hover:underline">
            ← Cursos
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
            {course.title}
            {course.published ? (
              <Badge>Publicado</Badge>
            ) : (
              <Badge variant="outline">Rascunho</Badge>
            )}
            {course.featured ? <Badge variant="secondary">Destaque</Badge> : null}
          </h1>
          <p className="text-sm text-muted-foreground">
            /{course.slug} · {COURSE_CATEGORY_LABELS[course.category]}
          </p>
        </div>
      </div>

      <nav className="flex gap-2 border-b border-border pb-2 text-sm">
        <Link
          href={`/admin/cursos/${course.id}/editar`}
          className="rounded-md px-3 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Configurações
        </Link>
        <span className="rounded-md bg-accent px-3 py-1 text-foreground">Módulos e aulas</span>
        <Link
          href={`/admin/cursos/${course.id}/questoes`}
          className="rounded-md px-3 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Banco de questões
        </Link>
      </nav>

      <ModulesPanel courseId={course.id} modules={modules} />
    </div>
  );
}
