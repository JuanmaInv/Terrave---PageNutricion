import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/mock-api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/encuestas/sesiones")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "session-e2e",
          startedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });
      return;
    }

    if (url.endsWith("/encuestas")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
      return;
    }

    await route.fallback();
  });
});

test("debe permitir que el encuestado responda una encuesta válida y vea la confirmación", async ({ page }) => {
  await page.goto("/encuesta");

  await page.getByRole("button", { name: "Femenino" }).click();
  await page.getByRole("button", { name: /Omnívoro/i }).click();
  await page.getByRole("button", { name: /Continuar/i }).click();

  await page.getByLabel(/Monto estimado/i).fill("4500");
  await page
    .getByLabel(/Comentarios descriptivos|Comentarios \/ Observaciones/i)
    .fill("Perfil sensorial equilibrado y sin defectos.");
  await page.getByRole("button", { name: /Continuar/i }).click();

  await page.getByRole("button", { name: /^Me gusta\s*4$/ }).click();
  await page.locator("button").filter({ hasText: /^Sí$/ }).first().click();
  await page.locator("button").filter({ hasText: /^Sí$/ }).nth(1).click();
  await page
    .getByLabel(/Comentarios afectivos|Comentarios finales/i)
    .fill("Me gustó el sabor general y la textura.");
  await page.getByRole("button", { name: /Enviar evaluación/i }).click();

  await expect(page.getByText(/Gracias por participar/i)).toBeVisible();
});
