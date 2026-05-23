"use client";

import { Button } from "@/components/ui/button";
import { areAllLessonsCompleted } from "@/lib/progress";
import { readStudentEmail } from "@/lib/student-email";
import { CheckIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type LessonItem = { id: string; title: string };
export type ModuleItem = { id: string; title: string; lessons: LessonItem[] };

type ViewState = { lessonId: string; progressPct: number; completed: boolean };
type EnrollmentStatus = "pending_payment" | "active" | "cancelled" | null;

type Props = {
  courseId: string;
  courseSlug: string;
  modules: ModuleItem[];
};

export function CourseDetailGate({ courseId, courseSlug, modules }: Props) {
  const [status, setStatus] = useState<EnrollmentStatus | "loading">("loading");
  const [views, setViews] = useState<ViewState[]>([]);

  const flatLessons = useMemo(() => modules.flatMap((m) => m.lessons), [modules]);
  const firstLessonId = flatLessons[0]?.id ?? null;

  useEffect(() => {
    const email = readStudentEmail();
    if (!email) {
      setStatus(null);
      return;
    }

    let cancelled = false;
    fetch("/api/enrollment", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, studentEmail: email }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(
        (
          data:
            | { exists: false; status: null }
            | { exists: true; status: "pending_payment" | "active" | "cancelled"; enrollmentId: string },
        ) => {
          if (cancelled) return;
          setStatus(data.exists ? data.status : null);
        },
      )
      .catch(() => {
        if (!cancelled) setStatus(null);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  // Quando ativo, busca progresso
  useEffect(() => {
    if (status !== "active") return;
    const email = readStudentEmail();
    if (!email) return;
    let cancelled = false;
    fetch(
      `/api/enrollment/state?courseId=${encodeURIComponent(courseId)}&studentEmail=${encodeURIComponent(email)}`,
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { views: ViewState[] }) => {
        if (!cancelled) setViews(data.views ?? []);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [status, courseId]);

  const completedSet = useMemo(
    () => new Set(views.filter((v) => v.completed).map((v) => v.lessonId)),
    [views],
  );
  const inProgressSet = useMemo(
    () =>
      new Set(views.filter((v) => !v.completed && v.progressPct > 0).map((v) => v.lessonId)),
    [views],
  );

  const allDone = areAllLessonsCompleted(flatLessons, views);
  const resumeLessonId = flatLessons.find((l) => !completedSet.has(l.id))?.id ?? firstLessonId;

  let primaryCta: { label: string; href: string; disabled?: boolean } = {
    label: "Comprar acesso",
    href: `/cursos/${courseSlug}/comprar`,
  };
  if (status === "pending_payment") {
    primaryCta = {
      label: "Finalizar pagamento",
      href: `/cursos/${courseSlug}/comprar?retomar=true`,
    };
  } else if (status === "active" && resumeLessonId) {
    primaryCta = {
      label: "Continuar curso",
      href: `/cursos/${courseSlug}/aulas/${resumeLessonId}`,
    };
  } else if (status === "active" && !resumeLessonId) {
    primaryCta = { label: "Curso sem aulas", href: "#", disabled: true };
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-8">
        <div className="flex flex-wrap gap-3">
          {primaryCta.disabled ? (
            <Button size="lg" disabled>
              {primaryCta.label}
            </Button>
          ) : (
            <Link href={primaryCta.href}>
              <Button size="lg">{primaryCta.label}</Button>
            </Link>
          )}
          <Link href={`/cursos/${courseSlug}/entrar`}>
            <Button size="lg" variant="outline">
              Já comprei? Entrar
            </Button>
          </Link>
          {status === "active" && (
            <Link
              href={
                allDone ? `/cursos/${courseSlug}/aulas/prova` : `/cursos/${courseSlug}`
              }
              aria-disabled={!allDone}
              className={!allDone ? "pointer-events-none" : ""}
            >
              <Button
                size="lg"
                variant={allDone ? "default" : "outline"}
                disabled={!allDone}
                title={
                  allDone ? "Iniciar prova" : "Conclua todas as aulas para liberar a prova"
                }
              >
                Fazer prova
              </Button>
            </Link>
          )}
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
                    const linkable = status === "active";
                    const inner = (
                      <span className="flex flex-1 items-center gap-3 text-sm text-foreground">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {String(lidx + 1).padStart(2, "0")}
                        </span>
                        <span className="line-clamp-1">{lesson.title}</span>
                      </span>
                    );
                    return (
                      <li
                        key={lesson.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        {linkable ? (
                          <Link
                            href={`/cursos/${courseSlug}/aulas/${lesson.id}`}
                            className="flex flex-1 hover:underline"
                          >
                            {inner}
                          </Link>
                        ) : (
                          inner
                        )}
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
      </div>

      <aside className="space-y-3 self-start rounded-lg border border-white/10 bg-card/50 p-5">
        <h3 className="text-sm font-semibold text-foreground">O que está incluído</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <CheckIcon className="size-4 text-emerald-400" /> Acesso vitalício
          </li>
          <li className="flex items-center gap-2">
            <CheckIcon className="size-4 text-emerald-400" /> Certificado incluso
          </li>
          <li className="flex items-center gap-2">
            <CheckIcon className="size-4 text-emerald-400" /> Tentativas ilimitadas na prova
          </li>
        </ul>
      </aside>
    </div>
  );
}
