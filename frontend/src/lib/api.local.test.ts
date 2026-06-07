import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadSurveys = vi.fn();
const saveSurvey = vi.fn();

vi.mock("./nutrilen", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./nutrilen")>();
  return {
    ...actual,
    loadSurveys,
    saveSurvey,
  };
});

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

  it("debe normalizar errores de conexion para mostrarlos de forma clara", async () => {
    const api = await import("./api");

    expect(api.normalizeClientError(new Error("Failed to fetch"), "fallback").message).toBe(
      "Se perdio la conexion con el servidor. Verifica tu internet e intenta nuevamente.",
    );
    expect(api.normalizeClientError("NetworkError", "fallback").message).toBe(
      "Se perdio la conexion con el servidor. Verifica tu internet e intenta nuevamente.",
    );
  });

  it("debe exportar Excel localmente si falla el backend", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ message: "Excel export failed" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const api = await import("./api");
    const blob = await api.exportarExcel([
      {
        id: "1",
        date: "2026-06-01T10:00:00.000Z",
        sex: "femenino",
        diet: "vegano",
        attrs: {
          color: 3,
          aroma: 3,
          firmeza: 3,
          untuosidad: 3,
          sabor_tostado: 3,
          persistencia: 3,
        },
        descriptiveComments: "",
        acceptance: 3,
        liked: "si",
        consumeAgain: "si",
        recommend: 3,
        willingnessToPay: "4000",
        affectiveComments: "",
      },
    ]);

    expect(blob).toBeInstanceOf(Blob);
    vi.unstubAllGlobals();
  });
});
