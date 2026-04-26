import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página não encontrada — Ativa Engenharia",
  description: "A página que você procurava não está disponível.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
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
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">404</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Página não encontrada
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            O endereço que você acessou não existe, foi movido, ou o link está com erro de
            digitação. Verifique a URL ou volte para a home.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/">
              <Button size="lg" className="h-11 gap-2 px-6 text-base">
                <Home aria-hidden="true" className="size-4" />
                Voltar para a home
              </Button>
            </Link>
            <Link href="/cursos">
              <Button variant="outline" size="lg" className="h-11 gap-2 px-6 text-base">
                <ArrowLeft aria-hidden="true" className="size-4" />
                Ver catálogo de cursos
              </Button>
            </Link>
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
