import {
  Controller,
  Get,
  InternalServerErrorException,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
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

  @UseGuards(AdminGuard)
  @Get("excel")
  async exportExcel(@Query() query: GetEstadisticasQueryDto, @Res() res: Response) {
    try {
      const buffer = await this.estadisticasService.getExcelReport(query);
      const filename = `nutrilen-encuestas-${Date.now()}.xlsx`;

      res.set(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.set("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown excel export error";
      throw new InternalServerErrorException(`Excel export failed: ${detail}`);
    }
  }
}
