"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, MessageCircle, RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[ativa-engenharia] global error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            aria-label="Ativa Engenharia — página inicial"
            className="flex items-center gap-2"
          >
            <Image
              src="/images/brand/logo.png"
              alt=""
              width={36}
              height={36}
              className="h-8 w-8 object-contain"
            />
            <span className="text-base font-semibold tracking-tight sm:text-lg">
              Ativa Engenharia
            </span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <div className="max-w-xl text-center">
          <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle aria-hidden="true" className="size-6" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Algo deu errado</h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Encontramos um erro inesperado ao processar sua requisição. Tente novamente em alguns
            instantes — se o problema persistir, fale com a gente pelo WhatsApp.
          </p>
          {error.digest && (
            <p className="mt-3 text-xs text-muted-foreground">
              Código de referência: <span className="font-mono">{error.digest}</span>
            </p>
          )}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              className="h-11 gap-2 px-6 text-base"
              onClick={() => reset()}
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Tentar novamente
            </Button>
            <a
              href="https://wa.me/5527998183686?text=Ol%C3%A1%2C%20encontrei%20um%20erro%20no%20site%20da%20Ativa%20Engenharia."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="h-11 gap-2 px-6 text-base">
                <MessageCircle aria-hidden="true" className="size-4" />
                Falar pelo WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-6 text-xs text-muted-foreground sm:px-6">
          <p>© {new Date().getFullYear()} Ativa Engenharia. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
