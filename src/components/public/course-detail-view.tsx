"use client";

import { EmailCaptureModal } from "@/components/public/email-capture-modal";
import { Button } from "@/components/ui/button";
import { areAllLessonsCompleted } from "@/lib/progress";
import { readStudentEmail } from "@/lib/student-email";
import { CheckIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type LessonItem = {
  id: string;
  title: string;
};

export type ModuleItem = {
  id: string;
  title: string;
  lessons: LessonItem[];
};

type ViewState = { lessonId: string; progressPct: number; completed: boolean };

type Props = {
  courseId: string;
  courseSlug: string;
  modules: ModuleItem[];
};

export function CourseDetailView({ courseId, courseSlug, modules }: Props) {
  const router = useRouter();
  const [views, setViews] = useState<ViewState[] | null>(null);
  const [hasEmail, setHasEmail] = useState<boolean | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const flatLessons = useMemo(() => modules.flatMap((m) => m.lessons), [modules]);
  const firstLessonId = flatLessons[0]?.id ?? null;

  useEffect(() => {
    const email = readStudentEmail();
    setHasEmail(email !== null);
    if (!email) {
      setViews([]);
      return;
    }
    let cancelled = false;
    fetch(
      `/api/enrollment/state?courseId=${encodeURIComponent(courseId)}&studentEmail=${encodeURIComponent(email)}`,
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { views: ViewState[] }) => {
        if (!cancelled) setViews(data.views);
      })
      .catch(() => {
        if (!cancelled) setViews([]);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const completedSet = useMemo(
    () => new Set((views ?? []).filter((v) => v.completed).map((v) => v.lessonId)),
    [views],
  );
  const inProgressSet = useMemo(
    () =>
      new Set(
        (views ?? [])
          .filter((v) => !v.completed && v.progressPct > 0)
          .map((v) => v.lessonId),
      ),
    [views],
  );

  const allDone = views !== null && areAllLessonsCompleted(flatLessons, views);
  const resumeLessonId =
    flatLessons.find((l) => !completedSet.has(l.id))?.id ?? firstLessonId;
  const hasStarted = (views?.length ?? 0) > 0;
  const ctaLabel = hasStarted ? "Continuar" : "Começar curso";

  function navigate(lessonId: string) {
    router.push(`/cursos/${courseSlug}/aulas/${lessonId}`);
  }

  function handleStart() {
    if (!resumeLessonId) return;
    if (hasEmail) {
      navigate(resumeLessonId);
      return;
    }
    setModalOpen(true);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <Button
          size="lg"
          onClick={handleStart}
          disabled={!resumeLessonId}
          title={!resumeLessonId ? "Curso ainda não tem aulas" : undefined}
        >
          {ctaLabel}
        </Button>
        <div className="flex flex-col gap-1">
          <Button
            size="lg"
            variant={allDone ? "default" : "outline"}
            disabled={!allDone}
            title={
              allDone
                ? "Iniciar prova"
                : "Conclua todas as aulas para liberar a prova"
            }
          >
            Fazer prova
          </Button>
          {!allDone && (
            <span className="text-xs text-muted-foreground">
              Conclua todas as aulas para liberar a prova.
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Conteúdo do curso</h2>
        {modules.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Este curso ainda não tem módulos publicados.
          </p>
        )}
        <ol className="space-y-4">
          {modules.map((mod, idx) => (
            <li
              key={mod.id}
              className="overflow-hidden rounded-lg border border-white/10 bg-card/50"
            >
              <div className="border-b border-white/10 px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Módulo {idx + 1} — {mod.title}
                </h3>
              </div>
              <ul className="divide-y divide-white/10">
                {mod.lessons.length === 0 && (
                  <li className="px-4 py-3 text-xs text-muted-foreground">
                    Nenhuma aula neste módulo.
                  </li>
                )}
                {mod.lessons.map((lesson, lidx) => {
                  const completed = completedSet.has(lesson.id);
                  const inProgress = inProgressSet.has(lesson.id);
                  return (
                    <li key={lesson.id} className="flex items-center justify-between px-4 py-3">
                      <Link
                        href={`/cursos/${courseSlug}/aulas/${lesson.id}`}
                        className="flex flex-1 items-center gap-3 text-sm text-foreground hover:underline"
                      >
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {String(lidx + 1).padStart(2, "0")}
                        </span>
                        <span className="line-clamp-1">{lesson.title}</span>
                      </Link>
                      {completed ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
                          <CheckIcon className="size-3" /> Concluída
                        </span>
                      ) : inProgress ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-300">
                          <PlayIcon className="size-3" /> Em progresso
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      <EmailCaptureModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        courseId={courseId}
        onConfirmed={() => {
          setHasEmail(true);
          if (resumeLessonId) navigate(resumeLessonId);
        }}
      />
    </div>
  );
}
