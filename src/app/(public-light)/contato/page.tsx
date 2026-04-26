import { ContactForm } from "@/components/public/contact-form";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import { contact } from "@/content/contact";
import { buildMetadata } from "@/lib/seo";
import { AtSign, Globe, Mail, MapPin } from "lucide-react";

export const metadata = buildMetadata({
  title: "Contato",
  description:
    "Solicite um orçamento, tire dúvidas ou fale conosco pelo WhatsApp 27 99818-3686, email ativaengmec@gmail.com ou Instagram @ativaeng.",
  path: "/contato",
});

export default function ContatoPage() {
  return (
    <div className="pb-16">
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Contato</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Vamos conversar sobre o seu projeto?
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            A forma mais rápida de obter resposta é pelo WhatsApp. Você também pode usar o
            formulário abaixo — ele abre o seu cliente de email com a mensagem pronta.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          {/* WhatsApp + Form */}
          <div className="space-y-8">
            <div className="rounded-lg border border-[#25D366]/30 bg-[#25D366]/5 p-6 shadow-sm">
              <h2 className="text-base font-semibold">Prefere WhatsApp? Resposta mais rápida</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Atendimento em horário comercial pela equipe da Ativa Engenharia.
              </p>
              <div className="mt-4">
                <WhatsAppButton variant="primary" showNumber />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-semibold">Envie uma mensagem</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Preenchemos um email com seus dados — basta confirmar no seu cliente de email.
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </div>

          {/* Contatos diretos */}
          <aside className="space-y-4">
            <h2 className="text-lg font-semibold">Contatos diretos</h2>

            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <Mail aria-hidden="true" className="mt-0.5 size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Email</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <AtSign aria-hidden="true" className="mt-0.5 size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Instagram</p>
                  <a
                    href={contact.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {contact.instagram}
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <Globe aria-hidden="true" className="mt-0.5 size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Site</p>
                  <a
                    href={contact.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {contact.website}
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <MapPin aria-hidden="true" className="mt-0.5 size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Atuação</p>
                  <p className="text-sm text-muted-foreground">
                    Sede no Espírito Santo. Atendemos projetos em todo o Brasil com responsáveis
                    técnicos credenciados em CREA-MT, CREA-BA e CREA-ES.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
