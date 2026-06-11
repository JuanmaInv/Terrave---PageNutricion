import type { AttrKey, Diet, Sex } from "@/lib/nutrilen";

export interface SurveySubmissionDraft {
  sex: Sex | null;
  diet: Diet | null;
  attrs: Record<AttrKey, number>;
  descriptiveComments: string;
  acceptance: number | null;
  liked: "si" | "no" | null;
  consumeAgain: "si" | "no" | "tal_vez" | null;
  recommend: number;
  willingnessToPay: string;
  affectiveComments: string;
}

export function sanitizeWillingnessToPay(value: string): string {
  return value.replace(/\D/g, "");
}

export function validateSurveyStepOne(draft: Pick<SurveySubmissionDraft, "sex" | "diet">): string | null {
  if (!draft.sex || !draft.diet) {
    return "Completá sexo y tipo de dieta para continuar.";
  }

  return null;
}

export function validateSurveyStepTwo(
  draft: Pick<SurveySubmissionDraft, "willingnessToPay" | "descriptiveComments">,
): string | null {
  if (!draft.willingnessToPay.trim()) {
    return "Completá el monto estimado para continuar.";
  }

  if (sanitizeWillingnessToPay(draft.willingnessToPay) !== draft.willingnessToPay) {
    return "Ingresá solo números para el monto estimado.";
  }

  if (!draft.descriptiveComments.trim()) {
    return "Completá los comentarios u observaciones para continuar.";
  }

  return null;
}

export function validateSurveyStepThree(
  draft: Pick<
    SurveySubmissionDraft,
    "acceptance" | "liked" | "consumeAgain" | "recommend" | "affectiveComments"
  >,
): string | null {
  if (draft.acceptance === null || !draft.liked || !draft.consumeAgain) {
    return "Completá la evaluación afectiva.";
  }

  if (!Number.isInteger(draft.recommend) || draft.recommend < 1 || draft.recommend > 5) {
    return "La recomendación debe estar entre 1 y 5.";
  }

  if (!draft.affectiveComments.trim()) {
    return "Completá los comentarios finales antes de enviar.";
  }

  return null;
}

export function validateSurveySubmission(draft: SurveySubmissionDraft): string | null {
  const stepOneError = validateSurveyStepOne(draft);
  if (stepOneError) {
    return "Faltan datos generales.";
  }

  const attrValues = Object.values(draft.attrs);
  const hasInvalidAttr = attrValues.some((value) => !Number.isInteger(value) || value < 1 || value > 5);
  if (hasInvalidAttr) {
    return "Hay respuestas sensoriales fuera de rango.";
  }

  const stepTwoError = validateSurveyStepTwo(draft);
  if (stepTwoError) {
    return stepTwoError;
  }

  const stepThreeError = validateSurveyStepThree(draft);
  if (stepThreeError) {
    return stepThreeError;
  }

  return null;
}
