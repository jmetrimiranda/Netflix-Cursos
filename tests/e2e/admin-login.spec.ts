import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = "jorgemetrimiranda@gmail.com";
const ADMIN_PASSWORD = "31415926";

test.describe("admin login", () => {
  test("logs in with valid credentials and lands on dashboard", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Senha").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();

    await page.waitForURL("**/admin");
    await expect(page.getByRole("heading", { name: "Olá, Jorge" })).toBeVisible();
  });

  test("shows generic toast on invalid credentials and stays on /admin/login", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Senha").fill("definitivamente-errada");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("Email ou senha inválidos")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("redirects to /admin/login when accessing /admin without a session", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login(\?|$)/);
  });
});
