import { describe, expect, it } from "vitest";
import { sampleSurveys } from "@/test/fixtures/surveys";
import { applySurveyFilters } from "./apply-survey-filters";

describe("Filtros del dashboard", () => {
  it("debe filtrar encuestas por sexo", () => {
    expect(applySurveyFilters(sampleSurveys, { sex: "femenino" })).toHaveLength(1);
  });

  it("debe filtrar encuestas por dieta", () => {
    expect(applySurveyFilters(sampleSurveys, { diet: "vegano" })).toHaveLength(2);
  });

  it("debe filtrar encuestas por rango de fechas", () => {
    const filtered = applySurveyFilters(sampleSurveys, {
      from: "2026-06-02",
      to: "2026-06-02",
    });

    expect(filtered.map((survey) => survey.id)).toEqual(["survey-2"]);
  });

  it("debe devolver una estructura valida cuando no hay resultados", () => {
    expect(
      applySurveyFilters(sampleSurveys, {
        sex: "femenino",
        diet: "vegano",
        from: "2030-01-01",
      }),
    ).toEqual([]);
  });
});
