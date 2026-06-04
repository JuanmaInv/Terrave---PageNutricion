import { performance } from "node:perf_hooks";
import { backendBase, buildSurvey } from "./survey-test-utils.mjs";
const iterations = Number(process.env.ROUTE_MEASURE_ITERATIONS ?? "5");

async function timedRequest(label, url, init) {
  const started = performance.now();
  const response = await fetch(url, init);
  const elapsed = performance.now() - started;
  const body = await response.text();

  return {
    label,
    status: response.status,
    elapsedMs: Number(elapsed.toFixed(1)),
    responseTimeHeader: response.headers.get("x-response-time") ?? "n/a",
    body,
  };
}

async function runOnce(index) {
  const clientSessionKey = `perf-client-${Date.now()}-${index}`;
  const createSession = await timedRequest(
    "POST /encuestas/sesiones",
    `${backendBase}/encuestas/sesiones`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientSessionKey,
        currentStep: 1,
        sex: "femenino",
        diet: "omnivoro",
      }),
    }
  );

  const sessionPayload = JSON.parse(createSession.body || "{}");
  const submitSurvey = await timedRequest(
    "POST /encuestas",
    `${backendBase}/encuestas`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSurvey(index, sessionPayload.id, "perf")),
    }
  );

  const health = await timedRequest("GET /health", `${backendBase}/health`);

  return [health, createSession, submitSurvey];
}

function summarize(results) {
  const grouped = new Map();

  for (const result of results.flat()) {
    const bucket = grouped.get(result.label) ?? [];
    bucket.push(result);
    grouped.set(result.label, bucket);
  }

  for (const [label, entries] of grouped.entries()) {
    const elapsed = entries.map((entry) => entry.elapsedMs).sort((a, b) => a - b);
    const avg = elapsed.reduce((sum, value) => sum + value, 0) / elapsed.length;
    const p95 = elapsed[Math.min(elapsed.length - 1, Math.floor(elapsed.length * 0.95))];
    const max = elapsed[elapsed.length - 1];
    const allOk = entries.every((entry) => entry.status >= 200 && entry.status < 300);

    console.log(
      `${label} | ok=${allOk} | avg=${avg.toFixed(1)}ms | p95=${p95.toFixed(1)}ms | max=${max.toFixed(1)}ms | last-header=${entries.at(-1)?.responseTimeHeader}`
    );
  }
}

async function main() {
  const runs = [];

  for (let index = 0; index < iterations; index += 1) {
    runs.push(await runOnce(index));
  }

  summarize(runs);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
