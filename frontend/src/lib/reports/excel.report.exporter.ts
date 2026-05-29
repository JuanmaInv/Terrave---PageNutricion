import * as XLSX from "xlsx";
import { type SurveyResponse } from "../nutrilen";
import { type ReportExporter } from "./report.exporter.interface";

/**
 * Generates an Excel (.xlsx) report from survey data.
 * Pattern: Strategy (implements ReportExporter)
 * SOLID: SRP — Excel generation logic is isolated here.
 */
export class ExcelReportExporter implements ReportExporter {
  filename(): string {
    return `nutrilen-encuestas-${Date.now()}.xlsx`;
  }

  async export(surveys: SurveyResponse[]): Promise<Blob> {
    const workbook = XLSX.utils.book_new();

    const rows = surveys.map((s) => ({
      id: s.id,
      fecha: s.date,
      sexo: s.sex,
      dieta: s.diet,
      color: s.attrs.color,
      aroma: s.attrs.aroma,
      firmeza: s.attrs.firmeza,
      untuosidad: s.attrs.untuosidad,
      sabor_tostado: s.attrs.sabor_tostado,
      persistencia: s.attrs.persistencia,
      comentarios_descriptivos: s.descriptiveComments ?? "",
      aceptacion: s.acceptance,
      gusto: s.liked,
      consumiria_nuevamente: s.consumeAgain,
      recomendacion: s.recommend,
      comentarios_afectivos: s.affectiveComments ?? "",
    }));

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Encuestas");

    const byDiet = new Map<string, number>();
    const bySex = new Map<string, number>();
    for (const s of surveys) {
      byDiet.set(s.diet, (byDiet.get(s.diet) ?? 0) + 1);
      bySex.set(s.sex, (bySex.get(s.sex) ?? 0) + 1);
    }

    const resumen = [
      { metrica: "Total encuestas", valor: surveys.length },
      {
        metrica: "Aceptacion promedio",
        valor:
          surveys.length === 0
            ? 0
            : Number(
                (surveys.reduce((acc, s) => acc + s.acceptance, 0) / surveys.length).toFixed(2)
              ),
      },
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(resumen), "Resumen");

    const dietRows = [...byDiet.entries()].map(([dieta, cantidad]) => ({ dieta, cantidad }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(dietRows), "Datos_Graf_Dieta");

    const sexRows = [...bySex.entries()].map(([sexo, cantidad]) => ({ sexo, cantidad }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sexRows), "Datos_Graf_Sexo");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }
}
