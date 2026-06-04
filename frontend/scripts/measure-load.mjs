import { performance } from "node:perf_hooks";

const frontendBase = (process.env.FRONTEND_URL ?? "http://localhost:3001").replace(/\/+$/, "");
const optimizedImageUrl =
  `${frontendBase}/_next/image?url=${encodeURIComponent("/images/lentil-medallion.jpg")}&w=1920&q=70`;

async function timedFetch(label, url) {
  const started = performance.now();
  const response = await fetch(url);
  const elapsedMs = Number((performance.now() - started).toFixed(1));
  const buffer = await response.arrayBuffer();

  return {
    label,
    status: response.status,
    elapsedMs,
    bytes: buffer.byteLength,
    contentType: response.headers.get("content-type") ?? "n/a",
  };
}

async function main() {
  const results = await Promise.all([
    timedFetch("GET /", `${frontendBase}/`),
    timedFetch("GET optimized hero image", optimizedImageUrl),
  ]);

  for (const result of results) {
    console.log(
      `${result.label} | status=${result.status} | time=${result.elapsedMs}ms | bytes=${result.bytes} | type=${result.contentType}`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
