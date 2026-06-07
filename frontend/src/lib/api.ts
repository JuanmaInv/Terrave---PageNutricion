import { loadSurveys, saveSurvey, type SurveyResponse } from "./nutrilen";
import { ReportFactory } from "./reports/report.factory";
import type { ReportContext } from "./reports/report.exporter.interface";
import { applySurveyFilters } from "./survey/apply-survey-filters";

export { ReportFactory };

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const ALLOW_LOCAL_FALLBACK = process.env.NEXT_PUBLIC_DEV_LOCAL_FALLBACK === "true";
const API_PREFIX = "/api/v1";

function parseBackendMessage(raw: string): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) return parsed.message.join(", ");
    if (typeof parsed.message === "string") return parsed.message;
  } catch {
    return raw.trim();
  }
  return raw.trim();
}

function isNetworkLikeMessage(message: string): boolean {
  return /Failed to fetch|fetch failed|NetworkError|network request failed|Load failed|ERR_NETWORK|ECONN|ENOTFOUND|timed out|timeout/i.test(
    message,
  );
}

function humanizeApiError(status: number, detail: string): string {
  if (status === 400) {
    return detail || "La solicitud contiene datos invalidos. Revisa los campos e intenta nuevamente.";
  }
  if (status === 401 || status === 403) {
    return "Tu sesion no es valida o no tienes permisos para realizar esta accion.";
  }
  if (status === 404) return "No se encontro el recurso solicitado en el backend.";
  if (status === 408) return "La solicitud tardo demasiado. Intenta nuevamente.";
  if (status === 429) {
    return "Hay demasiadas solicitudes en este momento. Espera unos segundos e intenta nuevamente.";
  }
  if (status === 500) return detail || "Ocurrio un error interno en el servidor.";
  if (status === 502 || status === 504) {
    return "No se pudo completar la conexion con el servidor. Intenta nuevamente en unos minutos.";
  }
  if (status === 503) {
    return "El servicio esta temporalmente no disponible. Intenta nuevamente en unos minutos.";
  }
  return detail || `El servidor respondio con error (${status}).`;
}

export function normalizeClientError(error: unknown, fallback: string): Error {
  if (typeof error === "string") {
    return new Error(
      isNetworkLikeMessage(error)
        ? "Se perdio la conexion con el servidor. Verifica tu internet e intenta nuevamente."
        : error,
    );
  }

  if (error instanceof Error) {
    if (isNetworkLikeMessage(error.message)) {
      return new Error(
        "Se perdio la conexion con el servidor. Verifica tu internet e intenta nuevamente.",
      );
    }

    if (/Backend no configurado/i.test(error.message)) {
      return new Error("El backend no esta configurado para esta accion.");
    }

    return error;
  }

  if (typeof error === "object" && error && "message" in error && typeof error.message === "string") {
    return normalizeClientError(error.message, fallback);
  }

  return new Error(fallback);
}

export function getUserFacingErrorMessage(error: unknown, fallback: string): string {
  return normalizeClientError(error, fallback).message;
}

export interface DashboardSummary {
  completedCount: number;
  inProgressCount: number;
}

export interface SurveySessionDraft {
  clientSessionKey: string;
  currentStep?: number;
  sex?: SurveyResponse["sex"];
  diet?: SurveyResponse["diet"];
  attrs?: Partial<SurveyResponse["attrs"]>;
  descriptiveComments?: string;
  acceptance?: number;
  liked?: SurveyResponse["liked"];
  consumeAgain?: SurveyResponse["consumeAgain"];
  recommend?: number;
  willingnessToPay?: string;
  affectiveComments?: string;
}

function hasBackend(): boolean {
  return Boolean(API_URL && API_URL.trim().length > 0);
}

