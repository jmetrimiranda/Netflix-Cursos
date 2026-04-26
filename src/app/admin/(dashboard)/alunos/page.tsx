import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import Link from "next/link";

const PAGE_SIZE = 20;

type StudentRow = {
  email: string;
  firstAccess: Date;
  enrollmentsCount: number;
  certificatesCount: number;
};

async function loadStudents(page: number): Promise<{ rows: StudentRow[]; total: number }> {
  // Distinct studentEmails ordered by oldest startedAt desc (recent first signup at top).
  const groups = await db.enrollment.groupBy({
    by: ["studentEmail"],
    _min: { startedAt: true },
    _count: { _all: true },
    orderBy: { _min: { startedAt: "desc" } },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const total = await db.enrollment
    .findMany({ select: { studentEmail: true }, distinct: ["studentEmail"] })
    .then((r) => r.length);

  if (groups.length === 0) return { rows: [], total };

  const emails = groups.map((g) => g.studentEmail);
  const certs = await db.certificate.findMany({
    where: { enrollment: { studentEmail: { in: emails } } },
    select: { enrollment: { select: { studentEmail: true } } },
  });
  const certMap = new Map<string, number>();
  for (const c of certs) {
    const k = c.enrollment.studentEmail;
    certMap.set(k, (certMap.get(k) ?? 0) + 1);
  }

  const rows: StudentRow[] = groups.map((g) => ({
    email: g.studentEmail,
    firstAccess: g._min.startedAt ?? new Date(0),
    enrollmentsCount: g._count._all,
    certificatesCount: certMap.get(g.studentEmail) ?? 0,
  }));

  return { rows, total };
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type SearchParams = { page?: string };

export default async function AdminAlunosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { rows, total } = await loadStudents(page);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Alunos</h1>
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "Nenhum aluno registrado ainda."
            : `${total} ${total === 1 ? "aluno único" : "alunos únicos"} (página ${page} de ${totalPages})`}
        </p>
      </header>

      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Primeiro acesso</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Cursos comprados
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Certificados
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.email} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 font-mono text-xs">{row.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(row.firstAccess)}</td>
                  <td className="px-4 py-3 text-right">{row.enrollmentsCount}</td>
                  <td className="px-4 py-3 text-right">{row.certificatesCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          Quando alguém matricular em um curso, aparece aqui.
        </p>
      )}

      {totalPages > 1 && (
        <nav aria-label="Paginação" className="flex items-center justify-between">
          {page > 1 ? (
            <Link href={`/admin/alunos?page=${page - 1}`}>
              <Button variant="outline" size="sm">
                ← Anterior
              </Button>
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={`/admin/alunos?page=${page + 1}`}>
              <Button variant="outline" size="sm">
                Próxima →
              </Button>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
