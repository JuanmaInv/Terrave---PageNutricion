import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { loadSurveys, saveSurvey, type SurveyResponse } from "./nutrilen";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function hasBackend(): boolean {
  return Boolean(API_URL && API_URL.trim().length > 0);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export async function enviarEncuesta(survey: SurveyResponse): Promise<void> {
  if (hasBackend()) {
    try {
      await request<void>("/encuestas", {
        method: "POST",
        body: JSON.stringify(survey),
      });
      return;
    } catch {
      // Fallback para entorno de desarrollo si backend no esta disponible
      saveSurvey(survey);
      return;
    }
  }
  saveSurvey(survey);
}

export async function obtenerEstadisticas(): Promise<SurveyResponse[]> {
  if (hasBackend()) {
    try {
      return await request<SurveyResponse[]>("/estadisticas");
    } catch {
      return loadSurveys();
    }
  }
  return loadSurveys();
}

export async function validarAdmin(
  token?: string,
): Promise<{ isAdmin: boolean; email?: string }> {
  if (hasBackend()) {
    return await request("/admin/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }
  return { isAdmin: true };
}

export async function exportarPDF(surveys: SurveyResponse[]): Promise<Blob> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const total = surveys.length;
  const avg = (pick: (s: SurveyResponse) => number) =>
    total ? Number((surveys.reduce((acc, s) => acc + pick(s), 0) / total).toFixed(2)) : 0;
  const avgAttr = (key: keyof SurveyResponse["attrs"]) =>
    total ? Number((surveys.reduce((acc, s) => acc + s.attrs[key], 0) / total).toFixed(2)) : 0;
  const likedYes = surveys.filter((s) => s.liked === "si").length;
  const acceptancePct = total ? Number(((likedYes / total) * 100).toFixed(2)) : 0;

  const groupCount = (values: string[]) => {
    const map = new Map<string, number>();
    for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };

  const dietDist = groupCount(surveys.map((s) => s.diet));
  const sexDist = groupCount(surveys.map((s) => s.sex));

  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  for (const s of surveys) {
    const h = new Date(s.date).getHours();
    if (!Number.isNaN(h)) hourly[h].count += 1;
  }

  doc.setFontSize(22);
  doc.text("NutriLen - Reporte de Evaluacion Sensorial", 40, 44);
  doc.setFontSize(10);
  doc.text(`Fecha de emision: ${new Date().toLocaleString("es-AR")}`, 40, 62);
  doc.text(`Participantes filtrados: ${total}`, 40, 76);

  autoTable(doc, {
    startY: 90,
    head: [["KPI", "Valor"]],
    body: [
      ["Encuestas completas", String(total)],
      ["Aceptacion", `${acceptancePct}%`],
      ["Puntaje global (promedio aceptacion)", String(avg((s) => s.acceptance))],
      ["Recomendacion promedio", String(avg((s) => s.recommend))],
    ],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [101, 56, 43] },
    columnStyles: { 0: { cellWidth: 280 }, 1: { cellWidth: 220 } },
  });

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
      ? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14
      : 160,
    head: [["Atributo", "Promedio (1-5)"]],
    body: [
      ["Color", String(avgAttr("color"))],
      ["Aroma", String(avgAttr("aroma"))],
      ["Firmeza / Cohesividad", String(avgAttr("firmeza"))],
      ["Untuosidad", String(avgAttr("untuosidad"))],
      ["Sabor tostado/cocido", String(avgAttr("sabor_tostado"))],
      ["Persistencia (Regusto)", String(avgAttr("persistencia"))],
    ],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [137, 140, 50] },
  });

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14
      : 260,
    head: [["Distribucion por dieta", "Cantidad", "%"]],
    body: dietDist.map(([name, count]) => [name, String(count), total ? `${((count / total) * 100).toFixed(2)}%` : "0%"]),
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [244, 178, 35] },
  });

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
      : 340,
    head: [["Distribucion por sexo", "Cantidad", "%"]],
    body: sexDist.map(([name, count]) => [name, String(count), total ? `${((count / total) * 100).toFixed(2)}%` : "0%"]),
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [255, 109, 14] },
  });

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
      : 420,
    head: [["Hora", "Frecuencia"]],
    body: hourly.filter((h) => h.count > 0).map((h) => [`${String(h.hour).padStart(2, "0")}h`, String(h.count)]),
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [101, 56, 43] },
  });

  doc.addPage();
  doc.setFontSize(14);
  doc.text("Detalle de encuestas filtradas", 40, 40);
  autoTable(doc, {
    startY: 52,
    head: [["#", "Fecha", "Sexo", "Dieta", "Aceptacion", "Gusto", "Recompra", "Recomienda"]],
    body: surveys.map((s, i) => [
      String(i + 1),
      new Date(s.date).toLocaleString("es-AR"),
      s.sex,
      s.diet,
      String(s.acceptance),
      s.liked,
      s.consumeAgain,
      String(s.recommend),
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [101, 56, 43] },
  });

  const descriptive = surveys
    .map((s, i) => ({ n: i + 1, text: s.descriptiveComments?.trim() ?? "" }))
    .filter((x) => x.text.length > 0);
  const affective = surveys
    .map((s, i) => ({ n: i + 1, text: s.affectiveComments?.trim() ?? "" }))
    .filter((x) => x.text.length > 0);

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
      : 420,
    head: [["Observaciones descriptivas", "Comentario"]],
    body:
      descriptive.length > 0
        ? descriptive.map((d) => [`Participante ${d.n}`, d.text])
        : [["-", "Sin comentarios descriptivos para este filtro"]],
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [137, 140, 50] },
    columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 390 } },
  });

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
      : 520,
    head: [["Observaciones afectivas", "Comentario"]],
    body:
      affective.length > 0
        ? affective.map((d) => [`Participante ${d.n}`, d.text])
        : [["-", "Sin comentarios afectivos para este filtro"]],
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [255, 109, 14] },
    columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 390 } },
  });

  const blob = doc.output("blob");
  return blob;
}