/**
 * Base HTTP client with automatic /api/v1 prefix fallback.
 * Pattern: Template Method - defines the request flow (normalize -> fetch -> retry -> parse).
 * SOLID: SRP - only responsible for HTTP transport concerns.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const normalizedBase = API_URL.replace(/\/+$/, "");
  const primaryUrl = `${normalizedBase}${path}`;
  const prefixedUrl = `${normalizedBase}${API_PREFIX}${path}`;
  const shouldTryPrefixedFallback =
    normalizedBase.length > 0 && !normalizedBase.endsWith(API_PREFIX);

  let res: Response;
  try {
    res = await fetch(primaryUrl, {
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      ...init,
    });
  } catch (error) {
    throw normalizeClientError(error, "No se pudo completar la solicitud al backend.");
  }

  if (!res.ok && res.status === 404 && shouldTryPrefixedFallback) {
    try {
      res = await fetch(prefixedUrl, {
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
        ...init,
      });
    } catch (error) {
      throw normalizeClientError(error, "No se pudo completar la solicitud al backend.");
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(humanizeApiError(res.status, parseBackendMessage(body)));
  }

  return (await res.json()) as T;
}

async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
  const normalizedBase = API_URL.replace(/\/+$/, "");
  const primaryUrl = `${normalizedBase}${path}`;
  const prefixedUrl = `${normalizedBase}${API_PREFIX}${path}`;
  const shouldTryPrefixedFallback =
    normalizedBase.length > 0 && !normalizedBase.endsWith(API_PREFIX);

  let res: Response;
  try {
    res = await fetch(primaryUrl, {
      headers: { ...(init?.headers || {}) },
      ...init,
    });
  } catch (error) {
    throw normalizeClientError(error, "No se pudo descargar el archivo solicitado.");
  }

  if (!res.ok && res.status === 404 && shouldTryPrefixedFallback) {
    try {
      res = await fetch(prefixedUrl, {
        headers: { ...(init?.headers || {}) },
        ...init,
      });
    } catch (error) {
      throw normalizeClientError(error, "No se pudo descargar el archivo solicitado.");
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(humanizeApiError(res.status, parseBackendMessage(body)));
  }

  return await res.blob();
}

export async function enviarEncuesta(survey: SurveyResponse): Promise<void> {
  if (hasBackend()) {
    try {
      await request<void>("/encuestas", {
        method: "POST",
        body: JSON.stringify(survey),
      });
      return;
    } catch (error) {
      if (ALLOW_LOCAL_FALLBACK) {
        saveSurvey(survey);
        return;
      }
      throw normalizeClientError(error, "No se pudo registrar la encuesta en el backend.");
    }
  }

  if (ALLOW_LOCAL_FALLBACK) {
    saveSurvey(survey);
    return;
  }

  throw new Error("Backend no configurado.");
}

export async function crearSesionEncuesta(
  draft: SurveySessionDraft,
): Promise<{ id: string; startedAt: string; updatedAt: string }> {
  if (!hasBackend()) {
    throw new Error("Backend no configurado.");
  }

  return await request("/encuestas/sesiones", {
    method: "POST",
    body: JSON.stringify(draft),
  });
}

export async function actualizarSesionEncuesta(
  sessionId: string,
  draft: SurveySessionDraft,
): Promise<{ id: string; startedAt: string; updatedAt: string }> {
  if (!hasBackend()) {
    throw new Error("Backend no configurado.");
  }

  return await request(`/encuestas/sesiones/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify(draft),
  });
}

export async function obtenerEstadisticas(params?: {
  token?: string;
  diet?: string;
  sex?: string;
  from?: string;
  to?: string;
}): Promise<SurveyResponse[]> {
  if (hasBackend()) {
    try {
      const query = new URLSearchParams();
      if (params?.diet && params.diet !== "all") query.set("diet", params.diet);
      if (params?.sex && params.sex !== "all") query.set("sex", params.sex);
      if (params?.from) query.set("from", params.from);
      if (params?.to) query.set("to", params.to);
      const qs = query.toString();
      return await request<SurveyResponse[]>(`/estadisticas${qs ? `?${qs}` : ""}`, {
        headers: params?.token ? { Authorization: `Bearer ${params.token}` } : undefined,
      });
    } catch (error) {
      if (ALLOW_LOCAL_FALLBACK) return loadSurveys();
      throw normalizeClientError(error, "No se pudieron obtener estadisticas del backend.");
    }
  }

  if (ALLOW_LOCAL_FALLBACK) return applySurveyFilters(loadSurveys(), params);
  throw new Error("Backend no configurado.");
}

export async function obtenerResumenDashboard(params?: {
  token?: string;
  diet?: string;
  sex?: string;
  from?: string;
  to?: string;
}): Promise<DashboardSummary> {
  if (hasBackend()) {
    const query = new URLSearchParams();
    if (params?.diet && params.diet !== "all") query.set("diet", params.diet);
    if (params?.sex && params.sex !== "all") query.set("sex", params.sex);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const qs = query.toString();

    return await request<DashboardSummary>(`/estadisticas/resumen${qs ? `?${qs}` : ""}`, {
      headers: params?.token ? { Authorization: `Bearer ${params.token}` } : undefined,
    });
  }

  if (ALLOW_LOCAL_FALLBACK) {
    const local = applySurveyFilters(loadSurveys(), params);
    return {
      completedCount: local.length,
      inProgressCount: 0,
    };
  }

  throw new Error("Backend no configurado.");
}

export async function validarAdmin(
  token?: string,
): Promise<{ isAdmin: boolean; email?: string }> {
  if (hasBackend()) {
    return await request("/admin/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }
  return { isAdmin: false };
}

export async function sincronizarUsuarioClerk(
  token?: string,
): Promise<{ email: string; role: string; isAdmin: boolean } | null> {
  if (!hasBackend() || !token) {
    return null;
  }

  return await request("/admin/sync-user", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function exportarPDF(
  surveys: SurveyResponse[],
  context?: ReportContext,
): Promise<Blob> {
  const { blob } = await ReportFactory.exportAs("pdf", surveys, context);
  return blob;
}

export async function exportarExcel(
  surveys: SurveyResponse[],
  context?: ReportContext,
  token?: string,
): Promise<Blob> {
  if (hasBackend()) {
    try {
      const query = new URLSearchParams();
      if (context?.filters?.diet && context.filters.diet !== "all") {
        query.set("diet", context.filters.diet);
      }
      if (context?.filters?.sex && context.filters.sex !== "all") {
        query.set("sex", context.filters.sex);
      }
      if (context?.filters?.from) query.set("from", context.filters.from);
      if (context?.filters?.to) query.set("to", context.filters.to);
      const qs = query.toString();
      return await requestBlob(`/estadisticas/excel${qs ? `?${qs}` : ""}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch (error) {
      const { blob } = await ReportFactory.exportAs("excel", surveys, context);
      console.warn("Backend Excel export failed. Using local exporter fallback.", error);
      return blob;
    }
  }

  const { blob } = await ReportFactory.exportAs("excel", surveys, context);
  return blob;
}

export function descargarBlob(blob: Blob, filename: string): void {
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
    "cuanto_pagaria_en_pesos",
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
      s.willingnessToPay ?? "",
      s.affectiveComments ?? "",
    ]
      .map(escape)
      .join(","),
  );

  return "\ufeff" + [headers.join(","), ...rows].join("\n");
}
