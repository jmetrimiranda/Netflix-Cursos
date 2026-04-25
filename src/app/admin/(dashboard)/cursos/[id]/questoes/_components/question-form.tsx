"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QUESTION_OPTION_COUNT, type QuestionOption } from "@/lib/validations/question";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createQuestionAction, updateQuestionAction } from "../actions";

type Props = {
  mode: "create" | "edit";
  courseId: string;
  questionId?: string;
  defaults?: {
    statement: string;
    active: boolean;
    options: QuestionOption[];
  };
  onSaved?: () => void;
  onCancel?: () => void;
};

const EMPTY_OPTIONS: QuestionOption[] = Array.from({ length: QUESTION_OPTION_COUNT }, (_, i) => ({
  id: `opt-${i + 1}`,
  text: "",
  isCorrect: i === 0,
}));

export function QuestionForm({ mode, courseId, questionId, defaults, onSaved, onCancel }: Props) {
  const [statement, setStatement] = useState(defaults?.statement ?? "");
  const [active, setActive] = useState(defaults?.active ?? true);
  const [options, setOptions] = useState<QuestionOption[]>(
    defaults?.options && defaults.options.length === QUESTION_OPTION_COUNT
      ? defaults.options
      : EMPTY_OPTIONS,
  );
  const [isPending, startTransition] = useTransition();

  function setOptionText(idx: number, text: string) {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, text } : o)));
  }

  function setCorrect(idx: number) {
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const payload = { statement, active, options };
      const result =
        mode === "create"
          ? await createQuestionAction(courseId, payload)
          : questionId
            ? await updateQuestionAction(questionId, payload)
            : { error: "ID da questão ausente" };
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(mode === "create" ? "Questão criada" : "Questão atualizada");
        if (mode === "create") {
          setStatement("");
          setOptions(EMPTY_OPTIONS);
          setActive(true);
        }
        onSaved?.();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-border bg-card p-4">
      <div className="space-y-2">
        <Label htmlFor={`q-statement-${questionId ?? "new"}`}>Enunciado</Label>
        <Textarea
          id={`q-statement-${questionId ?? "new"}`}
          rows={3}
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Opções (marque a correta)</span>
        {options.map((opt, idx) => (
          <div key={opt.id} className="flex items-center gap-2">
            <input
              type="radio"
              name={`q-correct-${questionId ?? "new"}`}
              checked={opt.isCorrect}
              onChange={() => setCorrect(idx)}
              aria-label={`Marcar opção ${idx + 1} como correta`}
            />
            <Input
              value={opt.text}
              onChange={(e) => setOptionText(idx, e.target.value)}
              placeholder={`Opção ${idx + 1}`}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Checkbox
          id={`q-active-${questionId ?? "new"}`}
          checked={active}
          onCheckedChange={(v) => setActive(v === true)}
        />
        <label htmlFor={`q-active-${questionId ?? "new"}`}>Ativa (entra no sorteio da prova)</label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : mode === "create" ? "Adicionar questão" : "Salvar"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
