import { performance } from "node:perf_hooks";
import { createSession, percentile, submitSurvey } from "./survey-test-utils.mjs";

const profile = process.argv[2] ?? "load";
const defaultConcurrencyByProfile = {
  load: 30,
  stress: 60,
};
const defaultWavesByProfile = {
  load: 1,
  stress: 3,
};
const concurrency = Number(
  process.env.SURVEY_LOAD_CONCURRENCY ?? String(defaultConcurrencyByProfile[profile] ?? 30)
);
const waves = Number(process.env.SURVEY_LOAD_WAVES ?? String(defaultWavesByProfile[profile] ?? 1));

async function runVirtualUser(index) {
  const started = performance.now();
  const session = await createSession(index, 2);
  await submitSurvey(index, session.id, profile);

  return Number((performance.now() - started).toFixed(1));
}

function percentile(sortedValues, ratio) {
  return sortedValues[Math.min(sortedValues.length - 1, Math.floor(sortedValues.length * ratio))];
}

async function main() {
  const started = performance.now();
  const durations = [];

  for (let wave = 0; wave < waves; wave += 1) {
    const waveOffset = wave * concurrency;
    const waveDurations = await Promise.all(
      Array.from({ length: concurrency }, (_, index) => runVirtualUser(index + waveOffset))
    );
    durations.push(...waveDurations);
  }

  const totalMs = Number((performance.now() - started).toFixed(1));
  const sorted = [...durations].sort((a, b) => a - b);
  const avg = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;

  console.log(`Profile: ${profile}`);
  console.log(`Waves: ${waves}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Total virtual users: ${durations.length}`);
  console.log(`Total wall time: ${totalMs}ms`);
  console.log(`Average virtual user time: ${avg.toFixed(1)}ms`);
  console.log(`p95 virtual user time: ${percentile(sorted, 0.95).toFixed(1)}ms`);
  console.log(`Max virtual user time: ${sorted.at(-1)?.toFixed(1)}ms`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
