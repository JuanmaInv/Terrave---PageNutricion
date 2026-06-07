import { DashboardSummaryDto } from "../dto/dashboard-summary.dto";
import { GetEstadisticasQueryDto } from "../dto/get-estadisticas-query.dto";
import { SurveyResponseDto } from "../dto/survey-response.dto";

export interface IEstadisticasRepository {
  findAll(query: GetEstadisticasQueryDto): Promise<SurveyResponseDto[]>;
  getDashboardSummary(query: GetEstadisticasQueryDto): Promise<DashboardSummaryDto>;
}

export const ESTADISTICAS_REPOSITORY = Symbol("IEstadisticasRepository");
