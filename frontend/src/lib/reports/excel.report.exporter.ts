import * as XLSX from "xlsx";
import { ATTRIBUTES, DIET_OPTIONS, SEX_OPTIONS, type AttrKey, type SurveyResponse } from "../nutrilen";
import type { ReportContext } from "./report.exporter.interface";
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

  async export(surveys: SurveyResponse[], context?: ReportContext): Promise<Blob> {
    const workbook = XLSX.utils.book_new();
    const total = surveys.length;

    const avgAttr = (key: AttrKey) =>
      total ? Number((surveys.reduce((acc, s) => acc + (s.attrs[key] ?? 0), 0) / total).toFixed(2)) : 0;
    const likedYes = surveys.filter((s) => s.liked === "si").length;
    const acceptancePct = total ? Number(((likedYes / total) * 100).toFixed(2)) : 0;
    const globalScore =
      ATTRIBUTES.length === 0
        ? 0
        : Number(
            (
              ATTRIBUTES.reduce((acc, attr) => acc + avgAttr(attr.key), 0) /
              ATTRIBUTES.length
            ).toFixed(2)
          );

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
      cuanto_pagaria_en_pesos: s.willingnessToPay ?? "",
      comentarios_afectivos: s.affectiveComments ?? "",
    }));

    const detailSheet = XLSX.utils.json_to_sheet(rows);
    detailSheet["!cols"] = [
      { wch: 12 }, { wch: 19 }, { wch: 12 }, { wch: 18 },
      { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
      { wch: 36 }, { wch: 10 }, { wch: 9 }, { wch: 16 }, { wch: 12 }, { wch: 24 }, { wch: 36 },
    ];
    detailSheet["!autofilter"] = { ref: "A1:Q1" };
    XLSX.utils.book_append_sheet(workbook, detailSheet, "Detalle_Encuestas");

    const byDiet = new Map<string, number>();
    const bySex = new Map<string, number>();
    for (const s of surveys) {
      byDiet.set(s.diet, (byDiet.get(s.diet) ?? 0) + 1);
      bySex.set(s.sex, (bySex.get(s.sex) ?? 0) + 1);
    }

    const sensorialRows = ATTRIBUTES.map((a) => ({
      atributo: a.label,
      promedio: avgAttr(a.key),
      escala: "1..5",
    }));

    const sortedSensorial = [...sensorialRows].sort((a, b) => b.promedio - a.promedio);
    const bestAttr = sortedSensorial[0];
    const worstAttr = sortedSensorial[sortedSensorial.length - 1];

    const dietRows = DIET_OPTIONS.map((d) => {
      const count = byDiet.get(d.id) ?? 0;
      return {
        dieta: d.label,
        cantidad: count,
        porcentaje: total ? Number(((count / total) * 100).toFixed(2)) : 0,
      };
    });

    const sexRows = SEX_OPTIONS.map((s) => {
      const count = bySex.get(s.id) ?? 0;
      return {
        sexo: s.label,
        cantidad: count,
        porcentaje: total ? Number(((count / total) * 100).toFixed(2)) : 0,
      };
    });

    const hourlyRows = Array.from({ length: 24 }, (_, hour) => ({
      hora: `${String(hour).padStart(2, "0")}h`,
      cantidad: 0,
    }));
    for (const survey of surveys) {
      const hour = new Date(survey.date).getHours();
      if (!Number.isNaN(hour)) hourlyRows[hour].cantidad += 1;
    }
    const peakHour = [...hourlyRows].sort((a, b) => b.cantidad - a.cantidad)[0];

    const dietAcceptanceRows = DIET_OPTIONS.map((d) => {
      const group = surveys.filter((x) => x.diet === d.id);
      const yes = group.filter((x) => x.liked === "si").length;
      return {
        dieta: d.label,
        participantes: group.length,
        aceptacion_pct: group.length ? Number(((yes / group.length) * 100).toFixed(2)) : 0,
      };
    }).filter((x) => x.participantes > 0);

    const priceValues = surveys
      .map((survey) => Number(survey.willingnessToPay?.trim() ?? ""))
      .filter((amount) => Number.isFinite(amount) && amount > 0)
      .sort((a, b) => a - b);
    const averagePrice = priceValues.length
      ? Number((priceValues.reduce((sum, amount) => sum + amount, 0) / priceValues.length).toFixed(2))
      : 0;
    const medianPrice = !priceValues.length
      ? 0
      : priceValues.length % 2 === 1
        ? priceValues[(priceValues.length - 1) / 2]
        : Number(
            (
              (priceValues[priceValues.length / 2 - 1] + priceValues[priceValues.length / 2]) /
              2
            ).toFixed(2),
          );

    const resumen = [
      { metrica: "Participantes", valor: total },
      { metrica: "Encuestas completas", valor: total },
      { metrica: "Puntaje global (prom. atributos)", valor: globalScore },
      { metrica: "Aceptacion (%)", valor: acceptancePct },
      { metrica: "Mejor valorado", valor: bestAttr?.atributo ?? "-" },
      { metrica: "Mejor valorado (puntaje)", valor: bestAttr?.promedio ?? 0 },
      { metrica: "Menor valoracion", valor: worstAttr?.atributo ?? "-" },
      { metrica: "Menor valoracion (puntaje)", valor: worstAttr?.promedio ?? 0 },
      { metrica: "Hora pico", valor: peakHour?.hora ?? "-" },
      { metrica: "Cantidad en hora pico", valor: peakHour?.cantidad ?? 0 },
      { metrica: "Respuestas de precio", valor: priceValues.length },
      { metrica: "Precio promedio (ARS)", valor: averagePrice },
      { metrica: "Precio mediano (ARS)", valor: medianPrice },
      { metrica: "Precio minimo (ARS)", valor: priceValues[0] ?? 0 },
      { metrica: "Precio maximo (ARS)", valor: priceValues[priceValues.length - 1] ?? 0 },
    ];
    const resumenSheet = XLSX.utils.json_to_sheet(resumen);
    resumenSheet["!cols"] = [{ wch: 42 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen");

    const informeEjecutivo = [
      {
        seccion: "Filtros utilizados",
        detalle: `Dieta: ${context?.filters?.diet ?? "Todas"} | Sexo: ${context?.filters?.sex ?? "Todos"} | Desde: ${context?.filters?.from ?? "-"} | Hasta: ${context?.filters?.to ?? "-"}`,
      },
      {
        seccion: "Resumen general",
        detalle: `Se analizaron ${total} encuesta(s). Aceptacion general: ${acceptancePct.toFixed(2)}%.`,
      },
      {
        seccion: "Fortaleza principal",
        detalle: `${bestAttr?.atributo ?? "-"} (${bestAttr?.promedio ?? 0}/5).`,
      },
      {
        seccion: "Oportunidad de mejora",
        detalle: `${worstAttr?.atributo ?? "-"} (${worstAttr?.promedio ?? 0}/5).`,
      },
      {
        seccion: "Hora pico",
        detalle: `${peakHour?.hora ?? "-"} con ${peakHour?.cantidad ?? 0} respuesta(s).`,
      },
      {
        seccion: "Disposicion a pagar",
        detalle: priceValues.length
          ? `Se registraron ${priceValues.length} respuesta(s) de precio. Promedio: ARS ${averagePrice.toFixed(0)} | Mediana: ARS ${medianPrice.toFixed(0)} | Rango: ARS ${(priceValues[0] ?? 0).toFixed(0)}-${(priceValues[priceValues.length - 1] ?? 0).toFixed(0)}.`
          : "No se registraron respuestas de precio para el filtro aplicado.",
      },
      {
        seccion: "Recomendacion 1",
        detalle: "Mantener atributos con puntajes mas altos mediante estandarizacion de formulacion.",
      },
      {
        seccion: "Recomendacion 2",
        detalle: "Priorizar mejoras sobre el atributo con menor puntaje en pruebas iterativas.",
      },
      {
        seccion: "Recomendacion 3",
        detalle: "Cruzar comentarios cualitativos con distribucion por dieta para decisiones de ajuste.",
      },
    ];
    const informeSheet = XLSX.utils.json_to_sheet(informeEjecutivo);
    informeSheet["!cols"] = [{ wch: 24 }, { wch: 110 }];
    XLSX.utils.book_append_sheet(workbook, informeSheet, "Informe_Ejecutivo");

    const attrSheet = XLSX.utils.json_to_sheet(sensorialRows);
    attrSheet["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(workbook, attrSheet, "Promedios_Atributos");

    const distDietaSheet = XLSX.utils.json_to_sheet(dietRows);
    distDietaSheet["!cols"] = [{ wch: 28 }, { wch: 16 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(workbook, distDietaSheet, "Distribucion_Dieta");

    const distSexoSheet = XLSX.utils.json_to_sheet(sexRows);
    distSexoSheet["!cols"] = [{ wch: 30 }, { wch: 16 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(workbook, distSexoSheet, "Distribucion_Sexo");

    const horaSheet = XLSX.utils.json_to_sheet(hourlyRows);
    horaSheet["!cols"] = [{ wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, horaSheet, "Frecuencia_Horaria");

    const aceptSheet = XLSX.utils.json_to_sheet(dietAcceptanceRows);
    aceptSheet["!cols"] = [{ wch: 28 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(workbook, aceptSheet, "Aceptacion_por_Dieta");

    const priceSheet = XLSX.utils.json_to_sheet(
      priceValues.length
        ? [
            { metrica: "Cantidad de respuestas", valor: priceValues.length },
            { metrica: "Precio promedio (ARS)", valor: averagePrice },
            { metrica: "Precio mediano (ARS)", valor: medianPrice },
            { metrica: "Precio minimo (ARS)", valor: priceValues[0] ?? 0 },
            { metrica: "Precio maximo (ARS)", valor: priceValues[priceValues.length - 1] ?? 0 },
            ...surveys
              .filter((survey) => (survey.willingnessToPay?.trim() ?? "").length > 0)
              .map((survey) => ({
                metrica: `Respuesta ${survey.id}`,
                valor: survey.willingnessToPay ?? "",
              })),
          ]
        : [{ metrica: "Precio", valor: "Sin respuestas de precio para el filtro aplicado." }],
    );
    priceSheet["!cols"] = [{ wch: 34 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(workbook, priceSheet, "Disposicion_Precio");

    const descriptiveRows = surveys
      .filter((s) => (s.descriptiveComments ?? "").trim().length > 0)
      .map((s) => ({
        id: s.id,
        fecha: s.date,
        dieta: s.diet,
        sexo: s.sex,
        comentario_descriptivo: s.descriptiveComments ?? "",
      }));

    const affectiveRows = surveys
      .filter((s) => (s.affectiveComments ?? "").trim().length > 0)
      .map((s) => ({
        id: s.id,
        fecha: s.date,
        dieta: s.diet,
        sexo: s.sex,
        comentario_afectivo: s.affectiveComments ?? "",
      }));

    const descSheet = XLSX.utils.json_to_sheet(
      descriptiveRows.length
        ? descriptiveRows
        : [{ comentario_descriptivo: "Sin comentarios descriptivos para el filtro aplicado." }]
    );
    descSheet["!cols"] = [{ wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, descSheet, "Obs_Descriptivas");

    const affSheet = XLSX.utils.json_to_sheet(
      affectiveRows.length
        ? affectiveRows
        : [{ comentario_afectivo: "Sin comentarios afectivos para el filtro aplicado." }]
    );
    affSheet["!cols"] = [{ wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, affSheet, "Obs_Afectivas");

    // Datos separados para crear gráficos rápidos en Excel (Insertar > Gráfico).
    const datosGrafDieta = XLSX.utils.json_to_sheet(
      dietRows.map((r) => ({ categoria: r.dieta, valor: r.cantidad, porcentaje: r.porcentaje }))
    );
    datosGrafDieta["!cols"] = [{ wch: 30 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, datosGrafDieta, "Datos_Graf_Dieta");

    const datosGrafSexo = XLSX.utils.json_to_sheet(
      sexRows.map((r) => ({ categoria: r.sexo, valor: r.cantidad, porcentaje: r.porcentaje }))
    );
    datosGrafSexo["!cols"] = [{ wch: 30 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, datosGrafSexo, "Datos_Graf_Sexo");

    const datosGrafHora = XLSX.utils.json_to_sheet(
      hourlyRows.map((r) => ({ hora: r.hora, valor: r.cantidad }))
    );
    datosGrafHora["!cols"] = [{ wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, datosGrafHora, "Datos_Graf_Hora");

    const datosGrafAcept = XLSX.utils.json_to_sheet(
      dietAcceptanceRows.map((r) => ({ dieta: r.dieta, aceptacion_pct: r.aceptacion_pct, participantes: r.participantes }))
    );
    datosGrafAcept["!cols"] = [{ wch: 30 }, { wch: 16 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(workbook, datosGrafAcept, "Datos_Graf_Acept");

    const instruccionesSheet = XLSX.utils.aoa_to_sheet([
      ["INSTRUCCIONES PARA GRAFICOS EN EXCEL"],
      [""],
      ["1) Abrir una hoja de datos:", "Datos_Graf_Dieta / Datos_Graf_Sexo / Datos_Graf_Hora / Datos_Graf_Acept"],
      ["2) Seleccionar el rango con encabezados."],
      ["3) Ir a Insertar > Gráfico recomendado."],
      ["4) Elegir tipo sugerido:", "Torta (dieta/sexo), Línea (hora), Barras (aceptación por dieta)."],
      [""],
      ["Nota técnica:", "La librería de exportación actual no incrusta gráficos nativos automáticamente en el .xlsx."],
    ]);
    instruccionesSheet["!cols"] = [{ wch: 36 }, { wch: 88 }];
    XLSX.utils.book_append_sheet(workbook, instruccionesSheet, "Como_Crear_Graficos");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }
}
