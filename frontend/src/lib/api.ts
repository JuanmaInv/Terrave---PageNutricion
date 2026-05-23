/**
 * Servicio API centralizado de NutriLen.
 * Todas las llamadas al backend NestJS pasan por aquí.
 *
 * Endpoints previstos:
 *   POST /encuestas        → enviar respuesta de encuesta
 *   GET  /estadisticas     → obtener datos del dashboard
 *   GET  /admin/me         → validar usuario admin
 *   GET  /export/pdf       → exportar dashboard a PDF
 *   GET  /export/excel     → exportar datos a Excel
 *
 * Mientras no exista backend, las funciones operan en modo "mock" sobre
 * localStorage (ver src/lib/nutrilen.ts) y los endpoints quedan listos
 * para apuntar a VITE_API_URL cuando el backend esté disponible.
 */

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

/** POST /encuestas */
export async function enviarEncuesta(survey: SurveyResponse): Promise<void> {
  if (hasBackend()) {
    await request<void>("/encuestas", {
      method: "POST",
      body: JSON.stringify(survey),
    });
    return;
  }
  // Fallback mock → localStorage
  saveSurvey(survey);
}

/** GET /estadisticas */
export async function obtenerEstadisticas(): Promise<SurveyResponse[]> {
  if (hasBackend()) {
    return await request<SurveyResponse[]>("/estadisticas");
  }
  return loadSurveys();
}

/** GET /admin/me */
export async function validarAdmin(
  token?: string,
): Promise<{ isAdmin: boolean; email?: string }> {
  if (hasBackend()) {
    return await request("/admin/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }
  // En modo mock la validación real se hace con Clerk publicMetadata.role === "admin"
  return { isAdmin: true };
}

/** GET /export/pdf — devuelve un Blob para descargar */
export async function exportarPDF(): Promise<Blob | null> {
  if (hasBackend()) {
    const res = await fetch(`${API_URL}/export/pdf`);
    if (!res.ok) throw new Error(`Export PDF ${res.status}`);
    return await res.blob();
  }
  return null; // sin backend → se usa fallback local (window.print)
}

/** GET /export/excel — devuelve un Blob para descargar */
export async function exportarExcel(): Promise<Blob | null> {
  if (hasBackend()) {
    const res = await fetch(`${API_URL}/export/excel`);
    if (!res.ok) throw new Error(`Export Excel ${res.status}`);
    return await res.blob();
  }
  return null; // sin backend → se usa fallback local (CSV)
}

/** Descarga un Blob como archivo. */
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

/** Genera un CSV (Excel-compatible) a partir de las encuestas. */
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
