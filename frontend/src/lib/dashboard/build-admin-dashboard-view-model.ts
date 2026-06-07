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

export function buildAdminDashboardViewModel(
  data: SurveyResponse[],
  inProgressCount = 0,
): AdminDashboardViewModel {
  const total = data.length;
  const priceResponses = data
    .map((survey) => {
      const raw = survey.willingnessToPay?.trim() ?? "";
      if (!raw) return null;
      const amount = Number(raw);
      if (!Number.isFinite(amount) || amount <= 0) return null;
      return {
        id: survey.id,
        amount,
        sex: survey.sex,
        diet: survey.diet,
        date: survey.date,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const avg = (attr: AttrKey) => {
    if (!data.length) return 0;
    const value = data.reduce((sum, survey) => sum + (survey.attrs[attr] ?? 0), 0) / data.length;
    return Math.round(value * 10) / 10;
  };

  const sensorial = ATTRIBUTES.map((attribute) => ({
    key: attribute.key,
    metric: attribute.label,
    metricShort: ATTRIBUTE_SHORT_LABELS[attribute.key],
    value: avg(attribute.key),
  }));

  const globalScore = sensorial.length === 0
    ? 0
    : Math.round((sensorial.reduce((sum, item) => sum + item.value, 0) / sensorial.length) * 10) / 10;

  const likedYes = data.filter((survey) => survey.liked === "si").length;
  const acceptancePct = total === 0 ? 0 : Math.round((likedYes / total) * 100);

  const dietDist = DIET_OPTIONS.map((diet) => {
    const count = data.filter((survey) => survey.diet === diet.id).length;
    return {
      id: diet.id,
      name: diet.label,
      value: count,
      pct: total ? Math.round((count / total) * 100) : 0,
      color: diet.color,
    };
  });

  const sexDist = SEX_OPTIONS.map((sex) => {
    const count = data.filter((survey) => survey.sex === sex.id).length;
    return {
      id: sex.id,
      name: sex.label,
      value: count,
      pct: total ? Math.round((count / total) * 100) : 0,
      color: sex.color,
    };
  });

  const hourlyDist = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}h`,
    count: 0,
  }));

  data.forEach((survey) => {
    const hour = new Date(survey.date).getHours();
    if (!Number.isNaN(hour)) {
      hourlyDist[hour].count += 1;
    }
  });

  const peakHour = hourlyDist.reduce(
    (best, current) => (current.count > best.count ? current : best),
    hourlyDist[0],
  );

  const hasHourly = hourlyDist.some((point) => point.count > 0);

  const dietAcceptance = DIET_OPTIONS.map((diet) => {
    const group = data.filter((survey) => survey.diet === diet.id);
    const yesCount = group.filter((survey) => survey.liked === "si").length;
    return {
      name: diet.label,
      value: group.length ? Math.round((yesCount / group.length) * 100) : 0,
      color: diet.color,
      count: group.length,
    };
  }).filter((item) => item.count > 0);

  const sorted = [...sensorial].sort((a, b) => b.value - a.value);
  const bestAttr = sorted[0];
  const worstAttr = sorted[sorted.length - 1];

  const descriptiveCommentsList = data
    .filter((survey) => survey.descriptiveComments && survey.descriptiveComments.trim().length > 0)
    .slice(-12)
    .reverse() as SurveyResponse[];

  const affectiveCommentsList = data
    .filter((survey) => survey.affectiveComments && survey.affectiveComments.trim().length > 0)
    .slice(-12)
    .reverse() as SurveyResponse[];

  const sortedPriceAmounts = [...priceResponses]
    .map((item) => item.amount)
    .sort((a, b) => a - b);
  const priceSummary =
    sortedPriceAmounts.length === 0
      ? undefined
      : {
          responseCount: sortedPriceAmounts.length,
          average:
            Math.round(
              (sortedPriceAmounts.reduce((sum, amount) => sum + amount, 0) /
                sortedPriceAmounts.length) *
                100,
            ) / 100,
          median:
            sortedPriceAmounts.length % 2 === 1
              ? sortedPriceAmounts[(sortedPriceAmounts.length - 1) / 2]
              : Math.round(
                  ((sortedPriceAmounts[sortedPriceAmounts.length / 2 - 1] +
                    sortedPriceAmounts[sortedPriceAmounts.length / 2]) /
                    2) *
                    100,
                ) / 100,
          min: sortedPriceAmounts[0],
          max: sortedPriceAmounts[sortedPriceAmounts.length - 1],
          latestValues: [...priceResponses]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 6),
        };

  return {
    total,
    completedCount: total,
    inProgressCount,
    sensorial,
    globalScore,
    acceptancePct,
    dietDist,
    sexDist,
    hourlyDist,
    peakHour,
    hasHourly,
    dietAcceptance,
    priceSummary,
    bestAttr,
    worstAttr,
    descriptiveCommentsList,
    affectiveCommentsList,
  };
}
