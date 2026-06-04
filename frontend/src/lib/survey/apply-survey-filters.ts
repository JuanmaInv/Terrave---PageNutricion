import type { SurveyResponse } from "@/lib/nutrilen";

export interface SurveyApiFilters {
  diet?: string;
  sex?: string;
  from?: string;
  to?: string;
}

const ARGENTINA_TIMEZONE = "America/Argentina/Buenos_Aires";

function toArgentinaDateOnly(value: string): string | null {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ARGENTINA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

export function applySurveyFilters(
  surveys: SurveyResponse[],
  filters?: SurveyApiFilters,
): SurveyResponse[] {
  return surveys.filter((survey) => {
    const surveyDate = toArgentinaDateOnly(survey.date);

    if (filters?.diet && filters.diet !== "all" && survey.diet !== filters.diet) {
      return false;
    }

    if (filters?.sex && filters.sex !== "all" && survey.sex !== filters.sex) {
      return false;
    }

    if (filters?.from) {
      if (surveyDate && surveyDate < filters.from) {
        return false;
      }
    }

    if (filters?.to) {
      if (surveyDate && surveyDate > filters.to) {
        return false;
      }
    }

    return true;
  });
}
