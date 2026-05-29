"use client";

import { useMemo } from "react";
import {
  ATTRIBUTES,
  DIET_OPTIONS,
  SEX_OPTIONS,
  type AttrKey,
  type SurveyResponse,
} from "@/lib/nutrilen";
import type { AdminDashboardViewModel } from "@/components/admin/admin-dashboard.types";

const ATTRIBUTE_SHORT_LABELS: Record<AttrKey, string> = {
  color: "Color",
  aroma: "Aroma",
  firmeza: "Firmeza",
  untuosidad: "Untuosidad",
  sabor_tostado: "Sabor",
  persistencia: "Persistencia",
};

export function useAdminDashboardViewModel(data: SurveyResponse[]): AdminDashboardViewModel {
  return useMemo(() => {
    const total = data.length;

    const avg = (attr: AttrKey) => {
      if (!data.length) return 0;
      const v = data.reduce((s, d) => s + (d.attrs[attr] ?? 0), 0) / data.length;
      return Math.round(v * 10) / 10;
    };

    const sensorial = ATTRIBUTES.map((a) => ({
      key: a.key,
      metric: a.label,
      metricShort: ATTRIBUTE_SHORT_LABELS[a.key],
      value: avg(a.key),
    }));

    const globalScore = sensorial.length === 0
      ? 0
      : Math.round((sensorial.reduce((s, d) => s + d.value, 0) / sensorial.length) * 10) / 10;

    const likedYes = data.filter((d) => d.liked === "si").length;
    const acceptancePct = total === 0 ? 0 : Math.round((likedYes / total) * 100);

    const dietDist = DIET_OPTIONS.map((d) => {
      const count = data.filter((x) => x.diet === d.id).length;
      return {
        id: d.id,
        name: d.label,
        value: count,
        pct: total ? Math.round((count / total) * 100) : 0,
        color: d.color,
      };
    });

    const sexDist = SEX_OPTIONS.map((s) => {
      const count = data.filter((x) => x.sex === s.id).length;
      return {
        id: s.id,
        name: s.label,
        value: count,
        pct: total ? Math.round((count / total) * 100) : 0,
        color: s.color,
      };
    });

    const hourlyDist = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${String(h).padStart(2, "0")}h`,
      count: 0,
    }));

    data.forEach((r) => {
      const h = new Date(r.date).getHours();
      if (!Number.isNaN(h)) hourlyDist[h].count += 1;
    });

    const peakHour = hourlyDist.reduce(
      (best, cur) => (cur.count > best.count ? cur : best),
      hourlyDist[0],
    );

    const hasHourly = hourlyDist.some((h) => h.count > 0);

    const dietAcceptance = DIET_OPTIONS.map((d) => {
      const group = data.filter((x) => x.diet === d.id);
      const yes = group.filter((x) => x.liked === "si").length;
      return {
        name: d.label,
        value: group.length ? Math.round((yes / group.length) * 100) : 0,
        color: d.color,
        count: group.length,
      };
    }).filter((x) => x.count > 0);

    const sorted = [...sensorial].sort((a, b) => b.value - a.value);
    const bestAttr = sorted[0];
    const worstAttr = sorted[sorted.length - 1];

    const descriptiveCommentsList = data
      .filter((d) => d.descriptiveComments && d.descriptiveComments.trim().length > 0)
      .slice(-12)
      .reverse() as SurveyResponse[];

    const affectiveCommentsList = data
      .filter((d) => d.affectiveComments && d.affectiveComments.trim().length > 0)
      .slice(-12)
      .reverse() as SurveyResponse[];

    return {
      total,
      sensorial,
      globalScore,
      acceptancePct,
      dietDist,
      sexDist,
      hourlyDist,
      peakHour,
      hasHourly,
      dietAcceptance,
      bestAttr,
      worstAttr,
      descriptiveCommentsList,
      affectiveCommentsList,
    };
  }, [data]);
}
