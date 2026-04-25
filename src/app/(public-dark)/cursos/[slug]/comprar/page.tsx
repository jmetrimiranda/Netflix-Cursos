import { CheckoutForm } from "@/components/public/checkout-form";
import { db } from "@/lib/db";
import { formatCentsToBRL } from "@/lib/money";
import Link from "next/link";
import { notFound } from "next/navigation";

type RouteParams = { slug: string };

export default async function ComprarPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const course = await db.course.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, priceCents: true, published: true },
  });
  if (!course || !course.published) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link
        href={`/cursos/${course.slug}`}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ← Voltar para o curso
      </Link>
      <header className="mt-3 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{course.title}</h1>
        <p className="text-sm text-muted-foreground">
          Acesso vitalício + certificado · pagamento único via Pix
        </p>
        <p className="text-2xl font-bold text-foreground">{formatCentsToBRL(course.priceCents)}</p>
      </header>

      <section className="mt-8">
        <CheckoutForm
          courseId={course.id}
          courseTitle={course.title}
          priceCents={course.priceCents}
          slug={course.slug}
        />
      </section>
    </article>
  );
}
