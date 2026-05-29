import { Injectable } from "@nestjs/common";
import { GetEstadisticasQueryDto } from "./dto/get-estadisticas-query.dto";
import { SurveyResponseDto } from "./dto/survey-response.dto";
import { EstadisticasRepository } from "./repositories/estadisticas.repository";

/**
 * Estadisticas business logic — delegates all data access to EstadisticasRepository.
 * Pattern: Repository (DIP applied)
 * SOLID: SRP — this class orchestrates, the repository queries.
 */
@Injectable()
export class EstadisticasService {
  constructor(private readonly estadisticasRepository: EstadisticasRepository) {}

  async getSurveys(query: GetEstadisticasQueryDto): Promise<SurveyResponseDto[]> {
    return this.estadisticasRepository.findAll(query);
  }
}
