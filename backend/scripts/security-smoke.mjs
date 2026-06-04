import { backendBase } from "./survey-test-utils.mjs";

async function request(label, url, init = {}) {
  const response = await fetch(url, init);
  const body = await response.text();

  return {
    label,
    status: response.status,
    ok: response.ok,
    body,
  };
}

function expectStatus(result, acceptedStatuses) {
  if (!acceptedStatuses.includes(result.status)) {
    throw new Error(
      `${result.label} expected ${acceptedStatuses.join(" or ")}, got ${result.status}: ${result.body}`
    );
  }
}

async function main() {
  const checks = [
    await request("GET /health", `${backendBase}/health`),
    await request("GET /admin/me without auth", `${backendBase}/admin/me`),
    await request("POST /encuestas/sesiones invalid payload", `${backendBase}/encuestas/sesiones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientSessionKey: "security-smoke",
        currentStep: 99,
        sex: "hack",
        diet: "hack",
      }),
    }),
    await request("POST /encuestas invalid payload", `${backendBase}/encuestas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "security_invalid",
        date: new Date().toISOString(),
        sex: "hack",
      }),
    }),
  ];

  expectStatus(checks[0], [200]);
  expectStatus(checks[1], [401, 403]);
  expectStatus(checks[2], [400]);
  expectStatus(checks[3], [400]);

  for (const check of checks) {
    console.log(`${check.label} -> ${check.status}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
