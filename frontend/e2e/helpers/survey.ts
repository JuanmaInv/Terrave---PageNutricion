import { expect, type Page } from "@playwright/test";

export async function openSurvey(page: Page): Promise<void> {
  await page.goto("/encuesta", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Datos generales/i })).toBeVisible({
    timeout: 20000,
  });
}

export async function goToDescriptiveStep(page: Page): Promise<void> {
  const femaleBtn = page.getByRole("button", { name: "Femenino", exact: true });
  const dietBtn = page.getByRole("button", {
    name: /Omnívoro Consume alimentos de origen animal y vegetal\./i,
  });
  const continueBtn = page.getByRole("button", { name: "Continuar", exact: true });

  for (let attempt = 0; attempt < 3; attempt++) {
    await femaleBtn.click();
    await dietBtn.click();
    await page.waitForTimeout(250);
    await continueBtn.click({ force: true });

    try {
      await expect(page.getByText(/Paso 2 de 3/i)).toBeVisible({ timeout: 7000 });
      await expect(page.locator('input[type="range"]')).toHaveCount(6, { timeout: 10000 });
      return;
    } catch {
      // Retry from step 1 if transition didn't happen on this attempt.
      await page.waitForTimeout(500);
    }
  }

  throw new Error("No se pudo avanzar al paso descriptivo despues de varios intentos.");
}

export async function goToAffectiveStep(page: Page): Promise<void> {
  await goToDescriptiveStep(page);

  const desc = page.locator('input[type="range"]');
  const descCount = await desc.count();

  for (let i = 0; i < descCount; i++) {
    await desc.nth(i).evaluate((el: HTMLInputElement) => {
      el.value = "4";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  await page.getByRole("button", { name: "Continuar", exact: true }).click({ force: true });
  await expect(page.getByText(/Paso 3 de 3/i)).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("heading", { name: /Evaluación afectiva/i })).toBeVisible({
    timeout: 10000,
  });
}
