import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "backend-unit",
    environment: "node",
    globals: true,
    include: ["test/unit/*.spec.js"],
    globalSetup: ["./test/vitest.global-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "dist/src/admin/admin.controller.js",
        "dist/src/admin/admin.service.js",
        "dist/src/admin/guards/admin.guard.js",
        "dist/src/common/filters/global-exception.filter.js",
        "dist/src/encuestas/encuestas.controller.js",
        "dist/src/encuestas/encuestas.service.js",
        "dist/src/encuestas/dto/create-encuesta.dto.js",
        "dist/src/encuestas/dto/upsert-encuesta-session.dto.js",
        "dist/src/estadisticas/estadisticas.controller.js",
        "dist/src/estadisticas/estadisticas.service.js",
        "dist/src/estadisticas/dto/get-estadisticas-query.dto.js",
        "dist/src/health/**/*.js",
      ],
      exclude: [
        "dist/src/app.controller.js",
        "dist/src/**/*.module.js",
        "dist/src/main.js",
        "dist/src/database/**/*.js",
        "dist/src/**/repositories/**/*.js",
        "dist/src/**/interfaces/**/*.js",
      ],
      thresholds: {
        statements: 90,
        lines: 90,
        functions: 90,
      },
    },
  },
});
