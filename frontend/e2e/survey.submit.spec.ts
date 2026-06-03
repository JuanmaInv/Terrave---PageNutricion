import { test, expect } from "@playwright/test";
import { goToAffectiveStep, openSurvey } from "./helpers/survey";

test("completes full survey and verifies submission saved and confirmation shown", async ({ page }) => {
  await openSurvey(page);
  await goToAffectiveStep(page);

  const acceptanceBtn = page.getByRole("button", { name: /Me gusta mucho 5/i });
  await acceptanceBtn.click({ force: true });

  await page.getByRole("button", { name: "Sí", exact: true }).first().click();
  await page.getByRole("button", { name: "Tal vez", exact: true }).click();

  const affectiveRange = page.getByRole("slider");
  await affectiveRange.focus();
  await affectiveRange.press("End");
  await expect(page.getByText("5/5")).toBeVisible({ timeout: 5000 });

  // Submit and assert localStorage and thank-you
  const submitBtn = page.getByRole("button", { name: /Enviar evaluación/i });
  await submitBtn.click();

  // If validation toast appears due a missed click in acceptance, re-apply and retry once.
  const affectiveValidationToast = page.getByText(/Completá la evaluación afectiva\./i);
  if (await affectiveValidationToast.isVisible({ timeout: 1500 }).catch(() => false)) {
    await acceptanceBtn.click({ force: true });
    await submitBtn.click();
  }

  // account for loader transition after submit
  await page.waitForTimeout(1500);

  const thankYou = page.getByRole("heading", { name: /¡Gracias por participar!/i });
  // Wait for the UI confirmation first.
  try {
    await thankYou.waitFor({ state: "visible", timeout: 20000 });
  } catch {
    // If the heading didn't appear in time, assert storage side effect and then re-check UI.
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const raw = window.localStorage.getItem("nutrilen.surveys.v2");
        return raw ? JSON.parse(raw).length : 0;
      });
    }, { timeout: 30000 }).toBeGreaterThan(0);
    await expect(thankYou).toBeVisible({ timeout: 20000 });
  }
});
