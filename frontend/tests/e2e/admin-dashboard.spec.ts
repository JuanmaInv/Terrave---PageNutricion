import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript((role) => {
    window.localStorage.setItem("nutrilen.e2eRole", role);
  }, "admin");

  await page.route(/.*(mock-api|api\/v1).*/, async (route) => {
    const url = route.request().url();

    if (url.includes("/estadisticas/resumen")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          completedCount: 3,
          inProgressCount: 1,
        }),
      });
      return;
    }

    if (url.includes("/estadisticas")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "survey-1",
            date: "2026-06-01T10:00:00.000Z",
            sex: "femenino",
            diet: "vegano",
            attrs: {
              color: 5,
              aroma: 4,
              firmeza: 4,
              untuosidad: 4,
              sabor_tostado: 5,
              persistencia: 4,
            },
            acceptance: 5,
            liked: "si",
            consumeAgain: "si",
            recommend: 5,
            willingnessToPay: "4500",
          },
        ]),
      });
      return;
    }

    await route.fallback();
  });
});

test("debe permitir que el admin vea el dashboard y sus graficos", async ({ page }) => {
  await page.goto("/administrador");

  await expect(page.getByText("Encuestas completas", { exact: true })).toBeVisible();
  await expect(page.getByText("Encuestas en curso", { exact: true })).toBeVisible();
  await expect(page.getByText(/Distribución de dietas/i).first()).toBeVisible();
});

test("debe mostrar un estado estable cuando el dashboard no tiene datos", async ({ page }) => {
  await page.route(/.*(mock-api|api\/v1).*/, async (route) => {
    const url = route.request().url();

    if (url.includes("/estadisticas/resumen")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ completedCount: 0, inProgressCount: 0 }),
      });
      return;
    }

    if (url.includes("/estadisticas")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
      return;
    }

    await route.fallback();
  });

  await page.goto("/administrador");

  await expect(page.getByText("Participantes", { exact: true })).toBeVisible();
  await expect(page.getByText(/^0$/).first()).toBeVisible();
});
