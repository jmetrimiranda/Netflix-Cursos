"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { maskCpf } from "@/lib/cpf";
import { writeStudentEmail } from "@/lib/student-email";
import {
  type EnrollmentRecoverInput,
  enrollmentRecoverSchema,
} from "@/lib/validations/enrollment-recover";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  courseSlug: string;
};

const GENERIC_DENIED =
  "Não localizamos seu acesso com esses dados. Verifique o email e CPF informados na compra, ou compre o curso se ainda não comprou.";

export function RecoverAccessForm({ courseSlug }: Props) {
  const router = useRouter();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showBuyCta, setShowBuyCta] = useState(false);

  const form = useForm<EnrollmentRecoverInput>({
    resolver: zodResolver(enrollmentRecoverSchema),
    defaultValues: { courseSlug, studentEmail: "", studentCpf: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmissionError(null);
    setShowBuyCta(false);
    try {
      const res = await fetch("/api/enrollment/recover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.status === 429) {
        setSubmissionError("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
        return;
      }

      if (res.status >= 500) {
        setSubmissionError("Erro ao processar. Tente novamente em alguns instantes.");
        return;
      }

      if (!res.ok) {
        setSubmissionError(GENERIC_DENIED);
        setShowBuyCta(true);
        return;
      }

      const data = (await res.json()) as
        | { ok: true; redirectTo: string }
        | { ok: false; reason: string };

      if (!data.ok) {
        setSubmissionError(GENERIC_DENIED);
        setShowBuyCta(true);
        return;
      }

      writeStudentEmail(values.studentEmail);
      toast.success("Acesso liberado. Bom curso!");
      router.push(data.redirectTo);
    } catch {
      setSubmissionError("Erro de rede. Tente novamente.");
    }
  });

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormField
          control={form.control}
          name="studentEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="studentCpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  value={field.value}
                  onChange={(e) => field.onChange(maskCpf(e.target.value))}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Verificando…" : "Entrar no meu curso"}
        </Button>

        {submissionError && (
          <div
            className="space-y-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground"
            role="alert"
            aria-live="polite"
          >
            <p>{submissionError}</p>
            {showBuyCta && (
              <Link href={`/cursos/${courseSlug}/comprar`}>
                <Button type="button" variant="outline" size="sm">
                  Comprar curso
                </Button>
              </Link>
            )}
          </div>
        )}
      </form>
    </Form>
  );
}
