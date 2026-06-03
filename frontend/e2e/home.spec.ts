import { expect, test } from "@playwright/test";

test("home page shows the main hero and navigates to the survey", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: /Medallon de Lenteja Saludable/i }),
  ).toBeVisible();
  const surveyLink = page.getByRole("link", { name: /Ir a Encuesta/i });
  await expect(surveyLink).toBeVisible();
  await expect(surveyLink).toHaveAttribute("href", "/encuesta");
});