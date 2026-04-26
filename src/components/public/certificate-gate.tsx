"use client";

import { Button } from "@/components/ui/button";
import { readStudentEmail } from "@/lib/student-email";
import { FileDownIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Cert = {
  verificationCode: string;
  pdfUrl: string | null;
  studentName: string;
  courseTitle: string;
  workloadHours: number;
  issuedAt: string;
};

type Props = {
  courseId: string;
  courseSlug: string;
};

export function CertificateGate({ courseId, courseSlug }: Props) {
  const [cert, setCert] = useState<Cert | null | "loading">("loading");

  useEffect(() => {
    const email = readStudentEmail();
    if (!email) {
      setCert(null);
      return;
    }
    let cancelled = false;
    fetch(
      `/api/certificate?courseId=${encodeURIComponent(courseId)}&studentEmail=${encodeURIComponent(email)}`,
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { certificate: Cert | null }) => {
        if (!cancelled) setCert(data.certificate);
      })
      .catch(() => {
        if (!cancelled) setCert(null);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (cert === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="space-y-3 rounded-lg border border-white/10 bg-card/50 p-6 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Certificado não disponível</h1>
          <p className="text-sm text-muted-foreground">
            Você ainda não emitiu certificado para este curso. Conclua todas as aulas e passe na
            prova primeiro.
          </p>
          <Link href={`/cursos/${courseSlug}`}>
            <Button variant="outline">Voltar para o curso</Button>
          </Link>
        </div>
      </div>
    );
  }

  const issued = new Date(cert.issuedAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Seu certificado</h1>
        <p className="text-sm text-muted-foreground">
          Emitido em {issued} · Carga horária {cert.workloadHours}h
        </p>
      </header>

      {cert.pdfUrl ? (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
          <iframe
            src={cert.pdfUrl}
            title="Certificado em PDF"
            className="h-[600px] w-full"
          />
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-card/50 p-6 text-sm text-muted-foreground">
          O PDF do certificado ainda não está disponível para download. Use o código de
          verificação abaixo para confirmar a autenticidade.
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {cert.pdfUrl && (
          <a href={cert.pdfUrl} target="_blank" rel="noreferrer">
            <Button className="gap-2">
              <FileDownIcon className="size-4" /> Baixar PDF
            </Button>
          </a>
        )}
        <Link href={`/verificar/${cert.verificationCode}`}>
          <Button variant="outline">Verificar autenticidade</Button>
        </Link>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Código de verificação: <span className="font-mono text-foreground">{cert.verificationCode}</span>
      </p>
    </div>
  );
}
