import { type Page, expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const SEED_COURSE_SLUG = "fundamentos-de-engenharia-civil";
const SEED_COURSE_TITLE = "Fundamentos de Engenharia Civil";
const LONG = 30_000;

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

let firstLessonId = "";

test.beforeAll(async () => {
  const course = await db.course.findUnique({
    where: { slug: SEED_COURSE_SLUG },
    select: {
      modules: {
        orderBy: { order: "asc" },
        select: { lessons: { orderBy: { order: "asc" }, select: { id: true } } },
      },
    },
  });
  firstLessonId = course?.modules[0]?.lessons[0]?.id ?? "";
  if (!firstLessonId) throw new Error("Seed lesson não encontrada");
});

test.afterAll(async () => {
  await db.$disconnect();
});

test.describe
  .serial("public catalog → course → paywall gates", () => {
    test.setTimeout(120_000);

    test("/cursos shows category rows with the seed course", async ({ page }) => {
      await clearStudentEmail(page);
      await page.goto("/cursos");
      await expect(
        page.getByRole("heading", { level: 1, name: "Catálogo de cursos" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Engenharia Civil", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("link").filter({ hasText: SEED_COURSE_TITLE }).first(),
      ).toBeVisible();
    });

    test("course detail without enrollment shows 'Comprar acesso' CTA", async ({ page }) => {
      await clearStudentEmail(page);
      await page.goto(`/cursos/${SEED_COURSE_SLUG}`);
      await expect(page.getByRole("heading", { level: 1, name: SEED_COURSE_TITLE })).toBeVisible();
      const cta = page.getByRole("button", { name: /Comprar acesso/i });
      await expect(cta).toBeVisible({ timeout: LONG });
      const link = page.locator(`a[href="/cursos/${SEED_COURSE_SLUG}/comprar"]`).first();
      await expect(link).toBeVisible();
    });

    test("lesson route without enrollment shows 'Acesso necessário'", async ({ page }) => {
      await clearStudentEmail(page);
      await page.goto(`/cursos/${SEED_COURSE_SLUG}/aulas/${firstLessonId}`);
      await expect(page.getByRole("heading", { level: 1, name: /Acesso necessário/i })).toBeVisible(
        { timeout: LONG },
      );
      await expect(page.getByRole("button", { name: /Comprar acesso/i })).toBeVisible();
    });
  });
