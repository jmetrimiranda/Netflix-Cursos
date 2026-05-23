"use client";

import { type LessonNavItem, LessonView } from "@/components/public/lesson-view";
import { Button } from "@/components/ui/button";
import { readStudentEmail } from "@/lib/student-email";
import type { JSONContent } from "@tiptap/react";
import { LockIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type EnrollmentStatus = "pending_payment" | "active" | "cancelled" | null;

type Props = {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  lesson: {
    id: string;
    title: string;
    youtubeVideoId: string | null;
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

export function LessonAccessGate(props: Props) {
  const [status, setStatus] = useState<EnrollmentStatus | "loading">("loading");

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
      body: JSON.stringify({ courseId: props.courseId, studentEmail: email }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(
        (
          data:
            | { exists: false; status: null }
            | {
                exists: true;
                status: "pending_payment" | "active" | "cancelled";
                enrollmentId: string;
              },
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
  }, [props.courseId]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (status === "active") {
    return <LessonView {...props} />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="space-y-6 rounded-lg border border-white/10 bg-card/50 p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <LockIcon className="size-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Acesso necessário</h1>
          <p className="text-sm text-muted-foreground">
            {status === "pending_payment"
              ? "Seu pagamento ainda não foi confirmado. Finalize o Pix para liberar o curso."
              : "Para assistir esta aula, compre o acesso ao curso. Pix vitalício, certificado incluso."}
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Link
            href={
              status === "pending_payment"
                ? `/cursos/${props.courseSlug}/comprar?retomar=true`
                : `/cursos/${props.courseSlug}/comprar`
            }
          >
            <Button size="lg">
              {status === "pending_payment" ? "Finalizar pagamento" : "Comprar acesso"}
            </Button>
          </Link>
          <Link
            href={`/cursos/${props.courseSlug}`}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Voltar para o curso
          </Link>
        </div>
      </div>
    </div>
  );
}
