import { RecoverAccessForm } from "@/components/public/recover-access-form";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type RouteParams = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildMetadata({
    title: "Já comprei — Entrar",
    description: "Recupere o acesso ao curso informando o email e CPF usados na compra.",
    path: `/cursos/${slug}/entrar`,
  });
}

export default async function EntrarPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const course = await db.course.findUnique({
    where: { slug },
    select: { slug: true, title: true, published: true },
  });
  if (!course || !course.published) notFound();

  return (
    <article className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <Link
        href={`/cursos/${course.slug}`}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ← Voltar para o curso
      </Link>
      <header className="mt-3 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Entrar no curso</h1>
        <p className="text-sm text-muted-foreground">
          Você já comprou este curso? Informe o email e CPF usados na compra para recuperar seu
          acesso.
        </p>
      </header>

      <section className="mt-8 rounded-lg border border-white/10 bg-card/50 p-6">
        <RecoverAccessForm courseSlug={course.slug} />
      </section>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Ainda não comprou?{" "}
        <Link href={`/cursos/${course.slug}`} className="text-primary underline underline-offset-2">
          Ver opções de compra
        </Link>
      </p>
    </article>
  );
}
