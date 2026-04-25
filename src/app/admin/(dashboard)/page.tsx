import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";

const metrics = [
  { label: "Total de cursos", value: "0" },
  { label: "Alunos", value: "0" },
  { label: "Certificados emitidos", value: "0" },
  { label: "Receita", value: "R$ 0,00" },
];

export default async function AdminDashboardPage() {
  const session = await auth();
  const greeting = session?.user?.email === "jorgemetrimiranda@gmail.com" ? "Olá, Jorge" : "Olá";

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{greeting}</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral do painel. Os dados ainda não estão conectados.
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
