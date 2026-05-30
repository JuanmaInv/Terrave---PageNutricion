import { loadSurveys, saveSurvey, type SurveyResponse } from "./nutrilen";
import { ReportFactory } from "./reports/report.factory";
import type { ReportContext } from "./reports/report.exporter.interface";

export { ReportFactory };

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const ALLOW_LOCAL_FALLBACK = process.env.NEXT_PUBLIC_DEV_LOCAL_FALLBACK === "true";
const API_PREFIX = "/api/v1";

function hasBackend(): boolean {
  return Boolean(API_URL && API_URL.trim().length > 0);
}

/**
 * Base HTTP client with automatic /api/v1 prefix fallback.
 * Pattern: Template Method — defines the request flow (normalize → fetch → retry → parse).
 * SOLID: SRP — only responsible for HTTP transport concerns.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const normalizedBase = API_URL.replace(/\/+$/, "");
  const primaryUrl = `${normalizedBase}${path}`;
  const prefixedUrl = `${normalizedBase}${API_PREFIX}${path}`;
  const shouldTryPrefixedFallback =
    normalizedBase.length > 0 && !normalizedBase.endsWith(API_PREFIX);

  let res = await fetch(primaryUrl, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });

  if (!res.ok && res.status === 404 && shouldTryPrefixedFallback) {
    res = await fetch(prefixedUrl, {
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      ...init,
    });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText}${body ? `: ${body}` : ""}`);
  }
  return (await res.json()) as T;
}

async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
  const normalizedBase = API_URL.replace(/\/+$/, "");
  const primaryUrl = `${normalizedBase}${path}`;
  const prefixedUrl = `${normalizedBase}${API_PREFIX}${path}`;
  const shouldTryPrefixedFallback =
    normalizedBase.length > 0 && !normalizedBase.endsWith(API_PREFIX);

  let res = await fetch(primaryUrl, {
    headers: { ...(init?.headers || {}) },
    ...init,
  });

  if (!res.ok && res.status === 404 && shouldTryPrefixedFallback) {
    res = await fetch(prefixedUrl, {
      headers: { ...(init?.headers || {}) },
      ...init,
    });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText}${body ? `: ${body}` : ""}`);
  }

  return await res.blob();
}

// ---------------------------------------------------------------------------
// Public API functions — Facade over the HTTP transport layer
// ---------------------------------------------------------------------------

export async function enviarEncuesta(survey: SurveyResponse): Promise<void> {
  if (hasBackend()) {
    try {
      await request<void>("/encuestas", {
        method: "POST",
        body: JSON.stringify(survey),
      });
      return;
    } catch {
      if (ALLOW_LOCAL_FALLBACK) {
        saveSurvey(survey);
        return;
      }
      throw new Error("No se pudo registrar la encuesta en el backend.");
    }
  }
  if (ALLOW_LOCAL_FALLBACK) {
    saveSurvey(survey);
    return;
  }
  throw new Error("Backend no configurado.");
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
      throw error instanceof Error
        ? error
        : new Error("No se pudieron obtener estadisticas del backend.");
    }
  }
  if (ALLOW_LOCAL_FALLBACK) return loadSurveys();
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

// ---------------------------------------------------------------------------
// Export helpers — delegate to ReportFactory (Factory pattern)
// Re-exported for backward compatibility with existing callers.
// ---------------------------------------------------------------------------

export async function exportarPDF(surveys: SurveyResponse[], context?: ReportContext): Promise<Blob> {
  const { blob } = await ReportFactory.exportAs("pdf", surveys, context);
  return blob;
}

export async function exportarExcel(
  surveys: SurveyResponse[],
  context?: ReportContext,
  token?: string
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
      // In development we allow local fallback; in deployed envs we fail fast
      // so the team can fix backend exporter issues and keep dynamic reports.
      if (ALLOW_LOCAL_FALLBACK) {
        const { blob } = await ReportFactory.exportAs("excel", surveys, context);
        console.error("Backend Excel export failed. Using local exporter fallback.", error);
        return blob;
      }
      throw error;
    }
  }
  if (ALLOW_LOCAL_FALLBACK) {
    const { blob } = await ReportFactory.exportAs("excel", surveys, context);
    return blob;
  }
  throw new Error("Backend no configurado para exportación Excel dinámica.");
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
    "id", "fecha", "sexo", "dieta", "color", "aroma", "firmeza",
    "untuosidad", "sabor_tostado", "persistencia", "comentarios_descriptivos",
    "aceptacion", "gusto", "consumiria_nuevamente", "recomendacion", "comentarios_afectivos",
  ];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = surveys.map((s) =>
    [
      s.id, s.date, s.sex, s.diet,
      s.attrs.color, s.attrs.aroma, s.attrs.firmeza, s.attrs.untuosidad,
      s.attrs.sabor_tostado, s.attrs.persistencia,
      s.descriptiveComments ?? "",
      s.acceptance, s.liked, s.consumeAgain, s.recommend,
      s.affectiveComments ?? "",
    ]
      .map(escape)
      .join(",")
  );
  return "\ufeff" + [headers.join(","), ...rows].join("\n");
}
