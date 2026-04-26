import { privacy } from "@/content/privacy";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Política de Privacidade",
  description:
    "Como a Ativa Engenharia coleta, usa e protege os dados de alunos e visitantes em conformidade com a LGPD.",
  path: "/privacidade",
});

function renderInline(text: string): React.ReactNode {
  // Suporta **bold** simples; o resto vai como texto puro.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return (
        <strong key={`b-${inner}`} className="font-semibold text-foreground">
          {inner}
        </strong>
      );
    }
    return <span key={`t-${part}`}>{part}</span>;
  });
}

export default function PrivacidadePage() {
  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Privacidade
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Política de Privacidade
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Como a Ativa Engenharia trata seus dados pessoais em conformidade com a LGPD.
          </p>
          <p className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">
            Última atualização: {privacy.lastUpdated}
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6">
        <section className="rounded-lg border border-border bg-card p-6 text-sm leading-relaxed text-foreground shadow-sm sm:p-8">
          <p>{privacy.intro}</p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Controlador</dt>
              <dd className="mt-1 font-medium">{privacy.controller.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">CNPJ</dt>
              <dd className="mt-1 font-medium">{privacy.controller.cnpj}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Encarregado (email)
              </dt>
              <dd className="mt-1">
                <a
                  className="font-medium text-primary hover:underline"
                  href={`mailto:${privacy.controller.contactEmail}`}
                >
                  {privacy.controller.contactEmail}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">WhatsApp</dt>
              <dd className="mt-1 font-medium">{privacy.controller.contactWhatsapp}</dd>
            </div>
          </dl>
        </section>

        {privacy.sections.map((section) => (
          <section key={section.id} id={section.id} className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {section.title}
            </h2>
            {section.paragraphs.map((p, i) => (
              <p
                key={`${section.id}-p-${i}`}
                className="text-sm leading-relaxed text-muted-foreground sm:text-base"
              >
                {renderInline(p)}
              </p>
            ))}
            {section.bullets && (
              <ul className="ml-1 space-y-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {section.bullets.map((b, i) => (
                  <li key={`${section.id}-b-${i}`} className="flex gap-2">
                    <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{renderInline(b)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </article>
    </div>
  );
}
