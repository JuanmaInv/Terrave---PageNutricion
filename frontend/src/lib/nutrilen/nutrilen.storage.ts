import { SurveyResponse } from "./nutrilen.types";

/**
 * localStorage persistence layer for local/fallback mode.
 * Pattern: SRP — only storage concerns live here.
 */

const KEY = "nutrilen.surveys.v2";
const SEED_KEY = "nutrilen.seeded.v2";

export function loadSurveys(): SurveyResponse[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SurveyResponse[];
  } catch {
    return [];
  }
}

export function saveSurvey(s: SurveyResponse): void {
  if (typeof window === "undefined") return;
  const all = loadSurveys();
  all.push(s);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function clearAllSurveys(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(SEED_KEY);
}

export { KEY as STORAGE_KEY, SEED_KEY };
