import { WhatsAppButton } from "@/components/public/whatsapp-button";
import { Button } from "@/components/ui/button";
import { serviceGroups } from "@/content/services";
import { buildMetadata } from "@/lib/seo";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Serviços",
  description:
    "Climatização (PMOC), elétrica (SPDA, solar), mecânica (NR-12, NR-13), civil, hidráulica, combate a incêndio, segurança do trabalho (PCMSO, PGR, LTCAT) e mais.",
  path: "/servicos",
});

export default function ServicosPage() {
  return (
    <div className="pb-16">
      {/* Hero compacto */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Serviços</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            Soluções de engenharia para empresas que valorizam segurança e qualidade
          </h1>
          <p className="mt-4 max-w-3xl text-base text-muted-foreground sm:text-lg">
            Atuamos em climatização, elétrica, mecânica, civil, hidráulica, combate a incêndio e
            segurança do trabalho — sempre com responsáveis técnicos credenciados pelo CREA.
          </p>
        </div>
      </section>

      {/* Categorias */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {serviceGroups.map((group) => (
            <article
              key={group.slug}
              className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8"
            >
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {group.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{group.description}</p>
              <ul className="mt-5 space-y-2">
                {group.services.map((service) => (
                  <li key={service} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* CTA fim */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-8 shadow-sm sm:p-12">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Solicite um orçamento sem compromisso
              </h2>
              <p className="mt-2 text-base text-muted-foreground">
                Conte sua demanda no WhatsApp 27 99818-3686 ou pelo formulário de contato —
                devolvemos com proposta técnica clara e prazo.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <WhatsAppButton variant="primary" showNumber />
              <Link href="/contato" aria-label="Página de contato">
                <Button variant="outline" size="lg" className="h-11 px-6 text-base">
                  Página de contato
                  <ArrowRight aria-hidden="true" className="ml-1.5 size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
