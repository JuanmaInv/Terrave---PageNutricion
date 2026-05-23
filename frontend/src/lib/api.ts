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
    await request<void>("/encuestas", {
      method: "POST",
      body: JSON.stringify(survey),
    });
    return;
  }
  saveSurvey(survey);
}

export async function obtenerEstadisticas(): Promise<SurveyResponse[]> {
  if (hasBackend()) {
    return await request<SurveyResponse[]>("/estadisticas");
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

  doc.setFontSize(16);
  doc.text("NutriLen - Reporte de Evaluacion Sensorial", 40, 44);
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleString("es-AR")}`, 40, 62);
  doc.text(`Encuestas: ${surveys.length}`, 40, 76);

  autoTable(doc, {
    startY: 96,
    head: [["ID", "Fecha", "Sexo", "Dieta", "Aceptacion", "Gusto", "Recompra", "Recomienda"]],
    body: surveys.map((s) => [
      s.id,
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
