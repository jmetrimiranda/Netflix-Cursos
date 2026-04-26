import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCentsToBRL } from "@/lib/money";

async function loadDashboardMetrics() {
  const [coursesPublished, distinctStudents, certificatesIssued, revenue] = await Promise.all([
    db.course.count({ where: { published: true } }),
    db.enrollment.findMany({
      select: { studentEmail: true },
      distinct: ["studentEmail"],
    }),
    db.certificate.count(),
    db.payment.aggregate({
      _sum: { amountCents: true },
      where: { status: "approved" },
    }),
  ]);

  return {
    coursesPublished,
    studentsCount: distinctStudents.length,
    certificatesIssued,
    revenueCents: revenue._sum.amountCents ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const session = await auth();
  const greeting = session?.user?.email === "jorgemetrimiranda@gmail.com" ? "Olá, Jorge" : "Olá";
  const metrics = await loadDashboardMetrics();

  const cards = [
    { label: "Cursos publicados", value: String(metrics.coursesPublished) },
    { label: "Alunos únicos", value: String(metrics.studentsCount) },
    { label: "Certificados emitidos", value: String(metrics.certificatesIssued) },
    { label: "Receita acumulada", value: formatCentsToBRL(metrics.revenueCents) },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{greeting}</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral da plataforma — dados consultados em tempo real do banco.
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
