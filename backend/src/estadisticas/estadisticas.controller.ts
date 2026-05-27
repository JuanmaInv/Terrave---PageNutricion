import { Controller, Get, Headers, Query } from "@nestjs/common";
import { AdminService } from "../admin/admin.service";
import { GetEstadisticasQueryDto } from "./dto/get-estadisticas-query.dto";
import { EstadisticasService } from "./estadisticas.service";

@Controller("estadisticas")
export class EstadisticasController {
  constructor(
    private readonly adminService: AdminService,
    private readonly estadisticasService: EstadisticasService
  ) {}

  @Get()
  async getStats(
    @Query() query: GetEstadisticasQueryDto,
    @Headers("authorization") authorization?: string
  ) {
    const token = this.adminService.getTokenFromAuthorization(authorization);
    await this.adminService.validateAdminToken(token);

    return this.estadisticasService.getSurveys(query);
  }
}
