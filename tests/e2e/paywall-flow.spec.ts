import { type Page, expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const SEED_COURSE_SLUG = "fundamentos-de-engenharia-civil";

const db = new PrismaClient();

async function clearStudentEmail(page: Page) {
  await page.goto("/cursos");
  await page.evaluate(() => {
    try {
      window.localStorage.removeItem("ativa_engenharia_email");
      window.localStorage.removeItem("netflix_cursos_email");
    } catch {
      /* ignore */
    }
  });
}

let courseId = "";
let firstLessonId = "";

test.beforeAll(async () => {
  const course = await db.course.findUnique({
    where: { slug: SEED_COURSE_SLUG },
    select: {
      id: true,
      modules: {
        orderBy: { order: "asc" },
        select: { lessons: { orderBy: { order: "asc" }, select: { id: true } } },
      },
    },
  });
  courseId = course?.id ?? "";
  firstLessonId = course?.modules[0]?.lessons[0]?.id ?? "";
  if (!courseId || !firstLessonId) throw new Error("Seed incompleto");
});

test.afterAll(async () => {
  await db.$disconnect();
});

test.describe("F4 — paywall flow (sem credenciais)", () => {
  test("/comprar mostra form com email + nome + CPF + LGPD", async ({ page }) => {
    await clearStudentEmail(page);
    await page.goto(`/cursos/${SEED_COURSE_SLUG}/comprar`);
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Nome completo")).toBeVisible();
    await expect(page.getByLabel("CPF")).toBeVisible();
    await expect(page.getByRole("button", { name: /Gerar Pix/i })).toBeVisible();
  });

  test("submit com CPF inválido mostra erro inline", async ({ page }) => {
    await clearStudentEmail(page);
    await page.goto(`/cursos/${SEED_COURSE_SLUG}/comprar`);
    await page.getByLabel("Email").fill(`teste-${Date.now()}@example.com`);
    await page.getByLabel("Nome completo").fill("Maria Teste Silva");
    await page.getByLabel("CPF").fill("000.000.000-00");
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: /Gerar Pix/i }).click();
    await expect(page.getByText("CPF inválido")).toBeVisible();
  });

  test("/verificar/CODIGO-INEXISTENTE retorna tela 'Código inválido'", async ({ page }) => {
    await page.goto("/verificar/EC-AAAAAAAA");
    await expect(page.getByRole("heading", { name: /Código inválido/i })).toBeVisible();
  });
});

test.describe("F4 — fixture com enrollment ativo", () => {
  let testEmail = "";

  test.beforeAll(async () => {
    testEmail = `aluno-fix-${Date.now().toString(36)}@example.com`;
    await db.enrollment.upsert({
      where: { studentEmail_courseId: { studentEmail: testEmail, courseId } },
      update: { status: "active" },
      create: { studentEmail: testEmail, courseId, status: "active" },
    });
  });

  test.afterAll(async () => {
    await db.enrollment.deleteMany({ where: { studentEmail: testEmail, courseId } });
  });

  test("aluno com enrollment ativo vê 'Continuar curso' e acessa aulas", async ({ page }) => {
    await page.goto("/cursos");
    await page.evaluate((email) => {
      window.localStorage.setItem("ativa_engenharia_email", email);
    }, testEmail);

    await page.goto(`/cursos/${SEED_COURSE_SLUG}`);
    await expect(page.getByRole("button", { name: /Continuar curso/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: /Comprar acesso/i })).toHaveCount(0);

    await page.goto(`/cursos/${SEED_COURSE_SLUG}/aulas/${firstLessonId}`);
    // Não deve ver tela de bloqueio
    await expect(page.getByRole("heading", { name: /Acesso necessário/i })).toHaveCount(0, {
      timeout: 15_000,
    });
  });
});
