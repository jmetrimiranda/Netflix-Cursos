"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskCpf, validateCpf } from "@/lib/cpf";
import { writeStudentEmail } from "@/lib/student-email";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  courseId: string;
  courseTitle: string;
  priceCents: number;
  slug: string;
};

type FieldErrors = Partial<Record<"email" | "name" | "cpf" | "lgpd" | "form", string>>;

export function CheckoutForm({ courseId, slug }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [lgpd, setLgpd] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function handleCpfChange(raw: string) {
    setCpf(maskCpf(raw));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      next.email = "Email inválido";
    }
    if (name.trim().length < 5) {
      next.name = "Informe seu nome completo";
    }
    if (!validateCpf(cpf)) {
      next.cpf = "CPF inválido";
    }
    if (!lgpd) {
      next.lgpd = "É necessário aceitar para continuar";
    }
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          courseId,
          studentEmail: email.trim().toLowerCase(),
          studentName: name.trim(),
          studentCpf: cpf,
          lgpdConsent: true,
        }),
      });

      if (res.status === 409) {
        toast.success("Você já tem acesso a este curso. Vamos te levar para lá.");
        writeStudentEmail(email.trim().toLowerCase());
        router.push(`/cursos/${slug}`);
        return;
      }

      if (res.status === 503) {
        toast.error("Pagamentos temporariamente indisponíveis. Tente novamente em alguns minutos.");
        setErrors({ form: "Gateway de pagamento indisponível" });
        return;
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? "Não foi possível gerar o Pix.");
        setErrors({ form: body.error ?? "Erro ao processar pagamento" });
        return;
      }

      const data = (await res.json()) as { paymentId: string };
      writeStudentEmail(email.trim().toLowerCase());
      router.push(`/cursos/${slug}/comprar/pix?paymentId=${data.paymentId}`);
    } catch {
      toast.error("Erro de rede. Tente novamente.");
      setErrors({ form: "Falha de rede" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-lg border border-white/10 bg-card/50 p-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome completo</Label>
        <Input
          id="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-xs text-destructive">
            {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => handleCpfChange(e.target.value)}
          aria-invalid={Boolean(errors.cpf)}
          aria-describedby={errors.cpf ? "cpf-error" : undefined}
          maxLength={14}
        />
        {errors.cpf && (
          <p id="cpf-error" className="text-xs text-destructive">
            {errors.cpf}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={lgpd}
            onChange={(e) => setLgpd(e.target.checked)}
            aria-invalid={Boolean(errors.lgpd)}
            aria-describedby={errors.lgpd ? "lgpd-error" : undefined}
            className="mt-0.5"
          />
          <span>
            Li e concordo com a{" "}
            <Link
              href="/privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              Política de Privacidade
            </Link>
            . Autorizo o uso dos meus dados conforme a LGPD para emissão do certificado e contato
            relacionado ao curso.
          </span>
        </label>
        {errors.lgpd && (
          <p id="lgpd-error" className="text-xs text-destructive">
            {errors.lgpd}
          </p>
        )}
      </div>

      {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Gerando Pix…" : "Gerar Pix"}
      </Button>
    </form>
  );
}
