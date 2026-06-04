import { spawnSync } from "node:child_process";

export default function globalSetup() {
  const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const result = spawnSync(command, ["build"], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error || result.status !== 0) {
    throw new Error(`Backend build failed before running Vitest. ${result.error?.message ?? ""}`.trim());
  }
}
