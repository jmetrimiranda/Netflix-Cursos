import { HeroCarousel } from "@/components/public/hero-carousel";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { about } from "@/content/about";
import { buildWhatsAppUrl } from "@/content/contact";
import { seals } from "@/content/seals";
import { categoryLabel } from "@/lib/categories";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { ArrowRight, Award, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Ativa Engenharia — Soluções integradas em engenharia",
  description:
    "Engenharia de climatização, elétrica, mecânica, civil e segurança do trabalho. Cursos online com certificado. Atendimento via WhatsApp 27 99818-3686.",
  path: "/",
});

const heroSlides = [
  {
    src: "/images/landing/hero-01.png",
    alt: "Equipe da Ativa Engenharia em obra",
  },
  {
    src: "/images/landing/hero-02.png",
    alt: "Inspeção técnica em ambiente industrial",
  },
];

const differentiatorIcons = [Award, Sparkles, ShieldCheck, Wrench];

async function loadFeaturedCourses() {
  return db.course.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    take: 3,
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      thumbnailUrl: true,
      workloadHours: true,
    },
  });
}

export default async function HomePage() {
  const featured = await loadFeaturedCourses();

  return (
    <div className="pb-16">
      {/* HERO */}
      <section className="relative">
        <HeroCarousel slides={heroSlides} />
        <div className="pointer-events-none absolute inset-0 flex items-center">
          <div className="pointer-events-auto mx-auto w-full max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl space-y-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                Ativa Engenharia
              </p>
              <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                Soluções integradas em engenharia: segurança, qualidade e excelência.
              </h1>
              <p className="text-base text-white/85 sm:text-lg">
                Climatização, elétrica, mecânica, civil e segurança do trabalho — com responsáveis
                técnicos credenciados pelo CREA e visão preventiva em cada laudo, projeto e
                inspeção.
              </p>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Link
                  href="/cursos"
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "h-11 px-6 text-base",
                  )}
                >
                  Ver cursos
                  <ArrowRight aria-hidden="true" className="ml-1.5 size-4" />
                </Link>
                <Link
                  href={buildWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-11 border-white/40 bg-white/10 px-6 text-base text-white backdrop-blur hover:bg-white/20 hover:text-white",
                  )}
                >
                  Solicitar orçamento
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Por que Ativa Engenharia
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Quatro pilares que orientam cada entrega — do laudo técnico ao curso online.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {about.differentiators.map((item, i) => {
            const Icon = differentiatorIcons[i] ?? Award;
            return (
              <div
                key={item.title}
                className="rounded-lg border border-border bg-card p-6 shadow-sm"
              >
                <div className="mb-3 inline-flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon aria-hidden="true" className="size-5" />
                </div>
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CURSOS EM DESTAQUE */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Cursos em destaque</h2>
              <p className="mt-2 text-base text-muted-foreground">
                Capacitação técnica com certificado pago via Pix e validade vitalícia.
              </p>
            </div>
            <Link
              href="/cursos"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Ver todos os cursos
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
              Cursos serão publicados em breve.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6">
              {featured.map((course) => (
                <li key={course.id}>
                  <Link
                    href={`/cursos/${course.slug}`}
                    className="group block overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10 text-xs uppercase tracking-wider text-primary/80">
                          {categoryLabel(course.category)}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5 p-4">
                      <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                        {categoryLabel(course.category)}
                      </span>
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                        {course.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Carga horária: {course.workloadHours}h
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* SERVIÇOS PREVIEW */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Conheça nossos serviços
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              Projetos, laudos, inspeções e capacitações em engenharia. Atuamos da concepção à
              conformidade legal.
            </p>
          </div>
          <Link
            href="/servicos"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todos os serviços
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Climatização e qualidade do ar (PMOC)",
            "Projetos elétricos e SPDA",
            "Adequação NR12 e NR13",
            "Combate a incêndio e linhas de vida",
            "Inspeção termográfica",
            "PCMSO, PGR, LTCAT e gestão e-Social",
          ].map((label) => (
            <li
              key={label}
              className="rounded-lg border border-border bg-card px-5 py-4 text-sm font-medium text-foreground shadow-sm"
            >
              {label}
            </li>
          ))}
        </ul>
      </section>

      {/* SELOS */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Selos e certificações
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {seals.map((seal) => (
              <div key={seal.label} className="text-center">
                <p className="text-lg font-bold tracking-wide text-foreground">{seal.label}</p>
                <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
                  {seal.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA contato */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-12">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Pronto para um orçamento?
              </h2>
              <p className="mt-2 text-base text-muted-foreground">
                Conte sua demanda no WhatsApp 27 99818-3686 — respondemos no horário comercial.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <WhatsAppButton variant="primary" showNumber />
              <Link href="/contato" aria-label="Ir para a página de contato">
                <Button variant="outline" size="lg" className="h-11 px-6 text-base">
                  Página de contato
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative image preview from logo brand */}
      <Image
        src="/images/brand/logo.png"
        alt=""
        width={1}
        height={1}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
