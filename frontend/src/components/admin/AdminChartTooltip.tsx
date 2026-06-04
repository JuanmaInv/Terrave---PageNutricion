"use client";

import type { TooltipProps } from "recharts";

type TooltipPayload = {
  color?: string;
  dataKey?: string;
  name?: string;
  value?: number | string;
  payload?: Record<string, unknown>;
};

interface AdminChartTooltipProps extends TooltipProps<number, string> {
  labelPrefix?: string;
  valueSuffix?: string;
  emptyLabel?: string;
}

export function AdminChartTooltip({
  active,
  label,
  payload,
  labelPrefix,
  valueSuffix = "",
  emptyLabel = "Sin datos",
}: AdminChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const items = payload as TooltipPayload[];

  return (
    <div className="rounded-2xl border border-[color:var(--surface-border)]/55 bg-card px-3 py-2.5 text-xs shadow-[var(--shadow-card)]">
      <p className="font-semibold text-[color:var(--surface-title)]">
        {labelPrefix && label ? `${labelPrefix} ${label}` : label || emptyLabel}
      </p>
      <div className="mt-2 space-y-1.5">
        {items.map((item, index) => (
          <div key={`${item.dataKey ?? "item"}-${item.name ?? "value"}-${index}`} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color ?? "var(--pumpkin)" }}
              />
              {item.name ?? item.dataKey ?? emptyLabel}
            </span>
            <span className="font-semibold text-[color:var(--surface-title)]">
              {item.value ?? emptyLabel}
              {valueSuffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
