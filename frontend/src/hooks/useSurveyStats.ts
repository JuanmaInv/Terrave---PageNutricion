"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getUserFacingErrorMessage, obtenerEstadisticas } from "@/lib/api";
import { type SurveyResponse } from "@/lib/nutrilen";
import { type SurveyFilters } from "./useSurveyFilters";

export interface UseSurveyStatsResult {
  data: SurveyResponse[];
  isLoading: boolean;
  refresh: () => void;
}

export interface UseSurveyStatsOptions {
  getToken: () => Promise<string | null>;
  isEnabled: boolean;
}

export function useSurveyStats(
  filters: SurveyFilters,
  { getToken, isEnabled }: UseSurveyStatsOptions,
): UseSurveyStatsResult {
  const [data, setData] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!isEnabled) return;

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No se pudo obtener token de administracion.");

      const rows = await obtenerEstadisticas({
        token,
        diet: filters.diet !== "all" ? filters.diet : undefined,
        sex: filters.sex !== "all" ? filters.sex : undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      });

      setData(rows);
    } catch (error) {
      toast.error(getUserFacingErrorMessage(error, "No se pudieron cargar estadisticas del backend."));
    } finally {
      setIsLoading(false);
    }
  }, [filters, getToken, isEnabled]);

  const refresh = useCallback(() => {
    void fetchStats()
      .then(() => {
        toast.success("Estadisticas actualizadas");
      })
      .catch(() => {});
  }, [fetchStats]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchStats();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchStats]);

  return { data, isLoading, refresh };
}
