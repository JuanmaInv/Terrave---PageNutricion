import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CreateEncuestaDto } from "../dto/create-encuesta.dto";
import {
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
  constructor(private readonly db: DatabaseService) {}

  async create(
    dto: CreateEncuestaDto,
    id: string,
    fecha: string
  ): Promise<InsertedEncuesta> {
    const sql = `
      INSERT INTO public.encuestas (
        id, fecha, sexo, dieta,
        color, aroma, firmeza, untuosidad, sabor_tostado, persistencia,
        aceptacion, liked, consume_again, recommend,
        descriptive_comments, affective_comments
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
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
      dto.affectiveComments ?? null,
    ];

    const result = await this.db.query<InsertedEncuesta>(sql, values);
    return result.rows[0];
  }
}
