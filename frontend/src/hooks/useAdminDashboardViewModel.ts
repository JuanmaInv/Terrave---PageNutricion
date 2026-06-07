"use client";

import { useMemo } from "react";
import { type SurveyResponse } from "@/lib/nutrilen";
import type { AdminDashboardViewModel } from "@/components/admin/admin-dashboard.types";
import { buildAdminDashboardViewModel } from "@/lib/dashboard/build-admin-dashboard-view-model";

export function useAdminDashboardViewModel(
  data: SurveyResponse[],
  inProgressCount = 0,
): AdminDashboardViewModel {
  return useMemo(
    () => buildAdminDashboardViewModel(data, inProgressCount),
    [data, inProgressCount],
  );
}
