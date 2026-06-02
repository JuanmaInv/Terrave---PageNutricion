import { Module } from "@nestjs/common";
import { EncuestasController } from "./encuestas.controller";
import { EncuestasRepository } from "./repositories/encuestas.repository";
import { EncuestasService } from "./encuestas.service";

/**
 * Registers the Repository as a provider so NestJS DI can inject it into the Service.
 * DatabaseModule is @Global() so no explicit import needed.
 * Pattern: Repository registered as a singleton (Singleton via NestJS DI).
 */
@Module({
  controllers: [EncuestasController],
  providers: [EncuestasRepository, EncuestasService],
})
export class EncuestasModule {}
