import Link from "next/link";
import { CourseForm } from "../_components/course-form";

export default function NovoCursoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Novo curso</h1>
          <p className="text-sm text-muted-foreground">
            Preencha os dados básicos. Após criar, você poderá adicionar módulos, aulas e questões.
          </p>
        </div>
        <Link href="/admin/cursos" className="text-sm text-muted-foreground hover:underline">
          ← Voltar
        </Link>
      </div>
      <CourseForm mode="create" />
    </div>
  );
}
