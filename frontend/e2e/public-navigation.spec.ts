import { expect, test } from "@playwright/test";

test("home page section link navigates to nutritional information", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const infoLink = page.getByRole("link", { name: /Ver informacion/i });
  await expect(infoLink).toBeVisible();
  await expect(infoLink).toHaveAttribute("href", "#nutricion");

  await infoLink.click();
  await expect(page).toHaveURL(/#nutricion$/);
  await expect(page.locator("#nutricion")).toBeVisible();
});