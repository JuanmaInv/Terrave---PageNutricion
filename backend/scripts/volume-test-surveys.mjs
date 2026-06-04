import { performance } from "node:perf_hooks";
import { createSession, percentile, submitSurvey } from "./survey-test-utils.mjs";

const totalSurveys = Number(process.env.SURVEY_VOLUME_TOTAL ?? "100");
const batchSize = Number(process.env.SURVEY_VOLUME_BATCH_SIZE ?? "10");

async function runSurvey(index) {
  const started = performance.now();
  const session = await createSession(index, 2);
  await submitSurvey(index, session.id, "volume");
  return Number((performance.now() - started).toFixed(1));
}

async function main() {
  const started = performance.now();
  const durations = [];

  for (let offset = 0; offset < totalSurveys; offset += batchSize) {
    const currentBatchSize = Math.min(batchSize, totalSurveys - offset);
    const batchDurations = await Promise.all(
      Array.from({ length: currentBatchSize }, (_, index) => runSurvey(offset + index))
    );
    durations.push(...batchDurations);
  }

  const sorted = [...durations].sort((a, b) => a - b);
  const totalMs = Number((performance.now() - started).toFixed(1));
  const avg = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;

  console.log(`Volume total surveys: ${totalSurveys}`);
  console.log(`Batch size: ${batchSize}`);
  console.log(`Total wall time: ${totalMs}ms`);
  console.log(`Average survey time: ${avg.toFixed(1)}ms`);
  console.log(`p95 survey time: ${percentile(sorted, 0.95).toFixed(1)}ms`);
  console.log(`Max survey time: ${sorted.at(-1)?.toFixed(1)}ms`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
