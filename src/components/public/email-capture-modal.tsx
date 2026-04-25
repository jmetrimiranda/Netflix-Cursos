"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { writeStudentEmail } from "@/lib/student-email";
import { enrollmentInputSchema } from "@/lib/validations/enrollment";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  onConfirmed: (data: { studentEmail: string; enrollmentId: string }) => void;
};

export function EmailCaptureModal({ open, onOpenChange, courseId, onConfirmed }: Props) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) {
      toast.error("É necessário aceitar a coleta do email para continuar.");
      return;
    }
    const parsed = enrollmentInputSchema.safeParse({ courseId, studentEmail: email });
    if (!parsed.success) {
      toast.error("Email inválido. Verifique e tente novamente.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/enrollment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        toast.error("Não foi possível registrar seu email. Tente novamente.");
        return;
      }
      const data = (await res.json()) as { enrollmentId: string };
      writeStudentEmail(parsed.data.studentEmail);
      onConfirmed({ studentEmail: parsed.data.studentEmail, enrollmentId: data.enrollmentId });
      onOpenChange(false);
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Informe seu email para começar</DialogTitle>
          <DialogDescription>
            Usamos seu email apenas para acompanhar seu progresso no curso e enviar seu certificado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="capture-email">Email</Label>
            <Input
              id="capture-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
            />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="capture-consent"
              checked={consent}
              onCheckedChange={(v) => setConsent(v === true)}
            />
            <Label htmlFor="capture-consent" className="text-xs text-muted-foreground">
              Concordo com a coleta do meu email para acompanhar meu progresso e receber meu
              certificado.
            </Label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Confirmando…" : "Continuar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
