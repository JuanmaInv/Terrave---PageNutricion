import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: "frontend-unit",
    environment: "jsdom",
    globals: true,
    setupFiles: ["./setupTests.ts"],
    include: [
      "src/**/*.spec.ts",
      "src/**/*.spec.tsx",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/lib/dashboard/build-admin-dashboard-view-model.ts",
        "src/lib/survey/**/*.ts",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
      },
    },
  },
});
