"use client";

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
type ContactFormErrors = Partial<Record<keyof ContactFormData, string>>;

const empty: ContactFormData = { name: "", email: "", phone: "", message: "" };

export function ContactForm() {
  const [data, setData] = useState<ContactFormData>(empty);
  const [errors, setErrors] = useState<ContactFormErrors>({});

  function update<K extends keyof ContactFormData>(
    key: K,
    value: ContactFormData[K],
  ) {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    const subject = `[Site Ativa] Contato de ${parsed.data.name}`;
    const lines = [
      `Nome: ${parsed.data.name}`,
      `Email: ${parsed.data.email}`,
      `Telefone: ${parsed.data.phone}`,
      "",
      "Mensagem:",
      parsed.data.message,
    ];
    const href = `mailto:${contact.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(lines.join("\n"))}`;

    toast.success("Abrindo seu cliente de email...");
    window.location.href = href;
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

      <Button type="submit" size="lg" className="w-full sm:w-auto">
        Enviar mensagem
      </Button>
    </form>
  );
}
