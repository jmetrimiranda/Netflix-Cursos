import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { db } from "../src/lib/db";

async function confirm(prompt: string): Promise<boolean> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = (await rl.question(prompt)).trim().toLowerCase();
    return answer === "y" || answer === "yes" || answer === "s" || answer === "sim";
  } finally {
    rl.close();
  }
}

async function main() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const candidates = await db.course.findMany({
    where: {
      OR: [
        { AND: [{ published: false }, { createdAt: { lt: oneDayAgo } }] },
        { slug: { startsWith: "curso-de-teste-" } },
        { slug: "computacao" },
      ],
    },
    select: { id: true, slug: true, title: true, published: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  if (candidates.length === 0) {
    console.log("Nada para apagar. Banco já está limpo.");
    return;
  }

  console.log(`Encontrados ${candidates.length} cursos candidatos a remoção:`);
  for (const c of candidates) {
    console.log(
      `  - [${c.published ? "pub" : "draft"}] ${c.slug} (${c.title}) — criado em ${c.createdAt.toISOString()}`,
    );
  }

  const ok = await confirm("\nConfirmar remoção desses cursos? (y/n) ");
  if (!ok) {
    console.log("Cancelado.");
    return;
  }

  const result = await db.course.deleteMany({
    where: { id: { in: candidates.map((c) => c.id) } },
  });
  console.log(`Removidos ${result.count} cursos.`);
}

main()
  .catch((err) => {
    console.error("Falhou:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
