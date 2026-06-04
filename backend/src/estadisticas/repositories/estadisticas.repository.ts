import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { DashboardSummaryDto } from "../dto/dashboard-summary.dto";
import { GetEstadisticasQueryDto } from "../dto/get-estadisticas-query.dto";
import { SurveyResponseDto } from "../dto/survey-response.dto";
import { IEstadisticasRepository } from "../interfaces/estadisticas.repository.interface";

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

type CountRow = {
  count: string;
};

const ARGENTINA_TIMEZONE = "America/Argentina/Buenos_Aires";

/**
 * PostgreSQL implementation of IEstadisticasRepository.
 * Centralizes both detailed survey queries and dashboard counters.
 */
@Injectable()
export class EstadisticasRepository implements IEstadisticasRepository {
  private lastExpiredSessionsCleanupAt = 0;

  constructor(private readonly db: DatabaseService) {}

  async findAll(query: GetEstadisticasQueryDto): Promise<SurveyResponseDto[]> {
    const { where, values } = this.buildWhereClause(query, "fecha");

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

  async getDashboardSummary(query: GetEstadisticasQueryDto): Promise<DashboardSummaryDto> {
    await this.ensureExpiredSessionsCleanup();

    const completedFilters = this.buildWhereClause(query, "fecha");
    const inProgressFilters = this.buildWhereClause(query, "fecha_inicio");

    const completedSql = `
      SELECT COUNT(*)::text AS count
      FROM public.encuestas
      ${completedFilters.where}
    `;

    const inProgressSql = `
      SELECT COUNT(*)::text AS count
      FROM public.encuesta_sesiones
      ${inProgressFilters.where ? `${inProgressFilters.where} AND` : "WHERE"}
        estado = 'en_curso'
    `;

    const [completedResult, inProgressResult] = await Promise.all([
      this.db.query<CountRow>(completedSql, completedFilters.values),
      this.db.query<CountRow>(inProgressSql, inProgressFilters.values),
    ]);

    return {
      completedCount: Number(completedResult.rows[0]?.count ?? "0"),
      inProgressCount: Number(inProgressResult.rows[0]?.count ?? "0"),
    };
  }

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

  private buildWhereClause(
    query: GetEstadisticasQueryDto,
    dateColumn: "fecha" | "fecha_inicio"
  ): { where: string; values: unknown[] } {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (query.diet) {
      values.push(query.diet);
      conditions.push(`dieta = $${values.length}`);
    }

    if (query.sex) {
      values.push(query.sex);
      conditions.push(`sexo = $${values.length}`);
    }

    if (query.from) {
      values.push(query.from);
      conditions.push(`timezone('${ARGENTINA_TIMEZONE}', ${dateColumn})::date >= $${values.length}::date`);
    }

    if (query.to) {
      values.push(query.to);
      conditions.push(`timezone('${ARGENTINA_TIMEZONE}', ${dateColumn})::date <= $${values.length}::date`);
    }

    return {
      where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
      values,
    };
  }

  private async deleteExpiredSessions(): Promise<void> {
    const expirationMinutes = Number(process.env.SURVEY_IN_PROGRESS_WINDOW_MINUTES ?? "30");

    await this.db.query(
      `
        DELETE FROM public.encuesta_sesiones
        WHERE estado = 'en_curso'
          AND fecha_actualizacion < timezone('utc'::text, now()) - ($1 * interval '1 minute')
      `,
      [expirationMinutes]
    );
  }

  private async ensureExpiredSessionsCleanup(): Promise<void> {
    const cleanupIntervalMs = Number(
      process.env.SURVEY_SESSION_CLEANUP_INTERVAL_MS ?? "300000"
    );
    const now = Date.now();

    if (now - this.lastExpiredSessionsCleanupAt < cleanupIntervalMs) {
      return;
    }

    this.lastExpiredSessionsCleanupAt = now;

    try {
      await this.deleteExpiredSessions();
    } catch (error) {
      this.lastExpiredSessionsCleanupAt = 0;
      throw error;
    }
  }
}
