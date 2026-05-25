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
  const PAGE_W = 595;
  const MARGIN = 32;
  const CARD_BG: [number, number, number] = [248, 245, 238];
  const VANDYKE: [number, number, number] = [101, 56, 43];
  const MOSS: [number, number, number] = [137, 140, 50];
  const PUMPKIN: [number, number, number] = [255, 109, 14];
  const ORANGE: [number, number, number] = [244, 178, 35];

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
  const drawCard = (x: number, y: number, w: number, h: number, title: string, value: string) => {
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(x, y, w, h, 10, 10, "F");
    doc.setTextColor(...VANDYKE);
    doc.setFontSize(9);
    doc.text(title, x + 10, y + 18);
    doc.setFontSize(22);
    doc.text(value, x + 10, y + 42);
  };

  doc.setTextColor(...VANDYKE);
  doc.setFontSize(26);
  doc.text("Resultados de la evaluacion", MARGIN, 46);
  doc.setFontSize(11);
  doc.text(`Fecha: ${new Date().toLocaleString("es-AR")}`, MARGIN, 64);
  doc.text(`Filtro aplicado - Participantes: ${total}`, MARGIN, 79);

  const cardY = 95;
  const gap = 12;
  const cardW = (PAGE_W - MARGIN * 2 - gap * 3) / 4;
  drawCard(MARGIN, cardY, cardW, 56, "Participantes", String(total));
  drawCard(MARGIN + (cardW + gap), cardY, cardW, 56, "Encuestas completas", String(total));
  drawCard(MARGIN + (cardW + gap) * 2, cardY, cardW, 56, "Puntaje global", String(avg((s) => s.acceptance)));
  drawCard(MARGIN + (cardW + gap) * 3, cardY, cardW, 56, "Aceptacion", `${acceptancePct}%`);

  doc.setFontSize(14);
  doc.text("Promedios por atributo", MARGIN, 182);
  const attrs: Array<{ name: string; value: number }> = [
    { name: "Color", value: avgAttr("color") },
    { name: "Aroma", value: avgAttr("aroma") },
    { name: "Firmeza / Cohesividad", value: avgAttr("firmeza") },
    { name: "Untuosidad", value: avgAttr("untuosidad") },
    { name: "Sabor tostado/cocido", value: avgAttr("sabor_tostado") },
    { name: "Persistencia (Regusto)", value: avgAttr("persistencia") },
  ];

  let barY = 200;
  for (const attr of attrs) {
    doc.setFontSize(10);
    doc.text(attr.name, MARGIN, barY);
    doc.setFillColor(231, 224, 210);
    doc.roundedRect(MARGIN, barY + 6, 420, 8, 4, 4, "F");
    doc.setFillColor(...MOSS);
    doc.roundedRect(MARGIN, barY + 6, (420 * attr.value) / 5, 8, 4, 4, "F");
    doc.setTextColor(...PUMPKIN);
    doc.text(`${attr.value.toFixed(1)} / 5`, MARGIN + 430, barY + 13);
    doc.setTextColor(...VANDYKE);
    barY += 28;
  }

  doc.setFontSize(14);
  doc.text("Distribucion de dietas", MARGIN, barY + 12);
  barY += 26;
  for (const [name, count] of dietDist) {
    const pct = total ? (count / total) * 100 : 0;
    doc.setFontSize(10);
    doc.text(name, MARGIN, barY);
    doc.setFillColor(240, 235, 224);
    doc.roundedRect(MARGIN + 110, barY - 7, 220, 10, 4, 4, "F");
    doc.setFillColor(...ORANGE);
    doc.roundedRect(MARGIN + 110, barY - 7, (220 * pct) / 100, 10, 4, 4, "F");
    doc.text(`${pct.toFixed(1)}% (${count})`, MARGIN + 340, barY + 1);
    barY += 20;
  }

  doc.setFontSize(14);
  doc.text("Distribucion por sexo", MARGIN, barY + 14);
  barY += 28;
  for (const [name, count] of sexDist) {
    const pct = total ? (count / total) * 100 : 0;
    doc.setFontSize(10);
    doc.text(name, MARGIN, barY);
    doc.setFillColor(240, 235, 224);
    doc.roundedRect(MARGIN + 110, barY - 7, 220, 10, 4, 4, "F");
    doc.setFillColor(...PUMPKIN);
    doc.roundedRect(MARGIN + 110, barY - 7, (220 * pct) / 100, 10, 4, 4, "F");
    doc.text(`${pct.toFixed(1)}% (${count})`, MARGIN + 340, barY + 1);
    barY += 20;
  }

  if (barY > 640) {
    doc.addPage();
    barY = 60;
  }

  doc.setFontSize(14);
  doc.text("Frecuencia de consumo por hora", MARGIN, barY);
  const chartX = MARGIN;
  const chartY = barY + 16;
  const chartW = PAGE_W - MARGIN * 2 - 10;
  const chartH = 120;
  const maxCount = Math.max(1, ...hourly.map((h) => h.count));
  doc.setDrawColor(220);
  doc.rect(chartX, chartY, chartW, chartH);
  doc.setDrawColor(...PUMPKIN);
  let prevX = chartX;
  let prevY = chartY + chartH;
  for (let i = 0; i < hourly.length; i++) {
    const x = chartX + (i / 23) * chartW;
    const y = chartY + chartH - (hourly[i].count / maxCount) * (chartH - 8);
    if (i > 0) doc.line(prevX, prevY, x, y);
    doc.setFillColor(...PUMPKIN);
    doc.circle(x, y, 1.8, "F");
    prevX = x;
    prevY = y;
  }

  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(...VANDYKE);
  doc.text("Detalle de encuestas filtradas", MARGIN, 38);
  autoTable(doc, {
    startY: 50,
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
    headStyles: { fillColor: VANDYKE },
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
    headStyles: { fillColor: MOSS },
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
    headStyles: { fillColor: PUMPKIN },
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
