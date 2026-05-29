import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { DatabaseModule } from "../database/database.module";
import { EstadisticasController } from "./estadisticas.controller";
import { EstadisticasRepository } from "./repositories/estadisticas.repository";
import { EstadisticasService } from "./estadisticas.service";

/**
 * Registers EstadisticasRepository and imports AdminModule for the AdminGuard.
 */
@Module({
  imports: [AdminModule, DatabaseModule],
  controllers: [EstadisticasController],
  providers: [EstadisticasRepository, EstadisticasService],
})
export class EstadisticasModule {}
