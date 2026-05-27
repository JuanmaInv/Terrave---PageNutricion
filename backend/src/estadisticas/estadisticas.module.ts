import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { EstadisticasController } from "./estadisticas.controller";
import { EstadisticasService } from "./estadisticas.service";

@Module({
  imports: [AdminModule],
  controllers: [EstadisticasController],
  providers: [EstadisticasService]
})
export class EstadisticasModule {}
