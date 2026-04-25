import { expect, test } from "@playwright/test";

test("home page renders placeholder copy", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Netflix-Cursos — em construção")).toBeVisible();
});
