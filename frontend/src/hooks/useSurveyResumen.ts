"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getUserFacingErrorMessage,
  obtenerResumenDashboard,
  type DashboardSummary,
} from "@/lib/api";
import { type SurveyFilters } from "./useSurveyFilters";

const EMPTY_SUMMARY: DashboardSummary = {
  completedCount: 0,
  inProgressCount: 0,
};

export interface UseSurveyResumenResult {
  summary: DashboardSummary;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export interface UseSurveyResumenOptions {
  getToken: () => Promise<string | null>;
  isEnabled: boolean;
}

export function useSurveyResumen(
  filters: SurveyFilters,
  { getToken, isEnabled }: UseSurveyResumenOptions,
): UseSurveyResumenResult {
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!isEnabled) return;

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No se pudo obtener token de administracion.");

      const nextSummary = await obtenerResumenDashboard({
        token,
        diet: filters.diet !== "all" ? filters.diet : undefined,
        sex: filters.sex !== "all" ? filters.sex : undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      });

      setSummary(nextSummary);
    } catch (error) {
      toast.error(getUserFacingErrorMessage(error, "No se pudo cargar el resumen del dashboard."));
    } finally {
      setIsLoading(false);
    }
  }, [filters, getToken, isEnabled]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchSummary();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchSummary]);

  const refresh = useCallback(async () => {
    await fetchSummary();
  }, [fetchSummary]);

  return { summary, isLoading, refresh };
}
