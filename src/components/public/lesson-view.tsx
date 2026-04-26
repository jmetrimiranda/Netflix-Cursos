"use client";

import { LessonPlayer } from "@/components/public/lesson-player";
import { ProgressTracker } from "@/components/public/progress-tracker";
import { TiptapRenderer } from "@/components/public/tiptap-renderer";
import { Button } from "@/components/ui/button";
import { COMPLETED_THRESHOLD_PCT } from "@/lib/progress";
import { readStudentEmail } from "@/lib/student-email";
import type { JSONContent } from "@tiptap/react";
import { ArrowLeftIcon, CheckIcon, FileDownIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export type LessonNavItem = {
  id: string;
  title: string;
};

type LessonState = {
  progressPct: number;
  completed: boolean;
};

type Props = {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  lesson: {
    id: string;
    title: string;
    bunnyVideoId: string | null;
    bunnyLibraryId: string | null;
    durationSeconds: number | null;
    sidebarContent: JSONContent | null;
    sidebarPdfUrl: string | null;
  };
  index: number;
  total: number;
  prevLessonId: string | null;
  nextLessonId: string | null;
  siblingLessons: LessonNavItem[];
};

type EnrollmentState = {
  enrollmentId: string;
  byLesson: Map<string, LessonState>;
};

export function LessonView({
  courseId,
  courseSlug,
  courseTitle,
  lesson,
  index,
  total,
  prevLessonId,
  nextLessonId,
  siblingLessons,
}: Props) {
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const studentEmail = readStudentEmail();
    if (!studentEmail) {
      setBootstrapped(true);
      return;
    }
    let cancelled = false;
    fetch(
      `/api/enrollment/state?courseId=${encodeURIComponent(courseId)}&studentEmail=${encodeURIComponent(studentEmail)}`,
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(
        (data: {
          enrollmentId: string | null;
          status: "pending_payment" | "active" | "cancelled" | null;
          views: Array<{ lessonId: string; progressPct: number; completed: boolean }>;
        }) => {
          if (cancelled) return;
          if (!data.enrollmentId || data.status !== "active") return;
          const byLesson = new Map<string, LessonState>();
          for (const v of data.views) {
            byLesson.set(v.lessonId, { progressPct: v.progressPct, completed: v.completed });
          }
          setEnrollment({ enrollmentId: data.enrollmentId, byLesson });
        },
      )
      .catch(() => {
        /* ignore */
      })
      .finally(() => {
        if (!cancelled) setBootstrapped(true);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const lessonState = enrollment?.byLesson.get(lesson.id) ?? null;
  const optimisticPct = lessonState?.progressPct ?? 0;
  const isCompleted = (lessonState?.completed ?? false) || optimisticPct >= COMPLETED_THRESHOLD_PCT;
  const isInProgress = !isCompleted && optimisticPct > 0;

  const completedSet = useMemo(() => {
    const set = new Set<string>();
    if (!enrollment) return set;
    for (const [id, st] of enrollment.byLesson) {
      if (st.completed) set.add(id);
    }
    return set;
  }, [enrollment]);

  const inProgressSet = useMemo(() => {
    const set = new Set<string>();
    if (!enrollment) return set;
    for (const [id, st] of enrollment.byLesson) {
      if (!st.completed && st.progressPct > 0) set.add(id);
    }
    return set;
  }, [enrollment]);

  const applyProgressUpdate = useCallback(
    (data: { progressPct: number; completed: boolean }) => {
      setEnrollment((prev) => {
        if (!prev) return prev;
        const current = prev.byLesson.get(lesson.id);
        if (
          current &&
          current.progressPct >= data.progressPct &&
          current.completed === data.completed
        ) {
          return prev;
        }
        const next = new Map(prev.byLesson);
        next.set(lesson.id, {
          progressPct: Math.max(current?.progressPct ?? 0, data.progressPct),
          completed: (current?.completed ?? false) || data.completed,
        });
        return { ...prev, byLesson: next };
      });
    },
    [lesson.id],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-col gap-2">
        <Link
          href={`/cursos/${courseSlug}`}
          className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3" /> {courseTitle}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              Aula {index + 1} de {total}
            </p>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{lesson.title}</h1>
          </div>
          <div>
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">
                <CheckIcon className="size-3.5" /> Concluída
              </span>
            ) : isInProgress ? (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-300">
                <PlayIcon className="size-3.5" /> Em progresso
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <LessonPlayer
            libraryId={lesson.bunnyLibraryId}
            videoId={lesson.bunnyVideoId}
            title={lesson.title}
          />
          <div className="flex items-center justify-between gap-2">
            {prevLessonId ? (
              <Link
                href={`/cursos/${courseSlug}/aulas/${prevLessonId}`}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ← Aula anterior
              </Link>
            ) : (
              <span />
            )}
            {nextLessonId ? (
              <Link href={`/cursos/${courseSlug}/aulas/${nextLessonId}`}>
                <Button size="sm" variant="outline">
                  Próxima aula →
                </Button>
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground">Última aula do curso</span>
            )}
          </div>
        </div>

        <aside className="space-y-4 rounded-lg border border-white/10 bg-card/50 p-4">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-foreground">Material da aula</h2>
            <TiptapRenderer content={lesson.sidebarContent} />
          </div>
          {lesson.sidebarPdfUrl && (
            <a
              href={lesson.sidebarPdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <FileDownIcon className="size-4" /> Baixar PDF
            </a>
          )}
          <div className="border-t border-white/10 pt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Aulas do curso
            </h3>
            <ol className="space-y-1 text-xs">
              {siblingLessons.map((l, idx) => {
                const completed = completedSet.has(l.id);
                const inProg = inProgressSet.has(l.id);
                const isCurrent = l.id === lesson.id;
                return (
                  <li key={l.id}>
                    <Link
                      href={`/cursos/${courseSlug}/aulas/${l.id}`}
                      className={`flex items-center gap-2 rounded px-2 py-1 ${
                        isCurrent
                          ? "bg-white/10 text-foreground"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      <span className="w-6 tabular-nums text-[10px]">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="line-clamp-1 flex-1">{l.title}</span>
                      {completed ? (
                        <CheckIcon className="size-3 text-emerald-400" />
                      ) : inProg ? (
                        <PlayIcon className="size-3 text-amber-400" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </div>

      {enrollment && (
        <ProgressTracker
          enrollmentId={enrollment.enrollmentId}
          lessonId={lesson.id}
          durationSeconds={lesson.durationSeconds}
          initialProgressPct={optimisticPct}
          onProgressUpdate={applyProgressUpdate}
        />
      )}

      {!bootstrapped && (
        <p className="sr-only" aria-live="polite">
          Carregando progresso…
        </p>
      )}
    </div>
  );
}
