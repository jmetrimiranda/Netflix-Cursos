"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contact } from "@/content/contact";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  email: z.string().trim().email("Email inválido"),
  phone: z.string().trim().min(8, "Telefone muito curto"),
  message: z.string().trim().min(10, "Conte um pouco mais sobre sua demanda"),
});

type ContactFormData = z.infer<typeof contactSchema>;
type ContactFormErrors = Partial<Record<keyof ContactFormData | "lgpd" | "form", string>>;

const empty: ContactFormData = { name: "", email: "", phone: "", message: "" };

export function ContactForm() {
  const [data, setData] = useState<ContactFormData>(empty);
  const [lgpd, setLgpd] = useState(false);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof ContactFormData>(
    key: K,
    value: ContactFormData[K],
  ) {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function fallbackToMailto(values: ContactFormData) {
    const subject = `[Site Ativa] Contato de ${values.name}`;
    const lines = [
      `Nome: ${values.name}`,
      `Email: ${values.email}`,
      `Telefone: ${values.phone}`,
      "",
      "Mensagem:",
      values.message,
    ];
    const href = `mailto:${contact.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(lines.join("\n"))}`;
    window.location.href = href;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = contactSchema.safeParse(data);
    if (!parsed.success) {
      const next: ContactFormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ContactFormData;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    if (!lgpd) {
      setErrors({ lgpd: "É necessário aceitar para continuar" });
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...parsed.data, lgpdConsent: true }),
      });

      if (res.status === 429) {
        toast.error("Muitas mensagens em pouco tempo. Aguarde alguns minutos.");
        setErrors({ form: "Limite de envio atingido — tente em alguns minutos." });
        return;
      }

      if (res.status === 503) {
        toast.message("Vamos abrir seu cliente de email — backend indisponível no momento.");
        fallbackToMailto(parsed.data);
        return;
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? "Não foi possível enviar a mensagem.");
        setErrors({ form: body.error ?? "Erro ao enviar" });
        return;
      }

      toast.success("Mensagem enviada! Responderemos no horário comercial.");
      setData(empty);
      setLgpd(false);
    } catch {
      toast.message("Vamos abrir seu cliente de email — falha de rede.");
      fallbackToMailto(parsed.data);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Nome</Label>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            value={data.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-phone">Telefone</Label>
        <Input
          id="contact-phone"
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(27) 99818-3686"
          value={data.phone}
          onChange={(e) => update("phone", e.target.value)}
          aria-invalid={Boolean(errors.phone)}
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Mensagem</Label>
        <Textarea
          id="contact-message"
          name="message"
          rows={5}
          value={data.message}
          onChange={(e) => update("message", e.target.value)}
          aria-invalid={Boolean(errors.message)}
        />
        {errors.message && (
          <p className="text-xs text-destructive">{errors.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={lgpd}
            onChange={(e) => {
              setLgpd(e.target.checked);
              if (errors.lgpd) setErrors((p) => ({ ...p, lgpd: undefined }));
            }}
            aria-invalid={Boolean(errors.lgpd)}
            aria-describedby={errors.lgpd ? "contact-lgpd-error" : undefined}
            className="mt-0.5"
          />
          <span>
            Li e concordo com a{" "}
            <Link
              href="/privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              Política de Privacidade
            </Link>
            . Autorizo o uso dos meus dados para retorno desta solicitação.
          </span>
        </label>
        {errors.lgpd && (
          <p id="contact-lgpd-error" className="text-xs text-destructive">
            {errors.lgpd}
          </p>
        )}
      </div>

      {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submitting}>
        {submitting ? "Enviando..." : "Enviar mensagem"}
      </Button>
    </form>
  );
}
