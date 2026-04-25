import { type Page, expect, test } from "@playwright/test";

const ADMIN_EMAIL = "jorgemetrimiranda@gmail.com";
const ADMIN_PASSWORD = "31415926";
const LONG = 30_000;

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Senha").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/admin", { timeout: LONG });
}

test.describe
  .serial("admin CMS — course / module / lesson / question", () => {
    test.setTimeout(120_000);

    const suffix = Date.now().toString(36);
    const courseTitle = `Curso de Teste ${suffix}`;
    const moduleTitle = `Módulo Inicial ${suffix}`;
    const lessonTitle = `Aula 1 ${suffix}`;
    const questionStatement = `Questão de teste ${suffix}`;

    test("admin creates a course, module, lesson and question and they persist", async ({
      page,
    }) => {
      await login(page);

      await page.goto("/admin/cursos");
      await page.getByRole("link", { name: "Novo curso" }).click();
      await page.waitForURL("**/admin/cursos/novo", { timeout: LONG });

      await page.getByLabel("Título").fill(courseTitle);
      await page
        .getByLabel("Descrição")
        .fill("Curso criado pelo Playwright para validar o CMS de cursos.");
      await page.getByLabel("Carga horária (horas)").fill("12");
      await page.getByLabel("Preço (BRL)").fill("199,00");
      await page.getByLabel("Preço (BRL)").blur();
      await page.getByRole("button", { name: "Criar curso" }).click();

      await page.waitForURL(/\/admin\/cursos\/(?!novo$)[^/]+$/, { timeout: LONG });
      await expect(page.getByRole("heading", { name: new RegExp(courseTitle) })).toBeVisible({
        timeout: LONG,
      });

      await page.getByPlaceholder("Ex: Fundamentos").fill(moduleTitle);
      await page.getByRole("button", { name: "Adicionar" }).click();
      await expect(page.getByText(moduleTitle)).toBeVisible({ timeout: LONG });
      await page.waitForLoadState("networkidle");

      await page.getByRole("button", { name: "Nova aula" }).click();
      await expect(page.getByLabel("Título da aula")).toBeVisible({ timeout: LONG });
      await page.getByLabel("Título da aula").fill(lessonTitle);
      await page.getByRole("button", { name: "Criar aula" }).click();
      await expect(page.getByText(lessonTitle).first()).toBeVisible({ timeout: LONG });

      await page.getByRole("link", { name: "Banco de questões" }).click();
      await page.waitForURL(/\/questoes$/, { timeout: LONG });
      await page.getByRole("button", { name: "Nova questão" }).click();
      await page.getByLabel("Enunciado").fill(questionStatement);
      const optionInputs = page.getByPlaceholder(/^Opção \d+$/);
      await optionInputs.nth(0).fill("Alternativa A");
      await optionInputs.nth(1).fill("Alternativa B");
      await optionInputs.nth(2).fill("Alternativa C");
      await optionInputs.nth(3).fill("Alternativa D");
      await page.getByRole("button", { name: "Adicionar questão" }).click();
      await expect(page.getByText(questionStatement)).toBeVisible({ timeout: LONG });

      await page.reload();
      await expect(page.getByText(questionStatement)).toBeVisible({ timeout: LONG });

      await page.goto("/admin/cursos");
      await expect(page.getByText(courseTitle)).toBeVisible({ timeout: LONG });
      await page
        .locator("li", { hasText: courseTitle })
        .getByRole("link", { name: "Editar" })
        .click();
      await page.waitForURL(/\/admin\/cursos\/(?!novo$)[^/]+$/, { timeout: LONG });
      await expect(page.getByText(moduleTitle)).toBeVisible({ timeout: LONG });
      await expect(page.getByText(lessonTitle).first()).toBeVisible({ timeout: LONG });
    });
  });
