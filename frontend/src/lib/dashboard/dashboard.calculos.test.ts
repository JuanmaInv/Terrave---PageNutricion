import { describe, expect, it } from "vitest";
import { sampleSurveys } from "@/test/fixtures/surveys";
import { buildAdminDashboardViewModel } from "./build-admin-dashboard-view-model";

describe("Cálculos del dashboard", () => {
  it("debe calcular totales, promedios y porcentajes correctamente", () => {
    const viewModel = buildAdminDashboardViewModel(sampleSurveys, 2);

    expect(viewModel.total).toBe(3);
    expect(viewModel.completedCount).toBe(3);
    expect(viewModel.inProgressCount).toBe(2);
    expect(viewModel.acceptancePct).toBe(67);
    expect(viewModel.globalScore).toBeGreaterThan(0);
  });

  it("debe agrupar respuestas por opción con labels compatibles para gráficos", () => {
    const viewModel = buildAdminDashboardViewModel(sampleSurveys);

    expect(viewModel.dietDist.find((item) => item.id === "vegano")).toMatchObject({
      name: "Vegano",
      value: 2,
    });
    expect(viewModel.sexDist.map((item) => item.name)).toContain("Femenino");
    expect(viewModel.hourlyDist).toHaveLength(24);
    expect(viewModel.hourlyDist.reduce((sum, item) => sum + item.count, 0)).toBe(3);
    expect(viewModel.hourlyDist.some((item) => item.label.endsWith("h") && item.count > 0)).toBe(true);
  });

  it("debe devolver un dashboard válido cuando no hay respuestas", () => {
    const viewModel = buildAdminDashboardViewModel([]);

    expect(viewModel.total).toBe(0);
    expect(viewModel.acceptancePct).toBe(0);
    expect(viewModel.globalScore).toBe(0);
    expect(viewModel.dietAcceptance).toEqual([]);
    expect(viewModel.hourlyDist).toHaveLength(24);
  });
});
