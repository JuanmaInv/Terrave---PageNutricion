import type { AttrKey, SurveyResponse } from "@/lib/nutrilen";

export interface SensorialItem {
  key: AttrKey;
  metric: string;
  metricShort: string;
  value: number;
}

export interface AttrSummary {
  metric: string;
  value: number;
}

export interface DistributionItem {
  id: string;
  name: string;
  value: number;
  pct: number;
  color: string;
}

export interface HourlyPoint {
  hour: number;
  label: string;
  count: number;
}

export interface DietAcceptanceItem {
  name: string;
  value: number;
  color: string;
  count: number;
}

export interface AdminDashboardViewModel {
  total: number;
  completedCount: number;
  inProgressCount: number;
  sensorial: SensorialItem[];
  globalScore: number;
  acceptancePct: number;
  dietDist: DistributionItem[];
  sexDist: DistributionItem[];
  hourlyDist: HourlyPoint[];
  peakHour: HourlyPoint;
  hasHourly: boolean;
  dietAcceptance: DietAcceptanceItem[];
  bestAttr?: AttrSummary;
  worstAttr?: AttrSummary;
  descriptiveCommentsList: SurveyResponse[];
  affectiveCommentsList: SurveyResponse[];
}
