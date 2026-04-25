import { expect, test } from "@playwright/test";

test("public home renders header and catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Netflix-Cursos" })).toBeVisible();
});
