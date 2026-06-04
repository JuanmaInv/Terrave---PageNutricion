import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadSurveys = vi.fn();
const saveSurvey = vi.fn();

vi.mock("./nutrilen", () => ({
  loadSurveys,
  saveSurvey,
}));

describe("Fallback local de la API", () => {
  beforeEach(() => {
    vi.resetModules();
    loadSurveys.mockReset();
    saveSurvey.mockReset();
    delete process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_DEV_LOCAL_FALLBACK = "true";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_DEV_LOCAL_FALLBACK;
  });

  it("debe filtrar estadísticas locales cuando no hay backend", async () => {
    loadSurveys.mockReturnValue([
      { id: "1", date: "2026-06-01T10:00:00.000Z", sex: "femenino", diet: "vegano" },
      { id: "2", date: "2026-06-02T10:00:00.000Z", sex: "masculino", diet: "omnivoro" },
    ]);

    const api = await import("./api");
    const result = await api.obtenerEstadisticas({ sex: "femenino" });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("debe devolver un resumen local consistente cuando no hay respuestas", async () => {
    loadSurveys.mockReturnValue([]);

    const api = await import("./api");
    await expect(api.obtenerResumenDashboard()).resolves.toEqual({
      completedCount: 0,
      inProgressCount: 0,
    });
  });
});
