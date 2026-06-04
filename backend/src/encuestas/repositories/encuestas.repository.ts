import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CreateEncuestaDto } from "../dto/create-encuesta.dto";
import { UpsertEncuestaSessionDto } from "../dto/upsert-encuesta-session.dto";
import {
  EncuestaSessionRecord,
  IEncuestasRepository,
  InsertedEncuesta,
} from "../interfaces/encuestas.repository.interface";

/**
 * PostgreSQL implementation of IEncuestasRepository.
 * All raw SQL is isolated here — if the DB changes, only this class changes.
 * Pattern: Repository
 */
@Injectable()
export class EncuestasRepository implements IEncuestasRepository {
  private lastExpiredSessionsCleanupAt = 0;

  constructor(private readonly db: DatabaseService) {}

  async createSession(
    id: string,
    dto: UpsertEncuestaSessionDto
  ): Promise<EncuestaSessionRecord> {
    await this.ensureExpiredSessionsCleanup();

    const sql = `
      INSERT INTO public.encuesta_sesiones (
        id, client_session_key, estado, paso_actual, sexo, dieta, payload, fecha_inicio, fecha_actualizacion
      ) VALUES (
        $1, $2, 'en_curso', $3, $4, $5, $6::jsonb, timezone('utc'::text, now()), timezone('utc'::text, now())
      )
      ON CONFLICT (client_session_key) DO UPDATE
      SET
        estado = 'en_curso',
        paso_actual = COALESCE(EXCLUDED.paso_actual, public.encuesta_sesiones.paso_actual),
        sexo = COALESCE(EXCLUDED.sexo, public.encuesta_sesiones.sexo),
        dieta = COALESCE(EXCLUDED.dieta, public.encuesta_sesiones.dieta),
        payload = COALESCE(public.encuesta_sesiones.payload, '{}'::jsonb) || EXCLUDED.payload,
        fecha_actualizacion = timezone('utc'::text, now())
      RETURNING id, fecha_inicio, fecha_actualizacion
    `;

    const payload = this.buildSessionPayload(dto);
    const values = [
      id,
      dto.clientSessionKey,
      dto.currentStep ?? 1,
      dto.sex ?? null,
      dto.diet ?? null,
      JSON.stringify(payload),
    ];
    const result = await this.db.query<EncuestaSessionRecord>(sql, values);
    return result.rows[0];
  }

  async updateSession(
    id: string,
    dto: UpsertEncuestaSessionDto
  ): Promise<EncuestaSessionRecord> {
    await this.ensureExpiredSessionsCleanup();

    const sql = `
      UPDATE public.encuesta_sesiones
      SET
        paso_actual = COALESCE($2, paso_actual),
        sexo = COALESCE($3, sexo),
        dieta = COALESCE($4, dieta),
        payload = COALESCE(payload, '{}'::jsonb) || $5::jsonb,
        fecha_actualizacion = timezone('utc'::text, now())
      WHERE id = $1
      RETURNING id, fecha_inicio, fecha_actualizacion
    `;

    const payload = this.buildSessionPayload(dto);
    const values = [id, dto.currentStep ?? null, dto.sex ?? null, dto.diet ?? null, JSON.stringify(payload)];
    const result = await this.db.query<EncuestaSessionRecord>(sql, values);
    return result.rows[0] ?? this.createSession(id, dto);
  }

  async create(
    dto: CreateEncuestaDto,
    id: string,
    fecha: string
  ): Promise<InsertedEncuesta> {
    const client = await this.db.getClient();
    try {
      await client.query("BEGIN");

      const sql = `
        INSERT INTO public.encuestas (
          id, fecha, sexo, dieta,
          color, aroma, firmeza, untuosidad, sabor_tostado, persistencia,
          aceptacion, liked, consume_again, recommend,
          descriptive_comments, willingness_to_pay, affective_comments
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
        )
        RETURNING id, fecha
      `;

      const values = [
        id,
        fecha,
        dto.sex,
        dto.diet,
        dto.attrs.color,
        dto.attrs.aroma,
        dto.attrs.firmeza,
        dto.attrs.untuosidad,
        dto.attrs.sabor_tostado,
        dto.attrs.persistencia,
        dto.acceptance,
        dto.liked,
        dto.consumeAgain,
        dto.recommend,
        dto.descriptiveComments ?? null,
        dto.willingnessToPay ?? null,
        dto.affectiveComments ?? null,
      ];

      const result = await client.query<InsertedEncuesta>(sql, values);

      if (dto.sessionId) {
        await client.query(
          `
            DELETE FROM public.encuesta_sesiones
            WHERE id = $1
          `,
          [dto.sessionId]
        );
      }

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private buildSessionPayload(dto: UpsertEncuestaSessionDto | CreateEncuestaDto): Record<string, unknown> {
    return {
      currentStep: "currentStep" in dto ? dto.currentStep ?? null : 3,
      sex: dto.sex ?? null,
      diet: dto.diet ?? null,
      attrs: dto.attrs ?? null,
      descriptiveComments: dto.descriptiveComments ?? null,
      acceptance: dto.acceptance ?? null,
      liked: dto.liked ?? null,
      consumeAgain: dto.consumeAgain ?? null,
      recommend: dto.recommend ?? null,
      willingnessToPay: dto.willingnessToPay ?? null,
      affectiveComments: dto.affectiveComments ?? null,
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
