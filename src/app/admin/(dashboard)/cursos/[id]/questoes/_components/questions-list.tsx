"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QuestionOption } from "@/lib/validations/question";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteQuestionAction, toggleQuestionActiveAction } from "../actions";
import { QuestionForm } from "./question-form";

export type QuestionItem = {
  id: string;
  statement: string;
  active: boolean;
  options: QuestionOption[];
};

type Props = {
  courseId: string;
  questions: QuestionItem[];
};

export function QuestionsList({ courseId, questions }: Props) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      const result = await toggleQuestionActiveAction(id, active);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      window.location.reload();
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("Excluir esta questão?")) return;
    startTransition(async () => {
      const result = await deleteQuestionAction(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      window.location.reload();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {questions.length} {questions.length === 1 ? "questão" : "questões"} no banco
          {questions.length > 0 ? ` · ${questions.filter((q) => q.active).length} ativa(s)` : ""}
        </p>
        {creating ? null : (
          <Button type="button" onClick={() => setCreating(true)}>
            Nova questão
          </Button>
        )}
      </div>

      {creating ? (
        <QuestionForm
          mode="create"
          courseId={courseId}
          onSaved={() => setCreating(false)}
          onCancel={() => setCreating(false)}
        />
      ) : null}

      {questions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhuma questão ainda. Adicione a primeira acima.
        </div>
      ) : (
        <ul className="space-y-3">
          {questions.map((q, idx) => {
            const correct = q.options.find((o) => o.isCorrect);
            const isEditing = editingId === q.id;
            return (
              <li key={q.id} className="rounded-md border border-border bg-card p-4">
                {isEditing ? (
                  <QuestionForm
                    mode="edit"
                    courseId={courseId}
                    questionId={q.id}
                    defaults={{
                      statement: q.statement,
                      active: q.active,
                      options: q.options,
                    }}
                    onSaved={() => setEditingId(null)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">
                        {idx + 1}. {q.statement}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        {q.active ? <Badge>Ativa</Badge> : <Badge variant="outline">Inativa</Badge>}
                      </div>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {q.options.map((opt) => (
                        <li
                          key={opt.id}
                          className={opt.isCorrect ? "text-foreground" : "text-muted-foreground"}
                        >
                          {opt.isCorrect ? "✓ " : "○ "}
                          {opt.text}
                        </li>
                      ))}
                    </ul>
                    {!correct ? (
                      <p className="text-xs text-destructive">
                        Sem opção correta marcada — corrija ao editar.
                      </p>
                    ) : null}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(q.id, !q.active)}
                      >
                        {q.active ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(q.id)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(q.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
