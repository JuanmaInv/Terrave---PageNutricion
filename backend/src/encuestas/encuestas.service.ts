import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { DatabaseService } from "../database/database.service";
import { CreateEncuestaDto } from "./dto/create-encuesta.dto";

type InsertedEncuesta = {
  id: string;
  fecha: string;
};

@Injectable()
export class EncuestasService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateEncuestaDto): Promise<InsertedEncuesta> {
    const id = randomUUID();
    const fecha = dto.date ?? new Date().toISOString();

    const sqlCurrent = `
      INSERT INTO public.encuestas (
        id,
        fecha,
        sexo,
        dieta,
        color,
        aroma,
        firmeza,
        untuosidad,
        sabor_tostado,
        persistencia,
        aceptacion,
        liked,
        consume_again,
        recommend,
        descriptive_comments,
        affective_comments
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
      dto.affectiveComments ?? null
    ];

    const sqlLegacy = `
      INSERT INTO public.encuestas (
        id,
        fecha,
        sexo,
        dieta,
        color,
        aroma,
        firmeza,
        untuosidad,
        sabor_tostado,
        persistencia,
        aceptacion,
        liked,
        consume_again,
        recommend,
        comentarios_descriptivos,
        comentarios_afectivos
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
      )
      RETURNING id, fecha
    `;

    let result;
    try {
      result = await this.db.query<InsertedEncuesta>(sqlCurrent, values);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("descriptive_comments") || message.includes("affective_comments")) {
        result = await this.db.query<InsertedEncuesta>(sqlLegacy, values);
      } else {
        throw error;
      }
    }

    return result.rows[0];
  }
}
