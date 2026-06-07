"use client";

import { useEffect, useState } from "react";

type AdminChartPalette = {
  chartText: string;
  chartMuted: string;
  chartGrid: string;
  surfaceTitle: string;
  card: string;
};

const FALLBACK_PALETTE: AdminChartPalette = {
  chartText: "oklch(0.96 0.015 84)",
  chartMuted: "oklch(0.88 0.018 80)",
  chartGrid: "oklch(0.9 0.015 80 / 0.12)",
  surfaceTitle: "oklch(0.96 0.015 84)",
  card: "oklch(0.31 0.026 43)",
};

function readCssVariable(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function useAdminChartPalette(): AdminChartPalette {
  const [palette, setPalette] = useState<AdminChartPalette>(FALLBACK_PALETTE);

  useEffect(() => {
    const syncPalette = () => {
      setPalette({
        chartText: readCssVariable("--chart-text", FALLBACK_PALETTE.chartText),
        chartMuted: readCssVariable("--chart-muted", FALLBACK_PALETTE.chartMuted),
        chartGrid: readCssVariable("--chart-grid", FALLBACK_PALETTE.chartGrid),
        surfaceTitle: readCssVariable("--surface-title", FALLBACK_PALETTE.surfaceTitle),
        card: readCssVariable("--card", FALLBACK_PALETTE.card),
      });
    };

    syncPalette();

    const observer = new MutationObserver(syncPalette);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, []);

  return palette;
}
