import { expect, test } from "@playwright/test";

test.describe("F3.5 — landing institucional Ativa Engenharia", () => {
  test("/ shows brand mark + 6 nav items + hero CTA", async ({ page }) => {
    await page.goto("/");

    // Brand mark in header
    await expect(
      page.getByRole("banner").getByRole("link", { name: /Ativa Engenharia.*página inicial/i }),
    ).toBeVisible();

    // 6 main nav items reachable (visible at desktop viewport — Playwright defaults wide)
    const nav = page.getByRole("navigation", { name: "Navegação principal" });
    for (const label of ["Home", "Serviços", "Cursos", "Quem Somos", "FAQ", "Contato"]) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }

    // Hero headline + CTA
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Soluções integradas em engenharia/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Ver cursos/i })).toBeVisible();
  });

  test("clicking 'Ver cursos' lands on /cursos with the dark catalog", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("link", { name: /Ver cursos/i })
      .first()
      .click();
    await page.waitForURL("**/cursos", { timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1, name: "Catálogo de cursos" })).toBeVisible();
  });

  test("/contato exposes a wa.me WhatsApp link with the right number", async ({ page }) => {
    await page.goto("/contato");
    const links = page.getByRole("link", { name: /WhatsApp/i });
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    let foundMatching = false;
    for (let i = 0; i < count; i++) {
      const href = (await links.nth(i).getAttribute("href")) ?? "";
      if (href.startsWith("https://wa.me/5527998183686")) {
        foundMatching = true;
        break;
      }
    }
    expect(foundMatching).toBe(true);
  });

  test("/servicos lists at least 6 serviços", async ({ page }) => {
    await page.goto("/servicos");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Soluções de engenharia/i);

    const expected = ["PMOC", "SPDA", "NR-12", "NR-13", "PCMSO", "Inspeção termográfica"];
    for (const term of expected) {
      await expect(page.getByText(term, { exact: false }).first()).toBeVisible();
    }
  });

  test("/quem-somos lists Eduardo Bissoli among the responsáveis técnicos", async ({ page }) => {
    await page.goto("/quem-somos");
    await expect(page.getByText("Eduardo Bissoli").first()).toBeVisible();
    await expect(page.getByText(/CREA MT-038597/i).first()).toBeVisible();
  });
});
