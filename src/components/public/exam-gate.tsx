"use client";

import { ExamView } from "@/components/public/exam-view";
import { Button } from "@/components/ui/button";
import { areAllLessonsCompleted } from "@/lib/progress";
import { readStudentEmail } from "@/lib/student-email";
import { LockIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  lessons: { id: string; title: string }[];
};

type EnrollmentState = {
  status: "pending_payment" | "active" | "cancelled" | null;
  enrollmentId: string | null;
  views: { lessonId: string; progressPct: number; completed: boolean }[];
};

export function ExamGate({ courseId, courseSlug, courseTitle, lessons }: Props) {
  const [state, setState] = useState<EnrollmentState | "loading">("loading");

  useEffect(() => {
    const email = readStudentEmail();
    if (!email) {
      setState({ status: null, enrollmentId: null, views: [] });
      return;
    }
    let cancelled = false;
    fetch(
      `/api/enrollment/state?courseId=${encodeURIComponent(courseId)}&studentEmail=${encodeURIComponent(email)}`,
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(
        (data: {
          enrollmentId: string | null;
          status: "pending_payment" | "active" | "cancelled" | null;
          views: { lessonId: string; progressPct: number; completed: boolean }[];
        }) => {
          if (cancelled) return;
          setState({
            status: data.status,
            enrollmentId: data.enrollmentId,
            views: data.views ?? [],
          });
        },
      )
      .catch(() => {
        if (!cancelled) setState({ status: null, enrollmentId: null, views: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (state.status !== "active" || !state.enrollmentId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="space-y-6 rounded-lg border border-white/10 bg-card/50 p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <LockIcon className="size-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">Acesso necessário</h1>
            <p className="text-sm text-muted-foreground">
              Para fazer a prova, é preciso ter acesso ativo ao curso.
            </p>
          </div>
          <Link
            href={
              state.status === "pending_payment"
                ? `/cursos/${courseSlug}/comprar?retomar=true`
                : `/cursos/${courseSlug}/comprar`
            }
          >
            <Button size="lg">
              {state.status === "pending_payment" ? "Finalizar pagamento" : "Comprar acesso"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const allDone = areAllLessonsCompleted(lessons, state.views);
  if (!allDone) {
    const completedSet = new Set(state.views.filter((v) => v.completed).map((v) => v.lessonId));
    const missing = lessons.filter((l) => !completedSet.has(l.id));
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="space-y-4 rounded-lg border border-white/10 bg-card/50 p-6">
          <h1 className="text-2xl font-semibold text-foreground">Prova ainda não liberada</h1>
          <p className="text-sm text-muted-foreground">
            Conclua todas as aulas pra liberar a prova:
          </p>
          <ul className="space-y-1 text-sm">
            {missing.map((m) => (
              <li key={m.id} className="text-muted-foreground">
                • {m.title}
              </li>
            ))}
          </ul>
          <Link href={`/cursos/${courseSlug}`}>
            <Button variant="outline">Voltar para o curso</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ExamView
      enrollmentId={state.enrollmentId}
      courseSlug={courseSlug}
      courseTitle={courseTitle}
    />
  );
}
