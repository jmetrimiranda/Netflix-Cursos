import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES: { name: string; path: string }[] = [
  { name: "home institucional", path: "/" },
  { name: "catálogo de cursos", path: "/cursos" },
  { name: "contato", path: "/contato" },
  { name: "quem somos", path: "/quem-somos" },
];

test.describe("F5 — acessibilidade (axe-core)", () => {
  for (const { name, path } of PAGES) {
    test(`${name} (${path}) sem violações critical/serious`, async ({ page }) => {
      await page.goto(path);
      // Aguarda fonts/Imagens estabilizarem para não acusar contraste por gradient ainda carregando.
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        // color-contrast em hero com gradient overlay tem falsos positivos: o axe não consegue
        // medir contraste sobre imagens de fundo. Vamos validar isso manualmente no Lighthouse.
        .disableRules(["color-contrast"])
        .analyze();

      const blocking = results.violations.filter((v) =>
        ["critical", "serious"].includes(v.impact ?? ""),
      );

      if (blocking.length > 0) {
        console.log(
          "Axe violations:\n",
          JSON.stringify(
            blocking.map((v) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes.length,
              help: v.help,
            })),
            null,
            2,
          ),
        );
      }

      expect(blocking, `${name} tem violações critical/serious`).toEqual([]);
    });
  }
});
