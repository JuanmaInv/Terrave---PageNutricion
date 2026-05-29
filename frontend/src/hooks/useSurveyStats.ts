"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { obtenerEstadisticas } from "@/lib/api";
import { type SurveyResponse } from "@/lib/nutrilen";
import { type SurveyFilters } from "./useSurveyFilters";

export interface UseSurveyStatsResult {
  data: SurveyResponse[];
  isLoading: boolean;
  refresh: () => void;
}

/**
 * Fetches and manages survey statistics data.
 * Automatically re-fetches when filters change.
 *
 * Pattern: Observer (filters as observable state — this hook reacts to changes)
 * SOLID:
 *   - SRP: data fetching logic is isolated from UI rendering logic.
 *   - DIP: depends on obtenerEstadisticas abstraction, not on fetch directly.
 */
export function useSurveyStats(filters: SurveyFilters): UseSurveyStatsResult {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [data, setData] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
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
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar estadisticas del backend."
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken, filters]);

  const refresh = useCallback(() => {
    fetchStats().then(() => toast.success("Estadisticas actualizadas")).catch(() => {});
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, isLoading, refresh };
}
