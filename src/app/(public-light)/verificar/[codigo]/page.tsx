import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { VERIFICATION_CODE_REGEX } from "@/lib/verification-code";
import { CheckCircle2Icon, FileDownIcon, XCircleIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type RouteParams = { codigo: string };

function maskCpfDigits(d: string): string {
  const digits = d.replace(/\D/g, "");
  if (digits.length !== 11) return d;
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

export default async function VerificarPage({ params }: { params: Promise<RouteParams> }) {
  const { codigo } = await params;
  if (!VERIFICATION_CODE_REGEX.test(codigo)) {
    notFound();
  }

  const cert = await db.certificate.findUnique({
    where: { verificationCode: codigo },
    select: {
      verificationCode: true,
      pdfUrl: true,
      studentName: true,
      studentCpf: true,
      courseTitle: true,
      workloadHours: true,
      issuedAt: true,
    },
  });

  if (!cert) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="space-y-4 rounded-lg border border-border bg-card p-8 text-center">
          <XCircleIcon className="mx-auto size-12 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Código inválido</h1>
          <p className="text-sm text-muted-foreground">
            Não encontramos um certificado para o código <strong>{codigo}</strong>. Verifique se
            digitou corretamente.
          </p>
          <Link
            href="https://wa.me/5527998183686?text=Ol%C3%A1%2C%20preciso%20verificar%20um%20certificado."
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline">Falar com a Ativa pelo WhatsApp</Button>
          </Link>
        </div>
      </div>
    );
  }

  const issued = cert.issuedAt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="space-y-6 rounded-lg border border-border bg-card p-8">
        <div className="flex items-center justify-center gap-2">
          <CheckCircle2Icon className="size-7 text-emerald-600" />
          <h1 className="text-2xl font-bold text-emerald-700">Certificado válido</h1>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Aluno</dt>
            <dd className="text-sm font-medium text-foreground">{cert.studentName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">CPF</dt>
            <dd className="text-sm font-medium text-foreground">
              {maskCpfDigits(cert.studentCpf)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Curso</dt>
            <dd className="text-sm font-medium text-foreground">{cert.courseTitle}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Carga horária</dt>
            <dd className="text-sm font-medium text-foreground">{cert.workloadHours}h</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Emitido em</dt>
            <dd className="text-sm font-medium text-foreground">{issued}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Código</dt>
            <dd className="font-mono text-sm font-medium text-foreground">
              {cert.verificationCode}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <span className="font-medium uppercase tracking-wide">Selos:</span>
          <span>CREA-ES</span>
          <span>·</span>
          <span>ABNT</span>
          <span>·</span>
          <span>CB-ES</span>
        </div>

        {cert.pdfUrl && (
          <a href={cert.pdfUrl} target="_blank" rel="noreferrer">
            <Button className="gap-2">
              <FileDownIcon className="size-4" /> Baixar PDF
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
