"use client";

import { useCallback, useMemo, useState } from "react";
import { type Diet, type Sex } from "@/lib/nutrilen";

export interface SurveyFilters {
  diet: Diet | "all";
  sex: Sex | "all";
  from: string;
  to: string;
}

const DEFAULT_FILTERS: SurveyFilters = {
  diet: "all",
  sex: "all",
  from: "",
  to: "",
};

/**
 * Encapsulates all filter state and operations for the admin dashboard.
 *
 * Pattern: Observer (React state as observable) — any component that calls
 *   this hook automatically re-renders when filters change, without needing
 *   to pass callbacks manually through props.
 *
 * SOLID:
 *   - SRP: filter state management is isolated in this hook.
 *   - OCP: adding a new filter only requires adding a field to SurveyFilters.
 */
export function useSurveyFilters() {
  const [filters, setFilters] = useState<SurveyFilters>(DEFAULT_FILTERS);

  const updateFilter = useCallback(
    <K extends keyof SurveyFilters>(key: K, value: SurveyFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      filters.diet !== "all" ||
      filters.sex !== "all" ||
      filters.from !== "" ||
      filters.to !== "",
    [filters]
  );

  return { filters, updateFilter, clearFilters, hasActiveFilters };
}
