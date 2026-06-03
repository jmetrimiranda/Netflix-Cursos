import { db } from "@/lib/db";
import type { CourseInput } from "@/lib/validations/course";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseForm } from "../../_components/course-form";

export default async function EditarCursoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await db.course.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      category: true,
      priceCents: true,
      workloadHours: true,
      examQuestionsCount: true,
      examPassScore: true,
      thumbnailUrl: true,
      featured: true,
      published: true,
      certificateCourseName: true,
      certificateValidity: true,
      examScopeTitle: true,
      examScopeSubtitle: true,
      examScopeTopics: true,
      _count: { select: { enrollments: true } },
    },
  });

  if (!course) notFound();

  const defaults: CourseInput = {
    title: course.title,
    slug: course.slug,
    description: course.description,
    category: course.category,
    priceCents: course.priceCents,
    workloadHours: course.workloadHours,
    examQuestionsCount: course.examQuestionsCount,
    examPassScore: course.examPassScore,
    thumbnailUrl: course.thumbnailUrl ?? undefined,
    featured: course.featured,
    published: course.published,
    certificateCourseName: course.certificateCourseName ?? undefined,
    certificateValidity: course.certificateValidity ?? undefined,
    examScopeTitle: course.examScopeTitle ?? undefined,
    examScopeSubtitle: course.examScopeSubtitle ?? undefined,
    examScopeTopics: course.examScopeTopics ?? undefined,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Editar curso</h1>
          <p className="text-sm text-muted-foreground">Configurações gerais do curso.</p>
        </div>
        <Link
          href={`/admin/cursos/${course.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Voltar para o curso
        </Link>
      </div>
      <CourseForm
        mode="edit"
        courseId={course.id}
        defaults={defaults}
        slugLocked={course._count.enrollments > 0}
      />
    </div>
  );
}
