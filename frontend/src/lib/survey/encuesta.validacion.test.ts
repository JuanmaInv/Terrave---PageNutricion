import { describe, expect, it } from "vitest";
import {
  sanitizeWillingnessToPay,
  validateSurveyStepOne,
  validateSurveyStepTwo,
  validateSurveyStepThree,
  validateSurveySubmission,
  type SurveySubmissionDraft,
} from "./survey-validation";

function buildDraft(overrides: Partial<SurveySubmissionDraft> = {}): SurveySubmissionDraft {
  return {
    sex: "femenino",
    diet: "omnivoro",
    attrs: {
      color: 4,
      aroma: 4,
      firmeza: 4,
      untuosidad: 4,
      sabor_tostado: 4,
      persistencia: 4,
    },
    descriptiveComments: "Perfil sensorial estable.",
    acceptance: 4,
    liked: "si",
    consumeAgain: "si",
    recommend: 4,
    willingnessToPay: "4500",
    affectiveComments: "Buen sabor general.",
    ...overrides,
  };
}

describe("Validación de encuesta", () => {
  it("debe permitir una encuesta completa válida", () => {
    expect(validateSurveySubmission(buildDraft())).toBeNull();
  });

  it("debe rechazar una encuesta incompleta", () => {
    expect(
      validateSurveySubmission(buildDraft({ acceptance: null })),
    ).toBe("Completá la evaluación afectiva.");
  });

  it("debe rechazar campos obligatorios vacíos", () => {
    expect(validateSurveyStepOne({ sex: null, diet: null })).toBe(
      "Completá sexo y tipo de dieta para continuar.",
    );
  });

  it("debe rechazar respuestas fuera de rango", () => {
    expect(
      validateSurveySubmission(buildDraft({ attrs: { ...buildDraft().attrs, color: 8 } })),
    ).toBe("Hay respuestas sensoriales fuera de rango.");
  });

  it("debe exigir el monto estimado para continuar y enviar", () => {
    expect(validateSurveyStepTwo({ willingnessToPay: "", descriptiveComments: "ok" })).toBe(
      "Completá el monto estimado para continuar.",
    );
    expect(validateSurveySubmission(buildDraft({ willingnessToPay: "" }))).toBe(
      "Completá el monto estimado para continuar.",
    );
  });

  it("debe exigir comentarios descriptivos en el paso 2", () => {
    expect(validateSurveyStepTwo({ willingnessToPay: "4500", descriptiveComments: "" })).toBe(
      "Completá los comentarios u observaciones para continuar.",
    );
    expect(validateSurveySubmission(buildDraft({ descriptiveComments: "" }))).toBe(
      "Completá los comentarios u observaciones para continuar.",
    );
  });

  it("debe exigir comentarios finales en el paso 3", () => {
    expect(
      validateSurveyStepThree({
        acceptance: 4,
        liked: "si",
        consumeAgain: "si",
        recommend: 4,
        affectiveComments: "",
      }),
    ).toBe("Completá los comentarios finales antes de enviar.");
    expect(validateSurveySubmission(buildDraft({ affectiveComments: "" }))).toBe(
      "Completá los comentarios finales antes de enviar.",
    );
  });

  it("debe rechazar un monto estimado con formato inválido", () => {
    expect(validateSurveySubmission(buildDraft({ willingnessToPay: "4500 pesos" }))).toBe(
      "Ingresá solo números para el monto estimado.",
    );
  });

  it("debe normalizar el monto estimado a solo dígitos", () => {
    expect(sanitizeWillingnessToPay("$ 4.500 pesos")).toBe("4500");
  });
}
