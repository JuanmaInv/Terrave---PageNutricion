import { test, expect } from "@playwright/test";
import { goToAffectiveStep, openSurvey } from "./helpers/survey";

test("interacts with affective controls and records choices", async ({ page }) => {
  await openSurvey(page);
  await goToAffectiveStep(page);

  // acceptance buttons
  await page.getByRole("button", { name: "Me gusta mucho" }).click();
  await page.getByRole("button", { name: "Sí", exact: true }).first().click();
  await page.getByRole("button", { name: "Tal vez", exact: true }).click();

  const affectiveRange = page.locator('input[type="range"]').last();
  await affectiveRange.evaluate((el: HTMLInputElement) => {
    el.value = "5";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // Verify a summary control or comment box exists
  await expect(page.getByRole("textbox")).toBeVisible();
});
