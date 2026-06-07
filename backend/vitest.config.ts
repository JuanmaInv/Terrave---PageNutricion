import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "backend-unit",
    environment: "node",
    globals: true,
    include: ["test/unit/*.spec.js"],
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      excludeAfterRemap: true,
      include: [
        "src/admin/admin.controller.ts",
        "src/admin/admin.service.ts",
        "src/admin/guards/admin.guard.ts",
        "src/common/filters/global-exception.filter.ts",
        "src/encuestas/encuestas.controller.ts",
        "src/encuestas/encuestas.service.ts",
        "src/encuestas/dto/create-encuesta.dto.ts",
        "src/encuestas/dto/upsert-encuesta-session.dto.ts",
        "src/estadisticas/estadisticas.controller.ts",
        "src/estadisticas/estadisticas.service.ts",
        "src/estadisticas/dto/get-estadisticas-query.dto.ts",
        "src/health/**/*.ts",
      ],
      exclude: [
        "src/app.controller.ts",
        "src/**/*.module.ts",
        "src/main.ts",
        "src/database/**/*.ts",
        "src/**/repositories/**/*.ts",
        "src/**/interfaces/**/*.ts",
      ],
      thresholds: {
        statements: 90,
        lines: 90,
        functions: 90,
      },
    },
  },
});