export async function exportarExcel(surveys: SurveyResponse[]): Promise<Blob> {
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

  const detailSheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, detailSheet, "Encuestas");

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
              (
                surveys.reduce((acc, s) => acc + s.acceptance, 0) / surveys.length
              ).toFixed(2),
            ),
    },
  ];
  const resumenSheet = XLSX.utils.json_to_sheet(resumen);
  XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen");

  const dietRows = [...byDiet.entries()].map(([dieta, cantidad]) => ({ dieta, cantidad }));
  const dietSheet = XLSX.utils.json_to_sheet(dietRows);
  XLSX.utils.book_append_sheet(workbook, dietSheet, "Datos_Graf_Dieta");

  const sexRows = [...bySex.entries()].map(([sexo, cantidad]) => ({ sexo, cantidad }));
  const sexSheet = XLSX.utils.json_to_sheet(sexRows);
  XLSX.utils.book_append_sheet(workbook, sexSheet, "Datos_Graf_Sexo");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function descargarBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function encuestasACSV(surveys: SurveyResponse[]): string {
  const headers = [
    "id",
    "fecha",
    "sexo",
    "dieta",
    "color",
    "aroma",
    "firmeza",
    "untuosidad",
    "sabor_tostado",
    "persistencia",
    "comentarios_descriptivos",
    "aceptacion",
    "gusto",
    "consumiria_nuevamente",
    "recomendacion",
    "comentarios_afectivos",
  ];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = surveys.map((s) =>
    [
      s.id,
      s.date,
      s.sex,
      s.diet,
      s.attrs.color,
      s.attrs.aroma,
      s.attrs.firmeza,
      s.attrs.untuosidad,
      s.attrs.sabor_tostado,
      s.attrs.persistencia,
      s.descriptiveComments ?? "",
      s.acceptance,
      s.liked,
      s.consumeAgain,
      s.recommend,
      s.affectiveComments ?? "",
    ]
      .map(escape)
      .join(","),
  );
  return "\ufeff" + [headers.join(","), ...rows].join("\n");
}
