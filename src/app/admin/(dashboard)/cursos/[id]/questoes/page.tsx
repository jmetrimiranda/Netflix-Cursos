import { db } from "@/lib/db";
import type { QuestionOption } from "@/lib/validations/question";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type QuestionItem, QuestionsList } from "./_components/questions-list";

export default async function CursoQuestoesPage({
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
      examQuestionsCount: true,
      questions: {
        orderBy: { id: "asc" },
        select: { id: true, statement: true, active: true, options: true },
      },
    },
  });

  if (!course) notFound();

  const questions: QuestionItem[] = course.questions.map((q) => ({
    id: q.id,
    statement: q.statement,
    active: q.active,
    options: (q.options as QuestionOption[]) ?? [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/cursos/${course.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {course.title}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Banco de questões</h1>
        <p className="text-sm text-muted-foreground">
          {course.examQuestionsCount} questões serão sorteadas em cada prova.
        </p>
      </div>

      <nav className="flex gap-2 border-b border-border pb-2 text-sm">
        <Link
          href={`/admin/cursos/${course.id}/editar`}
          className="rounded-md px-3 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Configurações
        </Link>
        <Link
          href={`/admin/cursos/${course.id}`}
          className="rounded-md px-3 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Módulos e aulas
        </Link>
        <span className="rounded-md bg-accent px-3 py-1 text-foreground">Banco de questões</span>
      </nav>

      <QuestionsList courseId={course.id} questions={questions} />
    </div>
  );
}
