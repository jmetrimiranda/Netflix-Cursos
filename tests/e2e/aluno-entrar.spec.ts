import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const SEED_COURSE_SLUG = "fundamentos-de-engenharia-civil";
const VALID_CPF_MASKED = "123.456.789-09";
const VALID_CPF_DIGITS = "12345678909";
const WRONG_CPF_MASKED = "987.654.321-00";

const db = new PrismaClient();

let courseId = "";
let firstLessonId = "";
let testEmail = "";
const createdMpPaymentIds: string[] = [];

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

  testEmail = `aluno-entrar-${Date.now().toString(36)}@example.com`;
  const mpPaymentId = `test-recover-${Date.now().toString(36)}`;
  createdMpPaymentIds.push(mpPaymentId);

  await db.enrollment.upsert({
    where: { studentEmail_courseId: { studentEmail: testEmail, courseId } },
    update: { status: "active" },
    create: { studentEmail: testEmail, courseId, status: "active" },
  });

  const enrollment = await db.enrollment.findUniqueOrThrow({
    where: { studentEmail_courseId: { studentEmail: testEmail, courseId } },
    select: { id: true },
  });

  await db.payment.upsert({
    where: { enrollmentId: enrollment.id },
    update: {
      mpPaymentId,
      studentCpf: VALID_CPF_DIGITS,
      studentName: "Aluno Recover Teste",
      status: "approved",
      amountCents: 9900,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
    create: {
      enrollmentId: enrollment.id,
      mpPaymentId,
      amountCents: 9900,
      status: "approved",
      studentName: "Aluno Recover Teste",
      studentCpf: VALID_CPF_DIGITS,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
});

test.afterAll(async () => {
  await db.payment.deleteMany({ where: { mpPaymentId: { in: createdMpPaymentIds } } });
  await db.enrollment.deleteMany({ where: { studentEmail: testEmail, courseId } });
  await db.$disconnect();
});

test.describe("F6 — /cursos/[slug]/entrar (recover)", () => {
  test("CTA secundário aparece na página do curso e leva pra /entrar", async ({ page }) => {
    await page.goto(`/cursos/${SEED_COURSE_SLUG}`);
    const cta = page.getByRole("button", { name: /Já comprei\? Entrar/i });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(new RegExp(`/cursos/${SEED_COURSE_SLUG}/entrar$`));
    await expect(page.getByRole("heading", { name: /Entrar no curso/i })).toBeVisible();
  });

  test("happy path: email + CPF corretos → redirect pra primeira aula", async ({ page }) => {
    await page.goto(`/cursos/${SEED_COURSE_SLUG}/entrar`);
    await page.getByLabel("Email").fill(testEmail);
    await page.getByLabel("CPF").fill(VALID_CPF_MASKED);
    await page.getByRole("button", { name: /Entrar no meu curso/i }).click();

    await page.waitForURL(`**/cursos/${SEED_COURSE_SLUG}/aulas/${firstLessonId}`, {
      timeout: 15_000,
    });

    const stored = await page.evaluate(() =>
      window.localStorage.getItem("ativa_engenharia_email"),
    );
    expect(stored).toBe(testEmail);
  });

  test("CPF errado mostra mensagem genérica + CTA Comprar curso", async ({ page }) => {
    await page.goto(`/cursos/${SEED_COURSE_SLUG}/entrar`);
    await page.getByLabel("Email").fill(testEmail);
    await page.getByLabel("CPF").fill(WRONG_CPF_MASKED);
    await page.getByRole("button", { name: /Entrar no meu curso/i }).click();

    await expect(page.getByRole("alert")).toContainText(/Não localizamos seu acesso/i);
    await expect(page.getByRole("button", { name: /Comprar curso/i })).toBeVisible();
  });

  test("email inexistente mostra mesma mensagem genérica", async ({ page }) => {
    await page.goto(`/cursos/${SEED_COURSE_SLUG}/entrar`);
    await page
      .getByLabel("Email")
      .fill(`nao-existe-${Date.now().toString(36)}@example.com`);
    await page.getByLabel("CPF").fill(VALID_CPF_MASKED);
    await page.getByRole("button", { name: /Entrar no meu curso/i }).click();

    await expect(page.getByRole("alert")).toContainText(/Não localizamos seu acesso/i);
  });

  test("rate limit: 6 reqs seguidas estouram em algum momento (429)", async ({ request }) => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await request.post("/api/enrollment/recover", {
        data: {
          courseSlug: SEED_COURSE_SLUG,
          studentEmail: `rl-${i}-${Date.now().toString(36)}@example.com`,
          studentCpf: VALID_CPF_DIGITS,
        },
      });
      statuses.push(res.status());
    }
    expect(statuses).toContain(429);
  });
});
