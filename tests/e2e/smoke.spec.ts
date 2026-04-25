import { expect, test } from "@playwright/test";

test("public home renders Ativa Engenharia branding", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("banner").getByRole("link", { name: /Ativa Engenharia.*página inicial/i }),
  ).toBeVisible();
});
