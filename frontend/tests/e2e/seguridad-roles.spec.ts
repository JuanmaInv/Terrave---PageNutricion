import { expect, test } from "@playwright/test";

test("debe impedir que un cliente acceda al dashboard admin", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("nutrilen.e2eRole", "client");
  });

  await page.goto("/administrador");

  await expect(
    page.getByRole("heading", {
      name: /esta seccion es solo para el equipo terrave/i,
    }),
  ).toBeVisible();
});

test("debe mostrar el inicio de sesion admin cuando no hay autenticacion de prueba", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem("nutrilen.e2eRole");
  });

  await page.goto("/administrador");

  await expect(page.getByRole("heading", { name: /terrave \| panel admin/i })).toBeVisible();
  await expect(page.getByText(/inicia sesion para acceder a las estadisticas del proyecto/i)).toBeVisible();
});
