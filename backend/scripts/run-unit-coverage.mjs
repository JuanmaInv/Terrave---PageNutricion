import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const testFiles = readdirSync(join(process.cwd(), "test", "unit"))
  .filter((file) => file.endsWith(".spec.js"))
  .map((file) => join("test", "unit", file));

const args = [
  "--test",
  "--experimental-test-coverage",
  "--test-coverage-lines=90",
  "--test-coverage-functions=90",
  "--test-coverage-include=dist/src/app.controller.js",
  "--test-coverage-include=dist/src/admin/*.js",
  "--test-coverage-include=dist/src/admin/guards/*.js",
  "--test-coverage-include=dist/src/common/filters/*.js",
  "--test-coverage-include=dist/src/encuestas/*.js",
  "--test-coverage-include=dist/src/encuestas/dto/*.js",
  "--test-coverage-include=dist/src/estadisticas/*.js",
  "--test-coverage-include=dist/src/estadisticas/dto/*.js",
  "--test-coverage-include=dist/src/health/*.js",
  "--test-coverage-exclude=dist/src/*/*.module.js",
  "--test-coverage-exclude=dist/src/main.js",
  "--test-coverage-exclude=dist/src/database/*.js",
  "--test-coverage-exclude=dist/src/*/repositories/*.js",
  "--test-coverage-exclude=dist/src/*/interfaces/*.js",
  ...testFiles,
];

const proc = spawn(process.execPath, args, {
  stdio: "inherit",
});

proc.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
