"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

type Question = {
  id: string;
  statement: string;
  options: { id: string; text: string }[];
};

type Props = {
  enrollmentId: string;
  courseSlug: string;
  courseTitle: string;
};

type Phase = "intro" | "running" | "result";

type Result = {
  score: number;
  passed: boolean;
  certificate: { verificationCode: string; pdfUrl: string | null } | null;
};

export function ExamView({ enrollmentId, courseSlug, courseTitle }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function start() {
    setStarting(true);
    try {
      const res = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enrollmentId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? "Não foi possível iniciar a prova.");
        return;
      }
      const data = (await res.json()) as { attemptId: string; questions: Question[] };
      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setAnswers({});
      setPhase("running");
    } finally {
      setStarting(false);
    }
  }

  async function submit() {
    if (!attemptId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, answers }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? "Falha ao enviar as respostas.");
        return;
      }
      const data = (await res.json()) as Result;
      setResult(data);
      setPhase("result");
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="space-y-4 rounded-lg border border-white/10 bg-card/50 p-6">
          <h1 className="text-2xl font-semibold text-foreground">Prova — {courseTitle}</h1>
          <p className="text-sm text-muted-foreground">
            As questões são sorteadas aleatoriamente do banco. Você pode tentar quantas vezes
            quiser. Ao passar, seu certificado é emitido automaticamente.
          </p>
          <Button size="lg" onClick={start} disabled={starting}>
            {starting ? "Carregando…" : "Iniciar prova"}
          </Button>
          <Link
            href={`/cursos/${courseSlug}`}
            className="block text-xs text-muted-foreground hover:text-foreground"
          >
            ← Voltar para o curso
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "running") {
    const allAnswered = questions.every((q) => answers[q.id]);
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold text-foreground">Prova — {courseTitle}</h1>
        <ol className="mt-6 space-y-6">
          {questions.map((q, idx) => (
            <li key={q.id} className="rounded-lg border border-white/10 bg-card/50 p-4">
              <p className="text-sm font-medium text-foreground">
                {idx + 1}. {q.statement}
              </p>
              <ul className="mt-3 space-y-2">
                {q.options.map((opt) => (
                  <li key={opt.id}>
                    <label className="flex items-start gap-2 text-sm text-muted-foreground">
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.id}
                        checked={answers[q.id] === opt.id}
                        onChange={() => setAnswers((s) => ({ ...s, [q.id]: opt.id }))}
                        className="mt-1"
                      />
                      <span>{opt.text}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex justify-end">
          <Button size="lg" onClick={submit} disabled={!allAnswered || submitting}>
            {submitting ? "Enviando…" : "Enviar respostas"}
          </Button>
        </div>
      </div>
    );
  }

  if (!result) return null;
  const Icon = result.passed ? CheckCircle2Icon : XCircleIcon;
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="space-y-4 rounded-lg border border-white/10 bg-card/50 p-6 text-center">
        <Icon
          className={`mx-auto size-12 ${result.passed ? "text-emerald-400" : "text-destructive"}`}
        />
        <h1 className="text-2xl font-semibold text-foreground">
          {result.passed ? "Aprovado!" : "Não aprovado"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Sua nota: <span className="font-semibold text-foreground">{result.score.toFixed(1)}</span>
        </p>

        {result.passed && (
          <div className="space-y-2 pt-4">
            <p className="text-sm">Seu certificado foi emitido automaticamente.</p>
            <Link href={`/cursos/${courseSlug}/certificado`}>
              <Button size="lg">Ver certificado</Button>
            </Link>
          </div>
        )}

        {!result.passed && (
          <div className="space-y-2 pt-4">
            <p className="text-sm text-muted-foreground">
              Você pode tentar novamente, sem custos adicionais.
            </p>
            <Button size="lg" onClick={() => setPhase("intro")}>
              Tentar novamente
            </Button>
          </div>
        )}

        <Link
          href={`/cursos/${courseSlug}`}
          className="block pt-2 text-xs text-muted-foreground hover:text-foreground"
        >
          ← Voltar para o curso
        </Link>
      </div>
    </div>
  );
}
