import "reflect-metadata";
import { ValidationPipe, RequestMethod } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { randomUUID } from "crypto";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const slowRequestThresholdMs = Number(process.env.SLOW_REQUEST_THRESHOLD_MS ?? "3000");
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.disable("x-powered-by");

  app.use((req: any, res: any, next: () => void) => {
    const startedAt = process.hrtime.bigint();
    const originalEnd = res.end.bind(res);
    const requestId = String(req.headers["x-request-id"] ?? randomUUID());
    req.id = requestId;
    res.setHeader("X-Request-Id", requestId);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

    res.end = ((chunk?: any, encoding?: any, callback?: any) => {
      const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const roundedMs = elapsedMs.toFixed(1);

      if (!res.headersSent) {
        res.setHeader("X-Response-Time", `${roundedMs}ms`);
        res.setHeader("Server-Timing", `app;dur=${roundedMs}`);
      }

      return originalEnd(chunk, encoding, callback);
    }) as typeof res.end;

    res.on("finish", () => {
      const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const roundedMs = elapsedMs.toFixed(1);

      if (elapsedMs >= slowRequestThresholdMs) {
        console.warn(
          `[perf] slow request ${requestId} ${req.method} ${req.originalUrl} -> ${res.statusCode} in ${roundedMs}ms`
        );
      }
    });

    next();
  });

  app.setGlobalPrefix("api/v1", {
    exclude: [{ path: '/', method: RequestMethod.GET }]
  });
  app.enableCors({
    origin: true,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`TERRAVÉ backend listening on http://localhost:${port}/api/v1`);
}

bootstrap();
