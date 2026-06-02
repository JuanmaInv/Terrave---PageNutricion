import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { GetEstadisticasQueryDto } from "../dto/get-estadisticas-query.dto";
import { SurveyResponseDto } from "../dto/survey-response.dto";
import { IEstadisticasRepository } from "../interfaces/estadisticas.repository.interface";
import { DateRangeFilter } from "../filters/date-range.filter";
import { DietFilter } from "../filters/diet.filter";
import { SexFilter } from "../filters/sex.filter";
import { FilterStrategy } from "../filters/filter.strategy.interface";

type SurveyRow = {
  id: string;
  fecha: string;
  sexo: string;
  dieta: string;
  color: number;
  aroma: number;
  firmeza: number;
  untuosidad: number;
  sabor_tostado: number;
  persistencia: number;
  aceptacion: number;
  liked: string;
  consume_again: string;
  recommend: number;
  descriptive_comments: string | null;
  willingness_to_pay: string | null;
  affective_comments: string | null;
};

/**
 * PostgreSQL implementation of IEstadisticasRepository.
 * Uses the Strategy pattern to build dynamic WHERE clauses.
 * Pattern: Repository + Strategy
 */
@Injectable()
export class EstadisticasRepository implements IEstadisticasRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(query: GetEstadisticasQueryDto): Promise<SurveyResponseDto[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    // Compose active filter strategies — OCP: adding a new filter = add a new strategy class
    const strategies: FilterStrategy[] = [
      ...(query.diet ? [new DietFilter(query.diet)] : []),
      ...(query.sex ? [new SexFilter(query.sex)] : []),
      new DateRangeFilter(query.from, query.to),
    ];

    let paramIndex = 1;
    for (const strategy of strategies) {
      paramIndex = strategy.apply(conditions, values, paramIndex);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT
        id, fecha, sexo, dieta, color, aroma, firmeza, untuosidad,
        sabor_tostado, persistencia, aceptacion, liked, consume_again,
        recommend, descriptive_comments, willingness_to_pay, affective_comments
      FROM public.encuestas
      ${where}
      ORDER BY fecha DESC
    `;

    const result = await this.db.query<SurveyRow>(sql, values);
    return result.rows.map(this.mapRow);
  }

  /** Maps a raw DB row to the API response shape */
  private mapRow(row: SurveyRow): SurveyResponseDto {
    return {
      id: row.id,
      date: row.fecha,
      sex: row.sexo,
      diet: row.dieta,
      attrs: {
        color: row.color,
        aroma: row.aroma,
        firmeza: row.firmeza,
        untuosidad: row.untuosidad,
        sabor_tostado: row.sabor_tostado,
        persistencia: row.persistencia,
      },
      descriptiveComments: row.descriptive_comments ?? "",
      acceptance: row.aceptacion,
      liked: row.liked,
      consumeAgain: row.consume_again,
      recommend: row.recommend,
      willingnessToPay: row.willingness_to_pay ?? "",
      affectiveComments: row.affective_comments ?? "",
    };
  }
}
