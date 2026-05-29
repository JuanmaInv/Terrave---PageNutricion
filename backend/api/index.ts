import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "../src/app.module";
import * as express from "express";
import type { Request, Response } from "express";

const server: express.Express = express();

// Cached initialization promise para Vercel serverless
let initPromise: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    { logger: ["error", "warn"] }
  );

  app.setGlobalPrefix("api/v1");
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

  await app.init();
}

export default async function handler(req: Request, res: Response) {
  // Inicializa una sola vez y reutiliza la instancia
  if (!initPromise) {
    initPromise = bootstrap().catch((err) => {
      initPromise = null; // resetea si falla para poder reintentar
      throw err;
    });
  }
  await initPromise;
  server(req, res);
}
