import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { GetEstadisticasQueryDto } from "./dto/get-estadisticas-query.dto";

type SurveyRow = {
  id: string;
  fecha: string;
  sexo: "femenino" | "masculino" | "otro";
  dieta: "omnivoro" | "ovo_lacto" | "vegano" | "flexitariano" | "otro";
  color: number;
  aroma: number;
  firmeza: number;
  untuosidad: number;
  sabor_tostado: number;
  persistencia: number;
  aceptacion: number;
  liked: "si" | "no";
  consume_again: "si" | "no" | "tal_vez";
  recommend: number;
  descriptive_comments: string | null;
  affective_comments: string | null;
};

@Injectable()
export class EstadisticasService {
  constructor(private readonly db: DatabaseService) {}

  async getSurveys(query: GetEstadisticasQueryDto) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (query.diet) {
      conditions.push(`dieta = $${i++}`);
      values.push(query.diet);
    }
    if (query.sex) {
      conditions.push(`sexo = $${i++}`);
      values.push(query.sex);
    }
    if (query.from) {
      conditions.push(`fecha >= $${i++}`);
      values.push(new Date(query.from).toISOString());
    }
    if (query.to) {
      conditions.push(`fecha <= $${i++}`);
      const end = new Date(query.to);
      end.setHours(23, 59, 59, 999);
      values.push(end.toISOString());
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sqlCurrent = `
      SELECT
        id, fecha, sexo, dieta, color, aroma, firmeza, untuosidad, sabor_tostado, persistencia,
        aceptacion, liked, consume_again, recommend, descriptive_comments, affective_comments
      FROM public.encuestas
      ${where}
      ORDER BY fecha DESC
    `;
    const sqlLegacy = `
      SELECT
        id, fecha, sexo, dieta, color, aroma, firmeza, untuosidad, sabor_tostado, persistencia,
        aceptacion, liked, consume_again, recommend,
        comentarios_descriptivos AS descriptive_comments,
        comentarios_afectivos AS affective_comments
      FROM public.encuestas
      ${where}
      ORDER BY fecha DESC
    `;

    let result;
    try {
      result = await this.db.query<SurveyRow>(sqlCurrent, values);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("descriptive_comments") || message.includes("affective_comments")) {
        result = await this.db.query<SurveyRow>(sqlLegacy, values);
      } else {
        throw error;
      }
    }

    return result.rows.map((row: SurveyRow) => ({
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
        persistencia: row.persistencia
      },
      descriptiveComments: row.descriptive_comments ?? "",
      acceptance: row.aceptacion,
      liked: row.liked,
      consumeAgain: row.consume_again,
      recommend: row.recommend,
      affectiveComments: row.affective_comments ?? ""
    }));
  }
}
