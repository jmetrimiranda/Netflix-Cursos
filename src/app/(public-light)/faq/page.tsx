import { FaqAccordion } from "@/components/public/faq-accordion";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import { faq } from "@/content/faq";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perguntas frequentes — Ativa Engenharia",
  description:
    "Tire dúvidas sobre matrícula em cursos, certificado, formas de pagamento, atendimento e responsáveis técnicos da Ativa Engenharia.",
};

export default function FaqPage() {
  return (
    <div className="pb-16">
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">FAQ</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Perguntas frequentes
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Respostas rápidas para as dúvidas mais comuns. Se não encontrar o que procura, fale com
            a gente pelo WhatsApp.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <FaqAccordion items={faq} />
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-12 sm:px-6">
        <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold">Sua dúvida não está aqui?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre em contato pelo WhatsApp 27 99818-3686 — respondemos no horário comercial.
          </p>
          <div className="mt-5 inline-flex">
            <WhatsAppButton variant="primary" showNumber />
          </div>
        </div>
      </section>
    </div>
  );
}
