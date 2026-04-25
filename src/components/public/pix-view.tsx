"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2Icon, CopyIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type PaymentStatus = "pending" | "approved" | "rejected" | "expired";

type StatusResponse = {
  status: PaymentStatus;
  qrCode: string | null;
  qrCodeBase64: string | null;
  expiresAt: string;
};

type Props = {
  slug: string;
  firstLessonId: string | null;
};

// Para simular pagamento aprovado em devMode da AbacatePay manualmente:
//   curl -X POST https://api.abacatepay.com/v2/transparents/simulate-payment \
//     -H "Authorization: Bearer $ABACATEPAY_API_KEY" \
//     -H "Content-Type: application/json" \
//     -d '{"data":{"id":"<gatewayPaymentId>"}}'
export function PixView({ slug, firstLessonId }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const paymentId = params.get("paymentId");

  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!paymentId) return null;
    const res = await fetch(`/api/checkout/status/${paymentId}`);
    if (!res.ok) {
      setError("Não foi possível consultar o pagamento.");
      return null;
    }
    const body = (await res.json()) as StatusResponse;
    setData(body);
    return body;
  }, [paymentId]);

  // Hidrata na montagem
  useEffect(() => {
    if (!paymentId) {
      setError("Link inválido — paymentId ausente.");
      return;
    }
    void fetchStatus();
  }, [paymentId, fetchStatus]);

  // Polling enquanto pendente
  useEffect(() => {
    if (!paymentId) return;
    if (!data || data.status !== "pending") return;
    const interval = setInterval(() => {
      void fetchStatus().then((latest) => {
        if (!latest) return;
        if (latest.status === "approved") {
          toast.success("Pagamento confirmado!");
          setTimeout(() => {
            if (firstLessonId) {
              router.push(`/cursos/${slug}/aulas/${firstLessonId}`);
            } else {
              router.push(`/cursos/${slug}`);
            }
          }, 1500);
        }
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [paymentId, data, fetchStatus, firstLessonId, router, slug]);

  // Contador regressivo
  useEffect(() => {
    if (!data) return;
    const expires = new Date(data.expiresAt).getTime();
    const tick = () => {
      const left = Math.max(0, Math.floor((expires - Date.now()) / 1000));
      setSecondsLeft(left);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [data]);

  function copyBrCode() {
    if (!data?.qrCode) return;
    void navigator.clipboard
      .writeText(data.qrCode)
      .then(() => toast.success("Código Pix copiado!"))
      .catch(() => toast.error("Não foi possível copiar."));
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-destructive">{error}</p>
        <Link
          href={`/cursos/${slug}/comprar`}
          className="mt-4 inline-block text-xs text-muted-foreground underline"
        >
          Voltar para o checkout
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-16 sm:px-6">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Carregando Pix…</p>
      </div>
    );
  }

  if (data.status === "approved") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
        <CheckCircle2Icon className="size-12 text-emerald-400" />
        <h1 className="text-2xl font-semibold">Pagamento confirmado!</h1>
        <p className="text-sm text-muted-foreground">
          Estamos te redirecionando para o curso…
        </p>
      </div>
    );
  }

  if (data.status === "expired" || data.status === "rejected") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {data.status === "expired" ? "Pix expirado" : "Pagamento não aprovado"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Você pode gerar um novo Pix com os mesmos dados.
        </p>
        <Link href={`/cursos/${slug}/comprar`} className="mt-6 inline-block">
          <Button size="lg">Gerar novo Pix</Button>
        </Link>
      </div>
    );
  }

  const mm = Math.floor((secondsLeft ?? 0) / 60);
  const ss = (secondsLeft ?? 0) % 60;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="space-y-6 rounded-lg border border-white/10 bg-card/50 p-6 text-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Pague com Pix</h1>
          <p className="text-sm text-muted-foreground">
            Aponte a câmera do app do seu banco para o QR code abaixo.
          </p>
        </div>

        {data.qrCodeBase64 && (
          <div className="mx-auto inline-block rounded-lg bg-white p-4">
            <img
              src={data.qrCodeBase64}
              alt="QR code Pix"
              className="block size-64 sm:size-72"
            />
          </div>
        )}

        <Button type="button" variant="outline" onClick={copyBrCode} className="gap-2">
          <CopyIcon className="size-4" /> Copiar código Pix
        </Button>

        <div className="flex flex-col items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
            <Loader2Icon className="size-3 animate-spin" /> Aguardando pagamento…
          </span>
          {secondsLeft !== null && (
            <p className="text-xs text-muted-foreground tabular-nums">
              Expira em {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href={`/cursos/${slug}/comprar`}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Voltar
        </Link>
      </div>
    </div>
  );
}
