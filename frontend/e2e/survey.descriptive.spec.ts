import { test, expect } from "@playwright/test";
import { goToDescriptiveStep, openSurvey } from "./helpers/survey";

test("fills descriptive evaluation sliders and proceeds", async ({ page }) => {
  await openSurvey(page);
  await goToDescriptiveStep(page);

  const ranges = page.locator('input[type="range"]');
  await expect(ranges).toHaveCount(6, { timeout: 10000 });

  // Set each descriptive range to 4 to avoid edge cases
  const count = await ranges.count();
  for (let i = 0; i < count; i++) {
    const r = ranges.nth(i);
    await r.evaluate((input: HTMLInputElement) => {
      input.value = "4";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Evaluación afectiva/i })).toBeVisible({ timeout: 20000 });
});
