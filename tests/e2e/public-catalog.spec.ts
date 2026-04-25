import { type Page, expect, test } from "@playwright/test";

const SEED_COURSE_SLUG = "fundamentos-de-engenharia-civil";
const SEED_COURSE_TITLE = "Fundamentos de Engenharia Civil";
const SEED_LESSON_TITLE = "Boas-vindas ao curso";
const STUDENT_EMAIL = `aluno-${Date.now().toString(36)}@example.com`;
const LONG = 30_000;

async function clearStudentEmail(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    try {
      window.localStorage.removeItem("netflix_cursos_email");
    } catch {
      /* ignore */
    }
  });
}

test.describe
  .serial("public catalog → course → lesson", () => {
    test.setTimeout(120_000);

    test("home shows hero and category rows", async ({ page }) => {
      await clearStudentEmail(page);
      await page.goto("/");
      await expect(page.getByRole("link", { name: "Netflix-Cursos" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Começar curso" }).first()).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Engenharia Civil", exact: true }),
      ).toBeVisible();
    });

    test("clicking a course card navigates to the course page", async ({ page }) => {
      await clearStudentEmail(page);
      await page.goto("/");
      await page.getByRole("link").filter({ hasText: SEED_COURSE_TITLE }).first().click();
      await page.waitForURL(`**/cursos/${SEED_COURSE_SLUG}`, { timeout: LONG });
      await expect(page.getByRole("heading", { level: 1, name: SEED_COURSE_TITLE })).toBeVisible();
      await expect(page.getByRole("button", { name: "Começar curso" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Fazer prova" })).toBeDisabled();
    });

    test("email modal flow → first lesson + persistence + in-progress chip", async ({ page }) => {
      await clearStudentEmail(page);
      await page.goto(`/cursos/${SEED_COURSE_SLUG}`);

      await page.getByRole("button", { name: "Começar curso" }).click();
      const dialog = page.getByRole("dialog", { name: /Informe seu email/i });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("textbox", { name: "Email" }).fill(STUDENT_EMAIL);
      await dialog.getByRole("checkbox").click();
      await dialog.getByRole("button", { name: "Continuar" }).click();

      await page.waitForURL(/\/cursos\/.+\/aulas\/.+$/, { timeout: LONG });
      await expect(page.getByRole("heading", { level: 1, name: SEED_LESSON_TITLE })).toBeVisible();

      const stored = await page.evaluate(() => window.localStorage.getItem("netflix_cursos_email"));
      expect(stored).toBe(STUDENT_EMAIL);

      await page.reload();
      await expect(page.getByRole("heading", { level: 1, name: SEED_LESSON_TITLE })).toBeVisible();
      await expect(page.getByRole("dialog", { name: /Informe seu email/i })).toHaveCount(0);

      // Aguarda o flush de progresso (>10s) para a aula aparecer "Em progresso".
      await expect(page.getByText(/Em progresso/i).first()).toBeVisible({ timeout: 30_000 });
    });
  });
