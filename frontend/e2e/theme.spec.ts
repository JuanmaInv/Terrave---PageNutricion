import { expect, test } from "@playwright/test";

test("navbar theme toggle switches and persists dark mode", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const themeButton = page.getByRole("button", { name: /Cambiar tema/i });
  await expect(themeButton).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("nutrilen.theme"))).not.toBe("dark");

  await themeButton.click();

  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("nutrilen.theme"))).toBe("dark");

  await page.reload({ waitUntil: "domcontentloaded" });

  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("nutrilen.theme"))).toBe("dark");
});