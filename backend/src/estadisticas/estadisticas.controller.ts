import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../admin/guards/admin.guard";
import { GetEstadisticasQueryDto } from "./dto/get-estadisticas-query.dto";
import { EstadisticasService } from "./estadisticas.service";

/**
 * Estadisticas controller — protected by AdminGuard.
 * Pattern: Decorator (@UseGuards) — the guard is applied declaratively,
 * keeping the controller free of authentication logic (SRP).
 */
@Controller("estadisticas")
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @UseGuards(AdminGuard)
  @Get()
  async getStats(@Query() query: GetEstadisticasQueryDto) {
    return this.estadisticasService.getSurveys(query);
  }
}
