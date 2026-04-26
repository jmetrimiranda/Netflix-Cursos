import { about } from "@/content/about";
import { team } from "@/content/team";
import { buildMetadata } from "@/lib/seo";
import Image from "next/image";

export const metadata = buildMetadata({
  title: "Quem somos",
  description:
    "Empresa de engenharia atuante no Espírito Santo com responsáveis técnicos credenciados pelo CREA. Missão, visão preventiva e responsabilidade ambiental.",
  path: "/quem-somos",
});

export default function QuemSomosPage() {
  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {about.hero.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            {about.hero.headline}
          </h1>
          <p className="mt-4 max-w-3xl text-base text-muted-foreground sm:text-lg">
            {about.hero.description}
          </p>
        </div>
      </section>

      {/* Imagem da equipe */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
          <Image
            src="/images/landing/hero-02.png"
            alt="Equipe da Ativa Engenharia em campo"
            fill
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* Missão / Visão / Responsabilidade */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {[about.mission, about.vision, about.responsibility].map((block) => (
            <article
              key={block.title}
              className="rounded-lg border border-border bg-card p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-foreground">{block.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{block.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Responsáveis técnicos */}
      <section className="mx-auto max-w-7xl px-4 pt-4 pb-12 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Responsáveis técnicos</h2>
          <p className="mt-2 text-base text-muted-foreground">
            Engenheiros credenciados pelo CREA assinando cada laudo, projeto e ART emitida.
          </p>
        </div>
        <ul className="grid gap-4 md:grid-cols-3">
          {team.map((member) => (
            <li key={member.crea} className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <p className="text-base font-semibold text-foreground">{member.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-primary">
                {member.crea}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
