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
    const sql = `
      SELECT
        id, fecha, sexo, dieta, color, aroma, firmeza, untuosidad, sabor_tostado, persistencia,
        aceptacion, liked, consume_again, recommend, descriptive_comments, affective_comments
      FROM public.encuestas
      ${where}
      ORDER BY fecha DESC
    `;

    const result = await this.db.query<SurveyRow>(sql, values);
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
