import { expect, test } from "@playwright/test";

test.describe("F5 — 404 e error boundary customizados", () => {
  test("rota inexistente mostra 404 com identidade Ativa", async ({ page }) => {
    const response = await page.goto("/rota-que-nao-existe-42");
    expect(response?.status()).toBe(404);

    await expect(
      page.getByRole("heading", { level: 1, name: /Página não encontrada/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Voltar para a home/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Ver catálogo de cursos/i })).toBeVisible();
  });
});
