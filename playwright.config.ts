import { defineConfig, devices } from "@playwright/test";
import path from "path";

// Variables de entorno para el estado de autenticación
export const STORAGE_STATE = path.join(__dirname, "playwright/.auth/user.json");

/**
 * Lee las variables de entorno del archivo .env.
 * @see https://playwright.dev/docs/test-configuration
 */
// require('dotenv').config();

export default defineConfig({
  testDir: "./tests/e2e",
  /* El tiempo máximo que puede tardar un test. */
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    /* URL base para acciones como `await page.goto('/')`. */
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  /* Configura proyectos para los principales navegadores. */
  projects: [
    // Proyecto de setup para autenticar
    { name: "setup", testMatch: /.*\.setup\.ts/ },

    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Usa el estado de autenticación guardado.
        storageState: STORAGE_STATE,
      },
      dependencies: ["setup"],
    },
  ],

  /* Inicia el servidor de desarrollo antes de ejecutar los tests. */
  webServer: {
    command: 'pnpm --filter frontend dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});