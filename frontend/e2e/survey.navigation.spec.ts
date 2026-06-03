import { test, expect } from "@playwright/test";

test("survey page navigates and shows Datos generales", async ({ page }) => {
  await page.goto("/encuesta", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Datos generales/i })).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeEnabled();
});
